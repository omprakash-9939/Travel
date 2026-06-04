/**
 * Amadeus Self-Service API (free test tier — ~2,000 calls/month)
 * Sign up: https://developers.amadeus.com/register
 * Add AMADEUS_CLIENT_ID + AMADEUS_CLIENT_SECRET to backend/.env
 */
const { cityToCode } = require('../utils/airportCodes');

const BASE = process.env.AMADEUS_ENV === 'production'
  ? 'https://api.amadeus.com'
  : 'https://test.api.amadeus.com';

let tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  const id = process.env.AMADEUS_CLIENT_ID;
  const secret = process.env.AMADEUS_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: id,
    client_secret: secret
  });

  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('Amadeus auth failed:', err);
    return null;
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 1800) * 1000
  };
  return tokenCache.token;
}

function parseDuration(iso) {
  if (!iso) return 120;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 120;
  return (Number(m[1]) || 0) * 60 + (Number(m[2]) || 0);
}

function mapAmadeusOffers(offersData, dictionaries = {}) {
  const carriers = dictionaries.carriers || {};
  return (offersData || []).map((offer, idx) => {
    const itinerary = offer.itineraries[0];
    const segments = itinerary.segments;
    const first = segments[0];
    const last = segments[segments.length - 1];
    const airlineCode = first.carrierCode;
    const airlineName = carriers[airlineCode] || airlineCode;
    const price = Math.round(Number(offer.price?.grandTotal || offer.price?.total || 0));
    const dep = new Date(first.departure.at);
    const arr = new Date(last.arrival.at);
    const stops = segments.length - 1;

    return {
      _id: `amadeus-${offer.id || idx}`,
      source: 'amadeus',
      flightNumber: `${airlineCode}${first.number}`,
      airline: { name: airlineName, code: airlineCode, logo: '✈' },
      origin: {
        city: first.departure.iataCode,
        airport: first.departure.iataCode,
        code: first.departure.iataCode
      },
      destination: {
        city: last.arrival.iataCode,
        airport: last.arrival.iataCode,
        code: last.arrival.iataCode
      },
      departure: dep,
      arrival: arr,
      duration: parseDuration(itinerary.duration),
      stops,
      cabins: {
        economy: {
          available: Number(offer.numberOfBookableSeats) || 9,
          price,
          baggage: '15 kg'
        }
      },
      amenities: [],
      refundable: false,
      status: 'scheduled',
      totalPrice: price,
      selectedCabin: 'economy',
      amadeusOfferId: offer.id
    };
  });
}

async function searchFlightOffers({ from, to, date, adults = 1, returnDate, currency = 'INR' }) {
  const token = await getAccessToken();
  if (!token) return null;

  const originLocationCode = cityToCode(from);
  const destinationLocationCode = cityToCode(to);

  const params = new URLSearchParams({
    originLocationCode,
    destinationLocationCode,
    departureDate: date,
    adults: String(adults),
    currencyCode: currency,
    max: '25',
    nonStop: 'false'
  });

  if (returnDate) params.set('returnDate', returnDate);

  const res = await fetch(`${BASE}/v2/shopping/flight-offers?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('Amadeus flight search failed:', res.status, err);
    return null;
  }

  const json = await res.json();
  return {
    flights: mapAmadeusOffers(json.data, json.dictionaries),
    meta: json.meta
  };
}

const CITY_HOTEL_CODES = {
  delhi: 'DEL', mumbai: 'BOM', bangalore: 'BLR', bengaluru: 'BLR',
  goa: 'GOI', chennai: 'MAA', kolkata: 'CCU', hyderabad: 'HYD',
  jaipur: 'JAI', dubai: 'DXB', bangkok: 'BKK', paris: 'PAR', london: 'LON'
};

function cityToHotelCode(city) {
  if (!city) return 'DEL';
  const key = String(city).trim().toLowerCase();
  if (/^[A-Z]{3}$/i.test(key)) return key.toUpperCase();
  return CITY_HOTEL_CODES[key] || 'DEL';
}

function mapAmadeusHotels(hotelList, offers = []) {
  const offerByHotel = {};
  (offers || []).forEach((o) => {
    const hid = o.hotel?.hotelId;
    if (!hid) return;
    const price = Math.round(Number(o.offers?.[0]?.price?.total || o.offers?.[0]?.price?.base || 0));
    if (!offerByHotel[hid] || price < offerByHotel[hid]) offerByHotel[hid] = price;
  });

  return (hotelList || []).map((h, idx) => {
    const price = offerByHotel[h.hotelId] || 3500 + (idx * 400);
    return {
      _id: `amadeus-hotel-${h.hotelId}`,
      source: 'amadeus',
      name: h.name || `Hotel ${h.hotelId}`,
      starRating: 4,
      userRating: 8.2,
      reviewCount: 100,
      location: {
        city: h.iataCode || h.address?.cityName || 'City',
        country: h.address?.countryCode || 'IN',
        address: [h.address?.lines, h.address?.cityName].filter(Boolean).join(', '),
        coordinates: h.geoCode ? { lat: h.geoCode.latitude, lng: h.geoCode.longitude } : undefined
      },
      thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
      amenities: [{ category: 'General', items: ['WiFi', 'Restaurant'] }],
      roomTypes: [{ name: 'Standard', maxOccupancy: 2, price, available: 5, inclusions: ['Room only'] }],
      minPricePerNight: price,
      totalPrice: price,
      amadeusHotelId: h.hotelId
    };
  });
}

async function searchHotels({ city, checkIn, checkOut, adults = 1, rooms = 1 }) {
  const token = await getAccessToken();
  if (!token || !checkIn || !checkOut) return null;

  const cityCode = cityToHotelCode(city);
  const listRes = await fetch(
    `${BASE}/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) return null;

  const listJson = await listRes.json();
  const hotelIds = (listJson.data || []).slice(0, 12).map((h) => h.hotelId).filter(Boolean);
  if (!hotelIds.length) return { hotels: [], source: 'amadeus' };

  const params = new URLSearchParams({
    hotelIds: hotelIds.join(','),
    adults: String(adults),
    checkInDate: checkIn,
    checkOutDate: checkOut,
    roomQuantity: String(rooms),
    currency: 'INR'
  });

  const offersRes = await fetch(`${BASE}/v3/shopping/hotel-offers?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  let offers = [];
  if (offersRes.ok) {
    const offersJson = await offersRes.json();
    offers = offersJson.data || [];
  }

  const hotels = mapAmadeusHotels(listJson.data.slice(0, 12), offers);
  return { hotels, source: 'amadeus' };
}

function isConfigured() {
  return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
}

module.exports = {
  searchFlightOffers,
  searchHotels,
  isConfigured,
  getAccessToken,
  cityToHotelCode
};
