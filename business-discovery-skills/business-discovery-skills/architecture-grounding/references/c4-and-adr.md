# C4 context and ADRs — what to capture

## The C4 levels (use the top two for grounding)
- **Level 1 — System Context:** the system as one box, its users, and the external systems it interacts with. Answers "what is this and what's around it".
- **Level 2 — Containers:** the deployable/runnable units inside the system (web app, API, worker, database, cache) and how they communicate. Answers "what are the big moving parts".
- **Level 3 — Components** (optional): the major pieces inside a container. Only go here for genuinely complex containers.
- **Level 4 — Code** (rarely needed): leave to the code itself.

For grounding a build, levels 1–2 are usually enough. Keep diagrams simple (mermaid or ASCII); the words matter more than the picture.

## Architecture Decision Records (ADRs)
An ADR captures one significant decision so future readers — including a build agent — understand the reasoning, not just the outcome.

Keep them short and immutable: when a decision changes, write a **new** ADR that supersedes the old one (mark the old one `Superseded by ADR-XXXX`) rather than editing history. Number them sequentially.

Write an ADR for choices that are expensive to reverse or that shape the build: datastore, primary framework, sync vs async, monolith vs services, auth model, multi-tenancy, key third-party dependencies. Skip them for trivial, easily-reversible choices.

Each ADR: **Context** (the forces and the requirement driving it) → **Options considered** (with pros/cons) → **Decision** → **Consequences** (positive, negative/cost, follow-ups).
