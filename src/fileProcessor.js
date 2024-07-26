const path = require("path");
const fs = require("fs").promises;
const ffmpeg = require("fluent-ffmpeg");
const os = require("os");
const fse = require("fs-extra");

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

    await fse.move(tempFile, filePath, { overwrite: true });

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

async function processDirectory(event, directory) {
  let finalMessageArr = [];
  let totalFiles = 0;
  let processedFiles = 0;
  global.isCancelled = false;

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

  async function isPathAccessible(path) {
    try {
      await fs.access(path, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  async function diveInto(dir) {
    try {
      if (!(await isPathAccessible(dir))) {
        finalMessageArr.push(`[!!] Cannot access directory: ${dir}`);
        return;
      }

      const files = await fs.readdir(dir);
      const tasks = files.map(async (filename) => {
        if (global.isCancelled) return;

        const filePath = path.join(dir, filename);

        if (!(await isPathAccessible(filePath))) {
          finalMessageArr.push(`[!!] Cannot access file: ${filePath}`);
          return;
        }

        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
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
          finalMessageArr.push(`[!!] Error processing ${filePath}: ${error.message}`);
        }
      });

      await Promise.all(tasks);
    } catch (error) {
      finalMessageArr.push(`[!!] Error reading directory ${dir}: ${error.message}`);
    }
  }

  try {
    await diveInto(directory);
  } catch (error) {
    finalMessageArr.push(`[!!] Error processing directory: ${error.message}`);
  }

  finalMessageArr.push(`${directory} - Processing complete`);
  return finalMessageArr;
}

module.exports = { processFile, processDirectory };
