---
id: US-0803
title: Log intent tier accuracy — high-tier user booking rate
epic: EP-08
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: n/a (backend analytics logging)
feature_file: pending
---

# US-0803 — Log intent tier accuracy

**As a** platform owner
**I want** to know what percentage of users classified as `high` intent actually book within 7 days
**So that** I can validate whether the scoring thresholds (≥71 = high) correlate with real purchase probability, and calibrate them if they do not

## Description
The intent tier thresholds (score ≥ 31 = medium, ≥ 71 = high) were set by engineering judgment with no empirical validation (A-2 from root-cause.md). This story logs a `tier_accuracy_record` whenever a user transitions to `medium` or `high` tier, storing the tier, the score, and the timestamp. A background query checks 7 days later whether that user made a booking — producing the "did this high-tier user actually book?" signal. This enables threshold calibration (EP-07 US-0702 also depends on this data).

## Acceptance criteria
- Given a user's intent tier transitions from `low` to `medium`, when the transition occurs, then a record is written capturing `userId`, `tier = 'medium'`, `score`, `destination = primaryPlanningDestination`, and `recordedAt = now`.
- Given a user's intent tier transitions from `medium` to `high`, when the transition occurs, then a similar record is written with `tier = 'high'`.
- Given 7 days have passed since a `tier_accuracy_record` was written, when a background job evaluates it, then the record is updated with `bookedWithin7Days = true/false` based on whether a `booking_completed` event exists for that user in the 7-day window.
- Given 30 days of tier accuracy data, when the accuracy is computed, then the percentage of `high`-tier users who booked within 7 days is queryable and reportable.
- Given the accuracy data is available, when the threshold is evaluated, then if `high`-tier booking rate is < 30%, the threshold (71 pts) should be flagged for recalibration.

## Priority
Must — this is the measurement foundation that validates the entire intent engine. Without it, all tier-based features (notifications, email, ranking) are operating on unvalidated assumptions (A-2).

## Dependencies
- EP-03 US-0301 (double tracking fix) must be live so `booking_completed` counts are correct.
- EP-03 US-0302 (intent scoring) must be live and producing tier transitions.
- This story's data output is a prerequisite for EP-07 US-0702 (recency decay calibration) and EP-06 US-0604 (SendGrid email) production enablement.
