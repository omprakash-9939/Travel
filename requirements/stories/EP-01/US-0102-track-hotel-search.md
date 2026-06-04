---
id: US-0102
title: Track hotel search activity
epic: EP-01
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend event; no distinct screen)
feature_file: pending
---

# US-0102 — Track hotel search activity

**As an** authenticated user searching for hotels
**I want** my hotel search (city, check-in, check-out, guests) to be recorded as a `hotel_search` event
**So that** my destination preferences and intent score reflect hotel planning in addition to flight planning

## Description
Every time an authenticated user submits a hotel search, a `UserActivity` record of type `hotel_search` is persisted. The metadata must contain `city`, `checkIn`, `checkOut`, and `guests`. The `city` field maps to the destination preference bucket in EP-02 and contributes to intent scoring in EP-03.

## Acceptance criteria
- Given an authenticated user submits a hotel search, when the search API is called, then a `hotel_search` `UserActivity` record is created with `city`, `checkIn`, `checkOut`, and `guests` in `metadata`.
- Given a `hotel_search` event is created, when the intent score is recalculated, then the user's score increments by the configured `hotel_search` weight (currently 5 pts).
- Given an unauthenticated user submits a hotel search, when the search API is called, then no `UserActivity` record is created.
- Given a `hotel_search` event is created for a city, when the preference engine aggregates the user's profile, then the searched city's destination score is incremented.

## Priority
Must

## Dependencies
- No blocking dependencies within EP-01; `hotel_search` event tracking is independent.
- EP-02 preference engine consumes these events for destination scoring.
- EP-03 intent engine consumes these events for score increments.
