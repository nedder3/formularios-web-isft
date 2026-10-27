---
name: conventional-commits-readme
description: >-
  Enforces industry-standard Git release workflows, granular Conventional Commits with scopes
  and architectural traceability (never a single monolithic commit), and high-impact README
  generation with hero badges, Mermaid architecture diagrams, concurrency models, and API specifications.
---

# Conventional Commits, Traceability & README Standard

This skill defines the mandatory protocol for committing code, publishing Git repositories, and authoring world-class technical documentation across all projects.

---

## 1. Git Commit & Traceability Standard

### Golden Rule: Never Monolithic
Never commit an entire feature, module, or repository in a single massive commit (e.g., `init`, `first commit`, `full project`). Every release must tell a clear chronological story of architectural evolution.

### Conventional Commit Format
```text
<type>(<scope>): <short imperative summary>

[optional body explaining motivation, trade-offs, and technical details]
```

### Types & Scopes
- `feat(<component>)`: New capability, DSP block, server endpoint, parser, or UI component.
- `fix(<component>)`: Bugfix, race condition patch, memory leak resolution.
- `chore(<scope>)`: Submodules, build system (`CMakeLists.txt`), dependencies, `.gitignore`.
- `docs(<scope>)`: README, API documentation, architectural diagrams, licenses.
- `test(<scope>)`: Unit tests, integration tests, benchmark harnesses.
- `refactor(<scope>)`: Code restructuration without changing external behavior.
- `perf(<scope>)`: Lock-free optimizations, SIMD/cache tuning, latency reductions.

### Recommended Milestone Sequencing for New Projects
1. **Core Domain / Engine:** `feat(core)` or `feat(dsp)` — baseline data structures, algorithms, processing loop.
2. **Interface / UI:** `feat(gui)` or `feat(cli)` — user interaction layer, attachments, bindings.
3. **Data / Parsing:** `feat(parser)` or `feat(model)` — schemas, validation, defensive parsing.
4. **Transport / Network / IO:** `feat(server)` or `feat(watcher)` — file watchers, REST sockets, IPC.
5. **Infrastructure:** `chore(build)` or `chore(submodules)` — workspace build configuration, submodules.
6. **Documentation:** `docs:` — hero README, badges, architecture diagrams, licenses.

---

## 2. README Authoring Standard

Every production-grade project README must follow this structure:

### A. Centered Header & Badges
Include clean Shields.io badges in `for-the-badge` style:
- Language / Standard (e.g., C++20, Rust 2024, Python 3.12, TypeScript)
- Core Framework / Engine (e.g., JUCE 8, Tokio, PyTorch, React)
- Target Formats / Platforms (e.g., VST3 / Standalone, Linux / Windows / macOS)
- License (e.g., MIT, Apache 2.0)
- Commit Standard (`Conventional Commits 1.0.0`)
- Architectural Guarantee (e.g., Lock-Free Audio, Sub-millisecond Latency)

### B. High-Level Overview & Key Features
- Crisp 1-paragraph mission statement explaining the problem solved.
- Bullet points detailing specific capabilities, protocols, and performance metrics.

### C. Mermaid Architecture & Concurrency Diagrams
Every system with multiple layers or threads must include:
1. **System Flowchart (`flowchart TD` or `flowchart LR`):** Shows data ingestion from external clients down to the processing engine.
2. **Concurrency / Sequence Diagram (`sequenceDiagram`):** Explicitly maps threading boundaries (e.g., Network Thread vs UI Thread vs Real-time Engine Thread) to document thread-safety and lock-free handoffs.

### D. Interface & API Specifications
- Detailed HTTP endpoints (`POST /set_rig`, `GET /status`, CORS) or CLI flags.
- Exact request/response JSON payloads with field-level descriptions.
- Error codes and edge-case handling (`400`, `413`, `422`).

### E. Runbook: Build, Install & Test
- Explicit prerequisites (compilers, package managers, tools).
- Copy-pasteable shell commands for clone with submodules (`git clone --recursive`).
- Compilation commands for Debug and Release.
- Test execution commands (`ctest`, `cargo test`, `pytest`).
