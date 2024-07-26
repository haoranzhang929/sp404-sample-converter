const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const { app } = require("electron");

function getFFmpegPath() {
  if (!app.isPackaged) {
    return require("ffmpeg-static");
  }
  return path.join(process.resourcesPath, "ffmpeg");
}

function getFFprobePath() {
  if (!app.isPackaged) {
    return require("ffprobe-static").path;
  }
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "darwin") {
    return path.join(process.resourcesPath, "ffprobe", "darwin", arch, "ffprobe");
  } else if (platform === "win32") {
    return path.join(process.resourcesPath, "ffprobe", "win32", arch, "ffprobe.exe");
  } else if (platform === "linux") {
    return path.join(process.resourcesPath, "ffprobe", "linux", arch, "ffprobe");
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

function setupFFmpeg() {
  console.log("FFmpeg path:", getFFmpegPath());
  console.log("FFprobe path:", getFFprobePath());

  ffmpeg.setFfmpegPath(getFFmpegPath());
  ffmpeg.setFfprobePath(getFFprobePath());
}

module.exports = { setupFFmpeg };
