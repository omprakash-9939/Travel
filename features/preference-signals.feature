# Source requirements: US-0902 (EP-09)
# Wireframe: n/a — backend preference derivation; visible via /api/personalization/preferences
# NFRs: derived over a 90-day window alongside destination/airline/cabin aggregation
# Priority: Should
# Status: Built (Phase 2) — preferenceEngine + timeOfDay; flight-view route populates metadata

@EP-09 @preference-signals
Feature: Derived preference signals (time-of-day, baggage, price)
  As a traveller
  I want the app to learn when I like to fly and my fare and price posture
  So that recommendations and notifications match how I actually book

  @US-0902 @time-of-day
  Scenario: Dominant departure time-of-day is learned
    Given the user mostly views flights departing between 05:00 and 07:59
    When preferences are aggregated
    Then "departureTimePreference" is "early-morning"

  @US-0902 @price
  Scenario Outline: Price sensitivity is banded from average viewed fare
    Given the user's average viewed flight price is <avg>
    When preferences are aggregated
    Then "priceSensitivity" is "<band>"

    Examples:
      | avg    | band    |
      | 9000   | budget  |
      | 30000  | mid     |
      | 60000  | premium |

  @US-0902 @baggage
  Scenario: Baggage posture is classified from viewed allowances
    Given the user mostly views fares with a 15 kg baggage allowance
    When preferences are aggregated
    Then "baggagePreference" is "light"

  @US-0902 @refundable
  Scenario: Refundable preference reflects the majority of viewed fares
    Given a majority of viewed flights are refundable
    When preferences are aggregated
    Then "prefersRefundable" is true

  @US-0902 @cold-start
  Scenario: A user with no flight signals has null/unknown preference signals
    Given a user who has only searched hotels
    When preferences are aggregated
    Then "departureTimePreference" is null
    And "priceSensitivity" is "unknown"
