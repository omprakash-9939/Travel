---
id: EP-02
title: Preference Engine
parent_objective: Build accurate, long-horizon user preference profiles to improve recommendation relevance
owner: TBD
reviewer: TBD
status: Draft
---

# EP-02 — Preference Engine

## Capability
The platform aggregates 90-day `UserActivity` history into a structured preference profile per user — favourite destinations, preferred cabin class, budget band — and makes this profile available to the Recommendation Engine and Intent Engine. New users with no history receive a contextually appropriate cold-start fallback.

## Why (links up)
- Objective: Ensure recommendations reflect demonstrated user preferences rather than generic popularity.
- Root causes addressed: RC-7 (flat preference scoring ignores recency), RC-8 (cabin always defaults to economy), RC-12 (cold-start hardcodes Mumbai/Dubai/Goa).

## Stories in this epic
- US-0201 — Aggregate destination preferences from 90-day activity — Draft
- US-0202 — Build cabin class preference profile — Draft
- US-0203 — Handle cold-start for new users with configurable fallback — Draft

## Scope
**In:** destination frequency scoring from `UserActivity`; cabin class aggregation; configurable market fallback destinations for cold-start
**Out:** recency decay (RC-7, lower priority — requires 30+ days of calibration data, scoped to EP-07); anonymous user preference (RC-1, scoped to EP-08 future)

## Open questions / dependencies
- Depends on EP-01 cabin metadata fix (US-0103 / RC-8) for cabin preference to be non-trivial.
- Recency decay (RC-7) intentionally deferred: set decay half-life requires empirical calibration from EP-08 analytics. Add to EP-07 once baseline data exists.
- Cold-start fallback should be configurable per market (e.g. top Indian cities ≠ top European cities).
