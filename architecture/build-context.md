# Build Context — DataArt Travel Personalization Engine

**Read this before building anything in this repository.**

Last updated: 2026-06-04

---

## What this is

A travel booking platform with a personalization engine. Users search flights and hotels, and the system learns their preferences to surface relevant recommendations and send timely notifications. The platform is a React 18 SPA backed by an Express 4 / Node.js API using MongoDB as the primary datastore.

---

## Stack (pinned)

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React (CRA) | 18.2.0 |
| Routing | react-router-dom | 6.20.1 |
| HTTP client | Axios | 1.6.2 |
| Icons | lucide-react | 0.294.0 |
| Backend | Express | 4.18.2 |
| Runtime | Node.js | 18+ LTS |
| ODM | Mongoose | 8.0.3 |
| Database | MongoDB Atlas | M0 (dev) / M10+ (prod) |
| Auth | jsonwebtoken | 9.0.2 |
| Password | bcryptjs | 2.4.3 |
| Logging | Morgan (HTTP) + structured console | built-in |
| Tests (FE) | Jest + @testing-library/react | 13.4.0 |

**No Redis. No queue library. No TypeScript. No CSS framework.**

---

## Repo layout

```
Travel/
├── frontend/src/
│   ├── components/     Reusable UI — PascalCase filenames
│   ├── pages/          Route pages — PascalCase filenames
│   ├── context/        React Context providers
│   └── hooks/          Custom hooks
├── backend/
│   ├── middleware/     auth.js — JWT verify + role check
│   ├── models/         Mongoose schemas (PascalCase)
│   ├── routes/         Express routers (camelCase)
│   ├── services/       Business logic (camelCase)
│   │   ├── activityTracker.js      ← event ingestion + intent scoring
│   │   ├── preferenceEngine.js     ← 90-day aggregation
│   │   ├── recommendationEngine.js ← ranking + cache build
│   │   └── notificationHelpers.js  ← real-time notification triggers (NEW in EP-06)
│   ├── jobs/
│   │   └── aggregationJob.js       ← 2-hr batch (setInterval)
│   └── utils/
│       └── cabin.js                ← cabin class utilities
└── architecture/       This folder — read system-context.md for full picture
```

---

## Personalization service map

| File | Responsibility | Called by |
|------|---------------|-----------|
| `activityTracker.js` | Track events → update `UserIntentScore` | Route handlers (POST /track) |
| `preferenceEngine.js` | Aggregate 90-day `UserActivity` → `UserPreference` | `aggregationJob`, cache miss |
| `recommendationEngine.js` | Rank flights+hotels, build `RecommendationCache` | `aggregationJob`, GET /recommendations |
| `notificationHelpers.js` | Real-time `return_reminder` trigger | `activityTracker` (EP-06 target) |
| `aggregationJob.js` | 2-hr batch: pref agg + reco build for active users | `server.js` on startup |

---

## Key data models

| Model | Purpose | Key fields |
|-------|---------|-----------|
| `User` | Auth + A/B group | `email`, `role`, `abGroup`, `abGroupAssignedAt` |
| `UserActivity` | Immutable event log | `user`, `sessionId`, `eventType`, `metadata`, `intentPoints` |
| `UserIntentScore` | Real-time intent state | `user`, `score`, `tier`, `primaryPlanningDestination`, `sentNotifications[]`, `bookingCooldowns[]` |
| `UserPreference` | 90-day aggregated profile | `user`, `favoriteDestinations[]`, `preferredCabin`, `budget`, `lastAggregatedAt` |
| `RecommendationCache` | 6-hr pre-built recommendations | `user`, `recommendedFlights[]`, `recommendedHotels[]`, `notifications[]`, `validUntil` |

---

## Patterns to follow

### Event tracking
```js
// All event tracking goes through activityTracker.track()
// Never write directly to UserActivity or UserIntentScore from route handlers
await tracker.track(userId, 'flight_search', { origin, destination, cabin }, sessionId);
```

### Intent score update
```js
// INTENT_WEIGHTS object in activityTracker.js is the single source of truth for weights
// Do not scatter weight constants; change the config object only
```

### Recommendation cache
```js
// Always use getRecommendations(userId) — never call buildRecommendations() directly from routes
// getRecommendations() handles cache hit/miss automatically
const data = await getRecommendations(userId);
```

### Notification dedup
```js
// Always check recentlySent(intent, type) before pushing a notification
// 48-hour window for in-app, 7-day window for email
if (recentlySent(intent, 'return_reminder')) return;
```

### User ID scoping
```js
// ALWAYS extract userId from req.user (set by auth middleware)
// NEVER use userId from req.body or req.params for data reads
const userId = req.user.id;  // from verified JWT
```

### Feature flags
```js
// Check process.env flag before executing feature-gated code
if (process.env.ENABLE_PRICE_DROP_NOTIFICATIONS !== 'true') return;
```

### Error handling in personalization services
```js
// Personalization errors must NEVER break the main request flow
// Log at ERROR level, return fallback (cold-start or cached stale data)
try {
  await maybeGenerateReturnReminder(...);
} catch (err) {
  console.error('[NotificationHelper] return_reminder.failed', { userId, error: err.message });
}
```

---

## Patterns to avoid

| Anti-pattern | Why | Instead |
|-------------|-----|---------|
| `req.body.userId` for DB queries | Cross-user data leak | Use `req.user.id` from JWT |
| Calling `buildRecommendations()` from a route handler on every request | Performance | Use `getRecommendations()` which checks cache first |
| Adding weight constants outside `INTENT_WEIGHTS` | Config drift | All weights in the config object |
| Trusting `metadata.origin` as the destination | RC-9 bug | Use `metadata.destination` only |
| Same-session `maybeReturnVisit()` query | RC-3 bug | Query `sessionId: { $ne: currentSessionId }` |
| Calling `track()` from frontend for `booking_completed` | RC-4 double tracking | Only the backend booking service calls `trackBookingDone()` |
| Generating `price_drop` without real Amadeus price data | RC-6 legal risk | Gate behind `ENABLE_PRICE_DROP_NOTIFICATIONS=false` |

---

## Intent score weights (current — unvalidated)

```
flight_search:      5 pts
hotel_search:       5 pts
flight_view:        3 pts   # lowered 10→3 in discovery; a view is a weak signal (US-0302)
hotel_view:         3 pts
return_visit:      15 pts
booking_started:   25 pts
booking_completed: 50 pts   # see reset rule below
wishlist_added:     5 pts
repeat_search_bonus: +10 (same dest, 7-day window)
```

**Tier thresholds:** low < 31, medium 31–70, high ≥ 71
*(Engineering estimates — calibrate from EP-08 US-0803 tier accuracy data after 30 days)*

**Post-booking reset (US-0303 / US-0603, RC-5):** on `booking_completed` for an
existing user the accumulated score is reset to `0` (tier → low) and a
`bookingCooldowns: [{ destination, bookedAt }]` entry is written on
`UserIntentScore`. While a destination is in cool-down (7 days) the notification
engine suppresses all nudges for it. A brand-new user whose first-ever event is a
completed booking has no accumulated score to reset, so the 50-pt weight applies.

**Cabin default (US-0103, RC-8):** `flight_view` always carries a `cabin`
(defaults to `economy`) so the cabin-preference profile stays reliable.

---

## Engagement axis & scenario matrix (EP-09 — see ADR-0008)

Intent (purchase readiness) and **engagement** (involvement) are tracked as two
axes on `UserIntentScore`. Engagement (`engagementScore`/`engagementTier`,
`sessionStats`, `trajectory`) is computed by `services/engagementEngine.js` from
sessions, dwell, breadth, return cadence and wishlist activity over 30 days, and
recomputed in the aggregation job. Intent is **time-decayed** there too
(7-day half-life) and labelled with a cross-session `trajectory`
(`rising`/`stalled`/`falling`/`post-booking`/`new`).

Notifications are chosen by `services/notificationEngine.js` from the
Intent × Engagement matrix + trajectory overrides:

```
                engagement low   engagement medium   engagement high
intent high     decisive_nudge   closing             closing
intent medium   reengage         standard_recs       guided
intent low      dormant(silent)  inspire             inspire
overrides: post-booking → suppressed; falling (non-high) → reengage
```

Copy comes from Claude when `ENABLE_LLM_COPY=true` + `ANTHROPIC_API_KEY` set
(`services/claudeClient.js`, prompt-cached), else deterministic templates.

**New preference signals (EP-09):** `departureTimePreference`,
`arrivalTimePreference`, `baggagePreference`, `prefersRefundable`,
`priceSensitivity` on `UserPreference`, derived in `preferenceEngine` from new
`UserActivity.metadata` fields (`departureHour`/`arrivalHour`/`*Bucket`,
`baggage`, `refundable`) populated by the flight-view route.

**Validate:** `npm run simulate:personalization` (no DB) and
`npm run seed:personalization` (writes demo users). Endpoint:
`GET /api/personalization/scenario`.

---

## A/B test (EP-07)

- `User.abGroup`: `'personalised'` (80%) or `'control'` (20%)
- Gated behind `ENABLE_AB_TEST=false`
- Control group: no personalisation, no notifications, activity still tracked
- Must run 30+ days before drawing conversion conclusions

---

## Security requirements (enforce in every PR)

1. All personalization DB queries include `{ user: req.user.id }` — never from request body
2. `eventType` on POST /track is whitelisted to client-reportable events only — `booking_started`, `booking_completed` and `return_visit` are server-derived and rejected (US-0301/US-0104, RC-4)
3. Admin routes enforce `role === 'admin'` check in middleware
4. `ENABLE_PRICE_DROP_NOTIFICATIONS` must be `false` in production until Amadeus live feed
5. `ENABLE_REENGAGEMENT_EMAILS` must be `false` until EP-08 US-0803 validates tier accuracy
6. `JWT_SECRET` must be a 256-bit+ random string in production

---

## Observability conventions

```js
// Structured log prefix: [ServiceName] event.name { ...payload }
console.info('[AggregationJob] cycle.complete', { durationMs, usersProcessed, failed: 0 });
console.warn('[AggregationJob] cycle.slow', { durationMs });  // > 90 * 60 * 1000
console.error('[ActivityTracker] score.update.failed', { userId, error: err.message });
console.info('[IntentEngine] tier.transition', { userId, prevTier, newTier, score });
```

---

## Development

```bash
# Backend
cd backend && npm install && npm run dev     # nodemon on port 5000

# Frontend
cd frontend && npm install && npm start      # CRA on port 3000

# Seed database
cd backend && npm run seed
```

---

## Further reading

- [system-context.md](system-context.md) — C4 diagrams, event pipeline flows, external system contracts
- [data-model.md](data-model.md) — entity relationships, field definitions, required indexes
- [constraints.md](constraints.md) — NFRs mapped to concrete architectural constraints
- [threat-model.md](threat-model.md) — STRIDE analysis + security controls checklist
- [decisions/](decisions/) — ADRs for all major architectural choices
- [../requirements/README.md](../requirements/README.md) — full epic/story backlog + delivery sequence
