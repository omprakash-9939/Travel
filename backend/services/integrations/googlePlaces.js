const KEY = () => process.env.GOOGLE_MAPS_API_KEY;

async function textSearch(query, location) {
  if (!KEY()) return null;
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${KEY()}`;
  if (location?.lat != null) {
    url += `&location=${location.lat},${location.lng}&radius=8000`;
  }
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return (json.results || []).map((p) => ({
    placeId: p.place_id,
    name: p.name,
    rating: p.rating,
    userRatingsTotal: p.user_ratings_total,
    address: p.formatted_address,
    types: p.types,
    lat: p.geometry?.location?.lat,
    lng: p.geometry?.location?.lng
  }));
}

async function placeDetails(placeId) {
  if (!KEY() || !placeId) return null;
  const fields = 'name,rating,reviews,formatted_address,url,opening_hours,website';
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${KEY()}`
  );
  if (!res.ok) return null;
  const json = await res.json();
  const r = json.result;
  if (!r) return null;
  return {
    name: r.name,
    rating: r.rating,
    address: r.formatted_address,
    website: r.website,
    googleUrl: r.url,
    reviews: (r.reviews || []).slice(0, 5).map((rev) => ({
      author: rev.author_name,
      rating: rev.rating,
      text: rev.text,
      time: rev.relative_time_description
    }))
  };
}

async function nearbyAttractions(city, lat, lng) {
  return textSearch(`tourist attractions in ${city}`, lat != null ? { lat, lng } : undefined);
}

function isConfigured() {
  return Boolean(KEY());
}

module.exports = { textSearch, placeDetails, nearbyAttractions, isConfigured };
