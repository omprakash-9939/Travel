const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const integrations = require('../services/integrations');

// GET /api/integrations/status
router.get('/status', (req, res) => {
  res.json({ success: true, integrations: integrations.getIntegrationStatus() });
});

// --- Currency ---
router.get('/currency/rates', async (req, res) => {
  try {
    const base = req.query.base || 'INR';
    const data = await integrations.exchangeRate.getRates(base);
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/currency/convert', async (req, res) => {
  try {
    const { amount, from = 'INR', to = 'USD' } = req.query;
    const { rates } = await integrations.exchangeRate.getRates(from);
    const converted = integrations.exchangeRate.convert(Number(amount), from, to, rates);
    res.json({ success: true, from, to, amount: Number(amount), converted, rates: { [to]: rates[to] } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// --- Maps ---
router.get('/maps/geocode', async (req, res) => {
  try {
    const { q, lat, lng } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'q required' });
    const result = await integrations.resolveMap(q, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
    res.json({ success: true, location: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/maps/static', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });
    const url = integrations.mapbox.staticMapUrl({ lat, lng })
      || integrations.googleMaps.staticMapUrl({ lat, lng });
    res.json({ success: true, url, configured: Boolean(url) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// --- Google Places / Reviews ---
router.get('/places/search', async (req, res) => {
  try {
    const { q, lat, lng } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'q required' });
    const places = await integrations.googlePlaces.textSearch(
      q,
      lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined
    );
    res.json({
      success: true,
      places: places || [],
      configured: integrations.googlePlaces.isConfigured(),
      message: places ? undefined : 'Add GOOGLE_MAPS_API_KEY for live places data'
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/places/attractions/:city', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const places = await integrations.googlePlaces.nearbyAttractions(
      req.params.city,
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined
    );
    res.json({ success: true, attractions: places || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/places/detail/:placeId', async (req, res) => {
  try {
    const details = await integrations.googlePlaces.placeDetails(req.params.placeId);
    if (!details) return res.status(404).json({ success: false, message: 'Place not found or API not configured' });
    res.json({ success: true, place: details });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// --- Payments ---
router.post('/payments/stripe/intent', protect, async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;
    const intent = await integrations.stripePay.createPaymentIntent({ amount, currency, metadata });
    if (!intent) return res.status(503).json({ success: false, message: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env' });
    res.json({
      success: true,
      clientSecret: intent.client_secret,
      publishableKey: integrations.stripePay.publishableKey()
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.post('/payments/stripe/checkout', protect, async (req, res) => {
  try {
    const { amount, currency, successUrl, cancelUrl, metadata } = req.body;
    const session = await integrations.stripePay.createCheckoutSession({
      amount, currency, successUrl, cancelUrl, metadata
    });
    if (!session) return res.status(503).json({ success: false, message: 'Stripe not configured' });
    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.post('/payments/razorpay/order', protect, async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    const order = await integrations.razorpayPay.createOrder({ amount, currency, receipt, notes });
    if (!order) return res.status(503).json({ success: false, message: 'Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET' });
    res.json({
      success: true,
      order,
      keyId: integrations.razorpayPay.keyId()
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.post('/payments/razorpay/verify', protect, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const valid = integrations.razorpayPay.verifyPaymentSignature({ orderId, paymentId, signature });
    res.json({ success: valid, verified: valid });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// --- Notifications ---
router.post('/notifications/email', protect, async (req, res) => {
  try {
    const result = await integrations.sendgrid.sendEmail(req.body);
    res.json({ success: result.sent, ...result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.post('/notifications/sms', protect, async (req, res) => {
  try {
    const result = await integrations.twilio.sendSms(req.body);
    res.json({ success: result.sent, ...result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
