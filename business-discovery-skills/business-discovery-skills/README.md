# Business Discovery Skills

A set of seventeen Claude skills that take a team from a vague idea all the way to a deployed proof of concept, following a **FRAME → SPECIFY → SHIP** build flow. They were built for the **DataArt travel practice**, so the worked examples are all travel-technology (flights, hotels, bookings, fares, itineraries). They are designed to be used with an agent (e.g. Claude Code in VS Code): a team member describes an idea or request, the agent triggers the right skill, asks the right questions, and writes structured, version-controlled artifacts into the repository.

The skills encode a simple discipline: *identify the problem before jumping to solutions*, don't start building until the problem is grounded and the requirements are testable, don't write tests until the behaviour stories have been verified by a human, give the build agent real architectural, security, and design context so it doesn't guess — and keep the whole thing **un-coupled from any single platform or stack**. Working software beats a perfect plan.

## The skills

| Skill | What it does | Artifact it produces |
|---|---|---|
| **build-blueprint** | The master flow: orchestrates all the skills below across FRAME → SPECIFY → SHIP. Trigger it to structure a whole build from idea to deployed. | the plan / sequence (uses the others' artifacts) |
| **discovery-workflow** | Sequences the discovery skills into one repeatable discovery, with a readiness gate. | `README.md` index in the discovery folder |
| **problem-framing** | Turns a vague ask or a proposed solution into a precise, measurable, solution-neutral problem statement. | `problem-statement.md` |
| **root-cause-analysis** | Tests whether the problem is a root cause or a symptom (5 Whys + cause tree, grounded in evidence). | `root-cause.md` |
| **stakeholder-mapping** | Establishes who decides, who's affected, and what success means to each. | `stakeholders.md` |
| **business-case** | Sizes the prize and weighs cost, benefit, and payback against doing nothing. | `business-case.md` |
| **repo-setup** | Scaffolds the repo structure and conventions for the chosen stack, and seeds the agent's `CLAUDE.md`. | repo scaffold + `CLAUDE.md` |
| **requirements-brief** | Synthesises everything into a structured requirements doc with testable acceptance criteria and a readiness gate. | `requirements.md` |
| **requirements-breakdown** | Explodes the brief into epics → stories → functions, each in its own file with an owner and status, so the team reviews in parallel without conflict. | `requirements/epics|stories|functions/` |
| **architecture-grounding** | Captures the technical context — system context, stack + conventions, NFR constraints, data model, **threat model (security)**, ADRs — and a concise build brief an agent reads first. | `architecture/` (incl. `threat-model.md`, `build-context.md`, ADRs) |
| **design-system** | Grounds the UI in real tokens, components (with states), patterns, and an accessibility standard; references the source of truth (Figma/Storybook/library). | `design-system/` |
| **requirements-to-bdd** | Turns agreed stories into BDD feature files (Gherkin), one per story, cross-referencing the wireframe and design system; stops at a verification gate. | `features/*.feature` |
| **bdd-to-tdd** | Turns a verified feature file + wireframe into a failing-first TDD test suite for that screen, in the project's test framework. | test files (`*.test.tsx`, `e2e/`, etc.) |
| **build-implementation** | Implements the POC against the failing tests, one story at a time (red → green → refactor), grounded by build-context and the design system. | working code, tests passing |
| **data-and-auth** | Sets up database + auth via a managed service (Supabase or similar) or your own, kept behind a swappable layer. | schema, migrations, auth |
| **deploy** | Containerizes and ships the POC to a host (Fly.io or similar), config via env, tests gating the deploy — portable, no lock-in. | a running deployment |
| **expert-review** | Puts the agent in an expert role — architect, DBA, or a configurable domain SME (travel tech as the example) — to review an artifact and produce a findings + verdict report. Advisory; a human signs off. | a review doc (`*/reviews/*.md`) |

They are independent — any one can trigger on its own — but **build-blueprint** ties them into the full FRAME → SPECIFY → SHIP flow below.

## The build flow — FRAME → SPECIFY → SHIP

`build-blueprint` runs this nine-step flow from idea to deployed (the structure the project's reference deck lays out). Each step is a skill; each step's artifact grounds the next.

```
FRAME — get the why and the shape right
  1  Define the why          → discovery-workflow      → discovery docs + requirements readiness
  2  Set up the repo         → repo-setup              → repo scaffold + CLAUDE.md
  3  Design the UI           → design-system (+wireframe) → design-system/

SPECIFY — turn intent into a buildable spec
  4  Requirements (BDD)      → requirements-brief → -breakdown → -to-bdd
                                                       → requirements/ + features/*.feature
       └─ review gate (per-file, parallel) ──┘   └── human verification gate ──┐
  5  Architecture & security → architecture-grounding  → architecture/ (threat-model, build-context)
  6  Plan & test design      → bdd-to-tdd              → failing-first tests  ◄─ verification gate

SHIP — make it real
  7  Build                   → build-implementation    → working code (red → green → refactor)
  8  Data & auth             → data-and-auth           → schema + auth (Supabase or similar)
  9  Deploy                  → deploy                  → running POC (containerized, portable)
```

Gates shape it: a **review gate** (decomposed files let reviewers work in parallel without conflict), a **human verification gate** (behaviour stories are confirmed before any tests are written), a **red-test review** (a human checks the failing tests test the right thing before building), and a **green-build review** (a human checks the feature actually works, not just that tests pass). Tests then gate the deploy.

**Calibrated for a junior-led POC.** This is built for small teams and juniors building a proof of concept, often with no architect — so the defaults are deliberately light: lightweight architecture (a short build-context, not an enterprise pack), a *minimal* accessibility baseline prompted upfront, red/green tests with a human review on each side, and a clear mock-vs-real split (the core domain is real in a database so the demo convinces; expensive edges are mocked behind a thin interface). Optional **expert reviews** (architect, DBA, or a configurable domain SME — travel technology is the worked example) give a second opinion where the project is unfamiliar or the data model is non-trivial; they're advisory and a human signs off. The aim is as much **educational** as delivery: the team goes through *every* step and produces a thin version of each asset, so they feel the full shape of building software properly and realise that in a larger project each step is a thorough discipline. Build everything light; review quickly; see how much there is to it. Depth where the risk is; momentum everywhere else.

## Staying un-coupled

The flow is deliberately not tied to one platform or stack:

- **Agent-portable** — these are plain Agent Skills in the open [`agentskills.io`](https://agentskills.io) format, so they work with Claude Code and other agents. The build step uses an agentic coding tool (Claude Code is the natural fit) but nothing is locked to it.
- **Stack-agnostic, with a sensible default** — choose per project: React/Node (Next.js, NestJS), .NET, or Java. When nothing is specified the skills **default to React + Node with Material UI** for an easy local POC (Vite or Next), while respecting stated preferences (the team runs Nest/Next). They also prompt for the **layers** — UI / application / domain / data / integrations / cross-cutting — not just front-end and back-end, kept to what the POC needs. See `architecture-grounding/references/stack-options.md`.
- **Service- and host-agnostic** — use a managed backend like Supabase (Postgres + auth) **in place of a hyperscaler**, kept behind a swappable data/auth layer (`data-and-auth`); deploy via containers to Fly.io or any host (`deploy`).

## Installing in Claude Code (VS Code)

Claude Code auto-discovers skills from a `skills` folder. To share them with the whole team, commit them into the repository:

```
<your-repo>/
└── .claude/
    └── skills/
        ├── build-blueprint/
        ├── discovery-workflow/
        ├── problem-framing/
        ├── root-cause-analysis/
        ├── stakeholder-mapping/
        ├── business-case/
        ├── repo-setup/
        ├── requirements-brief/
        ├── requirements-breakdown/
        ├── architecture-grounding/
        ├── design-system/
        ├── requirements-to-bdd/
        ├── bdd-to-tdd/
        ├── build-implementation/
        ├── data-and-auth/
        ├── deploy/
        └── expert-review/
```

1. Unzip this bundle.
2. Copy the seventeen skill folders into `.claude/skills/` at your repo root (create the folders if needed).
3. Commit them, so every teammate using Claude Code in that repo gets them automatically.
4. To make them available across all your projects instead, copy them to your personal skills directory (`~/.claude/skills/`).

Each skill is a folder containing a `SKILL.md`; the agent reads the `assets/` templates and `references/` files only when it needs them. No build step, no dependencies. (Skill discovery paths can vary by Claude Code version — if they don't appear, check your version's docs for the skills directory.)

## How a session looks

> **Teammate:** "We want to build a self-service flight-rebooking tool."
>
> **Agent (discovery-workflow + problem-framing):** "Happy to spec that. Before we design the rebooking tool, let's ground the problem. What happens today when a traveller's flight is changed or cancelled — how many call the contact centre, how long does a rebooking take, what does it cost? How do we know?"
>
> …a short, guided conversation later, the repo has:
>
> ```
> docs/discovery/flight-rebooking/
> ├── README.md
> ├── problem-statement.md
> ├── root-cause.md
> ├── stakeholders.md
> ├── business-case.md
> └── requirements.md
> ```
>
> …with a readiness gate at the bottom of `requirements.md` saying either "ready to build" or "not yet — here's the gap."

## Conventions

- **Artifacts live in the repo**, so everything is reviewed and versioned like code. Discovery docs sit under `docs/discovery/<initiative-name>/`; the build-facing artifacts sit where the team and tools expect them (`requirements/`, `architecture/`, `design-system/`, `features/`, and tests). Each skill follows your project's existing convention if it finds one.
- **The agent drives with questions**, one topic at a time, and writes the artifacts — it never hands over a blank form.
- **Assumptions are explicit.** Anything unconfirmed is flagged, not stated as fact.
- **Effort is proportional.** Small, well-understood changes get a light pass; big or contested ones get the full workflow. Problem-framing always happens.

## Grounding the Claude Code build

The end of the pipeline is a build. To keep an agent on the rails, point the repo's **`CLAUDE.md`** at the grounding artifacts, e.g.:

```
Before building, read architecture/build-context.md and design-system/README.md.
Build against the verified features/*.feature and make the existing tests pass.
```

That single pointer means every build session starts with the stack, conventions, design system, agreed behaviour, and failing tests already in context — instead of the agent guessing.

## Further skills worth adding (public repos)

These existing public skills complement this collection rather than duplicate it. Skills can execute code, so install only from sources you trust and review each `SKILL.md` (and any scripts) first.

- **Official Anthropic skills** — `github.com/anthropics/skills`. Document skills (DOCX/PDF/PPTX/XLSX) and brand guidelines; handy for turning the discovery and requirements docs into polished deliverables. It's also a Claude Code plugin marketplace (`/plugin marketplace add` the repo, then `/plugin install document-skills`).
- **Curated indexes to browse** — `github.com/VoltAgent/awesome-agent-skills` (1000+ skills from official teams: Vercel, Stripe, Cloudflare, Figma, Trail of Bits, Sentry…) and `github.com/karanb192/awesome-claude-skills` (community-verified, dev-focused: TDD, debugging, git).
- **Frontend / design** — Vercel Labs' web design guidelines and React best-practice skills pair naturally with the `design-system` skill (this one holds your project tokens and source-of-truth links; theirs hold the concrete styling and React rules). A Figma skill is useful for importing wireframes/designs.
- **Security review** — Trail of Bits' static-analysis skills (CodeQL / Semgrep) for auditing the build before and after Claude Code writes it.
- **Engineering workflow** — `github.com/obra/superpowers` (battle-tested skills including a thorough TDD workflow), plus community code-review, debugging, and git-workflow skills.
- **The standard** — `agentskills.io` / `github.com/agentskills/agentskills`. The open Agent Skills format, so these skills also work in Cursor, Codex, Gemini CLI, and other agents — useful if your team isn't only on Claude Code.

Gaps in *this* pipeline you might add next: a **validation / experiment** skill (test the riskiest assumptions before building), a **code-review** skill tuned to your conventions, a **release / changelog** skill, and a **security-and-privacy review** step between tests and build.

## Customising

These are plain Markdown. Adapt freely: change the artifact location, add fields your team needs (e.g. a "Definition of Ready" you already use), tune the non-functional checklist to your stack, or adjust the descriptions if the skills trigger too eagerly or not enough. The `description` field in each `SKILL.md` is what controls when the agent reaches for it.
