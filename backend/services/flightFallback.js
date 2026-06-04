/**
 * Generates realistic demo flights when MongoDB is empty and Amadeus is not configured.
 * Uses stable pricing from route hash so results are consistent per search.
 */
const { cityToCode, CITY_TO_CODE } = require('../utils/airportCodes');

const AIRLINES = [
  { name: 'IndiGo', code: '6E' },
  { name: 'Air India', code: 'AI' },
  { name: 'Vistara', code: 'UK' },
  { name: 'SpiceJet', code: 'SG' },
  { name: 'Akasa Air', code: 'QP' }
];

const CITY_NAMES = Object.fromEntries(
  Object.entries(CITY_TO_CODE).map(([city, code]) => [code, city.replace(/\b\w/g, c => c.toUpperCase())])
);

function hashRoute(from, to, date, slot) {
  const s = `${from}-${to}-${date}-${slot}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

function dayBounds(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { start, end };
}

function generateFallbackFlights(from, to, date, adults = 1) {
  const fromCode = cityToCode(from);
  const toCode = cityToCode(to);
  const fromCity = CITY_NAMES[fromCode] || from;
  const toCity = CITY_NAMES[toCode] || to;
  const isIntl = fromCode !== toCode && (fromCode.length === 3 && !['DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD', 'GOI', 'JAI'].includes(toCode) || !['DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD', 'GOI', 'JAI'].includes(fromCode));
  const basePrice = isIntl ? 14000 : 3200;

  const flights = [];
  const slots = [6, 9, 13, 17, 21];

  slots.forEach((hour, slot) => {
    const h = hashRoute(fromCode, toCode, date, slot);
    const airline = AIRLINES[h % AIRLINES.length];
    const durationMin = 75 + (h % 180);
    const price = Math.round(basePrice + (h % 2500) - 800);
    const dep = new Date(date + `T${String(hour).padStart(2, '0')}:30:00`);
    const arr = new Date(dep.getTime() + durationMin * 60_000);
    const stops = h % 5 === 0 ? 1 : 0;

    flights.push({
      _id: `demo-${fromCode}-${toCode}-${date}-${slot}`,
      source: 'demo',
      flightNumber: `${airline.code}${100 + slot}`,
      airline,
      origin: { city: fromCity, airport: `${fromCode} Airport`, code: fromCode, country: 'India' },
      destination: { city: toCity, airport: `${toCode} Airport`, code: toCode, country: isIntl ? 'International' : 'India' },
      departure: dep,
      arrival: arr,
      duration: durationMin,
      stops,
      cabins: {
        economy: { available: 5 + (h % 40), price, baggage: '15 kg' },
        business: { available: 4, price: Math.round(price * 3.2), baggage: '35 kg' }
      },
      amenities: slot % 2 === 0 ? ['meal'] : ['wifi', 'meal'],
      refundable: slot === 0,
      status: 'scheduled',
      totalPrice: price * adults,
      selectedCabin: 'economy'
    });
  });

  return flights.sort((a, b) => a.cabins.economy.price - b.cabins.economy.price);
}

function buildMongoDateQuery(dateStr) {
  const { start, end } = dayBounds(dateStr);
  return { $gte: start, $lt: end };
}

module.exports = { generateFallbackFlights, buildMongoDateQuery, dayBounds };
