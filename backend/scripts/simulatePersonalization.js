'use strict';

/**
 * simulatePersonalization — the acceptance gate for the two-axis engine.
 *
 * Replays six scripted user journeys IN MEMORY (no database required) through
 * the real engine functions — intent weights, engagement scoring, trajectory,
 * and the Intent × Engagement scenario matrix — and prints, for each journey,
 * the resulting intent tier, engagement tier, trajectory, scenario, and which
 * notification fires (or that it is suppressed).
 *
 * Run:  npm run simulate:personalization
 *
 * This is exported so backend/__tests__ can assert the matrix end-to-end.
 */

const { INTENT_WEIGHTS, tierFromScore } = require('../services/activityTracker');
const engagement = require('../services/engagementEngine');
const notificationEngine = require('../services/notificationEngine');

const DAY = 24 * 60 * 60 * 1000;
const ago = (ms) => new Date(Date.now() - ms);

/** One activity record. */
function ev(sessionId, eventType, daysAgo, metadata = {}) {
  return {
    sessionId,
    eventType,
    metadata,
    intentPoints: INTENT_WEIGHTS[eventType] || 0,
    createdAt: ago(daysAgo * DAY)
  };
}

// ── Six scripted journeys ──────────────────────────────────────────────────
// Each: { key, label, prefs, activities }
const SCENARIOS = [
  {
    key: 'high_intent_low_engagement',
    label: 'High intent, low engagement (one focused burst → almost books)',
    prefs: { favoriteDestinations: [{ destination: 'Dubai', score: 9 }] },
    activities: [
      ev('s1', 'flight_search',   0.01, { destination: 'Dubai', timeOnPage: 40 }),
      ev('s1', 'flight_view',     0.01, { destination: 'Dubai', cabin: 'business' }),
      ev('s1', 'flight_view',     0.01, { destination: 'Dubai', cabin: 'business' }),
      ev('s1', 'hotel_search',    0.01, { destination: 'Dubai' }),
      ev('s1', 'booking_started', 0.01, { destination: 'Dubai', bookingId: 'b-dubai' })
    ]
  },
  {
    key: 'low_intent_high_engagement',
    label: 'Low intent, high engagement (broad browsing, never funnels)',
    prefs: { favoriteDestinations: [{ destination: 'Goa', score: 4 }] },
    activities: [
      ev('s1', 'flight_view', 0.3, { destination: 'Goa', timeOnPage: 220 }),
      ev('s2', 'hotel_view',  0.6, { destination: 'Bali', timeOnPage: 200 }),
      ev('s3', 'flight_view', 1.0, { destination: 'Bangkok', timeOnPage: 180 }),
      ev('s4', 'destination_viewed', 1.4, { destination: 'Singapore', timeOnPage: 160 }),
      ev('s5', 'hotel_view',  1.8, { destination: 'Maldives', timeOnPage: 170 }),
      ev('s6', 'flight_view', 2.2, { destination: 'Phuket', timeOnPage: 150 }),
      ev('s7', 'hotel_view',  2.6, { destination: 'Vietnam', timeOnPage: 190 }),
      ev('s8', 'destination_viewed', 3.0, { destination: 'Jaipur', timeOnPage: 140 })
    ]
  },
  {
    key: 'rising_over_3_sessions',
    label: 'Rising trajectory, high engagement (warming up, lots of browsing)',
    prefs: { favoriteDestinations: [{ destination: 'Bali', score: 7 }] },
    activities: [
      ev('s1', 'flight_search', 5,    { destination: 'Bali' }),
      ev('s1', 'flight_view',   5,    { destination: 'Bali', timeOnPage: 120 }),
      ev('s2', 'flight_search', 2.5,  { destination: 'Bali' }),
      ev('s2', 'flight_view',   2.5,  { destination: 'Bali', timeOnPage: 140 }),
      ev('s2', 'hotel_view',    2.5,  { destination: 'Bali', timeOnPage: 150 }),
      ev('s3', 'flight_search', 0.2,  { destination: 'Bali' }),
      ev('s3', 'hotel_search',  0.2,  { destination: 'Bali' }),
      ev('s3', 'hotel_view',    0.2,  { destination: 'Bali', timeOnPage: 160 }),
      ev('s3', 'wishlist_added',0.1,  { destination: 'Bali' })
    ]
  },
  {
    key: 'falling_stalled',
    label: 'Falling trajectory (searched a lot, then went quiet 5+ days)',
    prefs: { favoriteDestinations: [{ destination: 'Jaipur', score: 6 }] },
    activities: [
      ev('s1', 'flight_search', 6, { destination: 'Jaipur' }),
      ev('s1', 'flight_view',   6, { destination: 'Jaipur', timeOnPage: 80 }),
      ev('s1', 'hotel_search',  6, { destination: 'Jaipur' }),
      ev('s1', 'flight_search', 5.5, { destination: 'Jaipur' })
    ]
  },
  {
    key: 'abandoned_booking',
    label: 'Abandoned booking (hot lead — started checkout, did not complete)',
    prefs: { favoriteDestinations: [{ destination: 'London', score: 8 }] },
    activities: [
      ev('s1', 'flight_search',   0.5,  { destination: 'London' }),
      ev('s1', 'flight_view',     0.5,  { destination: 'London', cabin: 'economy' }),
      ev('s1', 'flight_search',   0.45, { destination: 'London' }),   // repeat → +bonus
      ev('s1', 'hotel_search',    0.45, { destination: 'London' }),   // repeat dest → +bonus
      ev('s1', 'hotel_view',      0.45, { destination: 'London', timeOnPage: 90 }),
      ev('s1', 'booking_started', 0.4,  { destination: 'London', bookingId: 'b-london' }),
      ev('s2', 'flight_search',   0.05, { destination: 'London' })    // came back, still no completion
    ]
  },
  {
    key: 'post_booking_suppression',
    label: 'Post-booking (completed a booking → reset + cool-down → silent)',
    prefs: { favoriteDestinations: [{ destination: 'Singapore', score: 9 }] },
    activities: [
      ev('s1', 'flight_search',     0.6, { destination: 'Singapore' }),
      ev('s1', 'flight_view',       0.6, { destination: 'Singapore' }),
      ev('s1', 'booking_started',   0.5, { destination: 'Singapore', bookingId: 'b-sg' }),
      ev('s1', 'booking_completed', 0.4, { destination: 'Singapore', bookingId: 'b-sg' })
    ]
  }
];

/**
 * Replay a journey's activities into an intent-like document, mirroring the
 * scoring + reset rules in activityTracker, then layer engagement + trajectory.
 */
function buildIntent(activities) {
  const sorted = [...activities].sort((a, b) => a.createdAt - b.createdAt);

  let score = 0;
  let primary = null;
  let repeatSearches = 0;
  const cooldowns = [];
  const seenSearchDest = new Set();

  for (const a of sorted) {
    const m = a.metadata || {};
    const dest = m.destination || m.city || null;

    if (a.eventType === 'booking_completed') {
      score = 0; // reset on conversion (US-0303)
      if (dest) cooldowns.push({ destination: dest, bookedAt: a.createdAt });
      continue;
    }

    if (['flight_search', 'hotel_search'].includes(a.eventType) && dest) {
      if (seenSearchDest.has(dest.toLowerCase())) { score += 10; repeatSearches++; } // repeat bonus
      seenSearchDest.add(dest.toLowerCase());
    }
    score = Math.min(100, score + (INTENT_WEIGHTS[a.eventType] || 0));
    if (dest && ['flight_search', 'hotel_search', 'booking_started'].includes(a.eventType)) primary = dest;
  }

  const intent = {
    score,
    tier: tierFromScore(score),
    primaryPlanningDestination: primary,
    breakdown: { repeatSearches },
    bookingCooldowns: cooldowns,
    sentNotifications: []
  };

  // Engagement axis + trajectory + intent decay (same path as the batch job).
  const stats = engagement.computeSessionStats(activities);
  const returnVisits = activities.filter(a => a.eventType === 'return_visit').length;
  const wishlistAdds = activities.filter(a => a.eventType === 'wishlist_added').length;
  intent.engagementScore = engagement.computeEngagementScore(stats, returnVisits, wishlistAdds);
  intent.engagementTier = tierFromScore(intent.engagementScore);
  intent.sessionStats = stats;
  intent.trajectory = engagement.determineTrajectory(activities, intent);

  if (intent.trajectory !== 'post-booking') {
    intent.score = engagement.decayIntent(intent.score, stats.lastActiveAt);
    intent.tier = tierFromScore(intent.score);
  }

  return intent;
}

/** Run a single scenario, returning the computed intent + scenario + notification. */
async function runScenario(scenario) {
  const intent = buildIntent(scenario.activities);
  const scenarioKey = notificationEngine.selectScenario(intent);
  const notification = await notificationEngine.buildScenarioNotification(scenario.prefs, intent);
  return { intent, scenarioKey, notification };
}

async function run() {
  const rows = [];
  for (const s of SCENARIOS) {
    const { intent, scenarioKey, notification } = await runScenario(s);
    rows.push({
      Journey: s.key,
      Intent: `${intent.score} (${intent.tier})`,
      Engagement: `${intent.engagementScore} (${intent.engagementTier})`,
      Trajectory: intent.trajectory,
      Scenario: scenarioKey,
      Notification: notification ? `${notification.type}: "${notification.title}"` : '— (silent)'
    });
  }

  console.log('\nPersonalization scenario simulation (Intent × Engagement matrix)\n');
  for (const s of SCENARIOS) {
    console.log(`• ${s.key} — ${s.label}`);
  }
  console.log('');
  console.table(rows);
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { SCENARIOS, buildIntent, runScenario };
