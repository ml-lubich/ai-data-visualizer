# Requirements

> Aigis Data Platform Components Monitor
> AIGIS Platform Team
> Copyright 2025, Polaris Wireless Inc
> Proprietary and Confidential

## Product Vision

A single-page web application where users interact with a chat interface to generate
AI-powered data visualizations. The user provides data (CSV upload) and describes
the visualization they want in natural language.

## User Stories

### US-001: Upload Data
As a user, I want to upload a CSV file so that the system knows what data I have.

### US-002: Request Visualization
As a user, I want to type a natural language description of a chart I want,
so that the AI generates it for me without writing code.

### US-003: View Generated Chart
As a user, I want to see the AI-generated chart rendered interactively on the page,
so that I can explore and understand my data.

### US-004: Iterate on Visualization
As a user, I want to refine my request in the chat (e.g., "make it a pie chart instead"),
so that I can explore different views of my data.

### US-005: Basic Data Operations
As a user, I want the AI to handle sorting, filtering, and aggregation within visualizations,
so that I can ask questions like "show top 10 products by revenue."

## Hard Constraints

- **Frontend only**: HTML / JS / CSS. No Streamlit.
- **Charting library**: BokehJS (primary), architecture supports swapping.
- **Backend**: Simple Python HTTP server (Flask).
- **LLM**: Frontier model (Claude) initially; evaluate Qwen 80B and GPT 120B OSS.
- **Context**: Connects to aigis-query ecosystem.

## Acceptance Criteria

- 10 curated benchmark questions produce correct, readable visualizations.
- Chat interface is responsive and shows loading state during generation.
- CSV files up to 10MB can be uploaded and parsed.
- Generated code executes without errors for standard chart types
  (bar, line, scatter, pie, histogram).
