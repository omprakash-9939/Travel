'use strict';

/**
 * seedPersonalization — write the six scripted journeys to MongoDB so the
 * homepage / recommendation APIs can be demoed against real data.
 *
 * Run:  npm run seed:personalization   (requires MONGODB_URI)
 *
 * Each journey becomes a demo user (sim+<key>@dataart.test) with a UserActivity
 * timeline, a UserIntentScore (intent + engagement + trajectory), derived
 * UserPreference, and a built RecommendationCache. For a DB-free demo of the
 * matrix, use `npm run simulate:personalization` instead.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const UserIntentScore = require('../models/UserIntentScore');
const UserPreference = require('../models/UserPreference');
const RecommendationCache = require('../models/RecommendationCache');

const { aggregatePreferences } = require('../services/preferenceEngine');
const engagementEngine = require('../services/engagementEngine');
const { buildRecommendations } = require('../services/recommendationEngine');
const { tierFromScore } = require('../services/activityTracker');
const { SCENARIOS, buildIntent } = require('./simulatePersonalization');

async function seedUser(scenario) {
  const email = `sim+${scenario.key}@dataart.test`;

  // Upsert a demo user (findOneAndUpdate bypasses password hashing hooks — fine for a fixture).
  const user = await User.findOneAndUpdate(
    { email },
    { $setOnInsert: { name: `Sim ${scenario.key}`, email, password: 'seeded-demo-user-not-loginable' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Clean any prior personalization state for an idempotent re-seed.
  await Promise.all([
    UserActivity.deleteMany({ user: user._id }),
    UserIntentScore.deleteOne({ user: user._id }),
    UserPreference.deleteOne({ user: user._id }),
    RecommendationCache.deleteOne({ user: user._id })
  ]);

  // Insert the scripted activity timeline (preserving the historical timestamps).
  await UserActivity.insertMany(scenario.activities.map(a => ({ ...a, user: user._id })));

  // Seed the intent document from the replayed journey, then let the engagement
  // engine recompute engagement/trajectory/decay exactly as the batch job would.
  const replayed = buildIntent(scenario.activities);
  await UserIntentScore.create({
    user: user._id,
    score: replayed.score,
    tier: tierFromScore(replayed.score),
    breakdown: replayed.breakdown,
    primaryPlanningDestination: replayed.primaryPlanningDestination,
    bookingCooldowns: replayed.bookingCooldowns
  });

  await aggregatePreferences(user._id);
  await engagementEngine.computeAndPersist(user._id);
  const recs = await buildRecommendations(user._id);

  const intent = await UserIntentScore.findOne({ user: user._id }).lean();
  return {
    email,
    intent: `${intent.score} (${intent.tier})`,
    engagement: `${intent.engagementScore} (${intent.engagementTier})`,
    trajectory: intent.trajectory,
    scenario: recs.scenario,
    notifications: recs.notifications.length
  };
}

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dataart_travel';
  await mongoose.connect(uri);
  console.log(`[seed:personalization] connected to ${uri}`);

  const rows = [];
  for (const s of SCENARIOS) {
    rows.push(await seedUser(s));
  }

  console.log('\nSeeded personalization demo users:\n');
  console.table(rows);

  await mongoose.disconnect();
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { run };
