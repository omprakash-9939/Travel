# Root Cause Analysis: Booking Conversion

**Input:** `docs/discovery/personalization/problem-statement.md`  
**Date:** 2026-06-04  
**Method:** 5 Whys, Cause Trees, Evidence-based code inspection  
**Scope:** DataArt Travel MERN stack — authenticated-only personalization engine

---

## How to read this document

Each section applies 5 Whys to one failure mode, followed by a cause tree showing how sub-causes relate. Findings are then separated into three categories at the end:

- **Symptoms** — observable effects; what users and metrics see
- **Root causes** — structural or design decisions that produce the symptoms
- **Assumptions** — things treated as facts that are not validated

Code file references are included where the cause is directly observable in the source.

---

## 1. Why booking conversion is lower than desired

### 5 Whys

**Why 1:** Users search but do not book.  
→ Because the gap between "I searched" and "I confirmed payment" is not closed.

**Why 2:** The gap is not closed.  
→ Because the platform has no real-time signal that a user is mid-decision, and therefore no timely intervention.

**Why 3:** There is no real-time signal.  
→ Because intent scoring is updated on every `track()` call (synchronous), but recommendations and notifications are only rebuilt by the aggregation job which runs every 2 hours.  
→ Code: `aggregationJob.js:19` — `const INTERVAL_MS = 2 * 60 * 60 * 1000`

**Why 4:** The aggregation job runs on a 2-hour interval.  
→ Because batch aggregation was chosen for cost and DB load reasons, which is correct for profile building, but was also applied to time-sensitive notification generation, where it is wrong.

**Why 5:** Notification generation was not separated from profile aggregation.  
→ Because `buildRecommendations()` in `recommendationEngine.js` handles both preference-based ranking (slow, batch-appropriate) and intent-triggered notifications (`return_reminder`, `price_drop`) in a single pipeline, making it impossible to run notifications on a shorter cycle without rebuilding the entire recommendation set.

### Cause Tree

```
Low booking conversion
├── No timely intervention at peak intent
│   ├── Notification arrives up to 2h after repeat search [aggregationJob.js:19]
│   └── Notification + recommendation generation are coupled in one pipeline [recommendationEngine.js:296]
├── Intervention reaches only a fraction of at-risk users
│   ├── Tracking requires authentication [personalization.js:36-37]
│   └── Anonymous funnel (pre-login) is completely blind
└── Intervention quality is low for some users
    ├── price_drop notification uses random numbers [recommendationEngine.js:205]
    └── Notifications shown to low-intent users (no tier gate on price_drop)
        └── Only return_reminder requires medium/high tier [recommendationEngine.js:187-192]
```

---

## 2. Why users abandon searches

### 5 Whys

**Why 1:** Users search and do not proceed to view or book.  
→ Because results may not match what the user was looking for.

**Why 2:** Results do not match.  
→ Because flight and hotel inventory is static (seeded demo data), and the Amadeus API integration is optional and unconfigured by default.  
→ Code: `amadeus.js` exists as a service but there is no mandatory fallback guaranteeing live inventory.

**Why 3:** The Amadeus integration is optional.  
→ Because the platform is a POC. Real-time inventory was scoped out.

**Why 4:** Without real inventory, users find flights and hotels that do not reflect what is actually bookable on the dates they want.  
→ Because the search UI does not communicate the demo nature of results; users are shown what appears to be real availability.

**Why 5:** There is no UX signal (e.g. "demo data" label) that calibrates user expectations.  
→ Because the UX was designed to simulate production without the infrastructure that production requires.

**Secondary cause chain — search experience:**

**Why 1:** Users who do reach results abandon before clicking through.  
→ Because the recommendation ranking for new users defaults to popularity-based fallback.

**Why 2:** New users get popularity-based results.  
→ Because `buildRecommendations()` falls back to `['Mumbai', 'Dubai', 'Goa']` when `topDests` is empty.  
→ Code: `recommendationEngine.js:308` — `const searchDests = topDests.length ? topDests : ['Mumbai', 'Dubai', 'Goa']`

**Why 3:** `topDests` is empty for new users.  
→ Because preference aggregation requires prior `UserActivity` records, and new users have none.

**Why 4:** There is no cold-start strategy.  
→ Because the design assumes users bring history. No onboarding survey, no city/interest capture at registration, no geo-IP inference.

**Why 5:** The platform has no signal for new-user intent.  
→ Because the personalization system was built for returning users, not acquisition.

### Cause Tree

```
Search abandonment
├── Results do not match user intent
│   ├── Static/seeded inventory does not reflect real availability
│   │   └── Amadeus integration is optional [amadeus.js]
│   └── No UX feedback that data is demo quality
├── New users see generic results
│   ├── No cold-start strategy (no onboarding preferences)
│   └── Fallback hardcodes Mumbai/Dubai/Goa [recommendationEngine.js:308]
└── Returning users see stale results
    ├── No recency weighting in preference aggregation
    │   └── 89-day-old search scores same as yesterday's [preferenceEngine.js:63]
    └── primaryPlanningDestination can be wrong
        └── origin city incorrectly used as destination [activityTracker.js:132]
            (metadata.origin used as `dest` for primaryPlanningDestination update)
```

**Code evidence — `origin` used as destination:**  
`activityTracker.js:132`:
```js
const dest = metadata.destination || metadata.city || metadata.origin;
```
For a flight search, `metadata.origin` is the departure city (e.g. Delhi). If `metadata.destination` and `metadata.city` are both absent, `primaryPlanningDestination` is set to the origin city — the city the user is flying *from*, not to. This causes the return_reminder to offer "Still thinking about Delhi?" to a user searching Delhi → Barcelona.

---

## 3. Why users do not return

### 5 Whys

**Why 1:** Users who search once do not come back.  
→ Because there is no mechanism to reach them once they leave the platform.

**Why 2:** There is no re-engagement mechanism for users who do not return.  
→ Because the notification system only delivers messages to users who are already on the platform (in-app notifications, not push/email).

**Why 3:** Notifications are in-app only.  
→ Because the notification bell in `Navbar.js` only shows when the user is actively using the app. There is no email trigger, no push notification, no SMS.

**Why 4:** Email and SMS integrations exist but are not connected to intent scoring.  
→ Code: `sendgrid.js` and `twilio.js` exist under `services/integrations/`. They are used in `notifyBookingConfirmation` (post-booking) but never for intent-triggered outreach.

**Why 5:** The personalization system was built as an in-app layer, not a re-engagement channel.  
→ Because the core loop assumed the user would return to the app; it has no mechanism to pull them back.

**Secondary cause chain — return_visit detection:**

**Why 1:** Return visits are under-detected.  
→ Because `maybeReturnVisit()` looks for prior activity with the same `userId` AND the same `sessionId`.  
→ Code: `activityTracker.js:70-77`

**Why 2:** The same `sessionId` is required.  
→ Because session IDs are stored in `sessionStorage`, which is tab-local. A new tab or a new browser session generates a new session ID.

**Why 3:** New session ID means `UserActivity.findOne({ user: userId, sessionId })` returns null.  
→ Which causes `maybeReturnVisit()` to return `false` — no return_visit event is logged.

**Why 4:** The function was designed to detect in-session inactivity (30-min gap), not cross-session returns.  
→ The correct signal for "user came back after days" is a new session where `UserActivity` shows a prior session for the same user. The current query is backwards: it should look for *any* prior session by this user, not the current session.

**Why 5:** The intent model therefore misses the most meaningful return signal — a user who was away for days and came back.  
→ This means `return_visit` events (15 pts) and the associated `breakdown.returnVisits` counter almost never increment in the intended scenario. They only fire when a user stays in one tab for 30+ minutes without interacting.

### Cause Tree

```
Users do not return
├── No out-of-app re-engagement channel
│   ├── Notification bell is in-app only
│   └── SendGrid/Twilio not connected to intent scoring [sendgrid.js, twilio.js]
├── Return signals not correctly detected
│   ├── maybeReturnVisit requires same sessionId as prior activity [activityTracker.js:70-77]
│   └── sessionStorage resets per tab — cross-session return invisible to the model
└── Notification content lacks personalisation for browsers (Group B)
    ├── price_drop notification fires for any user with a destination
    └── price_drop percentage is random, not real [recommendationEngine.js:205]
        └── Trust erosion if user notices inconsistency across sessions
```

---

## 4. Why recommendations may be irrelevant

### 5 Whys

**Why 1:** A user sees recommendations that do not match their current interest.  
→ Because recommendations are built from the full 90-day activity history, not weighted toward recent signals.

**Why 2:** There is no recency weighting.  
→ Because `preferenceEngine.js` assigns flat scores: `search = +3, view = +2` regardless of when the event occurred.  
→ Code: `preferenceEngine.js:63` — `bumpScore(destScores, dest, a.eventType.includes('search') ? 3 : 2)`  
The array is already sorted by recency (`sort({ createdAt: -1 })`), but the scoring treats every event equally.

**Why 3:** Recency was not modelled.  
→ Because the scoring function does not apply a time-decay factor (e.g. exponential decay over weeks).

**Why 4:** Time-decay requires calibration data to set the half-life parameter.  
→ Because no conversion data exists to know whether a 30-day-old search or a 3-day-old search better predicts current intent.

**Why 5:** Without calibration data, any decay factor is as arbitrary as having none.  
→ This is a POC limitation, not an engineering oversight. The correct path is: collect baseline data first, then add decay.

**Secondary cause chain — `preferredCabin`:**

**Why 1:** Cabin preference is always `economy` for all users.  
→ Because `cabinCounts` is built from `m.cabin` in `UserActivity.metadata`.

**Why 2:** `trackFlightView` in `PersonalizationContext.js` does not pass `cabin` in the metadata payload.  
→ Code: `PersonalizationContext.js:98-107` — `cabin` is not in the `trackFlightView` call.

**Why 3:** `cabinCounts` is therefore always empty.  
→ `Object.entries({}).sort(...)` returns `[]`, so `preferredCabin` always defaults to `'economy'`.

**Why 4:** Flight recommendations are always scoped to economy class regardless of what the user actually looked at.  
→ A user who viewed business-class flights consistently will still receive economy recommendations.

**Why 5:** There is no test that verifies `preferredCabin` reflects actual user behaviour.

**Third cause chain — destination query uses `primaryPlanningDestination` from intent, but recommendations use top destinations from preference history:**

The user's active search context (`intent.primaryPlanningDestination`) is not used to prioritise the recommendation query. `buildRecommendations()` uses `prefs.favoriteDestinations` (90-day history), which can be dominated by destinations the user visited months ago. The user searching Barcelona today may see Goa/Mumbai recommendations because they are historically high-scoring.

### Cause Tree

```
Irrelevant recommendations
├── Preference profile weighted by frequency, not recency
│   └── Flat scoring in preferenceEngine ignores event age [preferenceEngine.js:63]
├── New users get hardcoded fallback destinations [recommendationEngine.js:308]
├── preferredCabin always defaults to economy
│   └── trackFlightView does not emit cabin metadata [PersonalizationContext.js:98-107]
├── Active intent not used in recommendation query
│   └── buildRecommendations uses favoriteDestinations, not primaryPlanningDestination
│       [recommendationEngine.js:307-315]
└── origin city can corrupt primaryPlanningDestination [activityTracker.js:132]
```

---

## 5. Why users fail to complete bookings

### 5 Whys

**Why 1:** Users who start checkout do not reach a confirmed booking.  
→ Because there is friction or a blocking condition between `booking_started` and `booking_completed`.

**Why 2:** What friction exists?  
→ The booking flow requires an authenticated user (`protect` middleware on `POST /bookings`). A user who added something to their cart (booking_started) but is not logged in will be redirected to login.  
→ Code: `BookingCheckoutPage.js:76-79` — if `!user`, navigate to login. The booking state is passed in `location.state`, which survives navigation but is cleared on refresh or a new login session.

**Why 3:** If the user logs in and loses the checkout state, they cannot complete the booking.  
→ Because `sessionStorage.setItem('pendingCheckout', ...)` is only used for Stripe redirects. Wallet and Razorpay paths do not persist checkout state.

**Why 4:** Why are there no safeguards for wallet/Razorpay paths?  
→ Because the Stripe path requires an external redirect (which naturally breaks state), so it received explicit handling. Wallet/Razorpay paths were assumed to be same-session.

**Why 5:** The assumption is correct only if the user never navigates away, refreshes, or is asked to log in mid-flow.  
→ For wallet payments (the default path for the demo), this is usually fine. For new users who hit the checkout unauthenticated, the state loss is a real drop-off point.

**Secondary cause chain — double event tracking:**

`booking_started` is tracked in two places:
1. Frontend: `BookingCheckoutPage.js` via `usePersonalization` — fires `trackBookingStart` before payment
2. Backend: `bookings.js:174` — `tracker.trackBookingStart(req.user._id, ...)` fires on `POST /bookings`

`booking_completed` is also tracked in two places:
1. Frontend: `BookingCheckoutPage.js:120,146` — `trackBookingComplete(item, type)`
2. Backend: `bookings.js:207` — `tracker.trackBookingDone(req.user._id, ...)`

The effect: every booking inflates `breakdown.bookingsStarted` and `breakdown.bookingsCompleted` by 2, and adds 50 pts to the intent score twice (capped at 100, but the counter is wrong).

Note: `INTENT_WEIGHTS.booking_completed = 50` (additive, not a reset). Despite the previous session's notes, the current code does **not** reset the intent score to 0 on booking completion. A user who completes a booking gets +50 pts and stays in their current tier or moves higher — meaning the system continues to send urgency notifications to converted users.

### Cause Tree

```
Users fail to complete bookings
├── Auth wall mid-funnel
│   ├── POST /bookings requires authentication [bookings.js:154]
│   └── Checkout state lost on unauthenticated redirect for wallet/Razorpay paths
│       (only Stripe path saves pendingCheckout) [BookingCheckoutPage.js:91]
├── Double event tracking corrupts intent scores
│   ├── booking_started fired from both frontend and backend [BookingCheckoutPage.js + bookings.js:174]
│   └── booking_completed fired from both frontend and backend [BookingCheckoutPage.js + bookings.js:207]
│       → breakdown counters are 2× actual value
├── Converted users receive continued urgency notifications
│   └── booking_completed adds 50 pts (not a reset) [activityTracker.js:19]
│       → user who just booked Barcelona may still receive "Still thinking about Barcelona?"
└── No post-booking intent cool-down
    └── sentNotifications[] dedup is 48h window only
        → return_reminder can reappear 2 days after a confirmed booking
```

---

## Summary: Symptoms vs. Root Causes vs. Assumptions

### Symptoms (observable effects)

These are what users and metrics see. Addressing symptoms without addressing root causes produces temporary improvement.

1. Users search but do not book
2. Notifications feel generic or irrelevant
3. Return visits not correctly identified
4. New users see hardcoded destination suggestions
5. "Still thinking about Barcelona?" notification shown to a user who already booked Barcelona

### Root Causes (structural, code-verified)

These are decisions or gaps that produce the symptoms. Each is traceable to a specific file and line.

| # | Root Cause | Evidence |
|---|---|---|
| RC-1 | Tracking is gated on authentication; anonymous funnel is invisible | `personalization.js:36-37` |
| RC-2 | Notification generation is coupled to batch preference aggregation; minimum latency is 2 hours | `aggregationJob.js:19` |
| RC-3 | `return_visit` detection requires the same `sessionId`, so cross-session returns go undetected | `activityTracker.js:70-77` |
| RC-4 | `booking_started` and `booking_completed` are tracked on both frontend and backend; all counters are 2× actual | `bookings.js:174,207` + `BookingCheckoutPage.js:120,146` |
| RC-5 | `booking_completed` adds 50 pts; there is no score reset or cool-down after conversion | `activityTracker.js:19` |
| RC-6 | `price_drop` notification percentage is a random number; it is not connected to real price data | `recommendationEngine.js:205` |
| RC-7 | Preference scoring uses flat weights; 89-day-old searches score the same as today's | `preferenceEngine.js:63` |
| RC-8 | `trackFlightView` does not emit `cabin`; `preferredCabin` is always `economy` | `PersonalizationContext.js:98-107` |
| RC-9 | `metadata.origin` can be used as destination when `metadata.destination` and `metadata.city` are absent | `activityTracker.js:132` |
| RC-10 | `buildRecommendations` uses 90-day favourite destinations, not current active intent | `recommendationEngine.js:307-315` |
| RC-11 | SendGrid and Twilio are not connected to intent scoring; no out-of-app re-engagement channel exists | `sendgrid.js`, `twilio.js` |
| RC-12 | No cold-start strategy; new users see hardcoded fallback destinations | `recommendationEngine.js:308` |

### Assumptions (unvalidated; must be tested before acting on)

These are claims embedded in the implementation that may be false.

| # | Assumption | Why it may be wrong |
|---|---|---|
| A-1 | Repeat search within 7 days = purchase intent | May signal failed search (couldn't find what they wanted), not readiness to buy |
| A-2 | Tier thresholds (≥31 = medium, ≥71 = high) correlate with purchase probability | Thresholds were set by engineering judgment; no conversion data validates them |
| A-3 | A 7-day window captures the relevant planning cycle | Business travel is same-day; luxury travel may be planned months in advance |
| A-4 | In-app notifications are sufficient to recover hesitant users | Users who leave the platform to compare prices will not see in-app notifications |
| A-5 | The 6-hour recommendation cache is acceptable | Users who return specifically because of a nudge will see a stale cache at the worst possible moment |
| A-6 | Notifications nudge conversions rather than irritate users | Without CTR and opt-out data, this cannot be determined |
| A-7 | The scoring weights (flight_search=5, booking_started=25, etc.) reflect relative intent value | These are engineering estimates; a user who views 10 hotels may be more intent-ready than one who clicks "Book" and abandons |

---

## Priority ranking

Ordered by impact on the stated goal (increase booking conversion) and effort to fix:

| Priority | Root Cause | Impact | Effort |
|---|---|---|---|
| 1 | RC-4 — Double event tracking | High: all counters wrong, tier inflation | Low: remove tracking from one layer |
| 2 | RC-5 — No score reset after booking_completed | High: converted users receive urgency notifications | Low: add reset logic in activityTracker |
| 3 | RC-6 — Fake price_drop data | High: trust risk; remove or replace | Low: disable or gate on real data |
| 4 | RC-3 — return_visit detection broken | High: key intent signal not firing | Medium: fix session query logic |
| 5 | RC-9 — origin used as destination | Medium: wrong primaryPlanningDestination | Low: fix metadata extraction |
| 6 | RC-8 — cabin never populated | Medium: recommendations miss cabin preference | Low: add cabin to trackFlightView |
| 7 | RC-2 — 2-hour notification lag | Medium: peak-intent window missed | Medium: decouple notification from batch job |
| 8 | RC-10 — recs use history, not current intent | Medium: stale destination in recs | Medium: add recency bias to ranking |
| 9 | RC-1 — no anonymous tracking | High potential: but high complexity and privacy scope | High |
| 10 | RC-11 — no out-of-app re-engagement | High potential: but requires email/push infrastructure | High |
| 11 | RC-12 — no cold-start strategy | Medium: affects only new users | Medium |
| 12 | RC-7 — no recency decay | Low-medium: requires calibration data first | Medium |

---

*Root causes RC-1 through RC-6 are code-verified facts, not inferences. RC-7 through RC-12 are structural gaps visible in the design. All items in the Assumptions table require empirical validation before being treated as facts.*
