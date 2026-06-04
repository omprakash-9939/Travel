---
name: design-system
description: Ground all UI work in a consistent design system / design library so behaviour specs and the build use real components, tokens, and states rather than inventing them. Use this when there's a UI to build, or whenever someone mentions a "design system", "design library", "design tokens", "component library", "style guide", "Figma", "Storybook", "shadcn/MUI/Tailwind", or wants the UI grounded and consistent. It captures or references design tokens, a component inventory (with variants and states), interaction patterns, and accessibility standards into a `design-system/` folder, and links the source of truth (Figma/Storybook/existing library). This grounds `requirements-to-bdd` (scenarios reference real components and states) and the Claude Code build (consistent, accessible UI).
---

# Design System Grounding

UI built without a design system drifts: every screen reinvents buttons, spacing, and error states, and the result is inconsistent and inaccessible. This skill captures (or references) the design system so the **behaviour specs reference real components and states**, and the **Claude Code build** produces consistent, accessible UI from a known palette of parts.

The golden rule: **reuse, don't reinvent.** If a design system or component library already exists (a company library, Figma file, Storybook, or a framework like MUI / Tailwind+shadcn / Material), this skill references it as the source of truth. It only *defines* tokens and components when there genuinely isn't one yet.

## What it produces

```
design-system/
├── README.md            # what the system is, where the source of truth lives, how to use it
├── tokens.md            # colour, typography, spacing, radius, elevation, breakpoints
├── components.md        # component inventory: purpose, variants, states, accessibility
├── patterns.md          # layout/navigation/form patterns + empty/loading/error/success states
├── accessibility.md     # a minimal accessibility baseline (optional stretch: WCAG 2.2 AA)
└── references.md        # links: Figma, Storybook, the underlying library, the wireframe
```

## Workflow

1. **Find the source of truth** — does a design system already exist? Ask for / locate the Figma file, Storybook, brand guidelines, or the UI library in use. If yes, `references.md` points to it and the other files *summarise and link* rather than duplicate. **If nothing is specified, default to Material UI (MUI)** — its theme supplies your tokens and its components give you accessible, ready-made building blocks, which is ideal for a quick local POC; map your tokens to the MUI theme and reference MUI components in the inventory. Respect any stated preference (Tailwind + shadcn/ui, your own library, etc.). If there's genuinely no system and no default fits, define the minimum set below.
2. **Capture the tokens** — colour roles (not just hex: primary/surface/danger/…), type scale, spacing scale, radius, elevation, breakpoints. Tokens are the vocabulary everything else uses. Copy `assets/tokens-template.md`.
3. **Inventory the components** — for each reusable component: its purpose, variants, and crucially its **states** (default, hover, focus, disabled, loading, error, empty, success) and accessibility notes (role, label, keyboard). Copy `assets/component-template.md` per component or list them in `components.md`. The states here are exactly what BDD scenarios and tests need to cover.
4. **Document the patterns** — recurring compositions: the search form (and its validation/error states), the fare/results list (and its empty/loading states), the booking/checkout flow, navigation, modals, notifications. Patterns are where consistency is won or lost.
5. **Set a minimal accessibility baseline — and prompt for it upfront.** Raise accessibility at the *start* (when the UI is first designed), not at the end. For a POC keep it minimal: semantic HTML/native elements, every control has a label, full keyboard operation, a visible focus state, and readable colour contrast. That's the bar. Note full WCAG 2.2 AA as an optional stretch if the project needs it, but don't gate a junior POC on it. These few rules become lightweight non-functional requirements the build and tests check.
6. **Link the wireframe — or generate one if there isn't one.** On a fresh POC the team often has only a rough sketch or just the story, not a real wireframe. Don't treat that as a blocker: generate a **lightweight HTML mockup** of the key screen(s) from the story's intent, composed from the chosen components (MUI by default), and show it to the team to react to — a mockup they can poke at surfaces disagreement far faster than a written spec. Once they're happy, treat that agreed mockup as the wireframe and connect each screen to the components and patterns it uses, so `requirements-to-bdd` can phrase scenarios against real, named parts. Generate a first draft for them to think *against* — whether it's the *right* screen is the team's judgement, not the mockup's.

## How it grounds the rest of the pipeline

- **requirements-to-bdd** — scenarios reference real components and the states defined here, so "Then I see the error state" maps to a real, specified thing.
- **bdd-to-tdd** — tests can assert against the components' accessible roles/labels and known states.
- **the build** — Claude Code composes screens from the inventory instead of inventing one-off UI; reference `design-system/README.md` from the repo's `CLAUDE.md` (alongside `architecture/build-context.md`).

## Quality bar

- The source of truth is named and linked; existing systems are reused, not duplicated.
- Tokens are defined as **roles**, not scattered raw values.
- Every component lists its **states** (incl. empty/loading/error) and accessibility notes.
- A minimal accessibility baseline is set **upfront** and expressed as a few checkable rules.
- Wireframe screens map to named components/patterns.

## Anti-patterns

- **Reinventing an existing system** — if there's a library or Figma source, reference it; don't fork a parallel spec that will drift.
- **Raw values everywhere** — `#3366FF` sprinkled through specs instead of a `color.primary` token.
- **Happy-path components** — documenting only the default state and forgetting loading/error/empty, which is exactly where UI bugs live.
- **Accessibility as an afterthought** — bolt it on at the end and it never happens; prompt for the minimal baseline upfront instead.

## A note on public references
Several teams publish design/web-UI guidance as skills (e.g. Vercel Labs' web design guidelines and React best practices). If the project uses that stack, those are worth installing alongside this skill as the concrete styling rules, with this skill holding the project-specific tokens, inventory, and source-of-truth links. See the collection README's "Further skills worth adding".
