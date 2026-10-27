---
name: senior-architecture-audit
description: >-
  Use this skill when the user asks for a Senior Developer or Architect analysis of a project to detect improvements of all kinds without altering the project's identity—covering data structures, tests, modular subdivision, design patterns, best practices, resource management, SSR, and component loading efficiency—and to record the findings as a checklist in README.md on a dedicated Git branch before merging to main.
---

# Senior Architecture & Codebase Audit Workflow

This skill standardizes the procedure for performing a non-destructive, senior-level architectural audit across a repository, proposing concrete engineering improvements, and documenting them as an actionable roadmap checklist in `README.md` on a dedicated branch.

---

## 1. Branch-First Non-Destructive Protocol

1. **Preserve Project Identity & Working Tree:**
   - Do **not** alter business logic, brand identity, or existing runtime behavior during the detection phase unless explicitly instructed to implement after the audit.
   - Verify clean Git status (`git status`) and create a dedicated audit branch before modifying documentation:
     ```bash
     git checkout -b docs/senior-architecture-ux-audit
     ```
2. **Comprehensive Codebase Inspection:**
   - Read entry points, configuration files (`package.json`, framework config, `tsconfig.json`), domain types, data services, persistence engines, API routes, layouts, and UI views.

---

## 2. Core Audit Dimensions

Evaluate every layer of the project against the following six engineering pillars (see [audit-dimensions.md](./references/audit-dimensions.md) for detailed checklists):

### A. Data Structures, Algorithmic Complexity & Persistence
- Detect linear scans ($O(N)$ `.find()` / `.filter()`) on hot paths and recommend precomputed $O(1)$ lookup structures (`Map`, `Set`, composite keys).
- Identify over-serialized payloads sent to the client (e.g., internal database/scaffolding fields leaked into SSR HTML) and suggest minimal DTO projections.
- Audit write paths for **idempotency**, **deduplication**, and **concurrency safety** (mutex queues, atomic writes, append-only logs vs full-file re-parsing).

### B. Modular Subdivision & Design Patterns
- Identify monolithic "God Components" or files exceeding ~300 lines that mix data fetching, markup, client state, and styling.
- Propose clear component boundaries (`src/components/`) with single responsibilities.
- Recommend pragmatic design patterns where applicable:
  - **Specification / Schema Pattern (SSOT):** Unify duplicated frontend and backend validation rules into a single shared schema (`Zod`, `Valibot`, or shared validator module).
  - **Repository / Adapter Pattern:** Decouple storage engines (e.g., Excel, SQLite, external REST APIs) behind domain interfaces.
  - **Finite State Machine (FSM):** Replace scattered imperative DOM visibility flags (`.hidden`, `.classList`) in multi-step flows with explicit state transitions.

### C. Testing & Quality Assurance (QA)
- **Unit Tests:** Domain invariants, catalog/data integrity, and edge-case input validation.
- **Concurrency & Integration Tests:** Parallel stress tests (`Promise.all`) against mutex queues, file writers, or database transactions.
- **End-to-End (E2E) Tests:** Critical user journeys, local storage persistence, and export/download verification.

### D. Best Practices, Security & Resource Handling
- **PII & Access Control:** Detect unauthenticated endpoints exposing sensitive user records or bulk downloads.
- **Injection Mitigation:** Check for CSV/Excel Formula Injection (`=`, `+`, `-`, `@`), XSS, or path traversal in file names.
- **Non-Blocking I/O:** Flag synchronous filesystem calls (`fs.readFileSync`, `fs.writeFileSync`) inside HTTP request handlers and recommend `node:fs/promises` or streams.
- **Rate Limiting & Cross-Platform Scripts:** Check for abuse protection on write endpoints and POSIX-only env syntax in `package.json` scripts.

### E. Server-Side Rendering (SSR) & Component Loading Efficiency
- Detect patterns that disable bundler optimizations (e.g., Astro `<script define:vars={...}>` forcing inline unminified scripts) and recommend JSON data islands or cached endpoints.
- Check if URL query parameters known at SSR request time can pre-render UI states on the server to avoid client layout shifts.
- Audit external render-blocking resources (duplicate Google Fonts, unoptimized assets, missing `font-display: swap`).

---

## 3. Documentation & Git Commit Output

1. Append a structured **Roadmap & Senior Audit Checklist** (`- [ ] ...`) to `README.md` grouped by architectural domain, preserving all existing documentation sections.
2. Commit the checklist on the audit branch following Conventional Commits:
   ```bash
   git add README.md
   git commit -m "docs(roadmap): add senior architectural audit checklist and improvement proposals"
   ```
3. Present a concise executive summary to the user with clickable file and line links, and ask whether to merge the audit branch to `main` or begin implementing the checklist items sequentially.
