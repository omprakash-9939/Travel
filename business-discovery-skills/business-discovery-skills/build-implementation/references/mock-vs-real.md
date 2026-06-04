# What to mock, and what to make real (travel POC)

A POC has to feel real where it counts and stay cheap everywhere else. Decide deliberately rather than mocking everything (a hollow demo) or building everything (slow, beyond a POC).

## Default split for a travel POC
**Make it real:**
- **The core domain in a real database.** The entities the demo is about — searches, fare quotes, bookings/itineraries, travellers — persist for real, so the demo survives a refresh and feels genuine. This is what reviewers actually judge.
- **Auth, but simple.** Use the provider's auth (sign-up/sign-in, sessions); don't roll your own. See `data-and-auth`.
- **The primary happy path** end to end against the real database (e.g. search → select fare → create booking → see itinerary).

**Mock or stub (behind an interface):**
- **GDS / aggregators / channel managers** — flight/hotel search and availability. Return believable canned results so the flow works without a live supplier feed.
- **Payment gateway** — never take real card data on a POC; stub a "payment succeeded/failed" response. (PCI: don't store raw card data — see the domain-SME and security notes.)
- **Confirmation email / SMS** — log "would send" instead of integrating a provider.
- **Mapping, loyalty, ancillary suppliers** — fake the contract, note as follow-ups.

## A quick test
For each dependency ask: *does the demo's credibility depend on this being real?*
- **Yes** → make it real (and keep it in the database if it's data, e.g. the booking record).
- **No** → mock it behind an interface, and write down that it's mocked.

## Keep it swappable and honest
- Put each mocked dependency behind a thin interface (e.g. a `FlightSearchProvider`, a `PaymentGateway`), so swapping a real supplier in later is a contained change — and so tests can inject the mock while the app uses the real core.
- **Be explicit.** List in `build-context.md` what's real and what's mocked, so no one mistakes the POC for finished. A clearly-labelled mocked GDS feed is fine; a hidden one is a trap.
- In tests, mock the same edges so tests stay fast and deterministic, but exercise the real booking core (see `../../bdd-to-tdd/references/red-green-and-review.md`).
