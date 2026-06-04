---
id: US-0702
title: Apply recency decay to destination preference scoring
epic: EP-07
owner: TBD
reviewer: TBD
status: Draft
priority: Could
wireframe: n/a (backend preference aggregation logic)
feature_file: pending
---

# US-0702 — Apply recency decay to destination preference scoring

**As a** user who searched Mumbai heavily 60 days ago but has been searching Barcelona for the past week
**I want** Barcelona to score higher than Mumbai in my preference profile
**So that** homepage recommendations reflect where I want to travel now, not where I was interested in two months ago

## Description
Currently, `preferenceEngine.js:63` uses flat weights regardless of event age: `bumpScore(destScores, dest, a.eventType.includes('search') ? 3 : 2)`. A search 89 days ago scores identically to a search yesterday. Adding exponential or linear time decay (e.g. half-life of 14 days) would make recent searches dominate the score. Addresses RC-7.

**IMPORTANT:** This story must not be started until EP-08 US-0803 produces at least 30 days of intent tier accuracy data. Setting the decay half-life requires empirical calibration from real conversion signals — wrong decay can degrade recommendation quality below the flat-scoring baseline.

## Acceptance criteria
- Given a user searched Mumbai 60 days ago and Barcelona 3 days ago with the same number of searches, when the preference aggregation runs with decay enabled, then Barcelona's score is higher than Mumbai's.
- Given a decay half-life of N days (configurable), when a search event is N days old, then its contribution to the destination score is 50% of a fresh event of the same type.
- Given decay is applied, when the aggregation result is compared to the non-decay baseline for a user with only recent activity (< 7 days), then scores are nearly identical (decay has minimal effect on fresh data).
- Given the `PREFERENCE_DECAY_ENABLED` feature flag is `false`, when aggregation runs, then flat scoring is used (backward compatibility; decay is off by default until calibrated).
- Given EP-08 US-0803 data shows high-tier users book at < 30% accuracy, when the decay half-life is recalibrated, then a new half-life can be set via config without a code change.

## Priority
Could — meaningful quality improvement but requires calibration data. Do not ship before EP-08 US-0803 has 30+ days of measured intent accuracy data (A-2, RC-7 analysis).

## Dependencies
- EP-08 US-0803 (tier accuracy logging, 30+ days of data) is a hard prerequisite before this story is activated in production.
- EP-02 US-0201 (preference aggregation) is the base — this story modifies the scoring function within it.
- The decay half-life must be stored as a configurable constant, not hardcoded.
