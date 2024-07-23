const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
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
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.on("close", (event) => {
    app.quit();
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC Handler to open the directory selection dialog
ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  return result.filePaths;
});

// IPC Handler to process the selected directory
ipcMain.handle("process-directory", async (event, directory) => {
  let finalMessageArr = [];

  function diveInto(directory) {
    console.log(`Processing ${directory}`);

    let processed = 0;
    let skipped = 0;

    fs.readdirSync(directory).forEach((filename) => {
      const f = path.join(directory, filename);

      if (fs.lstatSync(f).isDirectory()) {
        diveInto(f);
        return;
      }

      if (filename.startsWith("._") || !filename.toLowerCase().endsWith(".wav")) {
        return;
      }

      if (fs.lstatSync(f).isFile()) {
        console.log(f);
        try {
          ffmpeg.ffprobe(f, (err, probeData) => {
            if (err) {
              console.error(`[!!] Error probing ${filename}: ${err.message}`);
              skipped++;
              finalMessageArr.push(`[!!] Error probing ${filename}: ${err.message}`);
              return;
            }

            const audioInfo = probeData.streams[0];
            const codec_name = audioInfo.codec_name;
            const sample_rate = audioInfo.sample_rate.toString();
            console.log(codec_name, sample_rate);

            if (codec_name === "pcm_s16le" && sample_rate === "48000") {
              console.log("Already meets requirement, skipping...");
              skipped++;
              return;
            }

            const tempFile = path.join(os.tmpdir(), filename);
            ffmpeg(f)
              .output(tempFile)
              .audioCodec("pcm_s16le")
              .audioFrequency(48000)
              .on("end", () => {
                try {
                  fs.renameSync(tempFile, f);
                  processed++;
                  finalMessageArr.push(`[+] Processed ${filename}`);
                  if (processed + skipped === fs.readdirSync(directory).length) {
                    finalMessageArr.push(`${directory} - files processed: ${processed}, skipped: ${skipped}`);
                  }
                } catch (renameErr) {
                  console.error(`[!!] Error renaming ${tempFile} to ${f}: ${renameErr.message}`);
                  finalMessageArr.push(`[!!] Error renaming ${tempFile} to ${f}: ${renameErr.message}`);
                  skipped++;
                }
              })
              .on("error", (convertErr) => {
                console.error(`[!!] Error converting ${filename}: ${convertErr.message}`);
                finalMessageArr.push(`[!!] Error converting ${filename}: ${convertErr.message}`);
                skipped++;
                if (processed + skipped === fs.readdirSync(directory).length) {
                  finalMessageArr.push(`${directory} - files processed: ${processed}, skipped: ${skipped}`);
                }
              })
              .run();
          });
        } catch (e) {
          console.error(`[!!] Some exception occurred while processing ${filename}: ${e.message}`);
          finalMessageArr.push(`[!!] Some exception occurred while processing ${filename}: ${e.message}`);
          skipped++;
        }
      }
    });
  }

  diveInto(directory);

  // Wait for all processing to complete before sending final messages
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(finalMessageArr);
    }, 3000); // Adjust timing as needed
  });
});
