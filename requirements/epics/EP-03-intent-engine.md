---
id: EP-03
title: Intent Engine
parent_objective: Score user purchase intent in real time to identify and act on peak-intent moments
owner: TBD
reviewer: TBD
status: Draft
---

# EP-03 — Intent Engine

## Capability
The platform scores each authenticated user's purchase intent in real time based on their activity events, tiers them as low / medium / high, identifies their primary planning destination, and resets or cools down the score after a completed booking. The intent signal drives notification triggers, recommendation ranking, and re-engagement email timing.

## Why (links up)
- Objective: Identify users at peak purchase intent so the platform can intervene before they book elsewhere.
- Root causes addressed: RC-4 (double event tracking inflates all counters), RC-5 (no score reset after booking_completed), RC-9 (origin used as destination corrupts primaryPlanningDestination).

## Stories in this epic
- US-0301 — Fix double event tracking (remove booking events from one layer) — Draft
- US-0302 — Calculate intent score from activity events — Draft
- US-0303 — Reset intent score and suppress notifications after booking_completed — Draft
- US-0304 — Fix origin-as-destination in metadata extraction — Draft

## Scope
**In:** real-time intent scoring on each tracked event; tier classification (low / medium / high); `primaryPlanningDestination` derivation; post-booking score reset/cool-down
**Out:** anonymous intent scoring (RC-1); recency-weighted scoring (RC-7 — deferred to EP-07 pending calibration data); ML-based scoring models

## Open questions / dependencies
- RC-4 fix (US-0301) must land first — all other intent work is invalid while counters are doubled.
- Tier thresholds (≥31 = medium, ≥71 = high) are engineering estimates; they must be empirically validated in EP-08 after 30 days of measured data (A-2).
- Score weights (`booking_started=25`, `hotel_search=5`, etc.) are likewise unvalidated — treat as hypotheses, not facts (A-7).
