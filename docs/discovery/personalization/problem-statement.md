# Problem Statement: Personalization for Booking Conversion

**Domain:** DataArt Travel — MERN stack booking platform (flights, hotels)  
**Date:** 2026-06-04  
**Status:** Discovery

---

## 1. What business problem actually exists?

The stated goal is "increase booking conversion through personalization." Before accepting that framing, it is worth naming the more specific problem underneath it:

**Users who have demonstrated purchase intent leave the platform without booking, and the platform has no mechanism to identify, recover, or learn from them.**

This manifests in at least three distinct failure modes, which require different solutions:

| Failure mode | Root cause | Personalization fixes it? |
|---|---|---|
| User searches, never views a result | Irrelevant results, wrong price band, UX friction | Possibly — better ranking helps |
| User views multiple options, does not start checkout | Comparison shopping across platforms, price uncertainty | Partially — nudges and "continue planning" cards address this |
| User starts checkout, abandons | Friction at payment, surprise fees, distrust | No — this is a UX/trust problem, not a personalization problem |

The current implementation focuses almost entirely on the second failure mode (repeat-search → notification). That is a reasonable place to start, but it is **one narrow slice** of the conversion problem.

---

## 2. What evidence would prove the problem?

No baseline data currently exists. This platform is a POC; there is no production traffic, no historical conversion funnel data, and no A/B testing infrastructure. Every threshold, weight, and assumption in the implementation is therefore **invented**, not measured.

Evidence that would prove the problem is real and that personalization is the right lever:

- **Funnel drop-off data**: At which step — search, view, booking_started, or checkout — do users exit? If most drop off at checkout, intent scoring does not address the cause.
- **Return visitor rate**: What percentage of users who search return within 7 days? If it is low, repeat-search detection fires rarely and has limited impact.
- **Cross-platform behaviour**: Are users leaving to book on MakeMyTrip, Booking.com, or similar? If so, why? Price? Trust? Availability?
- **Notification response rate**: Do users who receive a `return_reminder` actually click through and complete a booking? Without this, there is no evidence the notification helps rather than irritates.
- **Authenticated user proportion**: What fraction of searches happen from logged-in sessions? The current system tracks zero anonymous behaviour — if most searches happen before login, the intent model is blind to the majority of the funnel.

---

## 3. Who experiences the problem?

Three distinct user groups exist, and the current implementation only reaches one of them:

**Group A — Active planners (authenticated, repeat searchers)**  
These users have searched the same destination more than once within 7 days and have a `medium` or `high` intent tier. They are the direct target of the Barcelona scenario. They are also the group most likely to book regardless of intervention — they have already shown strong intent.

**Group B — Casual browsers (authenticated, single search)**  
These users searched once, possibly viewed one or two results, and did not return. The current system generates `price_drop` and `new_deal` notifications for them, but these are generated from fake data (random percentage drops, hardcoded trends). These notifications carry a trust risk: showing a user a "prices dropped 7%" message when prices have not actually changed is misleading.

**Group C — Anonymous visitors (not authenticated)**  
The system does not track these users at all. The `POST /api/personalization/track` endpoint returns `{ tracked: false, reason: 'not authenticated' }` for unauthenticated requests. Given that registration is a friction point in any booking funnel, the majority of early-funnel behaviour is invisible to the personalization system. This is the largest gap.

---

## 4. What outcomes are currently poor?

Because this is a POC with no production data, the following are **structural weaknesses** in the current implementation rather than observed metrics:

**a. The intent score is not calibrated**  
Thresholds (score ≥ 71 = high, ≥ 31 = medium) and event weights (`booking_started` = 25 pts, `hotel_search` = 5 pts) were set by engineering judgment. There is no evidence these thresholds correlate with actual purchase probability. A user with a score of 40 may be more likely to book than one with a score of 75, depending on context.

**b. The 2-hour aggregation lag undermines the core use case**  
The Barcelona scenario: user searches Barcelona, returns days later, searches again → intent score increments → aggregation job runs (next 2-hour window) → recommendation cache rebuilt → user sees notification. In practice, the notification arrives up to 2 hours after the moment of peak intent. If the user is actively on the platform right now, this is too late.

**c. Price-drop notifications are fabricated**  
`buildNotifications()` in `recommendationEngine.js` generates a random 5–8% price drop: `const pct = 5 + Math.floor(Math.random() * 8)`. The platform does not actually monitor price changes. Showing users fake price alerts is a legal and trust risk.

**d. Recommendations are destination-bound, not intent-bound**  
`buildRecommendations()` queries flights and hotels matching the user's top 3 favourite destinations. A user who has searched Dubai twice this week but previously visited Mumbai will get Mumbai results mixed in because it scored well historically. The "recency vs. history" trade-off is not resolved.

**e. No feedback loop exists**  
The system has no mechanism to learn whether a notification led to a booking, whether a recommendation was clicked, or whether the intent model was wrong. Without this, the model cannot improve.

---

## 5. What measurable metrics should improve?

If personalization is working, the following metrics should be measurable and should improve:

| Metric | Description | Baseline needed |
|---|---|---|
| Search-to-booking rate | Bookings ÷ unique search sessions | Yes — measure before enabling personalization |
| Return visitor conversion rate | Bookings by users who searched ≥2 times in 7 days ÷ total return visitors | Yes |
| Notification CTR | Clicks on notification CTA ÷ notifications shown | Yes — track `ctaUrl` navigation events |
| Notification-to-booking rate | Bookings within 24h of notification click ÷ total notification clicks | Yes |
| Intent tier accuracy | % of `high`-tier users who book within 7 days | Yes — this validates the scoring thresholds |
| Anonymous-to-authenticated conversion | Users who registered and booked within a session where they were first anonymous | Yes — requires anonymous tracking |
| Recommendation click-through rate | Clicks on recommended items ÷ recommendations shown | Yes — requires frontend click tracking, not yet implemented |

---

## 6. Challenged assumptions

The following assumptions in the current implementation are not validated by data and should be treated as hypotheses to test, not facts to build on:

| Assumption | Challenge |
|---|---|
| Repeat searches signal high purchase intent | A user who searches twice may be unable to find the right flight, not close to booking. Repeat search is a correlated signal; causality is unproven. |
| Notifications convert hesitant users | Unsolicited notifications can increase churn and unsubscribes. Without CTR data, "Still thinking about Barcelona?" may feel invasive rather than helpful. |
| A 7-day repeat window is correct | Leisure travel planning cycles can be weeks or months. Business travel may be same-day. One window for all users is too coarse. |
| Authenticated users are the right tracking scope | The majority of funnel drop-off likely happens before authentication. Restricting tracking to logged-in users means the system is calibrated on a self-selected, higher-intent population. |
| The 6-hour recommendation cache is acceptable | If a user returns to the site specifically because of a nudge and the cache is stale, they see yesterday's recommendations. This is the worst moment for stale data. |
| Price-drop notifications are harmless without real data | Fabricated urgency cues ("prices dropped 7%") expose the business to consumer protection risk and, when users notice they are not real, damage trust permanently. |

---

## 7. Recommended next questions before further investment

1. What is the actual authenticated-user proportion of all search sessions? (Check DB: `UserActivity` events vs. total site sessions)
2. Where in the funnel is the biggest drop — view → booking_started or booking_started → completed?
3. Is the notification bell being opened? Is the dismiss rate high? (Indicates the notifications are irrelevant)
4. What does the intent tier distribution look like in practice? If 90% of users are `low` and 1% are `high`, the system has narrow reach.
5. Should price-drop notifications be disabled until real price-change monitoring exists?

---

*This document is a discovery artifact. It does not prescribe an implementation — it defines what must be true before the implementation can be evaluated.*
