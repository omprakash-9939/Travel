# Splitting work: epics, INVEST stories, and patterns

## Epic vs story vs function
- **Epic:** a capability too big to build in one slice; a theme that groups stories.
- **Story:** a thin, vertical slice of user value — demonstrable on its own, testable, small enough to build in days not weeks.
- **Function/task:** a technical unit inside a story (a build-ready piece for Claude Code).

## INVEST — the test for a good story
- **Independent** — minimal coupling to other stories; can be built and reviewed alone.
- **Negotiable** — describes the need, leaves room on the how.
- **Valuable** — delivers something a user or the business can see.
- **Estimable** — clear enough to size.
- **Small** — buildable in a short cycle; if not, split.
- **Testable** — has acceptance criteria you can pass/fail.

## Slice vertically, not horizontally
A story should cut through the whole stack to deliver visible value ("a user can reset their password"), not a horizontal layer ("build the auth database tables"). Horizontal slices produce nothing demonstrable and can't be reviewed against user value.

## Common splitting patterns (when a story is too big)
- **By workflow step** — split a long flow into its steps (search → select → checkout).
- **By business rule / variation** — happy path first; each additional rule or case its own story.
- **By data type or input** — support one format/field set, then the next.
- **By operation (CRUD)** — create first, then read/update/delete as separate stories.
- **By interface** — core capability first, then the richer UI.
- **Happy path vs edge cases** — ship the main case, then harden with error/empty/validation stories.
- **Spike** — if too uncertain to estimate, split off a small time-boxed investigation first.

## Keep it reviewable
One story per file, one concern per file. Assign an owner and a reviewer, track status in the index. Small files reviewed in separate PRs keep diffs clean and avoid conflicts.
