"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Prompt templates for LLM-driven chart code generation.
Heavily guarded to maximize reliability of generated Plotly.js code.
"""

SYSTEM_PROMPT = """You are a Plotly.js code generator. You receive a dataset and a visualization request. You output ONLY executable JavaScript code.

ENVIRONMENT:
- Plotly is loaded globally (CDN). Use Plotly.newPlot() directly.
- Data is in window.__chartData (array of objects, one per row).
- Render target element ID: "visualization-target"

STRICT RULES:
1. Output ONLY a single ```javascript code fence. Nothing else. No explanation.
2. First line of code: const data = window.__chartData;
3. Last line of code MUST be a Plotly.newPlot() call.
4. Do NOT use import, require, export, module.exports, or fetch.
5. Do NOT use console.log, alert, prompt, or confirm.
6. Do NOT set fixed width or height in the layout.
7. Always set: paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)"
8. Always set: font: { color: "#e2e8f0" }
9. Always pass { responsive: true } as the fourth argument to Plotly.newPlot.
10. Use hovertemplate for formatted tooltips.
11. For pie charts, use labels and values arrays (not x/y).
12. For tables, use type: "table" with header.values and cells.values.
13. Aggregate the data yourself using reduce/forEach loops. Do not assume pre-aggregated data.

EXAMPLE - Bar chart of revenue by region:
```javascript
const data = window.__chartData;
const grouped = {};
for (const row of data) {
  if (!grouped[row.region]) grouped[row.region] = 0;
  grouped[row.region] += parseFloat(row.revenue) || 0;
}
const labels = Object.keys(grouped);
const values = Object.values(grouped);

Plotly.newPlot("visualization-target", [{
  x: labels, y: values, type: "bar",
  marker: { color: "#3b82f6" },
  hovertemplate: "<b>%{x}</b><br>Revenue: $%{y:,.2f}<extra></extra>",
}], {
  title: "Total Revenue by Region",
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
}, { responsive: true });
```

Follow this exact pattern. Adapt the aggregation and chart type to match the user's request."""

USER_PROMPT_TEMPLATE = """Dataset columns: {columns}
Row count: {row_count}
Sample rows:
{sample_rows}

Request: {question}"""

FIX_PROMPT_TEMPLATE = """Your code has this error:
{error}

Broken code:
```javascript
{code}
```

Fix it. Output ONLY the corrected ```javascript code fence. Remember:
- First line: const data = window.__chartData;
- Last line: Plotly.newPlot("visualization-target", ...);
- No import/require/export. No console.log. No fixed width/height."""


def build_prompt(question: str, columns: list[str], row_count: int,
                 sample_rows: list[dict]) -> tuple[str, str]:
    """Build the system and user prompts for chart generation."""
    columns_str = ", ".join(columns)

    rows_str = ""
    for row in sample_rows[:5]:
        row_parts = [f"{k}: {v}" for k, v in row.items()]
        rows_str += "  " + " | ".join(row_parts) + "\n"

    user_prompt = USER_PROMPT_TEMPLATE.format(
        columns=columns_str,
        row_count=row_count,
        sample_rows=rows_str.strip(),
        question=question,
    )

    return SYSTEM_PROMPT, user_prompt


def build_fix_prompt(code: str, error: str) -> str:
    """Build the fix prompt for multi-shot retry."""
    return FIX_PROMPT_TEMPLATE.format(code=code, error=error)
