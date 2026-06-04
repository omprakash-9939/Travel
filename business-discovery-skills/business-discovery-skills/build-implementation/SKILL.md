---
name: build-implementation
description: Implement the proof of concept with an agent (e.g. Claude Code), one story at a time, against the failing tests and the grounded context — red → green → refactor. Use this for the SHIP/build step, or whenever someone says "build it", "implement this", "make the tests pass", "build with Claude Code", "write the feature", or is ready to turn verified specs and failing tests into working software. It reads the grounding first (build-context, design system, the feature file, the tests), implements the minimum to pass, refactors, and keeps every change traceable to a story. Stack- and tool-agnostic; favours a working POC over gold-plating.
---

# Build Implementation

This is where verified behaviour becomes working software. The discipline is simple and strict: **build to the tests.** Take one story, run its failing tests, write the least code that makes them pass, refactor, and move on. The earlier steps exist so that by the time you reach here, the agent is building against agreed behaviour and real context — not guessing.

It works with any agentic coding tool; Claude Code is the natural fit. Keep the POC ethos: implement what the story needs, not everything it might one day want.

## Read the grounding first

Before writing code, load the context (this is what keeps the build on the rails):
- `architecture/build-context.md` — stack, conventions, where code and tests live, patterns to follow/avoid.
- `design-system/` — the components, states, and accessibility standard to build the UI from.
- The **verified** `features/*.feature` for the story, and its **failing tests**.
- `architecture/constraints.md` and `architecture/threat-model.md` — the non-functional and security constraints every change must respect.
- The story file in `requirements/stories/…` for acceptance criteria and traceability.

## Decide what's real vs mocked (once, up front)

Before building, decide — and write down — what the POC does for real and what it mocks. The default: **the core domain is real and lives in the database** (so the demo persists and feels genuine), while **external or expensive services are mocked** behind a thin interface (third-party APIs, payments, email). Keep the demo's happy path real end to end. Record the split in `architecture/build-context.md` so it's honest and no one mistakes the POC for finished. See `references/mock-vs-real.md`.

## The loop (per story)

1. **Pick one story/feature.** Smallest valuable slice; don't batch.
2. **Red.** Run its tests; confirm they fail for the right reason (missing implementation, not a typo).
3. **Green.** Write the minimum code to make them pass. Use the design system's components and states; follow the repo conventions; honour the architecture and security constraints.
4. **Refactor.** Clean up with the tests green — names, duplication, structure. Keep the tests passing.
5. **Commit — small and often.** Commit each slice the moment its tests are green, referencing the story id; don't let work pile up into one big commit. One logical change per commit, message says _why_, no secrets. Update the story's status (e.g. → Built).
6. **Repeat** for the next story. Keep the whole suite green as you go.

When a story (or a small batch) goes green, **pause for a human to review the green build** — not just that the tests pass, but that the feature actually works when run, that no test was weakened to force green, and that the real-vs-mock split is honest (the demo path works for real). Report the red/green status at each pause: how many tests, how many green, how many still red and why. This human check on green is the partner to the human check on the red tests in `bdd-to-tdd`.

## Principles

- **Traceability.** Every change maps to a story and the behaviour it satisfies. No orphan code.
- **Tests are the definition of done.** Don't mark a story done with a red test; don't weaken a test to make it pass.
- **Use the design system.** Compose from the inventory; don't invent one-off UI that drifts from the system.
- **Respect the constraints.** Performance, accessibility, and the threats in the threat model are part of "working", not a later pass.
- **POC discipline.** Build what the story needs. Note future ideas; don't gold-plate them in.
- **Surface mismatches.** If a test, a feature file, and the design system disagree, stop and flag it rather than guessing — the spec is the contract.

## Quality bar

- The story's tests pass, and the full suite is still green.
- Code follows the repo conventions and composes from the design system.
- Architecture/security constraints are respected.
- Commits are small and traceable to story ids.
- Nothing built beyond the story's scope without a note.

## Anti-patterns

- **Building ahead of the tests** (or without them) — you lose the safety net and the definition of done.
- **Weakening tests to get green** — that hides the gap instead of closing it.
- **Ignoring the grounding** — re-deriving the stack/conventions/UI per session causes drift.
- **Gold-plating** — a POC ships the slice; extra polish is scope you didn't agree.
