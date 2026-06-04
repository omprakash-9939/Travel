---
id: US-0403
title: Decouple notification generation from preference aggregation batch
epic: EP-04
owner: TBD
reviewer: TBD
status: Draft
priority: Should
wireframe: n/a (backend architecture change)
feature_file: pending
---

# US-0403 — Decouple notification generation from preference aggregation batch

**As a** high-intent user who just searched Barcelona for the second time this week
**I want** to receive a return_reminder notification within the current session
**So that** I am nudged to book while I am actively on the platform, not up to 2 hours later after I may have already left

## Description
Currently, `buildRecommendations()` in `recommendationEngine.js:296` handles both preference-based recommendation ranking (slow, batch-appropriate, every 2 hours) and intent-triggered notification generation (`return_reminder`, `price_drop`) in a single pipeline. This means notifications cannot fire faster than the batch interval. The fix separates notification triggers into a lightweight, synchronous check that runs immediately after each `return_visit` event is emitted, independent of the aggregation batch. Addresses RC-2.

## Acceptance criteria
- Given a `return_visit` event is emitted for a `medium` or `high` intent user, when the event is processed, then a `return_reminder` notification is evaluated and generated within the same request/response cycle (not deferred to the next 2-hour batch window).
- Given a notification is generated in real time, when the user reloads their homepage in the same session, then the notification bell shows the `return_reminder`.
- Given the notification trigger is decoupled, when the 2-hour aggregation batch runs, then it still updates preference profiles and recommendation rankings but does NOT re-generate notifications already sent in the current session (dedup is preserved).
- Given the real-time notification check fails (e.g. DB timeout), when the error occurs, then the failure is logged and the user experience degrades gracefully (no notification that session — not a hard error).
- Given the batch job is delayed or skipped, when a `return_visit` event fires, then the real-time notification path still works independently.

## Priority
Should — high value for conversion (captures peak-intent window) but significant engineering effort (~5–8 developer-days). Depends on EP-01 and EP-03 fixes being stable first. Defer to Phase 3 per business-case.md.

## Dependencies
- EP-01 US-0105 (cross-session return visit detection) must be live — this story only fires on `return_visit` events.
- EP-03 US-0301 (double tracking fix) and US-0303 (score reset) must be live so the intent score being evaluated is correct.
- EP-06 US-0601 (disable price_drop) must ship before this story — decoupled triggers should not accelerate delivery of fabricated price-drop data.
