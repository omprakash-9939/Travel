# Source requirements: US-0601, US-0602, US-0603, US-0604 (EP-06)
# Wireframe: In-app notification bell — return_reminder card (US-0602);
#            n/a for US-0601 (suppression), US-0603 (suppression), US-0604 (email)
# NFRs: price_drop feature flag must default OFF to remove legal exposure (RC-6);
#        return_reminder must fire within current HTTP request cycle (RC-2);
#        post-booking cool-down minimum 7 days; SendGrid failure must not crash intent pipeline;
#        email dedup window 7 days per destination
# Priority: Must (US-0601, US-0603), Should (US-0602, US-0604)
# Status: Partially built (Phase 1) — US-0601 price_drop flag (default OFF) and US-0603
#         post-booking cool-down suppression implemented and green; buildNotifications
#         exported. US-0602 real-time path and US-0604 SendGrid re-engagement pending.

@EP-06 @notification-engine
Feature: Personalised Notification Engine
  As the platform
  I want to deliver timely, accurate, and trustworthy notifications that match real user intent
  So that high-intent users are re-engaged at the right moment without eroding trust or creating legal risk

  # ---------------------------------------------------------------------------
  # US-0601 — Disable fabricated price-drop notification  (fixes RC-6)  Priority 0
  # ---------------------------------------------------------------------------

  @US-0601 @must @price-drop @rc-6 @feature-flag
  Scenario: price_drop notification is not generated when the feature flag is off
    Given "ENABLE_PRICE_DROP_NOTIFICATIONS" is false (or absent from environment)
    When buildNotifications() runs for any user
    Then no "price_drop" notification is generated

  @US-0601 @must @price-drop @rc-6 @feature-flag
  Scenario: No price_drop notification appears in the notification bell when the flag is off
    Given "ENABLE_PRICE_DROP_NOTIFICATIONS" is false
    When any user opens their notification bell
    Then no "price_drop" notification is visible

  @US-0601 @must @price-drop @rc-6 @other-notifications
  Scenario: Disabling price_drop does not affect other notification types
    Given "ENABLE_PRICE_DROP_NOTIFICATIONS" is false
    When buildNotifications() runs
    Then "return_reminder" and "selling_fast" notifications continue to generate normally for eligible users

  @US-0601 @must @price-drop @rc-6 @re-enablement
  Scenario: price_drop generates normally when the feature flag is explicitly enabled
    Given "ENABLE_PRICE_DROP_NOTIFICATIONS" is true
    When buildNotifications() runs
    Then "price_drop" notifications are generated as before (backward compatibility preserved)

  @US-0601 @must @price-drop @rc-6 @stale-notifications
  Scenario: Historic price_drop notifications are not shown after the flag is disabled
    Given a user has an existing "price_drop" notification from before the flag was disabled
    When the user opens their notification bell
    Then the historic notification is either not shown or is clearly marked as a stale estimate

  # ---------------------------------------------------------------------------
  # US-0602 — Return_reminder in near-real-time  (fixes RC-2)
  # ---------------------------------------------------------------------------

  @US-0602 @should @return-reminder @rc-2
  Scenario: return_reminder is created within the same request cycle as the qualifying return_visit
    Given a user's "return_visit" event fires
    And their intent tier is "medium" or "high"
    When the event is processed
    Then a "return_reminder" notification is created in the user's notification list within the same HTTP request cycle

  @US-0602 @should @return-reminder @rc-2 @visibility
  Scenario: return_reminder is visible in the notification bell without a page reload
    Given a "return_reminder" has just been created in real time
    When the user checks their notification bell
    Then the notification is visible without requiring a full page reload

  @US-0602 @should @return-reminder @rc-2 @content
  Scenario: return_reminder notification content includes destination and a pre-filled search link
    Given a "return_reminder" is created for destination "Barcelona"
    When it renders in the notification bell
    Then it reads "Still thinking about Barcelona? Continue planning →"
    And it includes a link to flight search results pre-filled for "Barcelona"

  @US-0602 @should @return-reminder @rc-2 @dedup
  Scenario: No duplicate return_reminder is generated within the 48-hour dedup window
    Given a "return_reminder" was already sent within the last 48 hours for "Barcelona"
    When a new "return_visit" event fires for the same destination
    Then no new "return_reminder" notification is generated

  @US-0602 @should @return-reminder @rc-2 @tier-gate
  Scenario: No return_reminder is generated when the user's intent tier is low
    Given the user's intent tier is "low"
    When a "return_visit" event fires
    Then no "return_reminder" notification is generated

  # ---------------------------------------------------------------------------
  # US-0603 — Suppress notifications after booking completion  (fixes RC-5)
  # ---------------------------------------------------------------------------

  @US-0603 @must @post-booking-suppression @rc-5
  Scenario: All destination-specific notifications are cleared from sentNotifications after booking
    Given a user completes a booking for "Barcelona"
    When "booking_completed" fires
    Then all "return_reminder" and "selling_fast" notifications for "Barcelona" are cleared from sentNotifications[]

  @US-0603 @must @post-booking-suppression @rc-5
  Scenario: No new notifications are generated for the booked destination during the cool-down period
    Given a user has completed a booking for "Barcelona"
    And the intent score has been reset (US-0303)
    When the notification engine evaluates the user within 7 days of the booking
    Then no new "Barcelona" notifications are generated

  @US-0603 @must @post-booking-suppression @rc-5 @cool-down-expiry
  Scenario: Intent scoring and notifications resume normally after the cool-down expires
    Given a user booked "Barcelona" more than 7 days ago
    And the user searches "Barcelona" again (new trip planning)
    When intent events accumulate past the tier thresholds
    Then the intent score starts from zero
    And notifications resume based on the new accumulated score

  @US-0603 @must @post-booking-suppression @rc-5 @other-destinations
  Scenario: Notifications for other active destinations are unaffected by the booking cool-down
    Given a user has completed a booking for "Barcelona"
    And the user has separate active intent for "Singapore"
    When the notification engine evaluates the user
    Then "Singapore" notifications are still generated normally

  @US-0603 @must @post-booking-suppression @rc-5 @bell-state
  Scenario: No stale urgency notifications for the booked destination appear in the notification bell
    Given the booking cool-down is active for "Barcelona"
    When the user opens their notification bell
    Then no "Barcelona" urgency notifications ("return_reminder", "selling_fast") are displayed

  # ---------------------------------------------------------------------------
  # US-0604 — SendGrid email re-engagement on intent threshold  (fixes RC-11)
  # ---------------------------------------------------------------------------

  @US-0604 @should @sendgrid-email @rc-11
  Scenario: Re-engagement email is triggered when intent score crosses the medium threshold for the first time in 7 days
    Given an authenticated user's intent score crosses 31 ("low → medium") for the first time in 7 days
    When the threshold crossing is detected
    Then a SendGrid email is triggered to the user's registered email address

  @US-0604 @should @sendgrid-email @rc-11 @content
  Scenario: Re-engagement email references the user's planning destination and includes a direct search link
    Given the re-engagement email has been triggered for destination "Barcelona"
    When the email is delivered to the user's inbox
    Then the email references "Barcelona" (e.g. "You were looking at Barcelona")
    And it includes a direct link to pre-filled flight search results for "Barcelona"

  @US-0604 @should @sendgrid-email @rc-11 @dedup
  Scenario: No duplicate email is sent if a re-engagement email was already sent within 7 days for the same destination
    Given a re-engagement email for "Barcelona" was sent within the last 7 days
    When the intent score crosses 31 again for "Barcelona"
    Then no duplicate email is sent

  @US-0604 @should @sendgrid-email @rc-11 @post-booking-suppression
  Scenario: No re-engagement email is sent for a booked destination during the cool-down period
    Given a user has completed a booking for "Barcelona"
    And the booking cool-down is active
    When the intent score would otherwise trigger an email
    Then no re-engagement email is triggered for "Barcelona"

  @US-0604 @should @sendgrid-email @rc-11 @missing-api-key
  Scenario: Missing SendGrid API key causes graceful failure without crashing the intent pipeline
    Given "SENDGRID_API_KEY" is not configured in the environment
    When the intent threshold is crossed and an email trigger is attempted
    Then the trigger fails gracefully
    And a warning is logged
    And the intent scoring pipeline continues normally

  @US-0604 @should @sendgrid-email @rc-11 @api-error
  Scenario: SendGrid API error is logged and the intent pipeline continues without interruption
    Given the SendGrid API returns an error when the trigger is attempted
    When the error occurs
    Then the failure is logged
    And the intent scoring pipeline continues processing without interruption
