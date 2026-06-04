const CITY_TO_CODE = {
  delhi: 'DEL',
  'new delhi': 'DEL',
  mumbai: 'BOM',
  bangalore: 'BLR',
  bengaluru: 'BLR',
  chennai: 'MAA',
  kolkata: 'CCU',
  hyderabad: 'HYD',
  goa: 'GOI',
  jaipur: 'JAI',
  dubai: 'DXB',
  bangkok: 'BKK',
  singapore: 'SIN',
  london: 'LHR',
  paris: 'CDG',
  'new york': 'JFK',
  tokyo: 'NRT',
  hanoi: 'HAN',
  'ho chi minh': 'SGN',
  bali: 'DPS',
  phuket: 'HKT'
};

function cityToCode(city) {
  if (!city) return '';
  const trimmed = String(city).trim();
  if (/^[A-Z]{3}$/i.test(trimmed)) return trimmed.toUpperCase();
  return CITY_TO_CODE[trimmed.toLowerCase()] || trimmed.toUpperCase().slice(0, 3);
}

module.exports = { cityToCode, CITY_TO_CODE };
