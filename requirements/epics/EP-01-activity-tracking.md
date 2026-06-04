---
id: EP-01
title: Activity Tracking
parent_objective: Increase booking conversion through accurate behavioural data capture
owner: TBD
reviewer: TBD
status: Draft
---

# EP-01 — Activity Tracking

## Capability
The platform captures every meaningful user interaction — flight searches, hotel searches, flight views (including cabin class), booking lifecycle events, wishlist actions, and cross-session return visits — and persists them as `UserActivity` records that feed the Preference Engine and Intent Engine.

## Why (links up)
- Objective: Establish a reliable event foundation so that personalization, intent scoring, and recommendations are grounded in accurate behavioural data.
- Root causes addressed: RC-3 (cross-session return visit detection), RC-4 (double booking event tracking), RC-8 (cabin metadata missing from flight view events), RC-9 (origin used as destination in metadata).

## Stories in this epic
- US-0101 — Track flight search activity — Draft
- US-0102 — Track hotel search activity — Draft
- US-0103 — Track flight view events with cabin metadata — Draft
- US-0104 — Fix booking lifecycle event tracking (remove double-tracking) — Draft
- US-0105 — Detect cross-session return visits — Draft
- US-0106 — Track wishlist add/remove events — Draft

## Scope
**In:** authenticated user activity events (flight search, hotel search, flight view, booking start, booking complete, wishlist add/remove, return visit detection)
**Out:** anonymous user tracking (RC-1, scoped to EP-08 future phase); payment gateway events; non-travel page views

## Open questions / dependencies
- RC-4 fix (double tracking) must be resolved before any intent scoring is trusted.
- RC-3 fix (return_visit) must be resolved before `return_reminder` notifications fire correctly.
- RC-8 fix (cabin metadata) must be in place before cabin preference can be built in EP-02.
- RC-9 fix (origin-as-destination) must land before `primaryPlanningDestination` is reliable in EP-03.
