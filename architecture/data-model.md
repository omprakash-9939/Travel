# Data Model — DataArt Travel Personalization Engine

Key entities, relationships, and the indexes that keep personalization queries fast.

---

## Entity Relationship Overview

```
User ──────────┬──────── UserActivity (event log)
               ├──────── UserIntentScore (real-time intent state)
               ├──────── UserPreference (90-day aggregated profile)
               ├──────── RecommendationCache (6-hr ranked cache)
               └──────── Booking ──── Flight / Hotel
```

---

## Core Personalization Entities

### `User`

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Primary key |
| `email` | String | Unique; used for SendGrid |
| `password` | String | bcrypt hash |
| `name` | String | Display name |
| `role` | String | `'user'` \| `'admin'` |
| `abGroup` | String | `'personalised'` \| `'control'` — set on registration (EP-07) |
| `abGroupAssignedAt` | Date | Timestamp of A/B assignment — gate for 30-day reporting |
| `createdAt` | Date | Mongoose timestamps |

**Indexes:** `email` (unique)

---

### `UserActivity`

The event log. One document per tracked event. Immutable after creation.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | — |
| `user` | ObjectId (ref: User) | **Always present; all queries filter by this** |
| `sessionId` | String | Browser session identifier; used for cross-session detection |
| `eventType` | String | `flight_search` \| `hotel_search` \| `flight_view` \| `hotel_view` \| `return_visit` \| `booking_started` \| `booking_completed` \| `wishlist_added` \| `destination_viewed` \| `page_visit` \| `offer_clicked` |
| `metadata` | Object | Event-specific payload (see below) |
| `intentPoints` | Number | Points awarded for this event (snapshot) |
| `createdAt` | Date | Auto-set by Mongoose |

**Metadata shape by event type:**

```
flight_search:    { origin, destination, departureDate, returnDate, cabin, adults, price? }
hotel_search:     { destination, city, checkIn, checkOut, guests, price? }
flight_view:      { flightId, flightNumber, airline, origin, destination, cabin, price, isDomestic }
hotel_view:       { hotelId, hotelName, destination, city, starRating, price }
booking_started:  { bookingType, destination, price }
booking_completed:{ bookingId, bookingType, destination, price }
wishlist_added:   { itemType, itemId, destination }
return_visit:     { page }
```

**Indexes:**
- `{ user: 1, createdAt: -1 }` — compound; **required** for 90-day preference queries
- `{ user: 1, sessionId: 1 }` — cross-session return-visit detection
- `{ user: 1, eventType: 1, createdAt: -1 }` — repeat-search check

---

### `UserIntentScore`

Real-time intent state. One document per user. Updated on every `track()` call.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | — |
| `user` | ObjectId (ref: User) | Unique |
| `score` | Number | 0–100 cumulative score |
| `tier` | String | `'low'` \| `'medium'` \| `'high'` |
| `primaryPlanningDestination` | String | Derived from latest search/booking destination |
| `breakdown` | Object | `{ searches, views, returnVisits, bookingsStarted, bookingsCompleted, wishlistAdds, repeatSearches }` |
| `sentNotifications` | Array | `[{ type, sentAt }]` — dedup window (48h for in-app, 7d for email) |
| `bookingCooldowns` | Array | `[{ destination, bookedAt }]` — suppress notifications post-booking |
| `emailSentLog` | Array | `[{ destination, sentAt, type }]` — 7-day re-engagement email dedup |
| `lastCalculatedAt` | Date | Updated on each score change |

**Intent weights (configured in `activityTracker.js::INTENT_WEIGHTS`):**

```js
{
  flight_search:      5,
  hotel_search:       5,
  flight_view:       10,
  hotel_view:        10,
  return_visit:      15,
  booking_started:   25,
  booking_completed: 50,
  wishlist_added:     5,
  destination_viewed: 5,
  page_visit:         2,
  offer_clicked:      3
}
// repeat_search_bonus: +10 (same dest within 7 days)
```

**Tier thresholds:** low < 31, medium 31–70, high ≥ 71
*(Unvalidated estimates A-2; calibrate from EP-08 US-0803 data after 30 days)*

**Indexes:** `{ user: 1 }` (unique)

---

### `UserPreference`

90-day aggregated preference profile. Updated by `preferenceEngine.aggregatePreferences()` every 2 hours (batch).

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | — |
| `user` | ObjectId (ref: User) | Unique |
| `favoriteDestinations` | Array | `[{ destination, score, lastVisited }]` — top 10, sorted by score desc |
| `preferredAirlines` | Array | `[{ code, name, score }]` — top 8 |
| `preferredHotelCategories` | Array | `[{ category, score }]` — `Luxury/Business/Comfort/Budget` |
| `preferredCabin` | String | `'economy'` \| `'business'` \| `'first'` |
| `preferredStarRating` | Number | Avg star rating of viewed hotels |
| `budget` | Object | `{ flightMin, flightMax, flightAvg, hotelMin, hotelMax, hotelAvg }` |
| `avgTripDuration` | Number | Days |
| `prefersDomestic` | Boolean | Domestic vs international preference |
| `recentlyViewedFlights` | Array | Last 10 flight views |
| `recentlyViewedHotels` | Array | Last 10 hotel views |
| `wishlist` | Array | Saved items |
| `totalSearches` | Number | Analytics counter |
| `totalViews` | Number | Analytics counter |
| `totalBookings` | Number | Analytics counter |
| `lastAggregatedAt` | Date | Staleness indicator |

**Destination scoring weights:**
- `flight_search` / `hotel_search` → +3 per occurrence
- `flight_view` / `hotel_view` → +2 per occurrence
- `booking_confirmed` / `booking_completed` → +8 per occurrence

**Indexes:** `{ user: 1 }` (unique)

---

### `RecommendationCache`

Pre-built ranked recommendations for a user. Built by `recommendationEngine.buildRecommendations()`.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | — |
| `user` | ObjectId (ref: User) | Unique |
| `recommendedFlights` | Array | Top 8 ranked flight objects |
| `recommendedHotels` | Array | Top 8 ranked hotel objects |
| `recommendedDestinations` | Array | Up to 6 destination cards |
| `continuePlanning` | Array | Last 5 searches for "Continue Planning" card |
| `notifications` | Array | Generated notifications (sorted by priority) |
| `builtAt` | Date | Build timestamp |
| `validUntil` | Date | TTL = `builtAt + 6h` |

**Cache invalidation triggers:**
- `booking_completed` event → `invalidateCache(userId)` called immediately
- `validUntil` expires → next `getRecommendations()` call triggers rebuild

**Notification dedup window:** 48 hours per `type` (via `UserIntentScore.sentNotifications`).

**Indexes:** `{ user: 1 }` (unique), `{ validUntil: 1 }` (TTL index if MongoDB TTL is used)

---

## Secondary Entities

### `Booking`

| Field | Type | Notes |
|-------|------|-------|
| `user` | ObjectId (ref: User) | |
| `type` | String | `'flight'` \| `'hotel'` |
| `status` | String | `'pending'` \| `'confirmed'` \| `'completed'` \| `'cancelled'` |
| `flight` | Object | `{ flightId, airline, origin, destination, ... }` |
| `hotel` | Object | `{ hotelId, name, city, nights, ... }` |
| `pricing` | Object | `{ total, currency }` |
| `createdAt` | Date | |

Used by `preferenceEngine` (booking weight +8) and `getDestinationPopularity()` (90-day booking count).

---

### `Flight` / `Hotel`

MongoDB documents representing available inventory. Queried directly by `recommendationEngine` for ranking.

`Flight` key fields: `airline.code`, `airline.name`, `origin.city`, `destination.city`, `departure`, `cabins.economy.price`, `cabins.business.price`, `status`.

`Hotel` key fields: `name`, `location.city`, `starRating`, `userRating`, `roomTypes[].price`, `isActive`.

---

## Aggregation Queries

### 90-day preference aggregation (preferenceEngine)
```js
UserActivity.find({ user: uid, createdAt: { $gte: since } })
  // Uses compound index (user, createdAt)
```

### Cross-session return-visit detection (target fix FN-010501)
```js
UserActivity.findOne({
  user: userId,
  sessionId: { $ne: currentSessionId },
  createdAt: { $lt: new Date(now - 30 * 60 * 1000) }
}).sort({ createdAt: -1 })
  // Uses compound index (user, sessionId)
```

### Destination popularity (recommendationEngine)
```js
Booking.aggregate([
  { $match: { createdAt: { $gte: 90daysAgo }, status: { $in: ['confirmed', 'completed'] } } },
  { $group: { _id: '$flight.destination' || '$hotel.city', count: { $sum: 1 } } }
])
```

---

## Index Checklist

| Collection | Index | Purpose | Status |
|-----------|-------|---------|--------|
| `UserActivity` | `{ user: 1, createdAt: -1 }` | 90-day aggregation query | Exists (per FN-010501 notes) |
| `UserActivity` | `{ user: 1, sessionId: 1 }` | Cross-session return-visit | Verify exists |
| `UserActivity` | `{ user: 1, eventType: 1, createdAt: -1 }` | Repeat-search check | Verify exists |
| `UserIntentScore` | `{ user: 1 }` unique | Intent upsert | Verify exists |
| `UserPreference` | `{ user: 1 }` unique | Preference upsert | Verify exists |
| `RecommendationCache` | `{ user: 1 }` unique | Cache lookup | Verify exists |
| `Booking` | `{ user: 1, createdAt: -1 }` | Preference booking weight | Verify exists |
