const { resolveDestination, TRENDING, GEO_RECOMMENDATIONS } = require('./destinationData');

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
  return Math.abs(h);
}

// --- 1. Scam Detection ---
function getScamIntelligence(destination, hotelReviewSignals = {}) {
  const data = resolveDestination(destination) || {
    scamRisk: 'unknown', safetyScore: 70, scams: [], neighborhoods: {},
    taxiWarning: 'Use licensed transport apps', touristTraps: []
  };
  let reviewRisk = 0;
  if (hotelReviewSignals.suspiciousReviewRatio > 0.4) reviewRisk += 25;
  if (hotelReviewSignals.avgRatingSpike) reviewRisk += 15;
  const scamRiskScore = Math.min(100, Math.round(
    ({ low: 25, medium: 55, high: 80, unknown: 45 }[data.scamRisk] || 45) + reviewRisk
  ));
  return {
    destination,
    scamRiskScore,
    safetyScore: data.safetyScore,
    overallRisk: scamRiskScore > 65 ? 'High' : scamRiskScore > 40 ? 'Medium' : 'Low',
    warnings: data.scams,
    taxiRisk: data.taxiWarning,
    touristTraps: data.touristTraps,
    neighborhoods: data.neighborhoods,
    summary: `${destination} Tourist Scam Risk: ${scamRiskScore > 65 ? 'High' : scamRiskScore > 40 ? 'Medium' : 'Low'}`
  };
}

// --- 2. Weather Intelligence ---
async function getWeatherIntelligence(destination) {
  const data = resolveDestination(destination);
  const coords = data?.coords || { lat: 28.6139, lng: 77.209 };
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lng}&appid=${apiKey}&units=metric`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const current = json.list[0];
        const daily = json.list.filter((_, i) => i % 8 === 0).slice(0, 7);
        return formatWeatherFromApi(destination, current, daily, json.city?.name);
      }
    } catch (e) {
      console.warn('OpenWeather fetch failed, using simulated data');
    }
  }

  const seed = hashSeed(destination + new Date().toDateString());
  const temp = 22 + (seed % 15);
  const rainDay = (seed % 7) + 2;
  return {
    destination,
    current: { temp, condition: temp > 28 ? 'Sunny' : 'Partly cloudy', humidity: 55 + (seed % 30), uvIndex: 6 + (seed % 4), aqi: 45 + (seed % 80) },
    hourly: Array.from({ length: 8 }, (_, i) => ({
      hour: `${(8 + i) % 24}:00`,
      temp: temp + (i % 3) - 1,
      rainProbability: (seed + i) % 5 === 0 ? 60 : 10
    })),
    weekly: Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      high: temp + 3,
      low: temp - 4,
      rainProbability: i === rainDay ? 75 : 15
    })),
    aiRecommendations: {
      packing: temp > 26 ? 'Light cotton clothes, sunscreen, hat' : 'Light layers and a compact rain jacket',
      outdoor: rainDay <= 3 ? 'Great for outdoor sightseeing early week' : `Rain expected around day ${rainDay} — plan indoor museums`,
      bestTime: 'Early morning for attractions, evenings for food markets'
    },
    summary: rainDay <= 4
      ? 'Carry light jackets. Rain possible mid-week — pack a compact umbrella.'
      : 'Mostly dry week. Sun protection recommended for afternoon activities.'
  };
}

function formatWeatherFromApi(destination, current, daily, cityName) {
  const main = current.main;
  const rainDay = daily.findIndex(d => (d.pop || 0) > 0.5);
  return {
    destination: cityName || destination,
    current: {
      temp: Math.round(main.temp),
      condition: current.weather[0]?.description,
      humidity: main.humidity,
      uvIndex: 5,
      aqi: null
    },
    hourly: daily[0] ? [{ hour: 'Now', temp: Math.round(main.temp), rainProbability: Math.round((current.pop || 0) * 100) }] : [],
    weekly: daily.map(d => ({
      day: new Date(d.dt * 1000).toLocaleDateString('en', { weekday: 'short' }),
      high: Math.round(d.main.temp_max),
      low: Math.round(d.main.temp_min),
      rainProbability: Math.round((d.pop || 0) * 100)
    })),
    aiRecommendations: {
      packing: main.temp > 25 ? 'Breathable fabrics and sun protection' : 'Layers and light rain gear',
      outdoor: rainDay >= 0 ? `Rain likely day ${rainDay + 1} — alternate indoor plans` : 'Favorable week for outdoor activities',
      bestTime: 'Morning hours typically cooler and less crowded'
    },
    summary: rainDay >= 0 ? `Rain expected around day ${rainDay + 1}. Pack accordingly.` : 'Stable weather expected this week.'
  };
}

// --- 3. Geo Advisor ---
function getGeoRecommendations({ userCountry = 'India', budget = 80000, season, interests = [] }) {
  const budgetTier = budget < 40000 ? 'low' : budget < 100000 ? 'mid' : 'high';
  const recs = GEO_RECOMMENDATIONS.india?.budget[budgetTier] || ['Thailand', 'Vietnam'];
  const seasonKey = season || (new Date().getMonth() < 4 || new Date().getMonth() > 9 ? 'winter' : 'summer');
  const seasonal = GEO_RECOMMENDATIONS.india?.season[seasonKey] || recs;

  return {
    userCountry,
    budget,
    budgetTier,
    recommendations: recs.map((country, i) => ({
      rank: i + 1,
      destination: country,
      matchScore: 92 - i * 7,
      reason: `Based on your location in ${userCountry} and budget of ₹${budget.toLocaleString('en-IN')}, ${country} offers strong value.`,
      bestDates: seasonKey === 'winter' ? 'Nov–Feb' : 'Apr–Jun',
      estimatedCost: Math.round(budget * (0.85 - i * 0.1))
    })),
    seasonalPicks: seasonal,
    summary: `Based on your location in ${userCountry} and your budget, ${recs[0]} is currently the best destination.`
  };
}

// --- 4. Chat Assistant ---
function chatAssistant(message, context = {}) {
  const msg = message.toLowerCase();
  const budgetMatch = msg.match(/₹?\s*([\d,]+)/);
  const daysMatch = msg.match(/(\d+)\s*days?/);

  if (budgetMatch && daysMatch) {
    const budget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    const days = parseInt(daysMatch[1], 10);
    const geo = getGeoRecommendations({ budget, userCountry: context.country || 'India' });
    return {
      role: 'assistant',
      content: `With ₹${budget.toLocaleString('en-IN')} for ${days} days, I recommend **${geo.recommendations[0].destination}** (${geo.recommendations[0].estimatedCost ? `~₹${geo.recommendations[0].estimatedCost.toLocaleString('en-IN')} all-in` : 'great value'}).\n\n**Sample split:** Flights 35% · Hotel 30% · Food 15% · Activities 12% · Local transport 8%.\n\nWant me to build a day-by-day itinerary or search live flights?`,
      suggestions: ['Build itinerary', 'Search flights', 'Compare hotels', 'Safety check']
    };
  }

  if (msg.includes('itinerary') || msg.includes('plan')) {
    const dest = context.destination || 'Goa';
    const it = generateItinerary(dest, context.days || 5);
    return { role: 'assistant', content: it.summary, itinerary: it.days, suggestions: ['Export PDF', 'Add to calendar', 'Book flights'] };
  }

  if (msg.includes('scam') || msg.includes('safe')) {
    const scam = getScamIntelligence(context.destination || 'Bangkok');
    return { role: 'assistant', content: `${scam.summary}\n\n**Top warnings:**\n${scam.warnings.slice(0, 3).map(w => `• ${w}`).join('\n')}\n\nSafety score: **${scam.safetyScore}/100**`, suggestions: ['Full safety report', 'Emergency contacts'] };
  }

  return {
    role: 'assistant',
    content: 'I\'m your DataArt Travel AI assistant. I can suggest trips, compare flights & hotels, build itineraries, check safety/scams, and forecast prices. Try: "I have ₹80,000 and 7 days — suggest an international trip."',
    suggestions: ['Budget trip ideas', 'Weekend from Delhi', 'Is Bangkok safe?', '5-day Goa itinerary']
  };
}

// --- 5. Personalization ---
function getPersonalizedFeed(userProfile = {}) {
  const { recentSearches = [], bookings = [], preferences = {} } = userProfile;
  const cities = [...new Set(recentSearches.map(s => s.to || s.city).filter(Boolean))];
  const airlines = preferences.preferredAirlines || ['IndiGo', 'Vistara'];
  return {
    homepage: {
      heroOffer: cities[0] ? `Deals to ${cities[0]} — members save up to 18%` : 'Anniversary Sale — up to ₹10,000 OFF',
      recommendedDestinations: cities.length ? cities : ['Goa', 'Dubai', 'Bangkok'],
      preferredAirlines: airlines,
      hotelCategory: preferences.hotelStars || '4-star'
    },
    offers: [
      { title: `Return to ${cities[0] || 'Goa'}`, discount: '12% off hotels', personalized: true },
      { title: `${airlines[0]} exclusive`, discount: 'Zero convenience fee', personalized: true }
    ]
  };
}

// --- 6. Trends ---
function getTrendDiscovery() {
  return { trending: TRENDING, hiddenGems: TRENDING.filter(t => t.tag === 'hidden-gem'), seasonal: TRENDING.filter(t => t.type === 'seasonal') };
}

// --- 7. Budget Planner ---
function planBudget({ totalBudget, days = 5, destination = 'Goa', travelers = 2 }) {
  const split = { flights: 0.35, hotels: 0.30, food: 0.15, transport: 0.08, activities: 0.12 };
  const breakdown = Object.fromEntries(
    Object.entries(split).map(([k, pct]) => [k, Math.round(totalBudget * pct)])
  );
  return {
    totalBudget,
    days,
    destination,
    travelers,
    breakdown,
    perPersonPerDay: Math.round(totalBudget / (days * travelers)),
    tips: ['Book flights 4–6 weeks ahead for domestic', 'Weekday hotel rates average 15% lower']
  };
}

// --- 8. Itinerary ---
function generateItinerary(destination, days = 5) {
  const data = resolveDestination(destination);
  const gems = data?.hiddenGems || ['Old town walk', 'Local market', 'Sunset viewpoint'];
  const food = data?.localFood || ['Street food tour', 'Regional specialty dinner'];
  const dayPlans = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    title: `Day ${i + 1}: ${['Arrival & explore', 'Culture & history', 'Nature & adventure', 'Food & local life', 'Relax & depart'][i] || 'Free exploration'}`,
    morning: i === 0 ? 'Check-in & neighborhood walk' : gems[i % gems.length],
    afternoon: `Main attraction block ${i + 1}`,
    evening: food[i % food.length],
    transport: 'Metro / app cab / walking'
  }));
  return {
    destination,
    days: dayPlans,
    summary: `**${days}-day ${destination} itinerary** ready. Mix of ${gems[0]} and local cuisine highlights.`,
    exportFormats: ['pdf', 'ics']
  };
}

// --- 9. Safety ---
function getSafetyIntelligence(destination) {
  const data = resolveDestination(destination) || {};
  return {
    destination,
    crimeScore: data.crimeScore ?? 40,
    womenSafetyScore: data.womenSafety ?? 70,
    familySafetyScore: data.familySafety ?? 75,
    healthAlerts: ['Check CDC/WHO advisories before travel', 'Travel insurance recommended'],
    localLaws: ['Respect dress codes at religious sites', 'No drone flying without permit in many countries'],
    emergency: data.emergency || { police: '112', ambulance: '112' }
  };
}

// --- 10. Crowd ---
function getCrowdPrediction(destination) {
  const data = resolveDestination(destination) || {};
  return {
    destination,
    expectedCrowd: data.crowd?.peak?.includes('Dec') ? 'High' : 'Moderate',
    peakSeason: data.crowd?.peak || 'Varies',
    lowSeason: data.crowd?.low || 'Off-peak months',
    bestVisitingHours: data.crowd?.bestHours || 'Early morning',
    discountTip: 'Book 8–12 weeks ahead for peak season; low season sees up to 35% hotel savings'
  };
}

// --- 11. Price Prediction ---
function predictPrice({ type = 'flight', route, currentPrice, departureDate }) {
  const seed = hashSeed(`${type}-${route}-${departureDate}`);
  const trend = seed % 3;
  const change = trend === 0 ? -8 : trend === 1 ? 5 : 0;
  const recommendation = change < -3 ? 'buy_now' : change > 3 ? 'wait' : 'neutral';
  return {
    type,
    currentPrice,
    predictedChangePercent: change,
    recommendation,
    label: recommendation === 'buy_now' ? 'Buy now — prices likely to rise' : recommendation === 'wait' ? 'Wait — prices may drop 5–8%' : 'Stable — book when convenient',
    bestBookingDate: recommendation === 'wait' ? 'In 5–7 days' : 'Within 48 hours',
    confidence: 72 + (seed % 20)
  };
}

// --- 12. Companion Matching (privacy-first) ---
function matchCompanions({ destination, dates, interests = [], userId }, pool = []) {
  return pool
    .filter(p => p.userId !== userId && p.destination?.toLowerCase() === destination?.toLowerCase())
    .map(p => ({
      matchId: `M-${hashSeed(p.userId + userId)}`,
      compatibilityScore: 60 + (hashSeed((interests.join('')) + p.interests?.join('')) % 35),
      sharedInterests: interests.filter(i => p.interests?.includes(i)),
      privacyNote: 'Only first name shown until both opt in'
    }))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 5);
}

// --- 13. Local Experiences ---
function getLocalExperiences(destination) {
  const data = resolveDestination(destination) || {};
  return {
    destination,
    restaurants: (data.localFood || []).map(f => ({ name: f, type: 'local', touristTrap: false })),
    culturalEvents: data.festivals || [],
    experiences: data.hiddenGems || [],
    events: (data.festivals || []).map(f => ({ name: f, type: 'festival' }))
  };
}

// --- 14. Carbon ---
function calculateCarbon({ flightKm = 1500, nights = 3, hotelStars = 4 }) {
  const flightKg = Math.round(flightKm * 0.15);
  const hotelKg = nights * (hotelStars >= 4 ? 12 : 8);
  return {
    flightEmissionsKg: flightKg,
    hotelEmissionsKg: hotelKg,
    totalKg: flightKg + hotelKg,
    hotelSustainabilityScore: Math.max(40, 90 - hotelStars * 8),
    greenerAlternative: 'Consider direct flights (+8% cost, −18% emissions) or 3-star eco-certified stays'
  };
}

// --- 15. Emergency ---
function getEmergencyPack(destination, nationality = 'India') {
  const data = resolveDestination(destination) || {};
  return {
    destination,
    offlineReady: true,
    embassy: data.emergency?.embassy || `Contact ${nationality} embassy locally`,
    hospitals: ['Nearest trauma center — search "hospital" in maps offline pack'],
    emergencyNumbers: data.emergency || { general: '112' },
    checklist: ['Passport copy', 'Insurance card', 'Local SIM or eSIM', 'Cash backup']
  };
}

// Hotel review fraud heuristic
function analyzeReviewAuthenticity(reviews = []) {
  if (!reviews.length) return { suspiciousReviewRatio: 0, fakeRisk: 'low' };
  const shortBurst = reviews.filter(r => r.text?.length < 20).length / reviews.length;
  const fiveStarOnly = reviews.every(r => r.rating === 5);
  return {
    suspiciousReviewRatio: shortBurst + (fiveStarOnly ? 0.3 : 0),
    fakeRisk: shortBurst > 0.5 ? 'high' : shortBurst > 0.25 ? 'medium' : 'low'
  };
}

module.exports = {
  getScamIntelligence,
  getWeatherIntelligence,
  getGeoRecommendations,
  chatAssistant,
  getPersonalizedFeed,
  getTrendDiscovery,
  planBudget,
  generateItinerary,
  getSafetyIntelligence,
  getCrowdPrediction,
  predictPrice,
  matchCompanions,
  getLocalExperiences,
  calculateCarbon,
  getEmergencyPack,
  analyzeReviewAuthenticity
};
