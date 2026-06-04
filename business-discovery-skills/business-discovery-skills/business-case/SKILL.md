---
name: business-case
description: Establish the economic WHY — roughly how big the prize is, what it will cost, and whether it's worth doing — before committing to build. Use this during discovery once the problem is grounded, or whenever someone needs to justify an investment, compare options, decide if something is worth doing, or answer "what's the ROI / is this worth it / how big is this?". It sizes the opportunity (order of magnitude), lays out costs and benefits, computes payback, compares options against a do-nothing baseline, and pressure-tests the assumptions. Produces a `business-case.md` artifact. Aim for "roughly right", not falsely precise.
---

# Business Case

This skill answers three questions in plain terms: **what will it cost, what will it return, and when** — enough to decide whether a problem is worth solving and which option to back. The goal is a confident, defensible "roughly right" picture, not a finance-grade model. (When the numbers carry real weight — a board case, a valuation, many interacting drivers — say so and recommend specialist support.)

## Inputs

Use the grounded `problem-statement.md` and `root-cause.md`. The impact figures there feed the "size of the prize" here.

## How to run it

### 1. Size the prize (order of magnitude)

Estimate the value at stake two ways and check they roughly agree:
- **Top-down:** start from a big known number and narrow (e.g. total at-risk revenue × share addressable).
- **Bottom-up:** build from units (e.g. affected users × frequency × value each).

If the two are in the same ballpark, trust the order of magnitude. Chase the right *size*, not decimal places.

### 2. Lay out the options

Always include **"do nothing"** as the baseline — it has a cost (the ongoing impact of the unsolved problem). Then 2–3 genuinely different options (e.g. minimal, moderate, bold). Solution ideas parked during problem-framing belong here, now judged against the problem.

### 3. Cost each option

- **One-off:** build, licences, migration, training.
- **Ongoing:** run, support, people, infrastructure.

### 4. Quantify the benefits

- **New or retained revenue**, **cost saved**, **risk reduced** (name the risk).
- Name **intangibles** honestly (morale, brand, optionality) without inflating them into fake numbers.

### 5. Payback and net benefit

- **Payback period:** how long until cumulative benefit covers cumulative cost.
- **Net benefit over ~3 years:** benefits minus costs. (Money later is worth slightly less than money now — for most decisions, payback plus a 3-year net is enough; only discount formally for large, long-dated cases.)

### 6. Pressure-test

- Use **ranges** (low / expected / high), not single confident numbers.
- **Sensitivity:** if the key assumption is 20% worse, does the case still hold? If it only works on the optimistic number, it is a hope, not a case.
- Write the **assumptions** down where they can be challenged — that is where the real argument lives.

## Writing it up

Copy `assets/business-case-template.md` into the discovery folder as `business-case.md` and fill it. End with a clear recommendation tied to the evidence.

## Quality bar

- "Do nothing" is costed as the baseline.
- The prize is sized two ways and they roughly agree.
- Assumptions are explicit and the case survives a sensitivity check.
- Benefits are tied back to the problem's impact, not invented.
- The recommendation is a clear option choice with reasons.

## Anti-pattern

**False precision.** "£1,243,500 over three years" implies a certainty you don't have. "£1.0–1.5m over three years, payback under a year" is more honest and more useful.
