# Business Requirements: <Initiative name>

> **Status:** Draft | In review | Approved
> Links: [Problem statement](./problem-statement.md) · [Root cause](./root-cause.md) · [Stakeholders](./stakeholders.md) · [Business case](./business-case.md)
> **Owner:** <name>  ·  **Decision-maker:** <name>  ·  **Date:** <yyyy-mm-dd>

## Why — in brief (SCQA)

- **Situation:** <the stable context everyone agrees on>
- **Complication:** <what changed / what's wrong — the problem>
- **Question:** <the question this raises>
- **Answer:** <the one-line approach this brief sets out>

## Objectives and success metrics

| Objective | Metric | Baseline (now) | Target | By when |
|---|---|---|---|---|
| <…> | <…> | <…> | <…> | <…> |
| <…> | <…> | <…> | <…> | <…> |

## Scope

**In scope:** <…>

**Out of scope:** <what we are explicitly not doing — protects against creep>

## Users / personas

<Who this serves, drawn from stakeholders.md. Keep it concrete.>

## Functional requirements

> Format: *As a `<user>`, I want `<capability>`, so that `<benefit>`.* Each has testable acceptance criteria. Priority: MoSCoW.

### FR-1 — <short title>  ·  Priority: Must / Should / Could / Won't
**As a** <user>, **I want** <capability>, **so that** <benefit>.
**Acceptance criteria:**
- Given <context>, when <action>, then <expected result>.
- <…>
*Traces to: Objective <n>*

### FR-2 — <short title>  ·  Priority: …
**As a** <user>, **I want** <…>, **so that** <…>.
**Acceptance criteria:**
- <…>
*Traces to: Objective <n>*

## Non-functional requirements

| Category | Requirement (measurable) |
|---|---|
| Performance | <e.g. p95 response < 500ms at 100 rps> |
| Scale / volume | <…> |
| Availability / reliability | <…> |
| Security & privacy | <…> |
| Accessibility | <e.g. WCAG 2.2 AA> |
| Compliance / regulatory | <…> |
| Observability | <…> |
| Maintainability / constraints | <…> |

## Assumptions

<Carried from earlier artifacts + any new ones. Each is a candidate to validate.>

## Dependencies

<Teams, systems, third parties, sequencing. What must be true or done elsewhere.>

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| <…> | H/M/L | H/M/L | <…> |

## Open questions

<What we still need to resolve. Owner + by-when for each.>

## Traceability

<One line per objective listing the requirements that serve it — confirms no orphan requirements and no unserved objectives.>

## Readiness gate

> Built from references/quality-bar.md. Tick each or name the gap.

- [ ] Problem stated in one measurable sentence, with evidence
- [ ] Confirmed root cause, not a symptom
- [ ] Decision-maker named; success defined for key stakeholders
- [ ] Prize sized and cost understood (worth doing)
- [ ] Objectives measurable with baseline and target
- [ ] Scope has an explicit out-of-scope list
- [ ] Functional requirements have testable acceptance criteria
- [ ] Non-functional requirements covered and measurable
- [ ] Every requirement traces to an objective

**Gate result:** Ready to build / Not yet — next: <the failing item>

**Decision-maker sign-off:** <name, date>
