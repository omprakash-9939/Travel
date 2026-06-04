const FALLBACK_RATES = {
  INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, AED: 0.044, THB: 0.43, SGD: 0.016
};

async function getRates(base = 'INR') {
  const key = process.env.EXCHANGERATE_API_KEY;
  const url = key
    ? `https://v6.exchangerate-api.com/v6/${key}/latest/${base}`
    : `https://open.er-api.com/v6/latest/${base}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('rate fetch failed');
    const json = await res.json();
    return {
      base: json.base_code || base,
      rates: json.rates || json.conversion_rates,
      source: key ? 'exchangerate-api' : 'open.er-api.com',
      updatedAt: json.time_last_update_unix ? new Date(json.time_last_update_unix * 1000) : new Date()
    };
  } catch {
    return { base, rates: FALLBACK_RATES, source: 'fallback', updatedAt: new Date() };
  }
}

function convert(amount, from, to, rates) {
  if (from === to) return amount;
  const r = rates || FALLBACK_RATES;
  const inBase = amount / (r[from] || 1);
  return Math.round(inBase * (r[to] || 1) * 100) / 100;
}

function isConfigured() {
  return true;
}

module.exports = { getRates, convert, isConfigured, FALLBACK_RATES };
