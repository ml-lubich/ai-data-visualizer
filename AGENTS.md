# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**ai-data-visualizer** is a vanilla JavaScript + HTML application for AI-powered data visualizations, using Vite as the dev server/bundler and Chart.js for charting.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Vite dev server | `npm run dev` | 5173 | HMR enabled; serves `index.html` at project root |

### Common commands

All scripts are defined in `package.json`:

- **Dev server:** `npm run dev` (Vite on port 5173)
- **Lint:** `npm run lint` (ESLint, flat config in `eslint.config.js`)
- **Tests:** `npm run test` (Vitest, runs once) / `npm run test:watch` (watch mode)
- **Build:** `npm run build` (production build to `dist/`)
- **Preview:** `npm run preview` (serve production build)

### Non-obvious caveats

- The project uses ES modules (`"type": "module"` in `package.json`). All `.js` files use `import`/`export` syntax.
- ESLint uses the flat config format (`eslint.config.js`), not the legacy `.eslintrc` format.
- Source code lives in `src/`, tests in `tests/`. The Vite entry point is `index.html` at the project root (not inside `src/`).
- Chart.js is a runtime dependency; Vite, ESLint, and Vitest are dev dependencies.
