---
name: problem-framing
description: Turn a vague request, goal, or proposed solution into a precise, neutral, evidence-based problem statement before any solution work begins. Use this whenever someone describes what they want to build or change but has not clearly stated the underlying problem — phrases like "we need a dashboard", "can we add X", "users are unhappy", "engagement is low", "let's build Y", or any goal stated without a grounded problem. This is the foundational step of discovery; run it first. It produces a `problem-statement.md` artifact and actively challenges solution-first thinking.
---

# Problem Framing

A well-framed problem is the highest-leverage artifact in any project. This skill produces a problem statement that is **specific, measurable, neutral about the solution, bounded, and backed by evidence** — the foundation everything else builds on.

The core discipline (the "Golden Rule"): **identify the problem before jumping to solutions.** When you find yourself reframing a request to make it sound like a problem, that is the signal to stop and ask what the real problem is.

## Spotting a solution wearing a problem's clothes

People naturally describe solutions, not problems. Your first job is to detect this and gently redirect.

| What they say (solution) | What to ask (to find the problem) |
|---|---|
| "We need a fare-comparison widget." | "What can't a traveller decide today that this would unblock?" |
| "Integrate another GDS / supplier." | "What is slow, manual, or breaking that this would fix?" |
| "We need an AI trip planner." | "What are travellers unable to do, or doing painfully, right now?" |
| "Make the fare quote faster." | "Faster than what, and what does the slow quote cost in lost bookings?" |

Acknowledge the idea, park it as a candidate solution for later, and pull the conversation back to the problem.

## How to run it

Work through these **one topic at a time, conversationally.** Do not present a blank form. Ask, listen, reflect back, then move on. Most of these can be inferred or confirmed quickly; spend time where there is uncertainty or disagreement.

1. **Symptom** — What is happening that shouldn't, or not happening that should? Get the concrete observation.
2. **Evidence** — How do we know? Ask for data, a metric, a count, a quote, a support-ticket volume. "It feels slow" becomes "p95 latency is 4s against a 1s target." If there is no evidence, that is a finding: note it as an assumption to validate.
3. **Who is affected** — Which users, customers, or internal teams, and how many?
4. **Impact** — What does the problem cost in money, time, risk, or experience? What happens if we do nothing?
5. **Success criteria** — What measurable change would tell us the problem is solved? Make it a number and a direction ("cut search-to-book abandonment at payment from 60% to under 45%").
6. **Scope** — What is explicitly in scope and out of scope? Bounding the problem is as important as stating it.
7. **Constraints** — Hard limits: deadlines, budget, tech, regulatory, team capacity.
8. **Decision-maker** — Who owns the call on whether and how to solve this? (Hand off to `stakeholder-mapping` for depth.)

## Writing the statement

Copy `assets/problem-statement-template.md` into the discovery folder as `problem-statement.md` and fill it from the conversation. The headline is a single sentence of the form:

> **[Who] is experiencing [observable problem], evidenced by [data], which costs [impact]. Solving it means [measurable success criteria].**

## Quality bar

A good problem statement passes all of these:

- **Neutral** — names no solution. ("Booking abandonment at payment is high", not "we need a one-click booking button".)
- **Measurable** — has a number now and a target.
- **Singular** — one problem. If you find "and", consider splitting into separate statements.
- **Evidenced** — backed by data or an explicit, flagged assumption.
- **Bounded** — has an out-of-scope list.
- **Falsifiable** — you could tell whether it is solved.

See `references/examples.md` for worked good-vs-weak examples. Read it if the user's problem feels vague, bundled, or solution-led.
