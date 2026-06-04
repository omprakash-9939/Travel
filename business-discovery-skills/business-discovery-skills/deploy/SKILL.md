---
name: deploy
description: Ship the proof of concept to a real host, reproducibly and without lock-in. Use this for the final SHIP step, or whenever someone says "deploy", "ship it", "hosting", "Fly.io", "containerize", "Dockerfile", "CI/CD", or "get it live". It containerizes the app so it runs the same everywhere, picks a host (Fly.io or similar — deliberately not tied to one frontend platform), configures via environment, gates the deploy on tests, smoke-tests the result, and documents deploy and rollback. Framework- and host-agnostic; keeps the POC portable.
---

# Deploy

The point of a POC is that someone can use it. This skill gets it running somewhere real in a way that's **reproducible and portable** — so the demo works, and you're not married to one host.

The default approach is **containers first**: a Dockerfile makes the app run identically on a laptop and in production, and keeps every host an option. A managed container host like **Fly.io** is a good general choice; the reference flow deliberately prefers it **over Vercel** so the app isn't shaped around one frontend platform's serverless model and so local and prod stay in parity. None of this is mandatory — the skill keeps the host pluggable.

## Workflow

1. **Containerize.** Write a Dockerfile (and a `.dockerignore`) appropriate to the stack so the app builds and runs in a container. Verify it runs locally before anything else.
2. **Externalise config.** Everything environment-specific (URLs, keys, the database/auth config from `data-and-auth`) comes from environment variables/secrets at deploy time, not baked into the image. Provide a `.env.example`.
3. **Pick a host.** Fly.io for a portable container deploy. **Be warned that a credit card is a common blocker** — Fly asks for one, and several "free tier" hosts ask too, sometimes depending on the account's region. Don't assume any host is card-free: **Railway** (small starter credit), **Koyeb** (free Hobby web service + database), and **Render** (free web service, sleeps after ~15 min) *can often* be used without a card, but it varies by region and account, so verify at signup rather than promising it. Record the choice as an ADR and keep the deploy config (e.g. `fly.toml` or equivalent) in the repo.

   **The reliably-no-card path (and the quick-and-dirty escape hatch):** if hosting fights you or a card is a hard blocker, run the container locally and expose it with a tunnel — `cloudflared` quick tunnels need **no account and no card** (`ngrok` needs a free account) — to get a public HTTPS URL in a minute. It isn't a real deploy, so say so, but a working demo over a tunnel beats a deploy that ate your last afternoon.
4. **Add a minimal CI gate.** A small pipeline that installs, runs the tests, and only deploys on green. Tests gate the deploy — a red suite never ships.
5. **Deploy and smoke-test.** Ship it, then check the critical path works against a real environment (a couple of the key feature flows). Wire up basic logs/health so you can see it's alive.
6. **Document deploy and rollback.** A short `docs/deploy.md`: how to deploy, the env vars needed, how to roll back. A POC that can't be redeployed or rolled back isn't really shipped.

## Per-stack build/run notes (brief)

- **Next.js / Node / Nest:** multi-stage Docker build (install → build → run); expose the port; `node`/`next start` or the Nest entry as the container command.
- **.NET:** `dotnet publish` in a build stage, run on the ASP.NET runtime image; bind to the platform's `PORT`.
- **Java/Spring:** build the jar (Maven/Gradle) in a build stage, run on a JRE image; `java -jar`.

Keep the image small (multi-stage builds, slim base images) and bind to the host-provided port.

## Quality bar

- The app runs from a container locally and in the chosen host (parity).
- All config/secrets come from environment; nothing environment-specific is baked in.
- Tests gate the deploy (CI deploys only on green).
- A smoke test confirms the critical path post-deploy.
- Deploy and rollback are documented; deploy config lives in the repo.

## Anti-patterns

- **Snowflake deploys** — "it works because I ran some commands once"; if it isn't reproducible, it isn't shipped.
- **Baked-in secrets/config** — couples the image to one environment and leaks secrets.
- **Deploying a red build** — tests must gate the deploy.
- **Host lock-in** — shaping the app around one platform's proprietary model; containers + env keep you portable.
