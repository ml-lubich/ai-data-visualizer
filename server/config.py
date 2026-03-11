"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Server configuration loaded from environment variables.
"""

import os

from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "anthropic/claude-sonnet-4-20250514")
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "4096"))
SERVER_PORT = int(os.getenv("SERVER_PORT", "5001"))
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
