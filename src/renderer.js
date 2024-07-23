const { ipcRenderer } = require("electron");

document.getElementById("select-dir").addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("select-directory");
  if (result.length > 0) {
    const directory = result[0];
    document.getElementById("output").innerText = `Selected Directory: ${directory}`;
    document.getElementById("output").classList.remove("alert-info");
    document.getElementById("output").classList.add("alert-warning");
    document.getElementById("start-process").dataset.directory = directory;
  }
});

document.getElementById("start-process").addEventListener("click", async () => {
  const directory = document.getElementById("start-process").dataset.directory;
  if (directory) {
    const confirm = window.confirm("Samples which are not 16bit, 48khz will be overwritten. Continue?");
    if (confirm) {
      document.getElementById("output").innerText = "Processing...";
      document.getElementById("output").classList.remove("alert-warning");
      document.getElementById("output").classList.add("alert-info");
      const messages = await ipcRenderer.invoke("process-directory", directory);
      document.getElementById("output").innerHTML = "";
      messages.forEach((msg) => {
        const div = document.createElement("div");
        div.innerText = msg;
        document.getElementById("output").appendChild(div);
      });
      document.getElementById("output").appendChild(document.createTextNode("Done!"));
      document.getElementById("output").classList.remove("alert-info");
      document.getElementById("output").classList.add("alert-success");
    }
  } else {
    alert("Please select a directory first.");
  }
});
