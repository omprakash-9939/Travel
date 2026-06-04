---
name: requirements-breakdown
description: Decompose an agreed requirements brief into a hierarchy of epics, stories, and functions, each written to its OWN file so different people can review different pieces in parallel without stepping on each other. Use this after a requirements brief exists, or whenever someone says "break this down", "split into epics/stories", "create a backlog", "we need separate docs so the team can review", "decompose the requirements", or wants reviewable units of work. It creates `requirements/epics/`, `requirements/stories/`, and optional `requirements/functions/` files with owners, review status, and full traceability up to objectives and across to wireframes and feature files. Single-concern files mean clean diffs and no review conflicts.
---

# Requirements Breakdown (epics → stories → functions)

A single big requirements document is hard to review in parallel: two people editing it collide, and a reviewer can't own "their" part cleanly. This skill explodes the agreed brief into a **hierarchy of small, single-concern files** so epics, stories, and functions can each be reviewed, owned, and version-controlled independently. One concern per file means clean git diffs and no merge or review conflicts.

It is also the step that produces the units the rest of the pipeline consumes: each **story** becomes one BDD feature file (`requirements-to-bdd`), and each **function** is a buildable unit for Claude Code.

## The hierarchy

- **Epic** — a large business capability that delivers a chunk of an objective and is too big to build in one slice. Maps up to one or more objectives in `requirements.md`. (e.g. "Self-service account management".)
- **Story** — a vertical slice of user value: *As a … I want … so that …*, with testable acceptance criteria. Independently shippable and testable; the unit that feeds `requirements-to-bdd`. Follow **INVEST** (Independent, Negotiable, Valuable, Estimable, Small, Testable — see `references/splitting-stories.md`).
- **Function** *(optional, finer grain)* — a concrete technical capability or task within a story that Claude Code will implement: an input, a behaviour, an output. Use this level when stories are large or when you want build-ready units; skip it for simple stories.

## File layout

```
requirements/
├── README.md                      # index: tree, review owners, status, traceability
├── epics/
│   ├── EP-01-account-management.md
│   └── EP-02-…
├── stories/
│   ├── EP-01/
│   │   ├── US-0101-reset-password.md
│   │   └── US-0102-…
│   └── EP-02/…
└── functions/                     # optional
    └── US-0101/
        ├── FN-010101-validate-email.md
        └── FN-010102-…
```

IDs are stable and hierarchical (`EP-01` → `US-0101` → `FN-010101`) so references survive renames. Slugs are human-readable.

## Workflow

1. **Read `requirements.md`** — the functional requirements (user stories + acceptance criteria), the objectives, and the non-functional requirements. If there is no agreed brief, run `requirements-brief` first; you cannot cleanly decompose vague requirements.
2. **Group into epics** — cluster functional requirements by capability/objective. Aim for epics that are roughly mutually exclusive and collectively cover the requirements (no big gaps, no heavy overlap). An epic that is "the whole project" is too big; split it.
3. **Decompose epics into stories** — slice **vertically** (a thin end-to-end piece of user value), never horizontally ("build the database" is not a story). Each story is INVEST-shaped with testable acceptance criteria. Read `references/splitting-stories.md` for splitting patterns.
4. **Optionally decompose stories into functions** — the build-ready units, each with inputs/outputs/behaviour and a link to the acceptance criteria it serves.
5. **Write one file per item** — copy the matching template from `assets/`. Each file carries: ID, title, parent link, **owner / reviewer**, **status** (Draft / In review / Approved), the content, and **traceability links** (up to objective/requirement, across to wireframe screen, forward to feature file once it exists).
6. **Maintain `requirements/README.md`** — the index: the tree, a **review-assignment table** (who owns which file, current status), and a traceability table (epic → objective, story → requirement → wireframe → feature). Keep it current as the source of truth for review progress.
7. **Hand off** — each **Approved** story flows to `requirements-to-bdd` (→ a feature file), then after verification to `bdd-to-tdd`, then to the Claude Code build. Functions map to build tasks.

## Designed for parallel review

- **One concern per file** so two reviewers never edit the same file.
- **Owners and status per file** so review can be assigned and tracked; the index shows progress at a glance.
- **Stable IDs** so links don't break when titles change.
- Encourage reviewing **one epic's stories per reviewer**, in separate PRs, to keep diffs small.

## Quality bar

- Every story is a vertical slice of value with testable acceptance criteria (INVEST).
- Every story/function traces **up** to a requirement/objective and, if it has UI, **across** to a wireframe screen.
- Epics cover the functional requirements without large gaps or heavy overlap.
- Each file is single-concern, with an owner and a status.
- The index is current and is the canonical view of review progress.

## Anti-patterns

- **One big file** — defeats the entire point; reviewers collide and own nothing.
- **Horizontal slices** — "build the API layer" isn't a story; slice by user value so each piece is demonstrable.
- **Orphans** — a story with no parent requirement is scope creep or a missing requirement; resolve it.
- **Mega-epics** — an epic that is the whole project hides the structure; break it down.
