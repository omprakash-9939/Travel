import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { ChevronDown, LogOut, BookOpen, Settings, Wallet, Menu, X, Moon, Sun, Sparkles, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import '../styles/navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { currency, setCurrency, symbols } = useCurrency();
  const { notifications, dismissNotification } = usePersonalization();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef();
  const notifRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
      if (!notifRef.current?.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); setProfileOpen(false); };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/flights', label: 'Flights' },
    { path: '/hotels', label: 'Hotels' },
    { path: '/ai', label: 'AI Hub' },
    { path: '/offers', label: 'Offers' },
    { path: '/integrations', label: 'APIs' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">DataArt<span>Travel</span></Link>

        <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} className={`nav-link ${location.pathname === link.path ? 'nav-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <select
            className="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            aria-label="Currency"
          >
            {Object.keys(symbols).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/ai" className="nav-ai-link" aria-label="AI Hub"><Sparkles size={18} /> AI</Link>

          {user && (
            <div className="notif-bell" ref={notifRef}>
              <button
                type="button"
                className="notif-btn"
                onClick={() => setNotifOpen(o => !o)}
                aria-label={`Notifications${notifications.length ? ` (${notifications.length})` : ''}`}
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="notif-count">{notifications.length > 9 ? '9+' : notifications.length}</span>
                )}
              </button>
              {notifOpen && (
                <div className="notif-dropdown" role="dialog" aria-label="Notifications panel">
                  <div className="notif-header">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">You're all caught up</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="notif-item">
                        <div className="notif-item-body">
                          <div className="notif-item-title">{n.title}</div>
                          <div className="notif-item-msg">{n.message}</div>
                        </div>
                        <div className="notif-item-actions">
                          <button
                            type="button"
                            className="notif-item-cta"
                            onClick={() => { setNotifOpen(false); navigate(n.ctaUrl || '/'); }}
                          >
                            {n.ctaLabel}
                          </button>
                          <button
                            type="button"
                            className="notif-item-dismiss"
                            aria-label="Dismiss"
                            onClick={() => dismissNotification(n.id)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="profile-menu" ref={profileRef}>
              <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
                <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
                <span className="profile-name">Hi, {user.name?.split(' ')[0]}</span>
                <ChevronDown size={16} />
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="pd-header">
                    <div className="pd-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                    <div><div className="pd-name">{user.name}</div><div className="pd-email">{user.email}</div></div>
                  </div>
                  <div className="pd-divider" />
                  {[
                    { icon: <BookOpen size={16} />, label: 'My Bookings', path: '/bookings' },
                    { icon: <Wallet size={16} />, label: 'DataArt Wallet', badge: `₹${user.wallet || 0}`, path: '/profile?tab=wallet' },
                    { icon: <Settings size={16} />, label: 'Profile Settings', path: '/profile' },
                  ].map(item => (
                    <Link key={item.label} to={item.path} className="pd-item" onClick={() => setProfileOpen(false)}>
                      {item.icon}<span>{item.label}</span>
                      {item.badge && <span className="pd-badge">{item.badge}</span>}
                    </Link>
                  ))}
                  <div className="pd-divider" />
                  <button className="pd-item pd-logout" onClick={handleLogout}>
                    <LogOut size={16} /><span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/register" className="btn-register">Sign Up</Link>
            </div>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
