# DataArt Travel — MERN Stack Travel Booking Platform

A full-featured travel booking platform built with **MongoDB, Express.js, React.js, and Node.js**, inspired by EaseMyTrip.

---

## 🏗 Project Structure

```
dataart-travel/
├── backend/                 # Express.js API
│   ├── models/
│   │   ├── User.js          # User schema (auth, wallet, preferences)
│   │   ├── Flight.js        # Flight schema (cabins, stops, amenities)
│   │   ├── Hotel.js         # Hotel schema (rooms, amenities, location)
│   │   ├── Booking.js       # Booking schema (flight/hotel, payments)
│   │   └── Offer.js         # Offer/coupon schema
│   ├── routes/
│   │   ├── auth.js          # Register, Login, Profile
│   │   ├── flights.js       # Search, Popular Routes
│   │   ├── hotels.js        # Search, Trending Cities
│   │   ├── bookings.js      # Create, Cancel, My Bookings
│   │   └── offers.js        # List Offers, Validate Coupon
│   ├── middleware/
│   │   └── auth.js          # JWT protect + adminOnly middleware
│   └── server.js            # Entry point
│
└── frontend/                # React.js SPA
    └── src/
        ├── context/
        │   └── AuthContext.js   # Global auth state
        ├── pages/
        │   ├── HomePage.js      # Hero + Search Engine + All Sections
        │   ├── FlightSearchPage.js  # Results + Filters + Sorting
        │   ├── LoginPage.js     # Login + Register
        │   ├── BookingsPage.js  # My Bookings
        │   └── ProfilePage.js   # User Profile + Wallet
        ├── components/
        │   ├── Navbar.js        # Fixed nav with auth
        │   └── PrivateRoute.js  # Protected routes
        ├── utils/
        │   └── api.js           # Axios instance + interceptors
        └── styles/
            ├── global.css       # CSS variables, base styles
            ├── home.css         # Hero, Search Engine, Sections
            ├── navbar.css       # Navigation bar
            └── auth.css         # Auth pages + Flight results
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env          # Edit MONGODB_URI and JWT_SECRET
npm run dev                   # Starts on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start                     # Starts on http://localhost:3000
```

---

## 📡 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Flights
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/flights/search?from=DEL&to=BOM&date=2026-06-15` | Search flights |
| GET | `/api/flights/routes/popular` | Get popular routes |
| GET | `/api/flights/:id` | Get flight details |
| POST | `/api/flights` | Create flight (admin) |

### Hotels
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/hotels/search?city=Mumbai&checkIn=...` | Search hotels |
| GET | `/api/hotels/city/trending` | Trending hotel cities |
| GET | `/api/hotels/:id` | Hotel details |

### Bookings
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/my` | User's bookings |
| GET | `/api/bookings/:id` | Booking details |
| PUT | `/api/bookings/:id/cancel` | Cancel booking |

### Offers
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/offers?type=flight` | List offers |
| POST | `/api/offers/validate` | Validate coupon |

---

## ✨ Features

### Frontend (React)
- **Hero search engine** with live airport autocomplete
- **One-way / Round-trip / Multi-city** flight search
- **Travellers & cabin class** selector panel
- **Hotel search** with check-in/check-out dates
- **Exclusive offers carousel** with coupon copy
- **Top flight routes** grid with price display
- **Trending destinations** visual grid
- **Why Us** section
- **JWT auth** — Login / Register / Profile
- **Protected routes** with PrivateRoute
- **Booking history** with status badges
- **Wallet** display in profile
- **Dark/mobile responsive** layout

### Backend (Node + Express)
- JWT authentication with bcrypt password hashing
- MongoDB with Mongoose ODM
- Input validation with express-validator
- Role-based access (user / agent / admin)
- Automatic booking ID generation
- Refund calculation on cancellation
- Coupon validation with usage limits

---

## 🌐 Deployment

### Backend on Render/Railway
```
Build: npm install
Start: node server.js
Env: MONGODB_URI, JWT_SECRET, NODE_ENV=production
```

### Frontend on Vercel/Netlify
```
Build: npm run build
Output: build/
Env: REACT_APP_API_URL=https://your-backend.onrender.com/api
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router v6 |
| Styling | Custom CSS (Syne + DM Sans fonts) |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| HTTP Client | Axios |

---

*Built by DataArt Travel Team · 2024*
