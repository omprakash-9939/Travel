---
id: US-0901
title: Engagement score and tiers
epic: EP-09
status: Built (Phase 2) — engagementEngine.computeEngagementScore + computeAndPersist
priority: Should
feature_file: features/engagement-scoring.feature
---

# US-0901 — Engagement score and tiers

**As a** platform operator
**I want** an engagement score (0–100) separate from the intent score
**So that** I can tell an involved browser apart from a decisive buyer and notify each appropriately.

## Description
`engagementEngine` derives engagement from session-level signals over a 30-day
window: number of sessions, average events per session, average time on page,
distinct destinations explored, return-visit cadence, and wishlist activity.
Each dimension is capped so no single signal dominates. The result is persisted
on `UserIntentScore.engagementScore` / `engagementTier` plus `sessionStats`.

## Acceptance criteria
- Given a user with one short session, when engagement is computed, then `engagementTier` is `low`.
- Given a user with many sessions, long dwell time and broad destination variety, when engagement is computed, then `engagementScore` is high (medium/high tier).
- Given no activity, when engagement is computed, then `engagementScore` is 0 and tier is `low`.
- Engagement is independent of intent: a low-intent user can be high-engagement and vice-versa.

## Dependencies
EP-01 activity tracking. Weights are estimates → calibrate via EP-08.
