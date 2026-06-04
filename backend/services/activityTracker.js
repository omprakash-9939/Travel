'use strict';

/**
 * activityTracker — centralized event ingestion + intent score updates.
 */

const UserActivity = require('../models/UserActivity');
const UserIntentScore = require('../models/UserIntentScore');

/**
 * Points per event type (spec weights).
 * Source of truth: features/intent-scoring.feature (US-0302 Scenario Outline)
 * and requirements/stories/EP-03/US-0302. View weights were deliberately
 * lowered from 10 → 3 during discovery: a detail view is a weaker purchase
 * signal than a search or a booking step.
 */
const INTENT_WEIGHTS = {
  flight_search:       5,
  hotel_search:        5,
  flight_view:         3,
  hotel_view:          3,
  return_visit:       15,
  booking_started:    25,
  booking_completed:  50,
  wishlist_added:      5,
  destination_viewed:  5,
  page_visit:          2,
  offer_clicked:       3
};

const REPEAT_SEARCH_BONUS = 10;
const REPEAT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function tierFromScore(score) {
  if (score >= 71) return 'high';
  if (score >= 31) return 'medium';
  return 'low';
}

function breakdownKey(eventType) {
  const map = {
    flight_search: 'searches',
    hotel_search: 'searches',
    flight_view: 'views',
    hotel_view: 'views',
    return_visit: 'returnVisits',
    booking_started: 'bookingsStarted',
    booking_completed: 'bookingsCompleted',
    wishlist_added: 'wishlistAdds'
  };
  return map[eventType] || null;
}

/**
 * Detect repeat search (same destination within 7 days).
 */
async function isRepeatSearch(userId, eventType, metadata) {
  if (!['flight_search', 'hotel_search'].includes(eventType)) return false;
  const dest = metadata.destination || metadata.city;
  if (!dest) return false;

  const since = new Date(Date.now() - REPEAT_WINDOW_MS);
  const prior = await UserActivity.findOne({
    user: userId,
    eventType,
    'metadata.destination': new RegExp(`^${dest}$`, 'i'),
    createdAt: { $gte: since }
  }).lean();
  return Boolean(prior);
}

/**
 * Detect a genuine return visit (US-0105 / RC-3).
 *
 * A return visit means the user comes back in a NEW browser session after a
 * gap. The previous implementation filtered by the *current* sessionId, so it
 * could never see prior sessions and never fired cross-session. We now look at
 * the user's most recent activity in any *other* session.
 */
async function maybeReturnVisit(userId, sessionId) {
  if (!sessionId) return false;
  const last = await UserActivity.findOne({ user: userId, sessionId: { $ne: sessionId } })
    .sort({ createdAt: -1 })
    .lean();
  if (!last) return false;
  const gap = Date.now() - new Date(last.createdAt).getTime();
  return gap > 30 * 60 * 1000;
}

async function updateIntentScore(userId, eventType, extraPoints = 0, destination, isRepeat = false) {
  let intent = await UserIntentScore.findOne({ user: userId });
  const isNew = !intent;
  if (!intent) {
    intent = new UserIntentScore({ user: userId, breakdown: {} });
  }

  const key = breakdownKey(eventType);
  if (key) {
    intent.breakdown[key] = (intent.breakdown[key] || 0) + 1;
  }

  if (isRepeat) {
    intent.breakdown.repeatSearches = (intent.breakdown.repeatSearches || 0) + 1;
  }

  if (eventType === 'booking_completed') {
    // US-0303 (RC-5): completing a booking converts intent. Reset the accumulated
    // planning score and open a cool-down so we stop nudging a user who just booked.
    intent.bookingCooldowns = intent.bookingCooldowns || [];
    if (destination) {
      intent.bookingCooldowns.push({ destination, bookedAt: new Date() });
    }
    // A brand-new user whose first tracked event is a completed booking has no
    // accumulated planning score to reset, so the event weight registers normally.
    intent.score = isNew
      ? Math.min(100, (INTENT_WEIGHTS.booking_completed || 0) + extraPoints)
      : 0;
    intent.tier = tierFromScore(intent.score);
    intent.lastCalculatedAt = new Date();
    await intent.save();
    return intent;
  }

  const points = (INTENT_WEIGHTS[eventType] || 0) + extraPoints;
  intent.score = Math.min(100, (intent.score || 0) + points);
  intent.tier = tierFromScore(intent.score);

  if (destination && ['flight_search', 'hotel_search', 'booking_started'].includes(eventType)) {
    intent.primaryPlanningDestination = destination;
  }

  intent.lastCalculatedAt = new Date();
  await intent.save();
  return intent;
}

/**
 * Core track — persists event and updates intent.
 */
async function track(userId, eventType, metadata = {}, sessionId) {
  const intentPoints = INTENT_WEIGHTS[eventType] || 0;
  let extra = 0;

  // US-0104 / US-0301 (RC-4): booking lifecycle events are idempotent per
  // bookingId. If we've already recorded this exact event for this booking,
  // skip it so the score and counters are never double-counted.
  if (['booking_started', 'booking_completed'].includes(eventType) && metadata.bookingId) {
    const already = await UserActivity.findOne({
      user: userId,
      eventType,
      'metadata.bookingId': metadata.bookingId
    }).lean();
    if (already) return;
  }

  let isRepeat = false;
  if (['flight_search', 'hotel_search'].includes(eventType)) {
    isRepeat = await isRepeatSearch(userId, eventType, metadata);
    if (isRepeat) extra += REPEAT_SEARCH_BONUS;
  }

  if (sessionId && (await maybeReturnVisit(userId, sessionId))) {
    await UserActivity.create({
      user: userId,
      sessionId,
      eventType: 'return_visit',
      metadata: { page: metadata.page },
      intentPoints: INTENT_WEIGHTS.return_visit
    });
    await updateIntentScore(userId, 'return_visit', 0, metadata.destination, false);
  }

  // US-0304 (RC-9): never fall back to origin — origin is where the user leaves
  // from, not where they want to go. An origin-only search has no planning dest.
  const dest = metadata.destination || metadata.city || null;

  await UserActivity.create({
    user: userId,
    sessionId,
    eventType,
    metadata,
    intentPoints: intentPoints + extra
  });

  await updateIntentScore(userId, eventType, extra, dest, isRepeat);
}

// ── Convenience wrappers (used by route handlers) ─────────────────────────

async function trackFlightSearch(userId, meta, sessionId) {
  return track(userId, 'flight_search', meta, sessionId);
}

async function trackHotelSearch(userId, meta, sessionId) {
  return track(userId, 'hotel_search', { ...meta, destination: meta.destination || meta.city }, sessionId);
}

async function trackFlightView(userId, meta, sessionId) {
  // US-0103 (RC-8): a viewed flight always has a cabin. Default to economy when
  // the caller omits it so the cabin-preference profile (US-0202) stays reliable.
  return track(userId, 'flight_view', { ...meta, cabin: meta.cabin || 'economy' }, sessionId);
}

async function trackHotelView(userId, meta, sessionId) {
  return track(userId, 'hotel_view', meta, sessionId);
}

async function trackBookingStart(userId, meta, sessionId) {
  return track(userId, 'booking_started', meta, sessionId);
}

async function trackBookingDone(userId, meta, sessionId) {
  return track(userId, 'booking_completed', meta, sessionId);
}

module.exports = {
  track,
  trackFlightSearch,
  trackHotelSearch,
  trackFlightView,
  trackHotelView,
  trackBookingStart,
  trackBookingDone,
  INTENT_WEIGHTS,
  tierFromScore
};
