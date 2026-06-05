---
id: US-0303
title: Reset intent score and suppress notifications after booking completion
epic: EP-03
owner: TBD
reviewer: TBD
status: Built (Phase 1) — score reset to 0 + bookingCooldowns on booking_completed
priority: Must
wireframe: n/a (backend logic; visible effect is absence of notifications)
feature_file: pending
---

# US-0303 — Reset intent score and suppress notifications after booking completion

**As a** user who has just completed a booking for Barcelona
**I want** to stop receiving "Still thinking about Barcelona?" notifications
**So that** the platform does not feel broken or tone-deaf after I have already converted

## Description
Currently, `booking_completed` adds 50 pts to the intent score (`INTENT_WEIGHTS.booking_completed = 50`) and there is no reset or cool-down. A converted user stays in `high` tier and continues receiving urgency notifications for their now-booked destination. The `sentNotifications[]` dedup window is only 48 hours, meaning the `return_reminder` can reappear 2 days after a confirmed booking. This story adds a score reset (or cool-down period) on `booking_completed` and clears the `sentNotifications[]` for the booked destination. Addresses RC-5.

## Acceptance criteria
- Given a user completes a booking for Barcelona, when `booking_completed` is tracked, then the user's intent score is reset to 0 (or to a configurable cool-down baseline, e.g. 10).
- Given the score is reset, when the tier is re-evaluated immediately after booking, then the tier transitions to `low`.
- Given the tier is `low`, when the notification engine evaluates what to send, then no `return_reminder` is generated for the booked destination.
- Given 48 hours pass after a booking and the user has not searched the same destination again, when the notification engine runs, then no `return_reminder` is generated (cool-down persists until a new search cycle begins).
- Given a user books Barcelona and then 10 days later searches Barcelona again (e.g. a second trip), when the new search events accumulate, then the intent score and notifications resume from zero normally.

## Priority
Must — sending "You haven't booked yet!" notifications to users who have just booked is a first-class trust risk and a predictable source of support tickets (S3 stakeholder concern).

## Dependencies
- EP-03 US-0301 (double-tracking fix) must ship first; a doubled score inflates the pre-reset value.
- EP-06 US-0603 (notification suppression after booking) depends on this story being live.
- EP-08 US-0805 (admin tooling) can provide a manual reset path as a fallback before this automated reset is in place.
