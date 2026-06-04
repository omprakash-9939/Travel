# Getting Started — for the team (Claude Code in VS Code)

These 17 skills help you take a travel-tech idea all the way to a deployed proof of concept, with Claude Code doing the heavy lifting and you steering and reviewing. You install them once on your machine, then just talk to Claude Code inside your project in VS Code.

---

## 1. Prerequisites (one-time)

1. **Install Node.js 18+** — https://nodejs.org
2. **Install Claude Code** and sign in. Easiest in VS Code: open the Extensions panel, search **“Claude Code”** (by Anthropic), install it, and sign in when prompted. (CLI alternative: `npm install -g @anthropic-ai/claude-code`, then run `claude`.)
   Official install guide: https://docs.claude.com/en/docs/claude-code/overview
3. You’ll need a Claude account/plan that includes Claude Code.

### Before you start (one account worth having)

- **A database + auth provider** — [Supabase](https://supabase.com) is the default (free tier, no card). Sign up and create an empty project; you’ll use it for the data/auth step.

Deploying is **optional** — the goal is a POC that **builds and runs**, and a working local demo counts. If you do want it hosted later, sort that out then (the deck suggests Fly.io; a card may be required); don’t spend your time on it now.

---

## 2. Install the skills (one-time, ~1 minute)

Skills live in a folder Claude Code watches. Install them to your **personal** folder so they’re available in every project you build.

> The zip contains a wrapper folder `business-discovery-skills/` with the 17 skill folders inside. The skill folders must end up **directly** under `~/.claude/skills/` — i.e. `~/.claude/skills/build-blueprint/SKILL.md`, not `~/.claude/skills/business-discovery-skills/build-blueprint/...`.

### macOS / Linux
```bash
mkdir -p ~/.claude/skills
unzip -o business-discovery-skills.zip -d /tmp/bds
cp -R /tmp/bds/business-discovery-skills/* ~/.claude/skills/
rm -rf /tmp/bds
ls ~/.claude/skills        # should list build-blueprint, problem-framing, … (folders)
```

### Windows (PowerShell)
```powershell
$skills = "$HOME\.claude\skills"
New-Item -ItemType Directory -Force $skills | Out-Null
Expand-Archive -Path business-discovery-skills.zip -DestinationPath "$env:TEMP\bds" -Force
Copy-Item "$env:TEMP\bds\business-discovery-skills\*" $skills -Recurse -Force
Remove-Item "$env:TEMP\bds" -Recurse -Force
dir $skills                 # should list the skill folders
```

(The `README.md` and this `GETTING-STARTED.md` get copied in too — harmless; Claude Code only treats folders that contain a `SKILL.md` as skills.)

**Restart Claude Code** after this first install — when the `skills` folder is created for the first time, Claude Code needs a restart to start watching it. (After that, edits to skills are picked up live.)

---

## 3. Check they loaded

In Claude Code, type:
```
/skills
```
You should see the 17 skills (build-blueprint, problem-framing, requirements-to-bdd, expert-review, …). If `/skills` isn’t in your version, just ask Claude: *“What skills do you have available?”* or jump straight to step 4.

---

## 4. Run it on your project

1. **Open your project folder in VS Code** (File → Open Folder). Use the integrated terminal or the Claude Code panel.
2. **Start with the blueprint.** Tell Claude:
   > *“Use the **build-blueprint** skill. I’m starting a travel-tech POC for the DataArt travel practice — walk me through it, beginning with framing the problem.”*
3. **Work through the flow.** Claude will guide you FRAME → SPECIFY → SHIP and write artifacts into your repo as you go:
   `docs/discovery/`, `requirements/`, `architecture/`, `design-system/`, `features/*.feature`, tests, then the build.
4. **Invoke a specific step by name** any time, e.g.:
   - *“Use **problem-framing** to sharpen this.”*
   - *“Use **requirements-to-bdd** to turn this story into a feature file.”*
   - *“Have the **architect** review this with **expert-review**.”* (also DBA, or the travel **domain SME**)
   - *“Use **bdd-to-tdd** to write failing tests for this feature.”*
5. **Review and commit.** You’re expected to *go through* every step and produce a thin version of each asset — keep each light, keep reviews quick. The point is to see the full shape of building software properly. Commit artifacts as you create them.

If you don’t name a skill, Claude will often pick the right one from your request — but naming it is the reliable way.

---

## 5. Sharing with a team on one repo (optional)

If a whole team works in one repo, put the skill folders in the **project** location instead and commit them, so everyone gets them on clone:
```
<your-repo>/.claude/skills/<each-skill-folder>/
```
Both locations work the same; project skills are just shared via git.

### Working as a group without standing on each other

Three or four people on one repo can get into a tangle fast. Keep it simple:

- **One repo, one `main`.** Create it once (whoever sets up the repo), everyone clones it.
- **Branch per piece of work, not per person.** `git checkout -b feature/fare-hold-button`, do the slice, open a small pull request, get one teammate to glance at it, merge. Small and often beats one giant merge on Friday.
- **Commit small and often.** One logical change per commit, committed the moment it works — not saved up for a big end-of-day dump. Frequent commits are your undo button. Messages say *why*, never commit secrets or `.env`, and skip the "Generated by Claude" footers — a human owns every commit.
- **Pull `main` before you start each slice** (`git pull origin main`) so you’re building on the latest.
- **The breakdown is designed for this.** `requirements-breakdown` puts each story/function in its *own file* with an owner — so two people editing different stories don’t collide. Split the work by story, not by “frontend/backend”, and you’ll rarely hit a merge conflict.
- **If you do hit a conflict, don’t guess** — that’s a 5-minute conversation with the other person, or ask Claude to walk you through resolving it. Don’t `--force` your way past it.

You don’t need fancy Git. A branch, a small PR, a quick look from a teammate, merge. Repeat.

---

## Troubleshooting

- **Skills don’t show up?** Make sure each folder sits directly under `~/.claude/skills/` and contains a `SKILL.md`. Then fully restart Claude Code (a brand-new top-level `skills` folder needs a restart to be watched).
- **Wrong nesting?** If you see `~/.claude/skills/business-discovery-skills/…`, move the inner folders up one level so the skill folders are directly under `skills/`.
- **Path reminder:** personal = `~/.claude/skills/` (every project); project = `.claude/skills/` inside a repo (that repo only). On Windows, `~` is `C:\Users\you`.
