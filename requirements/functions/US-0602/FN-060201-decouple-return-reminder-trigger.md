---
id: FN-060201
title: Decouple return_reminder trigger from aggregation batch
story: US-0602
owner: TBD
status: Draft
---

# FN-060201 — Decouple return_reminder trigger from aggregation batch

## Purpose
Extract the `return_reminder` notification generation logic from the 2-hour aggregation batch and invoke it synchronously within the `return_visit` event tracking path, so the notification is available within the same HTTP request cycle as the qualifying event.

## Behaviour
- **Input:** `userId`, `intent` (current intent object with `tier`, `primaryPlanningDestination`, `score`), `sentNotifications[]`
- **Process:**
  1. Create a new function `maybeGenerateReturnReminder(userId, intent, sentNotifications)` extracted from `buildNotifications()` in `recommendationEngine.js`
  2. This function checks: (a) `intent.tier === 'medium' || intent.tier === 'high'`, (b) `intent.primaryPlanningDestination` is set, (c) no `return_reminder` for this destination already in `sentNotifications[]` within 48 hours
  3. If all conditions pass: generate the `return_reminder` notification, push it to the user's `notifications[]` array, and add the dedup entry to `sentNotifications[]`
  4. Call this function from within the `track()` method in `activityTracker.js` immediately after a `return_visit` event is created and the intent score is updated
  5. The 2-hour batch job should skip `return_reminder` generation for users where `sentNotifications[]` shows a recent entry (dedup prevents duplication)
- **Output:** `return_reminder` notification added to user's notification list within the same request/response cycle as the `return_visit` event
- **Errors / edge cases:** DB write failure for notification — log error, continue (do not fail the originating request); intent score not yet updated when this runs — read current intent from DB before checking tier; `primaryPlanningDestination` null — skip notification generation

## Serves
- Acceptance criteria: US-0602 AC-1 (notification within same request cycle), AC-2 (visible in bell without reload), AC-3 (content: "Still thinking about [dest]?"), AC-4 (48h dedup respected), AC-5 (low tier no notification)
- EP-04 US-0403 (decouple notification from batch) is the epic-level architectural story; this function is the implementation unit

## Build notes (for the agent)
- Files to modify: `backend/services/personalization/recommendationEngine.js` (extract function), `backend/services/personalization/activityTracker.js` (call the extracted function after `return_visit`)
- The extracted `maybeGenerateReturnReminder` should be imported by `activityTracker.js` — avoid circular dependency by placing it in a shared `notificationHelpers.js` file if needed
- Ensure the batch job's `buildNotifications()` still calls the full notification suite but deduplicates against the newly-created real-time notification via the same `sentNotifications[]` check
