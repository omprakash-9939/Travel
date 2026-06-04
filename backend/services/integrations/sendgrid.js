const KEY = () => process.env.SENDGRID_API_KEY;
const FROM = () => process.env.SENDGRID_FROM_EMAIL || 'bookings@dataart.travel';

async function sendEmail({ to, subject, html, text }) {
  if (!KEY()) return { sent: false, reason: 'SendGrid not configured' };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM(), name: 'DataArt Travel' },
      subject,
      content: [
        { type: 'text/plain', value: text || subject },
        { type: 'text/html', value: html || `<p>${subject}</p>` }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('SendGrid error:', err);
    return { sent: false, reason: err };
  }
  return { sent: true };
}

async function sendBookingConfirmation({ email, booking }) {
  const html = `
    <h2>Booking confirmed — ${booking.bookingId}</h2>
    <p>Type: ${booking.type}</p>
    <p>Total: ₹${booking.pricing?.total?.toLocaleString('en-IN')}</p>
    <p>Status: ${booking.status}</p>
    <p>Thank you for booking with DataArt Travel.</p>
  `;
  return sendEmail({
    to: email,
    subject: `Booking confirmed ${booking.bookingId}`,
    html,
    text: `Your booking ${booking.bookingId} is confirmed. Total ₹${booking.pricing?.total}.`
  });
}

function isConfigured() {
  return Boolean(KEY());
}

module.exports = { sendEmail, sendBookingConfirmation, isConfigured };
