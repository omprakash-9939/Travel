# ADR-0003 — Intent-first recommendation ordering

**Date:** 2026-06-04
**Status:** Accepted
**Deciders:** Architecture team
**Stories:** EP-04 US-0401 (RC-10), EP-05 US-0502, EP-07 US-0701

---

## Context

`buildRecommendations()` currently queries flights and hotels using `prefs.favoriteDestinations` (90-day history). A user actively planning Barcelona this week but historically dominant in Mumbai sees Mumbai results. This is root cause RC-10 — the most impactful correctness bug in the recommendation engine.

The question is: what is the priority ordering of signals for selecting recommendation destinations?

**Options considered:**

| Option | Description |
|--------|-------------|
| A | Intent-first: use `intent.primaryPlanningDestination` when set, fall back to `prefs.favoriteDestinations`, then cold-start |
| B | Blended: compute a weighted composite of intent signal + historical preference (e.g. 60% intent, 40% history) |
| C | History-only: keep current behaviour; use session context only as a tiebreaker in ranking |

---

## Decision

**Option A — intent-first with explicit fallback chain.**

```
Step 1: intent.primaryPlanningDestination set?
    YES → use as the primary destination for flight/hotel query
    NO  → Step 2

Step 2: prefs.favoriteDestinations has entries?
    YES → use top 3 destinations
    NO  → Step 3

Step 3: cold-start fallback list (configurable per market, EP-02 US-0203)
```

The existing 5-factor composite ranking (pref 40% + popularity 20% + rating 15% + budget 15% + trend 10%) is applied within the results returned for the chosen destination(s).

---

## Rationale

- **RC-10 is a clear product failure.** Showing Mumbai results to a user who has been searching Barcelona twice this week is demonstrably wrong. A blended model (Option B) still risks history dominating for users with long history.
- **Active intent is a stronger recency signal.** `primaryPlanningDestination` is derived from the most recent `flight_search`, `hotel_search`, or `booking_started` event. It represents what the user is planning *right now*, not what they wanted 60 days ago.
- **The fallback chain is safe.** A user with no active intent still gets sensible results from their history. A brand-new user gets the cold-start list rather than an empty page.
- **Option B (blended)** is technically superior long-term but requires calibrated weights, more test data, and is harder to explain to stakeholders ("why am I seeing Mumbai?"). Option A is transparent and debuggable.

---

## Consequences

**Positive:**
- Barcelona user sees Barcelona results. The primary product failure (RC-10) is resolved.
- The fallback chain is easy to explain to support and product teams.
- Cold-start is now a proper design concern, not a hardcoded `['Mumbai', 'Dubai', 'Goa']` list.

**Negative / Trade-offs:**
- A user who last searched a destination days ago but has since changed plans will continue to see that destination until `primaryPlanningDestination` is updated by a new search or resets after booking.
- The `primaryPlanningDestination` is only as correct as the metadata extraction fix (RC-9 / US-0304). This ADR depends on RC-9 being resolved first.
- No blending means a power user with a very strong historical preference for a destination cannot influence results beyond the fallback position.

**Dependencies:**
- EP-03 US-0304 (fix origin-as-destination) must land before this change, or `primaryPlanningDestination` will be set to origin IATA codes.
- EP-02 US-0203 (configurable cold-start) should land alongside to avoid hardcoded fallback values.
