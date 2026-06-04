---
id: US-0804
title: Monitor aggregation job performance and alert on failure
epic: EP-08
owner: TBD
reviewer: TBD
status: Draft
priority: Should
wireframe: n/a (operational monitoring; no user-facing UI)
feature_file: pending
---

# US-0804 — Monitor aggregation job performance and alert on failure

**As an** operations engineer
**I want** the 2-hour preference aggregation job to log its cycle duration and alert when it exceeds 90 minutes or when users fail to aggregate
**So that** I have visibility into personalization health and can respond before stale recommendations affect users

## Description
Currently, `aggregationJob.js` uses `Promise.allSettled` and logs errors to `console.error` only (S2 concern). There is no alerting, no dead-letter queue, no metric on how many users failed to aggregate per cycle. At scale, an aggregation job that silently skips users produces stale recommendations with no observable signal. This story adds: (1) cycle start/end timing logged to a structured log, (2) a count of succeeded vs. failed user aggregations per cycle, (3) an alert mechanism (initially a log-level `ERROR` with a threshold check) if cycle time > 90 minutes or failed count > threshold.

## Acceptance criteria
- Given the aggregation job starts a cycle, when the job begins, then a structured log entry is written: `{ event: 'aggregation_start', userCount: N, timestamp }`.
- Given the cycle completes, when the job ends, then a structured log entry is written: `{ event: 'aggregation_complete', succeeded: N, failed: M, durationMs: X, timestamp }`.
- Given a cycle duration exceeds 90 minutes, when the threshold is crossed, then a log entry at `ERROR` level is written that can trigger an alerting system (e.g. CloudWatch, Datadog log-based alert).
- Given a user aggregation fails within `Promise.allSettled`, when the failure is caught, then the error is logged with `userId` and the error message — not silently discarded.
- Given the monitoring is in place, when the operations team queries logs, then they can see the trend of cycle duration over time and identify degradation before it becomes an outage.

## Priority
Should — operational maturity requirement. Does not block personalization features but prevents silent failures in production.

## Dependencies
- No functional prerequisites; this is a cross-cutting operational change to `aggregationJob.js`.
- Should ship before production launch (first real users).
