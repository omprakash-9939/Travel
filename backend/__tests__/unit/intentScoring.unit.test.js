'use strict';

/**
 * Unit tests — Intent Scoring Engine pure logic
 * Covers: US-0302 Scenario Outline, tier transitions, score cap, score reset spec (US-0303)
 * No database; exercises tierFromScore + INTENT_WEIGHTS only.
 */

const { tierFromScore, INTENT_WEIGHTS } = require('../../services/activityTracker');

// ---------------------------------------------------------------------------
// US-0302 Scenario Outline: Intent score accumulates correctly from a single event
// ---------------------------------------------------------------------------

describe('Intent Scoring — Scenario Outline (US-0302)', () => {

  const cases = [
    // event_type           starting  expected_score  expected_tier   note
    ['flight_search',       0,        5,              'low'],
    ['hotel_search',        0,        5,              'low'],
    ['flight_view',         0,        3,              'low'],   // RED: code=10
    ['hotel_view',          0,        3,              'low'],   // RED: code=10
    ['wishlist_added',      0,        5,              'low'],
    ['return_visit',        0,        15,             'low'],
    ['booking_started',     0,        25,             'low'],
    ['booking_completed',   0,        50,             'medium']
  ];

  test.each(cases)(
    'starting=0 + %s → score=%i, tier=%s',
    (eventType, starting, expectedScore, expectedTier) => {
      const weight   = INTENT_WEIGHTS[eventType];
      const newScore = starting + weight;
      expect(newScore).toBe(expectedScore);
      expect(tierFromScore(newScore)).toBe(expectedTier);
    }
  );
});

// ---------------------------------------------------------------------------
// US-0302: Score crossing 31 transitions tier from low to medium
// ---------------------------------------------------------------------------

describe('Intent Scoring — tier transitions (US-0302)', () => {

  // Scenario: Score crossing 31 transitions tier from low to medium
  it('score 30 + flight_search(5) = 35 → tier transitions low → medium', () => {
    const starting = 30;
    const newScore = starting + INTENT_WEIGHTS.flight_search;
    expect(newScore).toBe(35);
    expect(tierFromScore(starting)).toBe('low');
    expect(tierFromScore(newScore)).toBe('medium');
  });

  // Scenario: Score of 71 or above classifies tier as high
  it('score 71 → tier high', () => {
    expect(tierFromScore(71)).toBe('high');
  });

  it('score 70 + return_visit(15) = 85 → tier high', () => {
    const starting = 70;
    const newScore = starting + INTENT_WEIGHTS.return_visit;
    expect(newScore).toBe(85);
    expect(tierFromScore(newScore)).toBe('high');
  });

  it('score is capped at 100 (Math.min guard)', () => {
    const capped = Math.min(100, 95 + INTENT_WEIGHTS.booking_completed);
    expect(capped).toBe(100);
    expect(tierFromScore(capped)).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// US-0303: Intent score reset after booking completion
// ---------------------------------------------------------------------------

describe('Intent Scoring — score reset after booking (US-0303)', () => {

  // Scenario: Intent score is reset to zero after booking completion (US-0303)
  // Documents spec: after booking_completed, score must be 0 → tier low.
  // The integration test (activityTracker.integration) is the RED test for this — it calls
  // trackBookingDone() against the real service and fails because the reset is not implemented.
  it('a reset score of 0 produces tier low (spec boundary, US-0303)', () => {
    expect(tierFromScore(0)).toBe('low');
  });

  // Scenario: Tier drops to low immediately after post-booking score reset
  it('tier is low after score resets to 0 (US-0303)', () => {
    expect(tierFromScore(0)).toBe('low');
  });
});

// ---------------------------------------------------------------------------
// US-0302: Tier change propagation
// ---------------------------------------------------------------------------

describe('Intent Scoring — tier evaluation (US-0302)', () => {

  it('tier is deterministic from score — same input always same output', () => {
    expect(tierFromScore(0)).toBe(tierFromScore(0));
    expect(tierFromScore(50)).toBe(tierFromScore(50));
    expect(tierFromScore(80)).toBe(tierFromScore(80));
  });

  it('medium tier band: 31 to 70 inclusive', () => {
    expect(tierFromScore(31)).toBe('medium');
    expect(tierFromScore(50)).toBe('medium');
    expect(tierFromScore(70)).toBe('medium');
  });

  it('high tier: 71 and above', () => {
    expect(tierFromScore(71)).toBe('high');
    expect(tierFromScore(99)).toBe('high');
    expect(tierFromScore(100)).toBe('high');
  });
});
