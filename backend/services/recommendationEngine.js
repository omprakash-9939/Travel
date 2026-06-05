'use strict';

/**
 * recommendationEngine — builds cached recommendations, ranking, notifications.
 */

const mongoose = require('mongoose');
const Flight = require('../models/Flight');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const UserPreference = require('../models/UserPreference');
const UserIntentScore = require('../models/UserIntentScore');
const RecommendationCache = require('../models/RecommendationCache');
const UserActivity = require('../models/UserActivity');
const { aggregatePreferences } = require('./preferenceEngine');
const notificationEngine = require('./notificationEngine');
const { TRENDING } = require('./ai/destinationData');
const { escapeRegExp } = require('../utils/escapeRegExp');

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const DESTINATION_META = {
  Dubai:   { country: 'UAE', type: 'City',       imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80' },
  Goa:     { country: 'India', type: 'Beach',    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80' },
  Bali:    { country: 'Indonesia', type: 'Beach', imageUrl: 'https://images.unsplash.com/photo-1537996194121-4ca7c43a6c68?w=600&q=80' },
  Bangkok: { country: 'Thailand', type: 'City',  imageUrl: 'https://images.unsplash.com/photo-1563492065-5063c852761f?w=600&q=80' },
  Jaipur:  { country: 'India', type: 'Heritage', imageUrl: 'https://images.unsplash.com/photo-1599669301854-0d309a2a24d0?w=600&q=80' },
  Mumbai:  { country: 'India', type: 'City',     imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80' },
  Delhi:   { country: 'India', type: 'Heritage', imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80' },
  Singapore: { country: 'Singapore', type: 'City', imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80' },
  London:  { country: 'UK', type: 'Heritage',    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80' },
  Vietnam: { country: 'Vietnam', type: 'Adventure', imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae9b?w=600&q=80' }
};

const BEACH_DESTINATIONS = new Set(['Goa', 'Bali', 'Phuket', 'Maldives', 'Chennai', 'Kochi']);

/** Popularity: booking count by destination (last 90 days) */
async function getDestinationPopularity() {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const rows = await Booking.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $in: ['confirmed', 'completed'] } } },
    {
      $group: {
        _id: { $ifNull: ['$flight.destination', '$hotel.city'] },
        count: { $sum: 1 }
      }
    }
  ]);
  const map = {};
  let max = 1;
  for (const r of rows) {
    if (!r._id) continue;
    map[r._id] = r.count;
    if (r.count > max) max = r.count;
  }
  return { map, max };
}

function normalizePopularity(popMap, max, destination) {
  const c = popMap[destination] || 0;
  return (c / max) * 100;
}

function budgetMatchScore(price, min, max, avg) {
  if (!price || !max) return 50;
  const target = avg || (min + max) / 2;
  const diff = Math.abs(price - target);
  const range = Math.max(max - min, 1);
  return Math.max(0, 100 - (diff / range) * 100);
}

function preferenceDestScore(flight, prefs) {
  const dest = flight.destination?.city || flight.destination?.code;
  const hit = prefs?.favoriteDestinations?.find(
    d => d.destination?.toLowerCase() === String(dest).toLowerCase()
  );
  return hit ? Math.min(100, hit.score * 10) : 20;
}

function preferenceAirlineScore(flight, prefs) {
  const code = flight.airline?.code;
  const name = flight.airline?.name;
  const hit = prefs?.preferredAirlines?.find(
    a => a.code === code || a.name === name
  );
  return hit ? Math.min(100, hit.score * 15) : 30;
}

function ratingScoreFlight(flight) {
  return flight.refundable ? 75 : 60;
}

function ratingScoreHotel(hotel) {
  const r = hotel.userRating || hotel.starRating * 2 || 6;
  return Math.min(100, r * 10);
}

function trendScore(destination) {
  const t = TRENDING.find(x => destination?.toLowerCase().includes(x.destination.toLowerCase()));
  return t ? 80 : 40;
}

/**
 * Composite ranking: 40% pref, 20% popularity, 15% ratings, 15% budget, 10% trends
 */
function rankFlight(flight, prefs, popMap, popMax) {
  const price = flight.cabins?.economy?.price || flight.cabins?.[prefs?.preferredCabin || 'economy']?.price || 0;
  const dest = flight.destination?.city;

  const pref = (preferenceDestScore(flight, prefs) + preferenceAirlineScore(flight, prefs)) / 2;
  const pop = normalizePopularity(popMap, popMax, dest);
  const rating = ratingScoreFlight(flight);
  const budget = budgetMatchScore(price, prefs?.budget?.flightMin, prefs?.budget?.flightMax, prefs?.budget?.flightAvg);
  const trend = trendScore(dest);

  const score = pref * 0.4 + pop * 0.2 + rating * 0.15 + budget * 0.15 + trend * 0.1;
  return { score: Math.round(score * 10) / 10, price };
}

function rankHotel(hotel, prefs, popMap, popMax) {
  const price = hotel.roomTypes?.[0]?.price || hotel.minPricePerNight || 0;
  const city = hotel.location?.city;
  const cat = hotel.starRating >= 5 ? 'Luxury' : hotel.starRating >= 4 ? 'Business' : 'Comfort';
  const catPref = prefs?.preferredHotelCategories?.find(c => c.category === cat);

  const pref = (prefs?.favoriteDestinations?.find(d => d.destination === city)?.score || 0) * 10
    + (catPref?.score || 0) * 15;
  const prefNorm = Math.min(100, pref || 25);
  const pop = normalizePopularity(popMap, popMax, city);
  const rating = ratingScoreHotel(hotel);
  const budget = budgetMatchScore(price, prefs?.budget?.hotelMin, prefs?.budget?.hotelMax, prefs?.budget?.hotelAvg);
  const trend = trendScore(city);

  const score = prefNorm * 0.4 + pop * 0.2 + rating * 0.15 + budget * 0.15 + trend * 0.1;
  return { score: Math.round(score * 10) / 10, price };
}

function reasonForFlight(flight, prefs) {
  const dest = flight.destination?.city;
  const fav = prefs?.favoriteDestinations?.[0]?.destination;
  if (fav && dest && fav.toLowerCase() === dest.toLowerCase()) {
    return `Because you searched ${fav}`;
  }
  if (prefs?.preferredAirlines?.[0]?.name === flight.airline?.name) {
    return `Preferred airline: ${flight.airline.name}`;
  }
  return 'Recommended based on your travel patterns';
}

function reasonForHotel(hotel, prefs) {
  const city = hotel.location?.city;
  const cat = prefs?.preferredHotelCategories?.[0]?.category;
  if (cat) return `${cat} stays in ${city}`;
  return `Popular hotels in ${city}`;
}

async function buildContinuePlanning(userId, prefs) {
  const searches = await UserActivity.find({
    user: userId,
    eventType: { $in: ['flight_search', 'hotel_search'] }
  }).sort({ createdAt: -1 }).limit(5).lean();

  return searches.map(s => ({
    destination: s.metadata?.destination || s.metadata?.city || 'Unknown',
    lastSearched: s.createdAt,
    searchType: s.eventType === 'flight_search' ? 'flight' : 'hotel',
    searchQuery: s.metadata?.searchQuery || {
      from: s.metadata?.origin,
      to: s.metadata?.destination,
      date: s.metadata?.searchQuery?.date,
      city: s.metadata?.destination
    }
  }));
}

const NOTIF_RESEND_WINDOW_MS = 48 * 60 * 60 * 1000; // don't resend same type within 48h
const BOOKING_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // suppress nudges 7 days post-booking

function recentlySent(intent, type) {
  if (!intent?.sentNotifications?.length) return false;
  const cutoff = Date.now() - NOTIF_RESEND_WINDOW_MS;
  return intent.sentNotifications.some(n => n.type === type && new Date(n.sentAt).getTime() > cutoff);
}

/**
 * US-0603 (RC-5): true when the destination was booked within the cool-down
 * window. We must not nudge a user about a trip they already booked.
 */
function inBookingCooldown(intent, destination) {
  if (!destination || !intent?.bookingCooldowns?.length) return false;
  const cutoff = Date.now() - BOOKING_COOLDOWN_MS;
  const d = String(destination).toLowerCase();
  return intent.bookingCooldowns.some(
    c => c.destination && String(c.destination).toLowerCase() === d
      && new Date(c.bookedAt).getTime() > cutoff
  );
}

/**
 * US-0601 (RC-6): price_drop notifications fabricate a discount % and are a
 * legal/trust risk, so they are OFF unless explicitly enabled via env flag.
 */
function priceDropEnabled() {
  return process.env.ENABLE_PRICE_DROP_NOTIFICATIONS === 'true';
}

function buildNotifications(prefs, intent) {
  const notifications = [];
  const dest = intent?.primaryPlanningDestination || prefs?.favoriteDestinations?.[0]?.destination;

  // return_reminder: user has searched same destination multiple times (Barcelona pattern)
  if (
    dest &&
    (intent?.breakdown?.repeatSearches >= 1) &&
    (intent?.tier === 'medium' || intent?.tier === 'high') &&
    !inBookingCooldown(intent, dest) &&
    !recentlySent(intent, 'return_reminder')
  ) {
    notifications.push({
      id: `return_reminder_${dest}`,
      type: 'return_reminder',
      title: `Still thinking about ${dest}?`,
      message: `You've been researching ${dest} for a while. Prices are moving — complete your booking before they go up.`,
      ctaLabel: `Book ${dest}`,
      ctaUrl: `/hotels?city=${encodeURIComponent(dest)}`,
      priority: 12
    });
  }

  if (priceDropEnabled() && dest && !inBookingCooldown(intent, dest) && !recentlySent(intent, 'price_drop')) {
    const pct = 5 + Math.floor(Math.random() * 8);
    notifications.push({
      id: `price_drop_${dest}`,
      type: 'price_drop',
      title: `Prices for your ${dest} trip dropped ${pct}%`,
      message: `Fares to ${dest} are lower than your last search. Book before they rise.`,
      ctaLabel: 'View deals',
      ctaUrl: `/flights?toCity=${encodeURIComponent(dest)}`,
      priority: 10
    });
  }

  const beachFav = prefs?.favoriteDestinations?.find(d => BEACH_DESTINATIONS.has(d.destination));
  // When only the Resort hotel-category triggers this notification (beachFav is undefined),
  // fall back to the user's primary planning destination for the cooldown check.
  const sellingFastCooldownDest = beachFav?.destination || dest;
  if (
    (beachFav || prefs?.preferredHotelCategories?.some(c => c.category === 'Resort')) &&
    !inBookingCooldown(intent, sellingFastCooldownDest) &&
    !recentlySent(intent, 'selling_fast')
  ) {
    notifications.push({
      id: 'selling_fast_hotels',
      type: 'selling_fast',
      title: 'Hotels matching your preferences are selling fast',
      message: 'Limited availability for your preferred hotel categories this week.',
      ctaLabel: 'Browse hotels',
      ctaUrl: `/hotels?city=${encodeURIComponent(beachFav?.destination || 'Goa')}`,
      priority: 8
    });
  }

  const recentSearch = prefs?.favoriteDestinations?.[1]?.destination || TRENDING[2]?.destination;
  if (recentSearch && !inBookingCooldown(intent, recentSearch) && !recentlySent(intent, 'new_deal')) {
    notifications.push({
      id: `new_deal_${recentSearch}`,
      type: 'new_deal',
      title: `You recently searched ${recentSearch}. Here are new deals.`,
      message: `Fresh offers for ${recentSearch} — curated for your budget.`,
      ctaLabel: 'Explore',
      ctaUrl: `/flights?toCity=${encodeURIComponent(recentSearch)}`,
      priority: 6
    });
  }

  return notifications.slice(0, 5);
}

function buildDestinationCards(prefs, popMap) {
  const dests = new Set();
  const cards = [];

  for (const d of prefs?.favoriteDestinations || []) {
    if (dests.has(d.destination)) continue;
    dests.add(d.destination);
    const meta = DESTINATION_META[d.destination] || {
      country: 'India',
      type: BEACH_DESTINATIONS.has(d.destination) ? 'Beach' : 'City',
      imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80'
    };
    cards.push({
      name: d.destination,
      country: meta.country,
      type: meta.type,
      imageUrl: meta.imageUrl,
      reason: BEACH_DESTINATIONS.has(d.destination)
        ? 'Because you like beach destinations'
        : `Trending for travelers like you`,
      flightFrom: null,
      hotelFrom: null
    });
  }

  for (const t of TRENDING) {
    if (cards.length >= 6) break;
    if (dests.has(t.destination)) continue;
    dests.add(t.destination);
    const meta = DESTINATION_META[t.destination] || { country: '', type: 'Adventure', imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80' };
    cards.push({
      name: t.destination,
      country: meta.country,
      type: meta.type,
      imageUrl: meta.imageUrl,
      reason: 'Popular among similar travelers',
      flightFrom: null,
      hotelFrom: null
    });
  }

  return cards.slice(0, 6);
}

/**
 * Build full recommendation cache for user.
 *
 * US-0401 (RC-10): never throws upward — on any failure we degrade to a
 * cold-start payload so the homepage always has something to render.
 */
async function buildRecommendations(userId) {
  try {
    return await buildRecommendationsInner(userId);
  } catch (err) {
    console.error('[RecommendationEngine] build failed, serving cold-start:', err.message);
    return coldStartPayload();
  }
}

async function buildRecommendationsInner(userId) {
  const uid = new mongoose.Types.ObjectId(userId);

  let prefs = await UserPreference.findOne({ user: uid }).lean();
  if (!prefs || !prefs.lastAggregatedAt) {
    prefs = await aggregatePreferences(userId);
  }

  const intent = await UserIntentScore.findOne({ user: uid }).lean();
  const { map: popMap, max: popMax } = await getDestinationPopularity();

  const topDests = (prefs.favoriteDestinations || []).map(d => d.destination).slice(0, 3);
  const searchDests = topDests.length ? topDests : ['Mumbai', 'Dubai', 'Goa'];

  const flightQuery = {
    departure: { $gte: new Date() },
    status: { $ne: 'cancelled' }
  };
  if (searchDests.length) {
    flightQuery['destination.city'] = { $in: searchDests.map(d => new RegExp(escapeRegExp(d), 'i')) };
  }

  const flights = await Flight.find(flightQuery).limit(40).lean();
  const rankedFlights = flights
    .map(f => {
      const { score, price } = rankFlight(f, prefs, popMap, popMax);
      return {
        flightId: String(f._id),
        source: 'mongodb',
        airline: f.airline?.name,
        flightNumber: f.flightNumber,
        origin: f.origin?.city,
        destination: f.destination?.city,
        price,
        departure: f.departure,
        cabin: prefs.preferredCabin || 'economy',
        score,
        reason: reasonForFlight(f, prefs),
        thumbnail: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80'
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const hotelCities = searchDests;
  const hotels = await Hotel.find({
    'location.city': { $in: hotelCities.map(c => new RegExp(escapeRegExp(c), 'i')) },
    isActive: true
  }).limit(30).lean();

  const rankedHotels = hotels
    .map(h => {
      const { score, price } = rankHotel(h, prefs, popMap, popMax);
      return {
        hotelId: String(h._id),
        source: 'mongodb',
        hotelName: h.name,
        city: h.location?.city,
        starRating: h.starRating,
        userRating: h.userRating,
        price,
        score,
        reason: reasonForHotel(h, prefs),
        thumbnail: h.thumbnail || h.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099935?w=400&q=80'
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const continuePlanning = await buildContinuePlanning(uid, prefs);
  const notifications = buildNotifications(prefs, intent).map(n => ({
    id: String(n.id),
    type: String(n.type),
    title: String(n.title),
    message: String(n.message),
    ctaLabel: String(n.ctaLabel || 'View'),
    ctaUrl: String(n.ctaUrl || '/'),
    priority: Number(n.priority) || 0,
    dismissed: false,
    createdAt: new Date()
  }));

  // EP-06: the Intent × Engagement scenario matrix picks the primary nudge.
  // It is silent for dormant/post-booking/cooled-down users.
  const scenario = notificationEngine.selectScenario(intent);
  // Guard: only build and insert the scenario notification if the same type has not
  // already been sent within the 48-hour resend window. buildScenarioNotification is
  // async (may call the LLM), so we pre-check with the scenario key to avoid
  // unnecessary work when the notification would be discarded anyway.
  const scenarioNotif =
    !recentlySent(intent, scenario)
      ? await notificationEngine.buildScenarioNotification(prefs, intent)
      : null;
  if (scenarioNotif && !recentlySent(intent, scenarioNotif.type)) {
    notifications.unshift({
      id: String(scenarioNotif.id),
      type: String(scenarioNotif.type),
      title: String(scenarioNotif.title),
      message: String(scenarioNotif.message),
      ctaLabel: String(scenarioNotif.ctaLabel || 'View'),
      ctaUrl: String(scenarioNotif.ctaUrl || '/'),
      priority: Number(scenarioNotif.priority) || 0,
      dismissed: false,
      createdAt: new Date()
    });
  }
  const recommendedDestinations = buildDestinationCards(prefs, popMap);

  await RecommendationCache.deleteOne({ user: uid });

  const cache = await RecommendationCache.create({
    user: uid,
    recommendedFlights: rankedFlights,
    recommendedHotels: rankedHotels,
    recommendedDestinations,
    continuePlanning,
    notifications,
    scenario,
    validUntil: new Date(Date.now() + CACHE_TTL_MS),
    builtAt: new Date()
  });

  // Record which notification types were just sent so dedup works on next build.
  // US-0403 (RC-2): this bookkeeping must never break the recommendation
  // pipeline, so a failed write is logged and swallowed.
  if (notifications.length) {
    const newSent = notifications.map(n => ({ type: n.type, sentAt: new Date() }));
    try {
      await UserIntentScore.updateOne(
        { user: uid },
        { $push: { sentNotifications: { $each: newSent } } }
      );
    } catch (err) {
      console.error('[RecommendationEngine] sentNotifications update failed:', err.message);
    }
  }

  return formatCachePayload(cache.toObject ? cache.toObject() : cache);
}

/**
 * Cold-start payload — used when the user has no history or when a build fails.
 * Always returns arrays so the UI can render safely.
 */
function coldStartPayload() {
  return {
    recommendedFlights: [],
    recommendedHotels: [],
    recommendedDestinations: buildDestinationCards({}, {}),
    continuePlanning: [],
    notifications: []
  };
}

function formatCachePayload(cache) {
  if (!cache) return emptyPayload();
  return {
    recommendedFlights: cache.recommendedFlights || [],
    recommendedHotels: cache.recommendedHotels || [],
    recommendedDestinations: cache.recommendedDestinations || [],
    continuePlanning: cache.continuePlanning || [],
    notifications: (cache.notifications || []).filter(n => !n.dismissed),
    scenario: cache.scenario || null,
    builtAt: cache.builtAt,
    validUntil: cache.validUntil
  };
}

function emptyPayload() {
  return {
    recommendedFlights: [],
    recommendedHotels: [],
    recommendedDestinations: [],
    continuePlanning: [],
    notifications: []
  };
}

async function getRecommendations(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const cache = await RecommendationCache.findOne({ user: uid }).lean();

  if (cache && cache.validUntil && new Date(cache.validUntil) > new Date()) {
    return formatCachePayload(cache);
  }

  return buildRecommendations(userId);
}

async function invalidateCache(userId) {
  await RecommendationCache.deleteOne({ user: userId });
}

module.exports = {
  getRecommendations,
  buildRecommendations,
  invalidateCache,
  rankFlight,
  rankHotel,
  buildNotifications,
  inBookingCooldown,
  priceDropEnabled
};
