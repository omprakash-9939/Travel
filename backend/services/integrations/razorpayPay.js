const KEY_ID = () => process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = () => process.env.RAZORPAY_KEY_SECRET;

function authHeader() {
  const creds = Buffer.from(`${KEY_ID()}:${KEY_SECRET()}`).toString('base64');
  return `Basic ${creds}`;
}

async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  if (!KEY_ID() || !KEY_SECRET()) return null;
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes
    })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.description || 'Razorpay error');
  return json;
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!KEY_SECRET()) return false;
  const crypto = require('crypto');
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', KEY_SECRET()).update(body).digest('hex');
  return expected === signature;
}

function isConfigured() {
  return Boolean(KEY_ID() && KEY_SECRET());
}

function keyId() {
  return KEY_ID() || '';
}

module.exports = { createOrder, verifyPaymentSignature, isConfigured, keyId };
