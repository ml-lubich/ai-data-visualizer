/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * Application entry point: wires together data upload, chat, and visualization.
 */

import { parseCSV, parseCSVString } from "./data-parser.js";
import { addMessage, showLoading, removeLoading, updateLoadingText } from "./chat.js";
import { requestVisualization, checkHealth } from "./api-client.js";
import { executeChartCode } from "./visualizer.js";
import { CANONICAL_EXAMPLES } from "./examples/canonical-examples.js";

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

  const loadingEl = showLoading("Generating visualization...");
  const MAX_ATTEMPTS = 3;

  try {
    let result;
    let attempt = 0;
    let lastCode = null;
    let lastError = null;

    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      result = await requestVisualization(
        question,
        currentData.columns,
        currentData.rowCount,
        currentData.sampleRows,
        lastCode != null ? { previousCode: lastCode, previousError: lastError } : {}
      );

      if (result.error) {
        addMessage(`Error: ${result.error}`, "error");
        break;
      }

      const exec = executeChartCode(result.code, currentData.rows);

      if (exec.success) {
        addMessage(`Chart generated using ${result.model}.`, "assistant");
        break;
      }

      lastCode = result.code;
      lastError = exec.error;
      if (attempt < MAX_ATTEMPTS) {
        updateLoadingText(loadingEl, `Retrying (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`);
        addMessage(`Fixing that...`, "system");
      } else {
        addMessage(`Couldn't generate that chart. Showing a fallback instead.`, "system");
        const fallback = CANONICAL_EXAMPLES[0];
        const fallbackExec = executeChartCode(fallback.code, currentData.rows);
        if (fallbackExec.success) {
          addMessage(`Here's a bar chart of revenue by region as a fallback.`, "assistant");
        } else {
          addMessage(`Code execution failed: ${exec.error}`, "error");
        }
      }
    }

    removeLoading(loadingEl);
  } catch (err) {
    removeLoading(loadingEl);
    addMessage(`Request failed: ${err.message}`, "error");
  }

  enableChat();
  chatInput.focus();
});

async function init() {
  addMessage("Welcome! Loading sample data for the demo...", "system");

  try {
    const csvRes = await fetch("/sample_data/sales.csv");
    if (csvRes.ok) {
      const csvText = await csvRes.text();
      currentData = parseCSVString(csvText);
      uploadLabel.textContent = "sales.csv (sample)";
      dataStatus.textContent = `${currentData.rowCount} rows, ${currentData.columns.length} columns`;
      dataStatus.classList.add("loaded");
      enableChat();
      addMessage("Sample data loaded. Try: \"Show me a bar chart of revenue by region\"", "system");
    } else {
      addMessage("Upload a CSV file to get started.", "system");
    }
  } catch (_e) {
    addMessage("Upload a CSV file to get started.", "system");
  }

  try {
    const health = await checkHealth();
    const providers = [];
    if (health.openrouter_configured) providers.push("OpenRouter (" + health.openrouter_model + ")");
    if (health.ollama_available) providers.push("Ollama (" + health.ollama_model + ")");

    if (providers.length > 0) {
      addMessage("LLM ready: " + providers.join(" | "), "system");
    } else {
      addMessage("No LLM available. Set OPENROUTER_API_KEY or start Ollama.", "system");
    }
  } catch (_err) {
    addMessage(
      "Backend not reachable. Start it with: python3 server/app.py",
      "system"
    );
  }
}

init();
