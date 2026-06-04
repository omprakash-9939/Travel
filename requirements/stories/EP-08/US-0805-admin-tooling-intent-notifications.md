---
id: US-0805
title: Admin tooling — view and reset user intent state and notifications
epic: EP-08
owner: TBD
reviewer: TBD
status: Draft
priority: Could
wireframe: internal admin page (not customer-facing)
feature_file: pending
---

# US-0805 — Admin tooling: view and reset user intent state and notifications

**As a** support agent handling a user complaint about incorrect or unwanted notifications
**I want** to look up a user's current intent score, tier, active planning destination, and notification history
**So that** I can diagnose the issue and clear or suppress their notifications without escalating to engineering and requiring a direct database query

## Description
Currently, resolving any personalization-related complaint requires direct MongoDB access (S3 concern). This story adds an internal admin endpoint (and minimal UI) that exposes: (1) a user's current intent score, tier, `primaryPlanningDestination`, `sentNotifications[]`, and recent `UserActivity` events; (2) a "reset intent score" action; (3) a "suppress all notifications for this user" action. Access is restricted to admin-role users (`role === 'admin'` on the User model).

## Acceptance criteria
- Given an admin user navigates to `/admin/users/:userId/personalization`, when the page loads, then it displays: intent score, tier, `primaryPlanningDestination`, `sentNotifications[]` array with timestamps, and the last 10 `UserActivity` events.
- Given an admin clicks "Reset intent score", when the action is confirmed, then the user's intent score is set to 0, tier to `low`, and `sentNotifications[]` is cleared.
- Given an admin clicks "Suppress notifications", when the action is confirmed, then a `notificationsSuppressed` flag is set on the user record and no notifications are generated for that user until the flag is cleared.
- Given a non-admin user attempts to access the admin endpoint, when the request is made, then a `403 Forbidden` response is returned.
- Given the admin view is open, when notification reasoning is displayed, then each entry in `sentNotifications[]` shows the notification type, destination, trigger reason (e.g. "return_visit event, score 45, tier: medium"), and timestamp.

## Priority
Could — high value for support team (S3 stakeholder) but does not directly affect conversion. Low priority until the system has real production users generating support tickets. Schedule for first production release.

## Dependencies
- EP-03 (intent engine) and EP-06 (notifications) must be live to have data to display.
- Requires admin role gate on the User model (already exists: `role === 'admin'`).
- The "notification reasoning" display depends on structured notification metadata being stored when notifications are generated — add `reason` field to notification records as part of this story.
