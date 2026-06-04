const mongoose = require('mongoose');

/**
 * UserPreference — derived, continuously updated profile for each user.
 * This is recomputed by the aggregation job and cached here for fast reads.
 * One document per user (upserted on aggregation).
 */
const userPreferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // ── Destinations ─────────────────────────────────────────────────────────
  favoriteDestinations: [{
    destination: String,
    score: { type: Number, default: 0 },
    lastVisited: Date
  }],

  // ── Airlines ──────────────────────────────────────────────────────────────
  preferredAirlines: [{
    code: String,
    name: String,
    score: { type: Number, default: 0 }
  }],

  // ── Hotel Preferences ─────────────────────────────────────────────────────
  preferredHotelCategories: [{
    category: String,   // e.g. "Luxury", "Budget", "Business", "Resort"
    score:    { type: Number, default: 0 }
  }],
  preferredStarRating: { type: Number, default: 3 }, // average

  // ── Budget ────────────────────────────────────────────────────────────────
  budget: {
    flightMin:  { type: Number, default: 0 },
    flightMax:  { type: Number, default: 50000 },
    flightAvg:  { type: Number, default: 0 },
    hotelMin:   { type: Number, default: 0 },
    hotelMax:   { type: Number, default: 20000 },
    hotelAvg:   { type: Number, default: 0 }
  },

  // ── Trip Characteristics ──────────────────────────────────────────────────
  avgTripDuration:    { type: Number, default: 3 },  // days
  prefersDomestic:    { type: Boolean, default: true },
  preferredCabin:     { type: String, default: 'economy' },

  // ── Activity Counts ───────────────────────────────────────────────────────
  totalSearches:      { type: Number, default: 0 },
  totalViews:         { type: Number, default: 0 },
  totalBookings:      { type: Number, default: 0 },

  // ── Recently Viewed ───────────────────────────────────────────────────────
  recentlyViewedFlights: [{
    flightId:     String,
    flightNumber: String,
    airline:      String,
    origin:       String,
    destination:  String,
    price:        Number,
    viewedAt:     { type: Date, default: Date.now }
  }],
  recentlyViewedHotels: [{
    hotelId:    String,
    hotelName:  String,
    city:       String,
    starRating: Number,
    price:      Number,
    viewedAt:   { type: Date, default: Date.now }
  }],

  // ── Wishlist ──────────────────────────────────────────────────────────────
  wishlist: [{
    type:        { type: String, enum: ['flight', 'hotel'] },
    itemId:      String,
    destination: String,
    price:       Number,
    addedAt:     { type: Date, default: Date.now }
  }],

  lastAggregatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
