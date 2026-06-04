---
id: US-0502
title: Show intent-ranked recommendation carousel on homepage
epic: EP-05
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: homepage — recommendation carousel section
feature_file: pending
---

# US-0502 — Show intent-ranked recommendation carousel on homepage

**As a** returning authenticated user
**I want** to see a carousel of recommended flights and hotels personalised to my planning intent
**So that** I can discover relevant options without starting a new search

## Description
The homepage recommendation carousel displays flight and hotel cards sourced from the Recommendation Engine (EP-04). Cards are ranked by the user's active intent (`primaryPlanningDestination` first, then `favoriteDestinations`). Each card links directly to the relevant search results or detail page. This is the primary discovery surface for returning users.

## Acceptance criteria
- Given an authenticated user with `primaryPlanningDestination = 'Barcelona'`, when the homepage loads, then the recommendation carousel contains Barcelona flights and hotels.
- Given the recommendations are loaded, when the carousel renders, then each card shows destination, price range, airline/hotel name, and a "Book now" or "View" CTA.
- Given the user clicks a recommendation card CTA, when navigation occurs, then the flight search or hotel search page opens filtered for that destination.
- Given the recommendation cache is fresh (< 6 hours old), when the homepage loads, then recommendations are served from cache without a new DB query.
- Given the recommendation engine fails to return results, when the homepage loads, then the carousel shows a graceful empty state ("Explore popular destinations") rather than an error or broken layout.

## Priority
Must

## Dependencies
- EP-04 US-0401 (intent-based recommendations) and US-0402 (preference-history fallback) must be live.
- EP-08 US-0802 (recommendation click-through tracking) should be added alongside this story to measure carousel engagement.
