# Phase 1: Project Scaffolding + DB Setup - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the development environment, project structure, and tooling so every subsequent phase can build on a solid foundation. This phase delivers a working monorepo with NestJS backend, React+Vite+Tailwind frontend, Prisma connected to PostgreSQL, and a Docker Compose dev environment — no functional features, no user-facing screens.

</domain>

<decisions>
## Implementation Decisions

### Monorepo Structure
- **D-01:** pnpm workspaces monorepo — `apps/backend` (NestJS) + `apps/frontend` (React+Vite) + `packages/shared` (TypeScript types/interfaces shared across apps)
- **D-02:** Turborepo pipeline set up from the start with `turbo.json` defining `build`, `test`, and `lint` task pipelines for parallel execution and caching
- **D-03:** Shared config at repo root — `eslint.config.js`, `prettier.config.js`, `tsconfig.base.json` — each workspace extends with its own overrides
- **D-04:** Root-level husky with a single `.husky/` directory; `pre-commit` runs lint-staged across all changed files in any workspace

### Docker Compose Services
- **D-05:** Phase 1-2 essentials only: PostgreSQL 16, Redis 7, MinIO — ClickHouse and Kafka are explicitly deferred to Phase 13 and will be added to docker-compose.yml at that time
- **D-06:** No DB admin UI container — Prisma Studio (`npx prisma studio`) serves dev DB inspection needs
- **D-07:** MinIO configured with dev credentials (`minioadmin`/`minioadmin`) and a startup script that auto-creates the default bucket (`lms-files`)
- **D-08:** No mail container — email notifications are explicitly out of MVP scope (see PROJECT.md)
- **D-09:** Named volumes for all stateful services: `postgres_data`, `redis_data`, `minio_data` — data persists across `docker-compose down`; wipe with `docker-compose down -v`
- **D-10:** Health checks + `depends_on` with `condition: service_healthy` on all dependent services — `pg_isready` for PostgreSQL, TCP check for Redis and MinIO — prevents startup race conditions

### Claude's Discretion
- **DB schema in Phase 1:** Whether to include an empty migration only (prove Prisma connectivity) or scaffold the core User + Tenant tables. Claude should decide based on what best unblocks Phase 2 — lean toward scaffolding a minimal User model if it avoids backtracking.
- **Frontend entry point depth:** Whether to include React Router v7 routing shell with placeholder routes or just a Vite+React+Tailwind Hello World. Claude should make a pragmatic call — enough to verify the stack works and unblock Phase 2 UI work.
- **Environment config pattern:** `.env.example` committed to git with all required variable names and sample values; `.env` gitignored. Define all Phase 1 services' connection variables upfront.
- **Testing infrastructure:** Claude's call on whether to wire up Jest (backend) + Vitest (frontend) with a single example passing test each. Recommended: yes — it confirms the test runner works before Phase 2 adds real tests.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack & Technology Choices
- `CLAUDE.md` — Full stack definition with versions and rationale. All version choices for NestJS, Prisma, React, Vite, TailwindCSS, Turborepo, pnpm are locked here.

### Project Context
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope items (email, mobile-first UI)
- `.planning/REQUIREMENTS.md` — Full v1 requirement list; Phase 1 has no functional requirements but later phases depend on this scaffold

No external ADRs or specs — all requirements are fully captured in decisions above and CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — codebase is empty. Only `CLAUDE.md` and `Docs/` exist at project root.

### Established Patterns
- None yet — this phase establishes the patterns all future phases will follow.

### Integration Points
- Everything in this phase is a foundation — future phases connect into the NestJS module system, Prisma schema, and React Router routes created here.

</code_context>

<specifics>
## Specific Ideas

No specific implementation references — open to standard approaches following the CLAUDE.md stack choices.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-project-scaffolding-db-setup*
*Context gathered: 2026-04-16*
