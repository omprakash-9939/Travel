'use strict';

/**
 * aggregationJob — background job that refreshes user preferences
 * and recommendation caches.
 *
 * Runs:
 *  - Every 2 hours for recently active users (setInterval)
 *  - Call runOnce() manually from server startup or tests
 *
 * To trigger immediately from outside:
 *   require('./jobs/aggregationJob').runOnce();
 */

const UserActivity       = require('../models/UserActivity');
const UserIntentScore    = require('../models/UserIntentScore');
const { aggregatePreferences } = require('../services/preferenceEngine');
const { buildRecommendations } = require('../services/recommendationEngine');
const engagementEngine   = require('../services/engagementEngine');

const INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const BATCH_SIZE  = 50;

let jobTimer = null;

/**
 * Run one aggregation cycle for recently active users.
 */
async function runOnce() {
  console.log('[AggregationJob] Starting aggregation cycle...');

  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Recently active users (standard path)
    const activeUsers = await UserActivity.distinct('user', { createdAt: { $gte: since24h } });

    // Dormant users whose intent score hasn't been decayed recently — they never
    // show up in the activity query but still need their score to decay over time.
    const dormantUsers = await UserIntentScore.distinct('user', {
      score: { $gt: 0 },
      lastCalculatedAt: { $lt: since24h }
    });

    const allUserIds = [...new Set([...activeUsers.map(String), ...dormantUsers.map(String)])];
    console.log(`[AggregationJob] Processing ${allUserIds.length} users (${activeUsers.length} active, ${dormantUsers.length} dormant)`);

    // Process in batches to avoid overwhelming the DB
    for (let i = 0; i < allUserIds.length; i += BATCH_SIZE) {
      const batch = allUserIds.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(batch.map(async userId => {
        try {
          await aggregatePreferences(userId);
          // Engagement axis + intent decay must run before recommendations so
          // the notification matrix sees fresh engagement/trajectory (EP-09).
          await engagementEngine.computeAndPersist(userId);
          await buildRecommendations(userId);
        } catch (err) {
          console.error(`[AggregationJob] Failed for user ${userId}:`, err.message);
        }
      }));
    }

    console.log('[AggregationJob] Cycle complete.');
  } catch (err) {
    console.error('[AggregationJob] Cycle error:', err.message);
  }
}

/**
 * Start the recurring job.
 * Call this once from server.js after DB connects.
 */
function start() {
  if (jobTimer) return; // already running

  // Run once shortly after startup, then on interval
  setTimeout(runOnce, 30 * 1000); // 30 sec after boot
  jobTimer = setInterval(runOnce, INTERVAL_MS);

  console.log(`[AggregationJob] Scheduled — interval: ${INTERVAL_MS / 60000} minutes`);
}

function stop() {
  if (jobTimer) {
    clearInterval(jobTimer);
    jobTimer = null;
  }
}

module.exports = { start, stop, runOnce };
