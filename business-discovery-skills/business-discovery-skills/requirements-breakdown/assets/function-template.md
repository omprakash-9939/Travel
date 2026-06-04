---
id: FN-010101
title: Validate search input (route + dates)
story: US-0101
owner: <name>
status: Draft        # Draft | In review | Approved
---

# FN-010101 — Validate search input (route + dates)

## Purpose
<The build-ready unit — e.g. "Validate the origin, destination, and dates before calling the search provider.">

## Behaviour
- **Input:** origin, destination, depart date, optional return date, passenger count
- **Process:** reject same origin/destination, past dates, return-before-depart; normalise airport codes
- **Output:** a valid search request, or field-level validation errors
- **Errors / edge cases:** missing fields, invalid airport code, dates out of sellable window

## Serves
- Acceptance criteria: US-0101 (valid search shows fares; invalid input is rejected)
- Non-functional constraints that apply: <input validation (security); minimal accessibility on the form>

## Build notes (for the agent)
<Keep aligned with architecture/build-context.md; the search provider is mocked for the POC.>
