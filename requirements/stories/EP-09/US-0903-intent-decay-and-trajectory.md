---
id: US-0903
title: Intent time-decay and cross-session trajectory
epic: EP-09
status: Built (Phase 2) — engagementEngine.decayIntent + determineTrajectory
priority: Should
feature_file: features/engagement-scoring.feature
---

# US-0903 — Intent time-decay and cross-session trajectory

**As a** platform operator
**I want** intent to cool off with inactivity and a labelled trajectory
**So that** a single old burst of activity doesn't keep a user "high" forever, and notifications can react to whether intent is rising, stalling or falling.

## Description
During aggregation the intent score is decayed toward 0 with a 7-day half-life
based on time since last activity (`decayIntent`). A `trajectory` label is
derived by comparing intent points in the recent (≤3 days) vs prior (3–7 days)
windows: `rising` | `stalled` | `falling` | `post-booking` | `new`. An active
booking cool-down forces `post-booking`.

## Acceptance criteria
- Given a score of 80 and last activity 7 days ago, when decay runs, then the score is ~40.
- Given recent activity exceeds prior-window activity, then trajectory is `rising`.
- Given recent activity is well below the prior window, then trajectory is `falling`.
- Given a booking cool-down is active, then trajectory is `post-booking` and intent is not decayed (already reset).
- Given no activity in either window, then trajectory is `new`.

## Dependencies
EP-03 US-0303 (reset + `bookingCooldowns`). Half-life is an estimate → calibrate via EP-08.
