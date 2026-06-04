---
id: FN-060401
title: Trigger SendGrid re-engagement email on low-to-medium intent threshold crossing
story: US-0604
owner: TBD
status: Draft
---

# FN-060401 — SendGrid email trigger on intent threshold crossing

## Purpose
Connect the existing `sendgrid.js` integration to the intent scoring pipeline so that an out-of-app re-engagement email is sent when a user's score crosses the `low → medium` threshold (score ≥ 31) for the first time within a 7-day window, referencing their `primaryPlanningDestination`.

## Behaviour
- **Input:** `userId`, `newScore`, `previousTier`, `currentTier`, `intent.primaryPlanningDestination`, `user.email`
- **Process:**
  1. After every score update in `activityTracker.js`, check if `previousTier === 'low'` and `currentTier === 'medium'` (threshold just crossed)
  2. Query `EmailSentLog` (or a new `emailSentLog[]` array on `UserIntentScore`) to check if a re-engagement email was sent for this destination within the last 7 days
  3. If no recent email: call `sendReEngagementEmail(user.email, { destination: intent.primaryPlanningDestination, searchLink: buildSearchLink(destination) })` via `sendgrid.js`
  4. Record the send in `emailSentLog` with `{ destination, sentAt: now, type: 'reengagement' }`
  5. If `SENDGRID_API_KEY` is not configured, log a `WARN` and skip without throwing
- **Output:** SendGrid email triggered to user; `emailSentLog` entry created; no email sent if dedup window active or API key absent
- **Errors / edge cases:** SendGrid API error — log at `ERROR` level, add a retry entry (do not throw — intent scoring must continue); `primaryPlanningDestination` null — skip email (no destination to reference); user email absent — skip with `WARN` log; `bookingCooldowns[]` active for the destination — skip (user already booked)

## Serves
- Acceptance criteria: US-0604 AC-1 (email triggered on threshold crossing), AC-2 (email references destination and links), AC-3 (7-day dedup per destination), AC-4 (no email after booking cool-down), AC-5 (graceful no-op when API key absent), AC-6 (pipeline continues on SendGrid error)

## Build notes (for the agent)
- Files to modify: `backend/services/personalization/activityTracker.js` (add threshold-crossing check and call), `backend/services/integrations/sendgrid.js` (add `sendReEngagementEmail` function)
- The `sendgrid.js` file already has a booking confirmation template — model the new function similarly with a different template ID / dynamic template data
- Add `SENDGRID_REENGAGEMENT_TEMPLATE_ID` to `.env.example`; if absent, log a warning and use a plaintext fallback or skip
- The `emailSentLog` dedup can be a simple array on `UserIntentScore` with a TTL-based purge, or a separate `EmailLog` model — prefer the simpler array approach for POC
- Gate this entire feature behind `ENABLE_REENGAGEMENT_EMAILS=false` in `.env.example` (analogous to the price_drop flag) — only enable after EP-08 US-0803 validates tier accuracy
