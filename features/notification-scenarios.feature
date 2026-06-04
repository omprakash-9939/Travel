# Source requirements: US-0904, US-0905 (EP-09); complements EP-06 notification-engine.feature
# Wireframe: in-app notification banner (homepage); scenario via /api/personalization/scenario
# NFRs: exactly one primary notification per non-silent scenario; cooled-down destinations never nudged
# Priority: Should
# Status: Built — notificationEngine matrix + scripts/simulatePersonalization harness (green tests)

@EP-09 @notification-scenarios
Feature: Intent x Engagement notification scenario matrix
  As a traveller
  I want the notification I receive to match both my readiness and my involvement
  So that I am nudged when ready, inspired when exploring, and left alone after booking

  @US-0904 @matrix
  Scenario Outline: The matrix selects a scenario from both axes
    Given an intent tier of "<intent>" and an engagement tier of "<engagement>"
    And a "rising" trajectory
    When the notification scenario is selected
    Then the scenario is "<scenario>"

    Examples:
      | intent | engagement | scenario       |
      | high   | low        | decisive_nudge |
      | high   | medium     | closing        |
      | high   | high       | closing        |
      | medium | low        | reengage       |
      | medium | medium     | standard_recs  |
      | medium | high       | guided         |
      | low    | low        | dormant        |
      | low    | medium     | inspire        |
      | low    | high       | inspire        |

  @US-0904 @override @post-booking
  Scenario: Post-booking trajectory suppresses all nudges
    Given a high-intent, high-engagement user whose trajectory is "post-booking"
    When the notification scenario is selected
    Then the scenario is "suppressed"
    And no notification is produced

  @US-0904 @override @falling
  Scenario: A falling non-high-intent user is re-engaged
    Given a medium-intent, medium-engagement user whose trajectory is "falling"
    When the notification scenario is selected
    Then the scenario is "reengage"

  @US-0904 @cooldown
  Scenario: A destination in booking cool-down is never the subject of a nudge
    Given a high-intent user whose planning destination is in booking cool-down
    When the scenario notification is built
    Then no notification is produced

  # ── US-0905: the six scripted journeys (npm run simulate:personalization) ──

  @US-0905 @journey
  Scenario: Post-booking journey is silent
    Given the "post_booking_suppression" journey is replayed
    Then the intent score is 0
    And the scenario is "suppressed"
    And no notification is produced

  @US-0905 @journey
  Scenario: Low-intent high-engagement browser is inspired, never hard-sold
    Given the "low_intent_high_engagement" journey is replayed
    Then the intent tier is "low"
    And the scenario is "inspire"

  @US-0905 @journey
  Scenario: Falling journey is re-engaged
    Given the "falling_stalled" journey is replayed
    Then the trajectory is "falling"
    And the scenario is "reengage"

  @US-0905 @journey
  Scenario: Abandoned hot lead is given a closing nudge
    Given the "abandoned_booking" journey is replayed
    Then the intent tier is "high"
    And the scenario is "closing"
    And a notification is produced
