---
id: EP-06
title: Personalized Notifications
parent_objective: Re-engage high-intent users at the right moment through timely, accurate, and trustworthy notifications
owner: TBD
reviewer: TBD
status: Draft
---

# EP-06 — Personalized Notifications

## Capability
The platform delivers timely and accurate notifications that match the user's real intent: an in-app `return_reminder` fires within the same session as the second search (not up to 2 hours later), fabricated `price_drop` urgency is removed, converted users stop receiving nudge notifications, and users who leave the platform can be re-engaged via SendGrid email when their intent crosses the medium threshold.

## Why (links up)
- Objective: Recover high-intent users who have not yet booked by delivering relevant, honest nudges at peak-intent moments.
- Legal / trust: Fabricated `price_drop` data (RC-6) is an active legal and trust risk — it must be disabled before any production rollout.
- Root causes addressed: RC-2 (2-hour notification lag), RC-5 (no cool-down after booking), RC-6 (fake price_drop data), RC-11 (SendGrid not connected to intent scoring).

## Stories in this epic
- US-0601 — Disable fabricated price-drop notification (RC-6) — Draft
- US-0602 — Deliver return_reminder notification in near-real-time — Draft
- US-0603 — Suppress notifications after booking completion — Draft
- US-0604 — Send out-of-app email re-engagement via SendGrid on intent threshold — Draft

## Scope
**In:** `return_reminder` in-app notification (near-real-time trigger); post-booking notification suppression; SendGrid email on `medium` intent threshold crossing; feature-flag gate for `price_drop`
**Out:** `price_drop` with real Amadeus price feed (deferred — requires live price monitoring infrastructure); Twilio SMS channel (lower priority); push notifications (PWA, deferred); `selling_fast` / `new_deal` notifications until real inventory data is confirmed

## Open questions / dependencies
- US-0601 (disable price_drop) has zero prerequisites and must ship first — it removes legal exposure immediately.
- US-0602 depends on EP-03 (intent score correct) and EP-01 RC-3/RC-4 fixes being live.
- US-0603 depends on EP-03 US-0303 (score reset logic).
- US-0604 depends on EP-03 (valid intent scores) and EP-08 Phase 2 measurement baseline — only trigger email once intent tier accuracy is validated.
