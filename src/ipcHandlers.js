const { ipcMain, dialog, shell } = require("electron");
const { processDirectory } = require("./fileProcessor");

function setupIpcHandlers() {
  ipcMain.handle("open-external-link", (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle("select-directory", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    return result.filePaths;
  });

  ipcMain.handle("process-directory", async (event, directory) => {
    return processDirectory(event, directory);
  });

  ipcMain.handle("cancel-process", () => {
    global.isCancelled = true;
  });
}

module.exports = setupIpcHandlers;
