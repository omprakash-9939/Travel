---
id: FN-030301
title: Add intent score reset and cool-down on booking_completed
story: US-0303
owner: TBD
status: Draft
---

# FN-030301 — Intent score reset on booking_completed

## Purpose
After a `booking_completed` event fires, reset the user's intent score to 0 (or a configurable cool-down baseline) and record the booking destination so that destination-specific notifications can be suppressed during the cool-down period.

## Behaviour
- **Input:** `userId`, `destination` (the booked destination from booking metadata)
- **Process:**
  1. Set `UserIntentScore.score = 0` (or `BOOKING_COOLDOWN_SCORE`, default 0)
  2. Set `UserIntentScore.tier = 'low'`
  3. Add `{ destination, bookedAt: now, cooldownUntil: now + BOOKING_COOLDOWN_DAYS * 86400000 }` to a `bookingCooldowns[]` array on `UserIntentScore`
  4. Clear `sentNotifications[]` entries matching the booked destination
  5. Write the updated `UserIntentScore` document to MongoDB
- **Output:** `UserIntentScore.score = 0`, `tier = 'low'`, `bookingCooldowns` entry added for the destination, destination-specific `sentNotifications[]` cleared
- **Errors / edge cases:** `destination` absent from booking metadata — add a cooldown entry with `destination = null` (suppresses all notifications during cool-down); DB write failure — log error, allow booking confirmation to complete normally (tracking failure must not break checkout); `BOOKING_COOLDOWN_DAYS` defaults to 7 if not configured

## Serves
- Acceptance criteria: US-0303 AC-1 (score reset to 0 on booking_completed), AC-2 (tier transitions to low), AC-3 (no return_reminder generated during cool-down), AC-4 (cool-down persists for 7 days without new searches), AC-5 (new searches after cool-down resume from zero normally)
- EP-06 US-0603 (post-booking notification suppression) reads `bookingCooldowns[]` to gate notification generation

## Build notes (for the agent)
- File to modify: `backend/services/personalization/activityTracker.js` — add reset logic inside the `booking_completed` handler in the `track()` method
- The `bookingCooldowns[]` array does not yet exist on `UserIntentScore` — add it to the model schema as `[{ destination: String, bookedAt: Date, cooldownUntil: Date }]`
- The `sentNotifications[]` clear should filter out entries where `metadata.destination === bookedDestination`, not clear the entire array (user may have notifications for other destinations)
- `BOOKING_COOLDOWN_DAYS` should be defined in the same `INTENT_WEIGHTS` config object or a dedicated `INTENT_CONFIG` constant for a single point of configuration
