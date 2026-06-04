const TOKEN = () => process.env.MAPBOX_ACCESS_TOKEN;

async function geocode(query) {
  if (!TOKEN()) return null;
  const q = encodeURIComponent(query);
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${TOKEN()}&limit=5`
  );
  if (!res.ok) return null;
  const json = await res.json();
  return (json.features || []).map((f) => ({
    id: f.id,
    name: f.place_name,
    lat: f.center[1],
    lng: f.center[0],
    context: f.context
  }));
}

function staticMapUrl({ lat, lng, zoom = 12, width = 600, height = 320 }) {
  if (!TOKEN() || lat == null || lng == null) return null;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+1B3A5C(${lng},${lat})/${lng},${lat},${zoom},0/${width}x${height}@2x?access_token=${TOKEN()}`;
}

function isConfigured() {
  return Boolean(TOKEN());
}

module.exports = { geocode, staticMapUrl, isConfigured };
