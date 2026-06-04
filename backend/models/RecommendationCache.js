const mongoose = require('mongoose');

/**
 * RecommendationCache — per-user cached recommendation results.
 * Rebuilt by the background job every few hours, or invalidated
 * immediately when the user completes a booking / major action.
 */
const recommendationCacheSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // ── Flight Recommendations ────────────────────────────────────────────────
  recommendedFlights: [{
    flightId:       String,
    source:         { type: String, enum: ['mongodb', 'demo'], default: 'mongodb' },
    airline:        String,
    flightNumber:   String,
    origin:         String,
    destination:    String,
    price:          Number,
    departure:      Date,
    cabin:          String,
    score:          Number,   // personalization score
    reason:         String,   // "Because you searched Dubai", etc.
    thumbnail:      String
  }],

  // ── Hotel Recommendations ─────────────────────────────────────────────────
  recommendedHotels: [{
    hotelId:        String,
    source:         { type: String, enum: ['mongodb', 'demo'], default: 'mongodb' },
    hotelName:      String,
    city:           String,
    starRating:     Number,
    userRating:     Number,
    price:          Number,
    score:          Number,
    reason:         String,
    thumbnail:      String
  }],

  // ── Destination Cards ─────────────────────────────────────────────────────
  recommendedDestinations: [{
    name:       String,
    country:    String,
    type:       String,       // Beach, Mountains, Heritage, etc.
    imageUrl:   String,
    reason:     String,
    flightFrom: Number,
    hotelFrom:  Number
  }],

  // ── Continue Planning ─────────────────────────────────────────────────────
  continuePlanning: [{
    destination:  String,
    lastSearched: Date,
    searchType:   { type: String, enum: ['flight', 'hotel'] },
    searchQuery:  mongoose.Schema.Types.Mixed
  }],

  // ── Personalized Notifications ────────────────────────────────────────────
  notifications: [{
    id:        String,
    type:      String,        // price_drop, selling_fast, new_deal, return_reminder
    title:     String,
    message:   String,
    ctaLabel:  String,
    ctaUrl:    String,
    priority:  { type: Number, default: 0 },
    dismissed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],

  // Cache validity
  validUntil: { type: Date, default: () => new Date(Date.now() + 6 * 60 * 60 * 1000) }, // 6h TTL
  builtAt:    { type: Date, default: Date.now }
}, { timestamps: true });

recommendationCacheSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RecommendationCache', recommendationCacheSchema);
