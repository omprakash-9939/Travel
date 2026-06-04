---
name: bdd-to-tdd
description: Turn a BDD story plus a wireframe (and optional HTML mockup) into a runnable, failing-first TDD test suite for a single screen or component, inside a VSCode workspace. Use this whenever the user has a Gherkin/Given-When-Then story, acceptance criteria, a feature file, a wireframe image, a Figma export, or an HTML mockup and wants tests scaffolded for a screen, page, view, or component — even if they just say "write tests for this screen", "scaffold tests from this feature file", "turn these acceptance criteria into tests", or "TDD this mockup". Trigger it for any request that connects a behaviour spec or visual reference to test generation, including React/Vue/Svelte/Angular component tests and Playwright/Cypress end-to-end tests.
---

# BDD story + wireframe → TDD tests

This skill converts behaviour specifications and visual references into a **failing-first** test suite for one screen. It exists because the gap between "here's what the screen should do" (BDD) and "here are the tests that drive building it" (TDD) is where most teams lose traceability. The job here is to close that gap precisely: every test should trace back to a Gherkin step or an element in the wireframe, and the suite should fail meaningfully before any implementation exists — that's the **red** phase of red-green-refactor.

You are not building the screen. You are building the tests that will tell someone when they've built it correctly.

## Inputs you'll be given

Some combination of:
- **A BDD story** — a `.feature` file, pasted Gherkin (`Feature:` / `Scenario:` / `Given`/`When`/`Then`), or looser acceptance criteria in prose.
- **A wireframe** — an image (PNG/JPG/PDF), a Figma export, or a verbal description of the layout.
- **An HTML mockup (optional)** — static HTML/CSS that approximates the screen. This is the most useful input when present, because it gives you real, concrete selectors and structure to write queries against.

If a wireframe image is referenced but not actually attached, say so and ask for it — don't invent a layout. **If there's no wireframe at all yet — common on a fresh, build-it-from-scratch POC — don't stall, and don't quietly invent one: generate a quick HTML mockup from the story first (the `design-system` skill does this), show it to the team to react to, and use that agreed mockup as the visual reference.** If only some inputs are present, work with what you have and flag what's missing in the final summary.

## Workflow

Follow these steps in order. Don't skip the stack-detection step — generating Jest tests into a Vitest project (or vice versa) is the most common way this goes wrong.

### 1. Locate and read every input

Find the feature file / Gherkin, the wireframe, and the mockup in the workspace/repo (and any files the user has attached to the session). For an image wireframe, actually `view` it. For an HTML mockup, read the markup and note the real element structure — tags, `id`s, `class`es, any existing `data-testid`, form fields, button text, headings.

### 2. Detect the test stack — do not assume

Inspect the workspace before writing a single line. Read `package.json` (dependencies + the `scripts` block), and look for config files: `jest.config.*`, `vitest.config.*`, `playwright.config.*`, `cypress.config.*`, `setupTests.*`. This tells you the runner, the assertion style, the component-testing library, and where tests are expected to live.

Read `references/frameworks.md` for the detection table and the exact idioms, imports, and file placement for whatever you find. If the project has **both** a component runner (Jest/Vitest) and an e2e runner (Playwright/Cypress), split the work: scenario-level acceptance flows usually belong in e2e, fine-grained element/state behaviour in component tests. If detection is genuinely ambiguous or the workspace is empty, ask the user which framework they want rather than guessing.

### 3. Parse the BDD story into a scenario list

Extract the `Feature`, every `Scenario` (and `Scenario Outline` with its `Examples` table), and the ordered `Given`/`When`/`Then`/`And`/`But` steps. Each scenario becomes one test (`it`/`test`) inside a `describe` named for the feature or screen. `Scenario Outline` examples become a parameterised test (`it.each` / `test.each`). Read `references/bdd-to-test-mapping.md` for the mapping rules and how Given/When/Then map onto arrange/act/assert. If the input is loose prose rather than Gherkin, first restate it as explicit scenarios in your head (or in a comment block) before mapping.

### 4. Build a screen contract from the wireframe + mockup

Produce an internal inventory of the UI: every interactive and asserted element, its accessible role and name, its states (empty/loading/error/success/disabled), and the interactions on it. Cross-reference this against the BDD steps — a "Then I should see an error message" step needs a corresponding element in the contract. If the BDD story references something with no home in the wireframe, flag the mismatch; if the wireframe shows something no scenario covers, note it as an untested element. Read `references/wireframe-analysis.md` for how to extract this from an image versus an HTML mockup, and how to choose query strategies.

### 5. Write the tests — failing first, traceable, accessible

Generate the test file(s) using the detected framework's idioms. Hold to these principles:

- **Red on purpose.** Tests must reference the screen/component as if it already exists and assert real behaviour, so they fail because the implementation is missing — not because of a typo or a trivially-true assertion. Never write a test that passes against an empty implementation. No `expect(true).toBe(true)` placeholders.
- **One scenario, one test.** Keep the Given/When/Then structure visible — either as arrange/act/assert blocks with comments echoing the Gherkin, or as nested structure. A reader should map test ↔ scenario at a glance.
- **Query like a user.** Prefer accessible queries (`getByRole`, `getByLabelText`, `getByText`) over `data-testid`, and `data-testid` over CSS/class selectors. Derive the query targets from the mockup's real structure when you have it. Where a needed hook is missing from the mockup, add a short "implementation notes" list of the `data-testid`s or roles the implementation should expose, rather than silently inventing brittle selectors.
- **Trace every test.** Annotate each test with the scenario it came from (e.g. a comment `// Scenario: Traveller searches with no destination`). This is what makes the suite auditable against the story.
- **Cover the states, not just the happy path.** Pull loading/error/empty/validation cases from both the scenarios and the wireframe states.
- **Mock the edges, exercise the core.** Stub the expensive or external collaborators (third-party APIs, payments, email) so tests are fast and deterministic, but let tests drive the real behaviour of the thing under test. Note in each test what is mocked. See `../build-implementation/references/mock-vs-real.md`.

### 6. Place files correctly and report

Write test files where the project's convention puts them (co-located `*.test.tsx`, a `__tests__/` dir, `e2e/` / `cypress/e2e/` — `references/frameworks.md` has the conventions). The test files belong in the repo alongside the code they'll drive, committed like any other source.

Then give a concise summary containing: the framework(s) you targeted and why; a **traceability table** mapping each scenario → test name → primary UI element; the implementation notes (test IDs/roles to add); any BDD↔wireframe mismatches you found; and the exact command to run the tests (e.g. `npm test`, `npx playwright test`).

### 7. Run, identify red vs green, and hand to a human

Run the suite and report the **red/green status** plainly: how many tests, how many are **red** (failing), and confirm they are red *for the right reason* — the implementation doesn't exist yet, not a typo or a broken import. For a POC, every new test should be red here; a test that is already green before any code is written is a smell (it's probably trivially true), so flag it.

Then stop for a **human review of the red tests** — this is a checkpoint, not a formality. A person checks: do these tests assert the behaviour the story actually wants? Are they meaningful (would they fail if the feature were wrong)? Is the right thing mocked and the core exercised for real? Only once a human is happy with the red tests does the build (`build-implementation`) begin turning them green. Reviewing the tests *before* code is written is the cheapest moment to catch a misunderstanding.

See `references/red-green-and-review.md` for what a good red test looks like and the review checklist.

## A note on scope and honesty

If something doesn't line up — a scenario with no UI to bind to, a wireframe state no scenario describes, an HTML mockup that contradicts the Gherkin — surface it plainly. The value of this skill is a test suite the team can trust, and a quietly-papered-over gap is worse than a flagged one. When the inputs under-specify behaviour (timing, exact copy, edge counts), make a reasonable choice, write the test, and list the assumption so it can be corrected.

## Reference files

- `references/frameworks.md` — Stack detection table; per-framework imports, idioms, render/query helpers, async patterns, and file-placement conventions for Jest+RTL, Vitest+RTL, Playwright, Cypress, and Vue/Svelte/Angular variants.
- `references/bdd-to-test-mapping.md` — Rules for turning Feature/Scenario/Outline/Given-When-Then into describe/it/each and arrange-act-assert, with worked examples.
- `references/wireframe-analysis.md` — Extracting a screen contract from an image wireframe vs. an HTML mockup, and choosing query strategies (role > label > testid > css).
- `assets/templates/` — Starter test scaffolds (`rtl.test.tsx`, `playwright.spec.ts`, `cypress.cy.ts`) to adapt rather than write from scratch.
