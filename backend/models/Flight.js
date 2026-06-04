const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  flightNumber: { type: String, required: true, uppercase: true },
  airline: {
    name: { type: String, required: true },
    code: { type: String, required: true },
    logo: String
  },
  origin: {
    city: { type: String, required: true },
    airport: { type: String, required: true },
    code: { type: String, required: true, uppercase: true },
    country: { type: String, default: 'India' }
  },
  destination: {
    city: { type: String, required: true },
    airport: { type: String, required: true },
    code: { type: String, required: true, uppercase: true },
    country: { type: String, default: 'India' }
  },
  departure: { type: Date, required: true },
  arrival: { type: Date, required: true },
  duration: { type: Number }, // in minutes
  stops: { type: Number, default: 0 },
  stopDetails: [{
    airport: String,
    city: String,
    duration: Number
  }],
  cabins: {
    economy: {
      available: { type: Number, default: 0 },
      price: { type: Number, required: true },
      baggage: { type: String, default: '15 kg' }
    },
    premiumEconomy: {
      available: { type: Number, default: 0 },
      price: Number,
      baggage: { type: String, default: '25 kg' }
    },
    business: {
      available: { type: Number, default: 0 },
      price: Number,
      baggage: { type: String, default: '35 kg' }
    },
    first: {
      available: { type: Number, default: 0 },
      price: Number,
      baggage: { type: String, default: '40 kg' }
    }
  },
  amenities: [String],
  refundable: { type: Boolean, default: false },
  status: { type: String, enum: ['scheduled', 'delayed', 'cancelled', 'completed'], default: 'scheduled' },
  isDomestic: { type: Boolean, default: true }
}, { timestamps: true });

flightSchema.virtual('durationFormatted').get(function () {
  const h = Math.floor(this.duration / 60);
  const m = this.duration % 60;
  return `${h}h ${m}m`;
});

flightSchema.index({ 'origin.code': 1, 'destination.code': 1, departure: 1 });

module.exports = mongoose.model('Flight', flightSchema);
