---
id: US-0402
title: Build recommendations using 90-day preference history
epic: EP-04
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend recommendation query)
feature_file: pending
---

# US-0402 — Build recommendations using 90-day preference history

**As a** returning user without an active planning session
**I want** to see recommendations based on my recent search history
**So that** my homepage still feels personalised even when I am not mid-planning

## Description
When a user has no active `primaryPlanningDestination` (e.g. they haven't searched recently, or just completed a booking and the score was reset), the recommendation engine falls back to the user's `favoriteDestinations` from the 90-day aggregated preference profile. This story validates the fallback path is correct and the recommendations returned are real flights/hotels matching the historical top destinations.

## Acceptance criteria
- Given a user's `primaryPlanningDestination` is null and their `favoriteDestinations` are `['Dubai', 'Singapore']`, when recommendations are built, then Dubai and Singapore flights/hotels are returned.
- Given a user's `favoriteDestinations` contains a destination with no available flights or hotels in the DB, when the query runs, then the engine skips that destination and tries the next one (does not return an empty result for the whole recommendation set).
- Given recommendations are written to `RecommendationCache`, when the same user requests recommendations within 6 hours, then the cached result is returned without re-querying the DB.
- Given the `RecommendationCache` is invalidated (e.g. after a booking via `invalidateCache`), when the user next requests recommendations, then a fresh query is run.

## Priority
Must — this is the fallback path for all users without an active planning session. It must work correctly for the homepage to be useful.

## Dependencies
- EP-02 US-0201 (preference aggregation) must run and populate `favoriteDestinations`.
- EP-04 US-0401 (intent-based query) is the primary path; this story is the fallback path — they share the same function with a conditional branch.
