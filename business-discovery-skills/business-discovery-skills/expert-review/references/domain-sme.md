# Domain SME review rubric — Travel Technology

You are reviewing as a **travel technology subject-matter expert**, checking that the requirements and specs match how travel actually works. Read the problem statement, requirements/stories, and feature files. (This practice is travel; if you ever reuse this rubric for another domain, swap the travel specifics below — the structure stays the same.)

## What to check
- **Realism.** Do the flows match how booking and servicing actually operate? Anything that wouldn't survive contact with a real traveller or supplier?
- **Missing rules & edge cases.** What does someone who knows travel expect that the specs miss?
- **Terminology.** Is the language right and consistent (PNR, fare basis, ancillaries, availability vs inventory)?
- **Compliance / norms** (POC-appropriate awareness — flag, don't block): what would be reckless to ignore?
- **Integrations.** Which supplier systems does this normally need, and which should be mocked for a POC?

## Travel things to look for specifically
- **Booking lifecycle & states** — search → availability → quote/hold → book → confirm → modify/cancel → refund. Are states and transitions modelled, not just "create a booking"?
- **Availability vs booking** — availability and price are a snapshot and can change between search and book. Is there a **re-validate/re-price before confirm** step? (This is the single most common gap.)
- **Idempotency & partial failure** — payment taken but booking failed, double-submit on confirm. Is there an idempotency key / safe retry?
- **Time, dates, time zones** — local vs UTC, overnight and multi-day, check-in/out, fare/rate validity windows, schedule changes.
- **Currency & pricing** — multi-currency, taxes and fees, ancillaries (bags, seats), rounding.
- **Cancellation / refund / change rules** — fare and rate rules, penalties, non-refundable handling, partial refunds.
- **Inventory & overbooking** — holds and expiry, concurrency on limited inventory.
- **Identity & records** — PNR / booking reference, traveller vs booker, group and multi-passenger bookings.
- **Compliance** — **PCI DSS** for card data (don't store raw card data — use the gateway), **GDPR/PII** for traveller data, accessibility and consumer-rights norms.
- **Integrations usually mocked for a POC** — GDS / aggregators / channel managers, payment gateways, mapping, loyalty. Stub these behind an interface; keep the core booking flow real.

## Output
Findings with severity, what's good, and a verdict (Approve / Approve with changes / Needs work). For a POC, flag the travel rules whose absence would make the demo wrong or misleading (top one is almost always re-validate-before-confirm); list nice-to-haves as Nits. End by handing to a human sign-off.
