"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

LLM client: the model codes every visualization from scratch.
No templates, no fallbacks -- raw LLM code generation.
Tries OpenRouter first, falls back to local Ollama.
Validates JS syntax before returning; retries up to 3 times on syntax error.
"""

import os
import re
import logging
import tempfile
import subprocess

import requests

from server.config import (
    OPENROUTER_API_KEY, LLM_MODEL, LLM_MAX_TOKENS,
    OLLAMA_URL, OLLAMA_MODEL,
)
from server.prompt_templates import build_prompt, build_retry_prompt

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

_JS_CODE_FENCE = re.compile(r"```(?:javascript|js)\s*\n(.*?)```", re.DOTALL)


SYNTAX_CHECK_MAX_ATTEMPTS = 3
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_VALIDATE_SCRIPT = os.path.join(_PROJECT_ROOT, "scripts", "validate-js-syntax.js")


def _validate_js_syntax(code: str) -> tuple[bool, str]:
    """
    Validate JavaScript syntax using Node.
    Returns (valid, error_message). Error message is empty when valid.
    """
    if not os.path.isfile(_VALIDATE_SCRIPT):
        logger.warning("validate-js-syntax.js not found, skipping syntax check")
        return True, ""

    with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False) as f:
        f.write(code)
        path = f.name
    try:
        result = subprocess.run(
            ["node", _VALIDATE_SCRIPT, path],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=_PROJECT_ROOT,
        )
        if result.returncode == 0:
            return True, ""
        err = (result.stderr or result.stdout or "Syntax error").strip()
        return False, err
    except subprocess.TimeoutExpired:
        return False, "Syntax check timed out"
    except FileNotFoundError:
        logger.warning("Node not found, skipping syntax check")
        return True, ""
    except Exception as exc:
        return False, str(exc)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def _extract_js_code(response_text: str) -> str:
    """Extract JavaScript code from a markdown code fence."""
    match = _JS_CODE_FENCE.search(response_text)
    if match:
        return match.group(1).strip()
    return response_text.strip()


def _call_openrouter(system_prompt: str, user_prompt: str) -> dict:
    """Try OpenRouter API. Returns result dict or None on failure."""
    if not OPENROUTER_API_KEY:
        return None

    try:
        resp = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "AI Data Visualizer",
            },
            json={
                "model": LLM_MODEL,
                "max_tokens": LLM_MAX_TOKENS,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=60,
        )
        body = resp.json()
        if not resp.ok:
            error_msg = body.get("error", {}).get("message", f"HTTP {resp.status_code}")
            logger.warning("OpenRouter failed (%d): %s -- trying Ollama", resp.status_code, error_msg)
            return None

        raw_text = body["choices"][0]["message"]["content"]
        actual_model = body.get("model", LLM_MODEL)
        code = _extract_js_code(raw_text)
        return {"code": code, "model": actual_model, "error": None}

    except Exception as exc:
        logger.warning("OpenRouter error: %s -- trying Ollama", exc)
        return None


def _call_ollama(system_prompt: str, user_prompt: str) -> dict:
    """Call local Ollama instance. The LLM codes everything from scratch."""
    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
                "options": {"num_predict": LLM_MAX_TOKENS, "temperature": 0.2},
            },
            timeout=180,
        )

        if not resp.ok:
            return {"code": "", "model": OLLAMA_MODEL, "error": f"Ollama HTTP {resp.status_code}"}

        body = resp.json()
        raw_text = body["message"]["content"]
        code = _extract_js_code(raw_text)
        return {"code": code, "model": f"ollama/{OLLAMA_MODEL}", "error": None}

    except requests.ConnectionError:
        return {"code": "", "model": OLLAMA_MODEL,
                "error": "Ollama not running. Start with: ollama serve"}
    except Exception as exc:
        logger.error("Ollama error: %s", exc)
        return {"code": "", "model": OLLAMA_MODEL, "error": str(exc)}


def generate_chart_code(question: str, columns: list[str], row_count: int,
                        sample_rows: list[dict],
                        previous_code: str | None = None,
                        previous_error: str | None = None) -> dict:
    """
    Ask the LLM to code a Plotly.js visualization from scratch.
    Tries OpenRouter first, falls back to local Ollama.
    When previous_code and previous_error are provided, builds a retry prompt.
    Validates JS syntax; retries up to SYNTAX_CHECK_MAX_ATTEMPTS times on syntax error.
    """
    for attempt in range(1, SYNTAX_CHECK_MAX_ATTEMPTS + 1):
        if previous_code is not None and previous_error is not None:
            system_prompt, user_prompt = build_retry_prompt(
                question, columns, row_count, sample_rows,
                previous_code, previous_error,
            )
            logger.info("Retry request (attempt %d): previous error=%r",
                        attempt, previous_error[:80])
        else:
            system_prompt, user_prompt = build_prompt(
                question, columns, row_count, sample_rows,
            )

        result = _call_openrouter(system_prompt, user_prompt)
        if result is None:
            result = _call_ollama(system_prompt, user_prompt)

        if result.get("error"):
            return result

        code = result["code"]
        valid, syntax_err = _validate_js_syntax(code)
        if valid:
            return result

        logger.warning("Syntax error (attempt %d/%d): %s", attempt,
                       SYNTAX_CHECK_MAX_ATTEMPTS, syntax_err)
        previous_code = code
        previous_error = f"JavaScript syntax error: {syntax_err}"

    return {"code": "", "model": "", "error": f"Syntax validation failed after {SYNTAX_CHECK_MAX_ATTEMPTS} attempts"}
