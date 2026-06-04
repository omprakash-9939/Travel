# Threat Model: <Initiative name>

> Links: [System context](./system-context.md) · [Constraints](./constraints.md)
> Approach: lightweight STRIDE over the data flows. Right-size it to a POC.

## Assets to protect
<What matters: user data / PII, credentials, money, availability, integrity of records.>

## Trust boundaries & data flows
<Where data crosses a boundary (browser → API, API → DB, → third party). List the flows; these are where threats live.>

## Threats (STRIDE-lite)
| Flow / component | Threat (S/T/R/I/D/E) | Impact | Likelihood | Mitigation | Status |
|---|---|---|---|---|---|
| Traveller login | Spoofing — credential stuffing | Account takeover | Med | Rate-limit + provider auth | Planned |
| Booking lookup (API → DB) | Information disclosure — read another traveller's booking | PII / itinerary leak | Med | Row-level security / authz on traveller id | Planned |
| Payment step | Tampering — price manipulation; card data exposure | Fraud / PCI breach | Med | Re-price server-side; never store raw card data (use gateway) | Planned |

> STRIDE = Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.

## Top risks & decisions
<The few threats worth acting on now, and any security decision worth an ADR (auth model, encryption, secrets handling).>

## Security requirements (feed the build & tests)
- <e.g. all secrets via env/secret manager; none in repo>
- <e.g. authz enforced server-side on every data access>
- <e.g. input validation on all external inputs>
