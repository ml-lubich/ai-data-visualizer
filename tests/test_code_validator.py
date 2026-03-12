"""Tests for server.code_validator."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from server.code_validator import validate_js_syntax, validate_plotly_basics, validate_code


def test_valid_js():
    ok, err = validate_js_syntax('const x = 1; Plotly.newPlot("t", [], {});')
    assert ok is True
    assert err == ""


def test_invalid_js_syntax():
    ok, err = validate_js_syntax("const x = ;")
    assert ok is False
    assert "Unexpected token" in err


def test_empty_code():
    ok, err = validate_js_syntax("")
    assert ok is False
    assert "Empty" in err


def test_plotly_reference_required():
    ok, err = validate_plotly_basics("document.getElementById('x');")
    assert ok is False
    assert "Plotly" in err


def test_plotly_valid_reference():
    ok, err = validate_plotly_basics('Plotly.newPlot("visualization-target", [], {});')
    assert ok is True


def test_full_validation_pass():
    ok, err = validate_code('Plotly.newPlot("visualization-target", [], {});')
    assert ok is True
    assert err == ""


def test_full_validation_syntax_fail():
    ok, err = validate_code("Plotly.newPlot(;")
    assert ok is False
    assert "Syntax error" in err


def test_full_validation_plotly_fail():
    ok, err = validate_code("const x = 1;")
    assert ok is False
    assert "Plotly" in err
