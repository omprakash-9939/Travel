# ADR-0008 — Separate Engagement from Intent (two-axis model)

**Date:** 2026-06-04
**Status:** Accepted
**Deciders:** Architecture team
**Stories:** EP-09 (US-0901–US-0905), EP-06 notification scenarios, EP-03 US-0302/US-0303

---

## Context

The original engine had a single, monotonically increasing `UserIntentScore.score`.
That number conflates two different things:

- **Intent** — how *ready to book* a user is (search → view → booking_started → completed).
- **Engagement** — how *involved* a user is right now (sessions, dwell time, breadth, return cadence), independent of purchase readiness.

A high-engagement / low-intent browser (tyre-kicker) and a low-engagement /
high-intent buyer (one decisive session) are very different users, but a single
score cannot tell them apart. Notifications keyed off one number therefore
either over-nudge browsers or under-serve buyers. The product also needs
session-based notification scenarios ("high/low engagement × intent across
sessions"), which are undefined without a second axis.

A single score also never cools off: one burst of activity keeps a user "high"
forever (RC-7 direction).

**Options considered:**

| Option | Description |
|--------|-------------|
| A | Keep one score; derive everything from it (status quo) |
| B | Two scores in **one** document: add `engagementScore`/`engagementTier`/`trajectory` to `UserIntentScore` |
| C | A separate `UserEngagementScore` collection + model |

---

## Decision

**Option B — two axes, one document.** `UserIntentScore` gains
`engagementScore` (0–100), `engagementTier`, `sessionStats`, and a cross-session
`trajectory` (`rising` | `stalled` | `falling` | `post-booking` | `new`).
Engagement is computed by a dedicated **`engagementEngine.js`** (the conceptual
separation lives in the service layer), but persisted alongside intent to avoid a
second collection, a second write, and a join on every notification build.

Intent additionally gains **time-decay** (half-life 7 days) applied during
aggregation, and a **post-booking reset + cool-down** (ADR companion to US-0303).

Notifications are then selected from an **Intent × Engagement matrix** plus
trajectory overrides (see `notificationEngine.js` / ADR-0009 if split later).

---

## Rationale

- **Option A** cannot express the scenario matrix the product requires and keeps over/under-nudging users.
- **Option C** is the "purest" separation but doubles the personalization write path and adds a join to the hot notification-build path for no behavioural gain in a POC. Engagement and intent are always read together.
- **Option B** preserves the two-axis *model* (engagement is computed independently in `engagementEngine`) while keeping the storage and read path simple. If engagement ever needs its own lifecycle/TTL, it can be extracted to its own collection without changing the engine API.

---

## Consequences

**Positive:**
- The notification engine can address nine distinct (intent × engagement) cells plus trajectory, instead of three intent tiers.
- Intent decay stops stale single-burst users from staying "high" indefinitely.
- One document, one write, one read — no new collection or join.

**Negative / Trade-offs:**
- `UserIntentScore` now carries two concerns; the name is slightly misleading (kept for backward compatibility with existing routes/tests).
- Engagement weights and the decay half-life are engineering estimates — calibrate via EP-08 once real data exists.

**Validation:** `npm run simulate:personalization` replays six scripted journeys
and prints the resulting intent tier, engagement tier, trajectory, scenario, and
notification; `backend/__tests__/integration/scenarioSimulation.integration.test.js`
asserts the full 3×3 matrix, trajectory overrides, and the six journeys.
