# AI Data Visualizer

AI-powered data visualization app. Describe a chart in natural language and the AI generates it for you using Chart.js.

## Quick Start

```bash
# Install dependencies
npm install

# Configure your OpenRouter API key
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY

# Start the server
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. Type a description of the chart you want in the chat input (e.g. "Show a bar chart of monthly sales: Jan 100, Feb 150, Mar 200")
2. The AI generates JavaScript visualization code using Chart.js
3. The chart is rendered live on the page

## Configuration

Copy `.env.example` to `.env` and set the following variables:

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | — | Your [OpenRouter](https://openrouter.ai/keys) API key |
| `PORT` | No | `3000` | Port the server listens on |
| `OPENROUTER_MODEL` | No | `anthropic/claude-sonnet-4` | The AI model to use |

## Running Tests

```bash
npm test
```

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML / CSS / JavaScript
- **Charts**: [Chart.js](https://www.chartjs.org/) (loaded via CDN)
- **AI**: [OpenRouter](https://openrouter.ai/) (supports Claude, GPT, Qwen, and other models)

