---
id: EP-09
title: Engagement Axis & Notification Scenarios
status: In progress
priority: Should
phase: 2
---

# EP-09 — Engagement Axis & Notification Scenarios

## Why this epic exists

The original engine had a single intent score that conflated *purchase
readiness* with *involvement* (see ADR-0008). This epic introduces the second
axis — **engagement** — plus richer preference signals (time-of-day,
baggage/fare, price sensitivity), intent time-decay, and an **Intent ×
Engagement notification scenario matrix** evaluated across sessions. It is the
behaviour-driven core the product brief asked for: "notifications based on
various scenarios like high/low engagement and intent throughout sessions".

## Objective

Adapt the app to *both* how ready a user is to book and how engaged they are,
and choose the right notification (or stay silent) for each combination and
trajectory.

## Scope

- **In:** engagement scoring + tiers; session stats; cross-session trajectory;
  intent time-decay; departure/arrival time-of-day, baggage/fare and
  price-sensitivity preference signals; the 3×3 scenario matrix; an optional
  Claude-backed copywriter with deterministic fallback; a seed + simulation
  harness proving the matrix.
- **Out:** A/B testing (EP-07 US-0703), analytics dashboards (EP-08), real price
  history (feeds price_drop, US-0601).

## Stories

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| US-0901 | Engagement score & tiers | Should | Built |
| US-0902 | Derived preference signals (time-of-day, baggage, price) | Should | Built |
| US-0903 | Intent time-decay & cross-session trajectory | Should | Built |
| US-0904 | Intent × Engagement notification scenario matrix | Should | Built |
| US-0905 | Scenario seed + simulation harness | Should | Built |

## Dependencies

- EP-01 activity tracking (events feed engagement) — Built.
- EP-03 intent scoring + reset/cool-down (US-0302/US-0303) — Built.
- EP-06 notification engine (matrix is the new selector) — Built (matrix), partial elsewhere.

## Risks

- Engagement weights + decay half-life are unvalidated estimates → calibrate via EP-08.
- Some matrix cells (e.g. high-intent/low-engagement) are hard to reach naturally because high intent needs many events, which also raise engagement — acceptable; the matrix function is unit-tested across all cells regardless.

## Traceability

ADR-0008 (two-axis model). Discovery: root-cause.md RC-7 (decay direction),
business-case.md (engagement as a conversion lever).
