# Requirements Index — DataArt Travel Personalization

**Project:** DataArt Travel — AI Personalization Engine  
**Status:** Discovery → Breakdown complete → **Phase 1 implementation underway**  
**Last updated:** 2026-06-04

---

## Tree

```
requirements/
├── README.md                              ← this file (index + traceability)
├── epics/
│   ├── EP-01-activity-tracking.md
│   ├── EP-02-preference-engine.md
│   ├── EP-03-intent-engine.md
│   ├── EP-04-recommendation-engine.md
│   ├── EP-05-dynamic-homepage.md
│   ├── EP-06-personalized-notifications.md
│   ├── EP-07-ranking-system.md
│   └── EP-08-analytics-and-monitoring.md
├── stories/
│   ├── EP-01/
│   │   ├── US-0101-track-flight-search.md
│   │   ├── US-0102-track-hotel-search.md
│   │   ├── US-0103-track-flight-view-with-cabin.md
│   │   ├── US-0104-fix-booking-event-double-tracking.md
│   │   ├── US-0105-cross-session-return-visit-detection.md
│   │   └── US-0106-track-wishlist-events.md
│   ├── EP-02/
│   │   ├── US-0201-aggregate-destination-preferences.md
│   │   ├── US-0202-cabin-preference-profile.md
│   │   └── US-0203-cold-start-configurable-fallback.md
│   ├── EP-03/
│   │   ├── US-0301-fix-double-event-tracking.md
│   │   ├── US-0302-calculate-intent-score.md
│   │   ├── US-0303-intent-score-reset-after-booking.md
│   │   └── US-0304-fix-origin-as-destination.md
│   ├── EP-04/
│   │   ├── US-0401-recommendations-from-active-intent.md
│   │   ├── US-0402-recommendations-from-preference-history.md
│   │   └── US-0403-decouple-notification-from-batch.md
│   ├── EP-05/
│   │   ├── US-0501-continue-planning-card.md
│   │   ├── US-0502-intent-ranked-recommendation-carousel.md
│   │   └── US-0503-homepage-empty-anonymous-state.md
│   ├── EP-06/
│   │   ├── US-0601-disable-fabricated-price-drop.md
│   │   ├── US-0602-return-reminder-near-real-time.md
│   │   ├── US-0603-suppress-notifications-after-booking.md
│   │   └── US-0604-sendgrid-email-re-engagement.md
│   ├── EP-07/
│   │   ├── US-0701-intent-ranked-ordering.md
│   │   ├── US-0702-recency-decay-preference-scoring.md
│   │   └── US-0703-ab-test-framework.md
│   ├── EP-08/
│   │   ├── US-0801-notification-ctr-tracking.md
│   │   ├── US-0802-recommendation-click-tracking.md
│   │   ├── US-0803-intent-tier-accuracy-logging.md
│   │   ├── US-0804-aggregation-job-monitoring.md
│   │   └── US-0805-admin-tooling-intent-notifications.md
│   └── EP-09/                               ← NEW (two-axis model, ADR-0008)
│       ├── US-0901-engagement-score-and-tiers.md
│       ├── US-0902-derived-preference-signals.md
│       ├── US-0903-intent-decay-and-trajectory.md
│       ├── US-0904-scenario-matrix.md
│       └── US-0905-scenario-simulation-harness.md
└── functions/
    ├── US-0103/  FN-010301-add-cabin-to-flight-view-metadata.md
    ├── US-0104/  FN-010401-remove-frontend-booking-tracking.md
    ├── US-0105/  FN-010501-rewrite-return-visit-query.md
                  FN-010502-emit-return-visit-event.md
    ├── US-0303/  FN-030301-score-reset-on-booking-completed.md
    ├── US-0304/  FN-030401-fix-metadata-destination-extraction.md
    ├── US-0601/  FN-060101-feature-flag-price-drop.md
    ├── US-0602/  FN-060201-decouple-return-reminder-trigger.md
    └── US-0604/  FN-060401-sendgrid-intent-threshold-email.md
```

---

## Epic summary

| ID | Epic | Stories | Priority | Phase |
|----|------|---------|----------|-------|
| EP-01 | Activity Tracking | US-0101 to US-0106 | Must | 1 |
| EP-02 | Preference Engine | US-0201 to US-0203 | Must/Should | 1–2 |
| EP-03 | Intent Engine | US-0301 to US-0304 | Must | 1 |
| EP-04 | Recommendation Engine | US-0401 to US-0403 | Must/Should | 2–3 |
| EP-05 | Dynamic Homepage | US-0501 to US-0503 | Must/Should | 2–3 |
| EP-06 | Personalized Notifications | US-0601 to US-0604 | Must/Should | 1–3 |
| EP-07 | Ranking System | US-0701 to US-0703 | Must/Should/Could | 2–4 |
| EP-08 | Analytics and Monitoring | US-0801 to US-0805 | Must/Should/Could | 2–3 |
| EP-09 | Engagement Axis & Notification Scenarios | US-0901 to US-0905 | Should | 2 |

---

## Build status (as implemented)

Reconciled with code on 2026-06-04. Test baseline moved from 17 → 2 failing
(`backend/__tests__`).

| Story | Status | Notes |
|-------|--------|-------|
| US-0101/0102/0106 | ✅ Built | search + wishlist tracking |
| US-0103 | ✅ Built | cabin defaults to `economy` (tracker + frontend) |
| US-0104 | 🟡 Built (partial) | `/track` whitelist + DB-backed idempotency; 2 in-process double-call unit scenarios stay RED by test design |
| US-0105 | ✅ Built | cross-session `return_visit` |
| US-0301 | ✅ Built | `/track` rejects server-authoritative events |
| US-0302 | ✅ Built | weights aligned to spec (`flight_view`/`hotel_view` = 3) |
| US-0303 | ✅ Built | score reset to 0 + `bookingCooldowns` on `booking_completed` |
| US-0304 | ✅ Built | origin no longer used as planning destination |
| US-0601 | ✅ Built | `price_drop` gated behind `ENABLE_PRICE_DROP_NOTIFICATIONS` (default off) |
| US-0603 | ✅ Built | notifications suppressed for booked destinations (7-day cool-down) |
| US-0401 | 🟡 In progress | cold-start fallback on build failure done; intent-first queries → Phase 3 |
| US-0403 | 🟡 In progress | `sentNotifications` write fault-isolated; real-time path → Phase 3 |
| EP-09 (Engagement axis) | ⏳ Phase 2 | new epic — engagement scoring, time-of-day/baggage/price signals, scenario matrix, simulation |

**Known RED (by design):** the two `US-0104` "called twice → one record"
integration scenarios share `bookingId: 'bk-001'` with green single-call tests in
the same Jest process. Any stateful in-process dedup would regress the green
tests; the always-null `findOne` mock hides the production DB idempotency. Real
double-counting is prevented by DB persistence + the `/track` whitelist + a single
server-side tracking call in `routes/bookings.js`.

---

## Story priority summary

### Must (Phase 1 — remove risk, restore data integrity)

| Story | Title | Root Cause |
|-------|-------|------------|
| US-0101 | Track flight search activity | RC-9 fix dependency |
| US-0102 | Track hotel search activity | — |
| US-0103 | Track flight view with cabin | RC-8 |
| US-0104 | Fix booking event double-tracking | RC-4 |
| US-0105 | Cross-session return visit detection | RC-3 |
| US-0201 | Aggregate destination preferences | — |
| US-0202 | Cabin preference profile | RC-8 |
| US-0301 | Fix double event tracking | RC-4 |
| US-0302 | Calculate intent score | — |
| US-0303 | Intent score reset after booking | RC-5 |
| US-0304 | Fix origin-as-destination | RC-9 |
| US-0401 | Recommendations from active intent | RC-10 |
| US-0402 | Recommendations from preference history | — |
| US-0501 | Continue Planning card | RC-3, RC-9 |
| US-0502 | Intent-ranked recommendation carousel | RC-10 |
| US-0601 | Disable fabricated price-drop | RC-6 |
| US-0603 | Suppress notifications after booking | RC-5 |
| US-0703 | A/B test framework | — (measurement gate) |
| US-0801 | Notification CTR tracking | — (Phase 2 gate) |
| US-0802 | Recommendation click tracking | — |
| US-0803 | Intent tier accuracy logging | A-2 |

### Should (Phase 2–3 — deliver value once bugs are fixed)

| Story | Title | Root Cause |
|-------|-------|------------|
| US-0106 | Track wishlist events | — |
| US-0203 | Cold-start configurable fallback | RC-12 |
| US-0403 | Decouple notification from batch | RC-2 |
| US-0503 | Homepage empty/anonymous state | RC-12 |
| US-0602 | Return reminder near-real-time | RC-2 |
| US-0604 | SendGrid email re-engagement | RC-11 |
| US-0701 | Intent-ranked ordering | RC-10 |
| US-0804 | Aggregation job monitoring | S2 ops need |

### Could / Won't-this-time (Phase 4 — calibration required)

| Story | Title | Root Cause |
|-------|-------|------------|
| US-0702 | Recency decay (calibration needed) | RC-7 |
| US-0805 | Admin tooling | S3 ops need |

---

## Traceability: Epic → Discovery artifact → Root cause

| Epic | Discovery artifact | Root cause(s) addressed |
|------|--------------------|------------------------|
| EP-01 | root-cause.md RC-3, RC-4, RC-8, RC-9 | RC-3, RC-4, RC-8, RC-9 |
| EP-02 | root-cause.md RC-7, RC-12 | RC-7 (partial), RC-12 |
| EP-03 | root-cause.md RC-4, RC-5, RC-9 | RC-4, RC-5, RC-9 |
| EP-04 | root-cause.md RC-2, RC-10 | RC-2, RC-10 |
| EP-05 | problem-statement.md §3, business-case.md §2.1 | RC-10, RC-12 |
| EP-06 | business-case.md §2.2, root-cause.md RC-6, RC-11 | RC-2, RC-5, RC-6, RC-11 |
| EP-07 | root-cause.md RC-7, business-case.md §4 Phase 2 | RC-7, A-2 |
| EP-08 | business-case.md §6, stakeholders.md S2, S3 | A-2, A-5, ops gaps |

---

## Review assignment

| File | Owner | Reviewer | Status |
|------|-------|----------|--------|
| EP-01 through EP-08 | TBD | TBD | Draft |
| All US-0101 – US-0805 | TBD | TBD | Draft |
| All FN-* | TBD | TBD | Draft |

*Assign one epic's stories per reviewer to keep review diffs small and reviewers accountable for a coherent slice.*

---

## Delivery sequence (recommended)

```
Phase 1 (Week 1, ~3 dev-days):
  US-0601 → US-0104/US-0301 → US-0303 → US-0105 → US-0304 → US-0103

Phase 2 (Weeks 2–3, ~6–9 dev-days):
  US-0703 → US-0801 → US-0802 → US-0803
  (run A/B test for 30 days before proceeding)

Phase 3 (Weeks 4–8, ~18–29 dev-days — conditional on Phase 2 CTR > 1%):
  US-0401 → US-0501 → US-0502 → US-0403/US-0602 → US-0604

Phase 4 (Month 3+, ~28–40 dev-days — conditional on Phase 3 lift measured):
  US-0702 → US-0805
```
