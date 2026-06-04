---
name: data-and-auth
description: Set up the application's database and authentication without locking the project to one vendor. Use this for the data/auth step of a build, or whenever someone says "set up the database", "add login/auth", "users and sessions", "Supabase", "set up the backend", "persistence", or "row-level security". It derives the schema from the architecture's data model, picks a provider (Supabase or similar in place of a hyperscaler, or your own per stack), sets up auth that matches the stories, keeps secrets in env, and — importantly — puts the provider behind a thin data/auth layer so it can be swapped. Supports Node, .NET, and Java patterns.
---

# Data & Auth

Persistence and identity are where a POC quietly gets coupled to a vendor. This skill provides both while keeping the project **swappable**: the database lives behind a thin data layer and auth behind an interface, so changing provider later is a contained change, not a rewrite.

A managed service like **Supabase** (Postgres + auth + storage + row-level security) is a strong default **in place of a hyperscaler** — you get a real database and login without standing up infrastructure. But nothing here assumes Supabase; the same shape works with self-hosted Postgres, .NET Identity, or Spring Security.

## Workflow

1. **Start from the data model.** Use `architecture/data-model.md` for entities and relationships. If it's missing, sketch it first (or run `architecture-grounding`).
2. **Pick the provider** for the stack and record it as an ADR (see `stack-options.md`):
   - **Node/Next/Nest:** Supabase (Postgres + Auth) via its client, or Postgres + Prisma/Drizzle with an auth library.
   - **.NET:** EF Core for data + ASP.NET Core Identity (or Supabase/Postgres) for auth.
   - **Java/Spring:** Spring Data (JPA) + Spring Security (or Supabase/Postgres).
3. **Define the schema and migrations.** Version every change as a migration so the database is reproducible. Map tables to the data model; don't model beyond the stories' needs (POC discipline).
4. **Set up auth to match the stories.** Sign-up/sign-in, sessions/tokens, and the roles/permissions the stories actually require. Delegate credential handling to the provider (hashing, reset flows) rather than rolling your own.
5. **Configure via environment, never hard-coded.** Connection strings, keys, and secrets come from env/secret storage; commit a `.env.example`, never real secrets.
6. **Wrap the provider.** Put database access behind a repository/service layer and auth behind an interface. The rest of the app talks to your layer, not the SDK. This is what keeps you un-coupled.

## What's real vs mocked (POC)

For a proof of concept, make the **core domain real in the database** — the travel entities the demo is about — searches, fare quotes, bookings/itineraries, travellers — should genuinely persist, so a refresh doesn't wipe the demo and reviewers believe it. Keep **auth real but simple** (use the provider; don't roll your own). **Mock or stub the expensive edges** — GDS/supplier feeds, the payment gateway, confirmation email/SMS — behind a thin interface, returning believable canned data, and note that they're mocked. Don't build persistence for things the POC only pretends to do. See `../build-implementation/references/mock-vs-real.md`.

## Security essentials (tie to the threat model)

- **Least privilege** for database roles and API keys.
- **Row-level security / authorization** so users only reach their own data — Supabase RLS, or equivalent checks in your data layer.
- **Secrets in env/secret manager**, rotated; never in the repo.
- **Validate and parameterise** all inputs/queries; let the ORM/driver parameterise to avoid injection.
- Reflect these in `architecture/threat-model.md`.

## Quality bar

- Schema matches the data model; every change is a versioned migration.
- Auth covers exactly the flows and roles the stories require.
- Secrets come from env; `.env.example` documents them; no secrets committed.
- The provider sits behind a data/service layer and an auth interface (swappable).
- Authorization (e.g. RLS) prevents cross-user access; the choice is recorded as an ADR.

## Anti-patterns

- **SDK calls sprinkled through the app** — couples you to the vendor and spreads the blast radius of a change.
- **Rolling your own crypto/auth** — delegate to the provider; it's a security risk you don't need on a POC.
- **Secrets in code or committed env files** — use env/secret storage and an example file.
- **Modelling for a future you don't have yet** — schema the stories, not the roadmap.
