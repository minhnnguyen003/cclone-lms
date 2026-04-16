# Phase 1: Project Scaffolding + DB Setup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 01-project-scaffolding-db-setup
**Areas discussed:** Repo Structure, Docker Compose Scope

---

## Repo Structure

| Option | Description | Selected |
|--------|-------------|----------|
| pnpm monorepo — apps/backend + apps/frontend | Single repo, pnpm workspaces. Shared TypeScript types possible via packages/shared. Turborepo optional for parallel builds. | ✓ |
| Flat dirs — backend/ + frontend/ in root | Simpler. No workspace overhead. Each dir has its own package.json and node_modules. | |
| Separate repos | Full isolation. More git overhead. Complex for a solo dev. | |

**User's choice:** pnpm monorepo — apps/backend + apps/frontend

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — packages/shared from the start | Create packages/shared for TypeScript types/interfaces shared between backend and frontend. | ✓ |
| No — add shared package later when needed | Start lean. Duplicate types if needed, extract shared package when it becomes painful. | |

**User's choice:** Yes — packages/shared from the start

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — set up Turborepo pipeline | turbo.json with build/test/lint pipelines. Parallel runs, caching. | ✓ |
| No — pnpm -r scripts only | Just pnpm --filter or -r for running workspace scripts. Less overhead. | |

**User's choice:** Yes — set up Turborepo pipeline

---

| Option | Description | Selected |
|--------|-------------|----------|
| Repo root — each workspace extends root config | Root eslint.config.js, prettier.config.js, tsconfig.base.json. Each app extends with its own overrides. | ✓ |
| Each workspace manages its own config | Independent configs per app. Simpler but diverges over time. | |

**User's choice:** Repo root — each workspace extends root config

---

| Option | Description | Selected |
|--------|-------------|----------|
| Root-level husky — one hook for all workspaces | Single .husky/ at root. pre-commit runs lint-staged across all changed files. | ✓ |
| Per-workspace husky | Each app has its own hooks. More granular but adds setup complexity. | |

**User's choice:** Root-level husky — one hook for all workspaces

---

## Docker Compose Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 1-2 essentials only — PostgreSQL, Redis, MinIO | Only what Phase 1-2 needs. ClickHouse + Kafka added later. | ✓ |
| All future services upfront | Scaffold all infrastructure now including ClickHouse, Kafka, Zookeeper. | |

**User's choice:** Phase 1-2 essentials only — PostgreSQL, Redis, MinIO

---

| Option | Description | Selected |
|--------|-------------|----------|
| No — use Prisma Studio instead | Prisma Studio covers DB inspection. No extra container needed. | ✓ |
| Yes — include pgAdmin | pgAdmin adds a container but gives full SQL access. | |
| Yes — include Adminer (lightweight) | Adminer is lighter than pgAdmin. | |

**User's choice:** No — use Prisma Studio instead

---

| Option | Description | Selected |
|--------|-------------|----------|
| Single node, dev credentials, auto-create bucket on startup | MINIO_ROOT_USER=minioadmin, MINIO_ROOT_PASSWORD=minioadmin. Startup script creates default bucket. | ✓ |
| Single node, custom credentials from .env | Read MinIO creds from .env file. | |

**User's choice:** Single node, dev credentials, auto-create bucket on startup

---

| Option | Description | Selected |
|--------|-------------|----------|
| No — email is out of scope for MVP | PROJECT.md explicitly defers email notifications. | ✓ |
| Yes — add mailpit now | Mailpit is lightweight, useful for future email phases. | |

**User's choice:** No — email is out of scope for MVP

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — named volumes, data persists | postgres_data, redis_data, minio_data as named volumes. Data survives restarts. | ✓ |
| No — fresh DB on every restart | Each docker-compose up starts clean. | |

**User's choice:** Yes — named volumes, data persists

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — health checks + depends_on condition | PostgreSQL HEALTHCHECK with pg_isready. NestJS depends_on with condition: service_healthy. | ✓ |
| No — skip health checks | Start services without ordering guarantees. | |

**User's choice:** Yes — health checks + depends_on condition

---

## Claude's Discretion

- DB schema scope in Phase 1 (empty migration vs minimal User/Tenant model)
- Frontend scaffolding depth (Hello World vs routing shell)
- Environment config pattern (.env.example approach)
- Testing infrastructure setup (Jest + Vitest wiring)

## Deferred Ideas

None — discussion stayed within phase scope.
