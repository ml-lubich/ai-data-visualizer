"""
AI Data Visualizer — Flask backend.

Serves the static frontend and exposes two JSON API endpoints:
  POST /api/upload    — accepts a CSV file, stores it in memory
  POST /api/visualize — takes a natural-language message, asks Claude to
                        generate Python Bokeh code, executes it safely, and
                        returns a Bokeh JSON spec for BokehJS to render.
"""

import json
import os
import traceback
from io import StringIO

import numpy as np
import pandas as pd
from bokeh.embed import json_item
from bokeh.models import (
    ColumnDataSource,
    HoverTool,
    Legend,
    NumeralTickFormatter,
    DatetimeTickFormatter,
)
from bokeh.palettes import Category10, Category20, Viridis256
from bokeh.plotting import figure
from bokeh.transform import factor_cmap, dodge
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
import anthropic

load_dotenv()

app = Flask(__name__, static_folder="static")

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = os.environ.get("MODEL", "claude-3-5-sonnet-20241022")
PORT = int(os.environ.get("PORT", 5000))

# Simple in-memory data store (single-session prototype)
_uploaded_data: dict[str, pd.DataFrame] = {}

SYSTEM_PROMPT = """You are an expert data visualization engineer. \
When given a pandas DataFrame (available as `df`) and a user's visualization request, \
you generate Python code that uses Bokeh to create an interactive chart.

Rules:
1. The DataFrame is already loaded as `df`. Do NOT re-load or re-create it.
2. Assign the final Bokeh figure object to a variable named exactly `plot`.
3. Use ONLY these pre-imported names (do NOT add import statements):
   - pd, np
   - figure, ColumnDataSource, HoverTool, Legend
   - NumeralTickFormatter, DatetimeTickFormatter
   - Category10, Category20, Viridis256
   - factor_cmap, dodge
4. Set figure width=800, height=450, and add sizing_mode="stretch_width".
5. Add a HoverTool with useful tooltips wherever appropriate.
6. Return ONLY executable Python code — no markdown fences, no prose, no comments.
"""


import threading


def _safe_exec(code: str, df: pd.DataFrame) -> object:
    """Execute Claude-generated Bokeh code in a restricted namespace.

    A daemon thread with a 30-second timeout guards against infinite loops
    or excessive CPU use. A restricted __builtins__ dict prevents access to
    filesystem, network, or other dangerous Python built-ins.
    """
    allowed_builtins = {
        "abs": abs, "bool": bool, "dict": dict, "enumerate": enumerate,
        "float": float, "int": int, "isinstance": isinstance, "len": len,
        "list": list, "max": max, "min": min, "range": range,
        "round": round, "set": set, "sorted": sorted, "str": str,
        "sum": sum, "tuple": tuple, "zip": zip,
    }
    exec_globals = {
        "__builtins__": allowed_builtins,
        "df": df.copy(),
        "pd": pd,
        "np": np,
        "figure": figure,
        "ColumnDataSource": ColumnDataSource,
        "HoverTool": HoverTool,
        "Legend": Legend,
        "NumeralTickFormatter": NumeralTickFormatter,
        "DatetimeTickFormatter": DatetimeTickFormatter,
        "Category10": Category10,
        "Category20": Category20,
        "Viridis256": Viridis256,
        "factor_cmap": factor_cmap,
        "dodge": dodge,
    }
    exec_locals: dict = {}
    result: list = [None]
    exc_holder: list = [None]

    def _run() -> None:
        try:
            exec(code, exec_globals, exec_locals)  # noqa: S102 — intentional sandboxed exec
            result[0] = exec_locals.get("plot")
        except Exception as exc:  # noqa: BLE001
            exc_holder[0] = exc

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    thread.join(timeout=30)

    if thread.is_alive():
        raise TimeoutError("Generated code execution timed out (30 s limit)")

    if exc_holder[0] is not None:
        raise exc_holder[0]

    return result[0]


# ---------------------------------------------------------------------------
# Static routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.route("/api/upload", methods=["POST"])
def upload_data():
    """Accept a CSV file upload and store it in memory."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported"}), 400

    try:
        content = file.read().decode("utf-8")
        df = pd.read_csv(StringIO(content))
        _uploaded_data["default"] = df

        return jsonify({
            "success": True,
            "filename": file.filename,
            "rows": int(df.shape[0]),
            "columns": df.columns.tolist(),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "preview": df.head(5).to_dict("records"),
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/visualize", methods=["POST"])
def visualize():
    """Generate a Bokeh chart from a natural-language request."""
    payload = request.get_json(force=True)
    user_message = (payload.get("message") or "").strip()

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    if "default" not in _uploaded_data:
        return jsonify({"error": "No data uploaded yet. Please upload a CSV file first."}), 400

    if not ANTHROPIC_API_KEY:
        return jsonify({"error": "ANTHROPIC_API_KEY is not configured on the server."}), 500

    df = _uploaded_data["default"]

    # Build data context for the prompt
    data_context = (
        f"Shape: {df.shape[0]} rows × {df.shape[1]} columns\n"
        f"Columns: {', '.join(df.columns.tolist())}\n"
        f"Data types:\n{df.dtypes.to_string()}\n\n"
        f"First 3 rows:\n{df.head(3).to_string(index=False)}"
    )

    user_prompt = f"Dataset info:\n{data_context}\n\nUser request: {user_message}"

    bokeh_code = ""
    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        bokeh_code = response.content[0].text.strip()

        # Strip markdown code fences if Claude included them
        if bokeh_code.startswith("```"):
            lines = bokeh_code.splitlines()
            bokeh_code = "\n".join(
                line for line in lines if not line.startswith("```")
            ).strip()

        plot = _safe_exec(bokeh_code, df)
        if plot is None:
            return jsonify({
                "error": "Generated code did not assign a Bokeh figure to `plot`.",
                "code": bokeh_code,
            }), 500

        plot_json = json_item(plot, "bokeh-chart")
        return jsonify({"success": True, "plot": plot_json, "code": bokeh_code})

    except anthropic.APIError as exc:
        return jsonify({"error": f"Claude API error: {exc}", "code": bokeh_code}), 502
    except Exception as exc:
        tb = traceback.format_exc()
        return jsonify({
            "error": f"Visualization error: {exc}",
            "code": bokeh_code,
            "traceback": tb,
        }), 500


@app.route("/api/status", methods=["GET"])
def status():
    """Return current data and model status."""
    payload: dict = {"model": MODEL}
    if "default" in _uploaded_data:
        df = _uploaded_data["default"]
        payload.update({
            "has_data": True,
            "rows": int(df.shape[0]),
            "columns": df.columns.tolist(),
        })
    else:
        payload["has_data"] = False
    return jsonify(payload)


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, port=PORT)
