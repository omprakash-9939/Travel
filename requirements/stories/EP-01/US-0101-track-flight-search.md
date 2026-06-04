---
id: US-0101
title: Track flight search activity
epic: EP-01
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend event; no distinct screen)
feature_file: pending
---

# US-0101 — Track flight search activity

**As an** authenticated user searching for flights
**I want** my search (origin, destination, dates, passengers, cabin) to be recorded as a `flight_search` event
**So that** my destination preferences and intent score are updated on every search

## Description
Every time an authenticated user submits a flight search, a `UserActivity` record of type `flight_search` is persisted in MongoDB. The metadata must contain `destination`, `origin`, `departDate`, `returnDate` (if round trip), `passengers`, and `cabin`. This is the primary feed event for the Preference Engine (EP-02) and Intent Engine (EP-03).

## Acceptance criteria
- Given an authenticated user submits a valid flight search, when the search API is called, then a `flight_search` `UserActivity` record is created with `destination`, `origin`, `departDate`, `cabin`, and `passengers` in `metadata`.
- Given the metadata `destination` field is populated, when `activityTracker` processes the event, then `primaryPlanningDestination` is updated to the destination (not the origin — see RC-9).
- Given an unauthenticated user submits a flight search, when the search API is called, then no `UserActivity` record is created and the tracker returns `{ tracked: false, reason: 'not authenticated' }`.
- Given a `flight_search` event is created, when the intent score is recalculated, then the user's score increments by the configured `flight_search` weight (currently 5 pts).

## Priority
Must

## Dependencies
- RC-9 fix (US-0304 in EP-03) must be in place so `destination` is correctly extracted from metadata, not `origin`.
- `UserActivity` model must have an index on `(user, createdAt)` to support efficient 90-day queries in EP-02.
