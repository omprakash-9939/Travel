// const express = require('express');
// const router = express.Router();
// const Booking = require('../models/Booking');
// const Flight = require('../models/Flight');
// const Hotel = require('../models/Hotel');
// const { protect } = require('../middleware/auth');
// const { normalizeCabin } = require('../utils/cabin');
// const {
//   isMongoObjectId,
//   sanitizeFlightForBooking,
//   sanitizeHotelForBooking,
//   normalizePassengers
// } = require('../utils/bookingHelpers');
// const { notifyBookingConfirmation } = require('../services/integrations');

// // POST /api/bookings - Create booking
// router.post('/', protect, async (req, res) => {
//   try {
//     const { flight: flightBody, hotel: hotelBody, item, ...rest } = req.body;
//     const bookingData = {
//       ...rest,
//       user: req.user._id,
//       passengers: normalizePassengers(rest.passengers)
//     };

//     if (rest.type === 'flight') {
//       bookingData.flight = sanitizeFlightForBooking(flightBody || {}, item || {});
//     }
//     if (rest.type === 'hotel') {
//       bookingData.hotel = sanitizeHotelForBooking(hotelBody || {}, item || {});
//     }

//     const booking = await Booking.create(bookingData);

//     // Reduce available seats only for MongoDB-stored flights
//     if (booking.type === 'flight' && booking.flight?.flightRef && isMongoObjectId(booking.flight.flightRef)) {
//       const cabin = normalizeCabin(booking.flight.cabin);
//       await Flight.findByIdAndUpdate(
//         booking.flight.flightRef,
//         { $inc: { [`cabins.${cabin}.available`]: -booking.passengers.length } }
//       );
//     }

//     if (booking.type === 'hotel' && booking.hotel?.hotelRef && isMongoObjectId(booking.hotel.hotelRef) && booking.hotel?.roomType) {
//       await Hotel.findOneAndUpdate(
//         { _id: booking.hotel.hotelRef, 'roomTypes.name': booking.hotel.roomType },
//         { $inc: { 'roomTypes.$.available': -1 } }
//       );
//     }

//     await booking.populate('user', 'name email phone');

//     const notifications = await notifyBookingConfirmation(booking, booking.contactInfo).catch(() => ({}));

//     res.status(201).json({ success: true, booking, notifications });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// });

// // GET /api/bookings/my - Get user's bookings
// router.get('/my', protect, async (req, res) => {
//   try {
//     const { status, type, page = 1, limit = 10 } = req.query;
//     const query = { user: req.user._id };
//     if (status) query.status = status;
//     if (type) query.type = type;

//     const skip = (Number(page) - 1) * Number(limit);
//     const bookings = await Booking.find(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     const total = await Booking.countDocuments(query);

//     res.json({ success: true, bookings, total, pages: Math.ceil(total / Number(limit)) });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // GET /api/bookings/:id
// router.get('/:id', protect, async (req, res) => {
//   try {
//     const booking = await Booking.findOne({
//       $or: [{ _id: req.params.id }, { bookingId: req.params.id }],
//       user: req.user._id
//     });
//     if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
//     res.json({ success: true, booking });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // PUT /api/bookings/:id/cancel
// router.put('/:id/cancel', protect, async (req, res) => {
//   try {
//     const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
//     if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

//     if (['cancelled', 'completed'].includes(booking.status)) {
//       return res.status(400).json({ success: false, message: `Booking already ${booking.status}` });
//     }

//     // Calculate refund
//     const cancellationTime = Date.now();
//     let refundPercentage = 100;
//     if (booking.type === 'flight' && booking.flight?.departure) {
//       const hoursBeforeDeparture = (new Date(booking.flight.departure) - cancellationTime) / (1000 * 60 * 60);
//       if (hoursBeforeDeparture < 2) refundPercentage = 0;
//       else if (hoursBeforeDeparture < 24) refundPercentage = 25;
//       else if (hoursBeforeDeparture < 48) refundPercentage = 50;
//     }

//     const refundAmount = (booking.pricing.total * refundPercentage) / 100;

//     booking.status = 'cancelled';
//     booking.cancellationReason = req.body.reason || 'Customer requested cancellation';
//     booking.cancelledAt = new Date();
//     booking.refundAmount = refundAmount;
//     booking.payment.status = refundAmount > 0 ? 'refunded' : booking.payment.status;

//     await booking.save();
//     res.json({ success: true, booking, refundAmount, message: `Booking cancelled. Refund of ₹${refundAmount} will be processed.` });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const Hotel = require('../models/Hotel');
const { protect } = require('../middleware/auth');
const { normalizeCabin } = require('../utils/cabin');
const {
  isMongoObjectId,
  sanitizeFlightForBooking,
  sanitizeHotelForBooking,
  normalizePassengers
} = require('../utils/bookingHelpers');
const { notifyBookingConfirmation } = require('../services/integrations');
// ── Personalization: activity tracker + cache invalidation ─────────────────
const tracker = require('../services/activityTracker');
const { invalidateCache } = require('../services/recommendationEngine');
const { aggregatePreferences } = require('../services/preferenceEngine');

// POST /api/bookings — Create booking
router.post('/', protect, async (req, res) => {
  try {
    const { flight: flightBody, hotel: hotelBody, item, ...rest } = req.body;
    const bookingData = {
      ...rest,
      user: req.user._id,
      passengers: normalizePassengers(rest.passengers)
    };

    if (rest.type === 'flight') {
      bookingData.flight = sanitizeFlightForBooking(flightBody || {}, item || {});
    }
    if (rest.type === 'hotel') {
      bookingData.hotel = sanitizeHotelForBooking(hotelBody || {}, item || {});
    }

    // ── Track booking_started ───────────────────────────────────────────────
    const startMeta = rest.type === 'flight'
      ? { destination: bookingData.flight?.destination, price: rest.pricing?.total, bookingType: 'flight', airline: bookingData.flight?.airline }
      : { destination: bookingData.hotel?.city, price: rest.pricing?.total, bookingType: 'hotel' };
    tracker.trackBookingStart(req.user._id, startMeta, req.headers['x-session-id']);

    const booking = await Booking.create(bookingData);

    // Reduce available seats only for MongoDB-stored flights
    if (booking.type === 'flight' && booking.flight?.flightRef && isMongoObjectId(booking.flight.flightRef)) {
      const cabin = normalizeCabin(booking.flight.cabin);
      await Flight.findByIdAndUpdate(
        booking.flight.flightRef,
        { $inc: { [`cabins.${cabin}.available`]: -booking.passengers.length } }
      );
    }

    if (booking.type === 'hotel' && booking.hotel?.hotelRef && isMongoObjectId(booking.hotel.hotelRef) && booking.hotel?.roomType) {
      await Hotel.findOneAndUpdate(
        { _id: booking.hotel.hotelRef, 'roomTypes.name': booking.hotel.roomType },
        { $inc: { 'roomTypes.$.available': -1 } }
      );
    }

    await booking.populate('user', 'name email phone');

    const notifications = await notifyBookingConfirmation(booking, booking.contactInfo).catch(() => ({}));

    // ── Track booking_completed + refresh preferences ───────────────────────
    const doneMeta = {
      bookingId:   booking.bookingId,
      bookingType: booking.type,
      destination: booking.type === 'flight' ? booking.flight?.destination : booking.hotel?.city,
      price:       booking.pricing?.total,
      airline:     booking.flight?.airline,
      nights:      booking.hotel?.nights
    };
    tracker.trackBookingDone(req.user._id, doneMeta, req.headers['x-session-id']);

    // Rebuild preferences + invalidate cache (async, non-blocking)
    aggregatePreferences(req.user._id)
      .then(() => invalidateCache(req.user._id))
      .catch(err => console.error('[Personalization] Post-booking refresh failed:', err.message));

    res.status(201).json({ success: true, booking, notifications });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/bookings/my
router.get('/my', protect, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const bookings = await Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    const total = await Booking.countDocuments(query);

    res.json({ success: true, bookings, total, pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/bookings/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      $or: [{ _id: req.params.id }, { bookingId: req.params.id }],
      user: req.user._id
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Booking already ${booking.status}` });
    }

    const cancellationTime = Date.now();
    let refundPercentage = 100;
    if (booking.type === 'flight' && booking.flight?.departure) {
      const hoursBeforeDeparture = (new Date(booking.flight.departure) - cancellationTime) / (1000 * 60 * 60);
      if (hoursBeforeDeparture < 2) refundPercentage = 0;
      else if (hoursBeforeDeparture < 24) refundPercentage = 25;
      else if (hoursBeforeDeparture < 48) refundPercentage = 50;
    }

    const refundAmount = (booking.pricing.total * refundPercentage) / 100;
    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Customer requested cancellation';
    booking.cancelledAt = new Date();
    booking.refundAmount = refundAmount;
    booking.payment.status = refundAmount > 0 ? 'refunded' : booking.payment.status;

    await booking.save();

    // Track cancellation
    tracker.track(req.user._id, 'booking_cancelled', {
      bookingId:   booking.bookingId,
      bookingType: booking.type,
      destination: booking.type === 'flight' ? booking.flight?.destination : booking.hotel?.city
    });

    res.json({ success: true, booking, refundAmount, message: `Booking cancelled. Refund of ₹${refundAmount} will be processed.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

