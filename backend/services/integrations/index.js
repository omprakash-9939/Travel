const amadeus = require('../amadeus');
const exchangeRate = require('./exchangeRate');
const mapbox = require('./mapbox');
const googleMaps = require('./googleMaps');
const googlePlaces = require('./googlePlaces');
const stripePay = require('./stripePay');
const razorpayPay = require('./razorpayPay');
const sendgrid = require('./sendgrid');
const twilio = require('./twilio');

function getIntegrationStatus() {
  return {
    amadeus: { configured: amadeus.isConfigured(), docs: 'https://developers.amadeus.com' },
    openWeather: { configured: Boolean(process.env.OPENWEATHER_API_KEY), docs: 'https://openweathermap.org/api' },
    openai: { configured: Boolean(process.env.OPENAI_API_KEY), docs: 'https://platform.openai.com' },
    exchangeRate: { configured: exchangeRate.isConfigured(), docs: 'https://www.exchangerate-api.com' },
    mapbox: { configured: mapbox.isConfigured(), docs: 'https://www.mapbox.com' },
    googleMaps: { configured: googleMaps.isConfigured(), docs: 'https://console.cloud.google.com' },
    googlePlaces: { configured: googlePlaces.isConfigured(), docs: 'https://developers.google.com/maps/documentation/places' },
    stripe: { configured: stripePay.isConfigured(), publishableKey: stripePay.publishableKey(), docs: 'https://stripe.com' },
    razorpay: { configured: razorpayPay.isConfigured(), keyId: razorpayPay.keyId(), docs: 'https://razorpay.com' },
    sendgrid: { configured: sendgrid.isConfigured(), docs: 'https://sendgrid.com' },
    twilio: { configured: twilio.isConfigured(), docs: 'https://www.twilio.com' }
  };
}

async function notifyBookingConfirmation(booking, contact) {
  const results = { email: null, sms: null };
  if (contact?.email) {
    results.email = await sendgrid.sendBookingConfirmation({ email: contact.email, booking });
  }
  if (contact?.phone) {
    results.sms = await twilio.sendBookingSms({ phone: contact.phone, booking });
  }
  return results;
}

async function resolveMap(query, lat, lng) {
  if (lat != null && lng != null) {
    const mapboxUrl = mapbox.staticMapUrl({ lat, lng });
    const googleUrl = googleMaps.staticMapUrl({ lat, lng });
    return {
      lat,
      lng,
      staticMapUrl: mapboxUrl || googleUrl,
      provider: mapboxUrl ? 'mapbox' : googleUrl ? 'google' : null
    };
  }
  const mb = await mapbox.geocode(query);
  if (mb?.[0]) {
    return {
      ...mb[0],
      staticMapUrl: mapbox.staticMapUrl({ lat: mb[0].lat, lng: mb[0].lng }),
      provider: 'mapbox'
    };
  }
  const g = await googleMaps.geocode(query);
  if (g?.[0]) {
    return {
      name: g[0].formatted,
      lat: g[0].lat,
      lng: g[0].lng,
      placeId: g[0].placeId,
      staticMapUrl: googleMaps.staticMapUrl({ lat: g[0].lat, lng: g[0].lng }),
      provider: 'google'
    };
  }
  return null;
}

module.exports = {
  getIntegrationStatus,
  notifyBookingConfirmation,
  resolveMap,
  exchangeRate,
  mapbox,
  googleMaps,
  googlePlaces,
  stripePay,
  razorpayPay,
  sendgrid,
  twilio,
  amadeus
};
