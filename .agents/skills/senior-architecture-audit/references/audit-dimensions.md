# Senior Architecture Audit — Reference Matrix

Use this reference matrix when scanning a codebase to ensure no critical improvement category is overlooked.

| Dimension | Signals / Anti-Patterns to Detect | Recommended Engineering Solution |
| :--- | :--- | :--- |
| **Data Structures** | Repeated `Array.prototype.find` / `filter` per HTTP request; full database/JSON trees serialized inline into HTML. | Precomputed `Map<Code, Entity>` caches on boot; lightweight client DTO projections. |
| **Persistence & I/O** | Full-file read-modify-write on every request; missing duplicate check; synchronous `fs.*Sync` in routes. | Per-resource async Mutex + append-only WAL/JSONL log; idempotency check by natural key; `node:fs/promises`. |
| **Subdivision** | Single view file > 300 LOC containing SSR logic, multi-step HTML, inline JS, and global/scoped CSS. | Extract cohesive UI components (`Header`, `Stepper`, `StepForm`, `Receipt`) and dedicated client controller modules. |
| **Design Patterns** | Duplicated regex validation in client and server; tight coupling between HTTP handler and storage library; manual DOM `.hidden` toggling. | Shared Schema/Specification (`src/lib/validation.ts`); Repository interface (`IRepository`); declarative FSM for wizard steps. |
| **Security** | Public download links to multi-user spreadsheets/databases; unsanitized user strings written to Excel/CSV cells. | Admin token/Auth middleware on export routes; prefix `=`, `+`, `-`, `@` with `'` to prevent Formula Injection; IP/user rate limiting. |
| **SSR & Performance** | Inline scripts bypassing bundler/minifier; loading multiple fallback web font families over the network; client-only filtering of SSR-known params. | Use `<script type="application/json">` data islands + bundled TypeScript; single variable font with `font-display: swap`; SSR pre-hydration. |
| **Testing** | Missing test runner in `package.json`; untested concurrency locks; unverified static JSON catalogs. | `Vitest` for catalog invariants, validation edge cases, and `Promise.all` concurrency stress tests; `Playwright` for E2E wizard flows. |
