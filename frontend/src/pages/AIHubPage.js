import React, { useState, useEffect, useRef } from 'react';
import { Shield, Cloud, MapPin, MessageCircle, Wallet, Calendar, Users, Leaf, AlertTriangle, TrendingUp, Send } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import '../styles/ai-hub.css';

const TABS = [
  { id: 'assistant', label: 'AI Assistant', icon: MessageCircle },
  { id: 'scam', label: 'Scam Shield', icon: Shield },
  { id: 'weather', label: 'Weather', icon: Cloud },
  { id: 'geo', label: 'Destinations', icon: MapPin },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'itinerary', label: 'Itinerary', icon: Calendar },
  { id: 'safety', label: 'Safety', icon: AlertTriangle },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'carbon', label: 'Carbon', icon: Leaf },
  { id: 'companion', label: 'Companions', icon: Users }
];

export default function AIHubPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('assistant');
  const [destination, setDestination] = useState('Bangkok');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([{ role: 'assistant', content: 'Ask me anything about travel planning, safety, or budgets.' }]);
  const [input, setInput] = useState('');
  const [budget, setBudget] = useState(80000);
  const chatEnd = useRef();

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  useEffect(() => {
    if (tab === 'assistant' || tab === 'trends') return;
    const load = async () => {
      setLoading(true);
      try {
        if (tab === 'scam') {
          const { data: d } = await api.get(`/ai/scam/${destination}`);
          setData({ scam: d.intelligence, reports: d.communityReports });
        } else if (tab === 'weather') {
          const { data: d } = await api.get(`/ai/weather/${destination}`);
          setData({ weather: d.weather });
        } else if (tab === 'geo') {
          const { data: d } = await api.get('/ai/geo/recommend', { params: { budget, country: user?.travelProfile?.homeCountry || 'India' } });
          setData({ geo: d.data });
        } else if (tab === 'safety') {
          const { data: d } = await api.get(`/ai/safety/${destination}`);
          setData({ safety: d.safety });
        } else if (tab === 'itinerary') {
          const { data: d } = await api.get(`/ai/itinerary/${destination}`, { params: { days: 5 } });
          setData({ itinerary: d });
        } else if (tab === 'trends') {
          const { data: d } = await api.get('/ai/trends');
          setData({ trends: d });
        }
      } catch {
        setData({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab, destination, budget]);

  const sendChat = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setChat(c => [...c, userMsg]);
    setInput('');
    try {
      const { data: d } = await api.post('/ai/chat', { message: input, context: { destination, country: 'India' } });
      setChat(c => [...c, { role: 'assistant', content: d.content, suggestions: d.suggestions }]);
    } catch {
      setChat(c => [...c, { role: 'assistant', content: 'Sorry, I could not respond. Try again.' }]);
    }
  };

  const planBudget = async () => {
    const { data: d } = await api.post('/ai/budget/plan', { totalBudget: budget, days: 7, destination });
    setData({ plan: d.plan });
  };

  const calcCarbon = async () => {
    const { data: d } = await api.post('/ai/carbon', { flightKm: 2500, nights: 5, hotelStars: 4 });
    setData({ carbon: d.carbon });
  };

  return (
    <div className="ai-hub page-pad">
      <div className="container">
        <header className="ai-hub-header">
          <h1>AI Travel Intelligence</h1>
          <p>Smart planning, safety, weather, and personalization — powered by DataArt Travel AI</p>
          <label className="dest-input">
            Destination
            <input value={destination} onChange={e => setDestination(e.target.value)} aria-label="Destination" />
          </label>
        </header>

        <nav className="ai-tabs" aria-label="AI features">
          {TABS.map(t => (
            <button key={t.id} type="button" className={`ai-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="ai-panel glass-card">
          {tab === 'assistant' && (
            <div className="chat-panel">
              <div className="chat-messages">
                {chat.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
                ))}
                <div ref={chatEnd} />
              </div>
              <form className="chat-input-row" onSubmit={sendChat}>
                <input placeholder="I have ₹80,000 and 7 days. Suggest a trip…" value={input} onChange={e => setInput(e.target.value)} aria-label="Message" />
                <button type="submit" className="btn-primary" aria-label="Send"><Send size={18} /></button>
              </form>
            </div>
          )}

          {loading && tab !== 'assistant' && <p className="text-muted">Loading intelligence…</p>}

          {tab === 'scam' && data.scam && (
            <div>
              <div className="score-row">
                <div className="score-card risk">Scam risk: {data.scam.overallRisk} ({data.scam.scamRiskScore})</div>
                <div className="score-card safe">Safety: {data.scam.safetyScore}/100</div>
              </div>
              <p className="ai-summary">{data.scam.summary}</p>
              <p><strong>Taxi:</strong> {data.scam.taxiRisk}</p>
              <ul>{data.scam.warnings?.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}

          {tab === 'weather' && data.weather && (
            <div>
              <p className="ai-summary">{data.weather.summary}</p>
              <div className="weather-current">Now: {data.weather.current?.temp}°C · {data.weather.current?.condition} · Humidity {data.weather.current?.humidity}%</div>
              <p><strong>Pack:</strong> {data.weather.aiRecommendations?.packing}</p>
              <p><strong>Outdoor:</strong> {data.weather.aiRecommendations?.outdoor}</p>
              <div className="weather-week">
                {data.weather.weekly?.map((d, i) => (
                  <div key={i} className="weather-day">{d.day}: {d.high}°/{d.low}° · 🌧 {d.rainProbability}%</div>
                ))}
              </div>
            </div>
          )}

          {tab === 'geo' && data.geo && (
            <div>
              <p className="ai-summary">{data.geo.summary}</p>
              {data.geo.recommendations?.map(r => (
                <div key={r.destination} className="geo-card">
                  <strong>#{r.rank} {r.destination}</strong> — {r.matchScore}% match
                  <p className="text-muted">{r.reason}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'budget' && (
            <div>
              <label>Budget (₹) <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} /></label>
              <button type="button" className="btn-primary" onClick={planBudget} style={{ marginTop: 12 }}>Calculate split</button>
              {data.plan && (
                <ul className="budget-list">
                  {Object.entries(data.plan.breakdown).map(([k, v]) => (
                    <li key={k}>{k}: ₹{v.toLocaleString()}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'itinerary' && data.itinerary?.days && (
            <div>
              <p>{data.itinerary.summary}</p>
              {data.itinerary.days.map(d => (
                <div key={d.day} className="itin-day">
                  <h4>{d.title}</h4>
                  <p>AM: {d.morning} · PM: {d.afternoon} · Eve: {d.evening}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'safety' && data.safety && (
            <div className="score-row">
              <div className="score-card">Crime index: {data.safety.crimeScore}</div>
              <div className="score-card safe">Women: {data.safety.womenSafetyScore}</div>
              <div className="score-card safe">Family: {data.safety.familySafetyScore}</div>
            </div>
          )}

          {tab === 'trends' && (
            <button type="button" className="btn-primary" onClick={async () => {
              const { data: d } = await api.get('/ai/trends');
              setData({ trends: d });
            }}>Load trends</button>
          )}
          {tab === 'trends' && data.trends?.trending && (
            <ul>{data.trends.trending.map(t => <li key={t.destination}>{t.destination} {t.trend} ({t.tag})</li>)}</ul>
          )}

          {tab === 'carbon' && (
            <div>
              <button type="button" className="btn-primary" onClick={calcCarbon}>Calculate footprint</button>
              {data.carbon && <p>Total {data.carbon.totalKg} kg CO₂e — {data.carbon.greenerAlternative}</p>}
            </div>
          )}

          {tab === 'companion' && user && (
            <p className="text-muted">Privacy-first matching — opt-in only. Enable in profile to find travel companions with similar interests.</p>
          )}
        </div>
      </div>
    </div>
  );
}
