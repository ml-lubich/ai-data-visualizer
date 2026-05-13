# ai-data-visualizer

> AI-powered data visualizations: upload a CSV, describe the chart in natural
> language, get a rendered BokehJS chart back. Vite + vanilla JS frontend,
> Flask + LLM backend.

```mermaid
flowchart LR
    USER(("👤<br/>User"))
    CSV[("📄<br/>CSV upload")]
    UI{{"🖥 Vite UI<br/><code>src/main.js</code>"}}
    API["🔌 api-client.js"]
    FLASK["🐍 Flask<br/><code>server/app.py</code>"]
    PROMPT["📝 prompt_templates"]
    LLM["🤖 OpenRouter LLM<br/><i>Claude / GPT</i>"]
    CHART[/"📊 BokehJS chart"/]

    USER --> CSV --> UI
    USER -- "chat prompt" --> UI
    UI --> API --> FLASK
    FLASK --> PROMPT --> LLM
    LLM -- "chart spec" --> FLASK
    FLASK -- "JSON" --> API --> UI --> CHART

    classDef io fill:#0e1116,stroke:#2f81f7,stroke-width:1.5px,color:#e6edf3;
    classDef ui fill:#161b22,stroke:#3fb950,stroke-width:1.5px,color:#e6edf3;
    classDef brain fill:#161b22,stroke:#d29922,stroke-width:1.5px,color:#e6edf3;
    classDef out fill:#0e1116,stroke:#a371f7,stroke-width:1.5px,color:#e6edf3;
    class CSV,USER io;
    class UI,API,FLASK,PROMPT ui;
    class LLM brain;
    class CHART out;
```

## Table of contents

- [Quick start](#quick-start)
- [Architecture at a glance](#architecture-at-a-glance)
- [Usage](#usage)
- [Project layout](#project-layout)
- [Testing](#testing)
- [Docs](#docs)

## Quick start

```bash
npm install
pip3 install -r requirements.txt
npm run start          # frontend (:5173) + backend (:5001)
```

Create a `.env` in the project root:

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
LLM_MODEL=anthropic/claude-sonnet-4-20250514
```

Without `OPENROUTER_API_KEY` the app runs in fallback demo mode.

## Architecture at a glance

```mermaid
flowchart TB
    subgraph FE["🖥 Frontend · src/"]
        MAIN["main.js<br/>boot + wiring"]
        CHAT["chat.js<br/>prompt UI"]
        PARSE["data-parser.js<br/>CSV → tabular"]
        VIZ["visualizer.js<br/>BokehJS render"]
        APIC["api-client.js"]
    end
    subgraph BE["🐍 Backend · server/"]
        APP["app.py<br/>Flask routes"]
        CFG["config.py<br/>env + model id"]
        PT["prompt_templates.py"]
        LC["llm_client.py<br/>OpenRouter"]
    end
    MAIN --> CHAT --> APIC
    MAIN --> PARSE --> VIZ
    APIC -->|HTTP /generate| APP
    APP --> CFG
    APP --> PT --> LC
    LC -.spec.-> APP
    APP -.json.-> APIC --> VIZ
```

## Usage

1. Open http://localhost:5173
2. Upload a CSV file
3. Type a visualization request (e.g. "Show a bar chart of revenue by region")
4. The AI returns a chart spec and the page renders it with BokehJS

## Project layout

```
src/                  # Vite frontend (vanilla JS)
  main.js             # boot, wiring
  chat.js             # prompt UI
  data-parser.js      # CSV parsing
  visualizer.js       # BokehJS rendering
  api-client.js       # backend HTTP
server/               # Flask API
  app.py              # routes
  config.py           # env / model id
  prompt_templates.py # LLM prompts
  llm_client.py       # OpenRouter client
sample_data/          # demo CSVs
gallery.html          # static chart gallery
tests/                # vitest + pytest
docs/architecture.md  # full design doc
```

## Testing

```bash
npm run lint
npm run test                                       # Vitest (frontend)
python3 -m pytest tests/ -v                        # Backend
python tests/evaluate.py --model claude            # 10-question benchmark
```

## Docs

See [docs/architecture.md](docs/architecture.md) for the full design.
