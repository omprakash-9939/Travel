---
id: US-0703
title: A/B test framework — personalization control group
epic: EP-07
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend assignment; invisible to end users)
feature_file: pending
---

# US-0703 — A/B test framework: personalization control group

**As a** platform owner
**I want** a stable percentage of users (e.g. 20%) to be randomly assigned to a control group that receives no personalization
**So that** I can measure the true lift of personalization by comparing conversion rates between the personalised and control groups

## Description
Without an A/B control group, it is impossible to claim that any improvement in conversion rate is caused by personalization rather than seasonal demand, natural user behaviour, or other factors. This story implements a simple, stable user assignment (consistent hashing or a persisted `abGroup` field on the `User` model) that places each user in either the `personalised` or `control` bucket. Users in the control group receive default search results, no personalised homepage, and no intent-triggered notifications. Their behaviour is still tracked for analytics.

## Acceptance criteria
- Given a new user is created, when their account is initialised, then they are assigned to either `personalised` (80%) or `control` (20%) group with stable, random hashing.
- Given a user is in the `control` group, when the homepage loads, then no personalisation zone, "Continue Planning" card, or intent-ranked carousel is shown.
- Given a control group user makes a request, when the API processes it, then the recommendation engine returns default (unpersonalised) results.
- Given a control group user's activity is tracked, when the analytics are queried, then their events are still stored and counted (tracking continues for measurement; only the personalisation outputs are suppressed).
- Given the same user returns in subsequent sessions, when their group is evaluated, then they are always assigned to the same group (assignment is stable over time, not re-randomised per session).
- Given the A/B split is active for 30 days, when conversion rates are compared, then the personalised group's search-to-booking rate can be compared against the control group's rate as the baseline.

## Priority
Must — the A/B framework is the go/no-go gate before Phase 3 investment is justified (business-case.md §6 Phase 2). Without it, ROI claims are not defensible.

## Dependencies
- EP-01 (activity tracking) and EP-03 (intent scoring) must be live and producing correct data before the A/B test starts.
- EP-08 US-0801 (notification CTR tracking) and US-0803 (tier accuracy) must be live alongside this story to measure the test outcomes.
- Should run for a minimum of 30 days before drawing conclusions.
