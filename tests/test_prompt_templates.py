"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Tests for server.prompt_templates module.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from server.prompt_templates import build_prompt, build_fix_prompt


def test_build_prompt_returns_two_strings():
    system, user = build_prompt(
        question="Show a bar chart",
        columns=["region", "revenue"],
        row_count=10,
        sample_rows=[{"region": "North", "revenue": 100}],
    )
    assert isinstance(system, str)
    assert isinstance(user, str)


def test_build_prompt_includes_question():
    _, user = build_prompt(
        question="Show a bar chart of sales",
        columns=["x"],
        row_count=1,
        sample_rows=[{"x": 1}],
    )
    assert "Show a bar chart of sales" in user


def test_build_prompt_includes_columns():
    _, user = build_prompt(
        question="test",
        columns=["region", "revenue", "units"],
        row_count=5,
        sample_rows=[],
    )
    assert "region" in user
    assert "revenue" in user
    assert "units" in user


def test_build_prompt_includes_row_count():
    _, user = build_prompt(
        question="test",
        columns=["a"],
        row_count=42,
        sample_rows=[],
    )
    assert "42" in user


def test_system_prompt_mentions_plotly():
    system, _ = build_prompt(
        question="test",
        columns=["a"],
        row_count=1,
        sample_rows=[],
    )
    assert "Plotly" in system
    assert "Plotly.newPlot" in system


def test_fix_prompt_includes_error_and_code():
    fix = build_fix_prompt("const x = ;", "Unexpected token ;")
    assert "Unexpected token ;" in fix
    assert "const x = ;" in fix
    assert "fix" in fix.lower()
