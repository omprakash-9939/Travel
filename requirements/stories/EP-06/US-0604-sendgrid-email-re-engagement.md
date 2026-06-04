---
id: US-0604
title: Send out-of-app email re-engagement via SendGrid on intent threshold
epic: EP-06
owner: TBD
reviewer: TBD
status: Draft
priority: Should
wireframe: n/a (triggered email; no in-app UI)
feature_file: pending
---

# US-0604 — Send out-of-app email re-engagement via SendGrid on intent threshold

**As a** user who searched Barcelona, left the platform, and has not returned in 24 hours
**I want** to receive an email saying "You were looking at Barcelona flights — prices start from ₹X,XXX"
**So that** I am reminded to complete my booking even when I am not actively visiting the platform

## Description
SendGrid integration exists in `sendgrid.js` under `services/integrations/` and is already used for booking confirmation emails. However, it is not connected to the intent scoring pipeline (RC-11). This story wires the intent threshold crossing (`low → medium`, i.e. score crossing 31) to a SendGrid triggered email. The email should reference the user's `primaryPlanningDestination` and include a direct search link. It should only fire once per threshold crossing, not on every score update.

## Acceptance criteria
- Given an authenticated user's intent score crosses 31 (`low → medium`) for the first time in 7 days, when the threshold is detected, then a SendGrid email is triggered to the user's registered email address.
- Given the email is triggered, when it arrives in the inbox, then it references the user's `primaryPlanningDestination` (e.g. "You were looking at Barcelona") and contains a direct link to pre-filled search results.
- Given the threshold was crossed and an email was already sent within the last 7 days for the same destination, when the score crosses 31 again, then no duplicate email is sent (per-destination, per-7-day dedup).
- Given a user completes a booking, when `booking_completed` fires, then no further re-engagement email is sent for the booked destination during the cool-down period (linked to US-0603).
- Given `SENDGRID_API_KEY` is not configured, when the threshold is crossed, then the email trigger fails gracefully (logs a warning, does not crash the intent scoring pipeline).
- Given the email trigger fails (SendGrid API error), when the error occurs, then the intent scoring pipeline continues normally and the failure is logged.

## Priority
Should — highest-reach re-engagement channel (reaches users who have left the platform), but requires validated intent scores (Phase 1+2 complete) before enabling. Phase 3 investment.

## Dependencies
- EP-03 US-0301 (double tracking fix) and US-0302 (intent score) must be live and validated before this email fires on real user data.
- EP-08 US-0803 (tier accuracy logging) should show > 30 days of data confirming `medium` tier correlates with actual purchase intent before enabling production email send.
- EP-06 US-0603 (post-booking suppression) must be live so booking completions do not re-trigger the email.
- `SENDGRID_API_KEY` must be configured in production `.env`.
