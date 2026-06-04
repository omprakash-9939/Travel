const CABIN_MAP = {
  economy: 'economy',
  ec: 'economy',
  premiumeconomy: 'premiumEconomy',
  'premium economy': 'premiumEconomy',
  premiumeconomyclass: 'premiumEconomy',
  business: 'business',
  first: 'first',
  firstclass: 'first'
};

function normalizeCabin(cabin = 'economy') {
  const key = String(cabin).toLowerCase().replace(/\s+/g, '');
  return CABIN_MAP[key] || 'economy';
}

module.exports = { normalizeCabin, CABIN_MAP };
