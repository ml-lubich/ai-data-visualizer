"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Flask backend for ai-data-visualizer.
Multi-shot LLM pipeline: generate -> validate -> retry on error.
"""

import logging
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS

import requests as http_requests

from server.config import (
    SERVER_PORT, SERVER_HOST, CORS_ORIGINS,
    OPENROUTER_API_KEY, LLM_MODEL, OLLAMA_URL, OLLAMA_MODEL,
)
from server.llm_client import generate_chart_code, retry_with_error

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=CORS_ORIGINS)


def _ollama_available() -> bool:
    try:
        resp = http_requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        return resp.ok
    except Exception:
        return False


@app.route("/api/health", methods=["GET"])
def health():
    """Health check: shows which LLM providers are available."""
    ollama_up = _ollama_available()
    return jsonify({
        "status": "ok",
        "openrouter_configured": bool(OPENROUTER_API_KEY),
        "openrouter_model": LLM_MODEL if OPENROUTER_API_KEY else None,
        "ollama_available": ollama_up,
        "ollama_model": OLLAMA_MODEL if ollama_up else None,
    })


@app.route("/api/visualize", methods=["POST"])
def visualize():
    """
    Multi-shot chart generation: generate -> syntax check -> auto-retry.
    Returns { code, model, error, attempts }.
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


@app.route("/api/visualize/retry", methods=["POST"])
def visualize_retry():
    """
    Shot 3: frontend execution failed, feed the runtime error back to the LLM.
    Expects { question, columns, row_count, sample_rows, failed_code, runtime_error }.
    """
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Request body must be JSON"}), 400

    question = body.get("question", "").strip()
    columns = body.get("columns", [])
    row_count = body.get("row_count", 0)
    sample_rows = body.get("sample_rows", [])
    failed_code = body.get("failed_code", "")
    runtime_error = body.get("runtime_error", "")

    if not question or not columns or not failed_code or not runtime_error:
        return jsonify({"error": "question, columns, failed_code, and runtime_error are required"}), 400

    logger.info("Retry request: error=%r question=%r", runtime_error[:80], question[:60])

    result = retry_with_error(question, columns, row_count, sample_rows,
                              failed_code, runtime_error)

    if result["error"]:
        return jsonify(result), 502

    return jsonify(result)


if __name__ == "__main__":
    logger.info("Starting ai-data-visualizer backend on %s:%d", SERVER_HOST, SERVER_PORT)
    logger.info("OpenRouter: %s (model: %s)", "configured" if OPENROUTER_API_KEY else "not configured", LLM_MODEL)
    logger.info("Ollama: %s (model: %s)", "available" if _ollama_available() else "not available", OLLAMA_MODEL)
    app.run(host=SERVER_HOST, port=SERVER_PORT, debug=True)
