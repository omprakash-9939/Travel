---
id: US-0503
title: Handle empty and anonymous homepage state for new users
epic: EP-05
owner: TBD
reviewer: TBD
status: Draft
priority: Should
wireframe: homepage — unauthenticated / new-user state
feature_file: pending
---

# US-0503 — Handle empty/anonymous homepage state for new users

**As a** new or unauthenticated user visiting the homepage
**I want** to see relevant destination suggestions and a clear prompt to search
**So that** my first experience does not show empty sections or hardcoded destinations irrelevant to me

## Description
Unauthenticated and brand-new authenticated users (no preference history, no active intent) currently see no personalisation zone, or see content built from the hardcoded cold-start list (`['Mumbai', 'Dubai', 'Goa']`). This story defines the homepage state for these users: configurable popular destinations (from EP-02 US-0203), a prominent search bar, and optional market-based suggestions. This is primarily a frontend rendering concern — the backend provides the cold-start list; the frontend renders it appropriately.

## Acceptance criteria
- Given an unauthenticated user visits the homepage, when the page loads, then no "Continue Planning" card is shown and no user-specific recommendations appear.
- Given an unauthenticated user sees the homepage, when the popular destinations section renders, then it uses the configurable cold-start list (not hardcoded `['Mumbai', 'Dubai', 'Goa']`) from EP-02 US-0203.
- Given a new authenticated user with no prior activity views the homepage, when the page loads, then the recommendation carousel shows configurable popular destinations (not an empty or broken section).
- Given any user state (authenticated or not), when the homepage loads, then the search bar is always prominently visible and functional.
- Given the cold-start configuration is absent, when the homepage loads, then a sensible default list is displayed (backward-compatible fallback).

## Priority
Should — does not block core personalization for returning users. Improves first-impression conversion and is low engineering effort.

## Dependencies
- EP-02 US-0203 (configurable cold-start) must be live so the popular destinations list is configurable.
- EP-04 US-0402 (preference-history recommendations) handles the authenticated-no-history fallback.
- No hard dependency on EP-01 fixes — this story renders when there is nothing to personalise.
