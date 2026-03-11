"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Integration tests for Flask backend routes.
"""

import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from server.app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def test_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "ok"
    assert "openrouter_configured" in data
    assert "ollama_available" in data


def test_visualize_requires_json(client):
    resp = client.post("/api/visualize", data="not json")
    assert resp.status_code == 400


def test_visualize_requires_question(client):
    resp = client.post("/api/visualize", json={"columns": ["a"]})
    assert resp.status_code == 400
    assert "question" in resp.get_json()["error"]


def test_visualize_requires_columns(client):
    resp = client.post("/api/visualize", json={"question": "show chart"})
    assert resp.status_code == 400
    assert "columns" in resp.get_json()["error"]


@patch("server.app.generate_chart_code")
def test_visualize_returns_code(mock_generate, client):
    mock_generate.return_value = {
        "code": "const x = 1;",
        "model": "test-model",
        "error": None,
    }
    resp = client.post("/api/visualize", json={
        "question": "show a bar chart",
        "columns": ["region", "revenue"],
        "row_count": 10,
        "sample_rows": [{"region": "North", "revenue": 100}],
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["code"] == "const x = 1;"
    assert data["model"] == "test-model"
    assert data["error"] is None
    mock_generate.assert_called_once()


@patch("server.app.generate_chart_code")
def test_visualize_returns_502_on_llm_error(mock_generate, client):
    mock_generate.return_value = {
        "code": "",
        "model": "test-model",
        "error": "API error: 401",
    }
    resp = client.post("/api/visualize", json={
        "question": "show a bar chart",
        "columns": ["region", "revenue"],
        "row_count": 10,
        "sample_rows": [{"region": "North", "revenue": 100}],
    })
    assert resp.status_code == 502
    data = resp.get_json()
    assert data["error"] == "API error: 401"
