import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plane, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { formatTime, formatDuration, cabinToApi } from '../utils/format';
import { SkeletonList } from '../components/Skeleton';
import '../styles/flights.css';

export default function FlightSearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [apiFilters, setApiFilters] = useState({ airlines: [], priceRange: {} });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price');
  const [filters, setFilters] = useState({ stops: 'all', maxPrice: '', airlines: [] });
  const [pricePrediction, setPricePrediction] = useState(null);
  const [dataSource, setDataSource] = useState('');
  const [searchMessage, setSearchMessage] = useState('');

  const fromCode = searchParams.get('from') || '';
  const toCode = searchParams.get('to') || '';
  const from = searchParams.get('fromCity') || fromCode || 'Delhi';
  const to = searchParams.get('toCity') || toCode || 'Mumbai';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const adults = Number(searchParams.get('adults') || 1);
  const cabin = searchParams.get('cabin') || 'Economy';
  const tripType = searchParams.get('tripType') || 'oneway';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/flights/search', {
          params: {
            from: fromCode || from,
            to: toCode || to,
            date,
            adults, cabin: cabinToApi(cabin),
            tripType,
            returnDate: searchParams.get('returnDate'),
            maxPrice: filters.maxPrice || undefined,
            stops: filters.stops !== 'all' ? filters.stops : undefined,
            airlines: filters.airlines.length ? filters.airlines.join(',') : undefined
          }
        });
        setFlights(data.flights || []);
        setApiFilters(data.filters || {});
        setDataSource(data.source || '');
        setSearchMessage(data.message || '');
        api.post('/ai/search-history', { type: 'flight', query: { from, to, date } }).catch(() => {});
        const pred = await api.get('/ai/price/predict', { params: { type: 'flight', from, to, date } });
        setPricePrediction(pred.data.prediction);
      } catch {
        setFlights([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams, filters.maxPrice, filters.stops, filters.airlines.join(',')]);

  const cabinKey = cabinToApi(cabin) === 'premiumeconomy' ? 'premiumEconomy' : cabinToApi(cabin);

  const sorted = [...flights].sort((a, b) => {
    const pa = a.cabins?.[cabinKey]?.price ?? a.cabins?.economy?.price ?? 0;
    const pb = b.cabins?.[cabinKey]?.price ?? b.cabins?.economy?.price ?? 0;
    if (sortBy === 'price') return pa - pb;
    if (sortBy === 'duration') return (a.duration || 0) - (b.duration || 0);
    if (sortBy === 'departure') return new Date(a.departure) - new Date(b.departure);
    return 0;
  });

  const filtered = sorted.filter(f => {
    const price = f.cabins?.[cabinKey]?.price ?? f.cabins?.economy?.price;
    if (filters.stops !== 'all' && f.stops !== Number(filters.stops)) return false;
    if (filters.maxPrice && price > Number(filters.maxPrice)) return false;
    if (filters.airlines.length > 0 && !filters.airlines.includes(f.airline?.code)) return false;
    return true;
  });

  const airlineOptions = apiFilters.airlines?.length
    ? apiFilters.airlines
    : [...new Map(flights.map(f => [f.airline?.code, f.airline])).values()].filter(Boolean);

  const bookFlight = (flight) => {
    const price = (flight.cabins?.[cabinKey]?.price ?? flight.cabins?.economy?.price) * adults;
    navigate('/checkout', {
      state: {
        type: 'flight',
        item: { ...flight, source: flight.source || dataSource || 'demo' },
        meta: { cabin: cabinKey, adults },
        pricing: { total: flight.totalPrice || price }
      }
    });
  };

  return (
    <div className="flight-search-page">
      <div className="fsp-header">
        <div className="container">
          <div className="fsp-route">
            <span className="fsp-city">{from}</span>
            <span className="fsp-icon"><Plane size={20} /></span>
            <span className="fsp-city">{to}</span>
            <span className="fsp-meta">{date} · {adults} Adult · {cabin}</span>
          </div>
          {dataSource && (
            <div className={`data-source-badge source-${dataSource}`} role="status">
              {dataSource === 'amadeus' && '✓ Live fares via Amadeus'}
              {dataSource === 'mongodb' && '✓ Database fares'}
              {dataSource === 'demo' && 'ℹ Estimated demo fares — add Amadeus keys or run npm run seed'}
            </div>
          )}
          {searchMessage && <p className="search-hint">{searchMessage}</p>}
          {pricePrediction && (
            <div className="ai-price-hint glass-inline" role="status">
              {pricePrediction.label} · Confidence {pricePrediction.confidence}%
            </div>
          )}
          <div className="fsp-sort">
            <span className="sort-label">Sort by:</span>
            {['price', 'duration', 'departure'].map(s => (
              <button key={s} type="button" className={`sort-btn ${sortBy === s ? 'sort-active' : ''}`} onClick={() => setSortBy(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fsp-body container">
        <aside className="filters-sidebar glass-card">
          <div className="filter-section">
            <h4>Stops</h4>
            {['all', '0', '1'].map(s => (
              <label key={s} className="filter-option">
                <input type="radio" name="stops" value={s} checked={filters.stops === s} onChange={() => setFilters({ ...filters, stops: s })} />
                {s === 'all' ? 'Any' : s === '0' ? 'Non-stop' : '1 Stop'}
              </label>
            ))}
          </div>
          <div className="filter-section">
            <h4>Airlines</h4>
            {airlineOptions.map(a => (
              <label key={a.code} className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.airlines.includes(a.code)}
                  onChange={e => setFilters({
                    ...filters,
                    airlines: e.target.checked ? [...filters.airlines, a.code] : filters.airlines.filter(x => x !== a.code)
                  })}
                />
                {a.name}
              </label>
            ))}
          </div>
          <div className="filter-section">
            <h4>Max Price (₹)</h4>
            <input type="range" min="1500" max="25000" step="500" value={filters.maxPrice || apiFilters.priceRange?.max || 15000}
              onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} className="price-range" aria-label="Maximum price" />
          </div>
          <button type="button" className="reset-filters" onClick={() => setFilters({ stops: 'all', maxPrice: '', airlines: [] })}>Reset Filters</button>
        </aside>

        <div className="flight-results">
          <div className="results-count">{loading ? 'Searching…' : `${filtered.length} flights found`}</div>
          {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
            <div className="no-results glass-card">No flights found. Seed the database or adjust filters.</div>
          ) : filtered.map(flight => {
            const c = flight.cabins?.[cabinKey] || flight.cabins?.economy;
            return (
              <div key={flight._id} className="flight-card glass-card">
                <div className="fc-airline">
                  <div className="fc-airline-logo">✈</div>
                  <div>
                    <div className="fc-airline-name">{flight.airline?.name}</div>
                    <div className="fc-flight-no">{flight.flightNumber}</div>
                  </div>
                </div>
                <div className="fc-times">
                  <div className="fc-time">
                    <div className="fc-hour">{formatTime(flight.departure)}</div>
                    <div className="fc-city">{flight.origin?.city || from}</div>
                  </div>
                  <div className="fc-duration">
                    <div className="fc-dur-text">{formatDuration(flight.duration)}</div>
                    <div className="fc-stops-text">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop`}</div>
                  </div>
                  <div className="fc-time">
                    <div className="fc-hour">{formatTime(flight.arrival)}</div>
                    <div className="fc-city">{flight.destination?.city || to}</div>
                  </div>
                </div>
                <div className="fc-meta">
                  <span className="fc-baggage">🧳 {c?.baggage}</span>
                  {flight.refundable && <span className="fc-refund">✓ Refundable</span>}
                </div>
                <div className="fc-price-col">
                  <div className="fc-price">₹{((c?.price || 0) * adults).toLocaleString()}</div>
                  <button type="button" className="fc-book-btn" onClick={() => bookFlight(flight)}>
                    Book Now <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
