/* global Bokeh */
(function () {
  "use strict";

  // --- State ---
  let currentData = null; // { columns: string[], rows: object[] }

  // --- DOM refs ---
  const fileInput = document.getElementById("file-input");
  const uploadArea = document.getElementById("upload-area");
  const dataPreview = document.getElementById("data-preview");
  const dataInfo = document.getElementById("data-info");
  const tableContainer = document.getElementById("table-container");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  const sendBtn = document.getElementById("send-btn");

  // --- Upload handling ---
  fileInput.addEventListener("change", handleFileSelect);

  // Drag & drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });
  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelect();
    }
  });

  async function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch("/api/upload", { method: "POST", body: formData });
      if (!resp.ok) throw new Error("Upload failed");
      const result = await resp.json();
      currentData = { columns: result.columns, rows: result.rows };
      renderPreview(result.filename);
    } catch (err) {
      addMessage("assistant", "Error uploading file: " + err.message);
    }
  }

  function renderPreview(filename) {
    if (!currentData) return;
    const { columns, rows } = currentData;

    dataInfo.textContent = `(${filename} — ${rows.length} rows, ${columns.length} columns)`;
    dataPreview.classList.remove("hidden");

    const previewRows = rows.slice(0, 10);
    let html = "<table><thead><tr>";
    for (const col of columns) html += `<th>${escapeHtml(col)}</th>`;
    html += "</tr></thead><tbody>";
    for (const row of previewRows) {
      html += "<tr>";
      for (const col of columns) {
        const val = row[col] != null ? String(row[col]) : "";
        html += `<td>${escapeHtml(val)}</td>`;
      }
      html += "</tr>";
    }
    html += "</tbody></table>";
    if (rows.length > 10) html += `<p style="font-size:0.8rem;color:#7f8c8d">Showing 10 of ${rows.length} rows</p>`;
    tableContainer.innerHTML = html;
  }

  // --- Chat handling ---
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage("user", message);
    chatInput.value = "";
    sendBtn.disabled = true;

    try {
      const body = {
        message,
        data: currentData ? currentData.rows : null,
        columns: currentData ? currentData.columns : null,
      };
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error("Request failed");
      const result = await resp.json();

      addMessage("assistant", result.reply);

      if (result.code) {
        executeVizCode(result.code);
      }
    } catch (err) {
      addMessage("assistant", "Error: " + err.message);
    } finally {
      sendBtn.disabled = false;
      chatInput.focus();
    }
  });

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function executeVizCode(code) {
    try {
      /* eslint-disable no-unused-vars */
      const DATA = currentData ? currentData.rows : [];
      const COLUMNS = currentData ? currentData.columns : [];
      /* eslint-enable no-unused-vars */
      const fn = new Function("DATA", "COLUMNS", "Bokeh", code);
      fn(DATA, COLUMNS, typeof Bokeh !== "undefined" ? Bokeh : null);
    } catch (err) {
      addMessage("assistant", "Visualization error: " + err.message);
      console.error("Viz execution error:", err);
    }
  }

  // --- Utility ---
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
