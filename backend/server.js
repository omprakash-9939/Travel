const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const flightRoutes = require('./routes/flights');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');
const offerRoutes = require('./routes/offers');
const aiRoutes = require('./routes/ai');
const integrationRoutes = require('./routes/integrations');

const app = express();

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('JWT_SECRET must be set in production');
  process.exit(1);
}

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/integrations', integrationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'DataArt Travel API is running', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`DataArt Travel Server running on port ${PORT}`);
  });
});
