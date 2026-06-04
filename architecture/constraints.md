# Constraints — DataArt Travel Personalization Engine

NFRs from the requirements mapped to concrete architectural constraints.

---

## Performance

| NFR | Source | Architectural Constraint |
|-----|--------|--------------------------|
| `return_reminder` notification available within the same HTTP request cycle | US-0602 AC-1 | `maybeGenerateReturnReminder()` must execute synchronously inside `activityTracker.track()`, not in the 2-hr batch. No async queue hop is acceptable for Phase 3. |
| Recommendation cache must serve within 100ms for cached users | EP-04 scope | `RecommendationCache` lookup is a single MongoDB `findOne` by `userId`. No joins, no aggregation on the hot path. Cache miss triggers background rebuild, returns stale or cold-start. |
| 90-day preference aggregation must complete within 90 minutes per cycle | US-0804 | Batch processes 50 users in parallel (`Promise.allSettled`). Alert ops if cycle exceeds 90 min. Single-user aggregation must not exceed 5s (MongoDB 90-day scan on indexed `(user, createdAt)`). |
| Intent score update in every `track()` call | US-0302 | `updateIntentScore()` is a synchronous upsert after every event. No eventual consistency — tier must be current before the response is returned. |

## Scalability

| NFR | Source | Architectural Constraint |
|-----|--------|--------------------------|
| Batch processes up to 50 users concurrently | US-0201 AC-5 | `BATCH_SIZE = 50` in `aggregationJob.js`. Increase only after measuring MongoDB connection saturation. |
| Stateless API for horizontal scaling | Phase 3 ops | All session state lives in MongoDB. JWT is self-contained. No sticky sessions. |
| Recommendation cache reduces repeated aggregation load | EP-04 scope | 6-hour TTL on `RecommendationCache`. Build is triggered by batch job or cache miss — not on every API request. |
| MongoDB index on `(user, createdAt)` on `UserActivity` | US-0201 dep | Required before production load. Query without this index is a full collection scan. |

## Availability

| NFR | Source | Architectural Constraint |
|-----|--------|--------------------------|
| SendGrid failure must not block intent scoring | FN-060401 | SendGrid errors are caught and logged at ERROR level. The `track()` call continues. No retry blocking the request. |
| Amadeus failure must not block the homepage | EP-04 scope | Recommendation builds fall back to `flightFallback.js` when Amadeus is unavailable. |
| Aggregation job failure for one user must not cancel the batch | US-0804 | `Promise.allSettled()` isolates per-user failures. Failed users logged with userId + error. |

## Security

| NFR | Source | Architectural Constraint |
|-----|--------|--------------------------|
| All personalization data is user-scoped | EP-01–EP-08 | Every MongoDB query in `activityTracker`, `preferenceEngine`, `recommendationEngine` must include `{ user: userId }` filter. Cross-user reads are not permitted by design. |
| Admin endpoints require elevated role | US-0805 | `middleware/auth.js` must enforce `user.role === 'admin'` on all `/api/admin/*` routes. |
| Fabricated `price_drop` data must be disabled before production | US-0601 (legal) | `buildNotifications()` must gate `price_drop` behind `ENABLE_PRICE_DROP_NOTIFICATIONS === 'true'`. Default `false`. This is a legal risk item — it must ship in Phase 1. |
| Re-engagement email must be gated behind tier accuracy validation | US-0604 dep, FN-060401 | `ENABLE_REENGAGEMENT_EMAILS` defaults to `false`. Only enable after EP-08 US-0803 validates tier accuracy over 30 days. |
| JWT must be validated on every API request | EP-01–EP-08 | `middleware/auth.js` applied to all `/api/personalization/*`, `/api/bookings/*`, `/api/admin/*` routes. Anonymous access only to public endpoints. |
| Secrets never in source code | All | All keys and secrets loaded from `.env`. `.env` is in `.gitignore`. `.env.example` has no real values. |

## Correctness / Data Integrity

| NFR | Source | Architectural Constraint |
|-----|--------|--------------------------|
| Double booking event tracking must be eliminated before intent scores are trusted | US-0301, US-0104 (RC-4) | Frontend must not call the personalization track endpoint for `booking_completed`; only the backend booking service calls `trackBookingDone()`. One source of truth for booking events. |
| `primaryPlanningDestination` must never be set from the origin IATA code | US-0304 (RC-9) | `metadata.destination` must be extracted from the destination field, not `metadata.origin`. Fix must land before EP-04 intent-first recommendations. |
| Return-visit detection must use cross-session DB query | US-0105 (RC-3) | `maybeReturnVisit()` must query `{ user, sessionId: { $ne: currentSessionId }, createdAt: { $lt: 30min ago } }`, not same-session records. Fix must land before EP-06 return_reminder. |
| Cabin metadata must be present in flight-view events | US-0103 (RC-8) | `trackFlightView()` must include `metadata.cabin` derived from `cabin.js` utility before `aggregatePreferences()` builds cabin preference. |

## Observability

| NFR | Source | Architectural Constraint |
|-----|--------|--------------------------|
| Aggregation job must alert if cycle exceeds 90 minutes | US-0804 | `aggregationJob.runOnce()` must record start + end wall-clock time and log at WARN if `> 90 * 60 * 1000 ms`. |
| Intent tier transitions must be logged | US-0803 | When `updateIntentScore()` results in a tier change, log `{ userId, prevTier, newTier, score, timestamp }` at INFO level for EP-08 accuracy tracking. |
| Notification CTR events must be captured | US-0801 | A `POST /api/personalization/notification-click` endpoint must record `{ notificationId, type, action: 'navigate'|'dismiss' }` as a `UserActivity` event for EP-08 analysis. |

## Compliance / Trust

| NFR | Source | Architectural Constraint |
|-----|--------|--------------------------|
| No fabricated urgency signals in production | US-0601 (RC-6, legal) | `price_drop`, `selling_fast`, `new_deal` notifications are disabled by default via feature flags. `price_drop` requires real Amadeus price-feed integration before re-enabling. |
| A/B test must run for minimum 30 days before drawing conclusions | US-0703 | The A/B framework stores `assignedAt` timestamp. Reporting endpoints must refuse to show conversion lift if `assignedAt` < 30 days ago. |
