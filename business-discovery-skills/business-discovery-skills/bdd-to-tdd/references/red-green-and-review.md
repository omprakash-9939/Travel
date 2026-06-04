# Red/green tests and the human review

## What red and green mean
- **Red** — the test fails. In TDD you write the test first, so it's red because the code doesn't exist yet. That's the point: a red test describes behaviour you haven't built.
- **Green** — the test passes. You make it green by writing the least code that satisfies it, then refactor while keeping it green.

The cycle is **red → green → refactor**, one small step at a time.

## What a good red test looks like
- It fails for the **right reason** — "X is not defined" / "expected the error message, found nothing" — not a typo, bad import, or config error. If it's red for the wrong reason, fix the test, not the product.
- It would **stay green only if the feature is actually right**. A test that passes against an empty or stubbed implementation tests nothing.
- It reads against the **behaviour**, not the mechanics — assert what the user sees/gets, not internal calls where you can avoid it.
- It's **traceable** to a scenario/story so a reviewer can map it back.

## The two human-review checkpoints
A human reviews twice, and these are the gates that matter most on a junior-led POC:

1. **Review the RED tests (before building).** Cheapest moment to catch a wrong assumption. Check:
   - [ ] Each test maps to a scenario/acceptance criterion.
   - [ ] The tests assert the behaviour the story actually wants.
   - [ ] They're meaningful — they'd fail if the feature were wrong (no trivially-true assertions).
   - [ ] The right things are mocked and the core is exercised for real.
   - [ ] States beyond the happy path are covered (error/empty/loading where they apply).

2. **Review the GREEN build (after building).** Passing tests are necessary, not sufficient. Check:
   - [ ] The feature actually works when you run it, not just in the test.
   - [ ] No test was weakened or deleted to force green.
   - [ ] The real-vs-mock split is honest (the demo path works for real — see mock-vs-real).
   - [ ] It's accessible at the minimal baseline (keyboard, labels, contrast).

## Keep it light (POC)
Don't gold-plate the test suite. Cover the behaviour in the stories and the obvious failure states, get a human nod on red, build to green, and move on. Depth where the risk is; momentum everywhere else.
