# Business Case: Personalization for Booking Conversion

**Input:** `problem-statement.md`, `root-cause.md`, `stakeholders.md`  
**Date:** 2026-06-04  
**Status:** Discovery — pre-investment decision  
**Scope:** DataArt Travel MERN stack — intent-based personalization engine

---

## How to read this document

This document evaluates whether and how much to invest in the personalization system. It is structured in order of decision urgency:

1. What benefits are realistically possible (and which are currently blocked by bugs)
2. What it costs to realise them
3. Whether the return justifies the investment
4. Which individual features are worth building, ordered by value

All ROI estimates use industry benchmarks, not measured data, because this platform is a POC with no production traffic. Every projection is explicitly labelled as a benchmark or estimate. The correct response to this document is to establish a measurement baseline, not to treat these projections as facts.

---

## 1. Executive Summary

The personalization system has been built. Four of the twelve identified root causes are bugs that corrupt the system's own data, and one creates active legal exposure. These five issues must be fixed before the system can be evaluated — not because of quality standards, but because they make accurate measurement impossible.

**Once bugs are fixed**, the expected value of the personalization investment depends on traffic scale and measurement:

| Scenario | Monthly searchers | Conversion lift | Est. monthly booking revenue lift |
|---|---|---|---|
| Conservative | 500 | +8% | ₹8,000 – ₹24,000 |
| Base case | 2,000 | +12% | ₹48,000 – ₹144,000 |
| Optimistic | 5,000 | +18% | ₹180,000 – ₹540,000 |

Assumptions: average booking value ₹20,000–₹60,000; conversion rate rises from 2% baseline to 2.16%–2.36%. See Section 4 for methodology.

**The investment case is not strong at POC scale. It becomes strong once:**
- The bug fixes are in (cost: ~3–5 developer days)
- A baseline measurement is established (cost: ~3–5 developer days for A/B infrastructure)
- Traffic exceeds ~1,000 monthly active searchers

---

## 2. Benefit Analysis

### 2.1 Increased Booking Conversion

**What "increased booking conversion" means here:** A user who searches but does not immediately book subsequently completes a booking that they would not have made without a personalised intervention.

**Current state (buggy):**

The system cannot currently increase conversion reliably because:
- RC-4: Every booking event is counted twice → intent tiers are inflated → users are pushed to `high` tier prematurely → aggressive notifications reach low-intent users
- RC-3: `return_visit` (the core Barcelona signal) rarely fires → the system cannot identify the primary target user group
- RC-6: `price_drop` notifications contain fabricated price data → trust erosion on first meaningful touch

These three bugs mean the system may produce a *negative* effect on conversion before they are fixed: notifications go to the wrong users at the wrong time with wrong information.

**Post-fix potential:**

The Barcelona scenario (user returns to search same destination within 7 days) is a well-validated conversion signal in travel retail. Timely, relevant nudges to this group have reported lift ranges of 10–25% in comparable platforms.

The `return_reminder` notification, once RC-3 and RC-2 are fixed, targets the highest-intent subset (authenticated users with a repeat search within 7 days). This is the right intervention for the right user.

**Industry benchmark reference:**

| Platform type | Intervention | Reported lift |
|---|---|---|
| B2C travel (OTA) | Return visitor re-engagement email | +12–20% conversion |
| B2C travel (OTA) | "Continue your search" card | +8–15% |
| E-commerce (broad) | Personalised push notification | +5–12% |
| E-commerce (broad) | Abandoned cart reminder | +15–25% |

Source: McKinsey Travel Personalization Report 2023, Salesforce State of Commerce 2024. These are comparators, not predictions.

**Expected contribution of each feature to conversion lift (post-fix):**

| Feature | Mechanism | Expected lift contribution |
|---|---|---|
| Return reminder notification (RC-3 fixed) | Re-engages repeat searchers at the right moment | High (core Barcelona scenario) |
| Continue planning card on homepage | Surface active search on return visit | Medium–High |
| Out-of-app re-engagement email (RC-11) | Reaches users who do not return to app | High, but requires infrastructure |
| Score reset on booking completion (RC-5) | Reduces post-booking noise; preserves trust | Indirect (prevents negative effect) |
| Intent-based recommendations (RC-10 fixed) | Shows relevant content on homepage | Medium |

---

### 2.2 Increased Repeat Visits

**Current blocker:** There is no mechanism to pull users back to the platform once they leave. The notification bell is in-app only. SendGrid and Twilio exist in the codebase but are not connected to intent scoring (`RC-11`).

**Value at stake:** A user who does not return does not convert. The repeat visit is a prerequisite for the Barcelona scenario.

**What would improve this:**

- **Out-of-app email trigger (RC-11 fix):** When a user's intent score crosses the `medium` threshold (score ≥ 31), send a triggered email via SendGrid. This is the single highest-leverage change for repeat visit rate, because it reaches users who are not already back on the platform.
- **Correct `return_visit` detection (RC-3 fix):** Makes the cross-session return signal actually fire, incrementing the intent score when it should.

**Industry benchmark:**

Travel platforms report that triggered re-engagement emails (sent within 24 hours of a qualifying search) achieve 20–35% open rates and 3–8% CTR back to the platform, compared to 15–25% and 2–4% for generic campaigns.

---

### 2.3 Increased Booking Completion

**Distinct from conversion:** This is about users who reach checkout but do not confirm payment.

**Current blockers (from root cause analysis):**

- Auth wall mid-checkout: if an unauthenticated user starts checkout and then logs in, the checkout state is lost for Wallet and Razorpay paths. Only the Stripe path saves `pendingCheckout` in `sessionStorage`.
- This is not a personalization problem — it is a UX/auth flow problem. Personalization cannot fix it; the checkout flow must be fixed independently.

**What personalization can contribute:**

Personalization does not directly address checkout-to-completion drop-off. Its value is in improving search-to-checkout. Once a user is in checkout, the booking flow is what determines completion.

However, two indirect contributions exist:

1. **Post-booking score reset (RC-5):** Users who complete a booking will no longer receive "Still thinking about Barcelona?" notifications. This protects trust and reduces support load, which in turn does not actively harm future bookings.
2. **Notification timing (RC-2):** If a user receives a `return_reminder` while actively on the platform and clicks through, the shorter path from notification to checkout reduces the friction window.

---

### 2.4 Increased Engagement

**Metrics that reflect engagement:** Time on site, pages per session, wishlist additions, "continue planning" card clicks, recommendation clicks.

**Current state:** There is no click tracking on recommendations or "continue planning" cards. There is no measurement of whether users click through or dismiss notifications. This means engagement cannot be measured, only assumed.

**What would improve measurable engagement:**

- Frontend click tracking on recommendation cards (`data-testid` + analytics event on CTA click)
- Notification CTA click tracking (distinguish click → navigate from dismiss)
- Wishlist add/remove (already tracked as `wishlist_added` events)

**Value of engagement improvement:** Engagement metrics are leading indicators of conversion, not revenue directly. Higher engagement → higher probability of eventual conversion. The value is in the measurement signal they provide, not in direct revenue contribution.

---

## 3. Cost Estimation

### 3.1 Implementation Cost

Costs are expressed in developer-days (senior full-stack, MERN). One developer-day = 6–7 hours of focused implementation including code review and testing.

#### Phase 1 — Bug Fixes (prerequisite to any value realisation)

These are not enhancements. They are corrections to existing incorrect behaviour. Without them, all measurement of the personalization system is invalid.

| Fix | Root Cause | Effort |
|---|---|---|
| Remove double event tracking (remove from one layer) | RC-4 | 0.5 days |
| Add score reset / cool-down on `booking_completed` | RC-5 | 0.5 days |
| Disable `price_drop` notification (or gate on feature flag) | RC-6 | 0.25 days |
| Fix `return_visit` detection (remove sessionId match requirement) | RC-3 | 1 day |
| Fix origin-as-destination in `metadata` extraction | RC-9 | 0.25 days |
| Add cabin to `trackFlightView` metadata | RC-8 | 0.5 days |
| **Phase 1 total** | | **~3 days** |

These fixes cost approximately ₹15,000–₹30,000 at typical POC developer rates. They have no negative risk and remove the legal exposure from RC-6.

#### Phase 2 — Measurement Infrastructure (prerequisite to knowing if anything works)

Before any further investment, a measurement baseline is required. Without it, there is no way to distinguish personalization lift from noise.

| Work | Effort |
|---|---|
| A/B test framework: control group receives no personalization | 3–5 days |
| Notification CTR tracking (click → navigate event) | 1 day |
| Recommendation click-through tracking | 1 day |
| Intent tier accuracy logging (high-tier user → booked within 7 days?) | 1–2 days |
| **Phase 2 total** | **~6–9 days** |

#### Phase 3 — High-Value Enhancements

These require Phase 1 and Phase 2 to be complete first.

| Enhancement | Root Cause Addressed | Effort |
|---|---|---|
| Decouple notification generation from batch job (near-real-time) | RC-2 | 5–8 days |
| Add current intent to recommendation ranking | RC-10 | 3–5 days |
| SendGrid email trigger on intent threshold crossing | RC-11 | 5–8 days |
| Cold-start preference capture (onboarding or geo-IP) | RC-12 | 5–8 days |
| **Phase 3 total** | | **~18–29 days** |

#### Phase 4 — Lower Priority / High Complexity

| Enhancement | Root Cause Addressed | Effort |
|---|---|---|
| Anonymous tracking (pre-authentication event capture) | RC-1 | 15–20 days (includes GDPR compliance, consent UI, DB schema changes) |
| Admin/support tooling (intent score viewer, notification suppression) | S3 need | 10–15 days |
| Recency decay in preference scoring | RC-7 | 3–5 days (but requires calibration data from Phase 2 first) |
| **Phase 4 total** | | **~28–40 days** |

---

### 3.2 Operational Cost

| Cost Item | Current | At 10,000 MAU | At 100,000 MAU |
|---|---|---|---|
| MongoDB: UserActivity (90-day TTL) | Negligible (POC) | ~5–10 GB storage | ~50–100 GB storage |
| Aggregation job: 2-hour cycle, batch of 50 | Single-instance, acceptable | Still acceptable | Requires worker queue; ~5–10 min per cycle at risk |
| RecommendationCache writes (6-hour TTL) | Negligible | ~4 writes/user/day | I/O risk; needs cache tier review |
| SendGrid email (Phase 3) | $0 | ~$10–20/month | ~$100–200/month |
| Twilio SMS (Phase 3, optional) | $0 | ~$50–100/month | ~$500–1,000/month |

**Operational risk at scale:** The `preferenceEngine.js` queries 90 days of `UserActivity` per user per aggregation cycle. At 10,000 MAU, with the existing batch size of 50, this produces ~200 batch iterations per cycle, each issuing 2 large MongoDB queries. At 100,000 MAU this becomes a significant I/O load. This is not a current problem but must be planned for before production scale.

---

### 3.3 Maintenance Effort

| Component | Ongoing maintenance |
|---|---|
| Intent scoring weights | One-time calibration after 30 days of measured data; then quarterly review |
| Aggregation job | Monitor job completion time; alert if cycle exceeds 90 minutes |
| Notification dedup (48h window) | Passive; no routine maintenance |
| A/B test control groups | Review and rotate every 4–6 weeks during active experiment phase |
| Recommendation cache TTL (6 hours) | Review after measuring cache hit/miss ratio from Phase 2 |
| SendGrid integration | Low; mostly configuration |

Total estimated maintenance: ~0.5 developer-days per month in steady state, rising to ~2 days per month during active calibration phases.

---

## 4. Expected ROI

### 4.1 Methodology

Because there is no production traffic and no baseline conversion data, this section constructs a ROI model from:

1. An assumed baseline conversion rate (2% — industry median for B2C travel OTAs)
2. Industry-reported lift from comparable personalization interventions
3. An assumed average booking value (₹20,000–₹60,000 for Indian domestic/international travel)
4. The implementation cost from Section 3

All of these are assumptions that must be replaced with measured values once Phase 2 is complete. The model is a decision tool, not a forecast.

### 4.2 Conversion Lift Model

| Phase | Intervention | Realistic lift over baseline | Reasoning |
|---|---|---|---|
| 1 (bug fixes only) | Remove fabricated price_drop, fix return_visit | 0% direct lift; prevents negative effect | Bug fixes restore data integrity; they do not add features |
| 2 (measurement baseline) | A/B test established | 0% direct lift; enables measurement | |
| 3 (enhancements) | Near-real-time return_reminder + continue planning | +8–15% on repeat searchers | Industry median for return visitor re-engagement |
| 3 (email re-engagement) | SendGrid triggered email for departed medium/high intent users | +5–12% on the re-engaged cohort | Email campaign recovery rate benchmarks |
| 3+4 (full stack) | Intent-ranked recs + cold-start + recency decay | Additional +3–8% over Phase 3 | Incremental improvement on already-personalised base |

### 4.3 Three-Scenario ROI Table

Assumptions:
- 12-month horizon
- Phase 1+2 complete in month 1 (cost: ~9–12 developer days)
- Phase 3 complete in month 2–3 (cost: ~18–29 developer days)
- Average booking value: ₹35,000 (mid-range)
- Baseline conversion rate: 2% of unique searchers
- Personalized group is repeat searchers (who represent 15–25% of all searchers in travel)

| Scenario | Monthly searchers | Monthly bookings (baseline) | Incremental bookings/month (post-Phase 3) | Incremental revenue/month | Phase 1+2+3 cost | Payback period |
|---|---|---|---|---|---|---|
| Conservative | 500 | 10 | ~1–2 | ₹35,000–70,000 | ₹180,000–₹300,000 | 3–8 months |
| Base case | 2,000 | 40 | ~5–8 | ₹175,000–₹280,000 | ₹180,000–₹300,000 | 1–2 months |
| Optimistic | 5,000 | 100 | ~12–20 | ₹420,000–₹700,000 | ₹180,000–₹300,000 | < 1 month |

**Key finding:** At POC scale (< 500 monthly searchers), the personalization investment pays back slowly. At production scale (2,000+ monthly searchers), the payback period is 1–2 months for Phase 1–3.

**The bug fixes (Phase 1) have near-infinite ROI** — they cost 3 developer-days and remove the risk of measurable negative effects on conversion from RC-6 (fabricated price data destroying trust). They should be treated as non-optional regardless of the traffic level.

---

## 5. Feature Value Classification

Each feature is evaluated on three axes:
- **Impact:** Does it directly increase a measurable metric (conversion, repeat visit, engagement)?
- **Readiness:** Can it deliver value in its current state, or does it require a prerequisite fix?
- **Risk:** Does it carry legal, trust, or operational risk?

### High Value

These features have clear, direct impact on a measurable business metric and are worth immediate investment.

| Feature | Why High Value | Prerequisite |
|---|---|---|
| **Fix RC-4: Remove double event tracking** | Restores data integrity; all tier decisions are currently wrong by 2×; without this, no other feature can be trusted | None — this is a fix, not a feature |
| **Fix RC-5: Score reset on `booking_completed`** | Stops converted users from receiving "You haven't booked yet" notifications; protects brand trust; prevents P2's most predictable complaint | RC-4 fix (otherwise double-tracked events mask the signal) |
| **Fix RC-6: Disable `price_drop` notification** | Eliminates legal risk from fabricated price data; removes the single most trust-damaging touchpoint in the system | None — disable with a feature flag immediately |
| **Fix RC-3: Correct `return_visit` detection** | Restores the core Barcelona signal — the reason the system was built; without this, `return_visit` events (15 pts) almost never fire, and the intent model is blind to its primary target user | RC-4 fix first (to avoid double-counting the now-correct events) |
| **Return reminder notification (correctly triggered)** | Highest-intent users (authenticated repeat searchers) receiving a timely nudge is the primary conversion mechanism; estimated 10–20% conversion lift on this cohort | RC-3, RC-4, RC-5 fixes |
| **Continue planning card on homepage** | Surfaces the active search for return visitors; low friction, high relevance signal; already built | RC-3, RC-9 fixes (to ensure primaryPlanningDestination is correct) |
| **A/B measurement baseline** | Without this, it is impossible to claim personalization increases conversion; investment without measurement is not justifiable beyond Phase 1 | Phase 1 bug fixes |

---

### Medium Value

These features add meaningful improvement but are not prerequisites for value delivery, or they require more investment for the return they provide.

| Feature | Why Medium Value | Limiting Factor |
|---|---|---|
| **Near-real-time notification trigger (RC-2 fix)** | Reduces the Barcelona scenario lag from up to 2 hours to within the same session; captures peak-intent window | Significant architecture change (decouple notifications from batch job); medium engineering effort |
| **Intent-ranked recommendations (RC-10 fix)** | Uses `primaryPlanningDestination` from current intent instead of 90-day history for recommendation queries; improves homepage relevance for active planners | Requires RC-9 fix first; medium effort |
| **Fix RC-9: Origin-as-destination correction** | Prevents "Still thinking about Delhi?" for a user searching Delhi → Barcelona; fixes `primaryPlanningDestination` accuracy | Low effort; should be in Phase 1 but impact is bounded to users with incomplete metadata |
| **Fix RC-8: Cabin preference tracking** | Adds cabin to `trackFlightView`; enables premium/economy segmentation in recommendations; currently defaults to economy for all users | Low effort; medium impact on recommendation quality |
| **Out-of-app email re-engagement (RC-11 partial)** | Triggered email when intent score crosses `medium` threshold; reaches the highest-value users who have left the platform; estimated 5–12% recovery rate | SendGrid integration work; requires validated intent scores (Phase 1 + 2 complete) |
| **Wishlist feature (existing)** | `wishlist_added` events contribute to intent scoring (+5 pts) and preference aggregation; already built; provides a natural "save for later" mechanism | Already exists; value depends on whether users discover and use it |
| **Selling fast / new deal notifications** | Creates urgency signals without fabricated data (if connected to real availability); moderate conversion contribution | Requires real inventory data (Amadeus API); medium value without it; high value with it |

---

### Low Value

These features have either low direct impact on conversion, high complexity relative to their contribution, or require infrastructure that is disproportionate for the current scale.

| Feature | Why Low Value | Revisit condition |
|---|---|---|
| **Anonymous tracking (RC-1)** | Potentially high reach (Group C), but requires GDPR consent infrastructure, session stitching on login, 15–20 developer days, and legal review; the highest-converting users are already authenticated | Revisit when platform has >10,000 MAU and a data/privacy team |
| **Recency decay in preference scoring (RC-7)** | Flat scoring is an approximation; adding exponential decay improves precision but requires calibration data (30+ days of conversion signals) to set the half-life; wrong decay parameter can be worse than no decay | Revisit after 60 days of measured conversion data |
| **Cold-start strategy beyond fallback fix (RC-12)** | Fixing the hardcoded fallback (Mumbai/Dubai/Goa) is low-effort and worth doing; a full cold-start solution (onboarding survey, geo-IP inference) has medium effort for modest impact at POC scale | Revisit when new-user volume is significant enough to measure |
| **Admin / support tooling** | High value for operational maturity (S3 stakeholder); does not directly increase booking conversion; escalation rate to engineering from personalisation complaints is currently zero (no production users) | Schedule for first production release; not before |
| **`price_drop` with real price data** | High value if connected to real Amadeus price-change monitoring; currently low value because the infrastructure (real-time price feed, delta computation, alert queue) is disproportionate for a POC | Revisit when Amadeus integration is enabled and price data is reliable |
| **Notification reason logging (S3 request)** | "Triggered by: 2 hotel_search events for Barcelona, score 45" stored per notification; good for support explainability; no conversion impact | Include in admin tooling work; not standalone priority |

---

## 6. Investment Roadmap

Based on the value classification, the following phased approach minimises risk and front-loads the highest-ROI work.

### Phase 1 — Remove Risk (Week 1, ~3 developer-days)

**Goal:** Stop the system from doing harm.

- Disable `price_drop` notification via feature flag
- Fix double event tracking (remove from frontend or backend, not both)
- Add score reset logic on `booking_completed`
- Fix `return_visit` session detection (remove sessionId requirement)
- Fix origin-as-destination in metadata extraction
- Add `cabin` to `trackFlightView` metadata

**Output:** The system is no longer producing incorrect data or creating legal exposure.

---

### Phase 2 — Measure (Weeks 2–3, ~6–9 developer-days)

**Goal:** Establish a baseline so that Phase 3 can be evaluated.

- Implement A/B test control group (e.g. 20% of users receive no personalisation)
- Add click tracking on recommendation cards and notification CTAs
- Add intent tier accuracy logging
- Run for 30 days before enabling Phase 3

**Output:** A measurable baseline conversion rate and notification CTR. Go/no-go decision for Phase 3 investment.

---

### Phase 3 — Deliver Value (Weeks 4–8, ~18–29 developer-days)

**Goal:** Achieve the first measurable conversion lift.

- Decouple notification generation from batch job (near-real-time return_reminder)
- Use `primaryPlanningDestination` in recommendation ranking
- SendGrid triggered email on `medium` intent threshold
- Fix cold-start fallback destinations (configurable by market, not hardcoded)

**Trigger:** Only proceed if Phase 2 establishes a measurable baseline. Skip Phase 3 if monthly searcher volume is below ~500.

---

### Phase 4 — Scale (Month 3+, ~28–40 developer-days)

**Goal:** Extend reach and precision once the core engine is validated.

- Anonymous tracking (if GDPR infrastructure is in place)
- Admin / support tooling
- Recency decay (calibrated from Phase 2+3 conversion data)
- `price_drop` with real Amadeus price-feed integration

---

## 7. Decision Points and Risks

### Go/No-Go Decisions

| Decision | Condition | Recommended action |
|---|---|---|
| Proceed with Phase 1 | Always | Yes — bug fixes have no downside and remove legal exposure |
| Proceed with Phase 2 | Always (if Phase 1 done) | Yes — measurement infrastructure is prerequisite to all further investment |
| Proceed with Phase 3 | Phase 2 data shows notification CTR > 1% and conversion baseline established | Conditional — if CTR is near zero, reconsider notification strategy before building more of it |
| Proceed with Phase 4 | Phase 3 produces measurable lift (conversion rate improves in personalised group vs. control) | Conditional — only invest in scale if the core value is validated |

### Risks to the Investment

| Risk | Likelihood | Mitigation |
|---|---|---|
| Notifications irritate users, increasing opt-outs | Medium (without real price data, notifications are generic) | Phase 1: disable `price_drop`; Phase 2: track dismiss rate before expanding notification volume |
| Low traffic means ROI is undetectable at POC scale | High (POC has no production users by definition) | Frame Phase 1–2 as infrastructure investment, not revenue investment; focus on demonstrating the mechanism works |
| Intent score thresholds never validated | High (A-2 in root cause analysis) | Phase 2 must produce tier accuracy data; adjust thresholds empirically before treating scores as meaningful |
| `booking_completed` does not become the conversion signal | Medium (A-7: scoring weights are guesses) | After Phase 2, review whether `high`-tier users actually book at higher rates; recalibrate weights if not |
| Legal exposure from fabricated data lingers | Low if Phase 1 is complete | Disable `price_drop` in Phase 1 Week 1; do not ship to real users before this |

---

## 8. Summary Table: All Features Classified

| Feature | Classification | Phase | Effort | Revenue Impact |
|---|---|---|---|---|
| Fix double event tracking (RC-4) | **High Value** | 1 | 0.5 days | Indirect (restores data integrity) |
| Fix score reset on booking_completed (RC-5) | **High Value** | 1 | 0.5 days | Indirect (prevents post-conversion noise) |
| Disable/remove price_drop notification (RC-6) | **High Value** | 1 | 0.25 days | Risk removal (legal exposure) |
| Fix return_visit detection (RC-3) | **High Value** | 1 | 1 day | High (core intent signal restored) |
| Fix origin-as-destination (RC-9) | **High Value** | 1 | 0.25 days | Medium (primaryPlanningDestination accuracy) |
| Add cabin to trackFlightView (RC-8) | **Medium Value** | 1 | 0.5 days | Low-Medium (recommendation quality) |
| A/B measurement baseline | **High Value** | 2 | 5–8 days | Indirect (enables ROI attribution) |
| Notification CTR tracking | **High Value** | 2 | 1 day | Indirect (measurement) |
| Recommendation click tracking | **Medium Value** | 2 | 1 day | Indirect (measurement) |
| Near-real-time return_reminder (RC-2) | **Medium Value** | 3 | 5–8 days | High (captures peak-intent window) |
| Intent-ranked recommendations (RC-10) | **Medium Value** | 3 | 3–5 days | Medium (homepage relevance) |
| Continue planning card (with correct intent) | **High Value** | 3 | 1–2 days | High (lowest-friction return path) |
| SendGrid email trigger (RC-11 partial) | **Medium Value** | 3 | 5–8 days | High (reaches departed users) |
| Cold-start fallback fix (RC-12) | **Medium Value** | 3 | 2–3 days | Medium (new user experience) |
| Return reminder notification (with fixes) | **High Value** | 3 | 0 days (exists) | High (core Barcelona scenario) |
| Recency decay (RC-7) | **Low Value** | 4 | 3–5 days | Low until calibrated |
| Anonymous tracking (RC-1) | **Low Value** | 4 | 15–20 days | High potential / high complexity |
| Admin/support tooling | **Low Value** | 4 | 10–15 days | Indirect (operational maturity) |
| price_drop with real Amadeus data | **Low Value** | 4 | 10–15 days | Medium when available |
| Recency decay calibrated | **Low Value** | 4 | 3–5 days | Low-Medium (precision improvement) |

---

*This is a discovery artifact. ROI projections are based on industry benchmarks, not measured data from this platform. All projections should be replaced with measured values after Phase 2 produces a 30-day baseline.*
