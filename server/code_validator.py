"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

JavaScript code validation and sanitization for LLM-generated Plotly.js code.
Catches and auto-fixes common LLM mistakes before they reach the browser.
"""

import re
import logging

import esprima

logger = logging.getLogger(__name__)

_IMPORT_RE = re.compile(r"^\s*(import\s+.*|const\s+\w+\s*=\s*require\s*\(.*\))\s*;?\s*$", re.MULTILINE)
_EXPORT_RE = re.compile(r"^\s*(export\s+|module\.exports\s*=).*$", re.MULTILINE)
_CONSOLE_RE = re.compile(r"\bconsole\.\w+\s*\(.*?\)\s*;?", re.DOTALL)
_ALERT_RE = re.compile(r"\b(alert|prompt|confirm)\s*\(", re.DOTALL)
_FIXED_SIZE_RE = re.compile(r"(width|height)\s*:\s*\d{3,4}\b")


def sanitize_code(code: str) -> str:
    """
    Auto-fix common LLM mistakes in generated code.
    Returns the cleaned code string.
    """
    if not code:
        return code

    code = _IMPORT_RE.sub("", code)
    code = _EXPORT_RE.sub("", code)
    code = _CONSOLE_RE.sub("", code)

    code = code.replace("```javascript", "").replace("```js", "").replace("```", "")

    code = re.sub(r"^//.*$", "", code, flags=re.MULTILINE)

    lines = [line for line in code.split("\n") if line.strip()]
    code = "\n".join(lines)

    return code.strip()


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


def validate_plotly_structure(code: str) -> tuple[bool, str]:
    """
    Structural checks for Plotly.js code.
    """
    if "Plotly" not in code:
        return False, "Missing Plotly reference -- expected Plotly.newPlot() call"

    if "newPlot" not in code and "react" not in code:
        return False, "Missing Plotly.newPlot() call"

    if "visualization-target" not in code and "viz-" not in code:
        return False, "Missing render target -- expected 'visualization-target' element ID"

    if _ALERT_RE.search(code):
        return False, "Code contains alert/prompt/confirm -- not allowed"

    return True, ""


def validate_code(code: str) -> tuple[bool, str]:
    """
    Run full validation pipeline: sanitize, syntax check, structure check.
    Returns (is_valid, error_message).
    Also returns the sanitized code via the global _last_sanitized.
    """
    code = sanitize_code(code)

    is_valid, error = validate_js_syntax(code)
    if not is_valid:
        logger.warning("JS syntax error: %s", error)
        return False, f"Syntax error: {error}"

    is_valid, error = validate_plotly_structure(code)
    if not is_valid:
        logger.warning("Plotly structure error: %s", error)
        return False, error

    return True, ""


def sanitize_and_validate(code: str) -> tuple[str, bool, str]:
    """
    Sanitize then validate. Returns (sanitized_code, is_valid, error).
    """
    cleaned = sanitize_code(code)

    is_valid, error = validate_js_syntax(cleaned)
    if not is_valid:
        return cleaned, False, f"Syntax error: {error}"

    is_valid, error = validate_plotly_structure(cleaned)
    if not is_valid:
        return cleaned, False, error

    return cleaned, True, ""
