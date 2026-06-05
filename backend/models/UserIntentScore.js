const mongoose = require('mongoose');

/**
 * UserIntentScore — rolling booking intent score (0–100) per user.
 * Recomputed periodically or on significant events.
 * Used to trigger personalized notifications and homepage variants.
 */
const userIntentScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Current total score (capped at 100)
  score: { type: Number, default: 0, min: 0, max: 100 },

  // Human-readable tier
  tier: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },

  // ── Engagement axis (EP-09) ────────────────────────────────────────────────
  // Intent measures purchase READINESS; engagement measures INVOLVEMENT
  // (how active a user is, independent of how close they are to booking).
  // The two axes together drive the notification scenario matrix (EP-06).
  engagementScore: { type: Number, default: 0, min: 0, max: 100 },
  engagementTier:  { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  sessionStats: {
    sessionCount:        { type: Number, default: 0 },
    avgEventsPerSession: { type: Number, default: 0 },
    avgTimeOnPage:       { type: Number, default: 0 }, // seconds
    distinctDestinations:{ type: Number, default: 0 },
    lastActiveAt:        Date
  },
  // Cross-session intent trajectory used by the notification matrix
  trajectory: {
    type: String,
    enum: ['rising', 'stalled', 'falling', 'post-booking', 'new'],
    default: 'new'
  },

  // Breakdown of how score was accumulated (last 30 days)
  breakdown: {
    searches:          { type: Number, default: 0 },
    repeatSearches:    { type: Number, default: 0 },
    views:             { type: Number, default: 0 },
    returnVisits:      { type: Number, default: 0 },
    bookingsStarted:   { type: Number, default: 0 },
    bookingsCompleted: { type: Number, default: 0 },
    wishlistAdds:      { type: Number, default: 0 }
  },

  // The destination the user is most actively planning for
  primaryPlanningDestination: String,

  // Per-destination booking cool-downs (US-0303 / US-0603, RC-5).
  // After a booking we suppress nudges for that destination for a window.
  bookingCooldowns: [{
    destination: String,
    bookedAt:    Date
  }],

  // Notifications already sent (to avoid spam)
  sentNotifications: [{
    type:      String,
    sentAt:    Date,
    dismissed: { type: Boolean, default: false }
  }],

  lastCalculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('UserIntentScore', userIntentScoreSchema);
