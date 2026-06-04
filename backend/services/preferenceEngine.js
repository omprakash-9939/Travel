'use strict';

/**
 * preferenceEngine — derives UserPreference from activities + bookings.
 */

const mongoose = require('mongoose');
const UserActivity = require('../models/UserActivity');
const UserPreference = require('../models/UserPreference');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

const INTERNATIONAL_CODES = new Set(['DXB', 'SIN', 'BKK', 'LHR', 'JFK', 'CDG', 'NRT']);

function starToCategory(stars) {
  if (stars >= 5) return 'Luxury';
  if (stars >= 4) return 'Business';
  if (stars >= 3) return 'Comfort';
  return 'Budget';
}

function bumpScore(map, key, amount = 1) {
  map[key] = (map[key] || 0) + amount;
}

/**
 * Recompute and upsert preference profile for a user.
 */
async function aggregatePreferences(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [activities, bookings] = await Promise.all([
    UserActivity.find({ user: uid, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean(),
    Booking.find({ user: uid, status: { $in: ['confirmed', 'completed'] } }).sort({ createdAt: -1 }).limit(50).lean()
  ]);

  const destScores = {};
  const airlineScores = {};
  const hotelCatScores = {};
  const flightPrices = [];
  const hotelPrices = [];
  const tripDurations = [];
  let domesticCount = 0;
  let internationalCount = 0;
  let searches = 0;
  let views = 0;
  let totalBookings = bookings.length;
  const cabinCounts = {};

  const recentlyViewedFlights = [];
  const recentlyViewedHotels = [];
  const seenFlight = new Set();
  const seenHotel = new Set();

  for (const a of activities) {
    const m = a.metadata || {};

    if (a.eventType === 'flight_search' || a.eventType === 'hotel_search') searches++;
    if (a.eventType === 'flight_view' || a.eventType === 'hotel_view') views++;

    const dest = m.destination || m.city;
    if (dest) bumpScore(destScores, dest, a.eventType.includes('search') ? 3 : 2);

    if (m.airline) bumpScore(airlineScores, m.airline, 2);
    if (m.cabin) bumpScore(cabinCounts, m.cabin, 1);

    if (m.price) {
      if (a.eventType.includes('flight')) flightPrices.push(m.price);
      if (a.eventType.includes('hotel')) hotelPrices.push(m.price);
    }

    if (m.isDomestic === true) domesticCount++;
    if (m.isDomestic === false) internationalCount++;
    if (m.tripDuration) tripDurations.push(m.tripDuration);

    if (a.eventType === 'flight_view' && m.flightId && !seenFlight.has(m.flightId)) {
      seenFlight.add(m.flightId);
      recentlyViewedFlights.push({
        flightId: m.flightId,
        flightNumber: m.flightNumber,
        airline: m.airline,
        origin: m.origin,
        destination: m.destination,
        price: m.price,
        viewedAt: a.createdAt
      });
    }

    if (a.eventType === 'hotel_view' && m.hotelId && !seenHotel.has(m.hotelId)) {
      seenHotel.add(m.hotelId);
      recentlyViewedHotels.push({
        hotelId: m.hotelId,
        hotelName: m.hotelName,
        city: m.destination,
        starRating: m.starRating,
        price: m.price,
        viewedAt: a.createdAt
      });
    }

    if (m.starRating) bumpScore(hotelCatScores, starToCategory(m.starRating), 2);
  }

  for (const b of bookings) {
    const dest = b.type === 'flight' ? b.flight?.destination : b.hotel?.city;
    if (dest) bumpScore(destScores, dest, 8);
    if (b.flight?.airline) bumpScore(airlineScores, b.flight.airline, 5);
    if (b.pricing?.total) {
      if (b.type === 'flight') flightPrices.push(b.pricing.total);
      if (b.type === 'hotel') hotelPrices.push(b.pricing.total);
    }
    if (b.hotel?.nights) tripDurations.push(b.hotel.nights);
  }

  const avg = (arr) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);
  const min = (arr) => (arr.length ? Math.min(...arr) : 0);
  const max = (arr) => (arr.length ? Math.max(...arr) : 0);

  const favoriteDestinations = Object.entries(destScores)
    .map(([destination, score]) => ({ destination, score, lastVisited: new Date() }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const preferredAirlines = Object.entries(airlineScores)
    .map(([name, score]) => ({ code: name.slice(0, 3).toUpperCase(), name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const preferredHotelCategories = Object.entries(hotelCatScores)
    .map(([category, score]) => ({ category, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const preferredCabin = Object.entries(cabinCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'economy';

  let prefersDomestic = true;
  if (internationalCount > domesticCount) prefersDomestic = false;

  const existing = await UserPreference.findOne({ user: uid }).lean();

  const doc = {
    user: uid,
    favoriteDestinations,
    preferredAirlines,
    preferredHotelCategories,
    preferredStarRating: Math.round(avg(recentlyViewedHotels.map(h => h.starRating).filter(Boolean)) || 3),
    budget: {
      flightMin: min(flightPrices) || existing?.budget?.flightMin || 0,
      flightMax: max(flightPrices) || existing?.budget?.flightMax || 50000,
      flightAvg: Math.round(avg(flightPrices)) || existing?.budget?.flightAvg || 0,
      hotelMin: min(hotelPrices) || existing?.budget?.hotelMin || 0,
      hotelMax: max(hotelPrices) || existing?.budget?.hotelMax || 20000,
      hotelAvg: Math.round(avg(hotelPrices)) || existing?.budget?.hotelAvg || 0
    },
    avgTripDuration: Math.round(avg(tripDurations)) || 3,
    prefersDomestic,
    preferredCabin,
    totalSearches: searches,
    totalViews: views,
    totalBookings,
    recentlyViewedFlights: recentlyViewedFlights.slice(0, 10),
    recentlyViewedHotels: recentlyViewedHotels.slice(0, 10),
    wishlist: existing?.wishlist || [],
    lastAggregatedAt: new Date()
  };

  const prefs = await UserPreference.findOneAndUpdate(
    { user: uid },
    { $set: doc },
    { upsert: true, new: true, lean: true }
  );

  return prefs;
}

module.exports = { aggregatePreferences, starToCategory, INTERNATIONAL_CODES };
