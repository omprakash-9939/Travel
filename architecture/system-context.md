# System Context — DataArt Travel Personalization Engine

## C4 Level 1 — System Context

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   [Authenticated Traveler]                                                   │
│      Searches flights/hotels, views results,                                 │
│      books, adds to wishlist.                                                │
│      Sees personalised homepage, notifications,                              │
│      and "Continue Planning" card on return.                                 │
│                                                                              │
│   [Anonymous Visitor]                                                        │
│      Sees generic homepage (cold-start fallback).                            │
│      Not tracked for personalization (Phase 1 scope).                        │
│                                                                              │
│   [Support / Admin]                                                          │
│      Inspects and resets user intent state                                   │
│      via internal admin panel.                                               │
│                                                                              │
│                   ▼                                                          │
│  ┌───────────────────────────────────────────────────┐                      │
│  │     DataArt Travel Personalization Platform        │                      │
│  │  (React 18 SPA + Express 4 API + MongoDB)         │                      │
│  └──────────────────────────┬────────────────────────┘                      │
│                              │                                               │
│          ┌───────────────────┼───────────────────────┐                      │
│          ▼                   ▼                        ▼                      │
│   [Amadeus API]       [SendGrid API]          [Stripe / Razorpay]            │
│   Flight & hotel      Transactional &         Payment processing             │
│   search results      re-engagement email                                    │
│                                                                              │
│          ▼                   ▼                        ▼                      │
│   [OpenWeather]       [OpenAI API]           [Mapbox / Google Maps]          │
│   Weather widget      AI chat                Map embeds                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## C4 Level 2 — Container Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DataArt Travel Platform                                                     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  Frontend SPA  (React 18 · CRA · port 3000)                      │       │
│  │                                                                  │       │
│  │  Pages: Homepage, Flights, Hotels, Bookings, Admin               │       │
│  │  State: local useState / Context (no Redux)                      │       │
│  │  HTTP: Axios (proxy → :5000)                                     │       │
│  │  UI: lucide-react icons, inline Tailwind-style classes           │       │
│  └───────────────────────────┬──────────────────────────────────────┘       │
│                              │ REST / JSON (JWT in Authorization header)     │
│  ┌───────────────────────────▼──────────────────────────────────────┐       │
│  │  Backend API  (Express 4 · Node.js 18+ · port 5000)              │       │
│  │                                                                  │       │
│  │  Routers                                                         │       │
│  │    /api/auth          → JWT sign-in / register                   │       │
│  │    /api/personalization → recommendations, track, intent         │       │
│  │    /api/flights       → search + Amadeus proxy                   │       │
│  │    /api/hotels        → search + fallback                        │       │
│  │    /api/bookings      → booking lifecycle                        │       │
│  │    /api/admin         → intent view + reset (admin role)         │       │
│  │                                                                  │       │
│  │  Personalization Services                                        │       │
│  │    activityTracker.js     Event ingestion + real-time intent     │       │
│  │    preferenceEngine.js    90-day preference aggregation          │       │
│  │    recommendationEngine.js Ranking + cache build                 │       │
│  │    notificationHelpers.js  Real-time notification triggers       │       │
│  │                                                                  │       │
│  │  Background Jobs                                                 │       │
│  │    aggregationJob.js  2-hr setInterval batch (50-user batches)   │       │
│  └───────────────────────────┬──────────────────────────────────────┘       │
│                              │ Mongoose ODM                                  │
│  ┌───────────────────────────▼──────────────────────────────────────┐       │
│  │  MongoDB  (Atlas M0 dev / M10+ production)                       │       │
│  │                                                                  │       │
│  │  Collections                                                     │       │
│  │    User                UserActivity         UserIntentScore      │       │
│  │    UserPreference       RecommendationCache  Booking             │       │
│  │    Flight               Hotel               SearchHistory        │       │
│  │    FlightAlert          Offer               CommunityReport      │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Personalization Subsystem — Detailed Flow

### Event Pipeline (as-is → target)

```
HTTP POST /api/personalization/track
    │
    ▼
activityTracker.track(userId, eventType, metadata, sessionId)
    │
    ├─► isRepeatSearch()          ── DB: UserActivity (user + eventType + 7d)
    │       └─ +10 bonus pts if same destination seen within 7 days
    │
    ├─► maybeReturnVisit()        ── DB: UserActivity (user, sessionId ≠ current, >30min)
    │       └─ emit return_visit event if cross-session gap detected    [BUG RC-3: fix needed]
    │
    ├─► UserActivity.create()     ── persist event record
    │
    ├─► updateIntentScore()       ── upsert UserIntentScore
    │       ├─ accumulate score (capped 100)
    │       ├─ classify tier (low/medium/high)
    │       └─ set primaryPlanningDestination
    │
    ├─► [TARGET EP-06] maybeGenerateReturnReminder()
    │       └─ if return_visit + tier ∈ {medium,high} + no 48h dedup → push notification
    │
    └─► [TARGET EP-06] checkTierTransition()
            └─ if low→medium + no 7d email dedup → sendgrid.sendReEngagementEmail()


setInterval 2h → aggregationJob.runOnce()
    │
    ├─► Find distinct users with activity in last 24h
    └─► For each batch of 50:
            ├─► preferenceEngine.aggregatePreferences(userId)   ── 90-day rollup
            └─► recommendationEngine.buildRecommendations(userId) ── rank + cache 6h
```

### Recommendation Priority Chain

```
buildRecommendations(userId)
    │
    ├─ 1. intent.primaryPlanningDestination  (current session — RC-10 target fix)
    │       └─ query flights + hotels for this destination first
    │
    ├─ 2. prefs.favoriteDestinations[0..2]   (90-day history fallback)
    │       └─ ranked by composite score (pref 40% + pop 20% + rating 15% + budget 15% + trend 10%)
    │
    └─ 3. Cold-start list                    (configurable per market, EP-02 US-0203)
            └─ default: ['Mumbai', 'Dubai', 'Goa']  [RC-12 target: make configurable]
```

### A/B Test Assignment (EP-07 US-0703)

```
User.abGroup field (set on registration)
    │
    ├─ 'personalised'  (80%) → full personalization pipeline
    └─ 'control'       (20%) → cold-start fallback, no notifications
                               activity still tracked for analytics
```

---

## External System Contracts

| External System | Used for | Auth | Failure mode |
|----------------|----------|------|--------------|
| Amadeus API | Flight + hotel search results | OAuth2 client_credentials | Fall back to `flightFallback.js` static data |
| SendGrid | Re-engagement email (medium intent) | API key | Log WARN + skip; never block intent pipeline |
| Stripe | Credit card payments | Secret key | Return 402; not part of personalization |
| Razorpay | UPI / card payments (India) | Key + secret | Return 402; not part of personalization |
| OpenAI API | AI chat assistant | API key | Return 503 for chat; not part of personalization |
| OpenWeather | Weather widget | API key | Widget hides; not part of personalization |
| Mapbox / Google Maps | Map embeds | Access token | Map hides; not part of personalization |
