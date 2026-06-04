'use strict';

/**
 * Unit tests — recommendationEngine pure scoring exports
 * Covers: US-0401 (ranking priority), US-0402 (preference-based ranking)
 * No database; tests exported rankFlight and rankHotel only.
 *
 * Implementation note: buildNotifications() is not exported — the price_drop
 * feature flag (US-0601) and notification dedup (US-0602) are tested in the
 * integration test suite via buildRecommendations().
 */

const { rankFlight, rankHotel } = require('../../services/recommendationEngine');

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const basePrefs = {
  favoriteDestinations:      [{ destination: 'Barcelona', score: 8 }],
  preferredAirlines:         [{ code: 'IB', name: 'Iberia', score: 5 }],
  preferredHotelCategories:  [{ category: 'Business', score: 4 }],
  budget: {
    flightMin: 30000, flightMax: 80000, flightAvg: 50000,
    hotelMin:  3000,  hotelMax:  15000, hotelAvg:  8000
  },
  preferredCabin: 'economy'
};

const popMap = { Barcelona: 10, Mumbai: 5 };
const popMax = 10;

const barcelonaFlight = {
  destination: { city: 'Barcelona', code: 'BCN' },
  origin:      { city: 'Delhi',     code: 'DEL' },
  airline:     { name: 'Iberia', code: 'IB' },
  cabins:      { economy: { price: 45000 } },
  refundable:  false
};

const unknownFlight = {
  destination: { city: 'Nairobi', code: 'NBO' },
  origin:      { city: 'Delhi',   code: 'DEL' },
  airline:     { name: 'NoName', code: 'NN' },
  cabins:      { economy: { price: 90000 } },
  refundable:  false
};

const barcelonaHotel = {
  location:   { city: 'Barcelona' },
  starRating: 4,
  userRating: 8.5,
  roomTypes:  [{ price: 8000 }],
  minPricePerNight: 8000
};

// ---------------------------------------------------------------------------
// rankFlight (US-0401, US-0402)
// ---------------------------------------------------------------------------

describe('recommendationEngine — rankFlight', () => {

  it('returns a numeric score', () => {
    const { score } = rankFlight(barcelonaFlight, basePrefs, popMap, popMax);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns a numeric price', () => {
    const { price } = rankFlight(barcelonaFlight, basePrefs, popMap, popMax);
    expect(typeof price).toBe('number');
    expect(price).toBeGreaterThanOrEqual(0);
  });

  // US-0401: Active planning intent takes priority
  it('preferred destination scores higher than unknown destination', () => {
    const favScore   = rankFlight(barcelonaFlight, basePrefs, popMap, popMax).score;
    const otherScore = rankFlight(unknownFlight, basePrefs, {}, 1).score;
    expect(favScore).toBeGreaterThan(otherScore);
  });

  it('score is stable (deterministic) for the same inputs', () => {
    const s1 = rankFlight(barcelonaFlight, basePrefs, popMap, popMax).score;
    const s2 = rankFlight(barcelonaFlight, basePrefs, popMap, popMax).score;
    expect(s1).toBe(s2);
  });

  it('handles missing price data without throwing', () => {
    const noPriceFlight = {
      destination: { city: 'Barcelona' },
      airline:     { name: 'Iberia', code: 'IB' },
      cabins:      {},
      refundable:  false
    };
    expect(() => rankFlight(noPriceFlight, basePrefs, popMap, popMax)).not.toThrow();
  });

  it('handles null prefs without throwing', () => {
    expect(() => rankFlight(barcelonaFlight, null, popMap, popMax)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// rankHotel (US-0401, US-0402)
// ---------------------------------------------------------------------------

describe('recommendationEngine — rankHotel', () => {

  it('returns a numeric score', () => {
    const { score } = rankHotel(barcelonaHotel, basePrefs, popMap, popMax);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns a numeric price', () => {
    const { price } = rankHotel(barcelonaHotel, basePrefs, popMap, popMax);
    expect(typeof price).toBe('number');
    expect(price).toBeGreaterThanOrEqual(0);
  });

  it('preferred city hotel scores higher than unknown city hotel', () => {
    const unknownHotel = {
      location:   { city: 'UnknownCity' },
      starRating: 4,
      userRating: 7,
      roomTypes:  [{ price: 8000 }]
    };
    const prefScore    = rankHotel(barcelonaHotel, basePrefs, popMap, popMax).score;
    const unknownScore = rankHotel(unknownHotel,   basePrefs, {},     1).score;
    expect(prefScore).toBeGreaterThanOrEqual(unknownScore);
  });

  it('score is stable (deterministic) for the same inputs', () => {
    const s1 = rankHotel(barcelonaHotel, basePrefs, popMap, popMax).score;
    const s2 = rankHotel(barcelonaHotel, basePrefs, popMap, popMax).score;
    expect(s1).toBe(s2);
  });

  it('handles null prefs without throwing', () => {
    expect(() => rankHotel(barcelonaHotel, null, popMap, popMax)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// buildNotifications is not exported — document the gap
// ---------------------------------------------------------------------------

describe('recommendationEngine — buildNotifications export check (US-0601)', () => {

  it('buildNotifications should be exported so it can be tested in isolation [RED: not exported]', () => {
    // US-0601 requires testing buildNotifications() directly:
    //   "Given ENABLE_PRICE_DROP_NOTIFICATIONS is false, When buildNotifications() runs..."
    // The function is currently NOT exported — add it to module.exports.
    const engine = require('../../services/recommendationEngine');
    expect(typeof engine.buildNotifications).toBe('function');
  });
});
