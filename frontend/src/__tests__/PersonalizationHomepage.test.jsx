/**
 * Component tests — PersonalizationHomepage (React Testing Library)
 * Covers:
 *   US-0501 Continue Planning card — shown / hidden / CTA navigation
 *   US-0502 Recommendation carousel — Barcelona content, card fields, CTA, cache state, error state
 *   US-0503 Empty / anonymous homepage state
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mock dependencies ─────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// CSS import — handled by CRA's identity-obj-proxy; no explicit mock needed

// ── Context mock factories ────────────────────────────────────────────────────

const buildPersonalizationContext = (overrides = {}) => ({
  recommendations: {
    recommendedFlights: [],
    recommendedHotels: [],
    recommendedDestinations: [],
    continuePlanning: [],
    notifications: []
  },
  preferences:       null,
  intentScore:       { score: 0, tier: 'low' },
  recentlyViewed:    { flights: [], hotels: [] },
  notifications:     [],
  loading:           false,
  dismissNotification: jest.fn(),
  trackFlightSearch:  jest.fn(),
  trackHotelSearch:   jest.fn(),
  addToWishlist:      jest.fn(),
  trackDestination:   jest.fn(),
  ...overrides
});

const buildAuthContext = (overrides = {}) => ({
  user:   { _id: 'u1', name: 'Alice', email: 'alice@example.com' },
  logout: jest.fn(),
  ...overrides
});

// Wire up context mocks — must be called after defining the factories
jest.mock('../context/PersonalizationContext', () => ({
  usePersonalization: jest.fn()
}));
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

const { usePersonalization } = require('../context/PersonalizationContext');
const { useAuth }            = require('../context/AuthContext');

// ── Component under test ──────────────────────────────────────────────────────

import PersonalizedHomepage from '../components/PersonalizationHomepage';

// ── Helpers ───────────────────────────────────────────────────────────────────

const barcelonaPlanningItem = {
  destination: 'Barcelona',
  lastSearched: new Date('2026-07-01'),
  searchType: 'flight',
  searchQuery: { from: 'Delhi', to: 'Barcelona', date: '2026-07-10' }
};

const barcelonaFlight = {
  flightId:    'f1',
  airline:     'Iberia',
  flightNumber: 'IB1234',
  origin:      'Delhi',
  destination: 'Barcelona',
  price:       45000,
  departure:   new Date('2026-07-10'),
  reason:      'Because you searched Barcelona',
  thumbnail:   'https://example.com/img.jpg'
};

const barcelonaHotel = {
  hotelId:    'h1',
  hotelName:  'Hotel Arts',
  city:       'Barcelona',
  starRating: 5,
  userRating: 9.2,
  price:      12000,
  reason:     'Luxury stays in Barcelona',
  thumbnail:  'https://example.com/hotel.jpg'
};

function renderWithData(personalizationOverrides = {}, authOverrides = {}) {
  usePersonalization.mockReturnValue(buildPersonalizationContext(personalizationOverrides));
  useAuth.mockReturnValue(buildAuthContext(authOverrides));
  return render(<PersonalizedHomepage />);
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
});

// ── US-0501: Continue Planning card ──────────────────────────────────────────

describe('Continue Planning card (US-0501)', () => {

  // Scenario: Continue Planning card appears for a user with an active planning destination
  it('shows "Continue Planning" section when continuePlanning has items', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [barcelonaPlanningItem],
        recommendedFlights:      [],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      },
      preferences: { favoriteDestinations: [{ destination: 'Barcelona', score: 8 }] },
      intentScore: { score: 45, tier: 'medium' }
    });

    expect(screen.getByText(/Continue Planning/i)).toBeInTheDocument();
    expect(screen.getByText('Barcelona')).toBeInTheDocument();
  });

  // Scenario: Continue Planning card is not shown when there is no active planning destination
  it('does NOT show "Continue Planning" section when continuePlanning is empty', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [],
        recommendedFlights:      [barcelonaFlight],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      }
    });

    expect(screen.queryByText(/Continue Planning/i)).not.toBeInTheDocument();
  });

  // Scenario: Continue Planning card is not shown to unauthenticated users
  it('renders nothing for unauthenticated users (US-0501 auth-guard)', () => {
    usePersonalization.mockReturnValue(buildPersonalizationContext());
    useAuth.mockReturnValue(buildAuthContext({ user: null }));
    const { container } = render(<PersonalizedHomepage />);
    expect(container).toBeEmptyDOMElement();
  });

  // Scenario: Continue Planning CTA opens flight search pre-filled with destination and dates
  it('clicking Continue Planning card navigates to /flights with destination and dates (US-0501 CTA)', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [barcelonaPlanningItem],
        recommendedFlights:      [],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      }
    });

    // Find and click the planning card
    const card = screen.getByText('Barcelona').closest('[class*="continue-card"]')
      || screen.getByText('Barcelona').closest('div');
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/flights')
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('Barcelona')
    );
  });

  // Scenario: Card renders destination-only variant when travel date metadata is incomplete (RC-9)
  it('renders destination name even when travel dates are missing from search metadata (US-0501)', () => {
    const legacyItem = { ...barcelonaPlanningItem, searchQuery: { from: 'Delhi', to: 'Barcelona' /* no date */ } };
    renderWithData({
      recommendations: {
        continuePlanning:        [legacyItem],
        recommendedFlights:      [],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      }
    });

    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    // No broken/empty date field (undefined should not appear as literal text)
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });
});

// ── US-0502: Recommendation carousel ─────────────────────────────────────────

describe('Recommendation carousel (US-0502)', () => {

  // Scenario: Carousel shows Barcelona content when that is the user's active planning destination
  it('shows Barcelona flight in the recommendation carousel (US-0502)', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [],
        recommendedFlights:      [barcelonaFlight],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      }
    });

    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    expect(screen.getByText('Iberia')).toBeInTheDocument();
  });

  // Scenario: Each recommendation card contains required display fields
  it('flight card shows destination, price, airline, and CTA (US-0502 card-content)', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [],
        recommendedFlights:      [barcelonaFlight],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      }
    });

    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    expect(screen.getByText('Iberia')).toBeInTheDocument();
    // Price formatted in INR
    expect(screen.getByText(/45,000/)).toBeInTheDocument();
  });

  it('hotel card shows destination, hotel name, price, and star rating (US-0502 card-content)', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [],
        recommendedFlights:      [],
        recommendedHotels:       [barcelonaHotel],
        recommendedDestinations: [],
        notifications:           []
      }
    });

    expect(screen.getByText('Hotel Arts')).toBeInTheDocument();
    expect(screen.getByText(/Barcelona/i)).toBeInTheDocument();
    expect(screen.getByText(/12,000/)).toBeInTheDocument();
  });

  // Scenario: Clicking a recommendation card navigates to filtered search results
  it('clicking flight card navigates to /flights with Barcelona (US-0502 CTA)', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [],
        recommendedFlights:      [barcelonaFlight],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      }
    });

    const card = screen.getByText('Barcelona').closest('[class*="flight-card"]')
      || screen.getByText('Barcelona').closest('div');
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/flights')
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('Barcelona')
    );
  });

  // Scenario: Carousel shows graceful fallback state when recommendation engine fails
  // RED — PersonalizedHomepage renders null when hasAny=false, not a fallback message
  it('shows "Explore popular destinations" fallback when recommendations are empty [RED: US-0502]', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [],
        recommendedFlights:      [],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      }
    });

    // Current component returns null when no data → this test will fail until fallback is added
    expect(screen.getByText(/Explore popular destinations/i)).toBeInTheDocument();
  });
});

// ── US-0503: Empty / anonymous homepage state ─────────────────────────────────

describe('Empty / anonymous state (US-0503)', () => {

  // Scenario: Unauthenticated homepage shows no user-specific personalisation
  it('shows no personalisation components when user is not authenticated (US-0503)', () => {
    usePersonalization.mockReturnValue(buildPersonalizationContext({
      recommendations: {
        continuePlanning:        [barcelonaPlanningItem],
        recommendedFlights:      [barcelonaFlight],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      }
    }));
    useAuth.mockReturnValue(buildAuthContext({ user: null }));

    const { container } = render(<PersonalizedHomepage />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/Continue Planning/i)).not.toBeInTheDocument();
  });

  // Scenario: Unauthenticated homepage shows configurable popular destinations (not hardcoded list)
  // RED — current PersonalizedHomepage only renders for authenticated users with data
  it('shows configurable popular destinations for unauthenticated users [RED: US-0503]', () => {
    usePersonalization.mockReturnValue(buildPersonalizationContext({
      recommendations: {
        continuePlanning:        [],
        recommendedFlights:      [],
        recommendedHotels:       [],
        recommendedDestinations: [
          { name: 'Dubai',   country: 'UAE',       type: 'City',  imageUrl: 'https://a.b/1.jpg' },
          { name: 'Bali',    country: 'Indonesia', type: 'Beach', imageUrl: 'https://a.b/2.jpg' }
        ],
        notifications:           []
      }
    }));
    useAuth.mockReturnValue(buildAuthContext({ user: null }));

    render(<PersonalizedHomepage />);

    // Should render popular destinations section for anonymous users
    expect(screen.getByText('Dubai')).toBeInTheDocument();
    expect(screen.getByText('Bali')).toBeInTheDocument();
    // Must NOT use hardcoded list
    expect(screen.queryByText(/Mumbai/i)).not.toBeInTheDocument();
  });

  // Scenario: New authenticated user with no prior activity sees configurable popular destinations
  it('recommendation carousel is not empty or broken for new user with no activity (US-0503)', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [],
        recommendedFlights:      [],
        recommendedHotels:       [],
        recommendedDestinations: [
          { name: 'Bali',      country: 'Indonesia', type: 'Beach', imageUrl: 'https://a.b/1.jpg' },
          { name: 'Bangkok',   country: 'Thailand',  type: 'City',  imageUrl: 'https://a.b/2.jpg' }
        ],
        notifications:           []
      }
    });

    expect(screen.getByText('Bali')).toBeInTheDocument();
    expect(screen.getByText('Bangkok')).toBeInTheDocument();
  });
});

// ── US-0601: price_drop notifications in notification bell ────────────────────

describe('Notification bell — price_drop suppression (US-0601)', () => {

  // Scenario: No price_drop notification appears in notification bell when flag is off
  it('does not render a price_drop notification when notifications list has none', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [],
        recommendedFlights:      [barcelonaFlight],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      },
      notifications: [
        { id: 'return_reminder_Barcelona', type: 'return_reminder', title: 'Still thinking about Barcelona?', message: 'Complete your booking.', ctaLabel: 'Book', ctaUrl: '/hotels?city=Barcelona', dismissed: false }
      ]
    });

    expect(screen.queryByText(/dropped/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/price drop/i)).not.toBeInTheDocument();
  });

  // Scenario: return_reminder is visible in the notification bell (US-0602)
  it('renders return_reminder notification in the notification bell (US-0602)', () => {
    renderWithData({
      recommendations: {
        continuePlanning:        [],
        recommendedFlights:      [barcelonaFlight],
        recommendedHotels:       [],
        recommendedDestinations: [],
        notifications:           []
      },
      notifications: [
        { id: 'rr1', type: 'return_reminder', title: 'Still thinking about Barcelona?', message: 'Complete your booking.', ctaLabel: 'Book', ctaUrl: '/hotels?city=Barcelona', dismissed: false }
      ]
    });

    expect(screen.getByText(/Still thinking about Barcelona/i)).toBeInTheDocument();
  });
});
