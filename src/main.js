const { app } = require("electron");
const WindowManager = require("./windowManager");
const setupIpcHandlers = require("./ipcHandlers");
const { setupFFmpeg } = require("./ffmpegConfig");

setupFFmpeg();

function createWindow() {
  WindowManager.createMainWindow();
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (WindowManager.getAllWindows().length === 0) {
    createWindow();
  }
});
