---
id: EP-04
title: Recommendation Engine
parent_objective: Surface relevant flights and hotels that match a user's active planning intent and historical preferences
owner: TBD
reviewer: TBD
status: Draft
---

# EP-04 — Recommendation Engine

## Capability
The platform generates personalised flight and hotel recommendations per user by combining active planning intent (current `primaryPlanningDestination`) with long-horizon preference history. The notification generation pipeline is decoupled from the 2-hour preference aggregation batch so that time-sensitive triggers (return_reminder) can fire within the same session as the qualifying event.

## Why (links up)
- Objective: Show users content relevant to their current planning context so they can complete a booking without leaving the platform.
- Root causes addressed: RC-2 (notification generation coupled to 2-hour batch), RC-10 (recommendations use 90-day history rather than current intent).

## Stories in this epic
- US-0401 — Build recommendations using active planning intent (current session) — Draft
- US-0402 — Build recommendations using 90-day preference history (returning users) — Draft
- US-0403 — Decouple notification generation from preference aggregation batch — Draft

## Scope
**In:** flight + hotel recommendations seeded from `primaryPlanningDestination`; fallback to preference history top destinations; `RecommendationCache` (6-hour TTL); decoupled notification trigger for `return_reminder`
**Out:** real-time price monitoring for `price_drop` (requires Amadeus live feed — deferred); recommendation A/B testing (EP-07); recommendation click-through tracking (EP-08)

## Open questions / dependencies
- US-0401 depends on RC-9 fix (US-0304) in EP-03 — `primaryPlanningDestination` must be correct before it can safely drive recommendation queries.
- US-0403 (decouple batch) is the highest-engineering-complexity story in this epic (~5–8 developer-days). It should follow EP-03 stabilisation.
- 6-hour recommendation cache TTL should be reviewed after EP-08 cache hit/miss data is available (A-5).
