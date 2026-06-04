const SID = () => process.env.TWILIO_ACCOUNT_SID;
const TOKEN = () => process.env.TWILIO_AUTH_TOKEN;
const FROM = () => process.env.TWILIO_PHONE_NUMBER;

async function sendSms({ to, body }) {
  if (!SID() || !TOKEN() || !FROM()) {
    return { sent: false, reason: 'Twilio not configured' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${SID()}/Messages.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${SID()}:${TOKEN()}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ To: to, From: FROM(), Body: body }).toString()
  });

  const json = await res.json();
  if (!res.ok) {
    console.warn('Twilio error:', json);
    return { sent: false, reason: json.message };
  }
  return { sent: true, sid: json.sid };
}

async function sendBookingSms({ phone, booking }) {
  const body = `DataArt Travel: Booking ${booking.bookingId} confirmed. Total ₹${booking.pricing?.total}. Safe travels!`;
  return sendSms({ to: phone, body });
}

function isConfigured() {
  return Boolean(SID() && TOKEN() && FROM());
}

module.exports = { sendSms, sendBookingSms, isConfigured };
