// const express = require('express');
// const router = express.Router();
// const Flight = require('../models/Flight');
// const { protect, adminOnly } = require('../middleware/auth');
// const { normalizeCabin } = require('../utils/cabin');
// const { cityToCode } = require('../utils/airportCodes');
// const amadeus = require('../services/amadeus');
// const { generateFallbackFlights, buildMongoDateQuery } = require('../services/flightFallback');

// function applyFilters(flights, { cabinKey, maxPrice, airlines, stops }) {
//   let result = flights;
//   if (maxPrice) result = result.filter(f => (f.cabins?.[cabinKey]?.price ?? f.cabins?.economy?.price) <= Number(maxPrice));
//   if (airlines) {
//     const list = airlines.split(',');
//     result = result.filter(f => list.includes(f.airline?.code));
//   }
//   if (stops !== undefined && stops !== '') result = result.filter(f => f.stops <= Number(stops));
//   return result;
// }

// function buildFilters(flights, cabinKey) {
//   const airlines = [...new Map(flights.map(f => [f.airline?.code, { code: f.airline?.code, name: f.airline?.name }])).values()].filter(a => a.code);
//   const prices = flights.map(f => f.cabins?.[cabinKey]?.price ?? f.cabins?.economy?.price ?? 0).filter(Boolean);
//   return {
//     airlines,
//     priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 }
//   };
// }

// // GET /api/flights/search
// router.get('/search', async (req, res) => {
//   try {
//     const { from, to, date, returnDate, adults = 1, children = 0, infants = 0, cabin = 'economy', tripType = 'oneway' } = req.query;

//     if (!from || !to || !date) {
//       return res.status(400).json({ success: false, message: 'From, To, and Date are required' });
//     }

//     const fromCode = cityToCode(from);
//     const toCode = cityToCode(to);
//     const cabinKey = normalizeCabin(cabin);
//     const totalPassengers = Number(adults) + Number(children);
//     let source = 'mongodb';
//     let flights = [];

//     // 1) Amadeus live API (free developer tier)
//     if (amadeus.isConfigured()) {
//       try {
//         const amadeusResult = await amadeus.searchFlightOffers({
//           from: fromCode,
//           to: toCode,
//           date,
//           adults: totalPassengers,
//           returnDate: tripType === 'roundtrip' ? returnDate : undefined
//         });
//         if (amadeusResult?.flights?.length) {
//           flights = amadeusResult.flights;
//           source = 'amadeus';
//         }
//       } catch (e) {
//         console.warn('Amadeus search error:', e.message);
//       }
//     }

//     // 2) MongoDB seeded data
//     if (!flights.length) {
//       const departureQuery = buildMongoDateQuery(date);
//       const query = {
//         'origin.code': fromCode,
//         'destination.code': toCode,
//         departure: departureQuery,
//         status: { $ne: 'cancelled' },
//         [`cabins.${cabinKey}.available`]: { $gt: 0 }
//       };

//       let dbFlights = await Flight.find(query).sort({ [`cabins.${cabinKey}.price`]: 1 }).lean();
//       if (!dbFlights.length) {
//         // Relaxed: any future flight on route (date mismatch / timezone)
//         dbFlights = await Flight.find({
//           'origin.code': fromCode,
//           'destination.code': toCode,
//           departure: { $gte: new Date() },
//           status: { $ne: 'cancelled' }
//         }).sort({ departure: 1 }).limit(25).lean();
//       }

//       flights = dbFlights.map(f => ({
//         ...f,
//         source: 'mongodb',
//         totalPrice: (f.cabins?.[cabinKey]?.price || f.cabins?.economy?.price || 0) * totalPassengers,
//         selectedCabin: cabinKey
//       }));
//       if (flights.length) source = 'mongodb';
//     }

//     // 3) Demo fallback — always show results for UX / no DB
//     if (!flights.length) {
//       flights = generateFallbackFlights(fromCode, toCode, date, totalPassengers);
//       source = 'demo';
//     }

//     flights = applyFilters(flights, {
//       cabinKey,
//       maxPrice: req.query.maxPrice,
//       airlines: req.query.airlines,
//       stops: req.query.stops
//     });

//     let returnFlights = [];
//     if (tripType === 'roundtrip' && returnDate) {
//       if (source === 'amadeus') {
//         // Return leg included in round-trip Amadeus response — skip duplicate fetch for now
//       } else if (source === 'mongodb') {
//         const retQuery = buildMongoDateQuery(returnDate);
//         const ret = await Flight.find({
//           'origin.code': toCode,
//           'destination.code': fromCode,
//           departure: retQuery,
//           status: { $ne: 'cancelled' }
//         }).sort({ [`cabins.${cabinKey}.price`]: 1 }).lean();
//         returnFlights = ret.map(f => ({
//           ...f,
//           totalPrice: (f.cabins?.[cabinKey]?.price || 0) * totalPassengers,
//           selectedCabin: cabinKey
//         }));
//       } else {
//         returnFlights = generateFallbackFlights(toCode, fromCode, returnDate, totalPassengers);
//       }
//     }

//     res.json({
//       success: true,
//       count: flights.length,
//       tripType,
//       source,
//       amadeusConfigured: amadeus.isConfigured(),
//       message: source === 'demo'
//         ? 'Showing estimated fares. Add Amadeus API keys for live prices, or run npm run seed for local data.'
//         : undefined,
//       filters: buildFilters(flights, cabinKey),
//       flights,
//       returnFlights
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // GET /api/flights/providers — help frontend show data source
// router.get('/providers', (req, res) => {
//   res.json({
//     success: true,
//     amadeus: amadeus.isConfigured(),
//     mongodb: true,
//     demoFallback: true,
//     signupUrl: 'https://developers.amadeus.com/register'
//   });
// });

// // GET /api/flights/routes/popular — must be before /:id
// router.get('/routes/popular', async (req, res) => {
//   try {
//     const routes = [
//       { from: 'DEL', to: 'BOM', fromCity: 'Delhi', toCity: 'Mumbai' },
//       { from: 'BOM', to: 'DEL', fromCity: 'Mumbai', toCity: 'Delhi' },
//       { from: 'BLR', to: 'DEL', fromCity: 'Bangalore', toCity: 'Delhi' },
//       { from: 'DEL', to: 'BLR', fromCity: 'Delhi', toCity: 'Bangalore' },
//       { from: 'BOM', to: 'BLR', fromCity: 'Mumbai', toCity: 'Bangalore' },
//       { from: 'HYD', to: 'DEL', fromCity: 'Hyderabad', toCity: 'Delhi' },
//       { from: 'MAA', to: 'BOM', fromCity: 'Chennai', toCity: 'Mumbai' },
//       { from: 'CCU', to: 'DEL', fromCity: 'Kolkata', toCity: 'Delhi' },
//       { from: 'DEL', to: 'DXB', fromCity: 'Delhi', toCity: 'Dubai' },
//       { from: 'BOM', to: 'DXB', fromCity: 'Mumbai', toCity: 'Dubai' }
//     ];

//     const routesWithPrices = await Promise.all(routes.map(async (route) => {
//       const cheapestFlight = await Flight.findOne({
//         'origin.code': route.from,
//         'destination.code': route.to,
//         departure: { $gte: new Date() }
//       }).sort({ 'cabins.economy.price': 1 }).select('cabins.economy.price');

//       return {
//         ...route,
//         minPrice: cheapestFlight?.cabins?.economy?.price || null
//       };
//     }));

//     res.json({ success: true, routes: routesWithPrices });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // GET /api/flights/price-calendar
// router.get('/price-calendar', async (req, res) => {
//   try {
//     const { from, to, month } = req.query;
//     if (!from || !to) return res.status(400).json({ success: false, message: 'from and to required' });
//     const fromCode = cityToCode(from);
//     const toCode = cityToCode(to);
//     const base = month ? new Date(`${month}-01`) : new Date();
//     const days = [];
//     for (let i = 0; i < 30; i++) {
//       const d = new Date(base);
//       d.setDate(d.getDate() + i);
//       const dateStr = d.toISOString().split('T')[0];
//       const demo = generateFallbackFlights(fromCode, toCode, dateStr, 1);
//       const cheapest = await Flight.findOne({
//         'origin.code': fromCode,
//         'destination.code': toCode,
//         departure: buildMongoDateQuery(dateStr),
//         status: { $ne: 'cancelled' }
//       }).sort({ 'cabins.economy.price': 1 }).select('cabins.economy.price');

//       days.push({
//         date: dateStr,
//         minPrice: cheapest?.cabins?.economy?.price || demo[0]?.cabins?.economy?.price || null
//       });
//     }
//     res.json({ success: true, calendar: days });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // GET /api/flights/:id
// router.get('/:id', async (req, res) => {
//   try {
//     if (req.params.id.startsWith('amadeus-') || req.params.id.startsWith('demo-')) {
//       return res.status(400).json({
//         success: false,
//         message: 'This is a live/demo offer. Proceed to checkout from search results.'
//       });
//     }
//     const flight = await Flight.findById(req.params.id);
//     if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
//     res.json({ success: true, flight });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // POST /api/flights - Admin: create flight
// router.post('/', protect, adminOnly, async (req, res) => {
//   try {
//     const flight = await Flight.create(req.body);
//     res.status(201).json({ success: true, flight });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const { normalizeCabin } = require('../utils/cabin');
const { cityToCode } = require('../utils/airportCodes');
const amadeus = require('../services/amadeus');
const { generateFallbackFlights, buildMongoDateQuery } = require('../services/flightFallback');
// ── Personalization: activity tracker ──────────────────────────────────────
const tracker = require('../services/activityTracker');

function applyFilters(flights, { cabinKey, maxPrice, airlines, stops }) {
  let result = flights;
  if (maxPrice) result = result.filter(f => (f.cabins?.[cabinKey]?.price ?? f.cabins?.economy?.price) <= Number(maxPrice));
  if (airlines) {
    const list = airlines.split(',');
    result = result.filter(f => list.includes(f.airline?.code));
  }
  if (stops !== undefined && stops !== '') result = result.filter(f => f.stops <= Number(stops));
  return result;
}

function buildFilters(flights, cabinKey) {
  const airlines = [...new Map(flights.map(f => [f.airline?.code, { code: f.airline?.code, name: f.airline?.name }])).values()].filter(a => a.code);
  const prices = flights.map(f => f.cabins?.[cabinKey]?.price ?? f.cabins?.economy?.price ?? 0).filter(Boolean);
  return {
    airlines,
    priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 }
  };
}

// GET /api/flights/search
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { from, to, date, returnDate, adults = 1, children = 0, infants = 0, cabin = 'economy', tripType = 'oneway' } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({ success: false, message: 'From, To, and Date are required' });
    }

    const fromCode = cityToCode(from);
    const toCode = cityToCode(to);
    const cabinKey = normalizeCabin(cabin);
    const totalPassengers = Number(adults) + Number(children);
    let source = 'mongodb';
    let flights = [];

    // ── Track flight search ─────────────────────────────────────────────────
    if (req.user) {
      tracker.trackFlightSearch(req.user._id, {
        from, to, date, cabin, tripType,
        destination: to,
        origin: from,
        isDomestic: !['DXB', 'SIN', 'BKK', 'LHR', 'JFK'].includes(toCode)
      }, req.headers['x-session-id']);
    }

    // 1) Amadeus live API
    if (amadeus.isConfigured()) {
      try {
        const amadeusResult = await amadeus.searchFlightOffers({
          from: fromCode, to: toCode, date,
          adults: totalPassengers,
          returnDate: tripType === 'roundtrip' ? returnDate : undefined
        });
        if (amadeusResult?.flights?.length) {
          flights = amadeusResult.flights;
          source = 'amadeus';
        }
      } catch (e) {
        console.warn('Amadeus search error:', e.message);
      }
    }

    // 2) MongoDB seeded data
    if (!flights.length) {
      const departureQuery = buildMongoDateQuery(date);
      const query = {
        'origin.code': fromCode,
        'destination.code': toCode,
        departure: departureQuery,
        status: { $ne: 'cancelled' },
        [`cabins.${cabinKey}.available`]: { $gt: 0 }
      };

      let dbFlights = await Flight.find(query).sort({ [`cabins.${cabinKey}.price`]: 1 }).lean();
      if (!dbFlights.length) {
        dbFlights = await Flight.find({
          'origin.code': fromCode,
          'destination.code': toCode,
          departure: { $gte: new Date() },
          status: { $ne: 'cancelled' }
        }).sort({ departure: 1 }).limit(25).lean();
      }

      flights = dbFlights.map(f => ({
        ...f,
        source: 'mongodb',
        totalPrice: (f.cabins?.[cabinKey]?.price || f.cabins?.economy?.price || 0) * totalPassengers,
        selectedCabin: cabinKey
      }));
      if (flights.length) source = 'mongodb';
    }

    // 3) Demo fallback
    if (!flights.length) {
      flights = generateFallbackFlights(fromCode, toCode, date, totalPassengers);
      source = 'demo';
    }

    flights = applyFilters(flights, {
      cabinKey,
      maxPrice: req.query.maxPrice,
      airlines: req.query.airlines,
      stops: req.query.stops
    });

    let returnFlights = [];
    if (tripType === 'roundtrip' && returnDate) {
      if (source === 'mongodb') {
        const retQuery = buildMongoDateQuery(returnDate);
        const ret = await Flight.find({
          'origin.code': toCode,
          'destination.code': fromCode,
          departure: retQuery,
          status: { $ne: 'cancelled' }
        }).sort({ [`cabins.${cabinKey}.price`]: 1 }).lean();
        returnFlights = ret.map(f => ({
          ...f,
          totalPrice: (f.cabins?.[cabinKey]?.price || 0) * totalPassengers,
          selectedCabin: cabinKey
        }));
      } else if (source === 'demo') {
        returnFlights = generateFallbackFlights(toCode, fromCode, returnDate, totalPassengers);
      }
    }

    res.json({
      success: true, count: flights.length, tripType, source,
      amadeusConfigured: amadeus.isConfigured(),
      message: source === 'demo'
        ? 'Showing estimated fares. Add Amadeus API keys for live prices, or run npm run seed for local data.'
        : undefined,
      filters: buildFilters(flights, cabinKey),
      flights, returnFlights
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/flights/providers
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    amadeus: amadeus.isConfigured(),
    mongodb: true,
    demoFallback: true,
    signupUrl: 'https://developers.amadeus.com/register'
  });
});

// GET /api/flights/routes/popular
router.get('/routes/popular', async (req, res) => {
  try {
    const routes = [
      { from: 'DEL', to: 'BOM', fromCity: 'Delhi', toCity: 'Mumbai' },
      { from: 'BOM', to: 'DEL', fromCity: 'Mumbai', toCity: 'Delhi' },
      { from: 'BLR', to: 'DEL', fromCity: 'Bangalore', toCity: 'Delhi' },
      { from: 'DEL', to: 'BLR', fromCity: 'Delhi', toCity: 'Bangalore' },
      { from: 'BOM', to: 'BLR', fromCity: 'Mumbai', toCity: 'Bangalore' },
      { from: 'HYD', to: 'DEL', fromCity: 'Hyderabad', toCity: 'Delhi' },
      { from: 'MAA', to: 'BOM', fromCity: 'Chennai', toCity: 'Mumbai' },
      { from: 'CCU', to: 'DEL', fromCity: 'Kolkata', toCity: 'Delhi' },
      { from: 'DEL', to: 'DXB', fromCity: 'Delhi', toCity: 'Dubai' },
      { from: 'BOM', to: 'DXB', fromCity: 'Mumbai', toCity: 'Dubai' }
    ];

    const routesWithPrices = await Promise.all(routes.map(async (route) => {
      const cheapestFlight = await Flight.findOne({
        'origin.code': route.from,
        'destination.code': route.to,
        departure: { $gte: new Date() }
      }).sort({ 'cabins.economy.price': 1 }).select('cabins.economy.price');

      return { ...route, minPrice: cheapestFlight?.cabins?.economy?.price || null };
    }));

    res.json({ success: true, routes: routesWithPrices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/flights/price-calendar
router.get('/price-calendar', async (req, res) => {
  try {
    const { from, to, month } = req.query;
    if (!from || !to) return res.status(400).json({ success: false, message: 'from and to required' });
    const fromCode = cityToCode(from);
    const toCode = cityToCode(to);
    const base = month ? new Date(`${month}-01`) : new Date();
    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const demo = generateFallbackFlights(fromCode, toCode, dateStr, 1);
      const cheapest = await Flight.findOne({
        'origin.code': fromCode,
        'destination.code': toCode,
        departure: buildMongoDateQuery(dateStr),
        status: { $ne: 'cancelled' }
      }).sort({ 'cabins.economy.price': 1 }).select('cabins.economy.price');

      days.push({ date: dateStr, minPrice: cheapest?.cabins?.economy?.price || demo[0]?.cabins?.economy?.price || null });
    }
    res.json({ success: true, calendar: days });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/flights/:id — with view tracking
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    if (req.params.id.startsWith('amadeus-') || req.params.id.startsWith('demo-')) {
      return res.status(400).json({
        success: false,
        message: 'This is a live/demo offer. Proceed to checkout from search results.'
      });
    }
    const flight = await Flight.findById(req.params.id);
    if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });

    // ── Track flight view ───────────────────────────────────────────────────
    if (req.user) {
      const cabin = normalizeCabin(req.query.cabin || 'economy');
      tracker.trackFlightView(req.user._id, {
        flightId:     flight._id.toString(),
        flightNumber: flight.flightNumber,
        airline:      flight.airline?.name,
        origin:       flight.origin?.city,
        destination:  flight.destination?.city,
        price:        flight.cabins?.[cabin]?.price,
        cabin,
        isDomestic:   flight.isDomestic
      }, req.headers['x-session-id']);
    }

    res.json({ success: true, flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/flights — Admin create
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const flight = await Flight.create(req.body);
    res.status(201).json({ success: true, flight });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;

