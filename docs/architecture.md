# Architecture

> Aigis Data Platform Components Monitor
> AIGIS Platform Team
> Copyright 2025, Polaris Wireless Inc
> Proprietary and Confidential

## Overview

**ai-data-visualizer** is an AI-powered, single-page web application that generates
interactive data visualizations from natural language requests via a chat interface.

## System Design

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│                                                 │
│  ┌──────────┐    ┌───────────┐   ┌───────────┐ │
│  │ Chat UI  │───>│ API Client│──>│ Visualizer│ │
│  │ (chat.js)│    │(api-client│   │(visualizer│ │
│  │          │<───│   .js)    │<──│   .js)    │ │
│  └──────────┘    └─────┬─────┘   └───────────┘ │
│                        │          BokehJS CDN   │
└────────────────────────┼────────────────────────┘
                         │ HTTP (JSON)
┌────────────────────────┼────────────────────────┐
│              Python Backend                     │
│                        │                        │
│  ┌─────────┐    ┌──────┴──────┐   ┌──────────┐ │
│  │ Flask   │───>│ LLM Client  │──>│ Prompt   │ │
│  │ (app.py)│    │(llm_client  │   │Templates │ │
│  │         │<───│    .py)     │<──│          │ │
│  └─────────┘    └──────┬──────┘   └──────────┘ │
└────────────────────────┼────────────────────────┘
                         │ HTTPS
                    ┌────┴─────┐
                    │ Claude   │
                    │ API      │
                    └──────────┘
```

## Layers

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| Presentation | Chat UI, data upload, chart display | HTML/CSS/JS, BokehJS |
| API Client | HTTP calls to backend | Fetch API |
| Backend API | Route requests, manage sessions | Flask (Python) |
| LLM Client | Format prompts, call Claude API | anthropic SDK |
| Prompt Engine | System prompts, code extraction | Python string templates |

## Key Decisions

### DR-001: BokehJS for Charting
- **Decision**: Use BokehJS as the primary visualization library.
- **Rationale**: Team preference (Rodrigo), strong interactive capabilities, Python-JS parity.
- **Risk**: LLMs have less training data for BokehJS than Plotly.js or Matplotlib.
  Research shows LLMs "struggle significantly with less prevalent" libraries.
- **Mitigation**: Architecture is library-agnostic; prompt templates can target any JS charting lib.

### DR-002: Simple Python Backend
- **Decision**: Flask over heavier frameworks.
- **Rationale**: Minimal boilerplate, team familiarity, easy to deploy.

### DR-003: Claude as Frontier Model
- **Decision**: Start with Claude (Anthropic) as the primary LLM.
- **Rationale**: Strong code generation, large context window.
- **Future**: Compare with Qwen 80B and GPT 120B OSS per evaluation plan.

### DR-004: Browser-Side Code Execution
- **Decision**: Execute LLM-generated BokehJS code in the browser via `new Function()`.
- **Rationale**: Simplest approach for prototype.
- **Risk**: Security (code injection). Acceptable for internal prototype.
- **Future**: Sandbox via iframe or Web Worker for production.

## Data Flow

1. User uploads CSV data (parsed client-side via PapaParse).
2. User types a visualization request in the chat.
3. Frontend sends `{ question, data_schema, sample_rows }` to `/api/visualize`.
4. Backend formats a prompt with BokehJS instructions and calls Claude.
5. Claude returns JavaScript code that creates a BokehJS plot.
6. Backend extracts the code block and returns it.
7. Frontend executes the code, rendering the chart into the visualization area.
