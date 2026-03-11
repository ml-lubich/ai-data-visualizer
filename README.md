# ai-data-visualizer

AI-powered data visualizations via JS / HTML.

> Aigis Data Platform Components Monitor
> AIGIS Platform Team
> Copyright 2025, Polaris Wireless Inc
> Proprietary and Confidential

## Quick Start

```bash
# Install dependencies
npm install
pip3 install -r requirements.txt

# Start both servers (frontend + backend)
npm run start

# Or start individually:
npm run dev          # Vite dev server on :5173
python3 server/app.py  # Flask API on :5001
```

Set `OPENROUTER_API_KEY` environment variable for full LLM-powered chart generation
(via [OpenRouter](https://openrouter.ai)). Without it, the app runs in fallback demo mode.

Create a `.env` file in the project root:
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
LLM_MODEL=anthropic/claude-sonnet-4-20250514
```

## Usage

1. Open http://localhost:5173
2. Upload a CSV file
3. Type a visualization request in the chat (e.g., "Show me a bar chart of revenue by region")
4. The AI generates and renders a BokehJS chart

## Testing

```bash
npm run lint          # ESLint
npm run test          # Vitest (frontend)
python3 -m pytest tests/test_prompt_templates.py tests/test_app.py -v  # Backend
python tests/evaluate.py --model claude  # Benchmark (10 questions)
```

## Architecture

See `docs/architecture.md` for full design documentation.
