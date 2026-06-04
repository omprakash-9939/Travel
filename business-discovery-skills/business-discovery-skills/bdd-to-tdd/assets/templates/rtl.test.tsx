/**
 * Template: React Testing Library component test (Jest or Vitest).
 * Adapt names, queries, and imports to the detected stack.
 * For Vitest, add: import { describe, it, expect } from 'vitest';  and use vi.fn() for mocks.
 *
 * Source: Feature "<FEATURE NAME>"  •  Screen: <SCREEN NAME>
 * This suite is written RED-first: it should fail until <SCREEN NAME> is implemented.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenName } from './ScreenName';

describe('<FEATURE NAME>', () => {
  // Scenario: <SCENARIO 1 TITLE>
  it('<expected user-facing outcome>', async () => {
    const user = userEvent.setup();

    // Given <given step>
    render(<ScreenName />);

    // When <when step(s)>
    await user.type(screen.getByLabelText(/label/i), 'value');
    await user.click(screen.getByRole('button', { name: /action/i }));

    // Then <then step(s)>
    expect(await screen.findByRole('alert')).toHaveTextContent(/expected message/i);
  });

  // Scenario: <SCENARIO 2 TITLE — e.g. an error/empty state>
  it('<expected outcome for the unhappy path>', async () => {
    render(<ScreenName />);
    // ...arrange / act / assert...
  });
});

/* Implementation notes (hooks the screen should expose):
 * - role "alert" container for validation/errors
 * - <label for> associations so inputs are reachable by getByLabelText
 * - data-testid="..." only where no accessible handle exists
 */
