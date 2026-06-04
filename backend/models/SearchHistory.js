const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['flight', 'hotel'], required: true },
  query: mongoose.Schema.Types.Mixed,
  sessionId: String
}, { timestamps: true });

searchHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
