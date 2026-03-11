"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Integration tests for Flask backend routes.
"""

import sys
from pathlib import Path

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
    assert "llm_configured" in data


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


def test_visualize_returns_code(client):
    resp = client.post("/api/visualize", json={
        "question": "show a bar chart",
        "columns": ["region", "revenue"],
        "row_count": 10,
        "sample_rows": [{"region": "North", "revenue": 100}],
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert "code" in data
    assert len(data["code"]) > 0
    assert data["error"] is None
