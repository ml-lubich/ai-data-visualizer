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

Your job: generate ONLY a JavaScript code block that uses Plotly.js to create the
requested visualization. The code will be executed in a browser where:
- `Plotly` is available globally (loaded via CDN)
- The full parsed data is available as `window.__chartData` (array of row objects)
- The target DOM element ID is `visualization-target`

Rules:
- Output ONLY a single ```javascript code fence. No explanation outside the fence.
- The code must be self-contained and immediately executable.
- Use `Plotly.newPlot("visualization-target", traces, layout, config)` to render.
- For tables, use `type: "table"` with header and cells objects.
- For dashboards combining chart + table, create child divs inside visualization-target.
- Handle data aggregation, sorting, filtering in JS as needed.
- Use clean colors and readable labels. Set paper_bgcolor and plot_bgcolor to "rgba(0,0,0,0)".
- Set font color to "#e2e8f0" for dark theme compatibility.
- Add descriptive hovertemplate strings with formatted values.
- Always add a descriptive title to the layout.
- Set `{ responsive: true }` in config.
- Do NOT set fixed pixel width/height. The chart should fill its container.
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

FIX_PROMPT_TEMPLATE = """The code you generated has an error:

```
{error}
```

Here is the problematic code:
```javascript
{code}
```

Please fix the code and output a corrected version. Output ONLY the fixed ```javascript code fence.
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


def build_fix_prompt(code: str, error: str) -> str:
    """Build the fix prompt for multi-shot retry."""
    return FIX_PROMPT_TEMPLATE.format(code=code, error=error)
