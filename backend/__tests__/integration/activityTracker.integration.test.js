'use strict';

/**
 * Integration tests — activityTracker with mocked Mongoose models
 * Covers:
 *   US-0101 track flight_search — full metadata, dest extraction, intent increment
 *   US-0102 track hotel_search
 *   US-0103 trackFlightView — cabin default (RC-8)
 *   US-0104 booking double-tracking fix (RC-4)
 *   US-0105 cross-session return visit detection (RC-3)
 *   US-0106 wishlist events
 *   US-0301/US-0303 score reset after booking_completed (RC-5)
 *   US-0304 destination extraction — origin must NOT be used as fallback (RC-9)
 */

// ── Mongoose model mocks ─────────────────────────────────────────────────────

jest.mock('../../models/UserActivity', () => ({
  create:  jest.fn(),
  findOne: jest.fn(),
  find:    jest.fn()
}));

jest.mock('../../models/UserIntentScore', () => {
  // Constructor mock: captures instances so tests can inspect mutated state
  const instances = [];
  function MockUserIntentScore(data) {
    Object.assign(this, {
      score: 0,
      tier: 'low',
      breakdown: {
        searches: 0, repeatSearches: 0, views: 0,
        returnVisits: 0, bookingsStarted: 0, bookingsCompleted: 0, wishlistAdds: 0
      },
      primaryPlanningDestination: null,
      sentNotifications: [],
      ...data
    });
    this.save = jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    });
    MockUserIntentScore._instances = MockUserIntentScore._instances || [];
    MockUserIntentScore._instances.push(this);
  }
  MockUserIntentScore.findOne  = jest.fn();
  MockUserIntentScore.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  MockUserIntentScore._instances = [];
  return MockUserIntentScore;
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const UserActivity    = require('../../models/UserActivity');
const UserIntentScore = require('../../models/UserIntentScore');

const {
  track,
  trackFlightSearch,
  trackHotelSearch,
  trackFlightView,
  trackBookingStart,
  trackBookingDone
} = require('../../services/activityTracker');

const MOCK_USER_ID  = '507f1f77bcf86cd799439011';
const MOCK_SESSION  = 'session-abc-123';

// Chainable query stub used by findOne(...).sort(...).lean()
const noActivity = () => ({
  sort:  jest.fn().mockReturnThis(),
  lean:  jest.fn().mockResolvedValue(null)
});

const priorActivity = (createdAt) => ({
  sort:  jest.fn().mockReturnThis(),
  lean:  jest.fn().mockResolvedValue({ _id: 'prior', createdAt })
});

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  UserIntentScore._instances = [];

  // Default: no prior activity found → maybeReturnVisit returns false,
  //          isRepeatSearch returns false
  UserActivity.findOne.mockReturnValue(noActivity());
  // Default: no existing intent score → constructor path taken
  UserIntentScore.findOne.mockResolvedValue(null);
  // Default: create resolves with mock document
  UserActivity.create.mockResolvedValue({ _id: 'act1', createdAt: new Date() });
});

// ── US-0101: Flight search tracking ─────────────────────────────────────────

describe('trackFlightSearch (US-0101)', () => {

  // Scenario: Flight search is recorded with full metadata
  it('creates a flight_search UserActivity record with full metadata', async () => {
    const meta = {
      destination: 'Barcelona', origin: 'Delhi',
      departDate: '2026-07-10', returnDate: '2026-07-17',
      passengers: 2, cabin: 'economy'
    };
    await trackFlightSearch(MOCK_USER_ID, meta, MOCK_SESSION);

    expect(UserActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'flight_search',
        metadata: expect.objectContaining({
          destination: 'Barcelona',
          origin: 'Delhi',
          cabin: 'economy',
          passengers: 2
        })
      })
    );
  });

  // Scenario: Flight search updates primaryPlanningDestination to destination, not origin
  it('sets primaryPlanningDestination to Barcelona, not Delhi (US-0101 dest-extraction)', async () => {
    const meta = { destination: 'Barcelona', origin: 'Delhi' };
    await trackFlightSearch(MOCK_USER_ID, meta, MOCK_SESSION);

    // After track(), a new UserIntentScore instance is created and saved
    const instance = UserIntentScore._instances[0];
    expect(instance).toBeDefined();
    expect(instance.primaryPlanningDestination).toBe('Barcelona');
    expect(instance.primaryPlanningDestination).not.toBe('Delhi');
  });

  // Scenario: Flight search increments intent score by flight_search weight (5 pts)
  it('intent score increments by 5 (flight_search weight)', async () => {
    await trackFlightSearch(MOCK_USER_ID, { destination: 'Barcelona' }, MOCK_SESSION);
    const instance = UserIntentScore._instances[0];
    expect(instance.score).toBe(5);
    expect(instance.tier).toBe('low');
  });

  // Scenario: Unauthenticated flight search is not tracked
  // (Enforced at route level; track() is never called — verified in API tests)
});

// ── US-0102: Hotel search tracking ──────────────────────────────────────────

describe('trackHotelSearch (US-0102)', () => {

  // Scenario: Hotel search is recorded with full metadata
  it('creates a hotel_search UserActivity record with full metadata', async () => {
    const meta = { city: 'Barcelona', checkIn: '2026-07-10', checkOut: '2026-07-17', guests: 2 };
    await trackHotelSearch(MOCK_USER_ID, meta, MOCK_SESSION);

    expect(UserActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'hotel_search',
        metadata: expect.objectContaining({
          destination: 'Barcelona',
          city: 'Barcelona'
        })
      })
    );
  });

  // Scenario: Hotel search increments intent score by hotel_search weight (5 pts)
  it('intent score increments by 5 (hotel_search weight)', async () => {
    await trackHotelSearch(MOCK_USER_ID, { city: 'Barcelona' }, MOCK_SESSION);
    const instance = UserIntentScore._instances[0];
    expect(instance.score).toBe(5);
  });
});

// ── US-0103: Flight view — cabin default (RC-8) ──────────────────────────────

describe('trackFlightView (US-0103 RC-8)', () => {

  // Scenario: Flight view event includes the cabin class of the viewed flight
  it('records cabin from metadata when present', async () => {
    await trackFlightView(MOCK_USER_ID, { destination: 'Barcelona', cabin: 'business' }, MOCK_SESSION);
    expect(UserActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'flight_view',
        metadata: expect.objectContaining({ cabin: 'business' })
      })
    );
  });

  // Scenario: Flight view event without cabin data defaults to economy rather than undefined
  // RED — current trackFlightView passes metadata as-is; no cabin default applied
  it('defaults cabin to "economy" when cabin is absent from metadata [RED: not yet fixed]', async () => {
    await trackFlightView(MOCK_USER_ID, { destination: 'Barcelona' /* no cabin */ }, MOCK_SESSION);
    expect(UserActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'flight_view',
        metadata: expect.objectContaining({ cabin: 'economy' })
      })
    );
  });
});

// ── US-0104: Booking double-tracking fix (RC-4) ──────────────────────────────

describe('booking event deduplication (US-0104 RC-4)', () => {

  // Scenario: Exactly one booking_started record is created per booking
  // RED — current track() has no dedup guard; calling it twice creates two records
  it('creates exactly one booking_started record even if called twice [RED: not yet fixed]', async () => {
    const meta = { destination: 'Barcelona', bookingId: 'bk-001' };
    await trackBookingStart(MOCK_USER_ID, meta, MOCK_SESSION);
    await trackBookingStart(MOCK_USER_ID, meta, MOCK_SESSION);

    const startedCalls = UserActivity.create.mock.calls.filter(
      ([arg]) => arg.eventType === 'booking_started'
    );
    expect(startedCalls).toHaveLength(1);
  });

  // Scenario: Exactly one booking_completed record is created per booking
  // RED — same issue
  it('creates exactly one booking_completed record even if called twice [RED: not yet fixed]', async () => {
    const meta = { destination: 'Barcelona', bookingId: 'bk-001' };
    await trackBookingDone(MOCK_USER_ID, meta, MOCK_SESSION);
    await trackBookingDone(MOCK_USER_ID, meta, MOCK_SESSION);

    const completedCalls = UserActivity.create.mock.calls.filter(
      ([arg]) => arg.eventType === 'booking_completed'
    );
    expect(completedCalls).toHaveLength(1);
  });

  // Scenario: Booking counters reflect single-count values after the fix
  it('breakdown.bookingsStarted equals 1 after a single booking (US-0104)', async () => {
    await trackBookingStart(MOCK_USER_ID, { destination: 'Barcelona', bookingId: 'bk-001' }, MOCK_SESSION);
    const instance = UserIntentScore._instances[0];
    expect(instance.breakdown.bookingsStarted).toBe(1);
  });

  it('breakdown.bookingsCompleted equals 1 after a single booking (US-0104)', async () => {
    await trackBookingDone(MOCK_USER_ID, { destination: 'Barcelona', bookingId: 'bk-001' }, MOCK_SESSION);
    const instance = UserIntentScore._instances[0];
    expect(instance.breakdown.bookingsCompleted).toBe(1);
  });

  // Scenario: booking_completed increments intent score exactly once (50 pts)
  it('booking_completed increments score by 50 exactly once (US-0104 RC-4)', async () => {
    await trackBookingDone(MOCK_USER_ID, { destination: 'Barcelona' }, MOCK_SESSION);
    const instance = UserIntentScore._instances[0];
    expect(instance.score).toBe(50);
  });
});

// ── US-0303: Intent score reset after booking_completed (RC-5) ───────────────

describe('score reset after booking_completed (US-0303 RC-5)', () => {

  // Scenario: Intent score is reset to zero after booking completion
  // RED — current updateIntentScore ADDS 50; it doesn't reset to 0
  it('score is reset to 0 after booking_completed [RED: currently adds 50 instead]', async () => {
    const existingIntent = {
      score: 85,
      tier: 'high',
      breakdown: { bookingsCompleted: 0 },
      primaryPlanningDestination: 'Barcelona',
      save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
    };
    UserIntentScore.findOne.mockResolvedValue(existingIntent);

    await trackBookingDone(MOCK_USER_ID, { destination: 'Barcelona' }, MOCK_SESSION);

    expect(existingIntent.score).toBe(0);
  });

  // Scenario: Tier drops to low immediately after post-booking score reset
  // RED — depends on score reset being implemented first
  it('tier is "low" immediately after post-booking reset [RED: not yet implemented]', async () => {
    const existingIntent = {
      score: 85,
      tier: 'high',
      breakdown: { bookingsCompleted: 0 },
      save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
    };
    UserIntentScore.findOne.mockResolvedValue(existingIntent);

    await trackBookingDone(MOCK_USER_ID, { destination: 'Barcelona' }, MOCK_SESSION);

    expect(existingIntent.tier).toBe('low');
  });
});

// ── US-0105: Cross-session return visit detection (RC-3) ─────────────────────

describe('maybeReturnVisit / cross-session detection (US-0105 RC-3)', () => {

  // Scenario: No return_visit event for a first-time user (no prior activity)
  it('does NOT emit return_visit when user has no prior UserActivity records', async () => {
    UserActivity.findOne.mockReturnValue(noActivity());
    await track(MOCK_USER_ID, 'flight_search', { destination: 'Barcelona' }, MOCK_SESSION);

    const returnVisitCalls = UserActivity.create.mock.calls.filter(
      ([arg]) => arg.eventType === 'return_visit'
    );
    expect(returnVisitCalls).toHaveLength(0);
  });

  // Scenario: No return_visit within the same session under 30 minutes
  it('does NOT emit return_visit when prior activity is less than 30 min ago', async () => {
    const recent = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
    UserActivity.findOne.mockReturnValue(priorActivity(recent));

    await track(MOCK_USER_ID, 'flight_search', { destination: 'Barcelona' }, MOCK_SESSION);

    const returnVisitCalls = UserActivity.create.mock.calls.filter(
      ([arg]) => arg.eventType === 'return_visit'
    );
    expect(returnVisitCalls).toHaveLength(0);
  });

  // Scenario: Return visit is detected when the user resumes in a new browser session
  // RED — current maybeReturnVisit queries by same sessionId; cross-session not detected
  it('emits return_visit when prior activity was in a DIFFERENT session >30 min ago [RED: RC-3]', async () => {
    const oldTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    // Simulate: new session has no activities, but there is a prior activity from old session
    UserActivity.findOne.mockImplementation((query) => {
      if (query.sessionId === 'session-new') {
        // New session: no activities found
        return noActivity();
      }
      // Cross-session query (desired fix: query without sessionId filter)
      return priorActivity(oldTime);
    });

    await track(MOCK_USER_ID, 'flight_search', { destination: 'Barcelona' }, 'session-new');

    const returnVisitCalls = UserActivity.create.mock.calls.filter(
      ([arg]) => arg.eventType === 'return_visit'
    );
    expect(returnVisitCalls).toHaveLength(1);
  });

  // Scenario: Return visit event increments intent score by return_visit weight (15 pts)
  it('return_visit contributes 15 points to intent score when emitted (US-0105)', async () => {
    const oldTime = new Date(Date.now() - 60 * 60 * 1000);
    UserActivity.findOne.mockReturnValue(priorActivity(oldTime));

    await track(MOCK_USER_ID, 'flight_search', { destination: 'Barcelona' }, MOCK_SESSION);

    // When return_visit fires, updateIntentScore is called for return_visit (15 pts)
    // then again for flight_search (5 pts) = 20 pts total on a fresh score
    const instances = UserIntentScore._instances;
    const totalScore = instances.reduce((sum, inst) => sum + (inst.score || 0), 0);
    // At minimum the return_visit score update must have happened
    expect(totalScore).toBeGreaterThanOrEqual(15);
  });

  // Scenario: Return visit counter increments by one for a repeat-searching user
  it('breakdown.returnVisits increments by 1 when return_visit fires (US-0105)', async () => {
    const oldTime = new Date(Date.now() - 60 * 60 * 1000);
    UserActivity.findOne.mockReturnValue(priorActivity(oldTime));

    await track(MOCK_USER_ID, 'flight_search', { destination: 'Barcelona' }, MOCK_SESSION);

    // The return_visit updateIntentScore call creates/updates an instance
    const returnVisitInstance = UserIntentScore._instances.find(
      inst => inst.breakdown && inst.breakdown.returnVisits > 0
    );
    expect(returnVisitInstance).toBeDefined();
    expect(returnVisitInstance.breakdown.returnVisits).toBe(1);
  });
});

// ── US-0106: Wishlist events ─────────────────────────────────────────────────

describe('wishlist event tracking (US-0106)', () => {

  // Scenario: Wishlist add event is recorded with destination metadata
  it('creates a wishlist_added UserActivity with destination metadata', async () => {
    await track(MOCK_USER_ID, 'wishlist_added', { destination: 'Barcelona', itemType: 'flight' }, MOCK_SESSION);
    expect(UserActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'wishlist_added',
        metadata: expect.objectContaining({ destination: 'Barcelona' })
      })
    );
  });

  // Scenario: Wishlist add increments intent score by 5 pts
  it('wishlist_added increments intent score by 5 (US-0106)', async () => {
    await track(MOCK_USER_ID, 'wishlist_added', { destination: 'Barcelona' }, MOCK_SESSION);
    const instance = UserIntentScore._instances[0];
    expect(instance.score).toBe(5);
  });

  // Scenario: Wishlist remove event is recorded with destination metadata
  it('creates a wishlist_removed UserActivity with destination metadata', async () => {
    await track(MOCK_USER_ID, 'wishlist_removed', { destination: 'Barcelona', itemType: 'hotel' }, MOCK_SESSION);
    expect(UserActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'wishlist_removed',
        metadata: expect.objectContaining({ destination: 'Barcelona' })
      })
    );
  });
});

// ── US-0304: Destination extraction — origin must NOT be fallback (RC-9) ──────

describe('destination extraction — RC-9 fix (US-0304)', () => {

  // Scenario: Destination is extracted from destination field, not origin
  it('resolves primaryPlanningDestination from metadata.destination, not origin', async () => {
    await trackFlightSearch(
      MOCK_USER_ID,
      { destination: 'Barcelona', origin: 'Delhi' },
      MOCK_SESSION
    );
    const instance = UserIntentScore._instances[0];
    expect(instance.primaryPlanningDestination).toBe('Barcelona');
    expect(instance.primaryPlanningDestination).not.toBe('Delhi');
  });

  // Scenario: Origin field is NOT used as fallback when destination and city are absent
  // RED — current track() uses: dest = metadata.destination || metadata.city || metadata.origin
  it('does NOT set primaryPlanningDestination from origin when destination and city are absent [RED: RC-9]', async () => {
    await trackFlightSearch(
      MOCK_USER_ID,
      { origin: 'Delhi' /* no destination, no city */ },
      MOCK_SESSION
    );
    const instance = UserIntentScore._instances[0];
    // When only origin is provided, primaryPlanningDestination should remain null
    expect(instance.primaryPlanningDestination).toBeNull();
  });
});
