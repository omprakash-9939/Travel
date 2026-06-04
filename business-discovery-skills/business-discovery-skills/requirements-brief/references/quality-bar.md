# Requirements Quality Bar & Readiness Gate

Read this before finalising a requirements brief. It is the standard the brief should meet and the gate the team passes before building.

## What makes a requirement good

- **Traceable** — it maps to a stated objective, which maps to the problem. No orphans.
- **Solution-neutral** — it states the need and the why, not the implementation. "Users can recover an account without contacting support" — not "add a "forgot password" button using service X".
- **Testable** — you can write a pass/fail check for it. Acceptance criteria in Given/When/Then form make this concrete.
- **Unambiguous** — one reading. Replace "fast", "easy", "robust", "scalable" with numbers or specifics.
- **Necessary** — if removing it doesn't hurt an objective, cut it.
- **Prioritised** — MoSCoW (Must / Should / Could / Won't this time) so trade-offs are explicit.

## Common smells

- **Implementation masquerading as requirement** — describes a UI element or a technology rather than a need.
- **Compound requirement** — "and" / "or" hiding two requirements; split them.
- **Unmeasurable non-functional** — "must be performant". Give a number and conditions.
- **Missing the unhappy path** — only the success case is specified; error, empty, and edge states are silent.
- **Untraceable extra** — a requirement nobody can tie to an objective. Either it reveals a missing objective or it's scope creep.

## Non-functional checklist (consider each; mark N/A if it truly doesn't apply)

Performance · Scalability/volume · Availability & reliability · Security · Privacy/data protection · Accessibility · Compliance/regulatory · Internationalisation · Observability/monitoring · Maintainability · Portability · Cost-to-run constraints.

## The readiness gate

Discovery is done when the team can answer all of these. A "no" is the next task, not a reason to start building.

1. **Problem** — Can we state it in one measurable sentence, backed by evidence?
2. **Cause** — Are we confident this is a root cause, not a symptom?
3. **People** — Is the decision-maker named, and do we know what success means to the key stakeholders?
4. **Worth** — Do we know roughly how big the prize is and what it costs — enough to say it's worth doing?
5. **Success** — Are objectives measurable, with baselines and targets?
6. **Boundaries** — Is there an explicit out-of-scope list?
7. **Buildability** — Do functional requirements have testable acceptance criteria, and are the key non-functional requirements specified?
8. **Traceability** — Does every requirement trace to an objective, and every objective have requirements?

Record the result and the decision-maker's sign-off in `requirements.md`. If the gate is not met, name the single most important gap and treat closing it as the immediate next step.
