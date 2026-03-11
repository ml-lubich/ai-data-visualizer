# AI Data Visualizer

AI-powered data visualization application. Upload a CSV, describe the chart you
want in plain English, and the app generates an interactive [BokehJS](https://docs.bokeh.org/en/latest/docs/first_steps/first_steps_1.html) visualization.

## Quick Start

```bash
npm install
npm start          # http://localhost:3000
```

For AI-powered chart generation, set your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

Without an API key the app runs in **demo/fallback mode** — it generates basic
charts (scatter, line, bar) based on keyword detection in your query.

## How It Works

1. **Upload** a CSV file (comma, semicolon, or tab delimited).
2. **Ask** for a visualization in the chat box (e.g. *"bar chart of sales by region"*).
3. The server sends your query + data to the LLM, which returns BokehJS code.
4. The frontend executes the code and renders the chart.

## Architecture

```
public/            Frontend (HTML / CSS / JS)
  index.html       Main page
  css/styles.css   Styles
  js/app.js        Chat, upload, and chart rendering logic

server/            Backend (Node.js / Express)
  index.js         HTTP server + static file serving
  routes/chat.js   POST /api/chat  — LLM visualization endpoint
  routes/upload.js POST /api/upload — CSV upload + parsing
  services/llm.js  Anthropic Claude integration + fallback generator
  services/parser.js  CSV parsing (auto-detects delimiter)

test/              Tests (Node.js built-in test runner)
  parser.test.js   CSV parser unit tests
  llm.test.js      LLM service unit tests
  server.test.js   API integration tests
  evaluation.test.js  10 evaluation questions for LLM quality assessment
  fixtures/        Sample data files
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `ANTHROPIC_API_KEY` | *(none)* | Anthropic API key for Claude |
| `LLM_MODEL` | `claude-sonnet-4-20250514` | Model to use |

## Testing

```bash
npm test                                    # Run all tests
ANTHROPIC_API_KEY=sk-... npm test           # Run with real LLM
```

### Evaluation Harness

The evaluation test suite (`test/evaluation.test.js`) contains 10 curated
visualization questions that exercise different chart types, filtering, sorting,
and multi-series plotting. Use these to compare model performance:

```bash
LLM_MODEL=claude-sonnet-4-20250514 ANTHROPIC_API_KEY=sk-... npm test
```

## Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Charts | BokehJS | Rich interactive plots, runs in the browser, no Python needed |
| Backend | Node.js + Express | Minimal setup, same language as frontend |
| LLM | Anthropic Claude | Frontier model, strong code generation |
| Transport | REST JSON | Simple, no WebSocket complexity needed yet |

## License

MIT

