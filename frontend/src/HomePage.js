import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plane, Hotel, Train, Bus, Car, Map, Star, ChevronDown, ChevronLeft, ChevronRight,
  Search, Calendar, Users, ArrowLeftRight, Copy, Check, Shield, Clock, TrendingUp,
  Percent, Globe, Heart, Award, Headphones, Tag, MapPin, X
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { usePersonalization } from '../context/PersonalizationContext'; // ← NEW
import PersonalizedHomepage from '../components/PersonalizedHomepage';  // ← NEW
import '../styles/home.css';

// ─── Airport Data ───────────────────────────────────────────────────────────
const AIRPORTS = [
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi International Airport', country: 'India' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji International Airport', country: 'India' },
  { code: 'BLR', city: 'Bangalore', name: 'Kempegowda International Airport', country: 'India' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International Airport', country: 'India' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose International', country: 'India' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', country: 'India' },
  { code: 'COK', city: 'Kochi', name: 'Cochin International Airport', country: 'India' },
  { code: 'PNQ', city: 'Pune', name: 'Pune Airport', country: 'India' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel International', country: 'India' },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur International Airport', country: 'India' },
  { code: 'GOI', city: 'Goa', name: 'Goa International Airport (Dabolim)', country: 'India' },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh Airport', country: 'India' },
  { code: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'UAE' },
  { code: 'SIN', city: 'Singapore', name: 'Changi Airport', country: 'Singapore' },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand' },
  { code: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'UK' },
];

const OFFERS = [
  { id: 1, title: 'Anniversary Sale', subtitle: 'Up to ₹10,000 OFF on Travel', code: 'DART18', validTill: '15 Jun 2026', type: 'flight', tag: 'Exclusive', color: '#2F4858' },
  { id: 2, title: 'No Convenience Fee', subtitle: 'Book Flights for Free*', code: 'DARTNCF', validTill: '30 Jun 2026', type: 'flight', tag: 'Hot Deal', color: '#1a6b4a' },
  { id: 3, title: 'New User Offer', subtitle: 'Save ₹500 on First Booking', code: 'DARTFIRST', validTill: '30 Jun 2026', type: 'general', tag: 'New User', color: '#4a3060' },
  { id: 4, title: 'Hotel Deals', subtitle: 'Up to 40% Off on Hotels', code: 'DARTHOTEL', validTill: '31 Jul 2026', type: 'hotel', tag: 'Trending', color: '#8B2500' },
  { id: 5, title: 'International Flights', subtitle: 'Special Fares to 50+ Countries', code: 'INTDART', validTill: '30 Jun 2026', type: 'flight', tag: 'International', color: '#0d4a6b' },
  { id: 6, title: 'Business Class Sale', subtitle: 'Fly Business at Economy+ Prices', code: 'BIZFLY', validTill: '15 Jul 2026', type: 'flight', tag: 'Premium', color: '#3d1a4a' },
];

const TOP_ROUTES = [
  { from: 'Chennai', to: 'Mumbai', fromCode: 'MAA', toCode: 'BOM', price: '₹3,299', img: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=300&q=80' },
  { from: 'Delhi', to: 'Ahmedabad', fromCode: 'DEL', toCode: 'AMD', price: '₹2,899', img: 'https://images.unsplash.com/photo-1590123715128-5c69c3e81786?w=300&q=80' },
  { from: 'Delhi', to: 'Lucknow', fromCode: 'DEL', toCode: 'LKO', price: '₹1,899', img: 'https://images.unsplash.com/photo-1630608033380-58a70a8b7a12?w=300&q=80' },
  { from: 'Mumbai', to: 'Chennai', fromCode: 'BOM', toCode: 'MAA', price: '₹3,199', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=300&q=80' },
  { from: 'Mumbai', to: 'Dubai', fromCode: 'BOM', toCode: 'DXB', price: '₹14,500', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&q=80' },
  { from: 'Mumbai', to: 'Kolkata', fromCode: 'BOM', toCode: 'CCU', price: '₹4,200', img: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=300&q=80' },
  { from: 'Hyderabad', to: 'Bangalore', fromCode: 'HYD', toCode: 'BLR', price: '₹1,699', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=300&q=80' },
  { from: 'Mumbai', to: 'Jaipur', fromCode: 'BOM', toCode: 'JAI', price: '₹3,599', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=300&q=80' },
  { from: 'Delhi', to: 'Dubai', fromCode: 'DEL', toCode: 'DXB', price: '₹12,800', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&q=80' },
];

const DESTINATIONS = [
  { name: 'Andaman', img: 'https://images.unsplash.com/photo-1589394815349-5d60acbc4b3d?w=200&q=80', type: 'Beach' },
  { name: 'Kerala', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=200&q=80', type: 'Nature' },
  { name: 'Kashmir', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80', type: 'Mountains' },
  { name: 'Rajasthan', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=200&q=80', type: 'Heritage' },
  { name: 'Bhutan', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80', type: 'Spiritual' },
  { name: 'Europe', img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=200&q=80', type: 'International' },
  { name: 'Bali', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&q=80', type: 'Tropical' },
  { name: 'Dubai', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=200&q=80', type: 'Luxury' },
  { name: 'Vietnam', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=200&q=80', type: 'Culture' },
  { name: 'Sri Lanka', img: 'https://images.unsplash.com/photo-1586861203927-800a5acdce4d?w=200&q=80', type: 'Island' },
];

const WHY_US = [
  { icon: <TrendingUp size={28} />, title: 'Best Prices', desc: 'Guaranteed lowest fares on flights, hotels & more.' },
  { icon: <Shield size={28} />, title: 'Secure Booking', desc: 'Bank-grade security. 100% safe transactions.' },
  { icon: <Clock size={28} />, title: 'Instant Refund', desc: 'Quick refunds directly to your account.' },
  { icon: <Headphones size={28} />, title: '24/7 Support', desc: 'Expert travel support around the clock.' },
  { icon: <Award size={28} />, title: 'Exclusive Deals', desc: 'Members-only offers and special discounts.' },
];

// ─── AirportSuggest ───────────────────────────────────────────────────────────
const AirportSuggest = ({ value, onChange, onSelect, placeholder, id }) => {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const v = e.target.value;
    onChange(v);
    if (v.length > 0) {
      setFiltered(AIRPORTS.filter(a =>
        a.city.toLowerCase().includes(v.toLowerCase()) ||
        a.code.toLowerCase().includes(v.toLowerCase()) ||
        a.name.toLowerCase().includes(v.toLowerCase())
      ).slice(0, 6));
      setOpen(true);
    } else {
      setFiltered(AIRPORTS.slice(0, 6));
      setOpen(true);
    }
  };

  const handleFocus = () => {
    setFiltered(value ? AIRPORTS.filter(a =>
      a.city.toLowerCase().includes(value.toLowerCase()) ||
      a.code.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 6) : AIRPORTS.slice(0, 6));
    setOpen(true);
  };

  return (
    <div className="airport-suggest" ref={ref}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleInput}
        onFocus={handleFocus}
        placeholder={placeholder}
        autoComplete="off"
        className="airport-input"
      />
      {open && filtered.length > 0 && (
        <div className="airport-dropdown">
          <div className="suggest-header">Popular Airports</div>
          {filtered.map(a => (
            <div key={a.code} className="suggest-item" onMouseDown={() => { onSelect(a); setOpen(false); }}>
              <div className="suggest-left">
                <span className="suggest-code">{a.code}</span>
                <div>
                  <div className="suggest-city">{a.city}</div>
                  <div className="suggest-name">{a.name}</div>
                </div>
              </div>
              <span className="suggest-country">{a.country}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TravellerPanel ───────────────────────────────────────────────────────────
const TravellerPanel = ({ adults, children, infants, cabin, onChange, onClose }) => {
  const cabins = ['Economy', 'Premium Economy', 'Business', 'First Class'];
  return (
    <div className="traveller-panel">
      <div className="traveller-panel-header">
        <span>Travellers & Cabin</span>
        <button onClick={onClose}><X size={16} /></button>
      </div>
      {[['adults', adults, 'Adults', '12+ years'], ['children', children, 'Children', '2-11 years'], ['infants', infants, 'Infants', 'Under 2 years']].map(([key, val, label, sub]) => (
        <div key={key} className="traveller-row">
          <div>
            <div className="traveller-type">{label}</div>
            <div className="traveller-sub">{sub}</div>
          </div>
          <div className="traveller-counter">
            <button onClick={() => onChange(key, Math.max(key === 'adults' ? 1 : 0, val - 1))}>−</button>
            <span>{val}</span>
            <button onClick={() => onChange(key, Math.min(9, val + 1))}>+</button>
          </div>
        </div>
      ))}
      <div className="cabin-select">
        <div className="traveller-type">Cabin Class</div>
        <div className="cabin-options">
          {cabins.map(c => (
            <button key={c} className={`cabin-opt ${cabin === c ? 'cabin-active' : ''}`} onClick={() => onChange('cabin', c)}>{c}</button>
          ))}
        </div>
      </div>
      <button className="traveller-done" onClick={onClose}>Done</button>
    </div>
  );
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Personalization hook — used to track search actions ──────────────────
  const { trackFlightSearch, trackHotelSearch, trackDestination } = usePersonalization();

  // Flight Search State
  const [tripType, setTripType] = useState('oneway');
  const [activeTab, setActiveTab] = useState('flights');
  const [fromAirport, setFromAirport] = useState({ code: 'DEL', city: 'Delhi' });
  const [toAirport, setToAirport] = useState({ code: 'BOM', city: 'Mumbai' });
  const [fromInput, setFromInput] = useState('Delhi (DEL)');
  const [toInput, setToInput] = useState('Mumbai (BOM)');
  const [depDate, setDepDate] = useState('');
  const [retDate, setRetDate] = useState('');
  const [travellers, setTravellers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabin, setCabin] = useState('Economy');
  const [showTravellers, setShowTravellers] = useState(false);
  const [specialFare, setSpecialFare] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [offerTab, setOfferTab] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);
  const [offerPage, setOfferPage] = useState(0);
  const offerRef = useRef();
  const OFFERS_PER_PAGE = 4;

  // Hotel search
  const [hotelCity, setHotelCity] = useState('');
  const [hotelCheckIn, setHotelCheckIn] = useState('');
  const [hotelCheckOut, setHotelCheckOut] = useState('');
  const [hotelGuests, setHotelGuests] = useState(1);
  const [hotelRooms, setHotelRooms] = useState(1);

  const handleTravellerChange = (key, val) => {
    if (key === 'cabin') setCabin(val);
    else setTravellers(prev => ({ ...prev, [key]: val }));
  };

  const totalTravellers = travellers.adults + travellers.children + travellers.infants;

  const swapAirports = () => {
    setSwapping(true);
    setTimeout(() => {
      const tmp = fromAirport;
      const tmpInput = fromInput;
      setFromAirport(toAirport);
      setToAirport(tmp);
      setFromInput(toInput);
      setToInput(tmpInput);
      setSwapping(false);
    }, 150);
  };

  const handleFlightSearch = () => {
    // ── Track search event ────────────────────────────────────────────────
    if (user) {
      trackFlightSearch({
        from: fromAirport.code, to: toAirport.code,
        fromCity: fromAirport.city, toCity: toAirport.city,
        date: depDate, cabin, tripType
      });
    }
    const params = new URLSearchParams({
      from: fromAirport.code, to: toAirport.code,
      fromCity: fromAirport.city, toCity: toAirport.city,
      date: depDate, returnDate: retDate,
      adults: travellers.adults, children: travellers.children,
      infants: travellers.infants, cabin, tripType
    });
    navigate(`/flights?${params}`);
  };

  const handleHotelSearch = () => {
    // ── Track search event ────────────────────────────────────────────────
    if (user) {
      trackHotelSearch({ city: hotelCity, checkIn: hotelCheckIn, checkOut: hotelCheckOut, guests: hotelGuests, rooms: hotelRooms });
    }
    const params = new URLSearchParams({ city: hotelCity, checkIn: hotelCheckIn, checkOut: hotelCheckOut, guests: hotelGuests, rooms: hotelRooms });
    navigate(`/hotels?${params}`);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const filteredOffers = offerTab === 'all' ? OFFERS : OFFERS.filter(o => o.type === offerTab);
  const visibleOffers = filteredOffers.slice(offerPage * OFFERS_PER_PAGE, (offerPage + 1) * OFFERS_PER_PAGE);
  const totalPages = Math.ceil(filteredOffers.length / OFFERS_PER_PAGE);

  const NAV_TABS = [
    { key: 'flights', label: 'Flights', icon: <Plane size={18} /> },
    { key: 'hotels', label: 'Hotels', icon: <Hotel size={18} /> },
    { key: 'trains', label: 'Trains', icon: <Train size={18} /> },
    { key: 'buses', label: 'Buses', icon: <Bus size={18} /> },
    { key: 'holidays', label: 'Holidays', icon: <Globe size={18} /> },
    { key: 'cabs', label: 'Cabs', icon: <Car size={18} /> },
  ];

  return (
    <div className="home-page">

      {/* ── Hero / Search Engine ──────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-overlay" />
        <div className="hero-content">
          <div className="hero-tagline">
            <span className="tagline-chip">18th Anniversary Sale</span>
            <h1>Search Lowest Fares</h1>
            <p>Flights, Hotels, Trains, Buses, Holidays & more — all in one place</p>
            <Link to="/ai" className="ai-chip-link">
              <span className="tagline-chip" style={{ background: 'rgba(232,69,69,0.15)', borderColor: 'rgba(232,69,69,0.4)', color: '#E84545' }}>
                ✨ Try AI Travel Planner
              </span>
            </Link>
          </div>

          <div className="search-engine">
            {/* Tab Navigation */}
            <div className="se-tabs">
              {NAV_TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`se-tab ${activeTab === tab.key ? 'se-tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.icon}<span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="se-body">
              {/* ── FLIGHTS ── */}
              {activeTab === 'flights' && (
                <div>
                  <div className="trip-type-row">
                    {['oneway', 'roundtrip', 'multicity'].map(t => (
                      <label key={t} className={`trip-radio ${tripType === t ? 'trip-radio-active' : ''}`}>
                        <input type="radio" name="tripType" value={t} checked={tripType === t} onChange={() => setTripType(t)} />
                        {t === 'oneway' ? 'One Way' : t === 'roundtrip' ? 'Round Trip' : 'Multi City'}
                      </label>
                    ))}
                    <div style={{ flex: 1 }} />
                    {['Student', 'Senior Citizen', 'Armed Forces', 'Doctors/Nurses'].map(f => (
                      <label key={f} className={`trip-radio ${specialFare === f ? 'trip-radio-active' : ''}`} style={{ fontSize: 12 }}>
                        <input type="radio" name="fare" value={f} checked={specialFare === f} onChange={() => setSpecialFare(prev => prev === f ? '' : f)} />
                        {f}
                      </label>
                    ))}
                  </div>

                  <div className="flight-search-row">
                    {/* From */}
                    <div className="se-field">
                      <label htmlFor="from-input">From</label>
                      <AirportSuggest
                        id="from-input"
                        value={fromInput}
                        onChange={setFromInput}
                        onSelect={(a) => { setFromAirport(a); setFromInput(`${a.city} (${a.code})`); }}
                        placeholder="City or Airport"
                      />
                    </div>

                    {/* Swap */}
                    <button className={`swap-btn ${swapping ? 'swapping' : ''}`} onClick={swapAirports} title="Swap airports">
                      <ArrowLeftRight size={18} />
                    </button>

                    {/* To */}
                    <div className="se-field">
                      <label htmlFor="to-input">To</label>
                      <AirportSuggest
                        id="to-input"
                        value={toInput}
                        onChange={setToInput}
                        onSelect={(a) => { setToAirport(a); setToInput(`${a.city} (${a.code})`); }}
                        placeholder="City or Airport"
                      />
                    </div>

                    {/* Departure */}
                    <div className="se-field">
                      <label htmlFor="dep-date">Departure</label>
                      <div className="date-input-wrap">
                        <Calendar size={16} className="date-icon" />
                        <input
                          id="dep-date"
                          type="date"
                          value={depDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setDepDate(e.target.value)}
                          className="date-input"
                        />
                      </div>
                    </div>

                    {/* Return */}
                    {tripType === 'roundtrip' && (
                      <div className="se-field">
                        <label htmlFor="ret-date">Return</label>
                        <div className="date-input-wrap">
                          <Calendar size={16} className="date-icon" />
                          <input
                            id="ret-date"
                            type="date"
                            value={retDate}
                            min={depDate || new Date().toISOString().split('T')[0]}
                            onChange={e => setRetDate(e.target.value)}
                            className="date-input"
                          />
                        </div>
                      </div>
                    )}

                    {/* Travellers */}
                    <div className="se-field" style={{ position: 'relative' }}>
                      <label>Travellers & Cabin</label>
                      <button className="travellers-btn" onClick={() => setShowTravellers(!showTravellers)}>
                        <Users size={16} />
                        <span>{totalTravellers} Traveller{totalTravellers !== 1 ? 's' : ''}, {cabin}</span>
                        <ChevronDown size={14} />
                      </button>
                      {showTravellers && (
                        <TravellerPanel
                          adults={travellers.adults}
                          children={travellers.children}
                          infants={travellers.infants}
                          cabin={cabin}
                          onChange={handleTravellerChange}
                          onClose={() => setShowTravellers(false)}
                        />
                      )}
                    </div>

                    {/* Search Button */}
                    <button className="search-btn" onClick={handleFlightSearch}>
                      <Search size={18} />
                      <span>Search</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── HOTELS ── */}
              {activeTab === 'hotels' && (
                <div className="hotel-search-row">
                  <div className="se-field se-field-wide">
                    <label>City</label>
                    <input
                      type="text"
                      placeholder="Where do you want to stay?"
                      value={hotelCity}
                      onChange={e => setHotelCity(e.target.value)}
                      className="airport-input"
                    />
                  </div>
                  <div className="se-field">
                    <label>Check-In</label>
                    <div className="date-input-wrap">
                      <Calendar size={16} className="date-icon" />
                      <input type="date" value={hotelCheckIn} min={new Date().toISOString().split('T')[0]} onChange={e => setHotelCheckIn(e.target.value)} className="date-input" />
                    </div>
                  </div>
                  <div className="se-field">
                    <label>Check-Out</label>
                    <div className="date-input-wrap">
                      <Calendar size={16} className="date-icon" />
                      <input type="date" value={hotelCheckOut} min={hotelCheckIn || new Date().toISOString().split('T')[0]} onChange={e => setHotelCheckOut(e.target.value)} className="date-input" />
                    </div>
                  </div>
                  <div className="se-field">
                    <label>Guests</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={hotelGuests} onChange={e => setHotelGuests(Number(e.target.value))} className="airport-input" style={{ width: '50%' }}>
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
                      </select>
                      <select value={hotelRooms} onChange={e => setHotelRooms(Number(e.target.value))} className="airport-input" style={{ width: '50%' }}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                  </div>
                  <button className="search-btn" onClick={handleHotelSearch}>
                    <Search size={18} /><span>Search Hotels</span>
                  </button>
                </div>
              )}

              {/* ── Other tabs placeholder ── */}
              {!['flights', 'hotels'].includes(activeTab) && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Globe size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>{NAV_TABS.find(t => t.key === activeTab)?.label} booking coming soon!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Links Bar ──────────────────────────────── */}
      <section className="quick-links-bar">
        <div className="container">
          {[
            { label: 'Best Flight Deals', href: '/flights', icon: <Tag size={16} /> },
            { label: 'Gift Cards', href: '/offers', icon: <Heart size={16} /> },
            { label: 'Forex Cards', href: '#', icon: <Globe size={16} /> },
            { label: 'Airport Experience', href: '#', icon: <MapPin size={16} /> },
            { label: 'Monuments', href: '#', icon: <Map size={16} /> },
            { label: 'Metro Tickets', href: '#', icon: <Train size={16} /> },
          ].map(link => (
            <a key={link.label} href={link.href} className="ql-chip">
              {link.icon}<span>{link.label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          PERSONALIZED SECTIONS — shown to logged-in users above generic content.
          Falls back gracefully to empty for anonymous visitors.
          ════════════════════════════════════════════════════════════════════ */}
      {user && (
        <section className="personalization-zone">
          <div className="container">
            <PersonalizedHomepage />
          </div>
        </section>
      )}

      {/* ── Exclusive Offers ─────────────────────────────── */}
      <section className="offers-section">
        <div className="container">
          <div className="section-header">
            <h2>Exclusive Offers</h2>
            <a href="/offers" className="view-all-link">View All Offers →</a>
          </div>

          <div className="offer-tabs">
            {['all', 'flight', 'hotel', 'holiday', 'general'].map(tab => (
              <button key={tab} className={`offer-tab ${offerTab === tab ? 'offer-tab-active' : ''}`}
                onClick={() => { setOfferTab(tab); setOfferPage(0); }}>
                {tab === 'all' ? 'Best Offers' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="offers-carousel-wrap">
            <button className="carousel-nav carousel-prev" onClick={() => setOfferPage(Math.max(0, offerPage - 1))} disabled={offerPage === 0}>
              <ChevronLeft size={20} />
            </button>
            <div className="offers-grid">
              {visibleOffers.map(offer => (
                <div key={offer.id} className="offer-card" style={{ '--offer-color': offer.color }}>
                  <div className="offer-card-top">
                    {offer.tag && <span className="offer-tag">{offer.tag}</span>}
                    <div className="offer-title">{offer.title}</div>
                    <div className="offer-subtitle">{offer.subtitle}</div>
                  </div>
                  <div className="offer-card-bottom">
                    <div className="offer-validity">Valid till: {offer.validTill}</div>
                    {offer.code && (
                      <div className="offer-code-row">
                        <span className="offer-code">{offer.code}</span>
                        <button className="copy-btn" onClick={() => copyCode(offer.code)} title="Copy code">
                          {copiedCode === offer.code ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="carousel-nav carousel-next" onClick={() => setOfferPage(Math.min(totalPages - 1, offerPage + 1))} disabled={offerPage >= totalPages - 1}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Top Flight Routes ─────────────────────────────── */}
      <section className="routes-section">
        <div className="container">
          <div className="section-header">
            <h2>Top Flight Routes</h2>
          </div>
          <div className="routes-grid">
            {TOP_ROUTES.map((route, i) => (
              <a key={i} className="route-card" href={`/flights?from=${route.fromCode}&to=${route.toCode}`}>
                <div className="route-img" style={{ backgroundImage: `url(${route.img})` }}>
                  <div className="route-overlay" />
                </div>
                <div className="route-info">
                  <div className="route-cities">
                    <span>{route.from}</span>
                    <span className="route-arrow"><Plane size={12} /></span>
                    <span>{route.to}</span>
                  </div>
                  <div className="route-codes">{route.fromCode}–{route.toCode}</div>
                </div>
                {route.price && <div className="route-price">from {route.price}</div>}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Destinations ──────────────────────────── */}
      <section className="destinations-section">
        <div className="container">
          <div className="section-header">
            <h2>Trending Tourist Destinations</h2>
          </div>
          <div className="destinations-grid">
            {DESTINATIONS.map((dest, i) => (
              <a
                key={i}
                className="dest-card"
                href={`/hotels?city=${encodeURIComponent(dest.name)}`}
                onClick={() => user && trackDestination(dest.name)}
              >
                <div className="dest-img" style={{ backgroundImage: `url(${dest.img})` }}>
                  <div className="dest-overlay" />
                  <span className="dest-type">{dest.type}</span>
                </div>
                <div className="dest-name">{dest.name}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why DataArt Travel ───────────────────────────── */}
      <section className="why-us-section">
        <div className="container">
          <div className="section-header"><h2>Why Book With Us?</h2></div>
          <div className="why-grid">
            {WHY_US.map((item, i) => (
              <div key={i} className="why-card">
                <div className="why-icon">{item.icon}</div>
                <div className="why-title">{item.title}</div>
                <div className="why-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Section ────────────────────────────────── */}
      <section className="about-section">
        <div className="container">
          <h2>Search Flights, Hotels, Buses & Holiday Packages</h2>
          <p>DataArt Travel is one of India's fastest-growing online travel platforms. We offer end-to-end travel solutions — from flights and hotels to buses, trains, and holiday packages — with no hidden charges and the best prices guaranteed.</p>
          <p>Our mission is to make every journey seamless. With our intuitive search engine, exclusive deals, and 24/7 customer support, planning your next trip has never been easier.</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo">DataArt<span>Travel</span></div>
              <p className="footer-desc">Your trusted travel companion for flights, hotels, and holiday packages across India and the world.</p>
              <div className="footer-app-links">
                <button className="app-store-btn">📱 App Store</button>
                <button className="app-store-btn">🤖 Play Store</button>
              </div>
            </div>
            <div className="footer-col">
              <h4>Our Services</h4>
              <ul>
                {['Flights', 'Hotels', 'Trains', 'Buses', 'Holidays', 'Cabs', 'Visa', 'Activities'].map(s => (
                  <li key={s}><a href="#">{s}</a></li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                {['About Us', 'Contact Us', 'Careers', 'Blog', 'Press', 'Affiliate Program', 'Privacy Policy', 'Terms & Conditions'].map(s => (
                  <li key={s}><a href="#">{s}</a></li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Popular Destinations</h4>
              <ul>
                {['Delhi', 'Mumbai', 'Bangalore', 'Goa', 'Jaipur', 'Dubai', 'Singapore', 'Bangkok'].map(d => (
                  <li key={d}><a href="#">{d}</a></li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>Connect With Us</h4>
              <ul>
                {['Facebook', 'Twitter / X', 'Instagram', 'YouTube', 'LinkedIn'].map(s => (
                  <li key={s}><a href="#">{s}</a></li>
                ))}
              </ul>
              <div className="footer-contact">
                <div>📞 011-4313-1313</div>
                <div>✉️ care@dataarttravel.com</div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} DataArt Travel. All rights reserved.</span>
            <span>Made with ❤️ in India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
