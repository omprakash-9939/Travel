---
id: US-0103
title: Track flight view events with cabin metadata
epic: EP-01
owner: TBD
reviewer: TBD
status: Built (Phase 1) — cabin defaults to economy in tracker + frontend reports cabin
priority: Must
wireframe: n/a (frontend event on flight result card click)
feature_file: pending
---

# US-0103 — Track flight view events with cabin metadata

**As an** authenticated user viewing a specific flight result
**I want** my view event to include the cabin class of the flight I viewed
**So that** the platform can learn my cabin preference and recommend relevant flights (economy vs. business vs. premium economy)

## Description
Currently, `trackFlightView` in `PersonalizationContext.js:98–107` does not pass `cabin` in the metadata payload. As a result, `preferredCabin` in the preference profile always defaults to `economy` for every user, regardless of what cabin class they actually viewed. This story adds `cabin` to the `trackFlightView` call. Addresses RC-8.

## Acceptance criteria
- Given an authenticated user clicks on a flight result, when `trackFlightView` is called, then the `UserActivity` record includes `cabin` in `metadata` (e.g. `"economy"`, `"business"`, `"premiumEconomy"`).
- Given a user has viewed three business-class flights and zero economy flights, when the preference engine aggregates their cabin profile, then `preferredCabin` is `"business"` (not `"economy"`).
- Given the `cabin` field is absent from the flight result (legacy data), when `trackFlightView` is called, then `cabin` defaults to `"economy"` rather than being `undefined`.
- Given an unauthenticated user clicks on a flight result, when `trackFlightView` is called, then no `UserActivity` record is created.

## Priority
Must

## Dependencies
- Requires access to `cabin` value on the flight result card component at the time of the click event.
- EP-02 US-0202 (cabin preference build) depends on this story being live.
- No blocking dependency on other EP-01 stories.
