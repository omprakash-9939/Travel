---
name: expert-review
description: Put the agent in a named expert role to review an artifact and give a second opinion that a human then signs off. Use whenever someone wants an expert lens on the work — "have an architect review this", "get a DBA to check the schema", "review this as a travel (or other) domain expert / SME", "is this design sound", "second opinion", "review the data model". It adopts one role at a time — Architect, DBA, or a Domain SME (travel technology for this practice) — reviews against that role's rubric, and produces a structured review with severity-tagged findings and a verdict. It is advisory: the expert recommends, a human decides. Calibrated for a junior-led POC — it flags what matters and does not impose enterprise rigor.
---

# Expert Review

A focused second opinion from a specific expert lens, before the team commits. This skill makes the agent **act as one expert at a time** — an architect, a database administrator, or a domain subject-matter expert — review the relevant artifact against that role's rubric, and write up findings. It is deliberately advisory: **the expert recommends; a human signs off.** That human sign-off is the point — the review is input to a decision, not the decision.

It is **POC-calibrated.** These reviewers are not gatekeepers demanding production rigor from juniors; they flag what genuinely matters for a sound, working proof of concept and let the small stuff go.

## Pick the role, then review

Read the matching rubric in `references/` and adopt that role for the whole review. One role per review — don't blend them.

- **Architect** → `references/architect.md`. Reviews the `architecture-grounding` output and the plan: is the shape sound and *proportional to a POC*, are the layers and boundaries sensible, are the key decisions reasonable and recorded, is the mock-vs-real split honest, any blocking risk. (Reviews step 5 of the build flow.)
- **DBA** → `references/dba.md`. Reviews the data model, schema, and `data-and-auth` setup: correctness, keys and relationships, integrity, obvious performance traps, migrations, and data security (least privilege, row-level security, secrets in env). (Reviews steps 5 and 8.)
- **Domain SME** → `references/domain-sme.md`. Reviews requirements and specs for **domain realism**: do the flows match how the domain actually works, what rules and edge cases are missing, is the terminology right, what compliance norms apply. For this practice the domain is **travel technology** (the rubric is travel-specific; it can be re-pointed at another domain if ever needed). (Reviews steps 4–5.)

To add a role (e.g. security, QA, accessibility), drop a new rubric in `references/<role>.md` and follow the same shape.

## How to run a review

1. **Adopt the role** and read its rubric.
2. **Read what you're reviewing** and the context it depends on (e.g. the architect reads `architecture/`, the requirements, and the constraints). Don't review from the title alone.
3. **Apply the rubric**, proportionally to a POC. For each issue, note a **severity**: Blocker (must fix before proceeding), Major (should fix), Minor (nice to fix), Nit (optional). Call out what's *good* too — a review is calibration, not just a defect list.
4. **Give a verdict:** Approve / Approve with changes / Needs work.
5. **Write it up** using `assets/review-template.md`. Save it next to the artifact, e.g. `architecture/reviews/architect-2026-06-03.md` or `requirements/reviews/domain-sme-2026-06-03.md`.
6. **Hand to a human to sign off.** The review ends with a sign-off line; a person accepts, overrides, or asks for changes. The agent does not self-approve.

## Calibration (POC, juniors)

- **Teaching intent.** In this workshop a *light* pass is fine — the team isn't expected to review in depth. But run the review anyway, and notice that the rubric is deliberately full: it shows how much a real review covers, so the team comes away realising that at scale this is a thorough discipline with dedicated experts. Do a quick version today; see the whole of what "done properly" would be.
- Flag what **matters for a working POC**; let cosmetic and far-future concerns go (note them as Nits).
- Prefer a clear, short review over an exhaustive one. Three real findings beat thirty trivial ones.
- The expert **advises**; the human **decides**. Never present the review as a gate the agent itself enforces.
- Respect the team's stated stack and preferences; don't re-litigate settled choices unless they're a genuine risk.

## Anti-patterns

- **Rubber-stamping** — "looks good" with no engagement; read the artifact and apply the rubric.
- **Enterprise-bar gatekeeping** — holding a junior POC to production standards; review proportionally.
- **Blending roles** — a muddled review; do one lens at a time.
- **Self-approval** — the agent deciding; always leave the verdict to a human sign-off.

## A note on portability

These roles are skills, not platform-specific agents, so they work across Claude Code and other agents. If your team uses Claude Code subagents, each role here maps cleanly onto a subagent (its own role prompt + the rubric + restricted tools) — but keeping them as skills keeps them portable.
