# Source requirements: US-0101, US-0102, US-0103, US-0104, US-0105, US-0106 (EP-01)
# Wireframe: n/a — backend event capture; no distinct screen
# NFRs: Event persistence < 200 ms; UserActivity indexed on (user, createdAt) for 90-day queries
# Priority: Must (US-0101–US-0105), Should (US-0106)
# Status: Built (Phase 1) — search/view/wishlist tracking, US-0103 cabin default,
#         US-0105 cross-session return_visit and US-0304 destination extraction green.
#         US-0104 booking idempotency is DB-backed + /track whitelist; the two
#         in-process double-call scenarios stay RED by test design.

@EP-01 @activity-tracking
Feature: Activity Tracking
  As the platform
  I want to capture every meaningful authenticated user interaction as a UserActivity record
  So that the Preference Engine and Intent Engine are grounded in accurate behavioural data

  Background:
    Given the user is authenticated

  # ---------------------------------------------------------------------------
  # US-0101 — Track flight search activity
  # ---------------------------------------------------------------------------

  @US-0101 @must @flight-search
  Scenario: Flight search is recorded with full metadata
    Given the user submits a flight search with origin "Delhi", destination "Barcelona",
      depart date "2026-07-10", return date "2026-07-17", 2 passengers, and cabin "economy"
    When the flight search API processes the request
    Then a "flight_search" UserActivity record is created
    And the metadata contains destination "Barcelona", origin "Delhi", departDate "2026-07-10",
      returnDate "2026-07-17", passengers 2, and cabin "economy"

  @US-0101 @must @flight-search @destination-extraction
  Scenario: Flight search updates primaryPlanningDestination to the destination, not the origin
    Given the user submits a flight search with origin "Delhi" and destination "Barcelona"
    When the UserActivity record is processed by the activity tracker
    Then "primaryPlanningDestination" is updated to "Barcelona"
    And "primaryPlanningDestination" is not set to "Delhi"

  @US-0101 @must @flight-search @intent-scoring
  Scenario: Flight search increments the intent score by the configured weight
    Given the user has a current intent score of 0
    When a "flight_search" UserActivity record is created
    Then the intent score increments by the configured "flight_search" weight (5 points)

  @US-0101 @must @flight-search @auth-guard
  Scenario: Unauthenticated flight search is not tracked
    Given the user is not authenticated
    When the user submits a flight search for any destination
    Then no UserActivity record is created
    And the tracker returns { tracked: false, reason: "not authenticated" }

  # ---------------------------------------------------------------------------
  # US-0102 — Track hotel search activity
  # ---------------------------------------------------------------------------

  @US-0102 @must @hotel-search
  Scenario: Hotel search is recorded with full metadata
    Given the user submits a hotel search for city "Barcelona", check-in "2026-07-10",
      check-out "2026-07-17", and 2 guests
    When the hotel search API processes the request
    Then a "hotel_search" UserActivity record is created
    And the metadata contains city "Barcelona", checkIn "2026-07-10", checkOut "2026-07-17", and guests 2

  @US-0102 @must @hotel-search @intent-scoring
  Scenario: Hotel search increments the intent score by the configured weight
    Given the user has a current intent score of 0
    When a "hotel_search" UserActivity record is created
    Then the intent score increments by the configured "hotel_search" weight (5 points)

  @US-0102 @must @hotel-search @preference-engine
  Scenario: Hotel search contributes the searched city to the destination preference score
    Given the user submits a hotel search for city "Barcelona"
    When the preference engine aggregates the user's activity
    Then the "Barcelona" destination score is incremented in the user's preference profile

  @US-0102 @must @hotel-search @auth-guard
  Scenario: Unauthenticated hotel search is not tracked
    Given the user is not authenticated
    When the user submits a hotel search for any city
    Then no UserActivity record is created

  # ---------------------------------------------------------------------------
  # US-0103 — Track flight view events with cabin metadata  (fixes RC-8)
  # ---------------------------------------------------------------------------

  @US-0103 @must @flight-view @rc-8
  Scenario: Flight view event includes the cabin class of the viewed flight
    Given the user views a flight result with cabin class "business"
    When trackFlightView is called for that result
    Then a "flight_view" UserActivity record is created
    And the metadata includes cabin "business"

  @US-0103 @must @flight-view @rc-8
  Scenario: Cabin preference reflects the most-viewed cabin class
    Given the user has viewed 3 business-class flights and 0 economy-class flights
    When the preference engine aggregates the cabin preference profile
    Then "preferredCabin" is "business"
    And "preferredCabin" is not "economy"

  @US-0103 @must @flight-view @legacy-data
  Scenario: Flight view event without cabin data defaults to economy rather than undefined
    Given a flight result does not include a cabin field (legacy data)
    When trackFlightView is called for that result
    Then the UserActivity record records cabin as "economy"

  @US-0103 @must @flight-view @auth-guard
  Scenario: Unauthenticated user viewing a flight result is not tracked
    Given the user is not authenticated
    When the user views a flight result
    Then no UserActivity record is created

  # ---------------------------------------------------------------------------
  # US-0104 — Fix booking lifecycle event double-tracking  (fixes RC-4)
  # ---------------------------------------------------------------------------

  @US-0104 @must @booking-events @rc-4
  Scenario: Exactly one booking_started record is created per booking
    Given the user initiates a booking
    When the booking flow begins
    Then exactly one "booking_started" UserActivity record exists for that booking

  @US-0104 @must @booking-events @rc-4
  Scenario: Exactly one booking_completed record is created per booking
    Given the user completes a booking
    When the confirmation is returned
    Then exactly one "booking_completed" UserActivity record exists for that booking

  @US-0104 @must @booking-events @rc-4
  Scenario: Booking counters reflect single-count values after the fix
    Given the user has made exactly one booking
    When "breakdown.bookingsStarted" and "breakdown.bookingsCompleted" are inspected
    Then "breakdown.bookingsStarted" equals 1
    And "breakdown.bookingsCompleted" equals 1

  @US-0104 @must @booking-events @rc-4
  Scenario: booking_completed increments intent score exactly once by the configured weight
    Given the double-tracking fix is in place
    When the user completes a booking
    Then the intent score increments by the configured "booking_completed" weight (50 points) exactly once

  @US-0104 @must @booking-events @rc-4
  Scenario: Abandoned booking produces one booking_started with no corresponding booking_completed
    Given the user starts a booking but does not complete it
    When the booking flow ends without confirmation
    Then exactly one "booking_started" UserActivity record exists
    And no "booking_completed" UserActivity record exists for that booking

  # ---------------------------------------------------------------------------
  # US-0105 — Cross-session return visit detection  (fixes RC-3)
  # ---------------------------------------------------------------------------

  @US-0105 @must @return-visit @rc-3
  Scenario: Return visit is detected when the user resumes in a new browser session
    Given the user completed a flight search for "Barcelona" in a previous session more than 30 minutes ago
    When the user opens the application in a new browser tab or session
    And any activity event is tracked in the new session
    Then "maybeReturnVisit()" detects the prior session record
    And a "return_visit" UserActivity event is emitted

  @US-0105 @must @return-visit @rc-3
  Scenario: No return_visit event is emitted for a first-time user
    Given the user has no prior UserActivity records
    When their first activity event is tracked
    Then "maybeReturnVisit()" does not emit a "return_visit" event

  @US-0105 @must @return-visit @rc-3 @dedup
  Scenario: Return visit is not emitted for activity within the same session under 30 minutes
    Given the user's most recent prior activity was in the same session less than 30 minutes ago
    When a new activity event is tracked in the same session
    Then "maybeReturnVisit()" does not emit a "return_visit" event

  @US-0105 @must @return-visit @rc-3 @intent-scoring
  Scenario: Return visit event increments the intent score by the configured weight
    Given a "return_visit" UserActivity event is emitted
    When the intent score is recalculated
    Then the score increments by the configured "return_visit" weight (15 points)

  @US-0105 @must @return-visit @rc-3
  Scenario: Return visit counter increments by one for a repeat-searching user
    Given the user previously searched for "Barcelona" (the Barcelona scenario)
    When they return in a new session
    Then "breakdown.returnVisits" increments by 1

  # ---------------------------------------------------------------------------
  # US-0106 — Track wishlist add / remove events
  # ---------------------------------------------------------------------------

  @US-0106 @should @wishlist
  Scenario: Wishlist add event is recorded with destination metadata
    Given the user adds a flight or hotel to their wishlist
    When the wishlist add action is triggered
    Then a "wishlist_added" UserActivity record is created
    And the metadata contains the relevant destination

  @US-0106 @should @wishlist @intent-scoring
  Scenario: Wishlist add event increments the intent score by the configured weight
    Given a "wishlist_added" UserActivity record is created
    When the intent score is recalculated
    Then the score increments by the configured "wishlist_added" weight (5 points)

  @US-0106 @should @wishlist
  Scenario: Wishlist remove event is recorded with destination metadata
    Given the user removes an item from their wishlist
    When the wishlist remove action is triggered
    Then a "wishlist_removed" UserActivity record is created
    And the metadata contains the relevant destination

  @US-0106 @should @wishlist @auth-guard
  Scenario: Unauthenticated wishlist toggle is not tracked
    Given the user is not authenticated
    When the user clicks the wishlist toggle
    Then no UserActivity record is created

  @US-0106 @should @wishlist @preference-engine
  Scenario: Wishlisted destination appears in the user's destination preference score map
    Given the user has "wishlist_added" events for "Barcelona"
    When the preference engine aggregates the user's profile
    Then "Barcelona" appears in the destination score map
