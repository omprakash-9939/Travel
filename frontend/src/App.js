import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PersonalizationProvider } from './context/PersonalizationContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import IntegrationsPage from './pages/IntegrationsPage';
import HomePage from './pages/HomePage';
import FlightSearchPage from './pages/FlightSearchPage';
import HotelSearchPage from './pages/HotelSearchPage';
import AIHubPage from './pages/AIHubPage';
import BookingCheckoutPage from './pages/BookingCheckoutPage';
import { BookingsPage } from './pages/BookingsPage';
import ProfilePage from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/LoginPage';
import OffersPage from './pages/OffersPage';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import './styles/global.css';

function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
      <AuthProvider>
        <PersonalizationProvider>
        <Router>
          <div className="app">
            <Navbar />
            <main id="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/flights" element={<FlightSearchPage />} />
                <Route path="/hotels" element={<HotelSearchPage />} />
                <Route path="/ai" element={<AIHubPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/checkout" element={<BookingCheckoutPage />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/bookings" element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              </Routes>
            </main>
          </div>
        </Router>
        </PersonalizationProvider>
      </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;
