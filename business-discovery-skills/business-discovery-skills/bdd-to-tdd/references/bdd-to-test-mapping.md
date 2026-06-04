# Mapping Gherkin → tests

The goal is a one-to-one, auditable correspondence between the behaviour spec and the test suite.

## Structural mapping

| Gherkin element | Test construct |
|---|---|
| `Feature:` | top-level `describe(...)` named for the feature/screen |
| `Background:` | `beforeEach(...)` shared setup |
| `Scenario:` | one `it(...)` / `test(...)` |
| `Scenario Outline:` + `Examples:` | parameterised `it.each(...)` / `test.each(...)`, one case per example row |
| `Given` | **Arrange** — render the screen, seed state, set up mocks/routes |
| `When` | **Act** — user interaction (`click`, `type`, navigate) |
| `Then` | **Assert** — `expect(...)` on visible outcome |
| `And` / `But` | extends the preceding step's phase |

Keep the test name close to the scenario text so it reads as documentation. Echo each step as a comment above its block.

## Worked example

**Gherkin**
```gherkin
Feature: Login screen
  Scenario: Successful login
    Given I am on the login screen
    When I enter "ada@example.com" in the email field
    And I enter a valid password
    And I click "Sign in"
    Then I should see the dashboard heading
```

**Jest/Vitest + RTL**
```ts
describe('Login screen', () => {
  // Scenario: Successful login
  it('shows the dashboard after valid credentials are submitted', async () => {
    const user = userEvent.setup();
    // Given I am on the login screen
    render(<LoginScreen />);
    // When I enter credentials and submit
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correct horse');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    // Then I should see the dashboard heading
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });
});
```

## Scenario Outline → parameterised

```gherkin
Scenario Outline: Validation errors
  When I submit the form with <field> empty
  Then I should see "<message>"
  Examples:
    | field    | message              |
    | email    | Email is required    |
    | password | Password is required |
```
```ts
it.each([
  ['email', 'Email is required'],
  ['password', 'Password is required'],
])('shows "%s required" when %s is empty', async (field, message) => {
  // ...arrange, leave `field` empty, submit...
  expect(await screen.findByText(message)).toBeInTheDocument();
});
```

## Rules of thumb

- **Step-to-phase discipline:** all `Given` work goes in arrange, the *triggering* `When` in act, every `Then` becomes its own assertion. Multiple `Then`s → multiple `expect`s in one test (don't split a scenario across tests).
- **Loose prose input:** if there's no Gherkin, rewrite the acceptance criteria into explicit Given/When/Then in a comment block at the top of the file, then map as above. This makes the inferred behaviour reviewable.
- **Imperative, user-facing assertions:** assert what the user perceives ("sees the heading", "the button is disabled"), not implementation internals (component state, prop values).
- **Negative/error scenarios are first-class:** give them the same fidelity as the happy path — they're usually where bugs live.
- **Don't merge scenarios** to save lines. The 1:1 mapping is the point.
