# Framework detection and idioms

Detect first, then write to the detected framework's conventions. Never default to Jest just because it's common.

## Detection table

Read `package.json` (both `dependencies`/`devDependencies` and the `scripts` block) plus config files at the repo root.

| Signal | Stack |
|---|---|
| `vitest` in deps, or `vitest.config.*` | **Vitest** (component/unit) |
| `jest` in deps, `jest` key in package.json, or `jest.config.*` | **Jest** (component/unit) |
| `@testing-library/react` | React components → render with RTL |
| `@testing-library/vue` | Vue components |
| `@testing-library/svelte` | Svelte components |
| `@angular/core` + `karma`/`jasmine` or `@testing-library/angular` | Angular |
| `@playwright/test` or `playwright.config.*` | **Playwright** (e2e) |
| `cypress` in deps or `cypress.config.*` | **Cypress** (e2e) |
| `vite` present, no jest | Lean Vitest for unit |
| Empty/greenfield workspace | Ask the user; suggest Vitest + RTL for React, Playwright for e2e |

If both a component runner and an e2e runner exist, produce **both layers**: full scenario flows as e2e specs, granular element/state behaviour as component tests. Say which scenarios you routed where.

## Assertion + import idioms

**Jest + React Testing Library**
```ts
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenName } from './ScreenName';
// matchers from '@testing-library/jest-dom' (usually in setupTests)
```
- Async UI: `await screen.findByRole(...)` or `await waitFor(() => ...)`.
- Interactions: `const user = userEvent.setup(); await user.click(...)`.

**Vitest + RTL** — same as above but:
```ts
import { describe, it, expect } from 'vitest';
```
Mocks use `vi.fn()` / `vi.mock()` instead of `jest.fn()` / `jest.mock()`. `it.each`/`test.each` work the same.

**Playwright**
```ts
import { test, expect } from '@playwright/test';
test('scenario name', async ({ page }) => {
  await page.goto('/route');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Saved')).toBeVisible();
});
```
- Prefer `page.getByRole`, `getByLabel`, `getByText`. Web-first assertions (`toBeVisible`, `toHaveText`) auto-wait — don't add manual sleeps.

**Cypress**
```ts
describe('Feature', () => {
  it('scenario name', () => {
    cy.visit('/route');
    cy.findByRole('button', { name: 'Submit' }).click(); // @testing-library/cypress
    cy.contains('Saved').should('be.visible');
  });
});
```

**Vue Testing Library** — `render` from `@testing-library/vue`; same `screen` queries. **Svelte** — `render` from `@testing-library/svelte`. **Angular** — either `@testing-library/angular`'s `render`, or TestBed + `fixture.detectChanges()` if the repo uses classic Karma/Jasmine; match what's already there.

## File placement conventions

Match the project's existing pattern; if none, pick the framework default:
- **Co-located**: `Component.tsx` → `Component.test.tsx` beside it (common with Vitest/CRA).
- **`__tests__/`** directory next to source.
- **Playwright**: `e2e/` or `tests/` per `playwright.config.ts` `testDir`.
- **Cypress**: `cypress/e2e/*.cy.ts`.

Check an existing test file in the repo and mirror its location, naming, and import style exactly — consistency beats your preference.

## Running the suite

Report the real command from the `scripts` block (e.g. `npm test`, `npm run test:unit`, `npx playwright test`, `npx cypress run`). Note that a fresh red suite is *expected* to fail.
