# Tech Stack — DataArt Travel Personalization Engine

## Runtime & Languages

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend runtime | Node.js (CRA dev server) | 18+ LTS | `react-scripts 5.0.1` |
| Backend runtime | Node.js | 18+ LTS | Pinned in Dockerfile (target) |
| Language (FE) | JavaScript (ES2022) | — | JSX, no TypeScript |
| Language (BE) | JavaScript (ES2022) | — | CommonJS (`'use strict'`) |

## Frontend

| Package | Version | Role |
|---------|---------|------|
| react | 18.2.0 | UI framework |
| react-dom | 18.2.0 | DOM rendering |
| react-router-dom | 6.20.1 | Client-side routing |
| axios | 1.6.2 | HTTP client; proxy → `:5000` |
| lucide-react | 0.294.0 | Icon set |
| date-fns | 3.0.6 | Date formatting |
| @testing-library/react | 13.4.0 | Component tests |
| @testing-library/jest-dom | 5.17.0 | Custom Jest matchers |
| @testing-library/user-event | 13.5.0 | User interaction simulation |

**No Redux.** State is managed with `useState` + `useContext` locally.
**No CSS framework** (no Tailwind, no MUI). Styling via inline styles and class names.
**Proxy:** `frontend/package.json` proxies `/api/*` to `http://localhost:5000`.

## Backend

| Package | Version | Role |
|---------|---------|------|
| express | 4.18.2 | HTTP server |
| mongoose | 8.0.3 | MongoDB ODM |
| jsonwebtoken | 9.0.2 | JWT sign/verify |
| bcryptjs | 2.4.3 | Password hashing |
| express-validator | 7.0.1 | Input validation |
| cors | 2.8.5 | CORS middleware |
| morgan | 1.10.0 | HTTP access logging |
| dotenv | 16.3.1 | Environment variable loading |
| nodemon | 3.0.2 | Dev auto-restart |

**No Redis.** Caching is via MongoDB TTL (`RecommendationCache.validUntil`).
**No queue library.** Background jobs use `setInterval` (in-process).
**No ORM migrations.** Schema evolution handled via Mongoose `$set` upserts.

## Database

| Concern | Choice | Notes |
|---------|--------|-------|
| Primary datastore | MongoDB Atlas | M0 (dev) → M10+ (production) |
| ODM | Mongoose 8 | Connection string via `MONGODB_URI` env var |
| Connection pool | Mongoose default (5) | Increase to 20 for production |
| Indexes | Compound `(user, createdAt)` on `UserActivity` | Required for 90-day preference queries |

## External Integrations

| Service | SDK / Approach | Notes |
|---------|---------------|-------|
| Amadeus | REST via custom `amadeus.js` wrapper | `AMADEUS_CLIENT_ID` + `_SECRET` |
| SendGrid | REST via `@sendgrid/mail` pattern in `sendgrid.js` | `SENDGRID_API_KEY` |
| Stripe | `stripe` npm package via `stripePay.js` | `STRIPE_SECRET_KEY` |
| Razorpay | `razorpay` npm via `razorpayPay.js` | `RAZORPAY_KEY_ID` + `_SECRET` |
| OpenAI | `openai` npm via `ai/index.js` | `OPENAI_API_KEY` |
| OpenWeather | REST via `integrations/` | `OPENWEATHER_API_KEY` |

## Repo Layout

```
Travel/
├── frontend/              React 18 CRA app
│   ├── src/
│   │   ├── components/    Reusable UI components
│   │   ├── pages/         Route-level page components
│   │   ├── context/       React Context providers
│   │   └── hooks/         Custom hooks
│   ├── public/
│   └── package.json
├── backend/               Express 4 API
│   ├── middleware/        auth.js (JWT verify), etc.
│   ├── models/            Mongoose schemas
│   ├── routes/            Express routers
│   ├── services/          Business logic
│   │   ├── personalization/  (target refactor location for EP-04)
│   │   │   ├── activityTracker.js
│   │   │   ├── preferenceEngine.js
│   │   │   ├── recommendationEngine.js
│   │   │   └── notificationHelpers.js  (new — EP-06)
│   │   ├── integrations/  External API wrappers
│   │   └── ai/            OpenAI helpers
│   ├── jobs/              aggregationJob.js
│   ├── utils/             Helper utilities
│   ├── server.js          Entry point
│   ├── seed.js            DB seeding
│   └── package.json
├── architecture/          This folder
├── requirements/          Epics, stories, functions
└── docs/                  (future)
```

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Files (BE) | camelCase | `activityTracker.js` |
| Files (FE) | PascalCase for components | `PersonalizationPanel.jsx` |
| Functions | camelCase | `buildRecommendations()` |
| Constants | SCREAMING_SNAKE | `INTENT_WEIGHTS`, `CACHE_TTL_MS` |
| MongoDB collections | PascalCase (Mongoose model name) | `UserActivity`, `RecommendationCache` |
| API routes | kebab-case | `/api/personalization/dismiss-notification` |
| Env vars | SCREAMING_SNAKE | `SENDGRID_API_KEY` |

## Test Framework

| Layer | Tool | Config |
|-------|------|--------|
| Frontend | Jest + @testing-library/react | CRA built-in (`react-scripts test`) |
| Backend | Jest (manual) or Mocha (to add) | No test runner configured yet |
| BDD feature files | Gherkin (pending — `bdd-to-tdd` skill) | `features/` directory (target) |

## Feature Flags (via `.env`)

| Flag | Default | Controls |
|------|---------|---------|
| `ENABLE_PRICE_DROP_NOTIFICATIONS` | `false` | `price_drop` notification generation |
| `ENABLE_REENGAGEMENT_EMAILS` | `false` | SendGrid email trigger on intent threshold |
| `ENABLE_INVENTORY_NOTIFICATIONS` | `false` | `selling_fast` / `new_deal` notifications |
| `ENABLE_AB_TEST` | `false` | A/B group assignment + control group routing |

All flags default to `false`. Enable only after the corresponding EP-08 analytics gate passes.
