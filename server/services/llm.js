const https = require("https");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.LLM_MODEL || "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are an expert data visualization assistant.
The user will provide a dataset (as JSON) and a natural-language request.
Your job is to produce **BokehJS JavaScript code** that renders the requested chart.

Rules:
- Use the global Bokeh object (loaded via CDN in the page).
- The code MUST call Bokeh.Plotting.show(plot, "#chart-output") to render into the existing element.
- Do NOT use import/require — Bokeh is available globally.
- Clear previous content: document.getElementById("chart-output").innerHTML = "";
- The data will be provided as a JavaScript variable called \`DATA\` (an array of objects).
- The columns will be provided as a variable called \`COLUMNS\` (an array of strings).
- Use appropriate chart types (line, bar, scatter, etc.) based on the user request.
- Add a title, axis labels, and a legend when appropriate.
- If the user asks for filtering or sorting, apply it to DATA before plotting.
- Keep the code concise and correct.

Respond with ONLY a JSON object in this exact format (no markdown fencing):
{
  "reply": "<short natural-language explanation of what the chart shows>",
  "code": "<the BokehJS JavaScript code as a single string>"
}`;

/**
 * Call the Anthropic Messages API to generate a BokehJS visualization.
 */
async function generateVisualization({ message, data, columns }) {
  if (!ANTHROPIC_API_KEY) {
    return buildFallbackResponse(message, data, columns);
  }

  const userContent = buildUserPrompt(message, data, columns);
  const body = JSON.stringify({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const raw = await callAnthropic(body);
  return parseLLMResponse(raw);
}

function buildUserPrompt(message, data, columns) {
  let prompt = `User request: ${message}\n`;
  if (columns && columns.length > 0) {
    prompt += `\nColumns: ${JSON.stringify(columns)}`;
  }
  if (data && data.length > 0) {
    const sample = data.slice(0, 50);
    prompt += `\nData sample (first ${sample.length} rows): ${JSON.stringify(sample)}`;
    prompt += `\nTotal rows: ${data.length}`;
  }
  return prompt;
}

function callAnthropic(body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`Anthropic API error ${res.statusCode}: ${data}`));
        }
        resolve(data);
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function parseLLMResponse(raw) {
  const apiResponse = JSON.parse(raw);
  const text =
    apiResponse.content &&
    apiResponse.content[0] &&
    apiResponse.content[0].text;

  if (!text) {
    throw new Error("Empty response from LLM");
  }

  // Try to extract JSON from the response (LLM might wrap in markdown)
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleaned);
  return {
    reply: parsed.reply || "Here is your visualization.",
    code: parsed.code || null,
  };
}

/**
 * Fallback when no API key is configured — generates a demo chart.
 */
function buildFallbackResponse(message, data, columns) {
  const lowerMsg = (message || "").toLowerCase();

  let chartType = "scatter";
  if (lowerMsg.includes("bar") || lowerMsg.includes("histogram")) chartType = "bar";
  else if (lowerMsg.includes("line") || lowerMsg.includes("trend")) chartType = "line";
  else if (lowerMsg.includes("pie") || lowerMsg.includes("donut")) chartType = "pie";

  const hasData = data && data.length > 0 && columns && columns.length > 0;
  const xCol = hasData ? columns[0] : "x";
  const yCol = hasData && columns.length > 1 ? columns[1] : "y";

  let code;
  if (chartType === "bar" && hasData) {
    code = buildBarCode(xCol, yCol);
  } else if (chartType === "line" && hasData) {
    code = buildLineCode(xCol, yCol);
  } else if (hasData) {
    code = buildScatterCode(xCol, yCol);
  } else {
    code = buildDemoCode();
  }

  return {
    reply: `Here is a ${chartType} chart${hasData ? ` using columns "${xCol}" and "${yCol}"` : " with sample data"}. Configure ANTHROPIC_API_KEY for AI-powered visualizations.`,
    code,
  };
}

function buildScatterCode(xCol, yCol) {
  return `
document.getElementById("chart-output").innerHTML = "";
const xs = DATA.map(d => d[${JSON.stringify(xCol)}]);
const ys = DATA.map(d => d[${JSON.stringify(yCol)}]);
const p = Bokeh.Plotting.figure({
  title: "${yCol} vs ${xCol}",
  x_axis_label: ${JSON.stringify(xCol)},
  y_axis_label: ${JSON.stringify(yCol)},
  width: 700, height: 450
});
const src = new Bokeh.ColumnDataSource({ data: { x: xs, y: ys } });
p.scatter({ field: "x" }, { field: "y" }, { source: src, size: 8, color: "#3498db" });
Bokeh.Plotting.show(p, "#chart-output");`.trim();
}

function buildLineCode(xCol, yCol) {
  return `
document.getElementById("chart-output").innerHTML = "";
const xs = DATA.map(d => d[${JSON.stringify(xCol)}]);
const ys = DATA.map(d => d[${JSON.stringify(yCol)}]);
const p = Bokeh.Plotting.figure({
  title: "${yCol} over ${xCol}",
  x_axis_label: ${JSON.stringify(xCol)},
  y_axis_label: ${JSON.stringify(yCol)},
  width: 700, height: 450
});
const src = new Bokeh.ColumnDataSource({ data: { x: xs, y: ys } });
p.line({ field: "x" }, { field: "y" }, { source: src, line_width: 2, color: "#2ecc71" });
Bokeh.Plotting.show(p, "#chart-output");`.trim();
}

function buildBarCode(xCol, yCol) {
  return `
document.getElementById("chart-output").innerHTML = "";
const xs = DATA.map(d => String(d[${JSON.stringify(xCol)}]));
const ys = DATA.map(d => d[${JSON.stringify(yCol)}]);
const p = Bokeh.Plotting.figure({
  title: "${yCol} by ${xCol}",
  x_range: xs,
  x_axis_label: ${JSON.stringify(xCol)},
  y_axis_label: ${JSON.stringify(yCol)},
  width: 700, height: 450
});
const src = new Bokeh.ColumnDataSource({ data: { x: xs, top: ys } });
p.vbar({ field: "x" }, 0.7, { field: "top" }, 0, { source: src, color: "#e74c3c" });
Bokeh.Plotting.show(p, "#chart-output");`.trim();
}

function buildDemoCode() {
  return `
document.getElementById("chart-output").innerHTML = "";
const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ys = [2, 11, 7, 15, 22, 18, 30, 27, 35, 40];
const p = Bokeh.Plotting.figure({
  title: "Sample Data",
  x_axis_label: "X",
  y_axis_label: "Y",
  width: 700, height: 450
});
const src = new Bokeh.ColumnDataSource({ data: { x: xs, y: ys } });
p.line({ field: "x" }, { field: "y" }, { source: src, line_width: 2, color: "#3498db" });
p.scatter({ field: "x" }, { field: "y" }, { source: src, size: 8, color: "#e74c3c" });
Bokeh.Plotting.show(p, "#chart-output");`.trim();
}

module.exports = {
  generateVisualization,
  buildUserPrompt,
  parseLLMResponse,
  buildFallbackResponse,
  SYSTEM_PROMPT,
};
