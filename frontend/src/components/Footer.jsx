import React from 'react'
import Logo from './Logo'

export const Footer = () => {
  return (
    <div>
          <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo">
                <Logo/>
              </div>
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
  )
}
