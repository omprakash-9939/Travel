/**
 * Template: Playwright end-to-end spec.
 * Use for full scenario flows. Adapt route, queries, and assertions.
 *
 * Source: Feature "<FEATURE NAME>"  •  Screen: <SCREEN NAME>
 * RED-first: expected to fail until the screen and route exist.
 */
import { test, expect } from '@playwright/test';

test.describe('<FEATURE NAME>', () => {
  // Scenario: <SCENARIO TITLE>
  test('<expected user-facing outcome>', async ({ page }) => {
    // Given <given step>
    await page.goto('/<route>');

    // When <when step(s)>
    await page.getByLabel(/email/i).fill('ada@example.com');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Then <then step(s)> — web-first assertions auto-wait, no manual sleeps
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});
