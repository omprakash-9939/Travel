'use strict';

/**
 * engagementEngine — the ENGAGEMENT axis of the personalization model (EP-09).
 *
 * Intent (activityTracker) answers "how close is this user to booking?".
 * Engagement answers "how involved is this user right now?" — independent of
 * purchase readiness. A tyre-kicker can be high-engagement/low-intent; a
 * decisive buyer can be low-engagement/high-intent. The notification matrix
 * (EP-06) needs both axes, so we compute and persist engagement here.
 *
 * It also applies time-decay to the intent score: intent that isn't refreshed
 * by activity should cool off, otherwise a single burst keeps a user "high"
 * forever (RC-7 direction; calibrate later via EP-08).
 */

const mongoose = require('mongoose');
const UserActivity = require('../models/UserActivity');
const UserIntentScore = require('../models/UserIntentScore');
const { tierFromScore } = require('./activityTracker');

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;   // engagement looks back 30 days
const INTENT_HALF_LIFE_DAYS = 7;              // intent halves every 7 idle days
const RECENT_MS = 3 * 24 * 60 * 60 * 1000;    // trajectory: "recent" = last 3 days
const PRIOR_MS  = 7 * 24 * 60 * 60 * 1000;    // ...vs the 3–7 day window before
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Aggregate session-level engagement statistics from a list of activities.
 * Pure — no DB. Exported for unit testing and the simulation harness.
 */
function computeSessionStats(activities) {
  const bySession = new Map();
  const destinations = new Set();
  const timeSamples = [];
  let lastActiveAt = null;

  for (const a of activities) {
    const sid = a.sessionId || '__none__';
    bySession.set(sid, (bySession.get(sid) || 0) + 1);

    const m = a.metadata || {};
    const dest = m.destination || m.city;
    if (dest) destinations.add(String(dest).toLowerCase());
    if (typeof m.timeOnPage === 'number' && m.timeOnPage > 0) timeSamples.push(m.timeOnPage);

    const t = new Date(a.createdAt).getTime();
    if (!lastActiveAt || t > lastActiveAt) lastActiveAt = t;
  }

  const sessionCount = bySession.size;
  const totalEvents = activities.length;
  const avgEventsPerSession = sessionCount ? totalEvents / sessionCount : 0;
  const avgTimeOnPage = timeSamples.length
    ? timeSamples.reduce((s, n) => s + n, 0) / timeSamples.length
    : 0;

  return {
    sessionCount,
    avgEventsPerSession: Math.round(avgEventsPerSession * 10) / 10,
    avgTimeOnPage: Math.round(avgTimeOnPage),
    distinctDestinations: destinations.size,
    lastActiveAt: lastActiveAt ? new Date(lastActiveAt) : null
  };
}

/**
 * Map session stats + return-visit/wishlist counts to an engagement score
 * (0–100). Each dimension is capped so no single signal dominates.
 */
function computeEngagementScore(stats, returnVisits = 0, wishlistAdds = 0) {
  const sessions   = Math.min(stats.sessionCount * 8, 30);          // breadth of visits
  const depth      = Math.min(stats.avgEventsPerSession * 3, 20);   // depth per visit
  const dwell      = Math.min(stats.avgTimeOnPage / 10, 15);        // 150s → 15
  const variety    = Math.min(stats.distinctDestinations * 5, 15);  // exploration
  const loyalty    = Math.min(returnVisits * 10, 12);               // coming back
  const saving     = Math.min(wishlistAdds * 4, 8);                 // active curation

  return Math.max(0, Math.min(100, Math.round(sessions + depth + dwell + variety + loyalty + saving)));
}

/** Decay an intent score toward 0 based on days since last activity. */
function decayIntent(score, lastActiveAt, now = Date.now()) {
  if (!score || !lastActiveAt) return score || 0;
  const days = (now - new Date(lastActiveAt).getTime()) / (24 * 60 * 60 * 1000);
  if (days < 1) return score;
  const decayed = score * Math.pow(0.5, days / INTENT_HALF_LIFE_DAYS);
  return Math.max(0, Math.round(decayed));
}

/**
 * Determine cross-session intent trajectory from activity intentPoints in the
 * recent vs prior windows, plus any active booking cool-down.
 */
function determineTrajectory(activities, intent, now = Date.now()) {
  const cooldownActive = (intent?.bookingCooldowns || []).some(
    c => now - new Date(c.bookedAt).getTime() < COOLDOWN_MS
  );
  if (cooldownActive) return 'post-booking';

  let recent = 0;
  let prior = 0;
  for (const a of activities) {
    const age = now - new Date(a.createdAt).getTime();
    const pts = a.intentPoints || 0;
    if (age <= RECENT_MS) recent += pts;
    else if (age <= PRIOR_MS) prior += pts;
  }

  if (recent === 0 && prior === 0) return 'new';
  if (prior === 0 && recent > 0) return 'rising';
  if (recent > prior * 1.2) return 'rising';
  if (recent < prior * 0.6) return 'falling';
  return 'stalled';
}

/**
 * Compute engagement + trajectory for a user, apply intent decay, and persist
 * the result on UserIntentScore. Safe to call from the batch job or on demand.
 */
async function computeAndPersist(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const since = new Date(Date.now() - WINDOW_MS);

  const [activities, intent] = await Promise.all([
    UserActivity.find({ user: uid, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean(),
    UserIntentScore.findOne({ user: uid })
  ]);

  if (!intent) return null; // nothing to update for a user with no intent record yet

  const stats = computeSessionStats(activities);
  const returnVisits = activities.filter(a => a.eventType === 'return_visit').length;
  const wishlistAdds = activities.filter(a => a.eventType === 'wishlist_added').length;

  const engagementScore = computeEngagementScore(stats, returnVisits, wishlistAdds);
  const trajectory = determineTrajectory(activities, intent);

  intent.engagementScore = engagementScore;
  intent.engagementTier = tierFromScore(engagementScore);
  intent.sessionStats = stats;
  intent.trajectory = trajectory;

  // Time-decay the accumulated intent score (skip if just booked — already reset).
  if (trajectory !== 'post-booking') {
    const decayed = decayIntent(intent.score, stats.lastActiveAt);
    intent.score = decayed;
    intent.tier = tierFromScore(decayed);
  }

  intent.lastCalculatedAt = new Date();
  await intent.save();
  return intent;
}

module.exports = {
  computeAndPersist,
  computeSessionStats,
  computeEngagementScore,
  decayIntent,
  determineTrajectory
};
