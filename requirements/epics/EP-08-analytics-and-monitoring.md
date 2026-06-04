---
id: EP-08
title: Analytics and Monitoring
parent_objective: Establish a measurement baseline and operational observability so that personalization lift can be quantified and the system can be operated reliably at scale
owner: TBD
reviewer: TBD
status: Draft
---

# EP-08 — Analytics and Monitoring

## Capability
The platform tracks notification click-through rate, recommendation click-through rate, and intent tier accuracy; monitors aggregation job health (completion time, failed users); and provides an internal admin view for support to inspect and reset user intent state without direct database access.

## Why (links up)
- Objective: Without measurement infrastructure, no personalization investment can be justified beyond bug fixes (business-case.md §4: "investment without measurement is not justifiable beyond Phase 1").
- Root causes addressed: RC-11 feedback loop missing (no signal from notification → booking), A-2 (tier thresholds unvalidated), A-5 (cache TTL unvalidated), S2/S3 operational needs.
- Business case Phase 2 prerequisite: A/B baseline + CTR tracking are go/no-go gates before Phase 3 investment.

## Stories in this epic
- US-0801 — Track notification click-through rate — Draft
- US-0802 — Track recommendation card click-through rate — Draft
- US-0803 — Log intent tier accuracy (high-tier user → booked within 7 days) — Draft
- US-0804 — Monitor aggregation job performance and alert on failure — Draft
- US-0805 — Admin tooling: intent score, tier, notifications, and reset for support — Draft

## Scope
**In:** notification CTA click events (navigate vs. dismiss); recommendation card click events (`data-testid` + analytics event); intent tier accuracy logging; aggregation job completion time + failed-user alerting; internal admin view (intent score, tier, `primaryPlanningDestination`, `sentNotifications[]`, reset action)
**Out:** full customer analytics platform (Mixpanel, Amplitude); real-time dashboard (Grafana); anonymous-to-authenticated funnel tracking (RC-1, deferred); public-facing metrics

## Open questions / dependencies
- US-0801 and US-0802 are prerequisites for EP-07 A/B test framework to produce meaningful results.
- US-0803 (tier accuracy logging) is the go/no-go gate before EP-06 SendGrid email trigger is enabled in production.
- US-0804 aggregation monitoring should alert if a cycle exceeds 90 minutes (ops requirement from stakeholder S2).
- US-0805 admin tooling should be scoped to support needs (S3) — read-only intent view + score reset + notification suppression — not a full analytics platform.
