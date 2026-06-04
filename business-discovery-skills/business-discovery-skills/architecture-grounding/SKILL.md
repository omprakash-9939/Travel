---
name: architecture-grounding
description: Capture the technical context and target architecture so requirements, BDD, tests, and the eventual Claude Code build are all grounded in the same reality. Use this when starting to shape a solution, or whenever someone says "what's the architecture", "what stack are we using", "we need to ground this technically", "record an architecture decision / ADR", "system design", or before letting an agent build. It produces an `architecture/` folder — system context (C4-style), tech stack and conventions, NFR constraints, a data-model sketch, Architecture Decision Records, and a concise `build-context.md` an agent reads before writing code. Establishes the "how it fits together" so downstream work doesn't drift.
---

# Architecture Grounding

Code that an agent builds is only as good as the context it's given. This skill captures the technical reality — current landscape, target shape, stack, conventions, constraints, and the decisions behind them — so requirements, feature files, tests, and the **Claude Code build** all sit on the same foundation. Without it, an agent guesses the stack and the conventions, and the build drifts from what the team actually wants.

It complements discovery, which answers *why* and *what*; this answers *how it fits together*.

## For a junior-led POC (no architect needed)

This skill scales down. If the team is juniors building a proof of concept with no dedicated architect, **don't aim for an enterprise architecture pack — aim for just enough to build confidently.** The only must-haves are:

- a short **`build-context.md`** (stack + versions, conventions, where code and tests live, what's real vs mocked),
- **one or two ADRs** for the choices that actually matter (the stack, the data/auth provider), and
- a **10-minute security skim** of the top two or three risks.

The richer artifacts — full C4 diagrams, a detailed data model, a complete threat model, many ADRs — are optional and there for bigger or riskier efforts. Prefer sensible defaults and momentum over ceremony; a thin, correct context beats a thick, aspirational one. When in doubt, pick a reasonable default, write it down as an ADR so it can be revisited, and keep moving.

## What it produces

```
architecture/
├── README.md
├── system-context.md     # C4 level 1–2: actors, the system, external systems, containers, boundaries
├── tech-stack.md         # languages, frameworks + versions, infra, repo layout, conventions
├── constraints.md        # NFRs from requirements.md mapped to concrete architectural constraints
├── data-model.md         # key entities and relationships (a sketch, not a full schema)
├── threat-model.md       # lightweight STRIDE pass over the data flows (security)
├── decisions/
│   └── ADR-0001-<slug>.md  # one Architecture Decision Record per significant choice
└── build-context.md      # the concise brief an agent reads before building (seed of CLAUDE.md)
```

## Workflow

1. **Establish the landscape** — greenfield or an existing system? If existing, inspect the repo (languages, frameworks, folder structure, build/test config) and describe what's there before proposing change. Don't redesign what you haven't read.
2. **Draw the system context and its layers** — a C4-style view: the users/actors, the system itself, the external systems it talks to, and the major containers inside it (apps, services, datastores) with their responsibilities and boundaries. **Prompt for the layers, not just "front end" and "back end"** — at least UI, application/API, domain logic, data/persistence, external integrations, and cross-cutting (auth, config, logging). For a POC include only the layers it needs and keep them thin, but don't collapse domain logic into the UI or the controller. A mermaid diagram or a clear ASCII sketch is fine. See `references/c4-and-adr.md` and the "Layers" section of `references/stack-options.md`.
3. **Pin the tech stack and conventions** — languages and frameworks **with versions**, infrastructure, repo layout, naming, lint/format rules, and the **test framework** (this is what `bdd-to-tdd` detects; making it explicit here keeps the whole chain consistent). Choose from the candidate stacks in `references/stack-options.md` (React/Node, Next/Nest, .NET, Java); **default to React/Node + Material UI for an easy local POC when nothing is specified, but respect stated team/individual preferences.** Vague stack here breaks test generation and build later.
4. **Map the NFRs to constraints** — take performance, security, scale, availability, compliance, and cost targets from `requirements.md` and turn them into architectural constraints (e.g. "p95 < 500ms" → caching + read replica; "PII" → encryption at rest, data-residency boundary).
5. **Sketch the data model** — the key entities, their relationships, and ownership. Enough to ground the build, not a full physical schema.
6. **Threat-model the design (security)** — do a lightweight STRIDE pass over the data flows: what you're protecting, where data crosses trust boundaries, what could go wrong, and what you'll do about the threats that matter. For a junior POC this is a 10-minute skim of the top two or three risks (usually auth, cross-user data access, and secrets) — not an exhaustive assessment. Copy `assets/threat-model-template.md`; read `references/security.md`. The security requirements that fall out become non-functional requirements the build and tests enforce — this is the "security" half of the deck's "Architecture & security" step.
7. **Record decisions as ADRs** — for each significant choice (datastore, framework, sync vs async, monolith vs services, auth approach), write an ADR: context, the options considered, the decision, and the consequences (including what it costs you). Copy `assets/adr-template.md`. ADRs are how a future reader (human or agent) understands *why*, not just *what*.
8. **Write `build-context.md`** — a short, agent-ready brief: the stack and versions, the repo conventions, where code and tests live, the patterns to follow and the ones to avoid, and links to the rest of `architecture/`, the design system, and the feature files. Copy `assets/build-context-template.md`. Keep it tight — it is the thing the build agent should read first.

## Grounding the Claude Code build

`build-context.md` is written for an agent. Reference it from the repository's **`CLAUDE.md`** (Claude Code's project context file) — a one-line pointer like *"Before building, read `architecture/build-context.md` and `design-system/README.md`"* — so every build session starts grounded. Keep `build-context.md` current; it is cheaper to maintain than to re-explain the system each session.

## Quality bar

- Stack is pinned to **versions**; conventions and the test framework are explicit.
- Each significant decision has an ADR with options and consequences, not just an assertion.
- NFRs from the requirements are mapped to concrete constraints, not left as adjectives.
- An existing system is described as-is before any change is proposed.
- `build-context.md` is concise and actionable enough for an agent to build from without guessing.

## Anti-patterns

- **Architecture astronautics** — designing for imagined scale instead of the stated NFRs. Let `constraints.md` drive the design.
- **Decisions without rationale** — "we'll use X" with no context/consequences; a future reader can't tell if it still holds.
- **Vague stack** — "a modern JS framework" can't be detected or built against; name it and pin it.
- **Ignoring what exists** — proposing a greenfield design over a live system you didn't inspect.

## References
- `references/c4-and-adr.md` — the C4 levels (context/container/component) and the ADR format, with what to put at each level.
- `references/security.md` — a lightweight STRIDE threat-modelling pass and the baseline controls that become security requirements.
- `references/stack-options.md` — the candidate stacks (React/Node, Next/Nest, .NET, Java) and provider/host choices (e.g. Supabase in place of a hyperscaler), kept swappable.
