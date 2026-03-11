# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**ai-data-visualizer** is an AI-powered single-page web application that generates interactive
BokehJS data visualizations from natural language requests via a chat interface.
Context: AIGIS Platform (Polaris Wireless).

### Architecture

Two services run during development:

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Vite dev server (frontend) | `npm run dev` | 5173 | HMR; serves `index.html` at project root |
| Flask API (backend) | `python3 server/app.py` | 5001 | Proxies to OpenRouter API; requires `OPENROUTER_API_KEY` env var |

Start both with: `npm run start` (uses `concurrently`).

### Common commands

See `package.json` scripts and `docs/` for full detail:

- **Dev servers:** `npm run start` (or run each separately)
- **Lint:** `npm run lint` (ESLint flat config)
- **Frontend tests:** `npm run test` (Vitest with jsdom)
- **Backend tests:** `python3 -m pytest tests/test_prompt_templates.py tests/test_app.py -v`
- **Build:** `npm run build` (Vite production build to `dist/`)
- **Benchmark:** `python tests/evaluate.py --model claude`

### Non-obvious caveats

- **BokehJS is loaded via CDN** (`index.html`), not npm. The `Bokeh` global is expected in
  browser-executed code. It is NOT available in Vitest (jsdom) - browser-level chart tests
  require manual testing via `computerUse`.
- **Fallback demo mode**: When `OPENROUTER_API_KEY` is not set, the backend returns hardcoded
  BokehJS code that creates a simple bar chart. This is sufficient for testing the pipeline
  but the chart won't match the user's actual request semantics.
- **OpenRouter integration**: The backend uses the OpenAI SDK pointed at `https://openrouter.ai/api/v1`.
  Model names use the OpenRouter format (e.g., `anthropic/claude-sonnet-4-20250514`). Configure via
  `OPENROUTER_API_KEY` and `LLM_MODEL` in `.env`.
- **ES modules everywhere**: `"type": "module"` in `package.json`. All `.js` use `import`/`export`.
- **Python path**: `pip` installs to `~/.local/bin`. Ensure this is on `PATH`.
- **Code execution security**: Generated JS code is run via `new Function()` in the browser.
  Acceptable for internal prototype; needs sandboxing for production.
- The `server/` directory is a Python package with `__init__.py`. Backend tests import via
  `sys.path` manipulation - run them from the project root.
