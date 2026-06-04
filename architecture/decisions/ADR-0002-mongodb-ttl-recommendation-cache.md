# ADR-0002 — MongoDB document-based recommendation cache (no Redis)

**Date:** 2026-06-04
**Status:** Accepted
**Deciders:** Architecture team
**Stories:** EP-04 US-0401, US-0402; EP-08 A-5

---

## Context

Recommendations are expensive to build (multiple DB queries, ranking computation, popularity aggregation). They must be served quickly on the homepage. A caching layer is required. The TTL is currently 6 hours but should be empirically validated via EP-08 data.

**Options considered:**

| Option | Description |
|--------|-------------|
| A | MongoDB `RecommendationCache` collection with `validUntil` field checked in-app |
| B | Redis `SETEX` with 6-hour TTL; serialised JSON payload |
| C | In-memory LRU cache inside the Node process (per-instance) |

---

## Decision

**Option A — MongoDB `RecommendationCache` collection.**

`getRecommendations(userId)` performs a `findOne({ user: uid })` and checks `validUntil > now`. Cache miss triggers `buildRecommendations()` which ends with `RecommendationCache.create()`. `invalidateCache()` calls `deleteOne()`.

A ±10-minute random jitter is added to `validUntil` to prevent synchronized expiry (thundering herd on batch-job cadence).

---

## Rationale

- **No new infrastructure.** The project already connects to MongoDB Atlas. Adding Redis requires a new managed instance (Upstash or Atlas Redis), new environment variables, a new npm dependency, and new operational runbooks.
- **Consistency with the rest of the data model.** UserActivity, UserIntentScore, and UserPreference all live in MongoDB. Keeping the cache here means a single connection pool and no cache-DB consistency split-brain.
- **Admin visibility.** Support teams can inspect the cache via the admin panel without Redis CLI access.
- **Good enough for POC scale.** At ~1,000 active users, a 6-hour MongoDB document cache delivers sub-10ms reads (indexed `{ user: 1 }` lookup). MongoDB TTL index can auto-expire stale documents.

---

## Consequences

**Positive:**
- Zero new infrastructure; runs on the existing MongoDB Atlas connection.
- Cache documents are inspectable with standard MongoDB tooling.
- Cache miss and hit logging is straightforward.

**Negative / Trade-offs:**
- MongoDB is not optimised for high-throughput cache reads. At 10,000+ concurrent users, Redis would deliver significantly lower latency and reduce MongoDB read pressure.
- No built-in eviction policies (LRU, LFU). The `validUntil` TTL is the only expiry mechanism.
- Cache documents can grow large (8 flights + 8 hotels + notifications). Monitor document size; if it exceeds 16 MB (unlikely but possible with many recommendations), split into sub-documents.

**Migration path:** Replace `RecommendationCache.findOne / create / deleteOne` with `redis.get / setex / del` calls behind a `cacheAdapter.js` interface. No caller changes required if the interface is abstracted.

**Review trigger:** If EP-08 cache hit/miss analytics (A-5) show > 50% miss rate, reduce TTL. If MongoDB read IOPS exceed Atlas M10 capacity, migrate to Redis.
