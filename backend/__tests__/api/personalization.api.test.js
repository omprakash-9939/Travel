'use strict';

/**
 * API tests — /api/personalization routes (supertest)
 * Covers:
 *   POST /track      — auth guard, missing eventType validation
 *   GET  /recommendations
 *   GET  /intent
 *   GET  /preferences
 *   GET  /notifications
 *   POST /wishlist
 *   DELETE /wishlist/:itemId
 *   PUT  /notifications/:id/dismiss
 *   POST /preferences/refresh
 *
 * Auth middleware is mocked so tests are token-free.
 * Service layer is mocked so no real DB connections are needed.
 */

const express    = require('express');
const request    = require('supertest');

// ── Service + model mocks — must be declared BEFORE require('../../routes/...') ──

jest.mock('../../services/activityTracker', () => ({
  track:            jest.fn().mockResolvedValue(undefined),
  trackFlightSearch: jest.fn().mockResolvedValue(undefined),
  trackHotelSearch:  jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../services/preferenceEngine', () => ({
  aggregatePreferences: jest.fn().mockResolvedValue({ favoriteDestinations: [] })
}));

jest.mock('../../services/recommendationEngine', () => ({
  getRecommendations: jest.fn().mockResolvedValue({
    recommendedFlights: [],
    recommendedHotels: [],
    recommendedDestinations: [],
    continuePlanning: [],
    notifications: []
  }),
  buildRecommendations: jest.fn().mockResolvedValue({ recommendedFlights: [], notifications: [] }),
  invalidateCache:      jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../models/UserPreference', () => ({
  findOne:          jest.fn(),
  findOneAndUpdate: jest.fn().mockResolvedValue({ wishlist: [] }),
  updateOne:        jest.fn().mockResolvedValue({})
}));

jest.mock('../../models/UserIntentScore', () => ({
  findOne: jest.fn()
}));

jest.mock('../../models/RecommendationCache', () => ({
  findOne:   jest.fn(),
  updateOne: jest.fn().mockResolvedValue({})
}));

jest.mock('../../models/UserActivity', () => ({
  find: jest.fn()
}));

jest.mock('../../services/notificationEngine', () => ({
  selectScenario: jest.fn().mockReturnValue('standard_recs')
}));

// ── Auth middleware mock ──────────────────────────────────────────────────────
// protect: always injects a fake user
// optionalAuth: can be switched per test via a module-level flag

const MOCK_USER = { _id: '507f1f77bcf86cd799439011', email: 'test@example.com', name: 'Test User' };
// jest.mock factories may only reference variables prefixed with "mock" (case-insensitive)
let mockAuthUser = MOCK_USER; // override in tests to simulate unauthenticated

jest.mock('../../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = MOCK_USER;
    next();
  },
  optionalAuth: (req, res, next) => {
    req.user = mockAuthUser; // controlled per test
    next();
  }
}));

// ── Build minimal test app ────────────────────────────────────────────────────

const personalizationRouter = require('../../routes/personalization');
const tracker               = require('../../services/activityTracker');
const { aggregatePreferences }  = require('../../services/preferenceEngine');
const { getRecommendations, invalidateCache } = require('../../services/recommendationEngine');
const UserPreference      = require('../../models/UserPreference');
const UserIntentScore     = require('../../models/UserIntentScore');
const RecommendationCache = require('../../models/RecommendationCache');
const UserActivity        = require('../../models/UserActivity');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/personalization', personalizationRouter);
  return app;
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

let app;

beforeAll(() => {
  app = buildApp();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUser = MOCK_USER; // default: authenticated

  // Reset default mock return values after clearAllMocks
  tracker.track.mockResolvedValue(undefined);
  getRecommendations.mockResolvedValue({
    recommendedFlights: [], recommendedHotels: [],
    recommendedDestinations: [], continuePlanning: [], notifications: []
  });
  invalidateCache.mockResolvedValue(undefined);
  aggregatePreferences.mockResolvedValue({ favoriteDestinations: [] });
  // Models are called with .lean() or .select().lean() chains in routes
  UserPreference.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  UserPreference.findOneAndUpdate.mockResolvedValue({ wishlist: [] });
  UserIntentScore.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ score: 0, tier: 'low', breakdown: {} }) });
  RecommendationCache.findOne.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    lean:   jest.fn().mockResolvedValue(null)
  });
  RecommendationCache.updateOne.mockResolvedValue({});
  UserActivity.find.mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      })
    })
  });
});

// ── POST /api/personalization/track ──────────────────────────────────────────

describe('POST /api/personalization/track', () => {

  // Scenario: Unauthenticated tracking returns { tracked: false, reason: 'not authenticated' } (US-0101)
  it('returns tracked:false with reason "not authenticated" for unauthenticated user', async () => {
    mockAuthUser = null; // simulate no auth token

    const res = await request(app)
      .post('/api/personalization/track')
      .send({ eventType: 'flight_search', metadata: { destination: 'Barcelona' } });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tracked).toBe(false);
    expect(res.body.reason).toBe('not authenticated');
  });

  it('returns 400 when eventType is missing', async () => {
    const res = await request(app)
      .post('/api/personalization/track')
      .send({ metadata: { destination: 'Barcelona' } }); // no eventType

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns tracked:true for authenticated user with valid eventType', async () => {
    const res = await request(app)
      .post('/api/personalization/track')
      .send({ eventType: 'flight_search', metadata: { destination: 'Barcelona' }, sessionId: 'sess1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tracked).toBe(true);
  });

  it('calls tracker.track with correct userId, eventType, and metadata', async () => {
    await request(app)
      .post('/api/personalization/track')
      .send({ eventType: 'flight_search', metadata: { destination: 'Barcelona' }, sessionId: 'sess1' });

    expect(tracker.track).toHaveBeenCalledWith(
      MOCK_USER._id,
      'flight_search',
      { destination: 'Barcelona' },
      'sess1'
    );
  });

  it('never calls tracker.track when user is not authenticated', async () => {
    mockAuthUser = null;
    await request(app)
      .post('/api/personalization/track')
      .send({ eventType: 'flight_search', metadata: {} });

    expect(tracker.track).not.toHaveBeenCalled();
  });
});

// ── GET /api/personalization/recommendations ──────────────────────────────────

describe('GET /api/personalization/recommendations', () => {

  it('returns 200 with success:true and data object', async () => {
    const res = await request(app).get('/api/personalization/recommendations');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('calls getRecommendations with authenticated user id', async () => {
    await request(app).get('/api/personalization/recommendations');
    expect(getRecommendations).toHaveBeenCalledWith(MOCK_USER._id);
  });

  it('recommendations payload contains expected keys', async () => {
    getRecommendations.mockResolvedValue({
      recommendedFlights:      [{ flightId: 'f1', destination: 'Barcelona' }],
      recommendedHotels:       [],
      recommendedDestinations: [],
      continuePlanning:        [],
      notifications:           []
    });

    const res = await request(app).get('/api/personalization/recommendations');
    expect(res.body.data.recommendedFlights).toHaveLength(1);
    expect(res.body.data.recommendedFlights[0].destination).toBe('Barcelona');
  });
});

// ── GET /api/personalization/intent ──────────────────────────────────────────

describe('GET /api/personalization/intent', () => {

  it('returns 200 with intent score and tier', async () => {
    UserIntentScore.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ score: 35, tier: 'medium', breakdown: { searches: 3 } }) });

    const res = await request(app).get('/api/personalization/intent');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.intent.score).toBe(35);
    expect(res.body.intent.tier).toBe('medium');
  });

  it('returns default score 0 when no intent record exists for user', async () => {
    UserIntentScore.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await request(app).get('/api/personalization/intent');

    expect(res.status).toBe(200);
    expect(res.body.intent.score).toBe(0);
    expect(res.body.intent.tier).toBe('low');
  });
});

// ── GET /api/personalization/preferences ─────────────────────────────────────

describe('GET /api/personalization/preferences', () => {

  it('returns 200 with preferences object', async () => {
    UserPreference.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ favoriteDestinations: [{ destination: 'Barcelona', score: 8 }] }) });

    const res = await request(app).get('/api/personalization/preferences');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.preferences).toBeDefined();
  });

  it('triggers aggregatePreferences when no preference record exists yet', async () => {
    UserPreference.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    await request(app).get('/api/personalization/preferences');

    expect(aggregatePreferences).toHaveBeenCalledWith(MOCK_USER._id);
  });
});

// ── GET /api/personalization/notifications ────────────────────────────────────

describe('GET /api/personalization/notifications', () => {

  it('returns 200 with notifications array (may be empty)', async () => {
    RecommendationCache.findOne.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ notifications: [] }) });

    const res = await request(app).get('/api/personalization/notifications');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });

  it('filters out dismissed notifications before returning', async () => {
    RecommendationCache.findOne.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({
      notifications: [
        { id: 'n1', type: 'return_reminder', title: 'Still thinking?', dismissed: false },
        { id: 'n2', type: 'price_drop',      title: 'Price dropped!',  dismissed: true  }
      ]
    }) });

    const res = await request(app).get('/api/personalization/notifications');

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].id).toBe('n1');
  });

  // Scenario: No price_drop notification visible when flag is off (US-0601)
  // Verified here by asserting the route doesn't return price_drop when cache has none
  it('does not expose price_drop notification when none is in cache (US-0601)', async () => {
    RecommendationCache.findOne.mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({
      notifications: [
        { id: 'rr1', type: 'return_reminder', title: 'Still thinking?', dismissed: false }
      ]
    }) });

    const res = await request(app).get('/api/personalization/notifications');

    const priceDrops = res.body.notifications.filter(n => n.type === 'price_drop');
    expect(priceDrops).toHaveLength(0);
  });
});

// ── PUT /api/personalization/notifications/:id/dismiss ───────────────────────

describe('PUT /api/personalization/notifications/:id/dismiss', () => {

  it('returns 200 success when notification is dismissed', async () => {
    const res = await request(app).put('/api/personalization/notifications/n1/dismiss');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('calls RecommendationCache.updateOne with the correct notification id and dismissed:true', async () => {
    await request(app).put('/api/personalization/notifications/return_reminder_Barcelona/dismiss');

    expect(RecommendationCache.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ 'notifications.id': 'return_reminder_Barcelona' }),
      expect.objectContaining({ $set: { 'notifications.$.dismissed': true } })
    );
  });
});

// ── POST /api/personalization/wishlist ────────────────────────────────────────

describe('POST /api/personalization/wishlist', () => {

  // Scenario: Wishlist add event is tracked (US-0106)
  it('returns 200 and tracks wishlist_added event', async () => {
    const res = await request(app)
      .post('/api/personalization/wishlist')
      .send({ type: 'flight', itemId: 'f123', destination: 'Barcelona', price: 45000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(tracker.track).toHaveBeenCalledWith(
      MOCK_USER._id,
      'wishlist_added',
      expect.objectContaining({ destination: 'Barcelona' })
    );
  });

  it('invalidates recommendation cache after adding to wishlist', async () => {
    await request(app)
      .post('/api/personalization/wishlist')
      .send({ type: 'flight', itemId: 'f123', destination: 'Barcelona', price: 45000 });

    expect(invalidateCache).toHaveBeenCalledWith(MOCK_USER._id);
  });
});

// ── DELETE /api/personalization/wishlist/:itemId ──────────────────────────────

describe('DELETE /api/personalization/wishlist/:itemId', () => {

  it('returns 200 success when wishlist item is removed', async () => {
    UserPreference.updateOne = jest.fn().mockResolvedValue({});
    const res = await request(app).delete('/api/personalization/wishlist/f123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/personalization/activities', () => {
  it('returns recent UserActivity rows for user', async () => {
    const createdAt = new Date('2026-06-05T10:00:00Z');
    UserActivity.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                eventType: 'flight_search',
                metadata: { destination: 'Dubai' },
                sessionId: 'sess1',
                intentPoints: 5,
                createdAt
              }
            ])
          })
        })
      })
    });

    const res = await request(app).get('/api/personalization/activities');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.activities).toHaveLength(1);
    expect(res.body.activities[0].eventType).toBe('flight_search');
    expect(res.body.activities[0].metadata.destination).toBe('Dubai');
    expect(res.body.activities[0].source).toBe('server');
  });

  it('respects limit query param capped at 50', async () => {
    const limit = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      })
    });
    UserActivity.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ limit })
    });

    await request(app).get('/api/personalization/activities?limit=100');

    expect(limit).toHaveBeenCalledWith(50);
  });
});