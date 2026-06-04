'use strict';

/**
 * activityTracker — centralized event ingestion + intent score updates.
 */

const UserActivity = require('../models/UserActivity');
const UserIntentScore = require('../models/UserIntentScore');

/** Points per event type (spec weights) */
const INTENT_WEIGHTS = {
  flight_search:       5,
  hotel_search:        5,
  flight_view:        10,
  hotel_view:         10,
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
 * First activity in this session after 30+ min gap → return_visit.
 */
async function maybeReturnVisit(userId, sessionId) {
  if (!sessionId) return false;
  const last = await UserActivity.findOne({ user: userId, sessionId })
    .sort({ createdAt: -1 })
    .lean();
  if (!last) return false;
  const gap = Date.now() - new Date(last.createdAt).getTime();
  return gap > 30 * 60 * 1000;
}

async function updateIntentScore(userId, eventType, extraPoints = 0, destination, isRepeat = false) {
  let points = (INTENT_WEIGHTS[eventType] || 0) + extraPoints;

  let intent = await UserIntentScore.findOne({ user: userId });
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

  intent.score = Math.min(100, (intent.score || 0) + points);
  intent.tier = tierFromScore(intent.score);

  if (destination && ['flight_search', 'hotel_search', 'booking_started', 'booking_completed'].includes(eventType)) {
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
  let intentPoints = INTENT_WEIGHTS[eventType] || 0;
  let extra = 0;

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

  const dest = metadata.destination || metadata.city || metadata.origin;

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
  return track(userId, 'flight_view', meta, sessionId);
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
