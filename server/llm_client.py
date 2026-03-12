"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Multi-shot LLM pipeline for chart code generation.
Shot 1: Generate from scratch.
Shot 2: If syntax/validation error, re-prompt with the error.
Shot 3: If runtime error from browser, re-prompt with the error.
No templates -- the LLM codes everything.
"""

import re
import logging

import requests

from server.config import (
    OPENROUTER_API_KEY, LLM_MODEL, LLM_MAX_TOKENS,
    OLLAMA_URL, OLLAMA_MODEL,
)
from server.prompt_templates import build_prompt, build_fix_prompt
from server.code_validator import validate_code

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MAX_RETRIES = 3

_JS_CODE_FENCE = re.compile(r"```(?:javascript|js)\s*\n(.*?)```", re.DOTALL)


def _extract_js_code(response_text: str) -> str:
    """Extract JavaScript code from a markdown code fence."""
    match = _JS_CODE_FENCE.search(response_text)
    if match:
        return match.group(1).strip()
    return response_text.strip()


def _call_llm(messages: list[dict]) -> dict:
    """
    Call the LLM with a message list. Tries OpenRouter, falls back to Ollama.
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
                "options": {"num_predict": LLM_MAX_TOKENS, "temperature": 0.2},
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
    Multi-shot LLM pipeline:
      Shot 1: Generate code from question + data schema.
      Shot 2+: If validation fails, feed the error back and ask the LLM to fix.
    Returns { code, model, error, attempts }.
    """
    system_prompt, user_prompt = build_prompt(question, columns, row_count, sample_rows)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    last_error = None
    model_used = "unknown"

    for attempt in range(1, MAX_RETRIES + 1):
        logger.info("LLM attempt %d/%d for: %s", attempt, MAX_RETRIES, question[:60])

        llm_result = _call_llm(messages)
        model_used = llm_result["model"]

        if llm_result["error"]:
            return {"code": "", "model": model_used, "error": llm_result["error"],
                    "attempts": attempt}

        code = _extract_js_code(llm_result["raw_text"])
        is_valid, validation_error = validate_code(code)

        if is_valid:
            logger.info("Attempt %d: code valid (%d chars)", attempt, len(code))
            return {"code": code, "model": model_used, "error": None,
                    "attempts": attempt}

        logger.warning("Attempt %d validation failed: %s", attempt, validation_error)
        last_error = validation_error

        if attempt < MAX_RETRIES:
            fix_prompt = build_fix_prompt(code, validation_error)
            messages.append({"role": "assistant", "content": llm_result["raw_text"]})
            messages.append({"role": "user", "content": fix_prompt})

    return {"code": code, "model": model_used,
            "error": f"Validation failed after {MAX_RETRIES} attempts: {last_error}",
            "attempts": MAX_RETRIES}


def retry_with_error(question: str, columns: list[str], row_count: int,
                     sample_rows: list[dict], failed_code: str,
                     runtime_error: str) -> dict:
    """
    Shot 3: The browser tried to execute the code and got a runtime error.
    Feed the error back to the LLM and ask it to fix.
    """
    system_prompt, user_prompt = build_prompt(question, columns, row_count, sample_rows)
    fix_prompt = build_fix_prompt(failed_code, f"Runtime error: {runtime_error}")

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

    code = _extract_js_code(llm_result["raw_text"])
    is_valid, validation_error = validate_code(code)

    if not is_valid:
        return {"code": code, "model": llm_result["model"],
                "error": f"Fix attempt still invalid: {validation_error}", "attempts": 1}

    return {"code": code, "model": llm_result["model"], "error": None, "attempts": 1}
