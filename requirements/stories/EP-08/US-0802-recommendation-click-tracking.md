---
id: US-0802
title: Track recommendation card click-through rate
epic: EP-08
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: homepage carousel — card click event
feature_file: pending
---

# US-0802 — Track recommendation card click-through rate

**As a** platform owner
**I want** to know what percentage of users click on a recommendation card on the homepage carousel
**So that** I can evaluate whether personalized recommendations are surfacing relevant results that drive engagement

## Description
There is currently no click tracking on the recommendation carousel cards. Adding a `recommendation_clicked` event when a user clicks a card CTA provides the data needed to compute recommendation CTR. This is paired with impression tracking (how many recommendations were shown) to compute the full CTR metric. The `data-testid` attribute on card components allows both test assertions and analytics event binding.

## Acceptance criteria
- Given a recommendation carousel is rendered on the homepage, when a user clicks a card's CTA ("Book now" / "View"), then a `recommendation_clicked` `UserActivity` event is created with `destination`, `type` (flight/hotel), and `recommendationSource` (intent vs. preference history vs. cold-start) in `metadata`.
- Given the carousel is rendered, when the impression is logged, then a `recommendation_shown` event is created (once per carousel render, not per card).
- Given both events are tracked, when recommendation CTR is computed as `recommendation_clicked / recommendation_shown`, then the metric is queryable.
- Given the click tracking is added, when the carousel is rendered in the A/B control group (US-0703), then no click tracking event fires for control-group users (they do not see personalised recommendations).
- Given a user clicks a recommendation card, when they navigate to the search results page, then the page opens with the destination pre-filled.

## Priority
Must — provides the engagement signal needed to validate recommendation relevance. Required alongside EP-05 stories.

## Dependencies
- EP-05 US-0502 (recommendation carousel) must be live for this to have events to track.
- EP-07 US-0703 (A/B framework) should be live to segment clicks by personalised vs. control group.
