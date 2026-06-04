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

  // Notifications already sent (to avoid spam)
  sentNotifications: [{
    type:      String,
    sentAt:    Date,
    dismissed: { type: Boolean, default: false }
  }],

  lastCalculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('UserIntentScore', userIntentScoreSchema);
