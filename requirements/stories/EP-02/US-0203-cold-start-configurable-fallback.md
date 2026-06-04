---
id: US-0203
title: Handle cold-start for new users with configurable fallback
epic: EP-02
owner: TBD
reviewer: TBD
status: Draft
priority: Should
wireframe: n/a (backend logic; visible output on homepage EP-05)
feature_file: pending
---

# US-0203 — Handle cold-start for new users with configurable fallback

**As a** new user with no search history
**I want** to see relevant destination suggestions on my homepage
**So that** my first experience reflects popular choices for my market or context rather than hardcoded Indian cities that may be irrelevant to me

## Description
Currently, `buildRecommendations()` in `recommendationEngine.js:308` hardcodes `['Mumbai', 'Dubai', 'Goa']` as the fallback when `topDests` is empty. This is not configurable and is irrelevant for users outside the Indian market. This story replaces the hardcoded array with a configurable list (e.g. from environment variable or a small config file) and adds optional geo-IP inference as an enhancement. Addresses RC-12.

## Acceptance criteria
- Given a new user with no `UserActivity` records, when the recommendation engine runs, then the cold-start destinations are sourced from a configurable list (not hardcoded `['Mumbai', 'Dubai', 'Goa']`).
- Given a `COLD_START_DESTINATIONS` config or environment variable is set to `['London', 'Paris', 'Rome']`, when a new user requests recommendations, then their homepage shows London, Paris, and Rome results.
- Given the config is absent or invalid, when a new user requests recommendations, then a sensible default list is used (maintaining backward compatibility).
- Given a user completes their first flight search, when the next recommendation request arrives, then the cold-start fallback is replaced by the user's actual search history (i.e. cold-start is only active while `topDests` is empty).

## Priority
Should — the cold-start problem only affects new users and does not block core personalization for returning users. However, it directly impacts first-session conversion and should be resolved before production launch.

## Dependencies
- EP-04 (Recommendation Engine) must read from the configurable cold-start destinations.
- No blocking dependency on other EP-02 stories; this is independent of US-0201 and US-0202.
- EP-05 US-0503 (empty/anonymous homepage state) uses the cold-start output to populate the homepage for new users.
