# DataArt Travel — AI Platform Implementation Plan

## Executive summary

The codebase was ~50% complete: a **solid Express/MongoDB backend** with auth, flights, hotels, bookings, and offers, plus a **polished React frontend** that mostly used mock data. This transformation adds an **AI intelligence layer** (15 features), fixes critical bugs, seeds data, wires end-to-end booking, and introduces modern UX (glassmorphism, dark mode, skeleton loaders).

---

## Phase 1 — Foundation (DONE)

| Item | Status |
|------|--------|
| Fix Express route order (`/routes/popular`, `/city/trending` before `/:id`) | ✅ |
| Cabin class normalization (`premiumEconomy`) | ✅ |
| Hotel `maxPrice` filter | ✅ |
| Hotel room availability decrement on book | ✅ |
| Round-trip flight search support | ✅ |
| Price calendar API | ✅ |
| `seed.js` — flights, hotels, users, offers, community reports | ✅ |
| Secure `.env.example` (no real credentials) | ✅ |
| JWT required in production | ✅ |

**Run seed:** `cd backend && npm run seed`  
**Demo users:** `demo@dataart.travel` / `demo1234`, `admin@dataart.travel` / `admin123`

---

## Phase 2 — AI backend (DONE)

All endpoints under `/api/ai`:

| Feature | Endpoint |
|---------|----------|
| Scam detection | `GET /scam/:destination`, `POST /scam/report` |
| Weather intelligence | `GET /weather/:destination` |
| Geo advisor | `GET /geo/recommend` |
| Chat assistant | `POST /chat` |
| Personalization | `GET /personalize`, `POST /search-history` |
| Trends | `GET /trends` |
| Budget planner | `POST /budget/plan` |
| Itinerary | `GET /itinerary/:destination` |
| Safety | `GET /safety/:destination` |
| Crowd | `GET /crowd/:destination` |
| Price prediction | `GET /price/predict` |
| Companion matching | `POST /companions/match` |
| Local experiences | `GET /experiences/:destination` |
| Carbon calculator | `POST /carbon` |
| Emergency pack | `GET /emergency/:destination` |
| Review fraud | `POST /reviews/analyze` |
| Flight alerts | `POST/GET /alerts/flight` |

**Architecture:** `backend/services/ai/` — rule-based + destination dataset; OpenWeather when `OPENWEATHER_API_KEY` set; optional `OPENAI_API_KEY` for future LLM upgrade.

**Models:** `SearchHistory`, `CommunityReport`, `FlightAlert`; `User.travelProfile` extended.

---

## Phase 3 — Frontend integration (DONE)

| Item | Status |
|------|--------|
| Flights → live API + price prediction hint | ✅ |
| Hotels → full search UI + API | ✅ |
| Checkout → `POST /bookings` | ✅ |
| AI Hub (`/ai`) — assistant, scam, weather, geo, budget, itinerary, etc. | ✅ |
| Dark mode + glassmorphism | ✅ |
| Skeleton loaders | ✅ |
| SEO meta tags | ✅ |

---

## Phase 4 — Remaining for production parity

### Flight booking (partial → target)

- [x] Search, filters, sort, API
- [x] Price prediction hint
- [x] Price calendar API
- [ ] Seat selection UI + seat map model
- [ ] Multi-city UI (backend accepts params; UI needed)
- [ ] Flight comparison side-by-side view
- [ ] Flight alerts UI (API ready)
- [ ] Airline comparison matrix

### Hotel booking (partial → target)

- [x] Search, filters, listing
- [ ] Hotel detail page + reviews UI
- [ ] Maps (Google/Mapbox `REACT_APP_MAPS_KEY`)
- [ ] Nearby attractions API integration
- [ ] Price history charts
- [ ] Recommendation carousel on home

### AI enhancements

- [ ] OpenAI/Anthropic for chat (plug into `chatAssistant`)
- [ ] ML price model (TensorFlow.js or external service)
- [ ] Real-time scam reports moderation admin
- [ ] PDF/calendar export for itineraries

### UX / platform

- [ ] Infinite scroll on results
- [ ] PWA + offline emergency pack
- [ ] i18n / multi-currency
- [ ] Payment gateway (Razorpay/Stripe)
- [ ] Email notifications (SendGrid)
- [ ] Rate limiting + helmet + CSP

### DevOps

- [ ] Docker Compose (api + mongo + web)
- [ ] CI/CD (GitHub Actions)
- [ ] Staging/production env separation

---

## Architecture (target production)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  React SPA  │────▶│ Express API  │────▶│  MongoDB    │
│  (CRA/Vite) │     │  + AI layer  │     │  Atlas      │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │ OpenWeather  │
                    │ Maps / Pay   │
                    │ LLM (opt.)   │
                    └──────────────┘
```

---

## Flight search data sources

1. **Amadeus** (recommended free API) — ~2,000 free test calls/month. [Register](https://developers.amadeus.com/register), add keys to `.env`.
2. **MongoDB** — run `npm run seed` for local Indian route data.
3. **Demo fallback** — if neither returns results, estimated fares are generated so search never looks empty.

## Environment variables

**Backend** (`backend/.env`):

- `MONGODB_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL`
- `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` (free flight search)
- `OPENWEATHER_API_KEY` (optional)
- `OPENAI_API_KEY` (optional)

**Frontend** (`frontend/.env`):

- `REACT_APP_API_URL` (production API base)

---

## Quick start

```bash
# Terminal 1
cd backend
cp .env.example .env   # edit MONGODB_URI
npm install
npm run seed
npm run dev

# Terminal 2
cd frontend
npm install
npm start
```

Visit: http://localhost:3000 — Home, Flights, Hotels, **AI Hub** (`/ai`)

---

## Security notes

1. Rotate any credentials that were in the old `.env.example`.
2. Never commit `.env` files.
3. Use strong `JWT_SECRET` in production.
4. Add `helmet`, rate limiting, and input sanitization before public launch.

---

## File map (new/changed)

```
backend/
  seed.js
  utils/cabin.js, airportCodes.js
  services/ai/index.js, destinationData.js
  routes/ai.js
  models/SearchHistory.js, CommunityReport.js, FlightAlert.js

frontend/src/
  context/ThemeContext.js
  pages/AIHubPage.js, HotelSearchPage.js, BookingCheckoutPage.js
  components/Skeleton.js
  styles/ai-hub.css, hotels.css
```

---

*Last updated: implementation sprint — foundation + AI platform v1*
