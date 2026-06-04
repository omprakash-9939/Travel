function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

function generateFallbackHotels(city, checkIn, checkOut, rooms = 1) {
  const names = [
    `${city} Grand Palace`, `${city} Riverside Resort`, `${city} Business Suites`,
    `${city} Heritage Inn`, `${city} Skyline Hotel`
  ];
  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 1;

  return names.map((name, i) => {
    const base = 2200 + (hash(city + i) % 4000);
    return {
      _id: `demo-hotel-${city.toLowerCase().replace(/\s/g, '-')}-${i}`,
      source: 'demo',
      name,
      starRating: 3 + (i % 3),
      userRating: 7.5 + (i % 3) * 0.5,
      reviewCount: 80 + i * 20,
      location: { city, country: 'India', address: `${name}, ${city}` },
      thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
      amenities: [{ category: 'General', items: ['WiFi', 'Breakfast', 'Pool'] }],
      roomTypes: [{ name: 'Standard', maxOccupancy: 2, price: base, available: 8, inclusions: ['Breakfast'] }],
      minPricePerNight: base,
      totalPrice: base * nights * rooms
    };
  });
}

module.exports = { generateFallbackHotels };
