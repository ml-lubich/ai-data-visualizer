require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Chat endpoint that proxies to OpenRouter
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY is not configured" });
  }

  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

  const systemPrompt = `You are a data-visualization assistant. The user will describe a chart or visualization they want.
Your job is to produce a SINGLE self-contained JavaScript snippet that uses Chart.js (already loaded on the page via CDN) to render the requested visualization.

RULES:
1. Always target a canvas element with id "chart-canvas". If a previous Chart instance exists on that canvas, destroy it first using: if (window._chart) { window._chart.destroy(); }
2. Store the new chart in window._chart so it can be cleaned up later.
3. Return ONLY a fenced code block with the JavaScript. No explanation outside the code block.
4. The code must be plain JS (no imports, no require). Chart.js is available as the global "Chart".
5. Use sensible defaults for colors, labels, and data if the user didn't specify them.
6. If the user provides data (CSV, JSON, a table, etc.), parse it in the snippet and visualize it.
7. Support all common chart types: bar, line, pie, doughnut, scatter, radar, polar area, bubble, etc.
8. Make charts responsive and visually appealing with a clean color palette.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `OpenRouter error: ${text}` });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Only start listening when this file is run directly (not during tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
