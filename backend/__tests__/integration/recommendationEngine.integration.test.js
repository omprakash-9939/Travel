'use strict';

/**
 * Integration tests — recommendationEngine with mocked Mongoose models
 * Covers:
 *   US-0401 Active planning intent takes priority (RC-10)
 *   US-0401 Preference fallback, cold-start fallback, cache write
 *   US-0402 Cache TTL, cache invalidation
 *   US-0403 Real-time notification path independence
 *   US-0601 price_drop feature flag (RC-6)  ← will be RED
 *   US-0602 return_reminder generation conditions + dedup
 *   US-0603 Post-booking notification suppression (RC-5)  ← will be RED
 */

// ── Model mocks ──────────────────────────────────────────────────────────────

jest.mock('../../models/Flight',              () => ({ find: jest.fn() }));
jest.mock('../../models/Hotel',               () => ({ find: jest.fn() }));
jest.mock('../../models/Booking',             () => ({ aggregate: jest.fn() }));
jest.mock('../../models/UserActivity',        () => ({ find: jest.fn() }));
jest.mock('../../models/UserPreference',      () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../../models/UserIntentScore',     () => ({ findOne: jest.fn(), updateOne: jest.fn() }));
jest.mock('../../models/RecommendationCache', () => ({
  findOne:   jest.fn(),
  create:    jest.fn(),
  deleteOne: jest.fn()
}));

// preferenceEngine.aggregatePreferences is called on cache miss — mock it
jest.mock('../../services/preferenceEngine', () => ({
  aggregatePreferences: jest.fn()
}));

// ai/destinationData is imported at module load — mock it
jest.mock('../../services/ai/destinationData', () => ({
  TRENDING: [
    { destination: 'Bali',    score: 90 },
    { destination: 'Bangkok', score: 85 },
    { destination: 'Goa',     score: 80 }
  ]
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const Flight              = require('../../models/Flight');
const Hotel               = require('../../models/Hotel');
const Booking             = require('../../models/Booking');
const UserActivity        = require('../../models/UserActivity');
const UserPreference      = require('../../models/UserPreference');
const UserIntentScore     = require('../../models/UserIntentScore');
const RecommendationCache = require('../../models/RecommendationCache');
const { aggregatePreferences } = require('../../services/preferenceEngine');

// Chainable Mongoose query stub helpers
const lean   = (val) => ({ lean: jest.fn().mockResolvedValue(val) });
const chain  = (val) => ({
  sort:   jest.fn().mockReturnThis(),
  limit:  jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean:   jest.fn().mockResolvedValue(val)
});

const {
  getRecommendations,
  buildRecommendations,
  invalidateCache
} = require('../../services/recommendationEngine');

const MOCK_USER_ID = '507f1f77bcf86cd799439011';

// Pre-built pref fixture for Barcelona active planning
const barcelonaPrefs = {
  favoriteDestinations:     [{ destination: 'Barcelona', score: 8 }],
  preferredAirlines:        [{ code: 'IB', name: 'Iberia', score: 5 }],
  preferredHotelCategories: [{ category: 'Business', score: 4 }],
  budget: { flightMin: 30000, flightMax: 80000, flightAvg: 50000, hotelMin: 3000, hotelMax: 15000, hotelAvg: 8000 },
  preferredCabin: 'economy',
  lastAggregatedAt: new Date()
};

const emptyPrefs = {
  favoriteDestinations:     [],
  preferredAirlines:        [],
  preferredHotelCategories: [],
  budget: { flightMin: 0, flightMax: 50000, flightAvg: 0, hotelMin: 0, hotelMax: 20000, hotelAvg: 0 },
  preferredCabin: 'economy',
  lastAggregatedAt: new Date()
};

const barcelonaFlight = {
  _id: 'f1',
  flightNumber: 'IB1234',
  airline: { name: 'Iberia', code: 'IB' },
  origin: { city: 'Delhi' },
  destination: { city: 'Barcelona' },
  departure: new Date(Date.now() + 86400000),
  cabins: { economy: { price: 45000 } },
  refundable: false
};

const barcelonaHotel = {
  _id: 'h1',
  name: 'Hotel Arts',
  location: { city: 'Barcelona' },
  starRating: 5,
  userRating: 9.2,
  isActive: true,
  roomTypes: [{ price: 12000 }]
};

const mockCacheDoc = (overrides = {}) => ({
  user: MOCK_USER_ID,
  recommendedFlights: [],
  recommendedHotels: [],
  recommendedDestinations: [],
  continuePlanning: [],
  notifications: [],
  validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000),
  builtAt: new Date(),
  toObject: function() { return this; },
  ...overrides
});

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Default: no existing cache (getRecommendations calls .lean() directly)
  RecommendationCache.findOne.mockReturnValue(lean(null));
  RecommendationCache.deleteOne.mockResolvedValue({});
  RecommendationCache.create.mockImplementation((data) =>
    Promise.resolve({ ...data, toObject() { return this; } })
  );

  // Default: prefs already aggregated — supports .lean() chain
  UserPreference.findOne.mockReturnValue(lean(barcelonaPrefs));
  aggregatePreferences.mockResolvedValue(barcelonaPrefs);

  // Default: fresh intent score — supports .lean() chain
  UserIntentScore.findOne.mockReturnValue(lean({
    score: 45,
    tier: 'medium',
    primaryPlanningDestination: 'Barcelona',
    breakdown: { repeatSearches: 2 },
    sentNotifications: []
  }));
  UserIntentScore.updateOne.mockResolvedValue({});

  // Default: flight + hotel DB results — support .limit().lean() chain
  Flight.find.mockReturnValue(chain([barcelonaFlight]));
  Hotel.find.mockReturnValue(chain([barcelonaHotel]));
  Booking.aggregate.mockResolvedValue([]);

  // Default: no recent searches (buildContinuePlanning) — .sort().limit().lean()
  UserActivity.find.mockReturnValue(chain([]));
});

// ── US-0401: Active planning intent takes priority (RC-10) ───────────────────

describe('buildRecommendations — active planning intent priority (US-0401 RC-10)', () => {

  // Scenario: Active planning intent takes priority over all-time preference history
  it('Barcelona flights and hotels appear when primaryPlanningDestination is Barcelona', async () => {
    const result = await buildRecommendations(MOCK_USER_ID);
    // At least one recommended flight should be for Barcelona
    const hasBarcelona = result.recommendedFlights.some(f => f.destination === 'Barcelona')
      || result.recommendedHotels.some(h => h.city === 'Barcelona');
    expect(hasBarcelona).toBe(true);
  });

  // Scenario: Recommendation results are written to cache after being built
  it('writes results to RecommendationCache after build (US-0401)', async () => {
    await buildRecommendations(MOCK_USER_ID);
    expect(RecommendationCache.create).toHaveBeenCalledWith(
      expect.objectContaining({
        validUntil: expect.any(Date)
      })
    );
    const createArg = RecommendationCache.create.mock.calls[0][0];
    expect(createArg.validUntil.getTime()).toBeGreaterThan(Date.now());
  });

  // Scenario: Cache TTL is 6 hours
  it('cache validUntil is approximately 6 hours from now', async () => {
    await buildRecommendations(MOCK_USER_ID);
    const createArg = RecommendationCache.create.mock.calls[0][0];
    const sixHoursMs = 6 * 60 * 60 * 1000;
    const diff = createArg.validUntil.getTime() - Date.now();
    expect(diff).toBeGreaterThan(sixHoursMs - 5000);
    expect(diff).toBeLessThan(sixHoursMs + 5000);
  });

  // Scenario: Cold-start fallback when no intent and no preference history
  it('returns non-empty results even when user has no preferences (cold-start, US-0401)', async () => {
    UserPreference.findOne.mockReturnValue(lean(null));
    aggregatePreferences.mockResolvedValue(emptyPrefs);
    UserIntentScore.findOne.mockReturnValue(lean(null));
    Flight.find.mockReturnValue(chain([barcelonaFlight]));
    Hotel.find.mockReturnValue(chain([barcelonaHotel]));

    const result = await buildRecommendations(MOCK_USER_ID);
    // Response must not be empty — cold-start list must kick in
    const totalItems = result.recommendedFlights.length + result.recommendedHotels.length
      + result.recommendedDestinations.length;
    expect(totalItems).toBeGreaterThan(0);
  });

  // Scenario: Recommendation engine error returns cold-start fallback rather than empty response
  // RED — current buildRecommendations throws through; no catch-return-fallback
  it('returns cold-start fallback (not empty) when buildRecommendations throws [RED: no catch]', async () => {
    // Reject at the lean() level so the chained calls don't throw synchronously
    Flight.find.mockReturnValue({
      limit: jest.fn().mockReturnThis(),
      lean:  jest.fn().mockRejectedValue(new Error('DB timeout'))
    });

    let result;
    try {
      result = await buildRecommendations(MOCK_USER_ID);
    } catch {
      result = null;
    }
    // With the fix, result should be non-null and have a cold-start list
    expect(result).not.toBeNull();
    expect(Array.isArray(result.recommendedFlights)).toBe(true);
  });
});

// ── US-0402: Preference history + cache behaviour ────────────────────────────

describe('getRecommendations — cache TTL behaviour (US-0402)', () => {

  // Scenario: Cached recommendations served within 6-hour TTL without new DB query
  it('serves cached result when cache is fresh and skips DB query', async () => {
    const freshCache = mockCacheDoc({
      recommendedFlights: [{ flightId: 'f1', destination: 'Barcelona', price: 45000, score: 80 }],
      validUntil: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 h from now
    });
    RecommendationCache.findOne.mockReturnValue(lean(freshCache));

    const result = await getRecommendations(MOCK_USER_ID);

    expect(result.recommendedFlights).toHaveLength(1);
    // No new DB query for flights or hotels
    expect(Flight.find).not.toHaveBeenCalled();
    expect(Hotel.find).not.toHaveBeenCalled();
  });

  // Scenario: Cache is invalidated after a booking and fresh query runs next time
  it('runs a fresh DB query after cache invalidation (US-0402)', async () => {
    await invalidateCache(MOCK_USER_ID);
    expect(RecommendationCache.deleteOne).toHaveBeenCalled();

    // Next getRecommendations call finds no cache and triggers a rebuild
    RecommendationCache.findOne.mockReturnValue(lean(null));
    await getRecommendations(MOCK_USER_ID);
    expect(Flight.find).toHaveBeenCalled();
  });

  // Scenario: Unavailable destination skipped, next favourite tried, response not empty
  it('result is non-empty when first favourite destination has no flights (US-0402)', async () => {
    UserPreference.findOne.mockReturnValue(lean({
      ...barcelonaPrefs,
      favoriteDestinations: [
        { destination: 'NoFlightsCity', score: 10 },
        { destination: 'Barcelona',     score: 8 }
      ]
    }));
    Flight.find.mockReturnValue(chain([barcelonaFlight])); // Barcelona flight returned

    const result = await buildRecommendations(MOCK_USER_ID);
    expect(result.recommendedFlights.length + result.recommendedHotels.length).toBeGreaterThan(0);
  });
});

// ── US-0601: price_drop feature flag (RC-6) ──────────────────────────────────

describe('buildNotifications — price_drop feature flag (US-0601 RC-6)', () => {

  // Scenario: price_drop notification is not generated when feature flag is off
  // RED — current buildNotifications always generates price_drop; no flag check
  it('generates NO price_drop notification when ENABLE_PRICE_DROP_NOTIFICATIONS is absent [RED: RC-6]', async () => {
    delete process.env.ENABLE_PRICE_DROP_NOTIFICATIONS;

    const result = await buildRecommendations(MOCK_USER_ID);
    const priceDrop = result.notifications.filter(n => n.type === 'price_drop');
    expect(priceDrop).toHaveLength(0);
  });

  it('generates NO price_drop notification when ENABLE_PRICE_DROP_NOTIFICATIONS is "false" [RED: RC-6]', async () => {
    process.env.ENABLE_PRICE_DROP_NOTIFICATIONS = 'false';

    const result = await buildRecommendations(MOCK_USER_ID);
    const priceDrop = result.notifications.filter(n => n.type === 'price_drop');
    expect(priceDrop).toHaveLength(0);

    delete process.env.ENABLE_PRICE_DROP_NOTIFICATIONS;
  });

  // Scenario: Disabling price_drop does not affect other notification types
  it('return_reminder and selling_fast still generate when price_drop flag is off [RED: RC-6]', async () => {
    delete process.env.ENABLE_PRICE_DROP_NOTIFICATIONS;

    // Setup prefs with a beach destination to trigger selling_fast
    UserPreference.findOne.mockReturnValue(lean({
      ...barcelonaPrefs,
      favoriteDestinations: [
        { destination: 'Barcelona', score: 8 },
        { destination: 'Goa',       score: 6 }
      ]
    }));

    const result = await buildRecommendations(MOCK_USER_ID);
    const nonPriceDrop = result.notifications.filter(n => n.type !== 'price_drop');
    // Must have at least one non-price-drop notification when conditions are met
    expect(nonPriceDrop.length).toBeGreaterThan(0);
  });

  // Scenario: price_drop generates normally when feature flag is explicitly true
  it('generates price_drop when ENABLE_PRICE_DROP_NOTIFICATIONS is "true"', async () => {
    process.env.ENABLE_PRICE_DROP_NOTIFICATIONS = 'true';

    const result = await buildRecommendations(MOCK_USER_ID);
    // With the flag correctly implemented, this should produce a price_drop
    // Currently it will also pass (because the flag check doesn't exist yet → price_drop always fires)
    const priceDrop = result.notifications.filter(n => n.type === 'price_drop');
    expect(priceDrop.length).toBeGreaterThanOrEqual(1);

    delete process.env.ENABLE_PRICE_DROP_NOTIFICATIONS;
  });
});

// ── US-0602: return_reminder conditions + dedup ───────────────────────────────

describe('buildNotifications — return_reminder (US-0602 RC-2)', () => {

  // Scenario: return_reminder created within same request cycle as qualifying return_visit
  it('return_reminder is present in notifications for medium-tier user with repeat searches', async () => {
    const result = await buildRecommendations(MOCK_USER_ID);
    const reminder = result.notifications.find(n => n.type === 'return_reminder');
    expect(reminder).toBeDefined();
  });

  // Scenario: return_reminder content includes destination and pre-filled search link
  it('return_reminder includes destination "Barcelona" and a ctaUrl for Barcelona (US-0602)', async () => {
    const result = await buildRecommendations(MOCK_USER_ID);
    const reminder = result.notifications.find(n => n.type === 'return_reminder');
    expect(reminder).toBeDefined();
    expect(reminder.title).toMatch(/Barcelona/i);
    expect(reminder.ctaUrl).toContain('Barcelona');
  });

  // Scenario: No duplicate return_reminder within 48-hour dedup window
  it('does NOT generate return_reminder when one was already sent within 48 h (US-0602)', async () => {
    const recentlySentIntent = {
      score: 45,
      tier: 'medium',
      primaryPlanningDestination: 'Barcelona',
      breakdown: { repeatSearches: 2 },
      sentNotifications: [
        { type: 'return_reminder', sentAt: new Date(Date.now() - 60 * 60 * 1000) } // 1h ago
      ]
    };
    UserIntentScore.findOne.mockReturnValue(lean(recentlySentIntent));

    const result = await buildRecommendations(MOCK_USER_ID);
    const reminders = result.notifications.filter(n => n.type === 'return_reminder');
    expect(reminders).toHaveLength(0);
  });

  // Scenario: No return_reminder for low-tier user
  it('does NOT generate return_reminder when intent tier is "low" (US-0602)', async () => {
    UserIntentScore.findOne.mockReturnValue(lean({
      score: 5,
      tier: 'low',
      primaryPlanningDestination: 'Barcelona',
      breakdown: { repeatSearches: 2 },
      sentNotifications: []
    }));

    const result = await buildRecommendations(MOCK_USER_ID);
    const reminders = result.notifications.filter(n => n.type === 'return_reminder');
    expect(reminders).toHaveLength(0);
  });
});

// ── US-0603: Post-booking notification suppression (RC-5) ─────────────────────

describe('buildNotifications — post-booking suppression (US-0603 RC-5)', () => {

  // Scenario: No new notifications for booked destination during cool-down
  // RED — no cool-down logic exists in current buildNotifications
  it('generates NO Barcelona notifications when booking cool-down is active [RED: RC-5]', async () => {
    UserIntentScore.findOne.mockReturnValue(lean({
      score: 0,
      tier: 'low',
      primaryPlanningDestination: 'Barcelona',
      breakdown: { repeatSearches: 2 },
      sentNotifications: [],
      bookingCooldowns: [{ destination: 'Barcelona', bookedAt: new Date() }] // desired structure
    }));

    const result = await buildRecommendations(MOCK_USER_ID);
    const barcelonaNotifs = result.notifications.filter(n =>
      n.id && n.id.toLowerCase().includes('barcelona')
    );
    expect(barcelonaNotifs).toHaveLength(0);
  });

  // Scenario: Notifications for other destinations unaffected by Barcelona cool-down
  it('Singapore notifications still generate when Barcelona cool-down is active (US-0603)', async () => {
    UserPreference.findOne.mockReturnValue(lean({
      ...barcelonaPrefs,
      favoriteDestinations: [
        { destination: 'Singapore', score: 10 },
        { destination: 'Goa',       score: 6 }
      ]
    }));
    UserIntentScore.findOne.mockReturnValue(lean({
      score: 45,
      tier: 'medium',
      primaryPlanningDestination: 'Singapore',
      breakdown: { repeatSearches: 2 },
      sentNotifications: [],
      bookingCooldowns: [{ destination: 'Barcelona', bookedAt: new Date() }]
    }));

    const result = await buildRecommendations(MOCK_USER_ID);
    const notifs = result.notifications;
    expect(notifs.length).toBeGreaterThan(0);
  });
});

// ── US-0403: Real-time notification path independence ────────────────────────

describe('recommendation engine — batch independence (US-0403 RC-2)', () => {

  // Scenario: Real-time notification failure degrades gracefully
  it('buildRecommendations resolves even when UserIntentScore.updateOne fails (US-0403)', async () => {
    UserIntentScore.updateOne.mockRejectedValue(new Error('DB timeout'));

    // Should not throw — failure logged and pipeline continues
    await expect(buildRecommendations(MOCK_USER_ID)).resolves.toBeDefined();
  });
});
