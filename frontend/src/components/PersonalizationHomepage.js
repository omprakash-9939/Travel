import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Hotel, MapPin, Clock, TrendingUp, Heart, Bell, X, ChevronRight, Sparkles, Star } from 'lucide-react';
import { usePersonalization } from '../context/PersonalizationContext';
import { useAuth } from '../context/AuthContext';
import '../styles/personalization.css';

// ── Utility: format price ────────────────────────────────────────────────────
const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

// ── Intent Badge ─────────────────────────────────────────────────────────────
const IntentBadge = ({ score, tier }) => {
  const colors = { low: '#6B7280', medium: '#F59E0B', high: '#10B981' };
  const labels = { low: 'Exploring', medium: 'Planning', high: 'Ready to Book' };
  return (
    <div className="intent-badge" style={{ '--intent-color': colors[tier] }}>
      <div className="intent-fill" style={{ width: `${score}%` }} />
      <span>{labels[tier]} · {score}/100</span>
    </div>
  );
};

// ── Notification Banner ───────────────────────────────────────────────────────
const NotificationBanner = ({ notification, onDismiss }) => {
  const navigate = useNavigate();
  return (
    <div className="p13n-notification">
      <Bell size={16} className="p13n-notif-icon" />
      <div className="p13n-notif-body">
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
      </div>
      <button
        className="p13n-notif-cta"
        onClick={() => navigate(notification.ctaUrl || '/')}
      >
        {notification.ctaLabel}
      </button>
      <button className="p13n-notif-dismiss" onClick={() => onDismiss(notification.id)}>
        <X size={14} />
      </button>
    </div>
  );
};

// ── Continue Planning Card ────────────────────────────────────────────────────
const ContinuePlanningCard = ({ item }) => {
  const navigate = useNavigate();
  const { trackFlightSearch, trackHotelSearch } = usePersonalization();

  const handleClick = () => {
    const q = item.searchQuery || {};
    if (item.searchType === 'flight') {
      trackFlightSearch(q);
      const params = new URLSearchParams({ to: item.destination, from: q.from || '', date: q.date || '' });
      navigate(`/flights?${params}`);
    } else {
      trackHotelSearch(q);
      navigate(`/hotels?city=${encodeURIComponent(item.destination)}`);
    }
  };

  return (
    <div className="p13n-continue-card" onClick={handleClick}>
      <div className="p13n-continue-icon">
        {item.searchType === 'flight' ? <Plane size={20} /> : <Hotel size={20} />}
      </div>
      <div className="p13n-continue-info">
        <div className="p13n-continue-dest">{item.destination}</div>
        <div className="p13n-continue-meta">
          {item.searchType === 'flight' ? 'Flight search' : 'Hotel search'}
          {item.lastSearched && ` · ${formatDate(item.lastSearched)}`}
        </div>
      </div>
      <ChevronRight size={16} className="p13n-continue-arrow" />
    </div>
  );
};

// ── Recommended Flight Card ───────────────────────────────────────────────────
const RecommendedFlightCard = ({ flight }) => {
  const navigate = useNavigate();
  const { addToWishlist } = usePersonalization();
  const [wishlisted, setWishlisted] = useState(false);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    setWishlisted(true);
    await addToWishlist('flight', { _id: flight.flightId, destination: { city: flight.destination }, cabins: { economy: { price: flight.price } } });
  };

  const handleBook = () => {
    navigate(`/flights?to=${encodeURIComponent(flight.destination)}&from=${encodeURIComponent(flight.origin || '')}`);
  };

  return (
    <div className="p13n-flight-card" onClick={handleBook}>
      {flight.thumbnail && (
        <div className="p13n-card-img" style={{ backgroundImage: `url(${flight.thumbnail})` }}>
          <button className={`p13n-wishlist-btn ${wishlisted ? 'active' : ''}`} onClick={handleWishlist}>
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <div className="p13n-card-reason">{flight.reason}</div>
        </div>
      )}
      <div className="p13n-card-body">
        <div className="p13n-card-route">
          <span>{flight.origin}</span>
          <Plane size={12} className="p13n-route-arrow" />
          <span>{flight.destination}</span>
        </div>
        {flight.airline && <div className="p13n-card-airline">{flight.airline}</div>}
        <div className="p13n-card-footer">
          <div className="p13n-card-price">{fmt(flight.price)}</div>
          {flight.departure && <div className="p13n-card-date">{formatDate(flight.departure)}</div>}
        </div>
      </div>
    </div>
  );
};

// ── Recommended Hotel Card ────────────────────────────────────────────────────
const RecommendedHotelCard = ({ hotel }) => {
  const navigate = useNavigate();
  const { addToWishlist } = usePersonalization();
  const [wishlisted, setWishlisted] = useState(false);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    setWishlisted(true);
    await addToWishlist('hotel', { _id: hotel.hotelId, location: { city: hotel.city }, roomTypes: [{ price: hotel.price }] });
  };

  return (
    <div className="p13n-hotel-card" onClick={() => navigate(`/hotels?city=${encodeURIComponent(hotel.city)}`)}>
      {hotel.thumbnail && (
        <div className="p13n-card-img" style={{ backgroundImage: `url(${hotel.thumbnail})` }}>
          <button className={`p13n-wishlist-btn ${wishlisted ? 'active' : ''}`} onClick={handleWishlist}>
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <div className="p13n-card-reason">{hotel.reason}</div>
        </div>
      )}
      <div className="p13n-card-body">
        <div className="p13n-card-name">{hotel.hotelName}</div>
        <div className="p13n-card-city">
          <MapPin size={11} /> {hotel.city}
        </div>
        <div className="p13n-card-footer">
          <div className="p13n-card-price">{fmt(hotel.price)}<span>/night</span></div>
          <div className="p13n-card-stars">
            {'★'.repeat(hotel.starRating || 3)}
            {hotel.userRating > 0 && <span className="p13n-rating">{hotel.userRating}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Destination Card ──────────────────────────────────────────────────────────
const DestinationCard = ({ dest }) => {
  const navigate = useNavigate();
  const { trackDestination } = usePersonalization();

  const handleClick = () => {
    trackDestination(dest.name);
    navigate(`/hotels?city=${encodeURIComponent(dest.name)}`);
  };

  return (
    <div className="p13n-dest-card" onClick={handleClick}>
      <div className="p13n-dest-img" style={{ backgroundImage: `url(${dest.imageUrl})` }}>
        <div className="p13n-dest-overlay">
          <div className="p13n-dest-type">{dest.type}</div>
          <div className="p13n-dest-name">{dest.name}</div>
          <div className="p13n-dest-country">{dest.country}</div>
        </div>
      </div>
    </div>
  );
};

// ── Recently Viewed Section ───────────────────────────────────────────────────
const RecentlyViewedSection = ({ flights, hotels }) => {
  const navigate = useNavigate();
  if (!flights.length && !hotels.length) return null;
  return (
    <section className="p13n-section">
      <div className="p13n-section-header">
        <div className="p13n-section-title">
          <Clock size={18} />
          <h2>Recently Viewed</h2>
        </div>
      </div>
      <div className="p13n-rv-grid">
        {flights.slice(0, 3).map((f, i) => (
          <div key={i} className="p13n-rv-card" onClick={() => navigate(`/flights?to=${f.destination}`)}>
            <Plane size={16} className="p13n-rv-icon" />
            <div>
              <div className="p13n-rv-title">{f.origin} → {f.destination}</div>
              <div className="p13n-rv-sub">{f.airline || 'Flight'} · {fmt(f.price)}</div>
            </div>
          </div>
        ))}
        {hotels.slice(0, 3).map((h, i) => (
          <div key={i} className="p13n-rv-card" onClick={() => navigate(`/hotels?city=${h.city}`)}>
            <Hotel size={16} className="p13n-rv-icon" />
            <div>
              <div className="p13n-rv-title">{h.hotelName}</div>
              <div className="p13n-rv-sub">{h.city} · {fmt(h.price)}/night</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── Main Personalized Homepage Component ──────────────────────────────────────
const PersonalizedHomepage = () => {
  const { user } = useAuth();
  const {
    recommendations, preferences, intentScore,
    recentlyViewed, notifications, loading,
    dismissNotification
  } = usePersonalization();

  if (!user || loading) return null;

  const recs     = recommendations || {};
  const flights  = recs.recommendedFlights      || [];
  const hotels   = recs.recommendedHotels       || [];
  const dests    = recs.recommendedDestinations || [];
  const planning = recs.continuePlanning        || [];
  const notifs   = notifications.slice(0, 2);

  const hasAny = flights.length || hotels.length || dests.length || planning.length;
  if (!hasAny) return null;

  const favDest = preferences?.favoriteDestinations?.[0]?.destination;
  const engagementTier = intentScore.engagementTier || 'low';

  const flightSectionHeading = {
    low:    'Recommended For You',
    medium: 'Flights Worth Exploring',
    high:   'Top Picks for Your Next Trip',
  }[engagementTier] ?? 'Recommended For You';

  const destSectionHeading = {
    low:    'Popular Among Similar Travelers',
    medium: 'Destinations You Might Like',
    high:   'Destinations Matching Your Travel Style',
  }[engagementTier] ?? 'Popular Among Similar Travelers';

  return (
    <div className="p13n-wrapper">

      {/* ── Personalized notifications ── */}
      {notifs.map(n => (
        <NotificationBanner key={n.id} notification={n} onDismiss={dismissNotification} />
      ))}

      {/* ── Intent score strip ── */}
      {intentScore.score > 10 && (
        <div className="p13n-intent-strip">
          <div className="p13n-intent-label">
            <TrendingUp size={14} />
            <span>Your booking intent</span>
          </div>
          <IntentBadge score={intentScore.score} tier={intentScore.tier} />
        </div>
      )}

      {/* ── Continue Planning ── */}
      {planning.length > 0 && (
        <section className="p13n-section">
          <div className="p13n-section-header">
            <div className="p13n-section-title">
              <Clock size={18} />
              <h2>Continue Planning{favDest ? ` Your ${favDest} Trip` : ''}</h2>
            </div>
          </div>
          <div className="p13n-continue-list">
            {planning.map((item, i) => <ContinuePlanningCard key={i} item={item} />)}
          </div>
        </section>
      )}

      {/* ── Recommended Flights ── */}
      {flights.length > 0 && (
        <section className="p13n-section">
          <div className="p13n-section-header">
            <div className="p13n-section-title">
              <Sparkles size={18} />
              <h2>{flightSectionHeading}</h2>
            </div>
            <span className="p13n-badge">Personalized</span>
          </div>
          <div className="p13n-cards-grid">
            {flights.slice(0, 4).map((f, i) => <RecommendedFlightCard key={i} flight={f} />)}
          </div>
        </section>
      )}

      {/* ── Recommended Hotels ── */}
      {hotels.length > 0 && (
        <section className="p13n-section">
          <div className="p13n-section-header">
            <div className="p13n-section-title">
              <Hotel size={18} />
              <h2>
                {preferences?.preferredHotelCategories?.[0]?.category
                  ? `Because You Like ${preferences.preferredHotelCategories[0].category} Hotels`
                  : 'Hotels Matched to You'}
              </h2>
            </div>
          </div>
          <div className="p13n-cards-grid">
            {hotels.slice(0, 4).map((h, i) => <RecommendedHotelCard key={i} hotel={h} />)}
          </div>
        </section>
      )}

      {/* ── Destination Cards ── */}
      {dests.length > 0 && (
        <section className="p13n-section">
          <div className="p13n-section-header">
            <div className="p13n-section-title">
              <MapPin size={18} />
              <h2>{destSectionHeading}</h2>
            </div>
          </div>
          <div className="p13n-dest-grid">
            {dests.map((d, i) => <DestinationCard key={i} dest={d} />)}
          </div>
        </section>
      )}

      {/* ── Recently Viewed ── */}
      <RecentlyViewedSection
        flights={recentlyViewed.flights}
        hotels={recentlyViewed.hotels}
      />

    </div>
  );
};

export default PersonalizedHomepage;
