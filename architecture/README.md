# Architecture — DataArt Travel Personalization Engine

**Project:** DataArt Travel — AI Personalization Engine
**Documented:** 2026-06-04
**Stack:** React 18 · Express 4 · MongoDB (Mongoose 8) · Node.js 18+

---

## Contents

```
architecture/
├── README.md              ← this file
├── system-context.md      ← C4 L1–L2: actors, containers, external systems
├── tech-stack.md          ← pinned versions, conventions, repo layout
├── constraints.md         ← NFRs mapped to concrete architectural constraints
├── data-model.md          ← key entities, relationships, indexes
├── threat-model.md        ← STRIDE pass over data flows
├── build-context.md       ← concise agent-ready brief (start here when building)
└── decisions/
    ├── ADR-0001-in-process-event-pipeline.md
    ├── ADR-0002-mongodb-ttl-recommendation-cache.md
    ├── ADR-0003-intent-first-recommendation-ordering.md
    ├── ADR-0004-decouple-return-reminder-from-batch.md
    ├── ADR-0005-deterministic-ab-assignment.md
    ├── ADR-0006-feature-flags-via-env.md
    ├── ADR-0007-structured-console-observability.md
    └── ADR-0008-separate-engagement-from-intent.md   ← two-axis model (EP-09)
```

## Quick orientation

**Before building anything**, read [build-context.md](build-context.md). It contains
the full stack, the file conventions, the patterns to follow, and links to everything else.

## Phase delivery map

| Phase | Scope | Gate |
|-------|-------|------|
| 1 | Bug fixes: double-tracking, return-visit, cabin metadata, price-drop disable | Ship immediately |
| 2 | A/B framework + CTR analytics (30-day measurement window) | Phase 3 go/no-go |
| 3 | Intent-first recommendations, continue-planning, return-reminder, SendGrid | CTR > 1% |
| 4 | Recency decay, admin tooling | 30-day conversion data |
