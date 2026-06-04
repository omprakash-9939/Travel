const mongoose = require('mongoose');

const communityReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  destination: { type: String, required: true },
  category: { type: String, enum: ['scam', 'safety', 'taxi', 'restaurant', 'hotel', 'other'], default: 'scam' },
  title: { type: String, required: true },
  description: String,
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  location: { lat: Number, lng: Number, label: String },
  verified: { type: Boolean, default: false },
  upvotes: { type: Number, default: 0 }
}, { timestamps: true });

communityReportSchema.index({ destination: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityReport', communityReportSchema);
