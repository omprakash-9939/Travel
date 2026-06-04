/**
 * Template: Cypress end-to-end spec.
 * Assumes @testing-library/cypress for findByRole/findByLabelText (recommended).
 *
 * Source: Feature "<FEATURE NAME>"  •  Screen: <SCREEN NAME>
 * RED-first: expected to fail until the screen and route exist.
 */
describe('<FEATURE NAME>', () => {
  // Scenario: <SCENARIO TITLE>
  it('<expected user-facing outcome>', () => {
    // Given <given step>
    cy.visit('/<route>');

    // When <when step(s)>
    cy.findByLabelText(/email/i).type('ada@example.com');
    cy.findByRole('button', { name: /sign in/i }).click();

    // Then <then step(s)>
    cy.findByRole('heading', { name: /dashboard/i }).should('be.visible');
  });
});
