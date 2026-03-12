/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * Application entry point: multi-shot LLM pipeline.
 * Generate -> validate (backend) -> execute -> retry on runtime error.
 */

import { parseCSV } from "./data-parser.js";
import { addMessage, showLoading, removeLoading } from "./chat.js";
import { requestVisualization, requestRetry, checkHealth } from "./api-client.js";
import { executeChartCode } from "./visualizer.js";

const MAX_RUNTIME_RETRIES = 2;

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

    const attemptsNote = result.attempts > 1
      ? ` (${result.attempts} attempts, auto-fixed syntax)`
      : "";

    let exec = executeChartCode(result.code, currentData.rows);

    if (exec.success) {
      addMessage(`Chart generated using ${result.model}.${attemptsNote}`, "assistant");
      enableChat();
      chatInput.focus();
      return;
    }

    let lastCode = result.code;
    let lastError = exec.error;

    for (let retry = 1; retry <= MAX_RUNTIME_RETRIES; retry++) {
      addMessage(`Runtime error: ${lastError}. Auto-retrying (${retry}/${MAX_RUNTIME_RETRIES})...`, "system");
      const retryLoading = showLoading();

      try {
        const retryResult = await requestRetry(
          question,
          currentData.columns,
          currentData.rowCount,
          currentData.sampleRows,
          lastCode,
          lastError
        );

        removeLoading(retryLoading);

        if (retryResult.error) {
          addMessage(`Retry failed: ${retryResult.error}`, "error");
          break;
        }

        exec = executeChartCode(retryResult.code, currentData.rows);

        if (exec.success) {
          addMessage(
            `Chart generated using ${retryResult.model} (fixed after runtime error).`,
            "assistant"
          );
          break;
        }

        lastCode = retryResult.code;
        lastError = exec.error;
      } catch (retryErr) {
        removeLoading(retryLoading);
        addMessage(`Retry request failed: ${retryErr.message}`, "error");
        break;
      }
    }

    if (!exec.success) {
      addMessage(`Could not render chart after retries: ${lastError}`, "error");
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
    const providers = [];
    if (health.openrouter_configured) providers.push("OpenRouter (" + health.openrouter_model + ")");
    if (health.ollama_available) providers.push("Ollama (" + health.ollama_model + ")");

    const modelBadge = document.getElementById("model-badge");
    if (providers.length > 0) {
      addMessage("Ready. Describe any chart and the AI will code it.", "system");
      if (modelBadge) modelBadge.textContent = providers[0];
    } else {
      addMessage("No LLM available. Set OPENROUTER_API_KEY or start Ollama.", "system");
      if (modelBadge) modelBadge.textContent = "No model";
    }
  } catch (_err) {
    addMessage(
      "Backend not reachable. Start it with: python3 server/app.py",
      "system"
    );
  }
}

init();
