"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Flask backend for ai-data-visualizer.
Provides /api/visualize endpoint that proxies to the configured LLM.
"""

import logging
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS

from server.config import SERVER_PORT, SERVER_HOST, CORS_ORIGINS, ANTHROPIC_API_KEY
from server.llm_client import generate_chart_code

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=CORS_ORIGINS)


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "llm_configured": bool(ANTHROPIC_API_KEY),
    })


@app.route("/api/visualize", methods=["POST"])
def visualize():
    """
    Generate BokehJS chart code from a natural language question.

    Expects JSON body:
      { "question": str, "columns": [str], "row_count": int, "sample_rows": [dict] }

    Returns JSON:
      { "code": str, "model": str, "error": str|null }
    """
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Request body must be JSON"}), 400

    question = body.get("question", "").strip()
    if not question:
        return jsonify({"error": "question is required"}), 400

    columns = body.get("columns", [])
    row_count = body.get("row_count", 0)
    sample_rows = body.get("sample_rows", [])

    if not columns:
        return jsonify({"error": "columns is required (list of column names)"}), 400

    logger.info("Visualize request: question=%r columns=%s rows=%d", question, columns, row_count)

    result = generate_chart_code(question, columns, row_count, sample_rows)

    if result["error"]:
        return jsonify(result), 502

    return jsonify(result)


if __name__ == "__main__":
    logger.info("Starting ai-data-visualizer backend on %s:%d", SERVER_HOST, SERVER_PORT)
    logger.info("LLM configured: %s", bool(ANTHROPIC_API_KEY))
    app.run(host=SERVER_HOST, port=SERVER_PORT, debug=True)
