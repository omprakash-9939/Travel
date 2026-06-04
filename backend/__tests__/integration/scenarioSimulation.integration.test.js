'use strict';

/**
 * Integration tests — Intent × Engagement scenario matrix + journey simulation
 * (EP-06 notification scenarios, EP-09 engagement). No database: exercises the
 * pure engine functions and the scripted journeys from the simulation harness.
 */

const notificationEngine = require('../../services/notificationEngine');
const { SCENARIOS, runScenario } = require('../../scripts/simulatePersonalization');

const intentDoc = (tier, engagementTier, trajectory = 'rising', extra = {}) => ({
  tier,
  engagementTier,
  trajectory,
  primaryPlanningDestination: 'Dubai',
  bookingCooldowns: [],
  ...extra
});

// ── selectScenario — full 3×3 matrix ─────────────────────────────────────────

describe('notificationEngine.selectScenario — Intent × Engagement matrix', () => {
  const cases = [
    ['high',   'low',    'decisive_nudge'],
    ['high',   'medium', 'closing'],
    ['high',   'high',   'closing'],
    ['medium', 'low',    'reengage'],
    ['medium', 'medium', 'standard_recs'],
    ['medium', 'high',   'guided'],
    ['low',    'low',    'dormant'],
    ['low',    'medium', 'inspire'],
    ['low',    'high',   'inspire']
  ];

  test.each(cases)('intent=%s × engagement=%s → %s', (it, et, expected) => {
    expect(notificationEngine.selectScenario(intentDoc(it, et))).toBe(expected);
  });
});

// ── Trajectory overrides ──────────────────────────────────────────────────────

describe('notificationEngine.selectScenario — trajectory overrides', () => {
  it('post-booking always suppresses, regardless of tiers', () => {
    expect(notificationEngine.selectScenario(intentDoc('high', 'high', 'post-booking'))).toBe('suppressed');
  });

  it('falling trajectory re-engages a non-high-intent user', () => {
    expect(notificationEngine.selectScenario(intentDoc('medium', 'medium', 'falling'))).toBe('reengage');
  });

  it('falling does NOT downgrade a high-intent user away from closing', () => {
    expect(notificationEngine.selectScenario(intentDoc('high', 'medium', 'falling'))).toBe('closing');
  });
});

// ── buildScenarioNotification — silence + cooldown ────────────────────────────

describe('notificationEngine.buildScenarioNotification', () => {
  it('dormant users (low/low) get no notification', async () => {
    const notif = await notificationEngine.buildScenarioNotification(
      { favoriteDestinations: [{ destination: 'Dubai' }] },
      intentDoc('low', 'low', 'new')
    );
    expect(notif).toBeNull();
  });

  it('post-booking users get no notification', async () => {
    const notif = await notificationEngine.buildScenarioNotification(
      { favoriteDestinations: [{ destination: 'Dubai' }] },
      intentDoc('high', 'high', 'post-booking')
    );
    expect(notif).toBeNull();
  });

  it('suppresses a nudge for a destination still in booking cool-down', async () => {
    const notif = await notificationEngine.buildScenarioNotification(
      { favoriteDestinations: [{ destination: 'Dubai' }] },
      intentDoc('high', 'medium', 'rising', {
        bookingCooldowns: [{ destination: 'Dubai', bookedAt: new Date() }]
      })
    );
    expect(notif).toBeNull();
  });

  it('high/medium produces a closing notification with destination copy', async () => {
    const notif = await notificationEngine.buildScenarioNotification(
      { favoriteDestinations: [{ destination: 'Dubai' }] },
      intentDoc('high', 'medium', 'rising')
    );
    expect(notif).not.toBeNull();
    expect(notif.type).toBe('closing');
    expect(notif.title).toMatch(/Dubai/);
  });
});

// ── End-to-end journeys (the simulation's 6 scripted users) ───────────────────

describe('scenario simulation — scripted journeys', () => {
  const byKey = {};
  beforeAll(async () => {
    for (const s of SCENARIOS) {
      byKey[s.key] = await runScenario(s);
    }
  });

  it('post-booking journey is silent (reset + cool-down)', () => {
    const r = byKey.post_booking_suppression;
    expect(r.intent.score).toBe(0);
    expect(r.intent.trajectory).toBe('post-booking');
    expect(r.scenarioKey).toBe('suppressed');
    expect(r.notification).toBeNull();
  });

  it('low-intent / high-engagement browser gets inspiration, never a hard sell', () => {
    const r = byKey.low_intent_high_engagement;
    expect(r.intent.tier).toBe('low');
    expect(r.scenarioKey).toBe('inspire');
    expect(['closing', 'decisive_nudge']).not.toContain(r.scenarioKey);
  });

  it('falling trajectory triggers re-engagement', () => {
    const r = byKey.falling_stalled;
    expect(r.intent.trajectory).toBe('falling');
    expect(r.scenarioKey).toBe('reengage');
    expect(r.notification.type).toBe('reengage');
  });

  it('abandoned hot lead (high intent) gets a closing nudge', () => {
    const r = byKey.abandoned_booking;
    expect(r.intent.tier).toBe('high');
    expect(r.scenarioKey).toBe('closing');
    expect(r.notification).not.toBeNull();
  });

  it('every non-silent journey produces exactly one primary notification', () => {
    for (const s of SCENARIOS) {
      const r = byKey[s.key];
      if (['suppressed', 'dormant'].includes(r.scenarioKey)) {
        expect(r.notification).toBeNull();
      } else {
        expect(r.notification).not.toBeNull();
        expect(typeof r.notification.title).toBe('string');
      }
    }
  });
});
