import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const PersonalizationContext = createContext();

export const usePersonalization = () => {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) throw new Error('usePersonalization must be used within PersonalizationProvider');
  return ctx;
};

export const PersonalizationProvider = ({ children }) => {
  const { user } = useAuth();

  const [recommendations, setRecommendations]   = useState(null);
  const [preferences, setPreferences]           = useState(null);
  const [intentScore, setIntentScore]           = useState({ score: 0, tier: 'low', breakdown: {} });
  const [recentlyViewed, setRecentlyViewed]     = useState({ flights: [], hotels: [] });
  const [notifications, setNotifications]       = useState([]);
  const [loading, setLoading]                   = useState(false);

  // Session ID — constant per browser tab, used for session-level signals
  const sessionIdRef = useRef(
    sessionStorage.getItem('dt_session_id') || (() => {
      const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('dt_session_id', id);
      return id;
    })()
  );
  const sessionId = sessionIdRef.current;

  // ── Load personalization data when user logs in ──────────────────────────
  useEffect(() => {
    if (!user) {
      setRecommendations(null);
      setPreferences(null);
      setIntentScore({ score: 0, tier: 'low', breakdown: {} });
      setNotifications([]);
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [recsRes, prefsRes, intentRes, recentRes, notifRes] = await Promise.allSettled([
        api.get('/personalization/recommendations'),
        api.get('/personalization/preferences'),
        api.get('/personalization/intent'),
        api.get('/personalization/recently-viewed'),
        api.get('/personalization/notifications')
      ]);

      if (recsRes.status === 'fulfilled') {
        const data = recsRes.value.data.data;
        setRecommendations(data);
        const empty = !data?.recommendedFlights?.length && !data?.recommendedHotels?.length
          && !data?.continuePlanning?.length;
        if (empty) {
          api.post('/personalization/preferences/refresh').catch(() => {});
        }
      }
      if (prefsRes.status  === 'fulfilled') setPreferences(prefsRes.value.data.preferences);
      if (intentRes.status === 'fulfilled') setIntentScore(intentRes.value.data.intent);
      if (recentRes.status === 'fulfilled') setRecentlyViewed({
        flights: recentRes.value.data.flights || [],
        hotels:  recentRes.value.data.hotels  || []
      });
      if (notifRes.status  === 'fulfilled') setNotifications(notifRes.value.data.notifications || []);
    } catch (err) {
      console.warn('[Personalization] fetchAll error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Central tracking function ────────────────────────────────────────────
  const track = useCallback(async (eventType, metadata = {}) => {
    if (!user) return;
    try {
      await api.post('/personalization/track', { eventType, metadata, sessionId });
    } catch (err) {
      // Non-critical — silently ignore tracking failures
    }
  }, [user, sessionId]);

  // ── Tracking shortcuts ───────────────────────────────────────────────────
  const trackFlightSearch = useCallback((query) =>
    track('flight_search', { destination: query.to, origin: query.from, searchQuery: query }), [track]);

  const trackHotelSearch = useCallback((query) =>
    track('hotel_search', { destination: query.city, searchQuery: query }), [track]);

  const trackFlightView = useCallback((flight) =>
    track('flight_view', {
      flightId:     flight._id,
      flightNumber: flight.flightNumber,
      airline:      flight.airline?.name,
      origin:       flight.origin?.city,
      destination:  flight.destination?.city,
      price:        flight.cabins?.economy?.price,
      isDomestic:   flight.isDomestic
    }), [track]);

  const trackHotelView = useCallback((hotel) =>
    track('hotel_view', {
      hotelId:    hotel._id,
      hotelName:  hotel.name,
      destination: hotel.location?.city,
      starRating: hotel.starRating,
      price:      hotel.roomTypes?.[0]?.price
    }), [track]);

  const trackBookingStart = useCallback((item, type) =>
    track('booking_started', { bookingType: type, destination: type === 'flight' ? item.destination?.city : item.location?.city, price: item.totalPrice }), [track]);

  const trackDestination = useCallback((name) =>
    track('destination_viewed', { destination: name }), [track]);

  // ── Wishlist ─────────────────────────────────────────────────────────────
  const addToWishlist = useCallback(async (type, item) => {
    try {
      await api.post('/personalization/wishlist', {
        type,
        itemId:      item._id || item.id,
        destination: type === 'flight' ? item.destination?.city : item.location?.city,
        price:       type === 'flight' ? item.cabins?.economy?.price : item.roomTypes?.[0]?.price
      });
      await fetchAll(); // refresh recommendations
    } catch (err) {
      console.warn('Wishlist add failed:', err.message);
    }
  }, [fetchAll]);

  // ── Dismiss notification ─────────────────────────────────────────────────
  const dismissNotification = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.put(`/personalization/notifications/${id}/dismiss`);
    } catch { /* non-critical */ }
  }, []);

  // ── Refresh on demand ────────────────────────────────────────────────────
  const refreshRecommendations = useCallback(async () => {
    try {
      const { data } = await api.post('/personalization/preferences/refresh');
      if (data.recommendations) setRecommendations(data.recommendations);
    } catch (err) {
      console.warn('Refresh failed:', err.message);
    }
  }, []);

  return (
    <PersonalizationContext.Provider value={{
      // Data
      recommendations,
      preferences,
      intentScore,
      recentlyViewed,
      notifications,
      loading,
      sessionId,
      // Actions
      track,
      trackFlightSearch,
      trackHotelSearch,
      trackFlightView,
      trackHotelView,
      trackBookingStart,
      trackDestination,
      addToWishlist,
      dismissNotification,
      refreshRecommendations,
      fetchAll
    }}>
      {children}
    </PersonalizationContext.Provider>
  );
};
