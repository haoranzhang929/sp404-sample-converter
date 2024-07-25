const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const ffmpeg = require("fluent-ffmpeg");
const os = require("os");

// Set the paths to ffmpeg and ffprobe
ffmpeg.setFfmpegPath(`/Applications/sp404-sample-converter.app/Contents/Resources/ffmpeg`);
ffmpeg.setFfprobePath(`/Applications/sp404-sample-converter.app/Contents/Resources/ffprobe/darwin/arm64/ffprobe`);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(createWindow);

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
  const tempFile = path.join(os.tmpdir(), path.basename(filePath));
  let finalMessage = "";

  try {
    console.log(`Processing file: ${filePath}`);

    const probeData = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    const audioInfo = probeData.streams[0];
    const codec_name = audioInfo.codec_name;
    const sample_rate = audioInfo.sample_rate.toString();

    if (codec_name === "pcm_s16le" && sample_rate === "48000") {
      finalMessage = `[+] ${path.basename(filePath)} already meets the requirements`;
      return finalMessage;
    }

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .output(tempFile)
        .audioCodec("pcm_s16le")
        .audioFrequency(48000)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    await fs.rename(tempFile, filePath);
    finalMessage = `[+] Processed ${path.basename(filePath)}`;
  } catch (error) {
    finalMessage = `[!!] Error processing ${path.basename(filePath)}: ${error.message}`;
  } finally {
    try {
      await fs.access(tempFile);
      await fs.unlink(tempFile);
    } catch (cleanupErr) {
      if (cleanupErr.code !== "ENOENT") {
        console.error(`[!!] Error deleting temporary file ${tempFile}: ${cleanupErr.message}`);
      }
    }
  }

  return finalMessage;
}

let isCancelled = false;

ipcMain.handle("cancel-process", () => {
  isCancelled = true;
});

// IPC Handler to process the selected directory
ipcMain.handle("process-directory", async (event, directory) => {
  let finalMessageArr = [];
  let totalFiles = 0;
  let processedFiles = 0;
  isCancelled = false;

  async function countFiles(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if ((await fs.stat(filePath)).isDirectory()) {
        await countFiles(filePath);
      } else if (file.toLowerCase().endsWith(".wav") && !file.startsWith("._")) {
        totalFiles++;
      }
    }
  }

  await countFiles(directory);

  async function diveInto(dir) {
    try {
      const files = await fs.readdir(dir);
      const tasks = files.map(async (filename) => {
        if (isCancelled) return;

        const filePath = path.join(dir, filename);

        if ((await fs.stat(filePath)).isDirectory()) {
          return diveInto(filePath);
        }

        if (filename.startsWith("._") || !filename.toLowerCase().endsWith(".wav")) {
          return;
        }

        try {
          const message = await processFile(filePath);
          finalMessageArr.push(message);
          processedFiles++;
          event.sender.send("progress-update", { current: processedFiles, total: totalFiles });
        } catch (error) {
          finalMessageArr.push(error);
        }
      });

      await Promise.all(tasks);
    } catch (error) {
      finalMessageArr.push(`[!!] Error reading directory: ${error.message}`);
    }
  }

  try {
    await diveInto(directory);
  } catch (error) {
    finalMessageArr.push(`[!!] Error processing directory: ${error.message}`);
  }

  finalMessageArr.push(`${directory} - Processing complete`);
  return finalMessageArr;
});
