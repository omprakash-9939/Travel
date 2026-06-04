---
id: US-0603
title: Suppress notifications after booking completion
epic: EP-06
owner: TBD
reviewer: TBD
status: Built (Phase 1) — notifications suppressed for destinations in bookingCooldowns (7-day window)
priority: Must
wireframe: n/a (notification suppression logic; no visible UI until after booking)
feature_file: pending
---

# US-0603 — Suppress notifications after booking completion

**As a** user who has just booked a Barcelona flight
**I want** all Barcelona-related notifications to stop immediately
**So that** I do not receive "Still thinking about Barcelona?" messages after confirming my booking, which would feel confusing and erode trust

## Description
Currently, `booking_completed` adds 50 pts to the intent score (no reset), and the `sentNotifications[]` dedup window is only 48 hours. A converted user stays in `high` tier and can receive `return_reminder` notifications again 48 hours after booking. This story ensures that after `booking_completed` fires: (1) the intent score is reset (EP-03 US-0303), (2) destination-specific `sentNotifications[]` entries are cleared or extended, and (3) no new `return_reminder` or `selling_fast` notifications fire for the booked destination during a configurable cool-down period (minimum 7 days).

## Acceptance criteria
- Given a user completes a booking for Barcelona, when `booking_completed` fires, then all existing `return_reminder` and `selling_fast` notifications for Barcelona are cleared from `sentNotifications[]`.
- Given the notifications are cleared and the intent score is reset (US-0303), when the notification engine next evaluates the user, then no new Barcelona notifications are generated during the cool-down period (7 days by default).
- Given the cool-down period expires (7 days after booking), when the user searches Barcelona again (new trip planning), then intent scoring and notifications resume normally from zero.
- Given a user books Barcelona but has separate active intent for Singapore, when notifications are evaluated after the Barcelona booking, then Singapore notifications are unaffected.
- Given the booking cool-down is active, when the user opens their notification bell, then no stale Barcelona urgency notifications appear.

## Priority
Must — this is a direct trust and brand risk. Predictable support ticket driver (S3 concern). Low engineering effort to implement.

## Dependencies
- EP-03 US-0303 (intent score reset) is a prerequisite — this story extends the post-booking behaviour to notification suppression.
- EP-03 US-0301 (double tracking fix) must be live so the score being reset is correct.
