/** Curated destination intelligence for AI features (expand via admin/CMS later) */
const DESTINATIONS = {
  bangkok: {
    country: 'Thailand',
    coords: { lat: 13.7563, lng: 100.5018 },
    scamRisk: 'medium',
    safetyScore: 72,
    scams: ['Fake taxi at airport', 'Gem scam', 'Tuk-tuk overcharging', 'Fake closed temple redirects'],
    neighborhoods: { sukhumvit: { safety: 78 }, khaosan: { safety: 65, note: 'Pickpocket hotspot at night' } },
    taxiWarning: 'Use Grab/Bolt only from airport; refuse unmetered taxis',
    touristTraps: ['Grand Palace dress-code scam', 'Floating market day-trip upsells'],
    emergency: { police: '191', ambulance: '1669', embassy: 'Indian Embassy +66 2 258 0300' },
    crimeScore: 42,
    womenSafety: 70,
    familySafety: 75,
    crowd: { peak: 'Nov–Feb', low: 'May–Oct', bestHours: 'Early morning temples' },
    hiddenGems: ['Talad Noi street art', 'Bang Krachao green lung'],
    localFood: ['Boat noodles', 'Mango sticky rice at Mae Varee'],
    festivals: ['Songkran (Apr)', 'Loy Krathong (Nov)'],
    carbonFactor: 0.18
  },
  goa: {
    country: 'India',
    coords: { lat: 15.2993, lng: 74.1240 },
    scamRisk: 'low',
    safetyScore: 82,
    scams: ['Beach shack bill inflation', 'Fake tour operators'],
    neighborhoods: { calangute: { safety: 75 }, palolem: { safety: 88 } },
    taxiWarning: 'Pre-book airport transfers; use app cabs in cities',
    touristTraps: ['Water sports without licensed operators'],
    emergency: { police: '100', ambulance: '108' },
    crimeScore: 28,
    womenSafety: 78,
    familySafety: 85,
    crowd: { peak: 'Dec–Jan', low: 'Jun–Sep', bestHours: 'Beaches before 10am' },
    hiddenGems: ['Chorao Island', 'Fontainhas Latin Quarter'],
    localFood: ['Fish thali at local shacks', 'Bebinca'],
    festivals: ['Carnival (Feb)', 'Sunburn (Dec)'],
    carbonFactor: 0.12
  },
  dubai: {
    country: 'UAE',
    coords: { lat: 25.2048, lng: 55.2708 },
    scamRisk: 'low',
    safetyScore: 90,
    scams: ['Fake luxury goods', 'Unlicensed desert safari operators'],
    neighborhoods: { deira: { safety: 85 }, marina: { safety: 92 } },
    taxiWarning: 'Use RTA taxis or Careem; avoid unofficial airport porters',
    touristTraps: ['Overpriced desert photo packages'],
    emergency: { police: '999', ambulance: '998' },
    crimeScore: 15,
    womenSafety: 88,
    familySafety: 92,
    crowd: { peak: 'Nov–Mar', low: 'Jun–Aug', bestHours: 'Indoor malls midday summer' },
    hiddenGems: ['Al Fahidi Historical District', 'Hatta mountains'],
    localFood: ['Al Machboos', 'Karak chai'],
    festivals: ['Dubai Shopping Festival (Jan)', 'Eid celebrations'],
    carbonFactor: 0.22
  },
  vietnam: {
    country: 'Vietnam',
    coords: { lat: 21.0285, lng: 105.8542 },
    scamRisk: 'medium',
    safetyScore: 76,
    scams: ['Motorbike rental damage scams', 'Counterfeit tour tickets'],
    neighborhoods: { hanoi_old_quarter: { safety: 74 }, hcm_district1: { safety: 72 } },
    taxiWarning: 'Grab is safest; avoid shoe-shine distraction scams',
    touristTraps: ['Halong bay cheap junk boats'],
    emergency: { police: '113', ambulance: '115' },
    crimeScore: 35,
    womenSafety: 74,
    familySafety: 80,
    crowd: { peak: 'Dec–Feb', low: 'May–Sep', bestHours: 'Street food evenings' },
    hiddenGems: ['Ninh Binh', 'Da Nang Marble Mountains'],
    localFood: ['Pho', 'Banh mi', 'Egg coffee'],
    festivals: ['Tet (Jan/Feb)', 'Mid-Autumn Festival'],
    carbonFactor: 0.15
  },
  paris: {
    country: 'France',
    coords: { lat: 48.8566, lng: 2.3522 },
    scamRisk: 'medium',
    safetyScore: 74,
    scams: ['Petition scam', 'Friendship bracelet scam', 'Pickpockets on Metro'],
    neighborhoods: { marais: { safety: 80 }, gare_du_nord: { safety: 58 } },
    taxiWarning: 'Official taxi ranks only; beware fake petitions near monuments',
    touristTraps: ['Restaurants on Champs-Élysées', 'Eiffel skip-line street sellers'],
    emergency: { police: '17', ambulance: '15' },
    crimeScore: 48,
    womenSafety: 76,
    familySafety: 78,
    crowd: { peak: 'Jun–Aug', low: 'Jan–Feb', bestHours: 'Louvre Wednesday/Friday nights' },
    hiddenGems: ['Promenade Plantée', 'Canal Saint-Martin'],
    localFood: ['Bouillon Chartier', 'Crêpes in Montparnasse'],
    festivals: ['Bastille Day (Jul)', 'Nuit Blanche (Oct)'],
    carbonFactor: 0.25
  },
  jaipur: {
    country: 'India',
    coords: { lat: 26.9124, lng: 75.7873 },
    scamRisk: 'medium',
    safetyScore: 78,
    scams: ['Gem shop tours', 'Fake government guides at forts'],
    neighborhoods: { c_scheme: { safety: 82 }, old_city: { safety: 70 } },
    taxiWarning: 'Use Ola/Uber; agree auto fares before ride',
    touristTraps: ['Elephant ride ethics concerns at Amber Fort'],
    emergency: { police: '100', ambulance: '108' },
    crimeScore: 32,
    womenSafety: 72,
    familySafety: 80,
    crowd: { peak: 'Oct–Mar', low: 'May–Jun', bestHours: 'Forts at sunrise' },
    hiddenGems: ['Panna Meena ka Kund', 'Nahargarh sunset'],
    localFood: ['Dal baati churma', 'Lassi at Lassiwala'],
    festivals: ['Teej', 'Jaipur Literature Festival'],
    carbonFactor: 0.1
  }
};

const TRENDING = [
  { destination: 'Vietnam', trend: '+34%', type: 'social', tag: 'viral' },
  { destination: 'Ladakh', trend: '+28%', type: 'seasonal', tag: 'adventure' },
  { destination: 'Bali', trend: '+22%', type: 'popularity', tag: 'hidden-gem' },
  { destination: 'Portugal', trend: '+19%', type: 'underrated', tag: 'europe' },
  { destination: 'Goa', trend: '+15%', type: 'domestic', tag: 'weekend' }
];

const GEO_RECOMMENDATIONS = {
  india: {
    budget: { low: ['Vietnam', 'Nepal', 'Sri Lanka'], mid: ['Thailand', 'Dubai', 'Bali'], high: ['Singapore', 'Europe', 'Japan'] },
    season: { summer: ['Himachal', 'Ladakh', 'Scandinavia'], winter: ['Goa', 'Thailand', 'Dubai'] }
  }
};

function resolveDestination(input) {
  if (!input) return null;
  const key = String(input).toLowerCase().trim().replace(/\s+/g, '_');
  return DESTINATIONS[key] || DESTINATIONS[Object.keys(DESTINATIONS).find(k => key.includes(k))] || null;
}

module.exports = { DESTINATIONS, TRENDING, GEO_RECOMMENDATIONS, resolveDestination };
