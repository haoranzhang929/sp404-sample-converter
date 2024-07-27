const { app, dialog } = require("electron");
const { WindowManager } = require("./windowManager");
const { setupIpcHandlers } = require("./ipcHandlers");
const { setupFFmpeg } = require("./ffmpegConfig");

async function initializeApp() {
  try {
    await setupFFmpeg();
    createWindow();
    setupIpcHandlers();
  } catch (error) {
    handleFFmpegSetupError(error);
  }
}

function createWindow() {
  WindowManager.createMainWindow();
}

function handleFFmpegSetupError(error) {
  console.error("Failed to setup FFmpeg:", error);
  dialog.showErrorBox(
    "FFmpeg Setup Error",
    `Failed to setup FFmpeg. The application may not function correctly.\n\nError details: ${error.message}`
  );
}

app.whenReady().then(initializeApp);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (WindowManager.getAllWindows().length === 0) {
    createWindow();
  }
});
