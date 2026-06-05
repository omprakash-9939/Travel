'use strict';

/**
 * /api/personalization — all personalization endpoints.
 *
 * Routes:
 *  POST  /track                      — ingest a tracking event
 *  GET   /recommendations            — get full recommendation payload
 *  GET   /intent                     — get intent score + tier
 *  GET   /preferences                — get derived preference profile
 *  GET   /recently-viewed            — flights + hotels recently viewed
 *  GET   /notifications              — personalized notifications
 *  PUT   /notifications/:id/dismiss  — dismiss a notification
 *  POST  /wishlist                   — add to wishlist
 *  DELETE /wishlist/:itemId          — remove from wishlist
 *  POST  /preferences/refresh        — manually trigger re-aggregation
 *  GET   /activities                 — recent UserActivity rows (debug read-back)
 */

const express= require('express');
const router= express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const tracker = require('../services/activityTracker');
const { aggregatePreferences } = require('../services/preferenceEngine');
const { getRecommendations, invalidateCache } = require('../services/recommendationEngine');
const notificationEngine = require('../services/notificationEngine');
const UserPreference      = require('../models/UserPreference');
const UserIntentScore     = require('../models/UserIntentScore');
const RecommendationCache = require('../models/RecommendationCache');
const UserActivity = require('../models/UserActivity');

// Events the client is allowed to report. Booking lifecycle + return_visit are
// derived server-side (bookings.js / activityTracker) — accepting them from the
// client would let a request inflate intent or double-count a booking
// (US-0301 / US-0104, RC-4). See architecture/threat-model.md.
const CLIENT_TRACKABLE_EVENTS = new Set([
  'flight_search', 'hotel_search', 'flight_view', 'hotel_view',
  'wishlist_added', 'wishlist_removed', 'destination_viewed',
  'offer_clicked', 'page_visit'
]);

// ── POST /api/personalization/track ─────────────────────────────────────────
router.post('/track', optionalAuth, async (req, res) => {
  try {
    const { eventType, metadata, sessionId } = req.body;
    if (!eventType) return res.status(400).json({ success: false, message: 'eventType is required' });

    // Only track for authenticated users — anonymous tracking is a future extension
    if (!req.user) return res.json({ success: true, tracked: false, reason: 'not authenticated' });

    // Reject server-authoritative event types submitted by the client.
    if (!CLIENT_TRACKABLE_EVENTS.has(eventType)) {
      return res.status(400).json({ success: false, tracked: false, message: `eventType "${eventType}" cannot be reported by the client` });
    }

    await tracker.track(req.user._id, eventType, metadata || {}, sessionId);
    res.json({ success: true, tracked: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/personalization/recommendations ─────────────────────────────────
router.get('/recommendations', protect, async (req, res) => {
  try {
    const data = await getRecommendations(req.user._id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/personalization/intent ─────────────────────────────────────────
router.get('/intent', protect, async (req, res) => {
  try {
    const intent = await UserIntentScore.findOne({ user: req.user._id }).lean();
    res.json({ success: true, intent: intent || { score: 0, tier: 'low', breakdown: {} } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/personalization/scenario ────────────────────────────────────────
// Current Intent × Engagement scenario + both axes (EP-06/EP-09). Drives the
// homepage variant and which notification fires.
router.get('/scenario', protect, async (req, res) => {
  try {
    const intent = await UserIntentScore.findOne({ user: req.user._id }).lean();
    res.json({
      success: true,
      scenario: notificationEngine.selectScenario(intent),
      intentTier: intent?.tier || 'low',
      engagementTier: intent?.engagementTier || 'low',
      trajectory: intent?.trajectory || 'new',
      score: intent?.score || 0,
      engagementScore: intent?.engagementScore || 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/personalization/preferences ────────────────────────────────────
router.get('/preferences', protect, async (req, res) => {
  try {
    let prefs = await UserPreference.findOne({ user: req.user._id }).lean();
    if (!prefs) {
      // Trigger aggregation on first request
      prefs = await aggregatePreferences(req.user._id);
    }
    res.json({ success: true, preferences: prefs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/personalization/recently-viewed ─────────────────────────────────
router.get('/recently-viewed', protect, async (req, res) => {
  try {
    const prefs = await UserPreference.findOne({ user: req.user._id })
      .select('recentlyViewedFlights recentlyViewedHotels')
      .lean();
    res.json({
      success: true,
      flights: prefs?.recentlyViewedFlights || [],
      hotels:  prefs?.recentlyViewedHotels  || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/personalization/notifications ───────────────────────────────────
router.get('/notifications', protect, async (req, res) => {
  try {
    const cache = await RecommendationCache.findOne({ user: req.user._id })
      .select('notifications')
      .lean();
    const notifications = (cache?.notifications || []).filter(n => !n.dismissed);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/personalization/notifications/:id/dismiss ───────────────────────
router.put('/notifications/:id/dismiss', protect, async (req, res) => {
  try {
    await RecommendationCache.updateOne(
      { user: req.user._id, 'notifications.id': req.params.id },
      { $set: { 'notifications.$.dismissed': true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/personalization/wishlist ───────────────────────────────────────
router.post('/wishlist', protect, async (req, res) => {
  try {
    const { type, itemId, destination, price } = req.body;
    await UserPreference.findOneAndUpdate(
      { user: req.user._id },
      {
        $push: {
          wishlist: { $each: [{ itemType: type, itemId, destination, price }], $slice: -50 }
        }
      },
      { upsert: true }
    );
    // Track the event
    await tracker.track(req.user._id, 'wishlist_added', { destination, price });
    // Invalidate recommendation cache so next fetch rebuilds
    await invalidateCache(req.user._id);
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/personalization/wishlist/:itemId ─────────────────────────────
router.delete('/wishlist/:itemId', protect, async (req, res) => {
  try {
    await UserPreference.updateOne(
      { user: req.user._id },
      { $pull: { wishlist: { itemId: req.params.itemId } } }
    );
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/personalization/preferences/refresh ────────────────────────────
router.post('/preferences/refresh', protect, async (req, res) => {
  try {
    const prefs = await aggregatePreferences(req.user._id);
    await invalidateCache(req.user._id);
    const cache = await getRecommendations(req.user._id);
    res.json({ success: true, preferences: prefs, recommendations: cache });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/personalization/activities ─────────────────────────────────────
// Dev/debug read-back of persisted events (own user only).
router.get('/activities', protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 50);
    const activities = await UserActivity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('eventType metadata sessionId intentPoints createdAt')
      .lean();
    res.json({
      success: true,
      activities: activities.map(a => ({
        at: a.createdAt,
        eventType: a.eventType,
        metadata: a.metadata || {},
        sessionId: a.sessionId,
        intentPoints: a.intentPoints ?? 0,
        source: 'server'
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;