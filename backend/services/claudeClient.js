'use strict';

/**
 * claudeClient — OPTIONAL LLM copywriter for notifications (EP-06).
 *
 * The engine math (intent, engagement, preferences, scenario selection) is fully
 * deterministic in our own code. Claude is used only to phrase the human-facing
 * notification copy, and ONLY when both:
 *   - ENABLE_LLM_COPY=true, and
 *   - ANTHROPIC_API_KEY is set, and
 *   - the @anthropic-ai/sdk package is installed.
 * In every other case generateCopy() returns null and the caller falls back to
 * deterministic templates — so nothing ever blocks on an external call.
 */

const MODEL = 'claude-opus-4-8';

let _client = null;
let _initTried = false;

function getClient() {
  if (_initTried) return _client;
  _initTried = true;
  if (process.env.ENABLE_LLM_COPY !== 'true' || !process.env.ANTHROPIC_API_KEY) return null;
  try {
    // Lazy require so a missing optional dependency never crashes the server.
    const Anthropic = require('@anthropic-ai/sdk');
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch {
    _client = null; // SDK not installed → templates only
  }
  return _client;
}

const SYSTEM_PROMPT =
  'You write short, honest, non-pushy travel notification copy for a flight & hotel ' +
  'booking app. Never invent discounts, prices, scarcity, or facts not given to you. ' +
  'Return STRICT JSON: {"title": "...", "message": "..."}. Title <= 60 chars, message <= 140 chars.';

/**
 * Generate notification copy for a scenario. Returns { title, message } or null.
 * @param {string} scenario  scenario key (see notificationEngine SCENARIO_MATRIX)
 * @param {object} context   { destination, intentTier, engagementTier, trajectory }
 */
async function generateCopy(scenario, context = {}) {
  const client = getClient();
  if (!client) return null;
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Scenario: ${scenario}\nContext: ${JSON.stringify(context)}\n` +
          'Write the notification copy as JSON.'
      }]
    });
    const text = (res.content || []).map(b => b.text || '').join('').trim();
    const parsed = JSON.parse(text);
    if (parsed && parsed.title && parsed.message) {
      return { title: String(parsed.title), message: String(parsed.message) };
    }
    return null;
  } catch {
    return null; // any failure → deterministic template fallback
  }
}

module.exports = { generateCopy };
