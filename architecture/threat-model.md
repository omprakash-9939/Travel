# Threat Model — DataArt Travel Personalization Engine

**Method:** Lightweight STRIDE pass over the personalization data flows.
**Scope:** Personalization pipeline (event tracking, intent scoring, recommendations, notifications, email).
**Out of scope:** Payment processing (Stripe/Razorpay), third-party OAuth, Amadeus API internals.

---

## Trust Boundaries

```
[Browser]
    │
    │  HTTPS (TLS 1.2+) — JWT in Authorization header
    ▼
[Express API — backend/]             ← Trust boundary 1: authenticated API surface
    │
    ├─ activityTracker.js            ← processes user-supplied eventType + metadata
    ├─ recommendationEngine.js       ← reads MongoDB, calls Amadeus, calls SendGrid
    │
    │  TCP/TLS — Mongoose connection string
    ▼
[MongoDB Atlas]                       ← Trust boundary 2: database
    │
    └─ UserActivity, UserIntentScore, UserPreference, RecommendationCache, User

[SendGrid API]                        ← Trust boundary 3: external email service
[Amadeus API]                         ← Trust boundary 3: external flight/hotel data
```

---

## STRIDE Analysis

### S — Spoofing

| Threat | Data Flow | Impact | Mitigation | Status |
|--------|-----------|--------|------------|--------|
| **Attacker forges another user's JWT** | Browser → `/api/personalization/track` | Track events under victim's identity; inflate/deflate intent scores | `middleware/auth.js` verifies JWT signature with `JWT_SECRET`. Tokens are user-scoped (`userId` in payload). | Mitigated |
| **JWT_SECRET is weak or hardcoded** | Server config | All JWTs can be forged if secret is brute-forced | `.env.example` marks `JWT_SECRET=change_me_to_a_long_random_secret`. Ops must set a 256-bit random secret in production. | **Action required: enforce strong secret in deployment** |
| **Replayed JWT after logout** | Browser → API | Stale tokens reused | No server-side token revocation in current design. Short expiry (24h) limits window. Phase 3: add token blocklist (Redis) or reduce expiry to 1h + refresh tokens. | Partially mitigated (expiry) |

### T — Tampering

| Threat | Data Flow | Impact | Mitigation | Status |
|--------|-----------|--------|------------|--------|
| **Malicious eventType in `/api/personalization/track`** | Browser → activityTracker | Unknown event type silently scores 0 pts (no harm) OR attacker crafts `booking_completed` to trigger cool-down for victim | `POST /track` whitelists client-reportable events (`CLIENT_TRACKABLE_EVENTS`); `booking_started`, `booking_completed` and `return_visit` are server-derived and rejected with 400. Additionally `activityTracker.track()` enforces DB-backed booking idempotency per `bookingId`. | **Mitigated** (routes/personalization.js) |
| **Inflated metadata values** | Browser → track | Large `metadata` objects could bloat `UserActivity` | Apply max-size validation: `metadata` object ≤ 2 KB. Express body-parser `limit: '10kb'` applied globally. | **Action required: document and test body-parser limit** |
| **MongoDB injection via metadata fields** | Browser → DB | NOSQL injection via `$where` / operator keys | Mongoose schema types reject operator-keyed objects. Do not use `req.body` directly in `find()`/`findOne()` without going through the schema. Validated in `express-validator` middleware. | Mitigated by Mongoose ODM |
| **Direct manipulation of RecommendationCache** | — | Not a client-reachable endpoint. `RecommendationCache` is written only by `buildRecommendations()`. | No public write endpoint for the cache. | Mitigated |

### R — Repudiation

| Threat | Data Flow | Impact | Mitigation | Status |
|--------|-----------|--------|------------|--------|
| **No audit trail for admin intent reset** | Admin → `POST /api/admin/personalization/:userId/reset` | Support disputes about who reset a user's intent | Admin actions must log `{ adminUserId, targetUserId, action, timestamp }` at INFO level. Phase 3: persist to an `AuditLog` collection. | **Action required: add admin action logging** |
| **Notification send not logged** | recommendationEngine → User.notifications | Disputes about which notifications were sent | `sentNotifications[]` array on `UserIntentScore` records type + sentAt. This is the authoritative log. | Mitigated |

### I — Information Disclosure

| Threat | Data Flow | Impact | Mitigation | Status |
|--------|-----------|--------|------------|--------|
| **Cross-user data leak** | `/api/personalization/recommendations` | User A sees User B's recommendations or intent | Every MongoDB query in personalization services includes `{ user: userId }` extracted from verified JWT. Never use a userId from the request body. | Mitigated by design |
| **Preference data leaked in API response** | GET `/api/personalization/recommendations` | Full preference profile exposed to client | API returns only the recommendation payload (flights, hotels, notifications, continuePlanning). Raw `UserPreference` and `UserIntentScore` documents are not returned. Admin endpoint is role-gated. | Mitigated |
| **Intent score/tier exposed to unauthorized client** | GET `/api/personalization/intent` | Tier value is not sensitive but leaks scoring model | Endpoint is auth-gated. Tier + score are returned only to the authenticated user; no cross-user read. | Mitigated |
| **Email address in event logs** | activityTracker → UserActivity | PII in event records | `UserActivity.metadata` must not include `email`. SendGrid calls use `user.email` fetched directly from `User` model at send time. | **Action required: audit metadata shapes for PII** |
| **MongoDB connection string in logs** | Server startup | Credentials leaked to log aggregators | `MONGODB_URI` must not be logged. Use `mongoose.connection.host` for health-check logs. | Mitigated (convention) |

### D — Denial of Service

| Threat | Data Flow | Impact | Mitigation | Status |
|--------|-----------|--------|------------|--------|
| **Event flood from a single user** | POST `/api/personalization/track` | Fills `UserActivity` collection, slows 90-day queries | Rate-limit `/api/personalization/track`: max 60 calls/min per `userId` (express-rate-limit). `score` is already capped at 100. | **Action required: add rate limiting** |
| **Aggregation job overload** | aggregationJob → MongoDB | Too many active users exhaust MongoDB connections | `BATCH_SIZE = 50` cap. Mongoose connection pool defaults to 5 (increase to 20 in production). Job has 30s startup delay. | Partially mitigated |
| **RecommendationCache cold-start for all users simultaneously** | Server restart → getRecommendations | All caches expire simultaneously → N parallel builds | Stagger cache TTL by adding `Math.random() * 10min` jitter to `validUntil`. | **Action required: add TTL jitter** |

### E — Elevation of Privilege

| Threat | Data Flow | Impact | Mitigation | Status |
|--------|-----------|--------|------------|--------|
| **Regular user accesses admin intent reset endpoint** | POST `/api/admin/personalization/:userId/reset` | Resets another user's intent state | `middleware/auth.js` must check `req.user.role === 'admin'`. Role is stored in JWT payload and validated on the server. | **Action required: implement role check middleware** |
| **A/B group manipulation via client** | User modifies abGroup in request | Forces self into personalised group or control group | `abGroup` is set server-side on registration and never accepted from client request body. | Mitigated by design |

---

## Top 3 Risks (Phase 1 Priority)

| # | Risk | Likelihood | Impact | Priority |
|---|------|-----------|--------|---------|
| 1 | `booking_completed` accepted from client body → fabricated intent reset or cooldown injection | Medium | High | **Done (Phase 1)** — `booking_completed`/`booking_started`/`return_visit` rejected by the `/track` whitelist; booking events emitted only by the server booking service |
| 2 | Missing eventType whitelist on track endpoint → unknown event types or attempted DoS | Medium | Medium | **Done (Phase 1)** — `CLIENT_TRACKABLE_EVENTS` whitelist on `POST /track` |
| 3 | Weak/default JWT_SECRET in production deployment | Low (deployment error) | Critical (total auth bypass) | **Pre-production gate** — enforce entropy check in deployment checklist |

---

## Security Controls Checklist

- [ ] `JWT_SECRET` is a minimum 256-bit random string (not the default placeholder)
- [x] `eventType` is whitelisted on `POST /api/personalization/track` (client-reportable events only)
- [ ] `metadata` body size is bounded (≤ 2 KB)
- [x] `booking_completed` event can only be emitted by server-side booking service (client `/track` rejects it)
- [ ] Rate limiting on `/api/personalization/track` (60 req/min per user)
- [ ] All personalization DB queries include `{ user: userId }` from JWT, never from request body
- [ ] Admin endpoints enforce `role === 'admin'` check
- [ ] Admin actions are logged with adminUserId + timestamp
- [ ] `UserActivity.metadata` fields audited for PII (email must not appear)
- [ ] `MONGODB_URI` not logged at startup
- [ ] `ENABLE_PRICE_DROP_NOTIFICATIONS=false` in production `.env` until Amadeus live feed
- [ ] `ENABLE_REENGAGEMENT_EMAILS=false` in production `.env` until EP-08 tier accuracy validated
- [ ] RecommendationCache TTL includes jitter to prevent thundering-herd rebuild
