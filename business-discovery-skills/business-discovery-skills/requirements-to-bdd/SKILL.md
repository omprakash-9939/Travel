---
name: requirements-to-bdd
description: Convert agreed business requirements into BDD feature files (Gherkin), one per story, each cross-referencing the wireframe — then stop at a verification gate before any tests are written. Use this after a requirements brief exists, or whenever someone says "turn these requirements into BDD", "write feature files", "create Gherkin/scenarios", "spec the behaviour", "break this into stories", or wants behaviour specs from requirements and a wireframe. It writes separate `features/*.feature` files with declarative Given/When/Then, tags each scenario back to its requirement and wireframe screen, flags requirement↔wireframe gaps, and hands off to the `bdd-to-tdd` skill to scaffold failing tests only AFTER the human verifies the stories. It does not write tests itself.
---

# Requirements → BDD feature files

This skill is the bridge between *what the business needs* (the requirements brief) and *the executable behaviour spec* (BDD feature files). It turns each requirement into a separate, human-readable `.feature` file written in declarative Gherkin, anchored to the wireframe so behaviour and screen stay in lock-step.

It deliberately **stops before generating tests.** BDD stories are a shared artifact that the team — product, design, engineering — should read and agree on first. Only once they are verified does the `bdd-to-tdd` skill turn each file into a failing-first test suite. Generating tests from unverified stories just automates a misunderstanding.

## Inputs

- **`requirements.md`** — the output of the `requirements-brief` skill (functional requirements as user stories with acceptance criteria, plus non-functional requirements). If the requirements have been decomposed by `requirements-breakdown`, work from the **story files** (`requirements/stories/**`) — one approved story maps cleanly to one feature file. If there is no grounded requirements brief, run `requirements-brief` first; BDD written against vague requirements inherits the vagueness.
- **The wireframe** — an image (PNG/JPG/PDF), a Figma export/link, or an HTML mockup. `view` an image wireframe; read an HTML mockup's structure. If the requirements reference a wireframe that isn't attached or findable in the workspace, **ask for it — don't invent screens.** If there simply isn't a wireframe yet (common on a fresh POC), generate an HTML mockup from the story via the `design-system` skill, get the team to agree it, then write scenarios against *that* — don't write behaviour against screens nobody has seen.
- **The design system** *(if present)* — when a `design-system/` exists, phrase scenarios against its **real, named components and states** (default/loading/error/empty), so "Then I see the error state" maps to a specified thing the build and tests can bind to.
- Optionally `problem-statement.md` and `stakeholders.md` for context on intent and who defines success.

## Workflow

### 1. Read the requirements and the wireframe together

Pull the functional requirements (the user stories and their acceptance criteria) and the non-functional requirements. View/read the wireframe and note its screens, the elements on each, and the states it depicts (empty, loading, error, validation, success, disabled).

### 2. Decide feature boundaries

One `.feature` file per **cohesive capability** — usually one functional requirement, or a tight group that shares a screen and a user goal. Map each feature to the wireframe screen or flow it realises. Resist a single mega-file; separate files are the whole point (they are reviewable in isolation and feed `bdd-to-tdd` one screen at a time).

### 3. Write each feature file

Copy `assets/feature-template.feature` and fill it. Each file should have:

- **A cross-reference header** (comments): the source requirement ID(s), the wireframe screen/frame (path or Figma link), applicable non-functional requirements, MoSCoW priority, and a status line (`Draft — awaiting verification`).
- **Tags** for traceability and filtering: `@FR-3 @must @screen-checkout`.
- **`Feature:`** with the user story (`As a … I want … So that …`) taken from the requirement.
- **`Background:`** for shared preconditions, if any.
- **`Scenario:`** for each acceptance criterion, **plus** the states the wireframe shows that the criteria imply (don't ship a happy-path-only feature). Use **`Scenario Outline:` + `Examples:`** for data variations.

Write **declarative** Gherkin — describe behaviour and intent, not UI mechanics. "When I submit the registration form" not "When I click the button with id #reg-btn". The mechanics are the test layer's job (`bdd-to-tdd`), and keeping them out here keeps the story readable and stable. See `references/gherkin-style.md`.

### 4. Cross-reference and gap-check

This is where the value is. Confirm:
- Every **scenario** traces to an acceptance criterion or a wireframe state.
- Every **functional requirement** has a feature file.
- Flag **mismatches**: a requirement with no wireframe screen to bind to, or a wireframe screen no requirement covers. Surface these plainly rather than papering over them — they're usually a real gap in the requirements or the design.

Maintain a `features/README.md` index: a traceability table of requirement → feature file → scenarios → wireframe screen → status.

### 5. The verification gate — stop here

Present the feature files and the traceability table for review, and **do not write tests.** Ask the team to verify that each story is correct against the requirement and the wireframe. Make the next step explicit:

> "These are the BDD stories. Please verify them against the requirements and wireframe. Once you're happy, say the word and I'll use **bdd-to-tdd** to scaffold failing tests for each feature."

### 6. Handoff to tests (only after verification)

When the user confirms, hand each verified `.feature` file plus the wireframe to the **bdd-to-tdd** skill, one screen at a time, to generate the failing-first TDD suite. Update each feature's status header to `Verified → tests scaffolded`.

## File placement

If the project already has a feature-file convention (a `features/` dir, `*.feature` alongside specs, a `cucumber`/`behave`/`SpecFlow` setup), follow it. Otherwise create `features/<slug>.feature` at the repo root with the `features/README.md` index. Cross-link the index from `docs/discovery/<initiative>/README.md` so discovery and behaviour specs connect.

## Quality bar

- One cohesive capability per file; separate files, not a monolith.
- Declarative Gherkin (behaviour, not selectors or clicks).
- States covered (error/empty/loading/validation), not just the happy path.
- Every scenario tagged and traceable to a requirement and a wireframe screen.
- Requirement↔wireframe gaps flagged, not hidden.
- No invented behaviour — if requirements/wireframe under-specify, write the scenario and list the assumption.
- Tests are **not** generated here; that waits for verification + `bdd-to-tdd`.

## Anti-patterns

- **Imperative, UI-coupled steps** ("click", "the div with class…") — brittle and unreadable; keep mechanics in the test layer.
- **One giant feature file** — defeats per-screen review and the handoff to `bdd-to-tdd`.
- **Happy-path-only** — the wireframe's error and empty states are behaviour too.
- **Auto-generating tests** — the verification gate exists for a reason; respect it.
