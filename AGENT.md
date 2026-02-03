# Huawei Plan Visualizer Agent Guide

## Mission
Design and build a cross-platform Tauri desktop application that visualizes Huawei DWS and openGauss execution plans. The app should reimagine the PEV2 experience with a modern Vue 3 UI, Bun-based tooling, encrypted local history, and secure database connectivity for executing `EXPLAIN PERFORMANCE`.

## Tech Stack
- **Frontend**: Vue 3 + TypeScript, Vite, Pinia, Vue Router, Vue I18n, Tailwind/Sass, D3 (hierarchy + scale), PixiJS/WebGL optional.
- **Backend**: Tauri (Rust) for native shell, parsers, EXPLAIN runners, encryption, storage.
- **Tooling**: Bun for package management, Vitest for tests, ESLint/Vue TSC for lint/type-check.

## Functional Pillars
1. **Plan ingestion**: manual paste/upload and DB-run explains for both Huawei DWS and openGauss, auto-detecting dialects.
2. **Parsing and normalization**: convert text/JSON EXPLAIN PERFORMANCE outputs into a unified plan graph schema with metrics, DN-specific data, warnings.
3. **Visualization UX**: redesigned canvases with collapsible hierarchies, minimap, thematic palettes, zoom/pan, search/filter, colorblind support.
4. **Knowledge + insights**: curated descriptions per operator, hover tooltips, bilingual content, heuristic rule engine for optimization hints.
5. **Productivity extras**: history with encryption/tagging, annotations, diff view, timeline, exporters (HTML/PNG/Markdown), offline docs.
6. **Security & cross-platform**: encrypted SQLite (SQLCipher), credential vault integrations, signed installers on macOS/Windows/Linux.

## Key Constraints
- Must rely on Bun for all Node-related commands.
- UI does **not** reuse PEV2 components verbatim (respect AGPL), but can follow concepts.
- Documentation content is paraphrased; no >25-word direct quotes.
- Offline-first: all node docs and heuristics shipped with app.

## Deliverables Checklist
- `package.json`, Vite/Tauri scaffolding, Bun lockfiles.
- Parser + insight engine modules with fixtures/tests.
- Vue components implementing enhanced visualization features.
- Encrypted plan history service and DB connection manager.
- Localization assets (EN + zh-CN) for UI and node docs.
- CI scripts for lint/test/build per platform.

## Future TODO Hooks
- Additional DB dialect plug-in slots (PostgreSQL, Oracle).
- Cloud sync module for sharing plan histories (optional later).
- Integration with Huawei cloud auth/SSO if needed.
