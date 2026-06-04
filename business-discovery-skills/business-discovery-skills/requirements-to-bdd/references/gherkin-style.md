# Writing good Gherkin, and tying it to the wireframe

Read this when authoring `.feature` files so the stories are readable, stable, and traceable.

## Declarative, not imperative

Gherkin should describe **what** the user is trying to do and **what** they observe — not the mechanics of how. Mechanics belong in the test layer (`bdd-to-tdd`), where they can change without rewriting the story.

**Imperative (avoid):**
```gherkin
When I click the "#origin" input
And I type "LHR"
And I click the button with class ".search-btn"
Then the div "#results" should contain 5 rows
```

**Declarative (prefer):**
```gherkin
When I search a route with available flights
Then I see the matching fares ordered by price
```

The declarative version survives a redesign; the imperative one breaks the moment a class name changes, and it reads like a test, not a behaviour.

## One capability per feature

A `Feature:` is a single cohesive capability tied to a screen or flow — "Search flights", "Hold a fare", "Pay and confirm a booking". If a feature file needs the word "and" in its title, or covers two screens, split it. Separate files are reviewable on their own and feed `bdd-to-tdd` one screen at a time.

## Cover the states the wireframe shows

A wireframe usually depicts more than the happy path: empty, loading, error, validation, disabled, success. Each visible state that the requirement implies is behaviour, and deserves a scenario. A feature with only the happy path is under-specified.

## Scenario Outline for variations

When the same behaviour varies by input, use an Outline with an Examples table rather than copy-pasting scenarios:

```gherkin
Scenario Outline: Search by cabin and passengers
  When I search "<cabin>" for "<pax>" passengers
  Then the fares shown match "<cabin>" and are priced for "<pax>"

  Examples:
    | cabin    | pax |
    | Economy  | 1   |
    | Business | 2   |
```

## Tags and traceability

Tag every feature so it can be filtered and traced:
- `@FR-3` — the source requirement ID (matches `requirements.md`).
- `@must` / `@should` / `@could` — MoSCoW priority.
- `@screen-flight-search` — the wireframe screen it realises.

Keep a `features/README.md` index with a table: **Requirement → Feature file → Scenarios → Wireframe screen → Status.** This is what lets anyone confirm coverage at a glance and is the audit trail from business need to behaviour.

## Cross-referencing the wireframe

Each feature file's header names the wireframe screen/frame (a path or Figma link). When building scenarios:
- For an **image/Figma** wireframe: read off the elements and the states shown; each asserted "Then" should correspond to something the screen can actually display.
- For an **HTML mockup**: the structure gives you concrete behaviour to describe (forms, fields, messages) — but still phrase scenarios declaratively; the mockup's selectors are for the test layer, not the story.
- **Gap-check both ways:** a requirement with no screen to bind to, or a screen state no scenario covers, is a finding. Record it in the index and raise it, rather than inventing behaviour to fill the hole.

## Common smells

- **Conjunction steps** — a single `When` doing three things; split or move setup to `Background`.
- **Assertion-free scenarios** — a scenario with no `Then` asserts nothing.
- **Incidental detail** — exact pixel positions, colours, copy you're guessing at. If the requirement doesn't fix it, don't assert it; list it as an assumption.
- **Test-speak** — `data-testid`, CSS selectors, HTTP status codes in the story. Those are `bdd-to-tdd`'s concern.
