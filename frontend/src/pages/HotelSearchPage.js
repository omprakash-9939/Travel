import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Star, MapPin, Wifi } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { SkeletonList } from '../components/Skeleton';
import '../styles/hotels.css';

export default function HotelSearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackHotelView } = usePersonalization();
  const today = new Date().toISOString().split('T')[0];
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(searchParams.get('city') || 'Goa');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests') || 2));
  const [rooms, setRooms] = useState(Number(searchParams.get('rooms') || 1));
  const [minStars, setMinStars] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [extras, setExtras] = useState(null);
  const [extrasHotel, setExtrasHotel] = useState(null);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params = { city, guests: searchParams.get('guests') || 2, rooms: 1 };
      if (checkIn) params.checkIn = checkIn;
      if (checkOut) params.checkOut = checkOut;
      if (guests) params.guests = guests;
      if (rooms) params.rooms = rooms;
      if (minStars) params.minStars = minStars;
      const { data } = await api.get('/hotels/search', { params });
      setHotels(data.hotels || []);
      setDataSource(data.source || '');
      api.post('/ai/search-history', { type: 'hotel', query: params }).catch(() => {});
    } catch {
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHotels(); }, [searchParams]);

  useEffect(() => {
    if (checkOut && checkIn && checkOut < checkIn) {
      setCheckOut(checkIn);
    }
  }, [checkIn, checkOut]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = new URLSearchParams({ city, checkIn, checkOut, guests, rooms });
    navigate(`/hotels?${q}`);
    fetchHotels();
  };

  return (
    <div className="hotel-search-page page-pad">
      <div className="container">
        <form className="glass-card hotel-search-bar" onSubmit={handleSearch}>
          <input placeholder="City" value={city} onChange={e => setCity(e.target.value)} aria-label="City" />
          <input type="date" value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)} aria-label="Check-in" />
          <input type="date" value={checkOut} min={checkIn || today} onChange={e => setCheckOut(e.target.value)} aria-label="Check-out" />
          <select value={guests} onChange={e => setGuests(Number(e.target.value))} aria-label="Guests">
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
          </select>
          <select value={rooms} onChange={e => setRooms(Number(e.target.value))} aria-label="Rooms">
            {[1,2,3,4].map(n => <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>)}
          </select>
          <select value={minStars} onChange={e => setMinStars(e.target.value)} aria-label="Minimum stars">
            <option value="">Any stars</option>
            {[3, 4, 5].map(n => <option key={n} value={n}>{n}+ stars</option>)}
          </select>
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <h1 className="section-title">{hotels.length} hotels in {city}</h1>
        {dataSource && (
          <div className={`data-source-badge source-${dataSource}`}>
            {dataSource === 'amadeus' && '✓ Live hotels via Amadeus'}
            {dataSource === 'mongodb' && '✓ Database hotels'}
            {dataSource === 'demo' && 'ℹ Demo hotels — add Amadeus keys or seed DB'}
          </div>
        )}

        {loading ? <SkeletonList count={4} /> : hotels.length === 0 ? (
          <div className="glass-card empty-state">
            <p>No hotels found. Run <code>npm run seed</code> in backend or try another city.</p>
            <Link to="/">← Home</Link>
          </div>
        ) : (
          <div className="hotel-grid">
            {hotels.map(h => (
              <article key={h._id} className="glass-card hotel-card">
                <div className="hotel-card-img" style={{ backgroundImage: `url(${h.thumbnail || h.images?.[0]})` }} />
                <div className="hotel-card-body">
                  <h3>{h.name}</h3>
                  <p className="hotel-loc"><MapPin size={14} /> {h.location?.city}</p>
                  <div className="hotel-rating">
                    <Star size={14} fill="currentColor" /> {h.userRating}/10 · {h.starRating}★
                  </div>
                  <div className="hotel-amenities"><Wifi size={14} /> WiFi · Breakfast</div>
                  <div className="hotel-price-row">
                    <div>
                      <span className="hotel-price">₹{h.minPricePerNight?.toLocaleString()}</span>
                      <span className="text-muted"> / night</span>
                      {h.totalPrice > h.minPricePerNight && (
                        <div className="text-muted">Total ₹{h.totalPrice?.toLocaleString()}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-sm"
                      style={{ marginRight: 8 }}
                      onClick={async () => {
                        setExtrasHotel(h._id);
                        try {
                          const { data } = await api.get(`/hotels/${h._id}/extras`, {
                            params: { city: h.location?.city, name: h.name, lat: h.location?.coordinates?.lat, lng: h.location?.coordinates?.lng }
                          });
                          setExtras(data);
                        } catch { setExtras(null); }
                      }}
                    >
                      Map & nearby
                    </button>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => {
                        if (user) {
                          trackHotelView(h);
                        }
                        navigate('/checkout', {
                        state: {
                          type: 'hotel',
                          item: h,
                          meta: { checkIn, checkOut, roomType: h.roomTypes?.[0]?.name },
                          pricing: { total: h.totalPrice || h.minPricePerNight }
                        }
                      });
                      }}
                    >
                      Book
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {extras && extrasHotel && (
          <div className="glass-card hotel-extras">
            <h3>Map & nearby</h3>
            {extras.map?.staticMapUrl && (
              <img src={extras.map.staticMapUrl} alt="Map" className="hotel-map-img" />
            )}
            {!extras.placesConfigured && <p className="text-muted">Add GOOGLE_MAPS_API_KEY for attractions & reviews.</p>}
            {extras.attractions?.length > 0 && (
              <>
                <h4>Attractions</h4>
                <ul className="attraction-list">
                  {extras.attractions.slice(0, 5).map((a) => (
                    <li key={a.placeId}>{a.name} {a.rating ? `★ ${a.rating}` : ''}</li>
                  ))}
                </ul>
              </>
            )}
            <button type="button" className="btn-sm" onClick={() => { setExtras(null); setExtrasHotel(null); }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
