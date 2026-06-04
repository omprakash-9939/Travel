const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin', 'agent'], default: 'user' },
  wallet: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  preferences: {
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true }
  },
  travelProfile: {
    homeCountry: { type: String, default: 'India' },
    homeCity: String,
    budgetMin: Number,
    budgetMax: Number,
    preferredAirlines: [String],
    hotelStars: { type: Number, default: 4 },
    favoriteDestinations: [String],
    interests: [String]
  },
  savedPayments: [{
    type: { type: String, enum: ['card', 'upi', 'netbanking'] },
    last4: String,
    brand: String,
    isDefault: Boolean
  }]
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
