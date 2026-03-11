/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * Application entry point: wires together data upload, chat, and visualization.
 */

import { parseCSV } from "./data-parser.js";
import { addMessage, showLoading, removeLoading } from "./chat.js";
import { requestVisualization, checkHealth } from "./api-client.js";
import { executeChartCode } from "./visualizer.js";

let currentData = null;

const csvUpload = document.getElementById("csv-upload");
const uploadLabel = document.getElementById("upload-label");
const dataStatus = document.getElementById("data-status");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

function enableChat() {
  chatInput.disabled = false;
  sendBtn.disabled = false;
  chatInput.placeholder = "Describe the visualization you want...";
}

function disableChat() {
  chatInput.disabled = true;
  sendBtn.disabled = true;
}

csvUpload.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    currentData = await parseCSV(file);
    uploadLabel.textContent = file.name;
    dataStatus.textContent = `${currentData.rowCount} rows, ${currentData.columns.length} columns`;
    dataStatus.classList.add("loaded");
    enableChat();
    addMessage(
      `Loaded "${file.name}" with ${currentData.rowCount} rows and columns: ${currentData.columns.join(", ")}`,
      "system"
    );
  } catch (err) {
    addMessage(`Failed to parse CSV: ${err.message}`, "error");
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = chatInput.value.trim();
  if (!question || !currentData) return;

  addMessage(question, "user");
  chatInput.value = "";
  disableChat();

  const loadingEl = showLoading();

  try {
    const result = await requestVisualization(
      question,
      currentData.columns,
      currentData.rowCount,
      currentData.sampleRows
    );

    removeLoading(loadingEl);

    if (result.error) {
      addMessage(`Error: ${result.error}`, "error");
      enableChat();
      return;
    }

    const exec = executeChartCode(result.code, currentData.rows);

    if (exec.success) {
      addMessage(`Chart generated using ${result.model}.`, "assistant");
    } else {
      addMessage(`Code execution failed: ${exec.error}`, "error");
    }
  } catch (err) {
    removeLoading(loadingEl);
    addMessage(`Request failed: ${err.message}`, "error");
  }

  enableChat();
  chatInput.focus();
});

async function init() {
  addMessage("Welcome! Upload a CSV file to get started.", "system");

  try {
    const health = await checkHealth();
    if (!health.llm_configured) {
      addMessage(
        "Note: No LLM API key configured. Using fallback demo mode. Set OPENROUTER_API_KEY for full AI generation.",
        "system"
      );
    }
  } catch (_err) {
    addMessage(
      "Backend not reachable. Start it with: python3 server/app.py",
      "system"
    );
  }
}

init();
