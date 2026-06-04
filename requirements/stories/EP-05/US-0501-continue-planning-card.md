---
id: US-0501
title: Show "Continue Planning" card for active returning planners
epic: EP-05
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: homepage — above-the-fold personalisation zone
feature_file: pending
---

# US-0501 — Show "Continue Planning" card for active returning planners

**As a** returning authenticated user who has been researching Barcelona flights
**I want** to see a "Continue Planning — Barcelona" card on my homepage when I return
**So that** I can resume my search immediately without re-entering my destination and dates

## Description
When an authenticated user returns to the homepage and their `primaryPlanningDestination` is set (i.e. they have a `medium` or `high` intent tier with an active destination), the homepage displays a "Continue Planning" card showing the destination, last-searched dates, and a direct CTA back to the search results. This is rated Medium–High conversion contribution in business-case.md §2.1 because it eliminates the re-search friction for the highest-intent user group.

## Acceptance criteria
- Given an authenticated user with `primaryPlanningDestination = 'Barcelona'` and tier `medium` lands on the homepage, when the page loads, then the "Continue Planning" card is displayed showing "Barcelona" and the last searched travel dates.
- Given the user clicks the "Continue Planning" CTA, when the navigation occurs, then the flight search page opens pre-filled with the destination and last-searched dates.
- Given an authenticated user with no `primaryPlanningDestination` (new user or post-booking), when the homepage loads, then no "Continue Planning" card is shown (falls through to recommendation carousel).
- Given an unauthenticated user visits the homepage, when the page loads, then no "Continue Planning" card is shown.
- Given the `metadata` for the last search was incomplete (missing dates due to RC-9 bug), when the card renders after the RC-9 fix is live, then dates either display correctly or the card shows the destination-only variant (not a broken/empty card).

## Priority
Must

## Dependencies
- EP-01 US-0105 (cross-session return visit detection) must be live so the return visit registers and `primaryPlanningDestination` is set.
- EP-03 US-0304 (fix origin-as-destination) must be live so the card shows the correct destination, not the departure city.
- EP-04 US-0401 (intent-ranked recommendations) should be live so the carousel below the card is also relevant.
