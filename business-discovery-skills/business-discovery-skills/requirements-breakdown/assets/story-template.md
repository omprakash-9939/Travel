---
id: US-0101
title: Search flights
epic: EP-01
owner: <name>
reviewer: <name>
status: Draft        # Draft | In review | Approved
priority: Must       # Must | Should | Could | Won't-this-time
wireframe: <flight-search screen / Figma link or "n/a">
feature_file: <features/flight-search.feature once created, else "pending">
---

# US-0101 — Search flights

**As a** leisure traveller
**I want** to search flights for my route and dates
**So that** I can choose a fare and book

## Acceptance criteria (testable)
- Given a valid route and dates, when I search, then I see fares ordered by price.
- Given no availability, when I search, then I'm told and offered to change dates.

## States to cover
<results / empty / loading / error — whichever apply on the wireframe>

## Traceability
- Up: requirement <FR-…> → objective <n>
- Across: wireframe screen <flight-search>
- Forward: feature file <features/flight-search.feature> → tests <…>

## Notes / assumptions / dependencies
<e.g. depends on the (mocked) flight-search provider; re-validate price before booking — see US-0102.>
