"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

LLM client abstraction for chart code generation.
"""

import re
import logging

import anthropic

from server.config import ANTHROPIC_API_KEY, LLM_MODEL, LLM_MAX_TOKENS
from server.prompt_templates import build_prompt

logger = logging.getLogger(__name__)

_JS_CODE_FENCE = re.compile(r"```(?:javascript|js)\s*\n(.*?)```", re.DOTALL)


def _extract_js_code(response_text: str) -> str:
    """Extract JavaScript code from a markdown code fence."""
    match = _JS_CODE_FENCE.search(response_text)
    if match:
        return match.group(1).strip()
    return response_text.strip()


def generate_chart_code(question: str, columns: list[str], row_count: int,
                        sample_rows: list[dict]) -> dict:
    """
    Call the LLM to generate BokehJS chart code.

    Returns dict with keys: code (str), model (str), error (str|None).
    """
    if not ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set; returning fallback demo code")
        return _fallback_demo_code(question, columns)

    system_prompt, user_prompt = build_prompt(question, columns, row_count, sample_rows)

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        message = client.messages.create(
            model=LLM_MODEL,
            max_tokens=LLM_MAX_TOKENS,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw_text = message.content[0].text
        code = _extract_js_code(raw_text)
        return {"code": code, "model": LLM_MODEL, "error": None}

    except anthropic.APIError as exc:
        logger.error("Anthropic API error: %s", exc)
        return {"code": "", "model": LLM_MODEL, "error": str(exc)}


def _fallback_demo_code(question: str, columns: list[str]) -> dict:
    """Generate a simple fallback chart when no API key is configured."""
    value_col = None
    label_col = None
    for col in columns:
        if col in ("revenue", "units_sold", "cost", "value", "amount", "count"):
            value_col = col
        if col in ("region", "product", "category", "name", "date"):
            label_col = col

    if not value_col and len(columns) > 1:
        value_col = columns[-1]
    if not label_col and len(columns) > 0:
        label_col = columns[0]

    code = f"""
// Fallback demo (no API key configured)
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

const grouped = {{}};
for (const row of data) {{
  const key = row["{label_col}"];
  if (!grouped[key]) grouped[key] = 0;
  grouped[key] += parseFloat(row["{value_col}"]) || 0;
}}

const labels = Object.keys(grouped);
const values = Object.values(grouped);

const fig = Bokeh.Plotting.figure({{
  title: "{question.replace('"', "'")}",
  x_range: labels,
  width: 700,
  height: 400,
  toolbar_location: "above",
}});

const source = new Bokeh.ColumnDataSource({{
  data: {{ x: labels, top: values }}
}});

fig.vbar({{ x: {{ field: "x" }}, top: {{ field: "top" }}, width: 0.7, source: source,
  fill_color: "#3b82f6", line_color: "#1e40af" }});

Bokeh.Plotting.show(fig, "#visualization-target");
"""
    return {"code": code.strip(), "model": "fallback-demo", "error": None}
