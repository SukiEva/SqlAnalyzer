# Huawei Plan Visualizer — Implementation Plan

## Overview
Create a Tauri desktop application (Rust backend + Vue 3 frontend) inspired by dalibo/pev2 but purpose-built for Huawei DWS and openGauss execution plans. The app must:
- Support importing EXPLAIN PERFORMANCE outputs via paste/upload and direct DB connections.
- Normalize DWS/openGauss plans into a shared graph schema with metrics, warnings, and DN context.
- Deliver an elevated visualization experience (collapsible hierarchies, minimap, zoom/pan, palette themes, diff view, annotations).
- Provide curated operator documentation and heuristic optimization hints accessible via hover cards.
- Store plan history securely with encryption and tagging, remaining fully offline-capable.

## Workstreams

### 1. Tooling & Scaffolding
- Initialize Tauri + Vue 3 + TypeScript project using Bun (Vite template + `src-tauri`).
- Configure ESLint, Prettier (optional), Tailwind/Sass, Vitest, Vue TSC, and Husky-like hooks if desired.
- Set up CI (GitHub Actions) for lint, type-check, test, Tauri build matrix.

### 2. Core Data Model
- Define `PlanNode`, `PlanMetric`, `PlanExecution`, `PlanDialect`, `PlanInsight` TypeScript types and matching Rust structs.
- Implement adapters to convert parser output into tree + flattened lists for timelines and diffing.
- Provide serialization helpers for exporting/importing plan JSON snapshots.

### 3. Parsers & Connectors
- **Parsers**: Build Rust parsers for
  - Huawei DWS EXPLAIN PERFORMANCE text tables (multi-DN sections, DN block headers).
  - openGauss EXPLAIN text + JSON variants (including PERFORMANCE extras).
- Emit normalized nodes with metrics (actual/estimated rows/time, DN distribution, memory).
- **Connectors**: Rust services to execute EXPLAIN through database connections:
  - Connection profiles with host/port/db/user/SSL, optional SSH tunnel metadata.
  - Safe execution wrapper that temporarily sets required GUCs and rolls back transactions.
  - Timeout, cancellation, retry, credential masking.

### 4. Insight Engine & Documentation
- Curate operator descriptions (Hash Join, Nest Loop, Broadcast, etc.) from Huawei docs; store in `docs/huawei_nodes.(json|yaml)` with EN/zh translations and optimization checklists.
- Build rule engine evaluating plan metrics for issues (row skew, memory pressure, DN imbalance, join inefficiencies, limit-sort warnings, etc.).
- Surface insights with severity scores and recommended actions.

### 5. Frontend UX
- Base layout: sidebar (history, connections), top bar (search, palette toggle), main canvas region, insights drawer.
- Components:
  - `PlanCanvas` (PixiJS/WebGL or SVG) with zoom/pan, minimap overlay, level-of-detail toggles.
  - `HierarchyPanel` for folding/expanding nodes, breadcrumbs, keyboard navigation.
  - `TooltipCard` showing metrics + doc summary + optimization chips.
  - `TimelineView`, `DiffView`, `AnnotationPanel`, `HistoryList`, `ConnectionWizard`.
- Implement color themes (default, dark, colorblind-safe) and scenario filters (I/O, network, memory).
- Localization via `vue-i18n`; entire UI and doc content available EN/zh.

### 6. History, Storage, and Security
- Use SQLCipher (or libsodium) for encrypted SQLite database storing plans, annotations, tags, connections.
- Integrate with OS key stores for encryption keys (Keychain, Credential Locker, libsecret).
- Provide plan retention policies, manual purge, and export/import workflows.

### 7. Exporting & Sharing
- HTML export embedding plan JSON + lightweight viewer.
- PNG snapshot export via headless renderer.
- Markdown report generator summarizing key metrics/insights.

### 8. Testing & Quality
- Parser fixtures for multiple plan flavors; unit tests verifying node counts, metric accuracy, warnings.
- Insight engine unit tests using synthetic plans.
- Frontend component/unit tests with Vitest; Playwright E2E covering fold/unfold, hover docs, diff mode, localization, accessibility.
- Performance benchmarks for large plans (1k/5k nodes) to ensure acceptable FPS.
- Security checks for encryption flows, credential masking, offline mode.

## Assumptions
- Huawei documentation formats remain consistent; updates handled via curated data refreshes.
- All text summaries stay within licensing limits; no long verbatim quotes.
- Users accept offline storage once encrypted; no cloud sync in MVP.
- Additional DB dialects can be layered later via `PlanDialect` interface.
