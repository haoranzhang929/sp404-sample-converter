const selectDirButton = document.getElementById("select-dir");
const startProcessButton = document.getElementById("start-process");
const cancelButton = document.getElementById("cancel-process");
const outputDiv = document.getElementById("output");
const showHelpButton = document.getElementById("show-help");
const helpModal = document.getElementById("help-modal");
const closeHelpButton = document.getElementById("close-help");
const warningMessage = document.getElementById("warning-message");
const closeWarningButton = document.getElementById("close-warning");
const dropZone = document.getElementById("drop-zone");

let selectedDirectory = "";
let progressBar;

function createProgressBar() {
  progressBar = document.createElement("div");
  progressBar.className = "w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700";
  progressBar.innerHTML = '<div class="bg-blue-600 h-2.5 rounded-full" style="width: 0%"></div>';
  outputDiv.appendChild(progressBar);
}

function updateProgressBar(current, total) {
  const percentage = (current / total) * 100;
  progressBar.querySelector("div").style.width = `${percentage}%`;
}

function updateOutput(message, type = "info") {
  outputDiv.classList.remove("bg-green-100", "bg-red-100", "bg-yellow-100", "bg-blue-100");
  outputDiv.classList.remove("text-green-800", "text-red-800", "text-yellow-800", "text-blue-800");
  outputDiv.innerHTML = "";

  let bgColor, textColor;
  switch (type) {
    case "success":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case "error":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    case "warning":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      break;
    default:
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      break;
  }

  outputDiv.classList.add(bgColor, textColor, "p-4", "rounded-lg", "shadow-lg", "flex", "items-center");
  outputDiv.innerHTML = `<span>${message}</span>`;
}

selectDirButton.addEventListener("click", async () => {
  try {
    const directories = await window.electron.selectDirectory();
    if (directories.length > 0) {
      selectedDirectory = directories[0];
      updateOutput(`Selected directory: ${selectedDirectory}. Now click "Start Processing" to begin.`, "info");
    } else {
      updateOutput("No directory selected. Please select a directory first.", "warning");
    }
  } catch (error) {
    updateOutput(`Error selecting directory: ${error.message}`, "error");
  }
});

startProcessButton.addEventListener("click", async () => {
  if (!selectedDirectory) {
    updateOutput("Please select a directory before starting the process.", "warning");
    return;
  }

  updateOutput("Processing started. Please wait while we process your files...", "info");
  createProgressBar();
  cancelButton.classList.remove("hidden");

  try {
    const result = await window.electron.processDirectory(selectedDirectory);
    updateOutput(result.join("<br>"), "success");
  } catch (error) {
    updateOutput(`Error processing directory: ${error.message}`, "error");
  } finally {
    cancelButton.classList.add("hidden");
    if (progressBar) {
      progressBar.remove();
    }
  }
});

cancelButton.addEventListener("click", async () => {
  await window.electron.cancelProcess();
  updateOutput("Processing cancelled.", "warning");
  cancelButton.classList.add("hidden");
  if (progressBar) {
    progressBar.remove();
  }
});

showHelpButton.addEventListener("click", () => {
  helpModal.style.display = "flex";
});

closeHelpButton.addEventListener("click", () => {
  helpModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === helpModal) {
    helpModal.style.display = "none";
  }
});

function showWarningMessage() {
  warningMessage.classList.add("show");
}

function hideWarningMessage() {
  warningMessage.classList.remove("show");
}

hideWarningMessage();
showWarningMessage();

closeWarningButton.addEventListener("click", () => {
  hideWarningMessage();
});

helpModal.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    event.preventDefault();
    window.electron.openExternalLink(event.target.href);
  }
});

window.electron.onProgressUpdate((_event, { current, total }) => {
  updateProgressBar(current, total);
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add("border-blue-500", "text-blue-500");
});

dropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove("border-blue-500", "text-blue-500");
});

dropZone.addEventListener("drop", async (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove("border-blue-500", "text-blue-500");

  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type === "") {
    // Directory
    selectedDirectory = files[0].path;
    updateOutput(`Selected directory: ${selectedDirectory}. Now click "Start Processing" to begin.`, "info");
  } else {
    updateOutput("Please drop a directory, not a file.", "warning");
  }
});
