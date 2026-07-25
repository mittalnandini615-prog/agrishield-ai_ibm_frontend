// Target URL deployed on Render
const BASE_URL = "https://agrishield-ai-ibm.onrender.com";

// DOM Elements
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const previewImg = document.getElementById("preview-img");
const uploadPlaceholder = document.getElementById("upload-placeholder");
const submitBtn = document.getElementById("submit-btn");
const analyzeForm = document.getElementById("analyze-form");
const errorMessage = document.getElementById("error-message");

const emptyState = document.getElementById("empty-state");
const resultsContainer = document.getElementById("results-container");
const badge = document.getElementById("badge");
const metricCrop = document.getElementById("metric-crop");
const metricDensity = document.getElementById("metric-density");
const infoDisease = document.getElementById("info-disease");
const infoTreatment = document.getElementById("info-treatment");
const audioBtn = document.getElementById("audio-btn");

let currentFile = null;
let currentTreatmentText = "";
let currentAudio = null;

// File Upload Trigger
dropzone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    handleFileSelect(file);
  }
});

function handleFileSelect(file) {
  currentFile = file;
  previewImg.src = URL.createObjectURL(file);
  previewImg.classList.remove("hidden");
  uploadPlaceholder.classList.add("hidden");
  submitBtn.disabled = false;
  hideError();
}

// Form Submission
analyzeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentFile) return;

  const cropType = document.getElementById("crop-type").value;
  const formData = new FormData();
  formData.append("crop_type", cropType);
  formData.append("file", currentFile);

  setLoading(true);
  hideError();

  try {
    const response = await fetch(`${BASE_URL}/api/analyze-leaf`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    renderResults(data);
  } catch (err) {
    showError("Failed to analyze image. " + (err.message || "Please check server status."));
  } finally {
    setLoading(false);
  }
});

// Render Backend Response
function renderResults(data) {
  currentTreatmentText = data.treatment_recommendation;

  // Set Badges
  badge.className = "badge";
  if (data.severity_grading.includes("High")) {
    badge.classList.add("badge-high");
  } else if (data.severity_grading.includes("Moderate")) {
    badge.classList.add("badge-moderate");
  } else {
    badge.classList.add("badge-low");
  }
  badge.textContent = data.severity_grading;

  // Set Content
  metricCrop.textContent = data.crop_type.toUpperCase();
  metricDensity.textContent = `${data.lesion_density_percentage}%`;
  infoDisease.textContent = data.detected_disease;
  infoTreatment.textContent = data.treatment_recommendation;

  // Show Section
  emptyState.classList.add("hidden");
  resultsContainer.classList.remove("hidden");
}

// Audio Playback Handler
audioBtn.addEventListener("click", async () => {
  if (!currentTreatmentText) return;

  if (currentAudio) {
    currentAudio.pause();
  }

  const queryParams = new URLSearchParams({
    text: currentTreatmentText,
    lang: "en",
  });

  const audioUrl = `${BASE_URL}/api/audio-treatment?${queryParams.toString()}`;
  currentAudio = new Audio(audioUrl);

  audioBtn.disabled = true;
  audioBtn.textContent = "⏳ Loading Audio...";

  currentAudio.onplay = () => {
    audioBtn.textContent = "🔊 Playing Audio...";
  };

  currentAudio.onended = () => {
    audioBtn.disabled = false;
    audioBtn.textContent = "🔊 Listen to Recommendation";
  };

  currentAudio.onerror = () => {
    showError("Could not stream audio from server.");
    audioBtn.disabled = false;
    audioBtn.textContent = "🔊 Listen to Recommendation";
  };

  try {
    await currentAudio.play();
  } catch (e) {
    showError("Audio playback was blocked or failed.");
    audioBtn.disabled = false;
    audioBtn.textContent = "🔊 Listen to Recommendation";
  }
});

// UI Helpers
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Analyzing (Waking Up Server...)" : "Analyze Leaf Health";
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove("hidden");
}

function hideError() {
  errorMessage.classList.add("hidden");
}
