---
id: US-0904
title: Intent × Engagement notification scenario matrix
epic: EP-09
status: Built (Phase 3) — notificationEngine.selectScenario + buildScenarioNotification
priority: Should
feature_file: features/notification-scenarios.feature
---

# US-0904 — Intent × Engagement notification scenario matrix

**As a** traveller
**I want** the notification I receive to match both my readiness and my involvement
**So that** I'm nudged when I'm ready, inspired when I'm exploring, and left alone when I just booked.

## Description
`notificationEngine.selectScenario(intent)` maps the (intent tier × engagement
tier) cell, with trajectory overrides, to a scenario:

|              | engagement low | engagement medium | engagement high |
|--------------|----------------|-------------------|-----------------|
| intent high  | decisive_nudge | closing           | closing         |
| intent medium| reengage       | standard_recs     | guided          |
| intent low   | dormant (silent)| inspire          | inspire         |

Overrides: `post-booking` → `suppressed` (silent); `falling` (non-high) →
`reengage`. `buildScenarioNotification` produces one primary notification per
non-silent scenario, suppressing destinations in booking cool-down, with copy
from Claude (when `ENABLE_LLM_COPY=true`) or deterministic templates.

## Acceptance criteria
- Each of the nine (intent × engagement) cells maps to the scenario in the table above.
- A `post-booking` user gets no notification regardless of tiers.
- A `falling`, non-high-intent user gets `reengage`.
- `dormant` (low/low) and `suppressed` produce no notification.
- A destination in `bookingCooldowns` is never the subject of a nudge.

## Dependencies
US-0901 (engagement), US-0903 (trajectory), EP-03 US-0303 (cool-down), claudeClient (optional).
