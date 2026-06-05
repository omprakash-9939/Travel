const mongoose = require('mongoose');

/**
 * UserActivity — central event log for the personalization engine.
 * Every meaningful user action is stored here and used to derive
 * preferences, intent scores, and recommendations.
 */
const userActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, index: true },

  // Event classification
  eventType: {
    type: String,
    enum: [
      'flight_search',
      'hotel_search',
      'flight_view',
      'hotel_view',
      'booking_started',
      'booking_completed',
      'booking_cancelled',
      'wishlist_added',
      'wishlist_removed',
      'destination_viewed',
      'offer_clicked',
      'page_visit',
      'return_visit'
    ],
    required: true,
    index: true
  },

  // Flexible payload — shape depends on eventType
  metadata: {
    // Shared fields
    destination:  String,   // city or IATA code
    origin:       String,
    price:        Number,
    currency:     { type: String, default: 'INR' },

    // Flight-specific
    airline:      String,
    flightId:     String,
    cabin:        String,
    isDomestic:   Boolean,
    tripDuration: Number,   // days (round-trip)
    flightNumber: String,
    // Time-of-day + fare signals (EP-02 preference signals / EP-09)
    departureHour:   Number,   // 0–23, local
    arrivalHour:     Number,   // 0–23, local
    departureBucket: String,   // red-eye | early-morning | morning | afternoon | evening | night
    arrivalBucket:   String,
    baggage:         String,   // e.g. "15 kg" — fare/baggage preference signal
    refundable:      Boolean,

    // Hotel-specific
    hotelId:      String,
    hotelName:    String,
    starRating:   Number,
    nights:       Number,
    roomType:     String,

    // Booking
    bookingId:    String,
    bookingType:  String,

    // Search
    searchQuery:  mongoose.Schema.Types.Mixed,

    // Page
    page:         String,
    timeOnPage:   Number,   // seconds
  },

  // Intent score contribution for this single event
  intentPoints: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now, index: true, expires: 60 * 60 * 24 * 90 } // TTL: 90 days
}, { timestamps: false });

// Compound indexes for common aggregation queries
userActivitySchema.index({ user: 1, eventType: 1, createdAt: -1 });
userActivitySchema.index({ user: 1, 'metadata.destination': 1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
