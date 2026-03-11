# ai-data-visualizer

AI-powered data visualization application using Claude AI and BokehJS.
Users upload CSV data and describe visualizations in natural language — Claude generates the chart.

## Features
- 📊 BokehJS interactive charts
- 🤖 Claude AI interprets natural language requests
- 📁 CSV data upload
- 💬 Chat-style interface
- 🧪 10 built-in test questions with automation

## Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Set your Anthropic API key
```bash
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY
```

### 3. Run the server
```bash
python server.py
```

### 4. Open in browser
Visit [http://localhost:5000](http://localhost:5000)

## Usage
1. **Upload** a CSV file using the file upload button
2. **Ask** for a visualization in the chat (e.g., "Show me sales by region as a bar chart")
3. **Interact** with the generated BokehJS chart

## Running Tests
```bash
cd tests
python run_tests.py
```

The test suite runs 10 predefined questions against `sample_data.csv` and reports which
visualizations the AI generates successfully.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | *(required)* | Your Anthropic API key |
| `MODEL` | `claude-3-5-sonnet-20241022` | Claude model to use |
| `PORT` | `5000` | Server port |

## Architecture
```
Browser (HTML/CSS/JS + BokehJS)
        │
        ▼
Flask HTTP Server (server.py)
        │
        ▼
Anthropic Claude API
```

The server receives the user's message + data schema, asks Claude to generate Python Bokeh code,
executes it in a restricted context, and returns the Bokeh JSON spec to the frontend where
BokehJS renders the interactive chart.

## Model Comparison
To test with different models, set the `MODEL` environment variable:
```bash
MODEL=claude-3-opus-20240229 python server.py
```
