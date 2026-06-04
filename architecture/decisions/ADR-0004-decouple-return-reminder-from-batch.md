# ADR-0004 — Decouple return_reminder notification from 2-hour aggregation batch

**Date:** 2026-06-04
**Status:** Accepted
**Deciders:** Architecture team
**Stories:** EP-04 US-0403 (RC-2), EP-06 US-0602

---

## Context

The `return_reminder` notification ("Still thinking about Barcelona?") is the highest-conversion intervention in the system. It is currently generated inside `buildNotifications()`, which is called by `buildRecommendations()`, which is called by the 2-hour aggregation batch job. A user who returns to search Barcelona for the second time may wait up to 2 hours before seeing the notification. By then, the session is over. This is root cause RC-2.

The fix must ensure the notification is available within the same HTTP request cycle as the qualifying event (US-0602 AC-1).

**Options considered:**

| Option | Description |
|--------|-------------|
| A | Extract `maybeGenerateReturnReminder()` from `buildNotifications()` and call it synchronously inside `activityTracker.track()` immediately after the `return_visit` event is created |
| B | Fire a webhook / internal HTTP call from the track handler to a notification service |
| C | Keep batch, but reduce batch interval to 5 minutes |

---

## Decision

**Option A — extracted synchronous function called from `activityTracker.track()`.**

A new function `maybeGenerateReturnReminder(userId, intent, sentNotifications)` is extracted from `buildNotifications()` in `recommendationEngine.js` and moved to `notificationHelpers.js` (a new file to avoid circular dependencies).

It is called inside `activityTracker.track()` immediately after `updateIntentScore()` returns, when a `return_visit` event has been created.

The 2-hour batch job's `buildNotifications()` retains its full logic but deduplicates against the real-time notification via the `sentNotifications[]` array (48-hour dedup window already in place).

---

## Rationale

- **Option C (5-min batch)** still fails AC-1 ("within the same HTTP request cycle"). A user could navigate away in under 5 minutes.
- **Option B (webhook)** adds network latency, a new service endpoint, and retry logic. It introduces eventual consistency where the product requires synchronous confirmation. Overkill for POC scale.
- **Option A** satisfies AC-1 with no new infrastructure. The dedup mechanism (`sentNotifications[]`) prevents the batch from generating a duplicate notification.
- **Circular dependency** between `activityTracker.js` and `recommendationEngine.js` is resolved by placing the shared helper in `notificationHelpers.js`, which both can import.

---

## Implementation Shape

```
notificationHelpers.js (new)
  └── maybeGenerateReturnReminder(userId, intent, sentNotifications)
        ├── Guard: intent.tier in ['medium', 'high']
        ├── Guard: intent.primaryPlanningDestination is set
        ├── Guard: no return_reminder for this destination in sentNotifications within 48h
        ├── Guard: bookingCooldowns[] does not include this destination
        ├── Action: push notification to User.notifications[] (or UserIntentScore)
        └── Action: record { type: 'return_reminder', sentAt: now } in sentNotifications[]

activityTracker.track() (modified)
  └── After updateIntentScore():
        └── if eventType === 'return_visit':
              → import and call maybeGenerateReturnReminder()

aggregationJob → buildRecommendations → buildNotifications (unchanged)
  └── buildNotifications() checks sentNotifications[] → skip return_reminder if recently sent
```

---

## Consequences

**Positive:**
- `return_reminder` is available before the response is returned. Session-active conversion window preserved.
- No new infrastructure.
- Batch job continues to build all other notifications (price_drop gated, selling_fast gated, new_deal gated).

**Negative / Trade-offs:**
- `activityTracker.track()` now performs an additional DB write (notification push) on `return_visit` events. This adds ~5–20ms latency to the track endpoint for return visits only.
- `notificationHelpers.js` must be kept stateless and pure to be safely imported by both `activityTracker` and `recommendationEngine` without circular dependency issues.
- The batch job's `buildNotifications()` will skip `return_reminder` for most users (already sent real-time). The batch still runs for all other notification types.

**Dependencies:**
- EP-01 US-0105 (cross-session return visit detection fix) must land first.
- EP-03 US-0302 (intent score) must be live.
- EP-06 US-0601 (price_drop disabled) should land before or alongside this change.
