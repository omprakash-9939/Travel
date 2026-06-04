---
id: FN-030401
title: Fix metadata destination extraction — do not fall through to origin
story: US-0304
owner: TBD
status: Draft
---

# FN-030401 — Fix metadata destination extraction

## Purpose
Fix the destination extraction fallback in `activityTracker.js:132` so that `metadata.origin` (the departure city) is never used as the planning destination, preventing `primaryPlanningDestination` from being set to the city the user is flying *from* rather than *to*.

## Behaviour
- **Input:** `metadata` object from a `flight_search` or `flight_view` event — may contain `metadata.destination`, `metadata.city`, `metadata.origin`, or some combination
- **Process:**
  1. Extract destination as: `const dest = metadata.destination || metadata.city || null` — remove `|| metadata.origin` from the fallback chain
  2. If `dest` is null after the extraction, do not update `primaryPlanningDestination` (a null destination is safer than a wrong one)
  3. Ensure the frontend `flight_search` call always populates `metadata.destination` with the user's chosen destination city so `dest` is never null for a valid search
- **Output:** `primaryPlanningDestination` is always the arrival/destination city (or unchanged if destination is genuinely absent from metadata)
- **Errors / edge cases:** `metadata.destination` absent AND `metadata.city` absent — `dest = null`, `primaryPlanningDestination` not updated; this is correct for events with incomplete metadata; hotel_search events use `metadata.city` as the destination, which is already correct

## Serves
- Acceptance criteria: US-0304 AC-1 (Barcelona extracted, not Delhi), AC-2 (origin not substituted), AC-3 (Continue Planning card shows correct destination), AC-4 (frontend populates metadata.destination)
- EP-05 US-0501 (Continue Planning card), EP-06 US-0602 (return_reminder), EP-04 US-0401 (intent-ranked recs) all consume `primaryPlanningDestination`

## Build notes (for the agent)
- File to modify: `backend/services/personalization/activityTracker.js:132`
- Change: `const dest = metadata.destination || metadata.city || metadata.origin;` → `const dest = metadata.destination || metadata.city || null;`
- Frontend fix (coordinated): `frontend/src/context/PersonalizationContext.js` — ensure the `flight_search` track call passes `destination: searchParams.destination` (the to-city), not `origin: searchParams.origin`
- This is a one-line backend fix plus a verification that the frontend metadata payload is correct — verify both in the same PR
