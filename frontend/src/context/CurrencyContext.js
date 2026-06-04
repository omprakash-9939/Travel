import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../utils/api';

const CurrencyContext = createContext();

const SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', THB: '฿', SGD: 'S$' };

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => localStorage.getItem('dataart_currency') || 'INR');
  const [rates, setRates] = useState({ INR: 1 });

  const loadRates = useCallback(async () => {
    try {
      const { data } = await api.get('/integrations/currency/rates', { params: { base: 'INR' } });
      setRates(data.rates || { INR: 1 });
    } catch {
      setRates({ INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095 });
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  useEffect(() => {
    localStorage.setItem('dataart_currency', currency);
  }, [currency]);

  const convert = useCallback((amountInr) => {
    const n = Number(amountInr) || 0;
    if (currency === 'INR') return n;
    const rate = rates[currency];
    if (!rate) return n;
    return Math.round((n * rate) * 100) / 100;
  }, [currency, rates]);

  const format = useCallback((amountInr) => {
    const val = convert(amountInr);
    const sym = SYMBOLS[currency] || currency;
    return `${sym}${val.toLocaleString('en-IN', { maximumFractionDigits: currency === 'INR' ? 0 : 2 })}`;
  }, [currency, convert]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, convert, format, symbols: SYMBOLS }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
