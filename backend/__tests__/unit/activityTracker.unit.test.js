'use strict';

/**
 * Unit tests — activityTracker pure exports
 * Covers: US-0101–US-0106, US-0302 weight spec, US-0104 tier boundaries
 * No database; tests exported pure functions only.
 */

const { tierFromScore, INTENT_WEIGHTS } = require('../../services/activityTracker');

describe('activityTracker — tierFromScore (US-0302)', () => {

  // Scenario: Score of 71 or above classifies tier as high
  it('score 0 → low', () => {
    expect(tierFromScore(0)).toBe('low');
  });

  it('score 30 → low (just below medium threshold)', () => {
    expect(tierFromScore(30)).toBe('low');
  });

  // Scenario: Score crossing 31 transitions tier from low to medium
  it('score 31 → medium (lower boundary)', () => {
    expect(tierFromScore(31)).toBe('medium');
  });

  it('score 35 → medium', () => {
    expect(tierFromScore(35)).toBe('medium');
  });

  it('score 70 → medium (just below high threshold)', () => {
    expect(tierFromScore(70)).toBe('medium');
  });

  it('score 71 → high (lower boundary)', () => {
    expect(tierFromScore(71)).toBe('high');
  });

  it('score 85 → high', () => {
    expect(tierFromScore(85)).toBe('high');
  });

  it('score 100 → high', () => {
    expect(tierFromScore(100)).toBe('high');
  });
});

describe('activityTracker — INTENT_WEIGHTS spec values (US-0302 Scenario Outline)', () => {

  // These match the current implementation — should stay GREEN
  it('flight_search weight = 5', () => {
    expect(INTENT_WEIGHTS.flight_search).toBe(5);
  });

  it('hotel_search weight = 5', () => {
    expect(INTENT_WEIGHTS.hotel_search).toBe(5);
  });

  it('return_visit weight = 15', () => {
    expect(INTENT_WEIGHTS.return_visit).toBe(15);
  });

  it('booking_started weight = 25', () => {
    expect(INTENT_WEIGHTS.booking_started).toBe(25);
  });

  it('booking_completed weight = 50', () => {
    expect(INTENT_WEIGHTS.booking_completed).toBe(50);
  });

  it('wishlist_added weight = 5', () => {
    expect(INTENT_WEIGHTS.wishlist_added).toBe(5);
  });

  // RED — Scenario Outline row: flight_view expected_score = 3, but code has 10
  it('flight_view weight = 3 per spec [US-0302] [RED: code=10]', () => {
    expect(INTENT_WEIGHTS.flight_view).toBe(3);
  });

  // RED — Scenario Outline row: hotel_view expected_score = 3, but code has 10
  it('hotel_view weight = 3 per spec [US-0302] [RED: code=10]', () => {
    expect(INTENT_WEIGHTS.hotel_view).toBe(3);
  });
});

describe('activityTracker — INTENT_WEIGHTS completeness', () => {

  it('all required event types are present in INTENT_WEIGHTS', () => {
    const required = [
      'flight_search', 'hotel_search', 'flight_view', 'hotel_view',
      'return_visit', 'booking_started', 'booking_completed', 'wishlist_added'
    ];
    for (const event of required) {
      expect(INTENT_WEIGHTS).toHaveProperty(event);
      expect(typeof INTENT_WEIGHTS[event]).toBe('number');
      expect(INTENT_WEIGHTS[event]).toBeGreaterThan(0);
    }
  });

  // US-0302: Intent weights are centralised in a single configuration object
  it('INTENT_WEIGHTS is a single plain object — not scattered (US-0302)', () => {
    expect(typeof INTENT_WEIGHTS).toBe('object');
    expect(INTENT_WEIGHTS).not.toBeNull();
    // All values must be positive numbers
    for (const [key, val] of Object.entries(INTENT_WEIGHTS)) {
      expect(typeof val).toBe('number');
      expect(val).toBeGreaterThan(0);
    }
  });
});
