const mongoose = require('mongoose');

function isMongoObjectId(value) {
  if (!value) return false;
  const str = String(value);
  if (str.startsWith('demo-') || str.startsWith('amadeus-')) return false;
  return mongoose.Types.ObjectId.isValid(str) && String(new mongoose.Types.ObjectId(str)) === str;
}

function sanitizeFlightForBooking(flightInput = {}, item = {}) {
  const flight = { ...flightInput };
  const refId = flight.flightRef || item._id;

  if (refId && !isMongoObjectId(refId)) {
    flight.externalId = String(refId);
    flight.source = item.source || flight.source || (String(refId).startsWith('amadeus-') ? 'amadeus' : 'demo');
    delete flight.flightRef;
  } else if (refId && isMongoObjectId(refId)) {
    flight.flightRef = refId;
    flight.source = item.source || flight.source || 'mongodb';
  }

  flight.flightNumber = flight.flightNumber || item.flightNumber;
  flight.airline = flight.airline || item.airline?.name || item.airline;
  flight.origin = flight.origin || item.origin?.city || item.origin?.code || item.origin;
  flight.destination = flight.destination || item.destination?.city || item.destination?.code || item.destination;
  flight.departure = flight.departure || item.departure;
  flight.arrival = flight.arrival || item.arrival;
  flight.cabin = flight.cabin || 'economy';

  return flight;
}

function sanitizeHotelForBooking(hotelInput = {}, item = {}) {
  const hotel = { ...hotelInput };
  const refId = hotel.hotelRef || item._id;

  if (refId && !isMongoObjectId(refId)) {
    hotel.externalId = String(refId);
    delete hotel.hotelRef;
  } else if (refId && isMongoObjectId(refId)) {
    hotel.hotelRef = refId;
  }

  hotel.hotelName = hotel.hotelName || hotel.name || item.name;
  hotel.city = hotel.city || item.location?.city;
  return hotel;
}

function normalizePassengers(passengers = []) {
  return passengers.map((p) => {
    if (p.firstName) return p;
    const name = (p.name || '').trim();
    const parts = name.split(/\s+/);
    return {
      ...p,
      firstName: parts[0] || 'Guest',
      lastName: parts.slice(1).join(' ') || 'Traveler',
      type: p.type || 'adult'
    };
  });
}

module.exports = {
  isMongoObjectId,
  sanitizeFlightForBooking,
  sanitizeHotelForBooking,
  normalizePassengers
};
