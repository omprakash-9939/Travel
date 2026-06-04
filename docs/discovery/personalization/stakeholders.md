# Stakeholder Map: Personalization System

**Input:** `problem-statement.md`, `root-cause.md`  
**Date:** 2026-06-04  
**Scope:** DataArt Travel — intent-based personalization and booking conversion

---

## How to read this document

Each stakeholder profile names what that person is trying to accomplish, what gets in the way, how they would judge success, and what could go wrong for them. Where a root cause from `root-cause.md` applies directly, it is referenced as `[RC-N]`.

Stakeholders are separated into two tiers:

- **Primary** — those who interact directly with the system or whose behaviour the system is designed to change
- **Secondary** — those whose work is affected by the system's outputs or failures

---

## Primary Stakeholders

---

### P1 — Traveler (First-time or Infrequent User)

**Profile:** A person using the platform for the first time, or returning after a long gap. Has no meaningful activity history. Is likely evaluating the platform against competitors (MakeMyTrip, Booking.com, Google Flights) simultaneously.

#### Goals
- Find a relevant flight or hotel quickly without needing to know how the platform works
- See prices and availability that reflect reality, not demo data
- Complete a booking in a single session without being asked to create an account prematurely
- Trust that the prices shown are accurate and the booking is real

#### Frustrations
- The homepage personalization zone is hidden for unauthenticated users — they see nothing that reflects their current intent
- Registration is required before any tracking begins, which creates a barrier before the platform has demonstrated value
- New user recommendations default to hardcoded destinations (Mumbai, Dubai, Goa) with no geographic or contextual relevance to the user `[RC-12]`
- "Prices for your trip dropped 7%" notification may appear on a first or second visit, with a percentage that is randomly generated and not real `[RC-6]`
- If a user begins checkout without being logged in, they are redirected to login; if they then lose the checkout state, they start again from scratch `[bookings.js:154]`

#### Success Criteria
- Arrives on homepage, sees relevant results without logging in (or after minimal friction)
- Finds a flight or hotel that matches their actual destination and budget within two searches
- Completes a booking end-to-end without unexpected redirects or state loss
- Does not receive a notification that turns out to contain false information

#### Risks to this stakeholder
- Fake urgency cues (`price_drop` random percentage) create a first impression of dishonesty `[RC-6]`
- Auth wall at checkout interrupts momentum at the highest-intent moment
- Cold-start problem means early-session recommendations are irrelevant, reducing confidence that the platform is worth using `[RC-12]`
- No guest checkout path — conversion requires account creation, which is a known drop-off driver in e-commerce

---

### P2 — Returning Customer (Active Planner)

**Profile:** An authenticated user who has searched for a specific destination at least once in the past 7 days and has returned to search again. This is the direct target of the Barcelona scenario — the user the intent scoring system was designed to identify and nudge.

#### Goals
- Pick up their research where they left off without re-entering the same search parameters
- Receive a timely and relevant nudge that acknowledges their specific destination interest
- See price or availability changes that are real and actionable
- Complete the booking they have been considering, with confidence that the information is current

#### Frustrations
- The "continue planning" card shows recent searches but reconstructs the search query from raw metadata, which may be incomplete or mis-keyed `[recommendationEngine.js:160-170]`
- The `return_reminder` notification ("Still thinking about Barcelona?") may arrive up to 2 hours after the return search, by which point the user may have already booked elsewhere `[RC-2]`
- After completing a booking, the system continues to send intent notifications for the same destination because `booking_completed` does not reset the score `[RC-5]`
- The return visit is not detected if they open the platform in a new browser tab, because session ID resets `[RC-3]`
- Recommendations may be dominated by destinations they researched months ago, not the destination they are actively planning now `[RC-7, RC-10]`

#### Success Criteria
- "Continue planning" card appears on the homepage for their active destination
- A `return_reminder` notification appears within the same session as the second search, not hours later
- After booking is confirmed, all Barcelona-related notifications cease
- Recommendations shown on the homepage reflect the destination they searched this week, not 60 days ago

#### Risks to this stakeholder
- Receiving "Still thinking about Barcelona?" after confirming a Barcelona hotel booking is confusing and erodes trust `[RC-5]`
- Intent score inflation from double tracking `[RC-4]` means users may reach `high` tier too easily, receiving more aggressive notifications than their actual intent warrants
- The `return_visit` signal — the core indicator of "this person came back" — barely fires in practice due to the session ID matching bug `[RC-3]`, so the model does not accurately reflect this user's engagement level

---

### P3 — Booking Platform Owner (DataArt / Business Stakeholder)

**Profile:** The person or team accountable for the platform's conversion rate, revenue, and reputation. Needs the personalization investment to produce measurable business results, and needs to avoid legal or trust problems that could undermine the brand.

#### Goals
- Measure a clear improvement in search-to-booking conversion attributable to personalization
- Build a system that gets more accurate over time as more data is collected
- Avoid regulatory or trust exposure from false or misleading data shown to users
- Understand which users are most likely to convert and focus acquisition and retention effort accordingly
- Have confidence that the analytics data reflects real user behaviour

#### Frustrations
- No baseline metrics exist; it is currently impossible to determine whether personalization has any effect `[problem-statement.md §5]`
- All scoring thresholds and event weights are engineering estimates without calibration data `[RC-7, A-2]`
- The intent score is corrupted by double tracking — every booking inflates `breakdown.bookingsStarted` by 2 and `breakdown.bookingsCompleted` by 2 `[RC-4]`
- The `price_drop` notification contains fabricated data, creating direct consumer protection exposure `[RC-6]`
- The feedback loop is missing — there is no way to know if a notification led to a booking or an unsubscribe
- The Amadeus API (real inventory) is optional and unconfigured by default; the platform cannot credibly promise accurate availability without it

#### Success Criteria
- A baseline search-to-booking conversion rate is established before personalization is active
- Notification CTR and notification-to-booking rate are tracked and exceed industry benchmarks (CTR > 3%, notification-to-booking > 10%)
- Intent tier accuracy is validated: >50% of `high`-tier users book within 7 days of reaching that tier
- `price_drop` notifications are either removed or connected to real price data before going to production users
- Double tracking is resolved and all analytics reflect actual event counts `[RC-4]`
- The system can be A/B tested: a control group receives no personalization, and conversion rates are compared

#### Risks to this stakeholder
- `price_drop` false urgency: showing users a randomly generated price drop percentage is a breach of consumer trust and potentially a violation of advertising standards in regulated markets
- Double-tracked intent scores inflate tier classifications, making it appear the personalization system is reaching more high-intent users than it is
- Without a feedback loop, continued investment in recommendation refinement is unjustifiable — there is no signal that it is working
- If `booking_completed` does not reset the score `[RC-5]`, converting a user keeps them in `high` tier, which skews all tier-accuracy metrics

---

## Secondary Stakeholders

---

### S1 — Marketing Team

**Profile:** The team responsible for user acquisition, re-engagement campaigns, and conversion optimisation. Would use intent signals to trigger campaigns and personalise outreach.

#### Goals
- Use intent tier and destination data to trigger targeted email or push campaigns for users who showed interest but did not book
- Segment users by intent tier to prioritise re-engagement spend (focus on `high` and `medium` tier users)
- Measure campaign performance against intent signals (did a `high`-intent user who received an email convert?)
- Personalise content — not just "come back to DataArt Travel" but "come back and book Barcelona"

#### Frustrations
- The notification system is in-app only; there is no connection between the intent score and SendGrid email delivery `[RC-11]`
- Users who leave the platform (the primary re-engagement target) will never see an in-app notification
- Intent scores from the current system are unreliable due to double tracking and session detection bugs `[RC-3, RC-4]`
- No export or API exists to pull intent scores or destination signals into an email platform or CRM
- Anonymous users — likely the largest segment of potential converts — produce no data at all `[RC-1]`

#### Success Criteria
- When a user's intent score crosses the `medium` threshold, a SendGrid email is triggered with their active destination
- A `high`-tier user who has not visited in 48 hours receives an outbound notification (email or push) rather than waiting for them to return to see an in-app alert
- Marketing can query intent tier and `primaryPlanningDestination` via an internal API to build audience segments
- Anonymous-to-registered conversion can be tracked (requires anonymous tracking `[RC-1]`)

#### Risks to this stakeholder
- Campaigns built on intent scores will be misdirected if RC-4 (double tracking) and RC-3 (broken return_visit) are not fixed first
- If users opt out of notifications due to irrelevant or false urgency messages `[RC-6]`, the re-engagement channel is lost for those users permanently
- Using fabricated price information (`price_drop`) in email campaigns would be a direct legal liability `[RC-6]`

---

### S2 — Operations Team

**Profile:** The engineers and infrastructure team responsible for keeping the platform running, maintaining the database, and ensuring the background job runs reliably without degrading performance.

#### Goals
- The aggregation job completes within its 2-hour window for all active users
- Personalization service failures do not affect core booking functionality
- Database load from personalization queries is predictable and bounded
- Errors in the aggregation pipeline are surfaced, not silently swallowed

#### Frustrations
- `aggregationJob.js` uses `Promise.allSettled` and logs errors to `console.error` only — there is no alerting, no dead-letter queue, no metric on how many users failed to aggregate in a cycle `[aggregationJob.js:40-46]`
- Each aggregation cycle queries 90 days of `UserActivity` per user — for a platform with millions of users, this is an unbounded query that will degrade over time
- `preferenceEngine.js:33` issues two large MongoDB queries (`UserActivity.find` + `Booking.find`) per user per cycle; with 50 users per batch and multiple batches, peak DB load is opaque
- The `RecommendationCache` uses MongoDB TTL index for expiry, which means the cache document is deleted and re-created every 6 hours — this is write-heavy under load
- `bookings.js` calls `aggregatePreferences` and `invalidateCache` asynchronously after every booking confirmation (line 210-212), creating unmetered background work

#### Success Criteria
- Aggregation job completion time is logged and monitored; an alert fires if a cycle exceeds 90 minutes
- Failed user aggregations are retried with exponential backoff, not silently skipped
- A circuit breaker prevents personalization queries from contributing to DB overload during a spike
- The aggregation query is bounded: uses an index on `user + createdAt` (already exists in `UserActivity`) and does not perform full-collection scans
- The personalization stack can be disabled via an environment variable without code changes

#### Risks to this stakeholder
- Silent failures in the aggregation pipeline `[aggregationJob.js:46]` mean the operations team has no visibility when users stop receiving updated recommendations
- Unbounded growth of `UserActivity` (90-day TTL is correct, but at scale each user's document set is large) will create memory pressure during aggregation
- No graceful degradation: if `buildRecommendations()` throws for a user, that user gets no recommendations, but there is no fallback to cached results or generic results

---

### S3 — Support Team

**Profile:** The team that handles user complaints, explains platform behaviour, and resolves disputes. Will be the first to hear about misleading notifications or unexpected booking issues.

#### Goals
- Understand why a specific user received a specific notification
- Verify a user's booking status, intent score, and notification history without requiring engineering intervention
- Resolve a user complaint about a misleading price drop notification efficiently
- Clear a user's notification state or intent score if needed (e.g. after a complaint)

#### Frustrations
- There is no admin interface for personalization data; support cannot look up a user's intent score, tier, or `sentNotifications` history without a direct MongoDB query
- The `price_drop` notification ("Prices for your Barcelona trip dropped 7%") will generate support tickets from users who check and find prices are unchanged or higher `[RC-6]`
- When a user asks "why did I receive this notification?", the answer requires understanding the intent scoring algorithm, the aggregation job schedule, and the `sentNotifications` dedup logic — none of which are exposed to support
- If a converted user keeps receiving nudge notifications `[RC-5]`, they will contact support; clearing the state requires direct DB manipulation
- `dismissNotification` is available to users via the UI, but there is no admin-level "suppress all notifications for this user" capability

#### Success Criteria
- An internal admin view shows a user's current intent score, tier, `primaryPlanningDestination`, `sentNotifications[]`, and recent activity events
- Support can trigger a score reset or notification suppression via a UI action, not a database query
- The reasoning behind each notification is stored in a human-readable format (e.g. "Triggered by: 2 hotel_search events for Barcelona in 7 days, score 45, tier: medium")
- `price_drop` notifications are either removed or clearly labelled as estimates, reducing the number of disputes `[RC-6]`

#### Risks to this stakeholder
- High volume of support tickets from `price_drop` false urgency is predictable and avoidable `[RC-6]`
- Without admin tooling, every personalization-related complaint escalates to engineering
- A user who books and then continues to receive "You haven't booked yet!" notifications will perceive the platform as broken, generating complaints that are difficult to resolve without engineering access to the DB `[RC-5]`

---

## Conflict map

Some stakeholder goals are in direct tension. These conflicts should be resolved explicitly, not left to emerge in production.

| Conflict | Stakeholders | Nature |
|---|---|---|
| Notification frequency | P2 (wants relevant, timely nudges) vs. S3 (wants fewer complaints) | More notifications → more conversion attempts but more support load if quality is low |
| Anonymous tracking | P3 (wants full funnel visibility) vs. P1 (privacy expectations) | Tracking anonymous users requires consent mechanisms and GDPR compliance work |
| Real-time vs. batch | P2 (wants immediate notification) vs. S2 (wants bounded DB load) | Decoupling notification from batch aggregation increases infra complexity |
| Price accuracy | P1/P2 (want accurate prices) vs. current implementation (RC-6: random numbers) | Accurate prices require live Amadeus/price-feed integration; fake prices must be removed regardless |
| Score transparency | S3 (wants explainability) vs. current implementation (black-box scores) | Logging notification rationale adds overhead but is necessary for support and trust |

---

## Minimum viable resolution

Before any personalization feature is shown to real users, the following stakeholder risks must be resolved:

| Stakeholder | Blocker |
|---|---|
| P2, P3, S3 | Remove or disable `price_drop` notification until connected to real price data `[RC-6]` |
| P3, S3 | Fix double event tracking so analytics reflect real event counts `[RC-4]` |
| P2, S3 | Add score reset on `booking_completed` so converted users stop receiving urgency notifications `[RC-5]` |
| P2 | Fix `return_visit` detection to use cross-session user history, not same-session ID `[RC-3]` |
| P3 | Establish a measurement baseline (A/B split) before claiming personalization increases conversion |

---

*This document is a discovery artifact. It does not prescribe a solution — it defines who is affected, how, and what must be true before they can be served well.*
