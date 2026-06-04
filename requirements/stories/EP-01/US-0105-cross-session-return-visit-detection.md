---
id: US-0105
title: Detect cross-session return visits
epic: EP-01
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend detection logic)
feature_file: pending
---

# US-0105 — Detect cross-session return visits

**As an** authenticated user who returns to the platform after a previous session
**I want** my return to be detected even when I open a new browser tab or a new session
**So that** the intent engine registers the `return_visit` event and can trigger a timely return_reminder notification

## Description
Currently, `maybeReturnVisit()` in `activityTracker.js:70–77` checks for prior activity matching both `userId` AND the same `sessionId`. Because `sessionId` is stored in `sessionStorage`, it resets on every new tab or new browser session. The result: `return_visit` events (worth 15 pts) almost never fire for their intended scenario (a user who was away for days and came back). The fix rewrites the query to find any prior `UserActivity` for the same `userId` from a **different** session that occurred more than 30 minutes ago. Addresses RC-3.

## Acceptance criteria
- Given a user searched for a destination yesterday (session A) and today opens the app in a new tab (session B), when any activity event is tracked in session B, then `maybeReturnVisit()` detects a prior session A record and emits a `return_visit` event.
- Given a user has no prior `UserActivity` records (first visit), when their first event is tracked, then `maybeReturnVisit()` does not emit a `return_visit` event.
- Given a user's most recent prior activity was less than 30 minutes ago in the same session, when a new event is tracked, then `maybeReturnVisit()` does not emit an additional `return_visit` event (intra-session dedup).
- Given a `return_visit` event is emitted, when the intent score is recalculated, then the user's score increments by the configured `return_visit` weight (currently 15 pts).
- Given the fix is live, when a repeat-searching user (Barcelona scenario) returns in a new session, then `breakdown.returnVisits` increments by 1 for that return.

## Priority
Must — this is the core signal for the Barcelona scenario. The `return_reminder` notification (EP-06 US-0602) is effectively non-functional until this story is resolved.

## Dependencies
- Depends on EP-01 US-0104 (double-tracking fix) landing first to avoid double-counting the return_visit increment.
- EP-06 US-0602 (return_reminder near-real-time) depends on this story.
- EP-05 US-0501 ("Continue Planning" card) depends on correct `return_visit` signal to surface the card.
