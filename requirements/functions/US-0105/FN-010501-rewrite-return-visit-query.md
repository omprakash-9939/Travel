---
id: FN-010501
title: Rewrite maybeReturnVisit to detect cross-session returns
story: US-0105
owner: TBD
status: Draft
---

# FN-010501 — Rewrite maybeReturnVisit to detect cross-session returns

## Purpose
Rewrite `maybeReturnVisit()` in `activityTracker.js:70–77` to detect that a user has returned from a previous session, rather than accidentally requiring the same `sessionId` (which resets on every new tab or browser session).

## Behaviour
- **Input:** `userId`, `currentSessionId`, `currentTimestamp`
- **Process:**
  1. Query `UserActivity.findOne({ user: userId, sessionId: { $ne: currentSessionId } })` sorted by `createdAt: -1` — finds the most recent activity record from any OTHER session
  2. If a prior different-session record exists AND its `createdAt` is more than 30 minutes before `currentTimestamp`, then it is a genuine cross-session return → emit `return_visit` event
  3. If no prior different-session record exists → first visit, no event emitted
  4. If the prior record is < 30 minutes old → intra-session activity, no `return_visit` emitted (prevents false-positives from same-tab idle)
- **Output:** `return_visit` `UserActivity` record created if conditions are met; `false` returned otherwise
- **Errors / edge cases:** DB query timeout — log error, return `false` (do not throw); user with only current session records — returns `false` correctly; userId missing (unauthenticated) — guard at caller site, not in this function

## Serves
- Acceptance criteria: US-0105 AC-1 (new tab return detected), AC-2 (first visit no event), AC-3 (intra-session dedup), AC-4 (score increments), AC-5 (breakdown.returnVisits increments)
- EP-06 US-0602 (return_reminder) and EP-05 US-0501 (Continue Planning card) both depend on this function firing correctly

## Build notes (for the agent)
- File to modify: `backend/services/personalization/activityTracker.js` — rewrite the `maybeReturnVisit` function
- Current broken query (lines 70–77): `UserActivity.findOne({ user: userId, sessionId })` — this wrongly requires the same session
- Corrected query: `UserActivity.findOne({ user: userId, sessionId: { $ne: currentSessionId }, createdAt: { $lt: new Date(currentTimestamp - 30 * 60 * 1000) } }).sort({ createdAt: -1 })`
- The `UserActivity` collection has an index on `(user, createdAt)` — the query is efficient; no new index required
- After the fix, verify with a test: create two activity records for the same user with different `sessionId` values separated by > 30 minutes; call `maybeReturnVisit` with the second sessionId and confirm a `return_visit` event is emitted
