const { ipcRenderer, shell } = require("electron");

const selectDirButton = document.getElementById("select-dir");
const startProcessButton = document.getElementById("start-process");
const outputDiv = document.getElementById("output");
const showHelpButton = document.getElementById("show-help");
const helpModal = document.getElementById("help-modal");
const closeHelpButton = document.getElementById("close-help");
const warningMessage = document.getElementById("warning-message");
const closeWarningButton = document.getElementById("close-warning");

let selectedDirectory = "";

// Function to update the output div with a message
function updateOutput(message, type = "info") {
  // Remove existing classes
  outputDiv.classList.remove("bg-green-100", "bg-red-100", "bg-yellow-100", "bg-blue-100");
  outputDiv.classList.remove("text-green-800", "text-red-800", "text-yellow-800", "text-blue-800");
  outputDiv.innerHTML = ""; // Clear previous content

  // Add classes and content based on message type
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
  outputDiv.innerHTML = `
    <span>${message}</span>
  `;
}

selectDirButton.addEventListener("click", async () => {
  try {
    const directories = await ipcRenderer.invoke("select-directory");
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

  try {
    const result = await ipcRenderer.invoke("process-directory", selectedDirectory);
    updateOutput(result.join("<br>"), "success");
  } catch (error) {
    updateOutput(`Error processing directory: ${error.message}`, "error");
  }
});

showHelpButton.addEventListener("click", () => {
  helpModal.style.display = "flex";
});

closeHelpButton.addEventListener("click", () => {
  helpModal.style.display = "none";
});

// Close the modal if the user clicks outside of it
window.addEventListener("click", (event) => {
  if (event.target === helpModal) {
    helpModal.style.display = "none";
  }
});

// Show the warning message
function showWarningMessage() {
  warningMessage.classList.add("show");
}

// Hide the warning message
function hideWarningMessage() {
  warningMessage.classList.remove("show");
}

// Initial hide the warning message
hideWarningMessage();

// Example of showing the warning message
showWarningMessage();

// Event listener to hide warning message
closeWarningButton.addEventListener("click", () => {
  hideWarningMessage();
});

// Handle link clicks in the help modal
helpModal.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    event.preventDefault(); // Prevent default link behavior
    shell.openExternal(event.target.href); // Open link in external browser
  }
});
