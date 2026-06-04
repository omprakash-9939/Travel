---
id: FN-060101
title: Gate price_drop notification behind ENABLE_PRICE_DROP_NOTIFICATIONS feature flag
story: US-0601
owner: TBD
status: Draft
---

# FN-060101 — Feature flag for price_drop notification

## Purpose
Add an `ENABLE_PRICE_DROP_NOTIFICATIONS` environment variable check to `buildNotifications()` in `recommendationEngine.js` so that the fabricated price-drop notification can be disabled immediately without a code deploy, removing legal and trust exposure.

## Behaviour
- **Input:** `ENABLE_PRICE_DROP_NOTIFICATIONS` environment variable (string `"true"` / `"false"` / absent); existing `buildNotifications(userId, intent, prefs)` function call
- **Process:**
  1. At the top of the `price_drop` block in `buildNotifications()`, check `process.env.ENABLE_PRICE_DROP_NOTIFICATIONS === 'true'`
  2. If the flag is not `'true'`, skip the `price_drop` notification block entirely and continue to the next notification type
  3. If the flag IS `'true'`, the existing `price_drop` logic runs as before (backward compatible — no change to the logic itself)
- **Output:** When flag is false/absent: no `price_drop` notification generated; other notifications (`return_reminder`, `selling_fast`) unaffected. When flag is true: existing behaviour preserved.
- **Errors / edge cases:** Flag absent from environment — treat as `false` (safe default; notification is off); flag set to any value other than `"true"` — treat as `false`

## Serves
- Acceptance criteria: US-0601 AC-1 (no price_drop when flag is false), AC-2 (bell shows no price_drop), AC-3 (other notifications unaffected), AC-4 (flag true preserves backward compat)

## Build notes (for the agent)
- File to modify: `backend/services/personalization/recommendationEngine.js` around line 200–210
- The random percentage generation (`const pct = 5 + Math.floor(Math.random() * 8)`) should be kept inside the flag gate — do not delete it yet, only gate it
- Add `ENABLE_PRICE_DROP_NOTIFICATIONS=false` to `backend/.env.example` with a comment: `# Set to true only when connected to real Amadeus price-change feed`
- This change takes < 1 hour to implement and review; it should ship as the first PR in EP-06
