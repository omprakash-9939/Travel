---
name: stakeholder-mapping
description: Establish who owns the decision, who is affected, and what success means to each person — before building. Use this during discovery, or whenever it's unclear who the decision-maker is, who needs to sign off, whose buy-in matters, or when different people seem to want different things ("the CEO wants X but the users want Y", "who actually approves this?", "we keep getting blocked"). It maps stakeholders on power and interest, names the single decision-maker, captures each person's definition of success, and plans engagement. Produces a `stakeholders.md` artifact. A problem isn't grounded until you know who decides and what "good" means to them.
---

# Stakeholder Mapping

A problem is not fully grounded until you can answer: **who owns the decision, who is affected, and what does success mean to each of them?** Different stakeholders often define success differently — surfacing that early prevents the late-stage "this isn't what I wanted" that kills projects.

## How to run it

Work conversationally; build the map from the user's answers rather than handing them a grid.

### 1. List the stakeholders

Prompt across these groups so none is missed:
- **Decision-maker** — the single person who owns the go/no-go and the budget. If the user names a committee, push for the one accountable individual.
- **Sponsors / approvers** — who must sign off or fund it.
- **Users / the affected** — who lives with the problem and would live with the solution.
- **Delivery** — who would build and run it (engineering, design, ops, support).
- **Adjacent / blockers** — security, legal, compliance, finance, other teams whose work this touches.

### 2. Place each on power and interest

For each stakeholder, gauge **power** (influence over the decision and resources) and **interest** (how much the outcome affects them), each High / Medium / Low. This guides engagement:

- **High power, high interest** — manage closely; co-create with them.
- **High power, low interest** — keep satisfied; brief concisely, don't overload.
- **Low power, high interest** — keep informed; they are often your real users and best evidence source.
- **Low power, low interest** — monitor.

### 3. Capture each one's definition of success

This is the highest-value column. Ask, for the key stakeholders: *"What would make this a success in your eyes?"* Record it in their words. Conflicting definitions are a finding to resolve now, not later.

### 4. Note stance and plan engagement

For each key stakeholder: are they a **champion**, **neutral**, or **blocker** today? What is the one thing that would move them? When and how will you engage them?

## Writing it up

Copy `assets/stakeholder-template.md` into the discovery folder as `stakeholders.md` and fill it. Make sure the decision-maker and the sign-off path are unambiguous.

## Quality bar

- Exactly **one** named decision-maker (not a committee).
- The sign-off path is explicit (who approves, in what order).
- Each key stakeholder has a success definition in their own terms.
- Conflicts between success definitions are named, with a plan to resolve them.
- The people who actually have the problem (users) are represented, not just senior approvers.

## Anti-patterns

- **Mistaking the loudest voice for the decision-maker.** Confirm who actually owns the budget and the call.
- **Listing roles, not stakes.** "Marketing" is not a stakeholder; the named person whose goals are affected is.
- **Assuming aligned success.** Two stakeholders nodding at "improve onboarding" may mean entirely different things.
