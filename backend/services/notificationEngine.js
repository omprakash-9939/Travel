'use strict';

/**
 * notificationEngine — the Intent × Engagement scenario matrix (EP-06).
 *
 * Notifications are chosen from the user's position on TWO axes plus their
 * cross-session trajectory, not from a single intent number:
 *
 *                     engagement: low        engagement: medium     engagement: high
 *   intent: high      decisive_nudge         closing                closing
 *   intent: medium    reengage               standard_recs          guided
 *   intent: low       dormant (silent)       inspire                inspire
 *
 *   trajectory overrides: post-booking → suppressed; falling → reengage.
 *
 * Each non-silent scenario produces one primary notification. Copy comes from
 * Claude when ENABLE_LLM_COPY is on (claudeClient), otherwise from templates.
 */

const { generateCopy } = require('./claudeClient');

const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/** Human-readable matrix, exported for docs/tests. */
const SCENARIO_MATRIX = {
  'high:low':     'decisive_nudge',
  'high:medium':  'closing',
  'high:high':    'closing',
  'medium:low':   'reengage',
  'medium:medium':'standard_recs',
  'medium:high':  'guided',
  'low:low':      'dormant',
  'low:medium':   'inspire',
  'low:high':     'inspire'
};

/** Pick the scenario key for a user's intent document. */
function selectScenario(intent) {
  const it = intent?.tier || 'low';
  const et = intent?.engagementTier || 'low';
  const tr = intent?.trajectory || 'new';

  if (tr === 'post-booking') return 'suppressed';
  if (tr === 'falling' && it !== 'high') return 'reengage';

  return SCENARIO_MATRIX[`${it}:${et}`] || 'dormant';
}

function inBookingCooldown(intent, destination) {
  if (!destination || !intent?.bookingCooldowns?.length) return false;
  const cutoff = Date.now() - COOLDOWN_MS;
  const d = String(destination).toLowerCase();
  return intent.bookingCooldowns.some(
    c => c.destination && String(c.destination).toLowerCase() === d
      && new Date(c.bookedAt).getTime() > cutoff
  );
}

/** Deterministic fallback copy per scenario. */
function templateCopy(scenario, dest) {
  const d = dest || 'your next trip';
  switch (scenario) {
    case 'decisive_nudge':
      return { title: `Ready to lock in ${d}?`, message: `You're all set on ${d} — complete your booking in a couple of taps.` };
    case 'closing':
      return { title: `Finish planning your ${d} trip`, message: `Your ${d} options are saved. Pick up right where you left off.` };
    case 'guided':
      return { title: `More ${d} options for you`, message: `Based on what you've been viewing, here are stays and flights worth a look.` };
    case 'standard_recs':
      return { title: `Handpicked for your ${d} trip`, message: `A fresh set of recommendations matched to your preferences.` };
    case 'reengage':
      return { title: `Still thinking about ${d}?`, message: `Your ${d} search is waiting — jump back in whenever you're ready.` };
    case 'inspire':
      return { title: `Places you might love`, message: `Discover destinations picked from what you've been exploring.` };
    default:
      return null;
  }
}

/** Map scenario → notification type + priority + CTA. */
function scenarioMeta(scenario, dest) {
  const enc = encodeURIComponent(dest || '');
  switch (scenario) {
    case 'decisive_nudge': return { type: 'decisive_nudge', priority: 16, ctaLabel: `Book ${dest}`,   ctaUrl: `/flights?toCity=${enc}` };
    case 'closing':        return { type: 'closing',        priority: 15, ctaLabel: `Continue ${dest}`,ctaUrl: `/flights?toCity=${enc}` };
    case 'guided':         return { type: 'guided',         priority: 10, ctaLabel: 'View options',    ctaUrl: `/hotels?city=${enc}` };
    case 'standard_recs':  return { type: 'standard_recs',  priority: 8,  ctaLabel: 'See recommendations', ctaUrl: '/' };
    case 'reengage':       return { type: 'reengage',       priority: 12, ctaLabel: `Resume ${dest}`,  ctaUrl: `/flights?toCity=${enc}` };
    case 'inspire':        return { type: 'inspire',        priority: 6,  ctaLabel: 'Explore',          ctaUrl: '/' };
    default:               return null;
  }
}

/**
 * Build the primary scenario notification for a user (or null when the scenario
 * is silent: dormant / suppressed / cooled-down). Async to allow LLM copy.
 */
async function buildScenarioNotification(prefs, intent) {
  const scenario = selectScenario(intent);
  if (scenario === 'suppressed' || scenario === 'dormant') return null;

  const dest = intent?.primaryPlanningDestination
    || prefs?.favoriteDestinations?.[0]?.destination
    || null;

  // Never nudge about a destination the user just booked.
  if (inBookingCooldown(intent, dest)) return null;

  const meta = scenarioMeta(scenario, dest);
  if (!meta) return null;

  const ctx = {
    destination: dest,
    intentTier: intent?.tier || 'low',
    engagementTier: intent?.engagementTier || 'low',
    trajectory: intent?.trajectory || 'new'
  };
  const copy = (await generateCopy(scenario, ctx)) || templateCopy(scenario, dest);
  if (!copy) return null;

  return {
    id: `${meta.type}_${dest || 'general'}`,
    type: meta.type,
    scenario,
    title: copy.title,
    message: copy.message,
    ctaLabel: meta.ctaLabel,
    ctaUrl: meta.ctaUrl,
    priority: meta.priority
  };
}

module.exports = {
  SCENARIO_MATRIX,
  selectScenario,
  buildScenarioNotification,
  templateCopy,
  inBookingCooldown
};
