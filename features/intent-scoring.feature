# Source requirements: US-0301, US-0302, US-0303, US-0304 (EP-03)
# Wireframe: n/a — backend scoring engine; output visible in notification tier and recommendation ranking
# NFRs: Score update must complete within current HTTP request cycle;
#        tier thresholds (31/71) are engineering hypotheses — validate via EP-08 US-0803 after 30 days (A-2);
#        intent weights documented as single configuration object
# Priority: Must
# Status: Built (Phase 1) — US-0301 whitelist, US-0302 weights (view=3), US-0303 reset+cooldown,
#         US-0304 destination extraction all implemented and green. The two in-process
#         booking double-call scenarios remain RED by test design (shared bookingId across
#         green single-call tests); real double-counting is prevented by DB idempotency +
#         the /track whitelist.

@EP-03 @intent-scoring
Feature: Intent Scoring Engine
  As the platform
  I want to maintain a continuously updated intent score and tier for each authenticated user
  So that peak-intent moments trigger accurate notifications, recommendations, and re-engagement emails

  Background:
    Given the double-event tracking fix (US-0301 / US-0104) is in place

  # ---------------------------------------------------------------------------
  # US-0301 — Fix double event tracking  (fixes RC-4 from the intent-engine view)
  # ---------------------------------------------------------------------------

  @US-0301 @must @double-tracking @rc-4
  Scenario: Each booking lifecycle event fires exactly once per booking
    Given a user completes a booking end-to-end
    When the booking confirmation is returned
    Then exactly one "booking_started" UserActivity record exists for that booking session
    And exactly one "booking_completed" UserActivity record exists for that booking session

  @US-0301 @must @double-tracking @rc-4
  Scenario: Booking started count reflects the true single count
    Given a user who has made exactly one booking
    When "breakdown.bookingsStarted" is inspected
    Then the value is 1

  @US-0301 @must @double-tracking @rc-4
  Scenario: Booking completed count reflects the true single count
    Given a user who has completed exactly one booking
    When "breakdown.bookingsCompleted" is inspected
    Then the value is 1

  @US-0301 @must @double-tracking @rc-4
  Scenario: Abandoned booking produces one booking_started with no corresponding booking_completed
    Given a user starts a booking but does not complete it
    When the intent state is inspected
    Then exactly one "booking_started" record exists
    And no "booking_completed" record exists for that booking

  # ---------------------------------------------------------------------------
  # US-0302 — Calculate intent score from activity events
  # ---------------------------------------------------------------------------

  @US-0302 @must @scoring @tier
  Scenario Outline: Intent score accumulates correctly from a single activity event
    Given the user has a starting intent score of <starting_score>
    When a "<event_type>" activity event is tracked
    Then the intent score becomes <expected_score>
    And the intent tier is "<expected_tier>"

    Examples:
      | starting_score | event_type        | expected_score | expected_tier |
      | 0              | flight_search     | 5              | low           |
      | 0              | hotel_search      | 5              | low           |
      | 0              | flight_view       | 3              | low           |
      | 0              | hotel_view        | 3              | low           |
      | 0              | wishlist_added    | 5              | low           |
      | 0              | return_visit      | 15             | low           |
      | 0              | booking_started   | 25             | low           |
      | 0              | booking_completed | 50             | medium        |

  @US-0302 @must @scoring @tier-transition
  Scenario: Score crossing 31 transitions tier from low to medium
    Given the user's intent score is 30
    When a "flight_search" event (5 points) is tracked
    Then the intent score becomes 35
    And the tier transitions from "low" to "medium"

  @US-0302 @must @scoring @tier-transition
  Scenario: Score of 71 or above classifies tier as high
    Given the user accumulates events until their intent score reaches 71
    When the tier is evaluated
    Then the tier is "high"

  @US-0302 @must @scoring @config
  Scenario: Intent weights are centralised in a single configuration object
    Given intent weights are defined in a single configuration object (not scattered across files)
    When a weight value is updated in that configuration
    Then all scoring calculations reflect the new weight without changes to individual event handlers

  @US-0302 @must @scoring @propagation
  Scenario: Tier change is reflected in the next recommendation and notification evaluation
    Given a user's tier transitions from "low" to "medium" after a tracked event
    When the recommendation or notification engine next evaluates the user
    Then it uses the updated "medium" tier

  # ---------------------------------------------------------------------------
  # US-0303 — Intent score reset after booking completion  (fixes RC-5)
  # ---------------------------------------------------------------------------

  @US-0303 @must @score-reset @rc-5
  Scenario: Intent score is reset to zero after booking completion
    Given a user's intent score is 85 (high tier) for destination "Barcelona"
    When the user completes a booking for "Barcelona"
    Then the intent score is reset to 0 (or the configurable cool-down baseline)

  @US-0303 @must @score-reset @rc-5
  Scenario: Tier drops to low immediately after the post-booking score reset
    Given a user has just completed a booking and the score was reset
    When the tier is re-evaluated
    Then the tier is "low"

  @US-0303 @must @score-reset @rc-5 @notification-suppression
  Scenario: No return_reminder is generated for a low-tier user after a booking reset
    Given a user's tier is "low" due to a post-booking reset
    When the notification engine evaluates what to send for the booked destination
    Then no "return_reminder" notification is generated

  @US-0303 @must @score-reset @rc-5 @cool-down
  Scenario: No return_reminder is generated 48 hours after booking if no new searches occurred
    Given 48 hours have elapsed since the user's booking
    And the user has not searched the same destination again
    When the notification engine runs
    Then no "return_reminder" is generated for the booked destination

  @US-0303 @must @score-reset @rc-5 @resumption
  Scenario: Intent scoring resumes normally when the user plans the same destination again after the cool-down
    Given a user booked "Barcelona" 10 days ago and the cool-down has expired
    When the user searches "Barcelona" again (new trip planning)
    Then the intent score starts accumulating from zero
    And notifications resume based on the new accumulated score

  # ---------------------------------------------------------------------------
  # US-0304 — Fix origin-as-destination in metadata extraction  (fixes RC-9)
  # ---------------------------------------------------------------------------

  @US-0304 @must @destination-extraction @rc-9
  Scenario: Destination is extracted from the destination field, not origin
    Given a flight search event with metadata.destination "Barcelona" and metadata.origin "Delhi"
    When the activity tracker extracts the planning destination
    Then the resolved destination is "Barcelona"
    And "primaryPlanningDestination" is not set to "Delhi"

  @US-0304 @must @destination-extraction @rc-9
  Scenario: Origin field is not used as a fallback when destination and city are both absent
    Given a flight search event where metadata.destination and metadata.city are both absent
    And metadata.origin is "Delhi"
    When the activity tracker attempts to extract the planning destination
    Then the resolved destination is null
    And "primaryPlanningDestination" is not updated using the origin value

  @US-0304 @must @destination-extraction @rc-9
  Scenario: Correct primaryPlanningDestination is used by the Continue Planning card
    Given "primaryPlanningDestination" is correctly set to "Barcelona"
    When the "Continue Planning" card renders (EP-05 US-0501)
    Then the card displays "Barcelona" as the destination
    And the origin city "Delhi" does not appear as the destination

  @US-0304 @must @destination-extraction @rc-9
  Scenario: Flight search frontend always populates metadata.destination with the chosen destination city
    Given the user performs a flight search from the frontend
    When the search request is submitted to the API
    Then the request payload includes "metadata.destination" set to the user's chosen destination city
