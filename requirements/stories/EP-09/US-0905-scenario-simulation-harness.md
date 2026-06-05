---
id: US-0905
title: Scenario seed + simulation harness
epic: EP-09
status: Built (Phase 4) — scripts/seedPersonalization.js + scripts/simulatePersonalization.js
priority: Should
feature_file: features/notification-scenarios.feature
---

# US-0905 — Scenario seed + simulation harness

**As an** engineer
**I want** to replay representative multi-session user journeys through the engine
**So that** I can prove the Intent × Engagement matrix behaves correctly without waiting for production traffic.

## Description
`npm run simulate:personalization` replays six scripted journeys IN MEMORY (no
database) through the real engine functions and prints, per journey, the intent
tier, engagement tier, trajectory, scenario, and the notification that fires (or
silence). `npm run seed:personalization` writes the same journeys to MongoDB as
demo users so the homepage/recommendation APIs can be demoed end-to-end.

Journeys: high-intent burst, low-intent/high-engagement browser, rising across
sessions, falling/stalled, abandoned hot lead, post-booking suppression.

## Acceptance criteria
- The simulation runs with no DB and prints a table covering all six journeys.
- The post-booking journey is silent (intent reset to 0, scenario `suppressed`, no notification).
- The low-intent/high-engagement journey never receives `closing`/`decisive_nudge`.
- The falling journey receives `reengage`; the abandoned hot lead receives `closing`.
- `scenarioSimulation.integration.test.js` asserts the full matrix + the six journeys and is green.

## Dependencies
US-0901–US-0904. The simulation is the acceptance gate for EP-09.
