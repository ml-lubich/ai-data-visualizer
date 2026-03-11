# Testing Strategy

> Aigis Data Platform Components Monitor
> AIGIS Platform Team
> Copyright 2025, Polaris Wireless Inc
> Proprietary and Confidential

## Overview

Testing spans three layers: unit tests (Vitest), integration tests (Python pytest),
and benchmark evaluation (10 curated questions).

## Unit Tests (Frontend)

- **Runner**: Vitest
- **Location**: `tests/*.test.js`
- **Scope**: Pure functions in `src/` (data parsing, prompt formatting, code extraction).
- **Run**: `npm run test`

## Integration Tests (Backend)

- **Runner**: pytest
- **Location**: `tests/test_*.py`
- **Scope**: Flask routes, LLM client (with mocked API), prompt template rendering.
- **Run**: `cd server && python -m pytest ../tests/`

## Benchmark Evaluation

- **File**: `tests/benchmark_questions.json`
- **Runner**: `tests/evaluate.py`
- **Scope**: 10 high-quality questions run against each model.
- **Metrics**: Code executes without error, chart type matches request, data accuracy.
- **Models to compare**:
  1. Claude (Anthropic) - frontier baseline
  2. Qwen 80B
  3. GPT 120B OSS
- **Run**: `python tests/evaluate.py --model claude`

## Benchmark Questions (Draft - Align with Rodrigo)

See `tests/benchmark_questions.json` for the current set.
Questions cover: bar charts, line charts, scatter plots, pie charts, histograms,
sorted/filtered views, multi-series, time series, aggregations, and combined operations.
