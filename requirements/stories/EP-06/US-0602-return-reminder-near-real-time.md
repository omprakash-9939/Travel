---
id: US-0602
title: Deliver return_reminder notification in near-real-time
epic: EP-06
owner: TBD
reviewer: TBD
status: Draft
priority: Should
wireframe: notification bell — return_reminder card
feature_file: pending
---

# US-0602 — Deliver return_reminder notification in near-real-time

**As a** returning user who has just searched Barcelona for the second time this week
**I want** to see a "Still thinking about Barcelona?" notification immediately in the current session
**So that** I am nudged to complete the booking while I am actively on the platform, not after I have navigated away

## Description
The `return_reminder` notification is the core Barcelona scenario intervention. Currently it arrives up to 2 hours after the return search because notification generation is coupled to the batch aggregation job (RC-2). EP-04 US-0403 decouples the generation pipeline architecturally. This story defines the notification content and delivery requirements: the `return_reminder` should fire within the current request cycle when a `return_visit` event with `medium` or `high` intent tier is detected, and the notification should appear in the in-app bell without a page reload.

## Acceptance criteria
- Given a user's `return_visit` event fires and their intent tier is `medium` or `high`, when the event is processed, then a `return_reminder` notification is created and available in their notification list within the same HTTP request cycle.
- Given the notification is created, when the user looks at the notification bell (without reloading the page), then the new notification is visible (frontend polls or receives via existing refresh mechanism).
- Given the notification content, when it renders in the bell, then it reads "Still thinking about [destination]? Continue planning →" with a link to pre-filled search results.
- Given a `return_reminder` was sent in the last 48 hours for the same destination, when a new `return_visit` fires, then no duplicate notification is generated (existing dedup window is respected).
- Given the user's tier is `low`, when a `return_visit` fires, then no `return_reminder` is generated (tier gate is enforced).

## Priority
Should — high conversion value but depends on EP-04 US-0403 (decouple batch) and EP-01/EP-03 fixes. Phase 3 investment per business-case.md.

## Dependencies
- EP-04 US-0403 (decouple notification from batch) is a prerequisite.
- EP-01 US-0105 (cross-session return visit) must be live.
- EP-03 US-0301 (fix double tracking) and US-0302 (intent score) must be live.
- EP-06 US-0601 (disable price_drop) must ship before this story.
