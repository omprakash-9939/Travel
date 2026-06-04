# ADR-0001 — In-process synchronous event pipeline

**Date:** 2026-06-04
**Status:** Accepted
**Deciders:** Architecture team
**Stories:** EP-01 (all), EP-03 US-0302, EP-06 US-0602

---

## Context

Every user action (flight search, hotel view, booking, return visit) must update the intent score and, in some cases, trigger a notification within the same HTTP request cycle (US-0602 AC-1). The question is: how do we process these events?

**Options considered:**

| Option | Description |
|--------|-------------|
| A | In-process synchronous call: `track()` → `updateIntentScore()` → optional notification, all in one `async` function chain within the request handler |
| B | In-process event emitter: `EventEmitter`-based pub/sub; handlers fire asynchronously in the same Node process |
| C | External message queue: Redis + BullMQ; `track()` enqueues a job; a separate worker processes it |

---

## Decision

**Option A — in-process synchronous chain.**

`activityTracker.track()` executes the full event pipeline synchronously:
1. Check for repeat search
2. Check for cross-session return visit
3. Persist `UserActivity`
4. Upsert `UserIntentScore`
5. (EP-06 target) Check tier transition → optional SendGrid email
6. (EP-06 target) Check return-reminder conditions → optional in-app notification

All steps complete before the HTTP response is returned.

---

## Rationale

- **US-0602 requires the notification within the same request cycle.** Option B (EventEmitter) fires handlers asynchronously — they may not complete before the response is sent. Option A guarantees completion before response.
- **POC scale does not justify a queue.** Option C (BullMQ) adds Redis as a new infrastructure dependency, increases operational complexity, and introduces eventual-consistency semantics where the product requires synchronous confirmation.
- **Failure isolation is simple.** Each step is wrapped in a try/catch. SendGrid failures log at ERROR and do not abort the pipeline. A failed DB write for the notification does not fail the intent score update.
- **Linear debugging.** A synchronous call stack is easy to trace in logs and debuggers without queue-inspection tooling.

---

## Consequences

**Positive:**
- Notifications are guaranteed to be visible before the next page render.
- No Redis / queue infrastructure needed for Phase 1–3.
- Straightforward unit and integration testing.

**Negative / Trade-offs:**
- Each `track()` call adds MongoDB round-trips (repeat-search check, return-visit check, intent upsert). Under high traffic, this increases response latency for the tracking endpoint.
- A slow MongoDB query blocks the request. Timeout guards must be added to `isRepeatSearch()` and `maybeReturnVisit()`.
- If the service needs to scale beyond ~500 concurrent users per instance, the blocking DB calls may become a bottleneck. At that point, migrate to Option B (EventEmitter with a short async window) or Option C.

**Migration path:** Replace `track()` internals with an `EventEmitter.emit('activity', ...)` + async listener, keeping the same public API. The caller does not need to change.
