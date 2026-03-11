"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

LLM client abstraction for chart code generation.
Uses OpenRouter (OpenAI-compatible API) to access frontier models.
"""

import re
import logging

from openai import OpenAI, APIError

from server.config import OPENROUTER_API_KEY, LLM_MODEL, LLM_MAX_TOKENS
from server.prompt_templates import build_prompt

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

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
    Call the LLM via OpenRouter to generate BokehJS chart code.

    Returns dict with keys: code (str), model (str), error (str|None).
    """
    if not OPENROUTER_API_KEY:
        logger.warning("OPENROUTER_API_KEY not set; returning fallback demo code")
        return _fallback_demo_code(question, columns)

    system_prompt, user_prompt = build_prompt(question, columns, row_count, sample_rows)

    try:
        client = OpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=OPENROUTER_API_KEY,
        )

        completion = client.chat.completions.create(
            model=LLM_MODEL,
            max_tokens=LLM_MAX_TOKENS,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        raw_text = completion.choices[0].message.content
        code = _extract_js_code(raw_text)
        actual_model = completion.model or LLM_MODEL
        return {"code": code, "model": actual_model, "error": None}

    except APIError as exc:
        logger.error("OpenRouter API error: %s", exc)
        return {"code": "", "model": LLM_MODEL, "error": str(exc)}
    except Exception as exc:
        logger.error("Unexpected LLM error: %s", exc)
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
