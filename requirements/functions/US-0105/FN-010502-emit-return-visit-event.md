---
id: FN-010502
title: Emit return_visit UserActivity event on cross-session detection
story: US-0105
owner: TBD
status: Draft
---

# FN-010502 — Emit return_visit UserActivity event

## Purpose
After FN-010501 detects a cross-session return, create the `return_visit` `UserActivity` record and increment the user's intent score by the configured weight (15 pts).

## Behaviour
- **Input:** `userId`, `sessionId`, `currentDestination` (from the triggering activity event's metadata)
- **Process:**
  1. Create `UserActivity({ user: userId, eventType: 'return_visit', sessionId, metadata: { destination: currentDestination }, createdAt: now })`
  2. Call `track({ userId, eventType: 'return_visit', metadata })` to trigger the intent score increment (15 pts via `INTENT_WEIGHTS.return_visit`)
  3. Increment `UserIntentScore.breakdown.returnVisits` by 1
- **Output:** `UserActivity` record of type `return_visit`; intent score updated; `breakdown.returnVisits` incremented by 1
- **Errors / edge cases:** DB write failure — log error, do not re-throw (the triggering request should not fail because of a tracking side-effect); duplicate `return_visit` within 5 minutes for the same user/session — deduplicate using a simple in-memory check or a `createdAt` query guard

## Serves
- Acceptance criteria: US-0105 AC-4 (score increments by 15 pts on return_visit), AC-5 (breakdown.returnVisits increments)
- EP-06 US-0602 depends on the `return_visit` event being emitted to trigger the near-real-time `return_reminder` notification

## Build notes (for the agent)
- This function is called by FN-010501 when a cross-session return is confirmed
- The `track()` method already handles score increments from `INTENT_WEIGHTS` — ensure `return_visit` is in the weights map (it already is at 15 pts per `activityTracker.js:19`)
- The `breakdown.returnVisits` counter update should be part of the same `findOneAndUpdate` call on `UserIntentScore` to avoid a race condition
