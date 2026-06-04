# Source requirements: US-0401, US-0402, US-0403 (EP-04)
# Wireframe: n/a — backend engine; output visible in homepage carousel (EP-05 US-0502)
# NFRs: RecommendationCache TTL 6 hours; cold-start fallback must always return results;
#        real-time notification path must complete within the current HTTP request cycle;
#        cache TTL to be reviewed after EP-08 hit/miss data (A-5)
# Priority: Must (US-0401, US-0402), Should (US-0403)
# Status: Draft — awaiting verification

@EP-04 @recommendation-engine
Feature: Recommendation Engine
  As the platform
  I want to build personalised flight and hotel recommendations per user
  So that each user sees content matched to their active planning intent or historical preferences

  # ---------------------------------------------------------------------------
  # US-0401 — Recommendations from active planning intent  (fixes RC-10)
  # ---------------------------------------------------------------------------

  @US-0401 @must @intent-recommendations @rc-10
  Scenario: Active planning intent takes priority over all-time preference history
    Given the user's primaryPlanningDestination is "Barcelona"
    And their all-time top destination is "Mumbai"
    When recommendations are built
    Then Barcelona flights and hotels appear first in the recommendation list

  @US-0401 @must @intent-recommendations @fallback
  Scenario: Preference history is used when there is no active planning intent
    Given the user has no primaryPlanningDestination
    And their favoriteDestinations are ["Dubai", "Singapore"]
    When recommendations are built
    Then Dubai and Singapore flights and hotels are returned

  @US-0401 @must @intent-recommendations @cold-start
  Scenario: Cold-start fallback is used when there is no intent and no preference history
    Given the user has no primaryPlanningDestination
    And the user has no preference history
    When recommendations are built
    Then the cold-start fallback destination list is returned

  @US-0401 @must @intent-recommendations @cache
  Scenario: Recommendation results are written to cache after being built
    Given recommendations are successfully built for the user
    When the build completes
    Then the results are written to RecommendationCache with the configured 6-hour TTL

  @US-0401 @must @intent-recommendations @error-handling
  Scenario: Recommendation engine error returns cold-start fallback rather than an empty response
    Given buildRecommendations() throws an error for the user
    When the error is caught
    Then the user receives the cold-start fallback list
    And the response is not empty

  # ---------------------------------------------------------------------------
  # US-0402 — Recommendations from 90-day preference history (fallback path)
  # ---------------------------------------------------------------------------

  @US-0402 @must @preference-recommendations
  Scenario: Preference history destinations drive recommendations when there is no active intent
    Given the user's primaryPlanningDestination is null
    And their favoriteDestinations are ["Dubai", "Singapore"]
    When recommendations are built
    Then Dubai and Singapore flights and hotels are returned

  @US-0402 @must @preference-recommendations @unavailable-destination
  Scenario: Unavailable destination is skipped and the next favourite is tried
    Given favoriteDestinations includes a destination with no available flights or hotels in the database
    When the recommendation query runs
    Then that destination is skipped
    And results from the next available favourite destination are returned
    And the overall recommendation response is not empty

  @US-0402 @must @preference-recommendations @cache-hit
  Scenario: Cached recommendations are served within the 6-hour TTL without a new database query
    Given recommendations were written to RecommendationCache less than 6 hours ago
    When the user requests recommendations
    Then the cached result is returned
    And no new database query is issued

  @US-0402 @must @preference-recommendations @cache-invalidation
  Scenario: Cache is invalidated after a booking and fresh recommendations are built on next request
    Given the RecommendationCache has been invalidated (e.g. via invalidateCache after a booking)
    When the user next requests recommendations
    Then a fresh recommendation query is run against the database

  # ---------------------------------------------------------------------------
  # US-0403 — Decouple notification generation from preference aggregation batch  (fixes RC-2)
  # ---------------------------------------------------------------------------

  @US-0403 @should @notification-decoupling @rc-2
  Scenario: return_reminder notification is evaluated and created within the same request cycle as the return_visit event
    Given a user's intent tier is "medium" or "high"
    When a "return_visit" event fires for that user
    Then a "return_reminder" notification is evaluated and created within the same HTTP request cycle
    And the notification is not deferred to the next 2-hour aggregation batch

  @US-0403 @should @notification-decoupling @rc-2 @visibility
  Scenario: return_reminder is visible to the user without a page reload
    Given a "return_reminder" notification has just been created via the real-time path
    When the user views their notification bell
    Then the new notification is visible without requiring a full page reload

  @US-0403 @should @notification-decoupling @batch-independence
  Scenario: 2-hour aggregation batch updates preferences but does not re-generate already-sent notifications
    Given a "return_reminder" was sent in the current session via the real-time path
    When the 2-hour aggregation batch runs
    Then the batch updates preference profiles and recommendation rankings
    And the batch does not generate a duplicate "return_reminder" for the same destination in the same session

  @US-0403 @should @notification-decoupling @error-handling
  Scenario: Real-time notification failure degrades gracefully without a hard error
    Given the real-time notification check encounters a database timeout
    When the error occurs
    Then the failure is logged
    And no notification is sent for that session
    And no hard error is returned to the user

  @US-0403 @should @notification-decoupling @batch-resilience
  Scenario: Real-time notification path works independently when the batch is delayed or has not run
    Given the 2-hour aggregation batch has not run or is delayed
    When a "return_visit" event fires for an eligible user
    Then the real-time notification path evaluates and generates the notification independently
