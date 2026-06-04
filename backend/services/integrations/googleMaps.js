const KEY = () => process.env.GOOGLE_MAPS_API_KEY;

async function geocode(address) {
  if (!KEY()) return null;
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${KEY()}`
  );
  if (!res.ok) return null;
  const json = await res.json();
  return (json.results || []).map((r) => ({
    formatted: r.formatted_address,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    placeId: r.place_id
  }));
}

function staticMapUrl({ lat, lng, zoom = 14 }) {
  if (!KEY() || lat == null) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=600x320&markers=color:red%7C${lat},${lng}&key=${KEY()}`;
}

function isConfigured() {
  return Boolean(KEY());
}

module.exports = { geocode, staticMapUrl, isConfigured };
