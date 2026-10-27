---
name: senior-architecture-audit
description: >-
  Use this skill when the user asks for a Senior Developer or Architect analysis of a project to detect improvements of all kinds without altering the project's identity—covering data structures, tests, modular subdivision, design patterns, best practices, resource management, SSR, and component loading efficiency—and to record the findings as a checklist in README.md on a dedicated Git branch before merging to main.
---

# Senior Architecture & Codebase Audit Workflow

This skill is **100% self-contained and portable**. It standardizes the procedure for performing a non-destructive, senior-level architectural audit across a repository, proposing concrete engineering improvements, and documenting them as an actionable roadmap checklist in `README.md` on a dedicated branch.

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

Evaluate every layer of the project against the following six engineering pillars:

| Dimension | Signals / Anti-Patterns to Detect | Recommended Engineering Solution |
| :--- | :--- | :--- |
| **1. Data Structures & Complexity** | Repeated $O(N)$ `.find()` / `.filter()` per request; full database/JSON trees serialized inline into SSR HTML. | Precomputed $O(1)$ `Map` / `Set` indexes on boot; lightweight client DTO projections. |
| **2. Persistence & Concurrency** | Full-file read-modify-write on every request; missing duplicate/idempotency check; synchronous `fs.*Sync` in routes. | Per-resource async Mutex + append-only WAL/JSONL log; idempotency check by natural key; `node:fs/promises`. |
| **3. Modular Subdivision** | Monolithic "God Component" (> 300 LOC) mixing SSR data fetching, multi-step HTML, client JS, and CSS. | Extract cohesive UI components (`src/components/`) and dedicated client controller modules. |
| **4. Design Patterns** | Duplicated validation regexes in client and server; tight coupling between HTTP handler and storage library; manual DOM `.hidden` toggling. | Shared Schema/Specification (`src/lib/validation.ts`); Repository interface (`IRepository`); declarative FSM for wizard steps. |
| **5. Security & Best Practices** | Public download links exposing multi-user PII; unsanitized user strings written to Excel/CSV cells (`=`, `+`, `-`, `@`); POSIX-only scripts in `package.json`. | Auth/token protection on bulk exports; escape formula prefixes with `'`; IP/user rate limiting; cross-platform npm scripts. |
| **6. SSR & Loading Efficiency** | Inline scripts (`define:vars`) bypassing bundler/minifier; loading redundant web font families; client-only rendering of SSR-known URL params. | Use `<script type="application/json">` data islands + bundled TypeScript; single optimized font with `font-display: swap`; SSR pre-hydration. |
| **7. Automated Testing (QA)** | Missing test runner in `package.json`; untested concurrency locks; unverified static catalogs. | `Vitest` for catalog invariants, validation edge cases, and `Promise.all` concurrency stress tests; `Playwright` for E2E flows. |

---

## 3. Documentation & Git Commit Output

1. Append a structured **Roadmap & Senior Audit Checklist** (`- [ ] ...`) to `README.md` grouped by architectural domain, preserving all existing documentation sections.
2. Commit the checklist on the audit branch following Conventional Commits:
   ```bash
   git add README.md
   git commit -m "docs(roadmap): add senior architectural audit checklist and improvement proposals"
   ```
3. Present a concise executive summary to the user with clickable file and line links, and ask whether to merge the audit branch to `main` or begin implementing the checklist items sequentially.
