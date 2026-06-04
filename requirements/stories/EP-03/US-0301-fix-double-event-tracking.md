---
id: US-0301
title: Fix double event tracking — remove booking events from frontend layer
epic: EP-03
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (code fix; no UI change)
feature_file: pending
---

# US-0301 — Fix double event tracking

**As a** platform owner
**I want** booking events (`booking_started`, `booking_completed`) to be tracked exactly once per booking
**So that** intent scores, tier classifications, and analytics counters reflect real behaviour, not 2× inflated figures

## Description
`booking_started` fires from both `BookingCheckoutPage.js` (frontend) and `bookings.js:174` (backend). `booking_completed` fires from both `BookingCheckoutPage.js:120,146` and `bookings.js:207`. The fix removes tracking from the frontend layer, keeping the backend as the single authoritative source. This is identified in root cause analysis as RC-4 and is Priority 1 in the priority ranking — all downstream intent work is invalid until this is resolved. This story is tightly related to EP-01 US-0104 (same fix, described from the activity-tracking perspective).

## Acceptance criteria
- Given a user completes a booking end-to-end, when the confirmation is returned, then exactly one `booking_started` and one `booking_completed` `UserActivity` record exist for that booking session.
- Given the fix is live, when `breakdown.bookingsStarted` is inspected for a user who made one booking, then the value is `1` (not `2`).
- Given the fix is live, when `breakdown.bookingsCompleted` is inspected for a user who completed one booking, then the value is `1` (not `2`).
- Given the frontend tracking calls are removed, when the booking page is loaded and a booking is initiated, then no JavaScript errors appear in the browser console related to removed tracking calls.
- Given the fix is live, when a user starts but does not complete a booking, then only one `booking_started` record exists with no corresponding `booking_completed`.

## Priority
Must — this is the single highest-priority fix in the entire personalization system. No intent score, tier, or recommendation can be trusted until this is resolved.

## Dependencies
- No blocking prerequisites; this fix can be made independently.
- EP-03 US-0302 (intent score calculation) and US-0303 (score reset) depend on this being correct first.
- EP-08 US-0803 (tier accuracy logging) depends on correct booking counts.
