# Third-Party API Setup Guide

All integrations live under `/api/integrations`. The app works without keys (demo/fallback data).

## Quick status check

```http
GET http://localhost:5000/api/integrations/status
```

Or open **Integrations** in the app navbar (footer link) → `/integrations`

---

## 1. Amadeus — Flights & Hotels

- **Signup:** https://developers.amadeus.com/register
- **Free tier:** ~2,000 calls/month (test)

```env
AMADEUS_CLIENT_ID=your_api_key
AMADEUS_CLIENT_SECRET=your_api_secret
AMADEUS_ENV=test
```

---

## 2. Exchange Rate API — Multi-currency

- **Signup:** https://www.exchangerate-api.com (optional; works without key via open.er-api.com)

```env
EXCHANGERATE_API_KEY=
```

**Endpoints:** `GET /api/integrations/currency/rates?base=INR`  
`GET /api/integrations/currency/convert?amount=1000&from=INR&to=USD`

---

## 3. Mapbox — Maps & geocoding

- **Signup:** https://account.mapbox.com

```env
MAPBOX_ACCESS_TOKEN=pk.xxx
```

**Endpoints:** `GET /api/integrations/maps/geocode?q=Goa`  
`GET /api/integrations/maps/static?lat=15.3&lng=74.1`

---

## 4. Google Maps & Places — Maps, reviews, attractions

- **Console:** https://console.cloud.google.com  
- Enable: Maps JavaScript API, Geocoding API, Places API, Static Maps API

```env
GOOGLE_MAPS_API_KEY=AIza...
```

**Endpoints:**  
`GET /api/integrations/places/search?q=restaurants+in+Goa`  
`GET /api/integrations/places/attractions/Goa`  
`GET /api/integrations/places/detail/:placeId`  
`GET /api/hotels/:id/extras?city=Goa&name=Hotel`

---

## 5. Stripe — Card payments (international)

- **Signup:** https://dashboard.stripe.com

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Endpoints:**  
`POST /api/integrations/payments/stripe/intent`  
`POST /api/integrations/payments/stripe/checkout`

---

## 6. Razorpay — UPI/cards (India)

- **Signup:** https://dashboard.razorpay.com

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

**Endpoints:**  
`POST /api/integrations/payments/razorpay/order`  
`POST /api/integrations/payments/razorpay/verify`

---

## 7. SendGrid — Booking emails

```env
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=bookings@yourdomain.com
```

Sent automatically after each booking if configured.

---

## 8. Twilio — Booking SMS

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+1...
```

Sent automatically after each booking if configured.

---

## 9. OpenWeather — AI weather (existing)

```env
OPENWEATHER_API_KEY=
```

---

## 10. OpenAI — Enhanced chat (optional)

```env
OPENAI_API_KEY=
```

---

## Restart after changes

```bash
cd backend
npm run dev
```
