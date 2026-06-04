# Source requirements: US-0901, US-0903 (EP-09)
# Wireframe: n/a — backend engagement axis; visible via /api/personalization/scenario
# NFRs: engagement computed over a 30-day window; intent half-life 7 days (estimate, calibrate via EP-08)
# Priority: Should
# Status: Built (Phase 2) — engagementEngine.computeAndPersist wired into the aggregation job

@EP-09 @engagement-scoring
Feature: Engagement scoring and intent decay
  As the platform
  I want an engagement score and a cross-session trajectory separate from intent
  So that I can distinguish involved browsers from decisive buyers and react as intent rises or fades

  @US-0901 @engagement
  Scenario: A single short session yields low engagement
    Given a user with one session containing two events
    When engagement is computed
    Then the engagement tier is "low"

  @US-0901 @engagement
  Scenario: Many sessions with long dwell and broad variety yield high engagement
    Given a user with eight sessions across several destinations with long time-on-page
    When engagement is computed
    Then the engagement score is at least 60
    And the engagement tier is "medium" or "high"

  @US-0901 @engagement @independence
  Scenario: Engagement is independent of intent
    Given a user who browses widely but never starts a booking
    When intent and engagement are computed
    Then the intent tier is "low"
    And the engagement tier is "medium" or "high"

  @US-0903 @decay
  Scenario: Intent decays toward zero with inactivity
    Given an intent score of 80 whose last activity was 7 days ago
    When the decay step runs
    Then the intent score is approximately 40

  @US-0903 @trajectory
  Scenario Outline: Trajectory reflects recent vs prior activity
    Given recent-window intent points of <recent> and prior-window points of <prior>
    And no active booking cool-down
    When the trajectory is determined
    Then the trajectory is "<trajectory>"

    Examples:
      | recent | prior | trajectory |
      | 30     | 5     | rising     |
      | 5      | 30    | falling    |
      | 0      | 0     | new        |

  @US-0903 @trajectory @post-booking
  Scenario: An active booking cool-down forces the post-booking trajectory
    Given a user with a booking cool-down started today
    When the trajectory is determined
    Then the trajectory is "post-booking"
    And the intent score is not decayed further
