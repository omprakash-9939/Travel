---
name: root-cause-analysis
description: Test whether a stated problem is a root cause or just a symptom, before committing to solve it. Use this right after framing a problem, or whenever someone proposes fixing something that might be a surface issue — signs include "the obvious fix is...", recurring problems that keep coming back, "we already tried X and it didn't stick", or any problem stated as an effect ("sales are down", "the app crashes", "customers churn") without a confirmed cause. It applies 5 Whys and a MECE cause tree grounded in evidence, and produces a `root-cause.md` artifact. Run it before requirements so the team builds against causes, not symptoms.
---

# Root Cause Analysis

Solving a symptom feels productive and changes nothing; the problem returns wearing a new face. This skill pressure-tests a problem to find where the leverage actually is, so requirements target a cause rather than an effect.

Two complementary techniques: **5 Whys** (depth — drill down one causal chain) and a **cause tree / MECE branches** (breadth — make sure you considered the other possible causes). Use both; depth without breadth fixates on the first plausible story.

## Inputs

Start from the agreed `problem-statement.md`. If there isn't one, run `problem-framing` first — you cannot find the cause of a problem that isn't defined.

## How to run it

### 1. Drill down with 5 Whys

Take the problem (the symptom) and ask "why?" repeatedly, **each answer backed by evidence, not speculation.** Five is a guide, not a rule; stop when you reach something the team can actually act on and that the evidence supports.

- After each "why", ask: *"How do we know that? What would we see in the data if it were true?"*
- If an answer is a guess, mark it and note what data would confirm it. An unvalidated chain is a hypothesis, not a finding.
- Avoid stopping at a person ("because someone forgot"). Push to the system: why was it possible to forget? What process or tool allowed it?

### 2. Widen with a cause tree

Before trusting a single chain, lay out the **main categories of possible cause** so you don't tunnel. Make the branches roughly mutually exclusive and collectively exhaustive (MECE — no big gaps, no heavy overlap). Useful starting categories:

- **People / skills** — capability, awareness, incentives
- **Process** — missing, unclear, or not followed
- **Technology / tooling** — gaps, defects, performance, integration
- **Data** — missing, wrong, or not trusted
- **External** — market, supplier, regulation, customer behaviour

For each branch, note the evidence for and against it. The branch the evidence supports is your candidate root cause; the others are ruled out (and you can say why).

### 3. Separate symptom, cause, and confidence

State plainly: this is the symptom, this is the most likely root cause, and here is how confident we are and what would raise that confidence. Honesty about confidence is part of grounding — a "probable cause, needs one week of data to confirm" is a legitimate and useful output.

## Writing it up

Copy `assets/root-cause-template.md` into the discovery folder as `root-cause.md` and fill it. Cross-link back to `problem-statement.md`.

## Quality bar

- Every "why" link is evidenced or explicitly flagged as an assumption.
- At least the main alternative causes were considered and ruled in/out with reasons.
- The root cause is something the team can act on (not "the market is hard").
- Confidence and the data needed to confirm it are stated.
- It does not blame individuals; it describes the system that produced the outcome.

## Anti-patterns

- **Stopping at the first plausible why.** It is usually a symptom one level down.
- **Confirmation bias.** Looking only for evidence that supports the cause you already suspected; actively seek the data that would *disprove* it.
- **Jumping to the fix mid-analysis.** Note solution ideas to one side and keep going; they belong in `business-case.md`.
