---
id: US-0701
title: Intent-ranked recommendation and search result ordering
epic: EP-07
owner: TBD
reviewer: TBD
status: Draft
priority: Should
wireframe: homepage carousel; flight/hotel search results page
feature_file: pending
---

# US-0701 — Intent-ranked recommendation and search result ordering

**As a** user with active planning intent for Barcelona
**I want** Barcelona flights and hotels to appear first in both my recommendations and my search results
**So that** I spend less time scrolling past irrelevant results and more time evaluating the options that match my current planning context

## Description
This story extends EP-04 US-0401 (intent-based recommendations) to also re-rank search result listings. When a user has `primaryPlanningDestination` set, the flight and hotel search result pages should boost results matching that destination or showing it as a related link. Additionally, within the recommendation carousel, results are ordered by intent relevance (active intent destination first, then preference history destinations).

## Acceptance criteria
- Given a user with `primaryPlanningDestination = 'Barcelona'` views the homepage carousel, when recommendations load, then Barcelona items appear before items from other destinations.
- Given a user with active intent for Barcelona searches for hotels in a general query, when results are returned, then Barcelona hotels appear in a highlighted "Recommended for you" section above general results.
- Given a user has no active intent, when search results are returned, then they are ordered by the platform's default sort (price/popularity) — no intent ranking is applied.
- Given the intent ranking is active, when the A/B test control group (US-0703) makes the same request, then results are returned in default order (no personalised ranking for the control group).

## Priority
Should — meaningful UX improvement but depends on EP-04 and EP-03 being stable. Phase 3 work.

## Dependencies
- EP-04 US-0401 (intent-based recommendations) must be live.
- EP-03 US-0304 (fix origin-as-destination) must be live so intent signals are correct.
- EP-07 US-0703 (A/B framework) is needed to measure whether this ranking improvement increases CTR.
