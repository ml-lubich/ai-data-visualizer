"""Tests for server.code_validator -- hardened validation and sanitization."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from server.code_validator import (
    validate_js_syntax, validate_plotly_structure,
    sanitize_code, sanitize_and_validate,
)


def test_valid_js():
    ok, err = validate_js_syntax('Plotly.newPlot("visualization-target", [], {});')
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
    ok, err = validate_plotly_structure("document.getElementById('x');")
    assert ok is False
    assert "Plotly" in err


def test_plotly_newplot_required():
    ok, err = validate_plotly_structure("Plotly.something();")
    assert ok is False
    assert "newPlot" in err


def test_plotly_valid_structure():
    ok, err = validate_plotly_structure('Plotly.newPlot("visualization-target", [], {});')
    assert ok is True


def test_alert_blocked():
    ok, err = validate_plotly_structure('alert("hi"); Plotly.newPlot("visualization-target",[], {});')
    assert ok is False
    assert "alert" in err


def test_sanitize_strips_import():
    code = 'import Plotly from "plotly";\nPlotly.newPlot("visualization-target", [], {});'
    cleaned = sanitize_code(code)
    assert "import" not in cleaned
    assert "Plotly.newPlot" in cleaned


def test_sanitize_strips_require():
    code = 'const Plotly = require("plotly");\nPlotly.newPlot("visualization-target", [], {});'
    cleaned = sanitize_code(code)
    assert "require" not in cleaned


def test_sanitize_strips_console():
    code = 'console.log("debug");\nPlotly.newPlot("visualization-target", [], {});'
    cleaned = sanitize_code(code)
    assert "console" not in cleaned


def test_sanitize_strips_export():
    code = 'export default function() {};\nPlotly.newPlot("visualization-target", [], {});'
    cleaned = sanitize_code(code)
    assert "export" not in cleaned


def test_sanitize_strips_markdown_fences():
    code = '```javascript\nPlotly.newPlot("visualization-target", [], {});\n```'
    cleaned = sanitize_code(code)
    assert "```" not in cleaned
    assert "Plotly.newPlot" in cleaned


def test_full_pipeline_pass():
    code = 'Plotly.newPlot("visualization-target", [], {});'
    cleaned, ok, err = sanitize_and_validate(code)
    assert ok is True
    assert err == ""


def test_full_pipeline_sanitize_then_pass():
    code = 'import x from "y";\nconsole.log("hi");\nPlotly.newPlot("visualization-target", [], {});'
    cleaned, ok, err = sanitize_and_validate(code)
    assert ok is True
    assert "import" not in cleaned
    assert "console" not in cleaned


def test_full_pipeline_syntax_fail():
    cleaned, ok, err = sanitize_and_validate("Plotly.newPlot(;")
    assert ok is False
    assert "Syntax error" in err
