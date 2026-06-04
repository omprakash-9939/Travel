const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/offers - Get all active offers
router.get('/', async (req, res) => {
  try {
    const { type, featured } = req.query;
    const query = { isActive: true, validTill: { $gte: new Date() } };
    if (type && type !== 'all') query.type = type;
    if (featured) query.isFeatured = true;

    const offers = await Offer.find(query).sort({ sortOrder: 1, isFeatured: -1, createdAt: -1 });
    res.json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/offers/validate - Validate coupon
router.post('/validate', protect, async (req, res) => {
  try {
    const { couponCode, bookingAmount, bookingType } = req.body;
    const offer = await Offer.findOne({
      couponCode: couponCode.toUpperCase(),
      isActive: true,
      validTill: { $gte: new Date() }
    });

    if (!offer) return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    if (offer.usageLimit > 0 && offer.usedCount >= offer.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    if (bookingAmount < offer.minBookingAmount) {
      return res.status(400).json({ success: false, message: `Minimum booking amount ₹${offer.minBookingAmount} required` });
    }
    if (offer.type !== 'general' && offer.type !== bookingType) {
      return res.status(400).json({ success: false, message: `Coupon not valid for ${bookingType} bookings` });
    }

    let discount = offer.discountType === 'percentage'
      ? (bookingAmount * offer.discountValue) / 100
      : offer.discountValue;

    if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);

    res.json({ success: true, discount, offer: { title: offer.title, description: offer.description } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/offers - Admin: create offer
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const offer = await Offer.create(req.body);
    res.status(201).json({ success: true, offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
