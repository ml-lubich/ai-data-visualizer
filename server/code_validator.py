"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

JavaScript code validation for LLM-generated Plotly.js code.
Catches syntax errors before they reach the browser.
"""

import logging

import esprima

logger = logging.getLogger(__name__)


def validate_js_syntax(code: str) -> tuple[bool, str]:
    """
    Validate JavaScript syntax using esprima parser.
    Returns (is_valid, error_message).
    """
    if not code or not code.strip():
        return False, "Empty code generated"

    try:
        esprima.parseScript(code, tolerant=True)
        return True, ""
    except esprima.Error as exc:
        return False, str(exc)


def validate_plotly_basics(code: str) -> tuple[bool, str]:
    """
    Basic structural checks for Plotly.js code.
    Not a full semantic analysis -- just catches obvious issues.
    """
    if "Plotly" not in code:
        return False, "Code does not reference Plotly -- expected Plotly.newPlot() call"

    if "visualization-target" not in code and "viz-" not in code:
        return False, "Code does not target the visualization container"

    return True, ""


def validate_code(code: str) -> tuple[bool, str]:
    """
    Run all validation checks. Returns (is_valid, error_message).
    """
    is_valid, error = validate_js_syntax(code)
    if not is_valid:
        logger.warning("JS syntax error: %s", error)
        return False, f"Syntax error: {error}"

    is_valid, error = validate_plotly_basics(code)
    if not is_valid:
        logger.warning("Plotly structure error: %s", error)
        return False, error

    return True, ""
