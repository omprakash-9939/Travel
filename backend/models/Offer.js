const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  couponCode: { type: String, uppercase: true, unique: true },
  type: { type: String, enum: ['flight', 'hotel', 'bus', 'holiday', 'cab', 'bank', 'general'], default: 'general' },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  maxDiscount: Number,
  minBookingAmount: { type: Number, default: 0 },
  image: String,
  tag: String,
  validFrom: { type: Date, default: Date.now },
  validTill: { type: Date, required: true },
  usageLimit: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  applicableFor: { type: String, enum: ['all', 'new_user', 'logged_in'], default: 'all' },
  terms: [String],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
