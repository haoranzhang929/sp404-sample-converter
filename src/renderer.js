// DOM Elements
const elements = {
  selectDirButton: document.getElementById("select-dir"),
  startProcessButton: document.getElementById("start-process"),
  cancelButton: document.getElementById("cancel-process"),
  outputDiv: document.getElementById("output"),
  showHelpButton: document.getElementById("show-help"),
  helpModal: document.getElementById("help-modal"),
  closeHelpButton: document.getElementById("close-help"),
  warningMessage: document.getElementById("warning-message"),
  closeWarningButton: document.getElementById("close-warning"),
  dropZone: document.getElementById("drop-zone")
};

let selectedDirectory = "";
let progressBar;

// Utility Functions
function createProgressBar() {
  progressBar = document.createElement("div");
  progressBar.className = "w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700";
  progressBar.innerHTML = '<div class="bg-blue-600 h-2.5 rounded-full" style="width: 0%"></div>';
  elements.outputDiv.appendChild(progressBar);
}

function updateProgressBar(current, total) {
  const percentage = (current / total) * 100;
  progressBar.querySelector("div").style.width = `${percentage}%`;
}

function updateOutput(message, type = "info") {
  elements.outputDiv.classList.remove("bg-green-100", "bg-red-100", "bg-yellow-100", "bg-blue-100");
  elements.outputDiv.classList.remove("text-green-800", "text-red-800", "text-yellow-800", "text-blue-800");
  elements.outputDiv.innerHTML = "";

  const styles = {
    success: ["bg-green-100", "text-green-800"],
    error: ["bg-red-100", "text-red-800"],
    warning: ["bg-yellow-100", "text-yellow-800"],
    info: ["bg-blue-100", "text-blue-800"]
  };

  const [bgColor, textColor] = styles[type] || styles.info;

  elements.outputDiv.classList.add(bgColor, textColor, "p-4", "rounded-lg", "shadow-lg", "flex", "items-center");
  elements.outputDiv.innerHTML = `<span>${message}</span>`;
}

function showWarningMessage() {
  elements.warningMessage.classList.add("show");
}

function hideWarningMessage() {
  elements.warningMessage.classList.remove("show");
}

// Main Functionality
async function selectDirectory() {
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
}

async function startProcessing() {
  if (!selectedDirectory) {
    updateOutput("Please select a directory before starting the process.", "warning");
    return;
  }

  updateOutput("Processing started. Please wait while we process your files...", "info");
  createProgressBar();
  elements.cancelButton.classList.remove("hidden");

  try {
    const result = await window.electron.processDirectory(selectedDirectory);
    updateOutput(result.join("<br>"), "success");
  } catch (error) {
    updateOutput(`Error processing directory: ${error.message}`, "error");
  } finally {
    elements.cancelButton.classList.add("hidden");
    if (progressBar) {
      progressBar.remove();
    }
  }
}

async function cancelProcessing() {
  await window.electron.cancelProcess();
  updateOutput("Processing cancelled.", "warning");
  elements.cancelButton.classList.add("hidden");
  if (progressBar) {
    progressBar.remove();
  }
}

// Event Listeners
function setupEventListeners() {
  elements.selectDirButton.addEventListener("click", selectDirectory);
  elements.startProcessButton.addEventListener("click", startProcessing);
  elements.cancelButton.addEventListener("click", cancelProcessing);
  elements.showHelpButton.addEventListener("click", () => (elements.helpModal.style.display = "flex"));
  elements.closeHelpButton.addEventListener("click", () => (elements.helpModal.style.display = "none"));
  elements.closeWarningButton.addEventListener("click", hideWarningMessage);

  window.addEventListener("click", (event) => {
    if (event.target === elements.helpModal) {
      elements.helpModal.style.display = "none";
    }
  });

  elements.helpModal.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      event.preventDefault();
      window.electron.openExternalLink(event.target.href);
    }
  });

  setupDropZone();
}

function setupDropZone() {
  elements.dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.add("border-blue-500", "text-blue-500");
  });

  elements.dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove("border-blue-500", "text-blue-500");
  });

  elements.dropZone.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove("border-blue-500", "text-blue-500");

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "") {
      selectedDirectory = files[0].path;
      updateOutput(`Selected directory: ${selectedDirectory}. Now click "Start Processing" to begin.`, "info");
    } else {
      updateOutput("Please drop a directory, not a file.", "warning");
    }
  });
}

// Initialize
function init() {
  setupEventListeners();
  hideWarningMessage();
  showWarningMessage();

  window.electron.onProgressUpdate((_event, { current, total }) => {
    updateProgressBar(current, total);
  });
}

init();
