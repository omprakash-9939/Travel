---
id: US-0801
title: Track notification click-through rate
epic: EP-08
owner: TBD
reviewer: TBD
status: Draft
priority: Must
wireframe: notification bell — CTA click event
feature_file: pending
---

# US-0801 — Track notification click-through rate

**As a** platform owner
**I want** to know what percentage of users who see a notification click its CTA
**So that** I can determine whether notifications are helping (CTR > 1%) or irritating users (high dismiss rate), and make a go/no-go decision for Phase 3 investment

## Description
Currently, there is no tracking on whether a user clicks the CTA in a notification or dismisses it. The notification bell in `Navbar.js` only records `dismissNotification`. This story adds a `notification_clicked` event to the activity tracker when a user clicks the CTA link in a notification, and a `notification_dismissed` event when they click dismiss without navigating. This provides the two data points needed to compute CTR and dismiss rate.

## Acceptance criteria
- Given a user clicks the CTA link in a `return_reminder` notification, when the click occurs, then a `notification_clicked` `UserActivity` event is created with the notification `type` and `destination` in `metadata`.
- Given a user clicks the dismiss button on a notification, when the dismiss occurs, then a `notification_dismissed` `UserActivity` event is created.
- Given both events are tracked, when notification CTR is computed as `notification_clicked / (notification_clicked + notification_dismissed)`, then the metric is queryable from `UserActivity` data.
- Given the tracking events fire, when A/B test data (US-0703) is analysed, then CTR can be compared between personalised and control group users.
- Given the tracking code is added to the notification bell component, when the component is rendered, then no performance regression is introduced (tracking calls are non-blocking).

## Priority
Must — this is a prerequisite for the Phase 3 go/no-go decision. Without CTR data, there is no evidence that notifications help rather than harm. Business-case.md §6 Phase 2 gate: "CTR > 1% before expanding notification volume."

## Dependencies
- EP-06 (notification delivery) must be generating notifications for this tracking to be meaningful.
- EP-07 US-0703 (A/B framework) should be live simultaneously to segment CTR by group.
