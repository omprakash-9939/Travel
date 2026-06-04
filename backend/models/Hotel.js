const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  starRating: { type: Number, min: 1, max: 5, required: true },
  userRating: { type: Number, min: 0, max: 10, default: 0 },
  reviewCount: { type: Number, default: 0 },
  location: {
    city: { type: String, required: true },
    state: String,
    country: { type: String, default: 'India' },
    address: String,
    landmark: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  images: [String],
  thumbnail: String,
  amenities: [{
    category: String,
    items: [String]
  }],
  roomTypes: [{
    name: { type: String, required: true },
    description: String,
    maxOccupancy: { type: Number, required: true },
    price: { type: Number, required: true },
    available: { type: Number, default: 0 },
    images: [String],
    inclusions: [String]
  }],
  policies: {
    checkIn: { type: String, default: '12:00 PM' },
    checkOut: { type: String, default: '11:00 AM' },
    cancellation: String,
    petFriendly: { type: Boolean, default: false }
  },
  tags: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

hotelSchema.index({ 'location.city': 1, starRating: -1, userRating: -1 });

module.exports = mongoose.model('Hotel', hotelSchema);
