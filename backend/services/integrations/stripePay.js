const SECRET = () => process.env.STRIPE_SECRET_KEY;

async function stripeRequest(path, body) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SECRET()}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(body).toString()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Stripe error');
  return json;
}

async function createPaymentIntent({ amount, currency = 'inr', metadata = {} }) {
  if (!SECRET()) return null;
  const amountInSmallest = Math.round(amount * 100);
  return stripeRequest('/payment_intents', {
    amount: String(amountInSmallest),
    currency: currency.toLowerCase(),
    'automatic_payment_methods[enabled]': 'true',
    ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, String(v)]))
  });
}

async function createCheckoutSession({ amount, currency = 'inr', successUrl, cancelUrl, metadata = {} }) {
  if (!SECRET()) return null;
  const session = await stripeRequest('/checkout/sessions', {
    mode: 'payment',
    success_url: successUrl || `${process.env.CLIENT_URL}/bookings?paid=1`,
    cancel_url: cancelUrl || `${process.env.CLIENT_URL}/checkout`,
    'line_items[0][price_data][currency]': currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
    'line_items[0][price_data][product_data][name]': 'DataArt Travel Booking',
    'line_items[0][quantity]': '1',
    ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, String(v)]))
  });
  return session;
}

function isConfigured() {
  return Boolean(SECRET());
}

function publishableKey() {
  return process.env.STRIPE_PUBLISHABLE_KEY || '';
}

module.exports = { createPaymentIntent, createCheckoutSession, isConfigured, publishableKey };
