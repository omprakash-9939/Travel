# ADR-0006 — Feature flags via environment variables

**Date:** 2026-06-04
**Status:** Accepted
**Deciders:** Architecture team
**Stories:** EP-06 US-0601 (RC-6), US-0604, EP-07 US-0703

---

## Context

Several features carry legal risk or depend on unvalidated assumptions and must be deployable but disabled in production until a go/no-go gate is passed:

- `price_drop` notification: currently generates fabricated percentage drops (RC-6) — active legal and trust risk.
- `selling_fast` / `new_deal` notifications: based on fabricated inventory signals.
- SendGrid re-engagement email: must not fire until EP-08 US-0803 validates tier accuracy.
- A/B test group routing: must not affect users until measurement infrastructure is ready.

The question is: how do we ship these features in a disabled-by-default state?

**Options considered:**

| Option | Description |
|--------|-------------|
| A | Environment variable flags (`ENABLE_PRICE_DROP_NOTIFICATIONS=false` etc.) checked at runtime |
| B | Database-stored feature flags (collection `FeatureFlag { name, enabled }`) — togglable without restart |
| C | Remove the code entirely until it's ready |

---

## Decision

**Option A — environment variable feature flags, checked at runtime inside the relevant service functions.**

Each flag defaults to `false` in `.env.example`. Enabling requires an explicit environment variable change and a server restart.

**Flag inventory:**

```
ENABLE_PRICE_DROP_NOTIFICATIONS=false    # disable fabricated price_drop (RC-6)
ENABLE_INVENTORY_NOTIFICATIONS=false     # disable selling_fast / new_deal
ENABLE_REENGAGEMENT_EMAILS=false         # disable SendGrid medium-intent email
ENABLE_AB_TEST=false                     # disable A/B group routing
```

**Check pattern in service code:**
```js
if (process.env.ENABLE_PRICE_DROP_NOTIFICATIONS !== 'true') {
  // skip price_drop generation
  return;
}
```

---

## Rationale

- **Option C (remove code)** is not viable for features we intend to enable in future phases. Removing and re-adding creates churn and loses the implementation history.
- **Option B (database flags)** is operationally superior (no restart required) but adds a DB collection, a lookup on every notification-build call, and a management UI. Over-engineered for a POC.
- **Option A** is the simplest approach that ships the code safely. Server restarts are acceptable for flag changes in a POC. The `.env.example` documents the flags clearly.
- The `ENABLE_PRICE_DROP_NOTIFICATIONS` flag specifically addresses a legal risk item (RC-6). It must default to `false` and be explicitly reviewed before any production enablement. Environment variable gating makes this review visible in deployment configuration.

---

## Consequences

**Positive:**
- Legal risk from RC-6 is eliminated in production without removing the code.
- Each flag has a clear documented purpose and go/no-go gate in the requirements.
- No new dependencies or infrastructure.

**Negative / Trade-offs:**
- Flag changes require a server restart (env var reload). For flags that need to be toggled mid-traffic (e.g. during a staged A/B rollout), a DB-based flag service (Option B) or a feature flag SaaS (LaunchDarkly) would be needed.
- `process.env` is a global — care must be taken in tests to reset flag state between test suites.
- No audit trail of flag changes. Log flag state on server startup to compensate.

**Startup logging:**
```js
// server.js — log feature flag state on startup
console.info('[FeatureFlags]', {
  priceDrop: process.env.ENABLE_PRICE_DROP_NOTIFICATIONS,
  inventoryNotifs: process.env.ENABLE_INVENTORY_NOTIFICATIONS,
  reengagementEmails: process.env.ENABLE_REENGAGEMENT_EMAILS,
  abTest: process.env.ENABLE_AB_TEST
});
```

**Migration path:** If operational needs require runtime toggling without restart, extract flag reads behind a `featureFlags.js` module and swap the backing store from `process.env` to a `FeatureFlag` MongoDB collection — callers do not change.
