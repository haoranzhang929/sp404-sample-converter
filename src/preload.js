const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  processDirectory: (directory) => ipcRenderer.invoke("process-directory", directory)
});
