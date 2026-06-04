# ADR-0007 — Structured console logging as the observability baseline

**Date:** 2026-06-04
**Status:** Accepted
**Deciders:** Architecture team
**Stories:** EP-08 US-0801, US-0803, US-0804, US-0805

---

## Context

The personalization engine needs operational visibility:
- Is the aggregation batch completing within 90 minutes?
- Which users are failing aggregation and why?
- What is the current distribution of intent tiers?
- Are notifications being sent and clicked?

The question is: what logging/monitoring infrastructure do we use for Phase 1–3?

**Options considered:**

| Option | Description |
|--------|-------------|
| A | Structured `console.log` / `console.error` with consistent JSON-serialisable payloads; collected by the host platform (Render, Railway, etc.) |
| B | Winston or Pino structured logger with log levels + transports (file, stdout, third-party) |
| C | Full APM stack (Datadog, New Relic, Sentry) — agent-based instrumentation |
| D | Custom `UserActivity` analytics events for all business metrics; no additional logging infrastructure |

---

## Decision

**Option A for infrastructure/ops logs + Option D for business analytics events.**

**Infrastructure / ops (Option A):**

All personalization services emit structured console logs with a consistent prefix and key fields:

```js
// Pattern — service tag + event + payload
console.info('[AggregationJob] cycle.start', { userCount: 42, startedAt: new Date() });
console.info('[AggregationJob] cycle.complete', { durationMs: 4200, failed: 0 });
console.warn('[AggregationJob] cycle.slow', { durationMs: 95000 });  // > 90min
console.error('[ActivityTracker] score.update.failed', { userId, error: err.message });
console.info('[IntentEngine] tier.transition', { userId, prevTier, newTier, score });
console.info('[NotificationHelper] return_reminder.sent', { userId, destination });
console.warn('[SendGrid] email.skipped', { reason: 'API key absent' });
console.error('[SendGrid] email.failed', { userId, error: err.message });
```

**Business analytics (Option D):**

EP-08 metrics (CTR, tier accuracy, job health) are tracked as `UserActivity` events:
- `POST /api/personalization/notification-click` → `UserActivity { eventType: 'notification_click', metadata: { notificationId, type, action } }`
- `POST /api/personalization/recommendation-click` → `UserActivity { eventType: 'recommendation_click', metadata: { itemId, itemType, destination } }`
- Aggregation job writes a summary `JobLog` document (new model, EP-08 US-0804):
  ```js
  { jobType: 'aggregation', startedAt, completedAt, durationMs, usersProcessed, failedUsers[] }
  ```

**Admin tooling (US-0805):** A `GET /api/admin/personalization/:userId` endpoint returns:
```json
{
  "intent": { "score": 45, "tier": "medium", "primaryPlanningDestination": "Barcelona" },
  "sentNotifications": [...],
  "bookingCooldowns": [...],
  "lastAggregatedAt": "2026-06-04T10:30:00Z"
}
```

---

## Rationale

- **Option B (Winston/Pino)** adds a dependency and configuration overhead with marginal benefit at POC scale. The format can be changed to match a transport later.
- **Option C (APM)** is appropriate at production scale but unjustified for a POC. Cost and setup time are not proportionate.
- **Option D alone** cannot capture infrastructure errors (crash loops, DB timeouts). A combination is needed.
- **Structured console output** is captured automatically by Render, Railway, Heroku, and other PaaS platforms. It can be piped to Papertrail or Datadog without changing the code — just adding a log drain.

---

## Log Level Conventions

| Level | Usage |
|-------|-------|
| `console.info` | Normal operational events: cycle start/complete, tier transitions, notifications sent |
| `console.warn` | Degraded-but-recoverable: slow cycle (>90min), API key absent, dedup window hit |
| `console.error` | Failures that need investigation: DB write failed, SendGrid call errored, user aggregation threw |

---

## Consequences

**Positive:**
- Zero new dependencies.
- Logs are visible immediately in any Node.js hosting platform's log viewer.
- Consistent prefix tags (`[AggregationJob]`, `[IntentEngine]`) make log filtering easy.
- Business analytics are stored in MongoDB where the admin panel and EP-08 reporting queries can access them.

**Negative / Trade-offs:**
- `console.log` is synchronous in Node.js and can block the event loop under very high log volume. At scale, replace with Pino (async, low overhead).
- No automatic alerting. Ops must manually watch for `cycle.slow` WARN logs. Phase 3: pipe to PagerDuty / OpsGenie via a log drain.
- No distributed trace IDs. If the system grows into multiple services, correlating logs across services requires request IDs (add `X-Request-Id` header propagation at that point).

**Migration path:** Wrap `console.info/warn/error` in a `logger.js` module from day one:
```js
// logger.js
const logger = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
};
module.exports = logger;
```
When Pino is needed, replace the implementation in one file.
