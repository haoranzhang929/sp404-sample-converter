const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const { app } = require("electron");
const fs = require("fs").promises;

async function getFFmpegPath() {
  if (!app.isPackaged) {
    return require("ffmpeg-static");
  }

  const platform = process.platform;
  const ffmpegName = platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const ffmpegPath = path.join(process.resourcesPath, ffmpegName);

  try {
    await fs.access(ffmpegPath, fs.constants.F_OK);
    console.log(`FFmpeg found at: ${ffmpegPath}`);
    return ffmpegPath;
  } catch (error) {
    console.error(`FFmpeg not found at: ${ffmpegPath}`);
    throw new Error(`FFmpeg not found: ${error.message}`);
  }
}

async function getFFprobePath() {
  if (!app.isPackaged) {
    return require("ffprobe-static").path;
  }

  const platform = process.platform;
  const arch = process.arch;
  const ffprobeName = platform === "win32" ? "ffprobe.exe" : "ffprobe";
  const ffprobePath = path.join(process.resourcesPath, "ffprobe", platform, arch, ffprobeName);

  try {
    await fs.access(ffprobePath, fs.constants.F_OK);
    console.log(`FFprobe found at: ${ffprobePath}`);
    return ffprobePath;
  } catch (error) {
    console.error(`FFprobe not found at: ${ffprobePath}`);
    throw new Error(`FFprobe not found: ${error.message}`);
  }
}

async function setupFFmpeg() {
  try {
    const ffmpegPath = await getFFmpegPath();
    const ffprobePath = await getFFprobePath();

    console.log("Resources path:", process.resourcesPath);
    console.log("FFmpeg path:", ffmpegPath);
    console.log("FFprobe path:", ffprobePath);

    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);

    console.log("FFmpeg and FFprobe setup completed successfully");
  } catch (error) {
    console.error("Error setting up FFmpeg:", error);
  }
}

module.exports = { setupFFmpeg };
