# Stack options — choose per project, stay un-coupled

This collection does not assume a stack. Pick what fits the team and the POC, pin the versions in `tech-stack.md`, and record the choice as an ADR.

## Default when nothing is specified

For a quick, locally-easy POC, default to **React + Node with Material UI (MUI)** unless the team or the person says otherwise:

- **UI:** React + **Material UI (MUI)** — accessible components out of the box, fast to assemble, easy to run locally.
- **App shape:** **Vite + React** for a simple single-page app, or **Next.js** if you want UI and API in one full-stack app.
- **Separate API (when wanted):** **NestJS** (structured Node/TypeScript).
- **Data & auth:** **Supabase** (Postgres + auth) — see below.
- **Deploy:** containerized, **Fly.io** — see below.

This is only a fallback. **Respect stated preferences** — the team already runs Nest/Next, and individuals have their own leanings; if someone specifies a stack or library, use it and note it as an ADR. The default exists so a junior team isn't blocked choosing, not to override a choice that's been made.

## Application stacks
- **React + Node** — React front end with a Node back end. Good default for web POCs.
  - **Next.js** — full-stack React (UI + API routes/server actions in one app). Fast for a POC.
  - **NestJS** — structured Node API (TypeScript, DI, modules) when you want a clear back-end service, often paired with a React/Next front end.
- **.NET (ASP.NET Core)** — C# web API and/or Blazor/MVC UI. Strong typing, EF Core for data, built-in Identity for auth.
- **Java (Spring Boot)** — Spring MVC/WebFlux API, Spring Data for persistence, Spring Security for auth; pair with a JS front end if needed.

Mix is fine (e.g. React front end + .NET or Spring API). What matters is that the choice is explicit and pinned.

## Data & auth (provider-agnostic)
- **Supabase** — managed Postgres + auth + storage + row-level security. A strong managed option **in place of a hyperscaler** (e.g. AWS) for a POC; you get a database and login without standing up infrastructure.
- **Alternatives** — self-hosted/managed Postgres with an auth library; Firebase; .NET Identity (EF Core); Spring Security + Spring Data. 
- **Keep it swappable** — put database access behind a thin data/service layer and auth behind an interface, configure via environment variables, and record the provider as an ADR. Then moving off any provider is a contained change, not a rewrite. See the `data-and-auth` skill.

## Hosting (host-agnostic)
- **Containers first** — a Dockerfile makes the app run the same locally and in production and keeps you portable across hosts.
- **Fly.io** — runs containers close to users; a good general POC host. (The reference deck deliberately suggests Fly.io **rather than Vercel**, to avoid coupling the app to one frontend-host's serverless model and to keep local/prod parity.)
- **Alternatives** — Render, Railway, a managed container service, or your own cloud. The `deploy` skill keeps this pluggable.

## Layers — more than front-end and back-end (kept simple)

Prompt for the layers, not just "front end" and "back end" — but for a POC only include the ones it needs, and keep each thin. A useful minimal set:

- **UI / presentation** — screens and components (React + MUI).
- **Application / API** — the entry points and orchestration (Next API routes, or a Nest/Express API).
- **Domain / business logic** — the rules, kept out of the UI and the controllers even in a POC, so behaviour is testable and the app doesn't rot into fat components.
- **Data / persistence** — repositories/services over the database, so the provider stays swappable.
- **Integrations / external services** — third-party calls behind interfaces (and usually mocked for a POC — see `../../build-implementation/references/mock-vs-real.md`).
- **Cross-cutting** — auth, configuration/secrets, logging/error handling.

The point is not ceremony; it's that **domain logic and data access have a home that isn't the component or the controller.** Collapse what the POC doesn't need, but keep that separation. The architect review checks for it.

## Platform portability
These are plain Agent Skills in the open `agentskills.io` format, so the flow runs in Claude Code and other agents. Keep skill instructions tool-neutral where you can (refer to "the agent" and "the test runner", not a specific product) so the team isn't locked to one platform.
