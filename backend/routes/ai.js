const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const SearchHistory = require('../models/SearchHistory');
const CommunityReport = require('../models/CommunityReport');
const { escapeRegExp } = require('../utils/escapeRegExp');
const FlightAlert = require('../models/FlightAlert');
const User = require('../models/User');
const Flight = require('../models/Flight');
const Hotel = require('../models/Hotel');
const ai = require('../services/ai');

// Scam & safety
router.get('/scam/:destination', async (req, res) => {
  const reports = await CommunityReport.find({ destination: new RegExp(escapeRegExp(req.params.destination), 'i') }).limit(10);
  const intel = ai.getScamIntelligence(req.params.destination);
  res.json({ success: true, intelligence: intel, communityReports: reports });
});

router.post('/scam/report', protect, async (req, res) => {
  const report = await CommunityReport.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, report });
});

// Weather
router.get('/weather/:destination', async (req, res) => {
  const weather = await ai.getWeatherIntelligence(req.params.destination);
  res.json({ success: true, weather });
});

// Geo advisor
router.get('/geo/recommend', async (req, res) => {
  const { country, budget, season, interests } = req.query;
  res.json({
    success: true,
    data: ai.getGeoRecommendations({
      userCountry: country || 'India',
      budget: Number(budget) || 80000,
      season,
      interests: interests ? interests.split(',') : []
    })
  });
});

// Chat assistant
router.post('/chat', optionalAuth, async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });
  const reply = ai.chatAssistant(message, context || {});
  res.json({ success: true, ...reply });
});

// Personalization
router.get('/personalize', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  const searches = await SearchHistory.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
  const feed = ai.getPersonalizedFeed({
    recentSearches: searches.map(s => s.query),
    preferences: user?.travelProfile || user?.preferences
  });
  res.json({ success: true, feed });
});

router.post('/search-history', optionalAuth, async (req, res) => {
  const entry = await SearchHistory.create({
    user: req.user?._id,
    type: req.body.type,
    query: req.body.query,
    sessionId: req.body.sessionId
  });
  res.status(201).json({ success: true, entry });
});

// Trends
router.get('/trends', (req, res) => {
  res.json({ success: true, ...ai.getTrendDiscovery() });
});

// Budget
router.post('/budget/plan', (req, res) => {
  res.json({ success: true, plan: ai.planBudget(req.body) });
});

// Itinerary
router.get('/itinerary/:destination', (req, res) => {
  const days = Number(req.query.days) || 5;
  res.json({ success: true, ...ai.generateItinerary(req.params.destination, days) });
});

// Safety
router.get('/safety/:destination', (req, res) => {
  res.json({ success: true, safety: ai.getSafetyIntelligence(req.params.destination) });
});

// Crowd
router.get('/crowd/:destination', (req, res) => {
  res.json({ success: true, crowd: ai.getCrowdPrediction(req.params.destination) });
});

// Price prediction
router.get('/price/predict', async (req, res) => {
  const { type, from, to, price, date, hotelId } = req.query;
  let currentPrice = Number(price);
  if (!currentPrice && type === 'flight' && from && to) {
    const f = await Flight.findOne({
      'origin.code': from,
      'destination.code': to,
      departure: { $gte: new Date() }
    }).sort({ 'cabins.economy.price': 1 });
    currentPrice = f?.cabins?.economy?.price || 4500;
  }
  if (!currentPrice && hotelId) {
    const h = await Hotel.findById(hotelId);
    currentPrice = h?.roomTypes?.[0]?.price || 3000;
  }
  const prediction = ai.predictPrice({
    type: type || 'flight',
    route: `${from}-${to}`,
    currentPrice: currentPrice || 5000,
    departureDate: date
  });
  res.json({ success: true, prediction });
});

// Companion matching
router.post('/companions/match', protect, (req, res) => {
  const demoPool = [
    { userId: 'demo1', destination: req.body.destination, interests: ['food', 'photography'], displayName: 'Alex' },
    { userId: 'demo2', destination: req.body.destination, interests: ['hiking', 'culture'], displayName: 'Sam' }
  ];
  const matches = ai.matchCompanions({ ...req.body, userId: req.user._id.toString() }, demoPool);
  res.json({ success: true, matches, privacy: 'Opt-in only; no contact shared without mutual consent' });
});

// Local experiences
router.get('/experiences/:destination', (req, res) => {
  res.json({ success: true, ...ai.getLocalExperiences(req.params.destination) });
});

// Carbon
router.post('/carbon', (req, res) => {
  res.json({ success: true, carbon: ai.calculateCarbon(req.body) });
});

// Emergency
router.get('/emergency/:destination', (req, res) => {
  res.json({ success: true, pack: ai.getEmergencyPack(req.params.destination, req.query.nationality) });
});

// Hotel review analysis
router.post('/reviews/analyze', (req, res) => {
  const analysis = ai.analyzeReviewAuthenticity(req.body.reviews || []);
  const scam = ai.getScamIntelligence(req.body.destination || 'unknown', analysis);
  res.json({ success: true, reviewAnalysis: analysis, hotelRisk: scam });
});

// Flight alerts
router.post('/alerts/flight', protect, async (req, res) => {
  const alert = await FlightAlert.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, alert });
});

router.get('/alerts/flight', protect, async (req, res) => {
  const alerts = await FlightAlert.find({ user: req.user._id, active: true });
  res.json({ success: true, alerts });
});

module.exports = router;
