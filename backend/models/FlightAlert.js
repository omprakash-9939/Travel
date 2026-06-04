const mongoose = require('mongoose');

const flightAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: String,
  to: String,
  targetPrice: Number,
  cabin: { type: String, default: 'economy' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('FlightAlert', flightAlertSchema);
