/**
 * Seed database: users, flights, hotels, offers
 * Run: npm run seed (from backend/)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Flight = require('./models/Flight');
const Hotel = require('./models/Hotel');
const Offer = require('./models/Offer');
const CommunityReport = require('./models/CommunityReport');

const AIRLINES = [
  { name: 'IndiGo', code: '6E' },
  { name: 'Air India', code: 'AI' },
  { name: 'Vistara', code: 'UK' },
  { name: 'SpiceJet', code: 'SG' },
  { name: 'Air Asia', code: 'I5' }
];

const ROUTES = [
  { from: 'DEL', fromCity: 'Delhi', to: 'BOM', toCity: 'Mumbai', duration: 135 },
  { from: 'BOM', fromCity: 'Mumbai', to: 'DEL', toCity: 'Delhi', duration: 140 },
  { from: 'DEL', fromCity: 'Delhi', to: 'BLR', toCity: 'Bangalore', duration: 165 },
  { from: 'BLR', fromCity: 'Bangalore', to: 'DEL', toCity: 'Delhi', duration: 170 },
  { from: 'DEL', fromCity: 'Delhi', to: 'DXB', toCity: 'Dubai', duration: 210, intl: true },
  { from: 'BOM', fromCity: 'Mumbai', to: 'DXB', toCity: 'Dubai', duration: 195, intl: true },
  { from: 'DEL', fromCity: 'Delhi', to: 'BKK', toCity: 'Bangkok', duration: 270, intl: true },
  { from: 'BLR', fromCity: 'Bangalore', to: 'GOI', toCity: 'Goa', duration: 75 }
];

function randomPrice(base, variance) {
  return Math.round(base + (Math.random() - 0.5) * variance);
}

async function seedFlights() {
  await Flight.deleteMany({});
  const flights = [];
  const today = new Date();
  today.setHours(6, 0, 0, 0);

  for (let day = 0; day < 21; day++) {
    for (const route of ROUTES) {
      for (let slot = 0; slot < 3; slot++) {
        const airline = AIRLINES[(day + slot) % AIRLINES.length];
        const dep = new Date(today);
        dep.setDate(dep.getDate() + day);
        dep.setHours(6 + slot * 5, 30, 0, 0);
        const arr = new Date(dep);
        arr.setMinutes(arr.getMinutes() + route.duration);
        const base = route.intl ? 12000 : 2800;
        const econ = randomPrice(base, 1200);
        flights.push({
          flightNumber: `${airline.code}${100 + day * 3 + slot}`,
          airline,
          origin: { city: route.fromCity, airport: `${route.fromCity} Intl`, code: route.from, country: 'India' },
          destination: { city: route.toCity, airport: `${route.toCity} Intl`, code: route.to, country: route.intl ? 'UAE' : 'India' },
          departure: dep,
          arrival: arr,
          duration: route.duration,
          stops: slot === 2 ? 1 : 0,
          cabins: {
            economy: { available: 20 + Math.floor(Math.random() * 40), price: econ, baggage: '15 kg' },
            premiumEconomy: { available: 8, price: Math.round(econ * 1.6), baggage: '25 kg' },
            business: { available: 4, price: Math.round(econ * 3.2), baggage: '35 kg' },
            first: { available: 2, price: Math.round(econ * 5), baggage: '40 kg' }
          },
          amenities: slot === 0 ? ['wifi', 'meal'] : ['meal'],
          refundable: slot === 0,
          isDomestic: !route.intl
        });
      }
    }
  }
  await Flight.insertMany(flights);
  console.log(`✓ ${flights.length} flights seeded`);
}

async function seedHotels() {
  await Hotel.deleteMany({});
  const cities = [
    { city: 'Goa', state: 'Goa', hotels: ['Seabreeze Resort', 'Palolem Retreat', 'Fontainhas Heritage Inn'] },
    { city: 'Delhi', state: 'Delhi', hotels: ['Connaught Luxe', 'Old Delhi Haveli', 'Aerocity Grand'] },
    { city: 'Mumbai', state: 'Maharashtra', hotels: ['Marine Drive Suites', 'Bandra Boutique', 'Juhu Beach Hotel'] },
    { city: 'Jaipur', state: 'Rajasthan', hotels: ['Amber View Palace', 'Pink City Heritage', 'Rambagh Garden Stay'] },
    { city: 'Bangalore', state: 'Karnataka', hotels: ['MG Road Metro Hotel', 'Whitefield Tech Stay', 'Lalbagh Green Inn'] }
  ];
  const docs = [];
  for (const { city, state, hotels } of cities) {
    hotels.forEach((name, i) => {
      const stars = 3 + (i % 3);
      const base = 2500 + stars * 800 + i * 400;
      docs.push({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + city.toLowerCase(),
        description: `Premium stay in ${city} with modern amenities.`,
        starRating: stars,
        userRating: 7.5 + (i * 0.4),
        reviewCount: 120 + i * 45,
        location: { city, state, country: 'India', address: `${name}, ${city}`, coordinates: { lat: 15 + i, lng: 74 + i } },
        thumbnail: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400`,
        images: [`https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800`],
        amenities: [{ category: 'General', items: ['WiFi', 'Pool', 'Breakfast'] }],
        roomTypes: [
          { name: 'Standard', maxOccupancy: 2, price: base, available: 10, inclusions: ['Breakfast'] },
          { name: 'Deluxe', maxOccupancy: 3, price: Math.round(base * 1.35), available: 6, inclusions: ['Breakfast', 'Spa access'] }
        ],
        policies: { cancellation: 'Free cancellation up to 24h before check-in' },
        tags: ['popular', city.toLowerCase()],
        isActive: true
      });
    });
  }
  await Hotel.insertMany(docs);
  console.log(`✓ ${docs.length} hotels seeded`);
}

async function seedUsers() {
  const adminHash = await bcrypt.hash('admin123', 12);
  const userHash = await bcrypt.hash('demo1234', 12);
  await User.deleteMany({ email: { $in: ['admin@dataart.travel', 'demo@dataart.travel'] } });
  await User.create([
    { name: 'Admin User', email: 'admin@dataart.travel', password: adminHash, role: 'admin', wallet: 5000 },
    { name: 'Demo Traveler', email: 'demo@dataart.travel', password: userHash, role: 'user', wallet: 2500, travelProfile: { homeCountry: 'India', homeCity: 'Delhi', budgetMax: 80000, preferredAirlines: ['6E', 'UK'], hotelStars: 4 } }
  ]);
  console.log('✓ Users: admin@dataart.travel / admin123, demo@dataart.travel / demo1234');
}

async function seedOffers() {
  await Offer.deleteMany({});
  await Offer.insertMany([
    { title: 'Anniversary Sale', description: 'Up to ₹10,000 off', couponCode: 'DART18', type: 'general', discountType: 'flat', discountValue: 1000, minBookingAmount: 5000, maxDiscount: 10000, validFrom: new Date(), validTill: new Date('2026-12-31'), usageLimit: 1000, isActive: true },
    { title: 'First Booking', description: '₹500 on first booking', couponCode: 'DARTFIRST', type: 'general', discountType: 'flat', discountValue: 500, minBookingAmount: 2000, validFrom: new Date(), validTill: new Date('2026-12-31'), isActive: true },
    { title: 'Hotel Deal', description: '15% off hotels', couponCode: 'DARTHOTEL', type: 'hotel', discountType: 'percentage', discountValue: 15, minBookingAmount: 3000, maxDiscount: 5000, validFrom: new Date(), validTill: new Date('2026-12-31'), isActive: true }
  ]);
  console.log('✓ Offers seeded');
}

async function seedCommunity() {
  await CommunityReport.deleteMany({});
  await CommunityReport.insertMany([
    { destination: 'Bangkok', category: 'taxi', title: 'Fake taxi at Suvarnabhumi', severity: 'high', description: 'Unmetered taxis quote 3x Grab price', verified: true, upvotes: 42 },
    { destination: 'Bangkok', category: 'scam', title: 'Gem shop tour trap', severity: 'medium', verified: true, upvotes: 28 }
  ]);
  console.log('✓ Community reports seeded');
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  await seedUsers();
  await seedFlights();
  await seedHotels();
  await seedOffers();
  await seedCommunity();
  console.log('\nSeed complete.');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
