---
id: US-0104
title: Fix booking lifecycle event tracking — remove double-tracking
epic: EP-01
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend/frontend plumbing fix; no UI change)
feature_file: pending
---

# US-0104 — Fix booking lifecycle event tracking (remove double-tracking)

**As a** platform owner
**I want** each `booking_started` and `booking_completed` event to be tracked exactly once
**So that** intent scores, breakdown counters, and tier classifications reflect real user behaviour rather than doubled figures

## Description
Currently, `booking_started` fires from both `BookingCheckoutPage.js` (frontend, via `trackBookingStart`) and `bookings.js:174` (backend, via `tracker.trackBookingStart`). Likewise, `booking_completed` fires from both `BookingCheckoutPage.js:120,146` and `bookings.js:207`. This doubles every booking counter and inflates the intent score by 2× for each event, pushing users into `high` tier prematurely. Addresses RC-4. Resolution: remove tracking from the frontend layer; keep it authoritative on the backend.

## Acceptance criteria
- Given a user completes a booking, when the booking confirmation is returned, then exactly one `booking_started` `UserActivity` record and exactly one `booking_completed` `UserActivity` record exist for that booking.
- Given the fix is in place, when `breakdown.bookingsStarted` and `breakdown.bookingsCompleted` are inspected, then each reflects the true count (not 2×).
- Given a `booking_completed` event fires, when the intent score is recalculated, then the score increments by the configured `booking_completed` weight exactly once (currently 50 pts).
- Given the frontend tracking calls are removed, when the booking flow is tested end-to-end, then no frontend JavaScript errors occur on the booking page.

## Priority
Must — this is a prerequisite for all intent scoring work in EP-03. All other personalization features produce incorrect results until this is resolved.

## Dependencies
- Must ship before any EP-03 intent scoring work is evaluated as correct.
- Coordinate with EP-03 US-0303 (score reset): once double-tracking is fixed, the reset logic must use the corrected single-count score.
- No UI dependency; this is a plumbing change to `BookingCheckoutPage.js` and confirmation that `bookings.js` backend tracking is retained.
