---
id: FN-010401
title: Remove frontend booking event tracking calls
story: US-0104
owner: TBD
status: Draft
---

# FN-010401 — Remove frontend booking event tracking calls

## Purpose
Remove the `trackBookingStart` and `trackBookingComplete` calls from `BookingCheckoutPage.js` so that booking events are tracked exactly once (by the backend `bookings.js`), eliminating the double-counting that inflates all booking-related intent score counters.

## Behaviour
- **Input:** The booking checkout flow in `BookingCheckoutPage.js` — identifies the two tracking call sites: (1) `trackBookingStart` call before payment initiation; (2) `trackBookingComplete` calls at lines ~120 and ~146
- **Process:** Delete or comment out the frontend `trackBookingStart` and `trackBookingComplete` calls. Retain all payment flow logic, navigation, and UI state updates — only the personalization tracking side effects are removed
- **Output:** Booking checkout completes normally; only one `booking_started` record and one `booking_completed` record exist in `UserActivity` per booking (sourced from `bookings.js:174` and `bookings.js:207`)
- **Errors / edge cases:** If the user cancels mid-checkout (abandons after `booking_started` fires from backend), no `booking_completed` is created — this is correct behaviour; do not add frontend tracking to compensate for this edge case

## Serves
- Acceptance criteria: US-0104 AC-1 (exactly one record per event), AC-2 (breakdown.bookingsStarted = 1), AC-3 (score increments once), AC-4 (no JS errors after removal)
- EP-03 US-0301 (same fix, described from intent engine perspective) is the sister story — coordinate so the fix is done once across both stories

## Build notes (for the agent)
- Files to modify: `frontend/src/pages/BookingCheckoutPage.js` — remove `trackBookingStart(...)` and `trackBookingComplete(...)` calls
- Do NOT remove: payment logic, navigation calls, UI state (loading/error/success), `sessionStorage.setItem('pendingCheckout', ...)` Stripe path
- Verify: after the change, a complete end-to-end booking test should produce exactly one `booking_started` and one `booking_completed` in MongoDB for the test user
- Backend authority: `backend/routes/bookings.js:174` (`tracker.trackBookingStart`) and `:207` (`tracker.trackBookingDone`) remain as the sole tracking source
