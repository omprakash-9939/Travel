# Build Context — for the build agent

> Read this first. It is the concise technical brief for building this application.
> Linked from CLAUDE.md. Keep it current.

## What we're building
<One paragraph: the system and its purpose. Link: docs/discovery/<initiative>/requirements.md>

## Stack (pinned)
- Language(s) / runtime: <e.g. TypeScript 5.x, Node 20>
- Framework(s): <e.g. Next.js 14, React 18>
- Data: <e.g. PostgreSQL 16, Prisma>
- Test framework: <e.g. Vitest + React Testing Library; Playwright for e2e>
- Infra / deploy: <…>

## Repo conventions
- Folder layout: <where features, components, services, tests live>
- Naming / lint / format: <rules, configs to honour>
- Test location & command: <e.g. co-located *.test.tsx ; `npm test`>

## Patterns to follow / avoid
- Follow: <state mgmt, error handling, API style, auth approach>
- Avoid: <known traps in this codebase>

## Where the rest of the context lives
- Architecture: ./README.md, ./system-context.md, ./decisions/
- Design system: ../design-system/README.md
- Behaviour specs (build to these): ../features/*.feature
- Tests (make these pass): <test dir>

## Non-functional constraints that affect every change
<perf / security / a11y / compliance — the few that always apply. See ./constraints.md.>
