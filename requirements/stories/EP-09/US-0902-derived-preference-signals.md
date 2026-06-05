---
id: US-0902
title: Derived preference signals (time-of-day, baggage, price)
epic: EP-09
status: Built (Phase 2) — preferenceEngine + timeOfDay; UserActivity metadata + flight-view route
priority: Should
feature_file: features/preference-signals.feature
---

# US-0902 — Derived preference signals (time-of-day, baggage, price)

**As a** traveller
**I want** the app to learn *when* I like to fly, my fare/baggage posture, and my price band
**So that** recommendations and notifications match how I actually book, not just where.

## Description
`UserActivity.metadata` carries `departureHour`/`arrivalHour`/`departureBucket`/
`arrivalBucket` (red-eye | early-morning | morning | afternoon | evening | night),
`baggage`, and `refundable`, populated by the flight-view route from the Flight
document. `preferenceEngine` aggregates these into `UserPreference`:
`departureTimePreference`, `arrivalTimePreference`, `baggagePreference`
(light/standard/heavy), `prefersRefundable`, and `priceSensitivity`
(budget/mid/premium) from average flight price.

## Acceptance criteria
- Given flights viewed mostly departing 05:00–07:59, when preferences aggregate, then `departureTimePreference` is `early-morning`.
- Given viewed fares average < ₹15,000, then `priceSensitivity` is `budget`; ≥ ₹45,000 → `premium`.
- Given baggage allowances average ≤ 15 kg, then `baggagePreference` is `light`.
- Given a majority of viewed flights are refundable, then `prefersRefundable` is true.
- A user with no flight signals has these fields null/`unknown`.

## Dependencies
EP-01 (cabin/metadata), Flight model (`departure`, `arrival`, `cabins.*.baggage`, `refundable`).
