---
id: EP-05
title: Dynamic Homepage
parent_objective: Give returning users a frictionless path to continue their booking journey on re-visit
owner: TBD
reviewer: TBD
status: Draft
---

# EP-05 — Dynamic Homepage

## Capability
The homepage adapts to user state: returning authenticated planners see a "Continue Planning" card surfacing their active destination and a personalised recommendation carousel; new or anonymous users see a contextually appropriate entry point rather than hardcoded popular destinations.

## Why (links up)
- Objective: Reduce the time-to-relevant-content for returning users so they can resume planning without re-entering search parameters.
- Business case: "Continue planning" card is rated Medium–High conversion contribution (see business-case.md §2.1).
- Root causes addressed: RC-10 (recommendations use history not current intent), RC-12 (cold-start hardcodes Mumbai/Dubai/Goa).

## Stories in this epic
- US-0501 — Show "Continue Planning" card for active returning planners — Draft
- US-0502 — Show intent-ranked recommendation carousel — Draft
- US-0503 — Handle empty/anonymous state for new users — Draft

## Scope
**In:** "Continue Planning" card (destination, last-searched dates/params, CTA back to search); intent-ranked recommendation carousel (flights + hotels); empty state for new or unauthenticated users
**Out:** full anonymous personalisation (RC-1); PWA offline support; i18n / multi-currency

## Open questions / dependencies
- US-0501 depends on RC-3 fix (US-0105 in EP-01) so that `return_visit` events are correctly detected and `primaryPlanningDestination` is populated before the card renders.
- US-0502 depends on EP-04 recommendation engine being live.
- The "Continue Planning" card reconstructs the search query from stored `metadata`; incomplete metadata from RC-9 can cause incorrect pre-fill — US-0304 (EP-03) must land first.
