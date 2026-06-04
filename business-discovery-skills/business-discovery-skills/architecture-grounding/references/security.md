# Lightweight security & threat modelling

Right-size this to a POC: a focused pass that catches the threats that matter, not a 50-page assessment.

## A 4-question pass
1. **What are we protecting?** User data/PII, credentials, money, availability, record integrity.
2. **Where does data cross a boundary?** Browser→API, API→DB, API→third party. Threats concentrate at boundaries.
3. **What could go wrong at each?** Use STRIDE as a checklist per flow:
   - **S**poofing (identity), **T**ampering (data/integrity), **R**epudiation (no audit trail),
   - **I**nformation disclosure (leaks), **D**enial of service (availability), **E**levation of privilege (authz).
4. **What will we do about the ones that matter?** Mitigate, accept (with reason), or record as an ADR.

## Baseline controls worth defaulting to
- **AuthN/AuthZ:** delegate authentication to a proven provider; enforce authorization server-side on every data access (don't trust the client). Use row-level security where the database supports it.
- **Secrets:** env vars / secret manager, never in the repo; commit only `.env.example`; rotate keys.
- **Input handling:** validate external input; parameterise queries (let the ORM/driver do it) to prevent injection; encode output to prevent XSS.
- **Transport & storage:** TLS everywhere; encrypt sensitive data at rest; minimise the PII you collect.
- **Least privilege:** scope database roles, API keys, and tokens to the minimum needed.
- **Dependencies:** track and patch known-vulnerable packages.

## Where it connects
- Capture the model in `threat-model.md`; its **security requirements become non-functional requirements** the build and tests must satisfy.
- `data-and-auth` implements the auth/authz/secrets controls; `build-implementation` honours them per story; `deploy` keeps secrets in env.
- For deeper auditing, the public Trail of Bits static-analysis skills (CodeQL/Semgrep) are a good complement — see the collection README.
