import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { usePersonalization } from '../context/PersonalizationContext';
import api from '../utils/api';

export default function BookingCheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { format } = useCurrency();
  const { fetchAll } = usePersonalization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [integrations, setIntegrations] = useState(null);
  const [passenger, setPassenger] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });

  useEffect(() => {
    api.get('/integrations/status').then(({ data }) => setIntegrations(data.integrations)).catch(() => {});
  }, []);

  if (!state?.item) {
    return (
      <div className="page-pad container">
        <p>No booking in progress.</p>
        <Link to="/">Return home</Link>
      </div>
    );
  }

  const { type, item, pricing, meta } = state;
  const subtotal = pricing?.total || item?.totalPrice || item?.cabins?.economy?.price || 0;
  const taxes = Math.round(subtotal * 0.05);
  const total = Math.round(subtotal * 1.05);

  const completeBooking = async (paymentExtra = {}) => {
    const payload = {
      type,
      status: 'confirmed',
      item,
      passengers: [{ name: passenger.name, type: 'adult' }],
      contactInfo: { email: passenger.email, phone: passenger.phone },
      pricing: { baseFare: subtotal, taxes, total, currency: 'INR' },
      payment: { method: paymentMethod, status: 'paid', paidAt: new Date().toISOString(), ...paymentExtra }
    };
    if (type === 'flight') {
      payload.flight = {
        flightNumber: item.flightNumber,
        cabin: meta?.cabin || item.selectedCabin || 'economy',
        departure: item.departure,
        arrival: item.arrival,
        airline: item.airline?.name,
        origin: item.origin?.city || item.origin?.code,
        destination: item.destination?.city || item.destination?.code,
        source: item.source || 'demo'
      };
      if (item._id && /^[a-f0-9]{24}$/i.test(String(item._id))) payload.flight.flightRef = item._id;
    } else {
      payload.hotel = {
        hotelName: item.name,
        roomType: meta?.roomType || item.roomTypes?.[0]?.name,
        checkIn: meta?.checkIn,
        checkOut: meta?.checkOut,
        city: item.location?.city
      };
      if (item._id && /^[a-f0-9]{24}$/i.test(String(item._id))) payload.hotel.hotelRef = item._id;
    }
    const { data } = await api.post('/bookings', payload);
    return data;
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: '/checkout', checkoutState: state } });
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (paymentMethod === 'stripe' && integrations?.stripe?.configured) {
        const { data } = await api.post('/integrations/payments/stripe/checkout', {
          amount: total,
          currency: 'inr',
          successUrl: `${window.location.origin}/bookings?paid=1`,
          cancelUrl: `${window.location.origin}/checkout`,
          metadata: { type, userId: user._id }
        });
        sessionStorage.setItem('pendingCheckout', JSON.stringify(state));
        window.location.href = data.url;
        return;
      }

      if (paymentMethod === 'razorpay' && integrations?.razorpay?.configured) {
        const { data: orderData } = await api.post('/integrations/payments/razorpay/order', {
          amount: total,
          currency: 'INR',
          receipt: `booking_${Date.now()}`
        });
        const options = {
          key: orderData.keyId,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'DataArt Travel',
          description: `${type} booking`,
          order_id: orderData.order.id,
          handler: async (response) => {
            try {
              await api.post('/integrations/payments/razorpay/verify', {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              });
              const data = await completeBooking({
                transactionId: response.razorpay_payment_id,
                method: 'razorpay'
              });
              await fetchAll();
              navigate('/bookings', { state: { booked: data.booking?.bookingId } });
            } catch (err) {
              setError(err.response?.data?.message || 'Payment verification failed');
              setLoading(false);
            }
          },
          prefill: { name: passenger.name, email: passenger.email, contact: passenger.phone },
          theme: { color: '#1B3A5C' }
        };
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
          setLoading(false);
        };
        script.onerror = () => {
          setError('Failed to load Razorpay');
          setLoading(false);
        };
        document.body.appendChild(script);
        return;
      }

      const data = await completeBooking();
      await fetchAll();
      navigate('/bookings', { state: { booked: data.booking?.bookingId } });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      if (paymentMethod === 'wallet') setLoading(false);
    }
  };

  return (
    <div className="page-pad checkout-page">
      <div className="container checkout-grid">
        <form className="glass-card checkout-form" onSubmit={handleBook}>
          <h1>Complete booking</h1>
          {error && <p className="form-error" role="alert">{error}</p>}

          <fieldset className="payment-methods">
            <legend>Payment method</legend>
            <label className={`payment-option ${paymentMethod === 'wallet' ? 'selected' : ''}`}>
              <input type="radio" name="pay" value="wallet" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
              Wallet / Demo pay (instant)
            </label>
            {integrations?.stripe?.configured && (
              <label className={`payment-option ${paymentMethod === 'stripe' ? 'selected' : ''}`}>
                <input type="radio" name="pay" value="stripe" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} />
                Card — Stripe
              </label>
            )}
            {integrations?.razorpay?.configured && (
              <label className={`payment-option ${paymentMethod === 'razorpay' ? 'selected' : ''}`}>
                <input type="radio" name="pay" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                UPI / Card — Razorpay
              </label>
            )}
          </fieldset>

          <label>Full name<input required value={passenger.name} onChange={e => setPassenger({ ...passenger, name: e.target.value })} /></label>
          <label>Email<input required type="email" value={passenger.email} onChange={e => setPassenger({ ...passenger, email: e.target.value })} /></label>
          <label>Phone<input required value={passenger.phone} onChange={e => setPassenger({ ...passenger, phone: e.target.value })} /></label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing…' : paymentMethod === 'stripe' ? 'Pay with Stripe' : paymentMethod === 'razorpay' ? 'Pay with Razorpay' : 'Confirm & pay'}
          </button>
          <p className="text-muted" style={{ marginTop: 12, fontSize: 13 }}>
            <Link to="/integrations">Configure payment & map APIs</Link>
          </p>
        </form>
        <aside className="glass-card checkout-summary">
          <h2>Summary</h2>
          <p className="checkout-type">{type === 'flight' ? '✈ Flight' : '🏨 Hotel'}</p>
          <p className="checkout-title">{type === 'flight' ? `${item.airline?.name} ${item.flightNumber}` : item.name}</p>
          <div className="checkout-total">{format(total)}</div>
          <p className="text-muted">Includes taxes · INR base</p>
        </aside>
      </div>
    </div>
  );
}
