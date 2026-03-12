"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Hardened multi-shot LLM pipeline for chart code generation.
Multiple layers of defense: extraction -> sanitization -> validation -> retry.
"""

import re
import logging

import requests

from server.config import (
    OPENROUTER_API_KEY, LLM_MODEL, LLM_MAX_TOKENS,
    OLLAMA_URL, OLLAMA_MODEL,
)
from server.prompt_templates import build_prompt, build_fix_prompt
from server.code_validator import sanitize_and_validate

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MAX_RETRIES = 3

_JS_FENCE_PATTERNS = [
    re.compile(r"```(?:javascript|js)\s*\n(.*?)```", re.DOTALL),
    re.compile(r"```\s*\n(.*?)```", re.DOTALL),
    re.compile(r"```(.*?)```", re.DOTALL),
]


def _extract_js_code(response_text: str) -> str:
    """
    Extract JavaScript code from the LLM response.
    Tries multiple fence patterns, then falls back to raw text.
    """
    for pattern in _JS_FENCE_PATTERNS:
        match = pattern.search(response_text)
        if match:
            code = match.group(1).strip()
            if len(code) > 20:
                return code

    stripped = response_text.strip()
    if stripped.startswith("```"):
        lines = stripped.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        return "\n".join(lines).strip()

    return stripped


def _call_llm(messages: list[dict]) -> dict:
    """
    Call the LLM. Tries OpenRouter first, falls back to Ollama.
    Returns {"raw_text": str, "model": str, "error": str|None}.
    """
    result = _try_openrouter(messages)
    if result is not None:
        return result

    return _try_ollama(messages)


def _try_openrouter(messages: list[dict]) -> dict:
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
                "messages": messages,
            },
            timeout=60,
        )
        body = resp.json()
        if not resp.ok:
            error_msg = body.get("error", {}).get("message", f"HTTP {resp.status_code}")
            logger.warning("OpenRouter failed (%d): %s", resp.status_code, error_msg)
            return None
        raw_text = body["choices"][0]["message"]["content"]
        model = body.get("model", LLM_MODEL)
        return {"raw_text": raw_text, "model": model, "error": None}
    except Exception as exc:
        logger.warning("OpenRouter error: %s", exc)
        return None


def _try_ollama(messages: list[dict]) -> dict:
    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {"num_predict": LLM_MAX_TOKENS, "temperature": 0.1},
            },
            timeout=180,
        )
        if not resp.ok:
            return {"raw_text": "", "model": OLLAMA_MODEL,
                    "error": f"Ollama HTTP {resp.status_code}"}
        body = resp.json()
        raw_text = body["message"]["content"]
        return {"raw_text": raw_text, "model": f"ollama/{OLLAMA_MODEL}", "error": None}
    except requests.ConnectionError:
        return {"raw_text": "", "model": OLLAMA_MODEL,
                "error": "Ollama not running. Start with: ollama serve"}
    except Exception as exc:
        logger.error("Ollama error: %s", exc)
        return {"raw_text": "", "model": OLLAMA_MODEL, "error": str(exc)}


def generate_chart_code(question: str, columns: list[str], row_count: int,
                        sample_rows: list[dict]) -> dict:
    """
    Hardened multi-shot pipeline:
      1. Generate code from question + data schema
      2. Extract code from response (multiple fence patterns)
      3. Sanitize (strip imports, console.log, etc.)
      4. Validate (syntax + structure)
      5. If invalid, feed error back to LLM and repeat
    Returns { code, model, error, attempts }.
    """
    system_prompt, user_prompt = build_prompt(question, columns, row_count, sample_rows)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    last_error = None
    model_used = "unknown"
    code = ""

    for attempt in range(1, MAX_RETRIES + 1):
        logger.info("LLM attempt %d/%d for: %s", attempt, MAX_RETRIES, question[:60])

        llm_result = _call_llm(messages)
        model_used = llm_result["model"]

        if llm_result["error"]:
            return {"code": "", "model": model_used, "error": llm_result["error"],
                    "attempts": attempt}

        raw_code = _extract_js_code(llm_result["raw_text"])
        code, is_valid, validation_error = sanitize_and_validate(raw_code)

        if is_valid:
            logger.info("Attempt %d: valid (%d chars, model: %s)", attempt, len(code), model_used)
            return {"code": code, "model": model_used, "error": None, "attempts": attempt}

        logger.warning("Attempt %d failed: %s", attempt, validation_error)
        last_error = validation_error

        if attempt < MAX_RETRIES:
            fix_prompt = build_fix_prompt(raw_code, validation_error)
            messages.append({"role": "assistant", "content": llm_result["raw_text"]})
            messages.append({"role": "user", "content": fix_prompt})

    return {"code": code, "model": model_used,
            "error": f"Failed after {MAX_RETRIES} attempts: {last_error}",
            "attempts": MAX_RETRIES}


def retry_with_error(question: str, columns: list[str], row_count: int,
                     sample_rows: list[dict], failed_code: str,
                     runtime_error: str) -> dict:
    """
    Browser runtime error retry: feed the error + failed code back to the LLM.
    """
    system_prompt, user_prompt = build_prompt(question, columns, row_count, sample_rows)
    fix_prompt = build_fix_prompt(failed_code, f"Runtime error in browser: {runtime_error}")

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
        {"role": "assistant", "content": f"```javascript\n{failed_code}\n```"},
        {"role": "user", "content": fix_prompt},
    ]

    llm_result = _call_llm(messages)

    if llm_result["error"]:
        return {"code": "", "model": llm_result["model"], "error": llm_result["error"],
                "attempts": 1}

    raw_code = _extract_js_code(llm_result["raw_text"])
    code, is_valid, validation_error = sanitize_and_validate(raw_code)

    if not is_valid:
        return {"code": code, "model": llm_result["model"],
                "error": f"Fix still invalid: {validation_error}", "attempts": 1}

    return {"code": code, "model": llm_result["model"], "error": None, "attempts": 1}
