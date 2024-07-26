const { BrowserWindow } = require("electron");
const path = require("path");

class WindowManager {
  static createMainWindow() {
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

  static getAllWindows() {
    return BrowserWindow.getAllWindows();
  }
}

module.exports = WindowManager;
