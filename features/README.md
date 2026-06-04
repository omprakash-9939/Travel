# BDD Feature Files — DataArt Travel Personalization

**Project:** DataArt Travel — AI Personalization Engine  
**Status:** Draft — awaiting team verification  
**Generated:** 2026-06-04  
**Next step:** Verify these stories against the requirements and wireframes, then run `/bdd-to-tdd` per feature.

---

## Feature index

| Feature file | Epic | Stories covered | Scenarios | Priority | Phase |
|---|---|---|---|---|---|
| [activity-tracking.feature](activity-tracking.feature) | EP-01 | US-0101 to US-0106 | 20 | Must / Should | 1 |
| [intent-scoring.feature](intent-scoring.feature) | EP-03 | US-0301 to US-0304 | 18 | Must | 1 |
| [recommendation-engine.feature](recommendation-engine.feature) | EP-04 | US-0401 to US-0403 | 14 | Must / Should | 2–3 |
| [homepage-personalization.feature](homepage-personalization.feature) | EP-05 | US-0501 to US-0503 | 14 | Must / Should | 2–3 |
| [notification-engine.feature](notification-engine.feature) | EP-06 | US-0601 to US-0604 | 21 | Must / Should | 1–3 |
| [engagement-scoring.feature](engagement-scoring.feature) | EP-09 | US-0901, US-0903 | 7 | Should | 2 |
| [preference-signals.feature](preference-signals.feature) | EP-09 | US-0902 | 7 | Should | 2 |
| [notification-scenarios.feature](notification-scenarios.feature) | EP-09 | US-0904, US-0905 | 11 | Should | 2 |

**Total scenarios: ~112** (EP-09 added in Phase 2 — two-axis model, ADR-0008)

---

## Traceability table

| Story | Title | Feature file | Scenarios | Wireframe | Root cause | Status |
|---|---|---|---|---|---|---|
| US-0101 | Track flight search | activity-tracking.feature | 4 | n/a (backend) | RC-9 fix dependency | Draft |
| US-0102 | Track hotel search | activity-tracking.feature | 4 | n/a (backend) | — | Draft |
| US-0103 | Track flight view with cabin | activity-tracking.feature | 4 | n/a (frontend event) | RC-8 | Draft |
| US-0104 | Fix booking double-tracking | activity-tracking.feature | 5 | n/a (plumbing fix) | RC-4 | Draft |
| US-0105 | Cross-session return visit | activity-tracking.feature | 5 | n/a (backend) | RC-3 | Draft |
| US-0106 | Track wishlist events | activity-tracking.feature | 5 | n/a (frontend event) | — | Draft |
| US-0301 | Fix double event tracking | intent-scoring.feature | 4 | n/a (code fix) | RC-4 | Draft |
| US-0302 | Calculate intent score | intent-scoring.feature | 5 | n/a (backend) | — | Draft |
| US-0303 | Intent score reset after booking | intent-scoring.feature | 5 | n/a (backend) | RC-5 | Draft |
| US-0304 | Fix origin-as-destination | intent-scoring.feature | 4 | n/a (backend) | RC-9 | Draft |
| US-0401 | Recommendations from active intent | recommendation-engine.feature | 5 | n/a (backend) | RC-10 | Draft |
| US-0402 | Recommendations from preference history | recommendation-engine.feature | 4 | n/a (backend) | — | Draft |
| US-0403 | Decouple notification from batch | recommendation-engine.feature | 5 | n/a (backend arch) | RC-2 | Draft |
| US-0501 | Continue Planning card | homepage-personalization.feature | 5 | Homepage above-fold | RC-3, RC-9 | Draft |
| US-0502 | Intent-ranked carousel | homepage-personalization.feature | 5 | Homepage carousel | RC-10 | Draft |
| US-0503 | Empty / anonymous state | homepage-personalization.feature | 5 | Homepage anon state | RC-12 | Draft |
| US-0601 | Disable fabricated price-drop | notification-engine.feature | 5 | n/a (notification bell) | RC-6 | Draft |
| US-0602 | Return reminder near-real-time | notification-engine.feature | 5 | Notification bell | RC-2 | Draft |
| US-0603 | Suppress notifications after booking | notification-engine.feature | 5 | n/a (suppression) | RC-5 | Draft |
| US-0604 | SendGrid email re-engagement | notification-engine.feature | 6 | n/a (triggered email) | RC-11 | Draft |

---

## Tag taxonomy

| Tag | Meaning |
|---|---|
| `@EP-0x` | Source epic |
| `@US-0xxx` | Source user story |
| `@must` / `@should` / `@could` | MoSCoW priority |
| `@rc-N` | Root cause addressed |
| `@auth-guard` | Scenario verifies unauthenticated users are excluded |
| `@dedup` | Scenario verifies deduplication logic |
| `@error-handling` / `@error-state` | Scenario verifies graceful degradation |
| `@cold-start` | Scenario uses the configurable cold-start fallback |
| `@cache` / `@cache-hit` / `@cache-invalidation` | RecommendationCache scenarios |
| `@feature-flag` | Scenario verifies a feature-flag gate |
| `@tier-transition` | Scenario verifies an intent tier change |

---

## Gaps and assumptions flagged

| Gap / Assumption | Affected story | Action required |
|---|---|---|
| Tier thresholds (≥31 medium, ≥71 high) are unvalidated engineering estimates (A-2) | US-0302 | Validate via EP-08 US-0803 after 30 days of data before treating as requirements |
| Intent event weights (`flight_search=5`, `booking_completed=50`, etc.) are hypotheses (A-7) | US-0302 | Document as configurable; calibrate after Phase 1 data |
| Recommendation cache TTL (6 hours) unvalidated — may be too long or too short (A-5) | US-0402 | Review after EP-08 cache hit/miss data |
| No wireframe exists for homepage screens | US-0501, US-0502, US-0503 | Generate HTML mockup via `design-system` skill and verify before running `bdd-to-tdd` |
| SendGrid email content (subject line, body copy) not specified in story | US-0604 | Product/copy review needed before `bdd-to-tdd` scaffolds content assertions |
| `selling_fast` notification type referenced in US-0603 — not covered by any feature file | US-0603 | Confirm whether `selling_fast` is in scope; it may require its own story and feature |

---

## Verification gate

**These are the BDD stories. Please verify them against the requirements brief and wireframe before tests are written.**

Once the team has reviewed and agreed on the scenarios:

1. Mark each story's `status` as **Verified** in the requirements story files.
2. Say the word and run `/bdd-to-tdd` per feature file to scaffold failing-first tests, starting with:
   - `activity-tracking.feature` (Phase 1 — unblocks all downstream work)
   - `intent-scoring.feature` (Phase 1 — all personalization depends on correct scores)
   - `notification-engine.feature` (Phase 1 — US-0601 removes legal exposure immediately)
