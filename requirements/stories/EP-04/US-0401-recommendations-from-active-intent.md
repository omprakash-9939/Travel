---
id: US-0401
title: Build recommendations using active planning intent
epic: EP-04
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend recommendation query logic)
feature_file: pending
---

# US-0401 — Build recommendations using active planning intent

**As a** user who is actively planning a Barcelona trip this week
**I want** my homepage recommendations to show Barcelona flights and hotels
**So that** I can progress toward booking without re-entering my destination

## Description
Currently, `buildRecommendations()` in `recommendationEngine.js:307–315` queries flights and hotels using `prefs.favoriteDestinations` (90-day history). A user who has searched Barcelona twice this week but historically searched Mumbai more often will see Mumbai results. This story changes the recommendation query to prioritise `intent.primaryPlanningDestination` when it is set, falling back to `favoriteDestinations` only when there is no active planning signal. Addresses RC-10.

## Acceptance criteria
- Given a user's `primaryPlanningDestination` is `Barcelona` and their all-time top destination is `Mumbai`, when recommendations are built, then Barcelona flights and hotels appear first.
- Given a user has no active `primaryPlanningDestination`, when recommendations are built, then the system falls back to `favoriteDestinations` (the 90-day history top destinations).
- Given a user has no preference history and no active intent, when recommendations are built, then the cold-start fallback list (EP-02 US-0203) is used.
- Given the recommendation query runs, when results are returned, then they are written to `RecommendationCache` with the existing 6-hour TTL.
- Given `buildRecommendations()` throws for a user, when the error is caught, then the user receives the cold-start fallback rather than an empty response.

## Priority
Must — this is the core reason personalized recommendations exist. Showing history-dominated results to a user with an active planning intent is the primary failure mode identified in RC-10.

## Dependencies
- EP-03 US-0304 (fix origin-as-destination) must be live so `primaryPlanningDestination` is correct.
- EP-01 US-0105 (cross-session return visit) should be live so `primaryPlanningDestination` is set on return visits.
- EP-02 US-0201 (preference aggregation) provides the fallback `favoriteDestinations`.
