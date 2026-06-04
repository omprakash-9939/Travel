import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/bookings/my');
        setBookings(data.bookings || []);
      } catch { setBookings([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const tabs = ['all', 'flight', 'hotel', 'cancelled'];
  const filtered = activeTab === 'all' ? bookings : bookings.filter(b => activeTab === 'cancelled' ? b.status === 'cancelled' : b.type === activeTab);

  return (
    <div style={{ paddingTop: 60, minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800, color: '#1B3A5C', marginBottom: 24 }}>My Bookings</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeTab === t ? '#1B3A5C' : 'white', color: activeTab === t ? 'white' : '#6B7280',
              border: activeTab === t ? 'none' : '1px solid #E5E7EB', transition: 'all 0.2s'
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading bookings...</div>
          : filtered.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, padding: 60, textAlign: 'center', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✈</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1B3A5C', marginBottom: 8 }}>No bookings yet</h3>
              <p style={{ color: '#9CA3AF', marginBottom: 20 }}>Start your journey with DataArt Travel!</p>
              <a href="/flights" style={{ background: '#1B3A5C', color: 'white', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 15 }}>Search Flights</a>
            </div>
          ) : filtered.map(b => (
            <div key={b._id} style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 12, border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Booking #{b.bookingId}</div>
                <div style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>{b.type} · {new Date(b.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#1B3A5C' }}>₹{b.pricing?.total?.toLocaleString()}</div>
                <span style={{
                  padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: b.status === 'confirmed' ? '#d1fae5' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                  color: b.status === 'confirmed' ? '#065f46' : b.status === 'cancelled' ? '#991b1b' : '#92400e'
                }}>{b.status}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <div style={{ paddingTop: 60, minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800, color: '#1B3A5C', marginBottom: 24 }}>My Profile</h1>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #1B3A5C, #2a5298)', color: 'white', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, fontFamily: 'Syne' }}>{user?.name}</div>
              <div style={{ color: '#6B7280', fontSize: 14 }}>{user?.email}</div>
            </div>
          </div>
          {[['Full Name', 'name', 'text'], ['Phone', 'phone', 'tel']].map(([label, key, type]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#374151' }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 15, color: '#111827' }} />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#374151' }}>Email (read-only)</label>
            <input value={user?.email || ''} readOnly style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 15, color: '#9CA3AF', background: '#F9FAFB' }} />
          </div>
          <button onClick={handleSave} style={{ background: saved ? '#059669' : '#1B3A5C', color: 'white', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, transition: 'background 0.2s', cursor: 'pointer', border: 'none' }}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
          <div style={{ marginTop: 24, padding: 16, background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontWeight: 700, fontSize: 14 }}>DataArt Wallet</div><div style={{ fontSize: 13, color: '#6B7280' }}>Use wallet money for bookings</div></div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#1B3A5C' }}>₹{user?.wallet || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HotelSearchPage() {
  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏨</div>
        <h2 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: '#1B3A5C', marginBottom: 8 }}>Hotel Search</h2>
        <p style={{ color: '#6B7280', maxWidth: 400, margin: '0 auto 20px' }}>Connect your MongoDB and seed hotel data to see listings here. The API is fully built!</p>
        <a href="/" style={{ background: '#1B3A5C', color: 'white', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 15 }}>← Back to Home</a>
      </div>
    </div>
  );
}

export function OffersPage() {
  const offers = [
    { title: 'Anniversary Sale', code: 'DART18', discount: 'Up to ₹10,000 OFF', type: 'All', valid: '15 Jun 2026' },
    { title: 'No Convenience Fee', code: 'DARTNCF', discount: 'Zero convenience fee on flights', type: 'Flights', valid: '30 Jun 2026' },
    { title: 'New User Offer', code: 'DARTFIRST', discount: '₹500 on first booking', type: 'All', valid: '30 Jun 2026' },
    { title: 'Hotel Savings', code: 'DARTHOTEL', discount: 'Up to 40% off on hotels', type: 'Hotels', valid: '31 Jul 2026' },
    { title: 'International Fares', code: 'INTDART', discount: 'Special international prices', type: 'Flights', valid: '30 Jun 2026' },
    { title: 'Business Class', code: 'BIZFLY', discount: 'Business at economy+ prices', type: 'Flights', valid: '15 Jul 2026' },
  ];

  const [copied, setCopied] = useState(null);
  const copy = (code) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 2000); };

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: '#1B3A5C', marginBottom: 8 }}>Exclusive Offers</h1>
        <p style={{ color: '#6B7280', marginBottom: 32 }}>Best deals curated for DataArt Travel members</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {offers.map(o => (
            <div key={o.code} style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ alignSelf: 'flex-start', background: '#EBF4FF', color: '#1B3A5C', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>{o.type}</span>
              <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'Syne', color: '#111827' }}>{o.title}</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>{o.discount}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>Valid till: {o.valid}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px dashed #1B3A5C', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ flex: 1, fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: '#1B3A5C', letterSpacing: '0.1em' }}>{o.code}</span>
                <button onClick={() => copy(o.code)} style={{ background: '#1B3A5C', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {copied === o.code ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BookingsPage;
