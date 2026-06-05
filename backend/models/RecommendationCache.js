const mongoose = require('mongoose');

const flightRecSchema = new mongoose.Schema({
  flightId:       String,
  source:         { type: String, enum: ['mongodb', 'demo'], default: 'mongodb' },
  airline:        String,
  flightNumber:   String,
  origin:         String,
  destination:    String,
  price:          Number,
  departure:      Date,
  cabin:          String,
  score:          Number,
  reason:         String,
  thumbnail:      String
}, { _id: false });

const hotelRecSchema = new mongoose.Schema({
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
}, { _id: false });

const destinationCardSchema = new mongoose.Schema({
  name:       String,
  country:    String,
  type:       String,
  imageUrl:   String,
  reason:     String,
  flightFrom: Number,
  hotelFrom:  Number
}, { _id: false });

const continuePlanningSchema = new mongoose.Schema({
  destination:  String,
  lastSearched: Date,
  searchType:   { type: String, enum: ['flight', 'hotel'] },
  searchQuery:  mongoose.Schema.Types.Mixed
}, { _id: false });

const notificationSchema = new mongoose.Schema({
  id:        String,
  type:      String,
  title:     String,
  message:   String,
  ctaLabel:  String,
  ctaUrl:    String,
  priority:  { type: Number, default: 0 },
  dismissed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

/**
 * RecommendationCache — per-user cached recommendation results.
 */
const recommendationCacheSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  recommendedFlights:      [flightRecSchema],
  recommendedHotels:       [hotelRecSchema],
  recommendedDestinations:   [destinationCardSchema],
  continuePlanning:        [continuePlanningSchema],
  notifications:           [notificationSchema],
  // EP-06: the Intent × Engagement scenario this payload was built for
  scenario:                String,
  validUntil: { type: Date, default: () => new Date(Date.now() + 6 * 60 * 60 * 1000) },
  builtAt:    { type: Date, default: Date.now }
}, { timestamps: true });

recommendationCacheSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RecommendationCache', recommendationCacheSchema);
