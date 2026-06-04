---
id: EP-07
title: Ranking System
parent_objective: Order search results and recommendations by relevance to the user's current and historical intent to increase click-through and booking probability
owner: TBD
reviewer: TBD
status: Draft
---

# EP-07 — Ranking System

## Capability
The platform ranks flights, hotels, and recommendations by combining active intent signals (current planning destination, recent searches) with calibrated preference history (recency-decayed destination scores). An A/B test framework splits users into personalised and control groups so ranking improvements can be measured against a baseline.

## Why (links up)
- Objective: Ensure the most relevant results appear at the top of every surface so users find what they want without excessive searching.
- Root causes addressed: RC-7 (flat preference scoring — no recency decay), RC-10 (recommendations use history not current intent, partially addressed in EP-04).
- Business case: A/B framework is a prerequisite to claiming any measured lift (business-case.md §4, §6 Phase 2).

## Stories in this epic
- US-0701 — Intent-ranked recommendation and search result ordering — Draft
- US-0702 — Apply recency decay to destination preference scoring (RC-7) — Draft
- US-0703 — A/B test framework: personalisation control group — Draft

## Scope
**In:** intent-biased ranking combining `primaryPlanningDestination` with preference history; exponential recency decay on destination scores; A/B split (20% control receives no personalisation)
**Out:** ML-based ranking models (TensorFlow.js, external scoring service); multi-armed bandit optimisation; cross-user collaborative filtering

## Open questions / dependencies
- US-0702 (recency decay) requires 30+ days of conversion signal data from EP-08 to calibrate the decay half-life. Do not ship before EP-08 baseline data exists — wrong decay can be worse than no decay (RC-7 analysis).
- US-0703 (A/B framework) is a prerequisite before any conversion lift claim can be made for EP-04, EP-05, EP-06 features.
- Intent-biased ranking (US-0701) depends on EP-03 intent score correctness and EP-01 RC-9 fix.
