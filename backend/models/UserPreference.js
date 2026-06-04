const mongoose = require('mongoose');

const favDestSchema = new mongoose.Schema({
  destination: String,
  score: { type: Number, default: 0 },
  lastVisited: Date
}, { _id: false });

const airlinePrefSchema = new mongoose.Schema({
  code: String,
  name: String,
  score: { type: Number, default: 0 }
}, { _id: false });

const hotelCatSchema = new mongoose.Schema({
  category: String,
  score: { type: Number, default: 0 }
}, { _id: false });

const recentFlightSchema = new mongoose.Schema({
  flightId: String,
  flightNumber: String,
  airline: String,
  origin: String,
  destination: String,
  price: Number,
  viewedAt: { type: Date, default: Date.now }
}, { _id: false });

const recentHotelSchema = new mongoose.Schema({
  hotelId: String,
  hotelName: String,
  city: String,
  starRating: Number,
  price: Number,
  viewedAt: { type: Date, default: Date.now }
}, { _id: false });

const wishlistItemSchema = new mongoose.Schema({
  itemType: { type: String, enum: ['flight', 'hotel'] },
  itemId: String,
  destination: String,
  price: Number,
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

/**
 * UserPreference — derived, continuously updated profile for each user.
 */
const userPreferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  favoriteDestinations: [favDestSchema],
  preferredAirlines: [airlinePrefSchema],
  preferredHotelCategories: [hotelCatSchema],
  preferredStarRating: { type: Number, default: 3 },
  budget: {
    flightMin:  { type: Number, default: 0 },
    flightMax:  { type: Number, default: 50000 },
    flightAvg:  { type: Number, default: 0 },
    hotelMin:   { type: Number, default: 0 },
    hotelMax:   { type: Number, default: 20000 },
    hotelAvg:   { type: Number, default: 0 }
  },
  avgTripDuration:    { type: Number, default: 3 },
  prefersDomestic:    { type: Boolean, default: true },
  preferredCabin:     { type: String, default: 'economy' },
  totalSearches:      { type: Number, default: 0 },
  totalViews:         { type: Number, default: 0 },
  totalBookings:      { type: Number, default: 0 },
  recentlyViewedFlights: [recentFlightSchema],
  recentlyViewedHotels:  [recentHotelSchema],
  wishlist: [wishlistItemSchema],
  lastAggregatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
