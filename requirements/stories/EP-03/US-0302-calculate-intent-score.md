---
id: US-0302
title: Calculate intent score from activity events
epic: EP-03
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend scoring logic)
feature_file: pending
---

# US-0302 — Calculate intent score from activity events

**As a** platform operator
**I want** each authenticated user to have a continuously updated intent score derived from their activity events
**So that** the system can identify users at peak purchase intent and trigger appropriate interventions (notifications, recommendations, emails)

## Description
The intent engine assigns weights to activity events and accumulates a score per user. Current weights: `flight_search = 5`, `hotel_search = 5`, `flight_view = 3`, `hotel_view = 3`, `wishlist_added = 5`, `booking_started = 25`, `booking_completed = 50`, `return_visit = 15`. The score drives tier classification (low: < 31, medium: 31–70, high: ≥ 71). This story validates the scoring mechanism is correct once RC-4 (double tracking) is resolved, and documents the weights and thresholds as explicit, reviewable configuration rather than scattered constants.

## Acceptance criteria
- Given a user performs a `flight_search` (5 pts) and a `return_visit` (15 pts), when the intent score is recalculated, then the score is 20 (low tier).
- Given a user's score is 30 and they trigger one more `flight_search` (5 pts), when the score is updated, then the score becomes 35 and the tier transitions from `low` to `medium`.
- Given a user's score reaches 71, when the tier is evaluated, then the tier is `high`.
- Given intent weights are defined in a single configuration object (not scattered across files), when a weight needs to be adjusted, then changing the config value propagates to all scoring without code changes in multiple files.
- Given the scoring runs after every tracked event, when a user's tier changes, then the change is reflected in the next recommendation/notification evaluation.

## Priority
Must

## Dependencies
- EP-01 US-0104 and EP-03 US-0301 (double-tracking fix) must be live first.
- Tier thresholds (31/71) are unvalidated engineering estimates (A-2); document them as hypotheses to be calibrated after EP-08 US-0803 produces 30 days of tier accuracy data.
