---
name: requirements-brief
description: Synthesise grounded discovery into a structured business requirements document the team can build from. Use this as the final discovery step, or whenever someone asks to "write requirements", "spec this", "create a BRD / PRD", "what are the requirements", or is ready to brief engineering. It frames the WHY (SCQA), sets measurable objectives, defines scope in and out, writes functional requirements as user stories with testable acceptance criteria, captures non-functional requirements, and records assumptions, dependencies, risks, and open questions. Crucially it traces every requirement back to the problem, and ends with a readiness gate. Produces a `requirements.md` artifact. Run problem-framing first if the problem isn't grounded.
---

# Requirements Brief

This skill turns grounded discovery into a single document a team can build from with confidence. It is the synthesis step: it pulls the why, the who, and the worth from the earlier artifacts and turns them into clear, testable requirements.

The governing rule: **every requirement traces back to the problem or an objective.** A requirement that can't be traced is either scope creep or a clue that the problem was under-framed. And requirements describe *what* is needed and *why*, not *how* to build it — design and implementation choices stay open for the team.

## Inputs

Ideally all of: `problem-statement.md`, `root-cause.md`, `stakeholders.md`, `business-case.md`. If some are missing, note it and proceed with what exists — but if the **problem** isn't framed, run `problem-framing` first; requirements without a grounded problem are guesses.

## How to build it

### 1. Frame the why with SCQA

Open with a short narrative so any reader understands the point fast:
- **Situation** — the stable context everyone agrees on.
- **Complication** — what changed or what's wrong (the problem).
- **Question** — the question that raises ("how do we…?").
- **Answer** — the one-line recommendation/approach this brief sets out.

### 2. Objectives and success metrics

Translate the problem's success criteria into 2–4 measurable objectives. Each needs a metric, a current baseline, and a target. If you can't measure it, you can't tell whether you succeeded.

### 3. Scope: in and out

List what's in scope and — just as importantly — what's explicitly out. The out-of-scope list is what protects the team from creep.

### 4. Functional requirements as user stories

Write each as: **As a \<user>, I want \<capability>, so that \<benefit>.** Give each one **testable acceptance criteria** (Given / When / Then works well). Keep them solution-neutral: state the need, not the widget. Tag priority with MoSCoW (Must / Should / Could / Won't-this-time).

### 5. Non-functional requirements

Don't skip these — they're where projects quietly fail. Cover the ones that apply: performance/latency, scale/volume, availability/reliability, security and privacy, accessibility, compliance/regulatory, observability, maintainability, and any explicit constraints. Make them measurable where possible ("p95 < 500ms", not "fast").

### 6. The rest of the grounding

Assumptions, dependencies (teams, systems, third parties), risks with mitigations, and open questions. Pull these forward from the earlier artifacts and add any that surface here.

### 7. Trace and gate

Add a short traceability note (each objective → the requirements that serve it). Then run the **readiness gate** (see `references/quality-bar.md`) and record the result. If the gate fails, the failing item is the next task — not a reason to start building.

## Writing it up

Copy `assets/requirements-template.md` into the discovery folder as `requirements.md` and fill it from the conversation and prior artifacts. Cross-link the other artifacts. Read `references/quality-bar.md` before finalising.

## Quality bar (summary — full version in references/quality-bar.md)

- Every requirement traces to the problem or an objective.
- Functional requirements have testable acceptance criteria.
- Non-functional requirements are present and measurable.
- Scope has an explicit out-of-scope list.
- The decision-maker is named and the readiness gate is recorded.
- Requirements state needs, not implementation.
