const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const amadeus = require('../services/amadeus');
const { generateFallbackHotels } = require('../services/integrations/hotelFallback');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/hotels/search
router.get('/search', async (req, res) => {
  try {
    const { city, checkIn, checkOut, guests = 1, rooms = 1, minStars, maxPrice, amenities, page = 1, limit = 20 } = req.query;

    if (!city) return res.status(400).json({ success: false, message: 'City is required' });

    let source = 'mongodb';
    let hotels = [];

    // 1) Amadeus hotels
    if (amadeus.isConfigured() && checkIn && checkOut) {
      try {
        const result = await amadeus.searchHotels({
          city,
          checkIn,
          checkOut,
          adults: guests,
          rooms
        });
        if (result?.hotels?.length) {
          hotels = result.hotels;
          source = 'amadeus';
        }
      } catch (e) {
        console.warn('Amadeus hotel search:', e.message);
      }
    }

    // 2) MongoDB
    if (!hotels.length) {
      const query = { 'location.city': new RegExp(city, 'i'), isActive: true };
      if (minStars) query.starRating = { $gte: Number(minStars) };
      if (amenities) {
        const amenityList = amenities.split(',');
        query['amenities.items'] = { $all: amenityList };
      }

      const skip = (Number(page) - 1) * Number(limit);
      const dbHotels = await Hotel.find(query)
        .sort({ userRating: -1, starRating: -1 })
        .skip(skip)
        .limit(Number(limit));

      const nights = checkIn && checkOut
        ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
        : 1;

      hotels = dbHotels.map(h => {
        const minRoomPrice = Math.min(...h.roomTypes.map(r => r.price));
        return {
          ...h.toObject(),
          source: 'mongodb',
          minPricePerNight: minRoomPrice,
          totalPrice: minRoomPrice * nights * Number(rooms)
        };
      });
      if (hotels.length) source = 'mongodb';
    }

    // 3) Demo fallback
    if (!hotels.length) {
      hotels = generateFallbackHotels(city, checkIn, checkOut, Number(rooms));
      source = 'demo';
    }

    if (minStars) hotels = hotels.filter(h => h.starRating >= Number(minStars));
    if (maxPrice) hotels = hotels.filter(h => h.minPricePerNight <= Number(maxPrice));

    res.json({
      success: true,
      count: hotels.length,
      source,
      message: source === 'demo' ? 'Demo hotel data. Add Amadeus keys or run npm run seed.' : undefined,
      hotels
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/hotels/city/trending — must be before /:id
router.get('/city/trending', async (req, res) => {
  try {
    const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Jaipur', 'Chennai', 'Goa', 'Kolkata', 'Hyderabad'];
    const trendingCities = await Promise.all(cities.map(async (city) => {
      const count = await Hotel.countDocuments({ 'location.city': new RegExp(city, 'i'), isActive: true });
      const cheapest = await Hotel.findOne({ 'location.city': new RegExp(city, 'i'), isActive: true }).sort({ 'roomTypes.0.price': 1 });
      return { city, hotelCount: count, startingFrom: cheapest?.roomTypes?.[0]?.price || null };
    }));
    res.json({ success: true, cities: trendingCities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/hotels/:id/extras — map, reviews, attractions
router.get('/:id/extras', async (req, res) => {
  try {
    const { city, lat, lng, name } = req.query;
    const integrations = require('../services/integrations');
    const map = await integrations.resolveMap(
      `${name || 'hotel'}, ${city || ''}`,
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined
    );
    const attractions = city
      ? await integrations.googlePlaces.nearbyAttractions(city, map?.lat, map?.lng)
      : [];
    const restaurants = city
      ? await integrations.googlePlaces.textSearch(`restaurants in ${city}`, map ? { lat: map.lat, lng: map.lng } : undefined)
      : [];

    res.json({
      success: true,
      map,
      attractions: attractions || [],
      restaurants: restaurants || [],
      placesConfigured: integrations.googlePlaces.isConfigured()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/hotels/:id
router.get('/:id', async (req, res) => {
  try {
    if (req.params.id.startsWith('amadeus-hotel-') || req.params.id.startsWith('demo-hotel-')) {
      return res.json({
        success: true,
        hotel: { _id: req.params.id, source: req.params.id.startsWith('demo') ? 'demo' : 'amadeus' },
        message: 'Use search listing data for external hotels'
      });
    }
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    res.json({ success: true, hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/hotels - Admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({ success: true, hotel });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
