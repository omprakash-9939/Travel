# ADR-0005 — Deterministic A/B group assignment via hashed userId

**Date:** 2026-06-04
**Status:** Accepted
**Deciders:** Architecture team
**Stories:** EP-07 US-0703

---

## Context

An A/B test framework is required to measure the true lift of personalization. 20% of users should receive no personalization (control group); 80% should receive the full personalization pipeline. The assignment must be stable — the same user must always land in the same group across sessions and devices.

**Options considered:**

| Option | Description |
|--------|-------------|
| A | Persisted `abGroup` field on the `User` model — set once at registration, never changed |
| B | Deterministic hash: `parseInt(userId.slice(-6), 16) % 100 < 20` — computed on-the-fly, no DB field needed |
| C | Server-side feature flag service (e.g. LaunchDarkly) — managed external assignment |
| D | Random assignment per session — re-randomise on each login |

---

## Decision

**Option A — persisted `abGroup` field on `User`, assigned at registration using a deterministic random hash.**

On `POST /api/auth/register`:
```js
user.abGroup = Math.random() < 0.2 ? 'control' : 'personalised';
user.abGroupAssignedAt = new Date();
```

The `abGroup` field is immutable after registration. It is included in the JWT payload so middleware can read it without a DB lookup on every request.

The A/B framework is gated behind `ENABLE_AB_TEST=false` feature flag. When the flag is off, all users receive personalised results (safe default).

---

## Rationale

- **Option D (per-session random)** violates US-0703 AC-5 — the group must be stable across sessions.
- **Option B (hash)** avoids a DB field but produces deterministic results based on ObjectId patterns, which may not be uniformly distributed across the population. It also cannot be overridden for testing.
- **Option C (LaunchDarkly)** adds an external SaaS dependency and cost. Unjustified for a POC.
- **Option A** is simple, persistent, inspectable, and supports the admin override needed for QA testing.

The `abGroupAssignedAt` timestamp is critical: conversion reporting endpoints must refuse to draw conclusions before 30 days have elapsed from the assignment date (US-0703 requirement).

---

## Control Group Behaviour

When `user.abGroup === 'control'` AND `ENABLE_AB_TEST === 'true'`:

| Surface | Control group receives |
|---------|----------------------|
| Homepage recommendations | Cold-start fallback (no personalisation) |
| "Continue Planning" card | Not shown |
| Recommendation carousel | Default popular destinations |
| Intent-triggered notifications | None |
| SearchGrid ranking | Default sort (price, rating) |
| Activity tracking | Continues as normal (for measurement) |
| SendGrid email | Not triggered |

---

## Consequences

**Positive:**
- Stable assignment enables 30-day longitudinal comparison.
- JWT inclusion avoids a DB lookup on every personalisation request.
- Admin can forcibly assign a user to a group for QA (update `User.abGroup` directly).

**Negative / Trade-offs:**
- Registration-time assignment means a user who registers after the A/B test starts is assigned correctly, but pre-existing users need a migration (one-time backfill of `abGroup` on existing User documents).
- A 20% split is fixed in code. To change the split ratio, a code change + migration is required. A feature flag service (Option C) would allow dynamic adjustment.
- `abGroupAssignedAt` must be backfilled for existing users to `createdAt` for the 30-day gate to work correctly.

**Migration required:**
```js
// One-time migration: assign abGroup to existing users
db.users.updateMany(
  { abGroup: { $exists: false } },
  [{ $set: {
    abGroup: { $cond: [{ $lt: [{ $rand: {} }, 0.2] }, 'control', 'personalised'] },
    abGroupAssignedAt: '$createdAt'
  }}]
)
```
