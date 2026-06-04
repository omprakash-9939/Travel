const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['flight', 'hotel', 'holiday', 'bus', 'train'], required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refund_initiated', 'refunded'],
    default: 'pending'
  },
  flight: {
    flightRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight' },
    externalId: String,
    source: { type: String, enum: ['mongodb', 'amadeus', 'demo'], default: 'mongodb' },
    flightNumber: String,
    airline: String,
    origin: String,
    destination: String,
    departure: Date,
    arrival: Date,
    cabin: String,
    pnr: String
  },
  hotel: {
    hotelRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    externalId: String,
    hotelName: String,
    city: String,
    checkIn: Date,
    checkOut: Date,
    roomType: String,
    nights: Number
  },
  passengers: [{
    title: { type: String, enum: ['Mr', 'Mrs', 'Ms', 'Dr', 'Master', 'Miss'] },
    firstName: String,
    lastName: String,
    dob: Date,
    passportNumber: String,
    nationality: String,
    type: { type: String, enum: ['adult', 'child', 'infant'], default: 'adult' }
  }],
  contactInfo: {
    email: String,
    phone: String,
    alternatePhone: String
  },
  pricing: {
    baseFare: Number,
    taxes: Number,
    fees: Number,
    discount: Number,
    couponDiscount: { type: Number, default: 0 },
    total: Number,
    currency: { type: String, default: 'INR' }
  },
  payment: {
    method: String,
    transactionId: String,
    paidAt: Date,
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' }
  },
  couponCode: String,
  addons: [{
    type: String,
    description: String,
    price: Number
  }],
  cancellationReason: String,
  cancelledAt: Date,
  refundAmount: Number,
  notes: String
}, { timestamps: true });

bookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    const prefix = this.type === 'flight' ? 'DTA' : 'DTH';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingId = `${prefix}${Date.now().toString().slice(-6)}${random}`;
  }
  if (this.type === 'flight' && !this.flight?.pnr) {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.flight.pnr = `${(this.flight.airline || 'DT').slice(0, 2).toUpperCase()}${rand}`;
  }
  next();
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
