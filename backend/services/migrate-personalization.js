/**
 * migrate-personalization.js
 *
 * Creates indexes and initial schema for the personalization engine.
 * Run once after deployment: node migrate-personalization.js
 *
 * Usage:
 *   cd backend
 *   node migrate-personalization.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  console.log('🚀 Running Personalization Engine Migration...\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dataart_travel');
  console.log('✅ MongoDB connected\n');

  const db = mongoose.connection.db;

  // ── 1. user_activities ────────────────────────────────────────────────────
  console.log('📦 Creating user_activities collection & indexes...');
  try {
    await db.createCollection('useractivities');
  } catch { /* already exists */ }

  await db.collection('useractivities').createIndexes([
    { key: { user: 1, createdAt: -1 },                name: 'user_date' },
    { key: { user: 1, eventType: 1, createdAt: -1 },  name: 'user_event_date' },
    { key: { user: 1, 'metadata.destination': 1 },    name: 'user_destination' },
    { key: { sessionId: 1 },                           name: 'session' },
    { key: { createdAt: 1 }, expireAfterSeconds: 60 * 60 * 24 * 90, name: 'ttl_90d' }
  ]);
  console.log('   ✅ user_activities ready\n');

  // ── 2. userpreferences ────────────────────────────────────────────────────
  console.log('📦 Creating userpreferences collection & indexes...');
  try {
    await db.createCollection('userpreferences');
  } catch { /* already exists */ }

  await db.collection('userpreferences').createIndexes([
    { key: { user: 1 }, unique: true, name: 'user_unique' }
  ]);
  console.log('   ✅ userpreferences ready\n');

  // ── 3. userintentscores ───────────────────────────────────────────────────
  console.log('📦 Creating userintentscores collection & indexes...');
  try {
    await db.createCollection('userintentscores');
  } catch { /* already exists */ }

  await db.collection('userintentscores').createIndexes([
    { key: { user: 1 }, unique: true, name: 'user_unique' },
    { key: { tier: 1 },               name: 'tier' },
    { key: { score: -1 },             name: 'score_desc' }
  ]);
  console.log('   ✅ userintentscores ready\n');

  // ── 4. recommendationcaches ───────────────────────────────────────────────
  console.log('📦 Creating recommendationcaches collection & indexes...');
  try {
    await db.createCollection('recommendationcaches');
  } catch { /* already exists */ }

  await db.collection('recommendationcaches').createIndexes([
    { key: { user: 1 },      unique: true, name: 'user_unique' },
    { key: { validUntil: 1 }, name: 'ttl_expiry' }
  ]);
  console.log('   ✅ recommendationcaches ready\n');

  // ── 5. Print collection summary ───────────────────────────────────────────
  const collections = await db.listCollections().toArray();
  const relevant = collections
    .filter(c => ['useractivities', 'userpreferences', 'userintentscores', 'recommendationcaches'].includes(c.name))
    .map(c => c.name);

  console.log('─────────────────────────────────────────────────');
  console.log('📊 Personalization Collections Created:');
  relevant.forEach(name => console.log(`   • ${name}`));
  console.log('\n✅ Migration complete. Personalization engine is ready!\n');

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
