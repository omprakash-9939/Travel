---
id: US-0201
title: Aggregate destination preferences from 90-day activity
epic: EP-02
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend batch job; no UI)
feature_file: pending
---

# US-0201 — Aggregate destination preferences from 90-day activity

**As a** returning authenticated user
**I want** my historical searches and views across the last 90 days to be summarised into a preference profile
**So that** recommendations on my homepage and search results reflect where I actually want to travel, not generic popularity

## Description
The preference engine (run by `preferenceEngine.js` in the aggregation batch) queries `UserActivity` records for the last 90 days, tallies destination occurrences with event-type weights (`search = +3, view = +2`), and writes the top N destinations to the user's `UserPreference` document as `favoriteDestinations`. This profile feeds the Recommendation Engine (EP-04). This story validates the existing mechanism is correct and its output is reliable given EP-01 fixes (cabin, origin/destination).

## Acceptance criteria
- Given a user has searched Barcelona 5 times and Dubai 2 times in the past 90 days, when the aggregation job runs, then `favoriteDestinations` lists Barcelona first and Dubai second.
- Given a `UserActivity` record is older than 90 days, when the aggregation runs, then it is excluded from the preference score (90-day window is enforced).
- Given a user has no `UserActivity` records within 90 days, when the aggregation runs, then `favoriteDestinations` is empty (cold-start — handled by US-0203).
- Given the aggregation completes for a user, when the preference profile is read, then `favoriteDestinations`, `preferredCabin` (from US-0202), and `lastAggregated` timestamp are all present.
- Given the aggregation batch runs for 50 users in parallel, when the batch completes, then no unhandled exceptions are thrown and all 50 users have updated profiles.

## Priority
Must

## Dependencies
- EP-01 US-0101 (flight search tracking) and US-0102 (hotel search tracking) must be live to populate `UserActivity` records.
- EP-01 US-0104 (double-tracking fix) must be resolved so activity counts are not inflated.
- EP-01 US-0103 (cabin metadata) is a prerequisite for US-0202 (cabin preference).
- MongoDB index on `(user, createdAt)` in `UserActivity` must exist to keep 90-day queries performant.
