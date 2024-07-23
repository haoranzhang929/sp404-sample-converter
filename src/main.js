const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const ffmpeg = require("fluent-ffmpeg");
const os = require("os");
const pathToFfmpeg = require("ffmpeg-static");
const pathToFfprobe = require("ffprobe-static").path;

// Set the paths to ffmpeg and ffprobe
ffmpeg.setFfmpegPath(pathToFfmpeg);
ffmpeg.setFfprobePath(pathToFfprobe);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle external link opening
ipcMain.handle("open-external-link", (event, url) => {
  shell.openExternal(url);
});

// IPC Handler to open the directory selection dialog
ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  return result.filePaths;
});

// Helper function to process files
async function processFile(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, probeData) => {
      if (err) {
        return reject(`[!!] Error probing ${path.basename(filePath)}: ${err.message}`);
      }

      const audioInfo = probeData.streams[0];
      const codec_name = audioInfo.codec_name;
      const sample_rate = audioInfo.sample_rate.toString();

      if (codec_name === "pcm_s16le" && sample_rate === "48000") {
        return resolve(`[+] ${path.basename(filePath)} already meets the requirements`);
      }

      const tempFile = path.join(os.tmpdir(), path.basename(filePath));

      ffmpeg(filePath)
        .output(tempFile)
        .audioCodec("pcm_s16le")
        .audioFrequency(48000)
        .on("end", () => {
          fs.rename(tempFile, filePath)
            .then(() => resolve(`[+] Processed ${path.basename(filePath)}`))
            .catch((renameErr) => reject(`[!!] Error renaming ${tempFile} to ${filePath}: ${renameErr.message}`));
        })
        .on("error", (convertErr) => reject(`[!!] Error converting ${path.basename(filePath)}: ${convertErr.message}`))
        .run();
    });
  });
}

// IPC Handler to process the selected directory
ipcMain.handle("process-directory", async (event, directory) => {
  let finalMessageArr = [];

  async function diveInto(dir) {
    const files = await fs.readdir(dir);
    const tasks = files.map(async (filename) => {
      const filePath = path.join(dir, filename);

      if ((await fs.stat(filePath)).isDirectory()) {
        return diveInto(filePath);
      }

      if (filename.startsWith("._") || !filename.toLowerCase().endsWith(".wav")) {
        return; // Skip non-WAV files and Mac system files
      }

      try {
        const message = await processFile(filePath);
        finalMessageArr.push(message);
      } catch (error) {
        finalMessageArr.push(error);
      }
    });

    await Promise.all(tasks);
  }

  try {
    await diveInto(directory);
  } catch (error) {
    finalMessageArr.push(`[!!] Error processing directory: ${error.message}`);
  }

  finalMessageArr.push(`${directory} - Processing complete`);
  return finalMessageArr;
});
