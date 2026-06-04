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
const { aggregatePreferences } = require('./preferenceEngine');
const { buildRecommendations } = require('./recommendationEngine');

const INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const BATCH_SIZE  = 50;

let jobTimer = null;

/**
 * Run one aggregation cycle for recently active users.
 */
async function runOnce() {
  console.log('[AggregationJob] Starting aggregation cycle...');

  try {
    // Find distinct users who had activity in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await UserActivity.distinct('user', { createdAt: { $gte: since } });

    console.log(`[AggregationJob] Processing ${activeUsers.length} active users`);

    // Process in batches to avoid overwhelming the DB
    for (let i = 0; i < activeUsers.length; i += BATCH_SIZE) {
      const batch = activeUsers.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(batch.map(async userId => {
        try {
          await aggregatePreferences(userId);
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
