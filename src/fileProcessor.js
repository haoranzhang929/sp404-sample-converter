const path = require("path");
const fs = require("fs").promises;
const ffmpeg = require("fluent-ffmpeg");
const os = require("os");
const fse = require("fs-extra");
const crypto = require("crypto");

async function processFile(filePath) {
  const tempFileName = `temp_${crypto.randomBytes(16).toString("hex")}.wav`;
  const tempFile = path.join(os.tmpdir(), tempFileName);
  let finalMessage = "";

  try {
    console.log(`Processing file: ${filePath}`);

    const probeData = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    const audioInfo = probeData.streams.find(stream => stream.codec_type === 'audio');
    if (!audioInfo) {
      throw new Error("No audio stream found");
    }

    const codec_name = audioInfo.codec_name;
    const sample_rate = audioInfo.sample_rate.toString();

    if (codec_name === "pcm_s16le" && sample_rate === "48000") {
      finalMessage = `[+] ${path.basename(filePath)} already meets the requirements`;
      return finalMessage;
    }

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .inputOptions(["-y"])
        .outputOptions(["-c:a pcm_s16le", "-ar 48000", "-f wav"])
        .output(tempFile)
        .on("start", (commandLine) => {
          console.log("Spawned FFmpeg with command: " + commandLine);
        })
        .on("end", () => resolve())
        .on("error", (err, stdout, stderr) => {
          console.error("FFmpeg stderr:", stderr);
          reject(new Error(`FFmpeg error: ${err.message}`));
        })
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
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await countFiles(filePath);
      } else if (file.toLowerCase().endsWith(".wav") && !file.startsWith("._")) {
        totalFiles++;
      }
    }
  }

  await countFiles(directory);

  async function isPathAccessible(path) {
    try {
      await fs.access(path, fs.constants.R_OK | fs.constants.W_OK);
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
      for (const filename of files) {
        if (global.isCancelled) break;

        const filePath = path.join(dir, filename);

        if (!(await isPathAccessible(filePath))) {
          finalMessageArr.push(`[!!] Cannot access file: ${filePath}`);
          continue;
        }

        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          await diveInto(filePath);
          continue;
        }

        if (filename.startsWith("._") || !filename.toLowerCase().endsWith(".wav")) {
          continue;
        }

        try {
          const message = await processFile(filePath);
          finalMessageArr.push(message);
          processedFiles++;
          event.sender.send("progress-update", { current: processedFiles, total: totalFiles });
        } catch (error) {
          finalMessageArr.push(`[!!] Error processing ${filePath}: ${error.message}`);
        }
      }
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
