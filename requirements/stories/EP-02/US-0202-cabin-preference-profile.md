---
id: US-0202
title: Build cabin class preference profile
epic: EP-02
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend preference aggregation)
feature_file: pending
---

# US-0202 — Build cabin class preference profile

**As a** user who consistently searches or views business-class or premium-economy flights
**I want** my cabin preference to be reflected in my preference profile
**So that** flight recommendations are scoped to the cabin class I actually care about rather than always defaulting to economy

## Description
Currently, `preferredCabin` in every user's profile defaults to `"economy"` because `trackFlightView` in `PersonalizationContext.js:98–107` does not emit a `cabin` field (RC-8). Once US-0103 adds cabin to the view event, this story ensures `preferenceEngine.js` reads the `cabin` field from `UserActivity.metadata` and populates `preferredCabin` based on the most frequently viewed cabin. The existing `cabinCounts` aggregation logic is correct; it just has no input data until US-0103 ships.

## Acceptance criteria
- Given a user has viewed 5 business-class flights and 1 economy flight, when the preference aggregation runs, then `preferredCabin` is `"business"`.
- Given a user has equal cabin view counts, when the aggregation runs, then `preferredCabin` defaults to `"economy"` as a tie-breaking rule.
- Given a user has no `UserActivity` records with `cabin` metadata, when the aggregation runs, then `preferredCabin` is `"economy"` (safe default, not `undefined`).
- Given `preferredCabin` is `"business"`, when flight recommendations are generated (EP-04), then the recommendation query filters for business-class flights first.

## Priority
Must — currently all users are treated as economy-only. Recommendation quality for business/premium users is poor until this is resolved.

## Dependencies
- EP-01 US-0103 (track flight view with cabin) is a hard prerequisite. Without cabin in the view event, this story has no input data and `preferredCabin` will remain `"economy"`.
- EP-02 US-0201 (aggregation batch) must run the cabin aggregation in the same pass as destination aggregation.
