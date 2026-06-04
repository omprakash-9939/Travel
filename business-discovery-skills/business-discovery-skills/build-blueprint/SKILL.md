---
name: build-blueprint
description: The master flow for taking a project from idea to deployed with an agent, structured as FRAME → SPECIFY → SHIP across nine steps. Use this at the very start of a build project, or whenever someone says "let's build this", "structure the build", "from idea to deployed", "build a proof of concept / POC", "agentic SDLC", "how should we approach building X", or wants the end-to-end shape of the work. It sequences the other skills in this collection — one per step — and keeps the project moving from why, through specification, to a deployed POC. It is deliberately platform- and stack-agnostic: pick the stack and services per project. Working software beats a perfect plan.
---

# Build Blueprint — idea to deployed, with an agent

This is the spine of the whole collection: a repeatable flow for building a working proof of concept with an agent, in three phases — **FRAME, SPECIFY, SHIP** — across nine steps. Each step has a dedicated skill that does the detailed work; this skill's job is to know the order, keep momentum, and make sure each step's artifact grounds the next.

The guiding ethos: **turn an idea into something real and deployable. Working software beats a perfect plan.** Aim for a POC you can demo, not a cathedral. Be proportional — depth where the risk is, speed everywhere else.

This is for the **DataArt travel practice**, so the POC is a travel-technology product and every example, requirement, and feature is in a travel context (flights, hotels, bookings, fares, itineraries, travellers).

## The flow

### FRAME — get the why and the shape right
1. **Define the why** → `discovery-workflow` (problem-framing, root-cause, stakeholders, business-case). *The problem, the audience, the point.* → discovery artifacts + `requirements.md`-readiness.
2. **Set up the repo** → `repo-setup`. *Scaffold the structure and conventions; seed the agent's context.* → scaffolded repo + `CLAUDE.md`.
3. **Design the UI** → `design-system` (+ the wireframe). *Sketch screens and flows; ground them in tokens, components, states.* → `design-system/`.

### SPECIFY — turn intent into a buildable spec
4. **Requirements (BDD)** → `requirements-brief` → `requirements-breakdown` → `requirements-to-bdd`. *Behaviour in plain language; decomposed for parallel review; written as feature files.* → `requirements/…`, `features/*.feature`.
5. **Architecture & security** → `architecture-grounding`. *Layers, the data model, the stack, threats, and the functional/non-functional needs.* → `architecture/` incl. `threat-model.md` and `build-context.md`.
6. **Plan & test design (TDD)** → `bdd-to-tdd`. *Plan the work; write the tests first, failing.* → failing-first tests (after the verification gate).

### SHIP — make it real
7. **Build** → `build-implementation`. *Implement the POC against the failing tests, one story at a time (red → green → refactor).* → working code, tests passing.
8. **Data & auth** → `data-and-auth`. *Database and login via a managed service or your own — provider-agnostic.* → schema, migrations, auth.
9. **Deploy** → `deploy`. *Ship the POC to a host, reproducibly and without lock-in.* → a running deployment.

## One-page map

| Phase | # | Step | Skill | Main artifact |
|---|---|---|---|---|
| FRAME | 1 | Define the why | discovery-workflow | discovery docs + requirements readiness |
| FRAME | 2 | Set up the repo | repo-setup | repo scaffold + CLAUDE.md |
| FRAME | 3 | Design the UI | design-system | design-system/ |
| SPECIFY | 4 | Requirements (BDD) | requirements-brief → -breakdown → -to-bdd | requirements/ + features/*.feature |
| SPECIFY | 5 | Architecture & security | architecture-grounding | architecture/ (+ threat-model, build-context) |
| SPECIFY | 6 | Plan & test design | bdd-to-tdd | failing-first tests |
| SHIP | 7 | Build | build-implementation | working code |
| SHIP | 8 | Data & auth | data-and-auth | schema + auth |
| SHIP | 9 | Deploy | deploy | running POC |

## Gates that carry through the flow

- **Review gate** (step 4) — `requirements-breakdown` gives each reviewer their own files, so the team reviews in parallel without conflict.
- **Verification gate** (between 4 and 6) — feature files are confirmed by a human before any tests are written.
- **Red-test review** (step 6) — a human reviews the failing tests *before* building: do they test the right behaviour, and is the right thing mocked? Cheapest moment to catch a misunderstanding.
- **Green-build review** (step 7) — a human reviews the passing build: does the feature actually work when run, were no tests weakened, is the real-vs-mock split honest? Passing tests are necessary, not sufficient.
- **Deploy gate** (step 9) — tests gate the deploy.

## Calibrate to a junior-led POC

This flow is built for small teams and **juniors building a proof of concept, often with no dedicated architect.** Keep the bar appropriate — *working software beats a perfect plan* — and lean on these defaults rather than ceremony:

- **Architecture:** lightweight. A short `build-context.md`, one or two decisions, and a 10-minute security skim is enough; no architect required. (`architecture-grounding` has a POC mode.)
- **Accessibility:** prompt for it **upfront** but keep it **minimal** — semantic HTML, labels, keyboard, visible focus, readable contrast. Full WCAG AA is an optional stretch, not a gate. (`design-system`.)
- **Tests:** write them first and **red**; identify red vs green explicitly; a **human reviews the red tests** before building and the **green build** after. Build to green; don't weaken tests to get there. (`bdd-to-tdd`, `build-implementation`.)
- **Mock vs real:** make the **core domain real in a database** so the demo persists and convinces; **mock the expensive edges** (third-party APIs, payments, email) behind a thin interface, and write down what's mocked. (`build-implementation/references/mock-vs-real.md`.)

Depth where the risk is; momentum everywhere else. If a step is overkill for the POC, lighten it — but always frame the why, always build to reviewed tests, and always keep the demo path real.

## What going through this teaches

The aim of running the whole flow is as much **educational** as it is to ship the POC. The team should **go through each step and actually produce each asset** — problem statement, requirements, stories, architecture, design system, feature files, tests, build, deploy — so they *feel the full shape* of building software properly and come away realising **how much there is to it.**

So: have them build every artifact, but **keep each one light, and keep reviews quick** — a junior team isn't expected to review in depth here. The value is the realisation that *in a larger project each of these steps is a serious, thorough discipline* with its own experts and far more rigor. The rubrics and templates deliberately show that fuller depth (e.g. the expert-review rubrics) so the team can see what "done properly" looks like, even while doing a light version today. Producing a thin version of everything beats producing a perfect version of one thing and never seeing the rest.

## Expert reviews (advisory; a human signs off)

At a few points it's worth a second opinion from a specific expert lens, via the `expert-review` skill. These are advisory — the expert recommends, a **human signs off** — and POC-calibrated, so they flag what matters rather than imposing production rigor:

- **Domain SME** — reviews the requirements and specs for domain realism (step 4–5). Configurable per domain; travel technology is the worked example.
- **Architect** — reviews the architecture and plan for soundness and proportionality (step 5).
- **DBA** — reviews the data model and schema (steps 5 and 8).

Use them where the project is unfamiliar or the data model is non-trivial; skip them for a tiny, obvious POC.

## Stay un-coupled

This flow is intentionally not tied to one platform or stack:

- **Agent-portable.** These are plain Agent Skills (the open `agentskills.io` format), so the flow works with Claude Code and other agents. The build step uses an agentic coding tool (Claude Code is the natural fit) but nothing here is locked to it.
- **Stack-agnostic, with a sensible default.** Choose per project: React/Node (Next.js full-stack, NestJS API), .NET (ASP.NET Core), or Java (Spring Boot). When nothing is specified, **default to React + Node with Material UI** for an easy local POC (Vite for a simple SPA, Next.js for full-stack) — but respect stated team/individual preferences (the team runs Nest/Next). Prompt for the **layers**, not just front-end and back-end (UI / application / domain / data / integrations / cross-cutting), and keep only the ones the POC needs. See `../architecture-grounding/references/stack-options.md`.
- **Service-agnostic.** Use a managed backend like Supabase (Postgres + auth) in place of a hyperscaler, or your own — kept behind a thin data/auth layer so it can be swapped (`data-and-auth`). Hosts likewise are pluggable (`deploy`).

## How to use it

Work out where the project is and run the next step's skill; don't skip framing, and don't start building before the behaviour is verified and the tests are red. Keep every artifact in the repo so the work is reviewable and the build agent stays grounded. If a step is overkill for a small POC, lighten it — but always frame the why and always build to tests.
