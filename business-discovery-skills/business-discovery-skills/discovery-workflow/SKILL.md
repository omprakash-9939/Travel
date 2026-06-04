---
name: discovery-workflow
description: Run a structured product/business discovery before any building begins. Use this skill at the very start of any new initiative, feature, project, epic, or request — whenever someone says "we want to build X", "we need a new Y", "can you help me write requirements", "let's spec this out", "kicking off a project", "here's an idea", or jumps straight to a solution. It frames the WHY and grounds the problem before a line of code is written by sequencing five focused skills (problem-framing, root-cause-analysis, stakeholder-mapping, business-case, requirements-brief) into one repeatable workflow with version-controlled artifacts. Trigger it proactively whenever a request describes a solution or goal without a clearly grounded problem.
---

# Discovery Workflow

This skill orchestrates a lightweight but rigorous discovery so a team can be confident they are solving the **right problem, for the right people, for the right reasons** before they commit to building. It is the entry point; it sequences five companion skills and produces a small set of linked Markdown artifacts in the repository.

The single most valuable thing this workflow does is **slow down the jump to a solution** for long enough to ground the problem. Most failed projects are well-built solutions to badly-framed problems.

## When to run the full workflow vs. a light pass

Be proportional. Match effort to stakes and uncertainty.

- **Full workflow** (all five steps): a new product, a significant feature, anything cross-team, anything expensive or hard to reverse, or anything where people disagree about the problem.
- **Light pass** (problem-framing only, maybe stakeholder-mapping): a small, well-understood change where the problem is already obvious and grounded.
- **Always do problem-framing.** Even a one-line problem statement beats none. Skipping it is what this whole workflow exists to prevent.

If unsure which, ask the user one question: *"How reversible and how expensive is getting this wrong?"*

## The sequence

Run these in order. Each step has its own skill with detailed instructions and a template; read that skill's `SKILL.md` when you reach the step.

1. **problem-framing** — Turn the request into a precise, neutral, measurable problem statement. Output: `problem-statement.md`.
2. **root-cause-analysis** — Confirm you are looking at a root cause, not a symptom. Output: `root-cause.md`.
3. **stakeholder-mapping** — Establish who owns the decision, who is affected, and what success means to each. Output: `stakeholders.md`.
4. **business-case** — Establish the economic why: roughly how big is the prize, what does it cost, is it worth doing. Output: `business-case.md`.
5. **requirements-brief** — Synthesise everything into a structured business requirements document the team can build from. Output: `requirements.md`.

Steps 2–4 can be reordered or run in parallel once the problem is framed. The requirements brief always comes last, because it depends on the others.

## How to set up the artifacts

Create a discovery folder in the repository so the work is shared and versioned:

```
docs/discovery/<kebab-case-initiative-name>/
├── README.md            (index + status, created by this skill)
├── problem-statement.md
├── root-cause.md
├── stakeholders.md
├── business-case.md
└── requirements.md
```

Pick the initiative name with the user. Create `README.md` as an index that links each artifact and tracks which steps are done. Keep it updated as you complete steps.

## How to work with the user

- **Drive with questions, not forms.** Ask about one topic at a time and build the artifacts from the answers. Never paste a blank template and ask them to fill it in.
- **Push back on solutions-in-disguise.** If the user describes a solution ("we need a dashboard", "build an API for X"), acknowledge it, park it, and ask what problem it would solve. Solutions are welcome later as options, not as the starting point.
- **Write as you go.** Save each artifact as you complete its step so nothing is lost and the team can follow along in version control.
- **Make assumptions explicit.** Anything you cannot confirm goes in an "Assumptions" or "Open questions" section, not into the prose as fact.
- **Stop when grounded, not when complete.** The goal is a confident decision to proceed (or not), not a perfectly filled set of documents.

## The readiness gate

Before declaring discovery done and handing off to build, confirm the team can answer these. If any answer is "we don't know", that is the next piece of work, not a reason to start building.

- What problem are we solving, in one measurable sentence?
- What is the evidence that it is real and worth solving?
- Is this the root cause or a symptom?
- Who owns the decision, and what does success mean to them?
- Roughly what is the prize, and what will it cost?
- What does "done" look like, and how will we measure it?
- What are we explicitly **not** doing?

Record the gate result at the bottom of the `requirements.md` and in the discovery `README.md`.

## Companion skills

This skill assumes the following skills are installed alongside it: `problem-framing`, `root-cause-analysis`, `stakeholder-mapping`, `business-case`, `requirements-brief`. If a deeper framework is needed at any point (e.g. competitive analysis, OKRs, change management), the `strategic-managers-playbook` skill, if present, is a good reference.

Once discovery is done and `requirements.md` passes its readiness gate, the rest of the pipeline takes over: **`requirements-breakdown`** explodes the brief into separately-reviewable epic/story/function files; **`architecture-grounding`** and **`design-system`** capture the technical and UI context (these can run in parallel with breakdown); **`requirements-to-bdd`** turns each agreed story into a BDD feature file (cross-referenced to the wireframe and design system) and stops at a human verification gate; and **`bdd-to-tdd`** scaffolds failing-first tests for each verified feature. The whole chain is built so **Claude Code** can then build the application from grounded context (`architecture/build-context.md` + `design-system/` + the feature files + the tests). Discovery answers *why* and *what*; the rest answers *how it fits together* and *how we'll prove it works*.
