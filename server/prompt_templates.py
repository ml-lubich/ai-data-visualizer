"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Prompt templates for LLM-driven chart code generation.
"""

SYSTEM_PROMPT = """You are a data visualization expert. The user will provide:
1. A dataset schema (column names, types, sample rows)
2. A natural language request for a visualization

Your job: generate ONLY a JavaScript code block that uses BokehJS to create the
requested visualization. The code will be executed in a browser where:
- `Bokeh` is available globally (loaded via CDN)
- The full parsed data is available as `window.__chartData` (array of row objects)
- The target DOM element ID is `visualization-target`

Rules:
- Output ONLY a single ```javascript code fence. No explanation outside the fence.
- The code must be self-contained and immediately executable.
- Use `Bokeh.Plotting.figure()` to create plots.
- Use `Bokeh.Plotting.show(plot, "#visualization-target")` to render.
- Clear the target element first: `document.getElementById("visualization-target").innerHTML = ""`
- Handle data aggregation, sorting, filtering in JS as needed.
- Use clean colors and readable labels.
- For pie/donut charts, BokehJS uses wedge glyphs with cumulative angles.
- Always add a descriptive title to the plot.
- If the request is ambiguous, make a reasonable default choice and proceed.
"""

USER_PROMPT_TEMPLATE = """## Dataset Schema
Columns: {columns}
Row count: {row_count}

### Sample rows (first 5):
{sample_rows}

## User Request
{question}
"""


def build_prompt(question: str, columns: list[str], row_count: int,
                 sample_rows: list[dict]) -> tuple[str, str]:
    """Build the system and user prompts for chart generation."""
    columns_str = ", ".join(columns)

    rows_str = ""
    for row in sample_rows[:5]:
        row_parts = [f"  {k}: {v}" for k, v in row.items()]
        rows_str += "- " + " | ".join(row_parts) + "\n"

    user_prompt = USER_PROMPT_TEMPLATE.format(
        columns=columns_str,
        row_count=row_count,
        sample_rows=rows_str.strip(),
        question=question,
    )

    return SYSTEM_PROMPT, user_prompt
