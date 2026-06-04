---
id: FN-010301
title: Add cabin to trackFlightView metadata
story: US-0103
owner: TBD
status: Draft
---

# FN-010301 — Add cabin to trackFlightView metadata

## Purpose
Extend the `trackFlightView` call in `PersonalizationContext.js:98–107` to pass the `cabin` field in the metadata payload so that the preference engine can build a meaningful `preferredCabin` value instead of always defaulting to `"economy"`.

## Behaviour
- **Input:** flight result object (containing `cabin` field, e.g. `"economy"`, `"business"`, `"premiumEconomy"`) passed to the click handler on the flight card component
- **Process:** Extract `cabin` from the flight object; include it in the `metadata` argument of `trackFlightView({ ..., cabin })`; if `cabin` is undefined or null, default to `"economy"` before passing
- **Output:** `UserActivity` record of type `flight_view` with `metadata.cabin` set to the cabin string
- **Errors / edge cases:** Flight objects with no `cabin` field (legacy data) — default to `"economy"`; unauthenticated users — tracking call is a no-op (existing auth guard handles this)

## Serves
- Acceptance criteria: US-0103 AC-1 (view event includes cabin), AC-2 (preferredCabin reflects actual views), AC-3 (absent cabin defaults to economy)
- Depends on: EP-02 US-0202 (cabin preference aggregation reads `metadata.cabin` to build `preferredCabin`)

## Build notes (for the agent)
- File to modify: `frontend/src/context/PersonalizationContext.js` around line 98–107
- The `trackFlightView` function signature likely accepts a flight object or individual params — add `cabin: flight.cabin || 'economy'` to the metadata spread
- The backend `UserActivity` model already has a flexible `metadata: Object` field — no schema change required
- Verify the fix by checking that `UserActivity.findOne({ user: userId, eventType: 'flight_view' }).metadata.cabin` returns the correct value after a view event
