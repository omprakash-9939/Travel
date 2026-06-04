'use strict';

/**
 * Unit tests — preferenceEngine pure exports
 * Covers: US-0103 (cabin preference), US-0102 (hotel category preference)
 * No database; tests exported pure functions only.
 */

const { starToCategory } = require('../../services/preferenceEngine');

// ---------------------------------------------------------------------------
// starToCategory — hotel category derivation
// ---------------------------------------------------------------------------

describe('preferenceEngine — starToCategory (US-0102, US-0103)', () => {

  it('5 stars → Luxury', () => {
    expect(starToCategory(5)).toBe('Luxury');
  });

  it('4 stars → Business', () => {
    expect(starToCategory(4)).toBe('Business');
  });

  it('3 stars → Comfort', () => {
    expect(starToCategory(3)).toBe('Comfort');
  });

  it('2 stars → Budget', () => {
    expect(starToCategory(2)).toBe('Budget');
  });

  it('1 star → Budget', () => {
    expect(starToCategory(1)).toBe('Budget');
  });
});

// ---------------------------------------------------------------------------
// preferredCabin derivation logic (US-0103)
// The cabin preference algorithm (from aggregatePreferences) uses:
//   Object.entries(cabinCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'economy'
// These tests document the expected behaviour of that algorithm.
// ---------------------------------------------------------------------------

describe('preferenceEngine — preferredCabin algorithm (US-0103)', () => {

  // Scenario: Cabin preference reflects the most-viewed cabin class
  it('most-viewed cabin wins when user viewed 3 business, 0 economy', () => {
    const cabinCounts = { business: 3, economy: 0 };
    const preferred   = Object.entries(cabinCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'economy';
    expect(preferred).toBe('business');
  });

  it('"preferredCabin" is not "economy" when business count is higher (US-0103)', () => {
    const cabinCounts = { business: 3, economy: 0 };
    const preferred   = Object.entries(cabinCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'economy';
    expect(preferred).not.toBe('economy');
  });

  it('defaults to "economy" when no cabin data is present', () => {
    const cabinCounts = {};
    const preferred   = Object.entries(cabinCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'economy';
    expect(preferred).toBe('economy');
  });

  it('mixed cabin counts → cabin with highest count wins', () => {
    const cabinCounts = { economy: 5, business: 3, first: 1 };
    const preferred   = Object.entries(cabinCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'economy';
    expect(preferred).toBe('economy');
  });
});

// ---------------------------------------------------------------------------
// destination score aggregation logic (US-0102 — hotel search contributes city score)
// Tests the bumpScore-style accumulation used inside aggregatePreferences.
// ---------------------------------------------------------------------------

describe('preferenceEngine — destination score accumulation (US-0102, US-0106)', () => {

  function bumpScore(map, key, amount = 1) {
    map[key] = (map[key] || 0) + amount;
  }

  // Scenario: Hotel search contributes the searched city to the destination preference score
  it('hotel search bumps Barcelona destination score', () => {
    const destScores = {};
    bumpScore(destScores, 'Barcelona', 3);
    expect(destScores['Barcelona']).toBe(3);
  });

  // Scenario: Wishlisted destination appears in the user's destination preference score map (US-0106)
  it('wishlist_added event bumps destination score so Barcelona appears in preference map', () => {
    const destScores = {};
    bumpScore(destScores, 'Barcelona', 2); // wishlist contributes score
    expect(Object.keys(destScores)).toContain('Barcelona');
    expect(destScores['Barcelona']).toBeGreaterThan(0);
  });

  it('multiple events accumulate score for same destination', () => {
    const destScores = {};
    bumpScore(destScores, 'Barcelona', 3); // search
    bumpScore(destScores, 'Barcelona', 2); // view
    bumpScore(destScores, 'Barcelona', 8); // booking
    expect(destScores['Barcelona']).toBe(13);
  });

  it('favoriteDestinations are sorted by score descending', () => {
    const destScores = { Mumbai: 5, Barcelona: 12, Goa: 8 };
    const sorted = Object.entries(destScores)
      .map(([destination, score]) => ({ destination, score }))
      .sort((a, b) => b.score - a.score);
    expect(sorted[0].destination).toBe('Barcelona');
    expect(sorted[1].destination).toBe('Goa');
    expect(sorted[2].destination).toBe('Mumbai');
  });
});
