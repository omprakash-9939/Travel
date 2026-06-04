# Grounding UI in a design system — quick guidance

## Reuse first
Before defining anything, find the source of truth: a company design system, a Figma library, a Storybook, brand guidelines, or the chosen UI framework (MUI, Material, Chakra, Tailwind + shadcn/ui, Radix, etc.). Reference it. A second, hand-written spec that duplicates it will drift and cause exactly the inconsistency this skill exists to prevent.

## Tokens are the vocabulary
Express design decisions as named tokens (color.primary, space.4, radius.md), not raw values. Everything — components, patterns, specs, code — refers to tokens, so a change happens in one place. Most frameworks already expose tokens (Tailwind theme, CSS variables, MUI theme); map to those.

## States are where UI breaks
For every component and pattern, specify not just the happy default but the loading, empty, error, disabled, focus, and success states. These map directly to the scenarios `requirements-to-bdd` should write and the cases `bdd-to-tdd` should test. A component documented only in its default state is under-specified.

## Accessibility: a minimal baseline, prompted upfront
Raise accessibility when the UI is first designed, not at the end. For a POC keep it minimal and checkable: use semantic/native elements, label every control, make everything keyboard-operable with a visible focus state, and keep colour contrast readable. That short list is the bar. Note full WCAG 2.2 AA (heading order, richer ARIA, etc.) as an optional stretch for projects that need it, but don't block a junior POC on it. Stated up front, even this minimal baseline becomes a non-functional requirement the build and tests check; left to the end, it rarely happens.

## Connect to the wireframe and the build
Map each wireframe screen to the named components and patterns it uses. Reference design-system/README.md from the repo's CLAUDE.md (next to architecture/build-context.md) so the build agent composes from the inventory rather than inventing one-off UI.
