---
id: US-0304
title: Fix origin-as-destination in metadata extraction
epic: EP-03
owner: TBD
reviewer: TBD
status: Built (Phase 1) — origin removed as planning-destination fallback
priority: Must
wireframe: n/a (backend metadata extraction fix)
feature_file: pending
---

# US-0304 — Fix origin-as-destination in metadata extraction

**As a** user searching for a flight from Delhi to Barcelona
**I want** the platform to identify Barcelona as my planning destination, not Delhi
**So that** the "Continue Planning" card and return_reminder notification reference the right city

## Description
In `activityTracker.js:132`, the destination extraction falls through to `metadata.origin` when both `metadata.destination` and `metadata.city` are absent: `const dest = metadata.destination || metadata.city || metadata.origin`. For a flight search, `metadata.origin` is the departure city (e.g. Delhi). If the search event does not populate `metadata.destination`, then `primaryPlanningDestination` is set to the user's departure city — the city they are flying *from*, not to. This causes return_reminder to ask "Still thinking about Delhi?" for a user researching Delhi→Barcelona. Addresses RC-9.

## Acceptance criteria
- Given a flight search event has `metadata.destination = 'Barcelona'` and `metadata.origin = 'Delhi'`, when `activityTracker` extracts the destination, then `dest = 'Barcelona'` (not `'Delhi'`).
- Given a flight search event where `metadata.destination` and `metadata.city` are both absent but `metadata.origin` is present, when `activityTracker` extracts the destination, then `dest` is `null` or is not used to update `primaryPlanningDestination` (origin is not substituted as destination).
- Given `primaryPlanningDestination` is updated with the correct destination, when the "Continue Planning" card renders (EP-05), then it displays the destination city (Barcelona), not the origin city (Delhi).
- Given the fix is live, when the flight search API is called from the frontend, then `metadata.destination` is always populated with the user's chosen destination city.

## Priority
Must — incorrect `primaryPlanningDestination` corrupts the "Continue Planning" card, the return_reminder notification, and the intent-ranked recommendation query. This fix is low-effort and high-impact.

## Dependencies
- EP-01 US-0101 (flight search tracking) should populate `metadata.destination` correctly in the frontend search call.
- EP-05 US-0501 ("Continue Planning" card) depends on correct `primaryPlanningDestination`.
- EP-06 US-0602 (return_reminder) depends on correct `primaryPlanningDestination`.
- EP-04 US-0401 (intent-ranked recommendations) depends on correct `primaryPlanningDestination`.
