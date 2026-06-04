# Building a screen contract from a wireframe / mockup

The "screen contract" is the bridge between visuals and tests: a structured inventory of what's on the screen, what state it can be in, and how a test should find each piece. Build it before writing tests, and cross-check it against the BDD steps.

## What to extract

For every element that a scenario touches or asserts:
- **Role / type** — heading, button, textbox, link, checkbox, alert, list, image, etc.
- **Accessible name** — visible label, `aria-label`, or associated `<label>` text.
- **States** — default, focused, disabled, loading, error, success, empty. Wireframes often show these as separate frames or annotations.
- **Interactions** — what the user does to it and what changes as a result.
- **Query strategy** — how a test will locate it (see hierarchy below).

A compact way to hold this internally:

```
| Element            | Role     | Name / text        | States                | Query                                   |
|--------------------|----------|--------------------|-----------------------|-----------------------------------------|
| Email input        | textbox  | "Email"            | empty, error          | getByLabelText(/email/i)                |
| Sign in button     | button   | "Sign in"          | enabled, disabled     | getByRole('button',{name:/sign in/i})   |
| Error banner       | alert    | "Email is required"| hidden→visible        | findByRole('alert')                     |
| Dashboard heading  | heading  | "Dashboard"        | post-submit           | findByRole('heading',{name:/dashboard/})|
```

## From an image wireframe

`view` the image. Read labels, button text, field captions, and any annotations describing states or flows. Infer roles from visual affordances (a boxed line with a caption is a labelled textbox; a filled rounded rectangle with a verb is a button). Where the image shows multiple frames (e.g. "empty state", "error state"), each is a state to cover. You won't have real selectors from an image, so plan queries around roles/labels and list the `data-testid`s the implementation should add.

## From an HTML mockup (preferred when available)

This is gold — it gives you concrete, real structure. Read the markup and extract:
- Actual tags and the implicit ARIA roles they carry (`<button>`, `<nav>`, `<h1>`, `<input>`).
- Existing `id`, `class`, and especially any `data-testid` already present — reuse them.
- `<label for>` ↔ input associations (drives `getByLabelText`).
- Exact button/heading/link text (drives `getByRole({ name })` and `getByText`).
- Form structure, required fields, and any inline error containers.

Write queries against what's actually there so the tests are realistic and not guesswork. If the mockup lacks a hook a test needs, note the missing `data-testid` in implementation notes rather than asserting on a brittle CSS path.

## Query strategy hierarchy

Choose the most resilient locator available, in this order:
1. **Role + accessible name** — `getByRole('button', { name: /save/i })`. Most robust; mirrors how users and assistive tech perceive the UI.
2. **Label / placeholder / text** — `getByLabelText`, `getByText`.
3. **`data-testid`** — when there's no accessible handle. Recommend adding one rather than reaching for CSS.
4. **CSS / class selector** — last resort; brittle, avoid unless the project already relies on it.

## Cross-checking against the BDD story

- Every `Then ... should see X` needs an element in the contract. If absent → flag "scenario references X but the wireframe has no such element."
- Every interactive element the scenarios drive (`When I click Y`) must exist and be reachable by a query.
- Elements present in the wireframe but untouched by any scenario → list as "untested UI" so the team can decide whether a scenario is missing.

These mismatches go in the final summary — they're often the most valuable output, surfacing gaps in either the spec or the design before any code is written.
