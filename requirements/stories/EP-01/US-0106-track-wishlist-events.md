---
id: US-0106
title: Track wishlist add/remove events
epic: EP-01
owner: TBD
reviewer: TBD
status: Draft
priority: Should
wireframe: n/a (frontend event on wishlist toggle)
feature_file: pending
---

# US-0106 — Track wishlist add/remove events

**As an** authenticated user who adds or removes a destination/flight/hotel from my wishlist
**I want** each wishlist action to be recorded as a `wishlist_added` or `wishlist_removed` event
**So that** the intent engine uses my save actions as an intent signal and the preference engine updates my destination interest score

## Description
Wishlist events already exist in the codebase (`wishlist_added` contributes +5 pts to intent score). This story validates and confirms the tracking is complete and correct — specifically that the `destination` field is populated in `metadata` so the preference engine can use wishlisted destinations in aggregation. A `wishlist_removed` event should decrement the destination score to reflect the user's changed interest.

## Acceptance criteria
- Given an authenticated user adds a flight or hotel to their wishlist, when the wishlist action is triggered, then a `wishlist_added` `UserActivity` record is created with the relevant `destination` in `metadata`.
- Given a `wishlist_added` event fires, when the intent score is recalculated, then the score increments by the configured `wishlist_added` weight (currently 5 pts).
- Given an authenticated user removes an item from their wishlist, when the remove action is triggered, then a `wishlist_removed` `UserActivity` record is created with the relevant `destination` in `metadata`.
- Given an unauthenticated user clicks the wishlist toggle, when the action is triggered, then no `UserActivity` record is created.
- Given a destination has `wishlist_added` events, when the preference engine aggregates the user's profile, then the wishlisted destination appears in the destination score map.

## Priority
Should — wishlist tracking already exists; this story validates completeness and adds the `wishlist_removed` decrement signal. Not a blocking dependency for core intent scoring.

## Dependencies
- No blocking dependencies within EP-01.
- EP-02 (preference engine) benefits from wishlist data in destination scoring.
- EP-03 (intent engine) already includes `wishlist_added` weight; `wishlist_removed` handling is additive.
