# Source requirements: US-0501, US-0502, US-0503 (EP-05)
# Wireframe: Homepage — above-the-fold personalisation zone (US-0501 Continue Planning card),
#            recommendation carousel section (US-0502), anonymous / new-user state (US-0503)
# NFRs: Homepage must render without blocking on slow recommendation fetch;
#        graceful empty states required for all user states;
#        search bar must always be visible and functional
# Priority: Must (US-0501, US-0502), Should (US-0503)
# Status: Draft — awaiting verification

@EP-05 @homepage-personalization
Feature: Homepage Personalisation
  As a returning authenticated user
  I want the homepage to reflect my current planning context
  So that I can resume my travel planning immediately without re-entering search parameters

  # ---------------------------------------------------------------------------
  # US-0501 — "Continue Planning" card for active returning planners
  # ---------------------------------------------------------------------------

  @US-0501 @must @continue-planning-card
  Scenario: Continue Planning card appears for a user with an active planning destination
    Given the user is authenticated
    And their primaryPlanningDestination is "Barcelona"
    And their intent tier is "medium"
    When the homepage loads
    Then the "Continue Planning" card is displayed
    And the card shows "Barcelona" as the destination
    And the card shows the last-searched travel dates

  @US-0501 @must @continue-planning-card @cta
  Scenario: Continue Planning CTA opens the flight search page pre-filled with destination and dates
    Given the "Continue Planning" card is displayed for destination "Barcelona"
    When the user activates the card CTA
    Then the flight search page opens
    And the destination is pre-filled as "Barcelona"
    And the last-searched travel dates are pre-filled

  @US-0501 @must @continue-planning-card @no-destination
  Scenario: Continue Planning card is not shown when there is no active planning destination
    Given the user is authenticated
    And their primaryPlanningDestination is not set (new user or post-booking state)
    When the homepage loads
    Then no "Continue Planning" card is displayed
    And the recommendation carousel is shown instead

  @US-0501 @must @continue-planning-card @auth-guard
  Scenario: Continue Planning card is not shown to unauthenticated users
    Given the user is not authenticated
    When the homepage loads
    Then no "Continue Planning" card is displayed

  @US-0501 @must @continue-planning-card @incomplete-metadata
  Scenario: Card renders a destination-only variant when travel date metadata is incomplete
    Given the user's last search metadata is missing travel dates (legacy data from before the RC-9 fix)
    When the homepage loads after the RC-9 fix is applied
    Then the "Continue Planning" card displays the destination
    And the card does not show a broken or empty date field

  # ---------------------------------------------------------------------------
  # US-0502 — Intent-ranked recommendation carousel
  # ---------------------------------------------------------------------------

  @US-0502 @must @recommendation-carousel
  Scenario: Carousel shows Barcelona content when that is the user's active planning destination
    Given the user is authenticated
    And their primaryPlanningDestination is "Barcelona"
    When the homepage loads
    Then the recommendation carousel contains Barcelona flights and hotels

  @US-0502 @must @recommendation-carousel @card-content
  Scenario: Each recommendation card contains the required display fields
    Given the recommendation carousel is loaded with at least one card
    When a recommendation card is displayed
    Then it shows the destination name
    And it shows the price range
    And it shows the airline or hotel name
    And it includes a "Book now" or "View" call to action

  @US-0502 @must @recommendation-carousel @cta
  Scenario: Clicking a recommendation card navigates to the relevant filtered search results
    Given a recommendation card for "Barcelona" is displayed in the carousel
    When the user activates the card CTA
    Then the flight search or hotel search page opens filtered for "Barcelona"

  @US-0502 @must @recommendation-carousel @cache
  Scenario: Recommendations are served from cache when the cache is fresh
    Given the recommendation cache is less than 6 hours old
    When the homepage loads
    Then recommendations are returned from cache
    And no new database query is issued

  @US-0502 @must @recommendation-carousel @error-state
  Scenario: Carousel shows a graceful fallback state when the recommendation engine fails
    Given the recommendation engine fails to return results
    When the homepage loads
    Then the carousel section displays "Explore popular destinations"
    And no error message or broken layout is visible

  # ---------------------------------------------------------------------------
  # US-0503 — Empty / anonymous homepage state
  # ---------------------------------------------------------------------------

  @US-0503 @should @empty-state @anonymous
  Scenario: Unauthenticated homepage shows no user-specific personalisation
    Given the user is not authenticated
    When the homepage loads
    Then no "Continue Planning" card is displayed
    And no user-specific recommendations are shown

  @US-0503 @should @empty-state @cold-start
  Scenario: Unauthenticated homepage uses the configurable popular destinations list, not the hardcoded one
    Given the user is not authenticated
    When the popular destinations section renders
    Then it displays destinations from the configurable cold-start list
    And it does not display the hardcoded list ["Mumbai", "Dubai", "Goa"]

  @US-0503 @should @empty-state @new-user
  Scenario: New authenticated user with no prior activity sees configurable popular destinations
    Given the user is authenticated but has no prior activity
    When the homepage loads
    Then the recommendation carousel shows configurable popular destinations
    And the carousel is not empty or broken

  @US-0503 @should @empty-state @search-bar
  Scenario: Search bar is prominently visible and functional regardless of user state
    Given any user visits the homepage (authenticated, unauthenticated, or new)
    When the page loads
    Then the search bar is visible
    And the search bar is functional

  @US-0503 @should @empty-state @missing-config
  Scenario: A sensible default destination list is shown when the cold-start configuration is absent
    Given the cold-start configuration is not present in the system
    When the homepage loads
    Then a sensible default destination list is displayed
    And no blank or broken section is rendered
