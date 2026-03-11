/**
 * AI Data Visualizer — frontend JavaScript
 *
 * Handles:
 *  - CSV file upload  → POST /api/upload
 *  - Chat messages    → POST /api/visualize
 *  - BokehJS rendering of returned plot JSON
 *  - Suggestion chips
 */

const SUGGESTIONS = [
  "Show total sales by region as a bar chart",
  "Create a line chart of revenue over time",
  "Plot a scatter chart of quantity vs profit",
  "Show the distribution of sales as a histogram",
  "Create a grouped bar chart comparing sales by region and product",
  "Display top 10 products by total revenue, sorted descending",
  "Plot monthly sales with a 3-month rolling average",
  "Show the correlation between quantity sold and profit",
  "Create a stacked bar chart of sales by category per quarter",
  "Filter to profitable transactions only and visualize sales by region",
];

// ── DOM refs ──────────────────────────────────────────────────────────────
const csvInput       = document.getElementById("csv-input");
const uploadLabel    = document.getElementById("upload-label");
const dataInfo       = document.getElementById("data-info");
const chatMessages   = document.getElementById("chat-messages");
const chatInput      = document.getElementById("chat-input");
const sendBtn        = document.getElementById("send-btn");
const bokehChart     = document.getElementById("bokeh-chart");
const chartPlaceholder = document.getElementById("chart-placeholder");
const codeDetails    = document.getElementById("code-details");
const codeBlock      = document.getElementById("code-block");
const suggestionsEl  = document.getElementById("suggestions");
const modelBadge     = document.getElementById("model-badge");

// ── State ─────────────────────────────────────────────────────────────────
let hasData = false;

// ── Init ──────────────────────────────────────────────────────────────────
(async function init() {
  renderSuggestions();
  await checkStatus();
  csvInput.addEventListener("change", handleFileUpload);
  sendBtn.addEventListener("click", handleSend);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });
})();

// ── Status check ─────────────────────────────────────────────────────────
async function checkStatus() {
  try {
    const res  = await fetch("/api/status");
    const data = await res.json();
    if (data.has_data) {
      setDataReady(data.columns, data.rows);
    }
    if (data.model) {
      modelBadge.textContent = data.model;
    }
  } catch (_) { /* server may not be running yet */ }
}

// ── File Upload ───────────────────────────────────────────────────────────
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  uploadLabel.innerHTML = `<span class="spinner"></span> Uploading…`;

  const form = new FormData();
  form.append("file", file);

  try {
    const res  = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok || data.error) {
      uploadLabel.textContent = "📁 Upload CSV";
      appendMessage(`Upload failed: ${data.error}`, "error");
      return;
    }

    setDataReady(data.columns, data.rows, data.filename, data.preview);
    appendMessage(`✅ Loaded **${data.filename}** — ${data.rows} rows, ${data.columns.length} columns.`, "assistant");
  } catch (err) {
    uploadLabel.textContent = "📁 Upload CSV";
    appendMessage(`Upload error: ${err.message}`, "error");
  }
}

function setDataReady(columns, rows, filename, preview) {
  hasData = true;
  uploadLabel.textContent = filename ? `📄 ${filename}` : "📄 Data loaded";
  chatInput.disabled = false;
  sendBtn.disabled   = false;

  let html = `<strong>${rows} rows × ${columns.length} columns</strong><br>`;
  html += `Columns: ${columns.slice(0, 8).join(", ")}`;
  if (columns.length > 8) html += `, …+${columns.length - 8} more`;
  dataInfo.innerHTML = html;
  dataInfo.classList.remove("hidden");

  if (preview && preview.length) {
    renderPreviewTable(preview, columns);
  }
}

function renderPreviewTable(rows, columns) {
  // Show a compact text preview in the data-info div
  const sample = rows.slice(0, 3).map(r =>
    columns.slice(0, 4).map(c => `${c}: ${r[c]}`).join(" | ")
  ).join("\n");
  dataInfo.innerHTML += `<pre style="margin-top:6px;font-size:11px;color:var(--text-muted);overflow:hidden;white-space:pre-wrap;">${sample}</pre>`;
}

// ── Chat & Visualization ──────────────────────────────────────────────────
async function handleSend() {
  const message = chatInput.value.trim();
  if (!message || !hasData) return;

  chatInput.value = "";
  chatInput.disabled = true;
  sendBtn.disabled   = true;

  appendMessage(message, "user");
  const thinking = appendMessage("Generating visualization…", "thinking");

  try {
    const res  = await fetch("/api/visualize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();

    thinking.remove();

    if (!res.ok || data.error) {
      appendMessage(`❌ ${data.error}`, "error");
      if (data.code) showCode(data.code);
    } else {
      appendMessage("✅ Here is your chart!", "assistant");
      renderChart(data.plot);
      if (data.code) showCode(data.code);
    }
  } catch (err) {
    thinking.remove();
    appendMessage(`❌ Network error: ${err.message}`, "error");
  } finally {
    chatInput.disabled = false;
    sendBtn.disabled   = false;
    chatInput.focus();
  }
}

// ── BokehJS rendering ─────────────────────────────────────────────────────
function renderChart(plotJson) {
  bokehChart.innerHTML = "";
  chartPlaceholder.classList.add("hidden");
  bokehChart.classList.remove("hidden");

  // Embed the BokehJS item
  Bokeh.embed.embed_item(plotJson, "bokeh-chart");
}

// ── Code display ──────────────────────────────────────────────────────────
function showCode(code) {
  codeBlock.textContent = code;
  codeDetails.classList.remove("hidden");
}

// ── Chat message helper ───────────────────────────────────────────────────
function appendMessage(text, type) {
  const el = document.createElement("div");
  el.className = `message ${type}`;
  // Basic bold markdown support (**text**)
  el.innerHTML = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

// ── Suggestion chips ─────────────────────────────────────────────────────
function renderSuggestions() {
  suggestionsEl.innerHTML = "";
  SUGGESTIONS.forEach((q) => {
    const btn = document.createElement("button");
    btn.className = "suggestion-chip";
    btn.textContent = q;
    btn.addEventListener("click", () => {
      if (!hasData) {
        appendMessage("Please upload a CSV file before asking for a visualization.", "error");
        return;
      }
      chatInput.value = q;
      handleSend();
    });
    suggestionsEl.appendChild(btn);
  });
}
