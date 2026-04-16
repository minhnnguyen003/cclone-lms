---
phase: 01-project-scaffolding-db-setup
plan: 02
subsystem: backend, frontend, shared
tags: [nestjs, prisma, react, vite, tailwindcss, react-router, typescript, postgresql]
dependency_graph:
  requires:
    - 01-01 (pnpm monorepo root, tsconfig.base.json, docker-compose.yml)
  provides:
    - NestJS backend app with Prisma v7 (CJS mode), User model, PrismaService/PrismaModule
    - React+Vite+Tailwind v4 frontend with React Router v7 and @/ path aliases
    - @lms/shared package with UserRole enum, ApiResponse, ApiErrorResponse types
    - PostgreSQL users table (UUID PK, Role enum, soft delete, timestamps)
  affects:
    - All Phase 2 plans (auth, course management) build on this backend/frontend foundation
    - Plan 01-03 (dev tooling) wires ESLint/Prettier/husky onto this scaffold
tech_stack:
  added:
    - NestJS 11.1 (@nestjs/common, @nestjs/core, @nestjs/config, @nestjs/platform-express, @nestjs/swagger)
    - Prisma 7.7.0 with prisma.config.ts datasource pattern (v7.7+ breaking change)
    - @prisma/client 7.7.0 with moduleFormat=cjs (NestJS CJS compatibility fix)
    - tsconfig-paths 4.2.0 (runtime @/ alias resolution for nest start --watch)
    - tsc-alias 1.8.0 (build-time @/ alias resolution for compiled dist/)
    - React 19.2 + Vite 8.0 + TailwindCSS 4.2 (CSS-first config)
    - @tailwindcss/vite 4.2 (Vite plugin, replaces PostCSS in v4)
    - React Router 7.14 (createBrowserRouter + RouterProvider)
    - dotenv 16.x (required by prisma.config.ts)
  patterns:
    - Prisma v7.7+ datasource URL moved from schema.prisma to prisma.config.ts
    - PrismaService extends PrismaClient with OnModuleInit/OnModuleDestroy lifecycle hooks
    - @Global() PrismaModule for app-wide DI availability without re-importing
    - NODE_OPTIONS='-r tsconfig-paths/register' in start:dev for runtime alias resolution
    - TailwindCSS v4: @import "tailwindcss" in CSS, no tailwind.config.js, no PostCSS
    - Named React component exports (export const App = () => ...) per CLAUDE.md
key_files:
  created:
    - apps/backend/package.json
    - apps/backend/tsconfig.json
    - apps/backend/tsconfig.build.json
    - apps/backend/nest-cli.json
    - apps/backend/prisma/schema.prisma
    - apps/backend/prisma.config.ts
    - apps/backend/src/main.ts
    - apps/backend/src/app.module.ts
    - apps/backend/src/app.controller.ts
    - apps/backend/src/app.service.ts
    - apps/backend/src/prisma/prisma.service.ts
    - apps/backend/src/prisma/prisma.module.ts
    - apps/frontend/package.json
    - apps/frontend/tsconfig.json
    - apps/frontend/tsconfig.app.json
    - apps/frontend/tsconfig.node.json
    - apps/frontend/vite.config.ts
    - apps/frontend/index.html
    - apps/frontend/src/main.tsx
    - apps/frontend/src/App.tsx
    - apps/frontend/src/index.css
    - apps/frontend/src/vite-env.d.ts
    - packages/shared/package.json
    - packages/shared/tsconfig.json
    - packages/shared/src/index.ts
  modified:
    - pnpm-lock.yaml (updated with all new workspace dependencies)
decisions:
  - "Prisma v7.7.0 requires prisma.config.ts for datasource URL — not schema.prisma url= field"
  - "Used port 5433 for LMS PostgreSQL to avoid conflict with existing container on 5432"
  - "User model includes Role enum (STUDENT/INSTRUCTOR/ADMIN) now to unblock Phase 2 auth"
  - "app.controller.ts imports via @/app.service to prove path alias resolution works"
  - "@lms/shared uses CJS (no type:module) to be importable from NestJS backend"
metrics:
  duration_minutes: 25
  completed_date: "2026-04-16"
  tasks_completed: 3
  tasks_total: 3
  files_created: 25
  files_modified: 1
---

# Phase 01 Plan 02: NestJS Backend + React Frontend Scaffold Summary

**One-liner:** NestJS 11 backend with Prisma 7.7 (CJS mode + prisma.config.ts datasource), User model migrated to PostgreSQL, React+Vite+Tailwind v4 frontend with React Router v7, and @lms/shared types package.

## What Was Built

**Task 1 — NestJS Backend with Prisma:**
Created the complete NestJS application scaffold inside `apps/backend/`. The app wires AppModule with ConfigModule (global, reads root .env) and PrismaModule (global, provides PrismaService to the entire app without re-importing). AppController has a `GET /` health endpoint that imports from `@/app.service` (using the path alias) to prove alias resolution works. tsconfig.json adds `emitDecoratorMetadata: true` and `experimentalDecorators: true` required by NestJS decorators. The `start:dev` script uses `NODE_OPTIONS='-r tsconfig-paths/register'` so `@/` aliases resolve at runtime during `nest start --watch`. The build script chains `tsc-alias -p tsconfig.json` after `nest build` to rewrite compiled paths for production.

**Task 2 — React+Vite+Tailwind v4 Frontend:**
Created the frontend in `apps/frontend/` with Vite 8 and React 19.2. TailwindCSS v4 is configured the CSS-first way: `@import "tailwindcss"` in `index.css`, `@tailwindcss/vite` plugin in `vite.config.ts` — no `tailwind.config.js`, no PostCSS. React Router v7 routing shell is in place with `createBrowserRouter` showing the scaffold landing page. `vite.config.ts` maps `@` to `./src` for path alias resolution. `main.tsx` imports from `@/App` (alias) and `@/index.css`. Created `packages/shared/src/index.ts` with `UserRole` enum, `ApiResponse<T>` and `ApiErrorResponse` interfaces.

**Task 3 — Database Push:**
Ran `prisma db push --accept-data-loss` from `apps/backend/`. The LMS PostgreSQL was started on port 5433 (port 5432 was occupied by another project's container). The users table was created with UUID primary key, email unique constraint, Role enum (roles), soft delete column, and timestamps. Prisma client generated to `src/generated/prisma/` in CJS format.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | 458c093 | feat(01-02): scaffold NestJS backend with Prisma v7 and User model |
| Task 2 | 5e98d95 | feat(01-02): scaffold React+Vite+Tailwind v4 frontend and shared types package |
| Task 3 | — | No commit — DB push creates runtime state only (.env and generated/ are gitignored) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma v7.7.0 schema.prisma no longer accepts datasource url= field**
- **Found during:** Task 1, step 15 (prisma generate)
- **Issue:** Prisma 7.7.0 introduced a breaking change: the `url` property in `datasource db {}` block of `schema.prisma` was removed. The plan used the previous format (`url = env("DATABASE_URL")` inside the schema). Running `prisma generate` with the plan's schema produced: `Error: The datasource property url is no longer supported in schema files. Move connection URLs to prisma.config.ts`
- **Fix:** Removed `url = env("DATABASE_URL")` from `schema.prisma` datasource block. Created `apps/backend/prisma.config.ts` following the new Prisma v7.7+ pattern (imports `defineConfig` from `prisma/config`, reads DATABASE_URL from environment). Added `dotenv` as devDependency for `prisma.config.ts` to load `.env` file.
- **Files modified:** `apps/backend/prisma/schema.prisma` (removed url field), `apps/backend/prisma.config.ts` (created), `apps/backend/package.json` (added dotenv devDependency)
- **Commit:** 458c093

**2. [Rule 3 - Blocking] Port 5432 conflict prevented PostgreSQL startup**
- **Found during:** Task 3 (docker compose up -d postgres)
- **Issue:** An existing PostgreSQL container from another project (`mvn2026-sqldb-1`) was already bound to port 5432. Docker refused to start the LMS postgres on the same port.
- **Fix:** Created worktree-local `.env` with `POSTGRES_PORT=5433` and `DATABASE_URL=postgresql://lms:lms_dev@localhost:5433/lms`. Also updated `apps/backend/.env` to match. LMS PostgreSQL started successfully on 5433. `prisma db push` connected and created the users table.
- **Files modified:** `.env` (worktree root, gitignored), `apps/backend/.env` (gitignored)
- **Impact:** The `docker-compose.yml` `POSTGRES_PORT` env var already supported this via `${POSTGRES_PORT:-5432}` — no docker-compose changes needed.

## Known Stubs

The frontend `App.tsx` renders a static "CClone LMS / Phase 1 — Scaffold OK" page. This is an intentional scaffold placeholder. Phase 2 (Authentication) will replace it with the login/signup routing shell.

## Threat Flags

No new security surface beyond the threat model:
- T-01-04 mitigated: `apps/backend/.env` is gitignored, only dev credentials, DATABASE_URL in prisma.config.ts reads from environment
- T-01-05 mitigated: `apps/backend/src/generated/` is in .gitignore (per Plan 01), Prisma client not committed

## Self-Check: PASSED

Files exist:
- apps/backend/package.json: FOUND
- apps/backend/tsconfig.json: FOUND
- apps/backend/tsconfig.build.json: FOUND
- apps/backend/nest-cli.json: FOUND
- apps/backend/prisma/schema.prisma: FOUND
- apps/backend/prisma.config.ts: FOUND
- apps/backend/src/main.ts: FOUND
- apps/backend/src/app.module.ts: FOUND
- apps/backend/src/app.controller.ts: FOUND
- apps/backend/src/app.service.ts: FOUND
- apps/backend/src/prisma/prisma.service.ts: FOUND
- apps/backend/src/prisma/prisma.module.ts: FOUND
- apps/frontend/package.json: FOUND
- apps/frontend/vite.config.ts: FOUND
- apps/frontend/src/App.tsx: FOUND
- apps/frontend/src/index.css: FOUND
- packages/shared/src/index.ts: FOUND

Commits exist:
- 458c093: FOUND (feat(01-02): scaffold NestJS backend...)
- 5e98d95: FOUND (feat(01-02): scaffold React+Vite+Tailwind v4...)

Verification results:
- prisma-cjs-ok: PASS (moduleFormat = "cjs" in schema.prisma)
- user-model-ok: PASS (@@map("users") present)
- role-enum-ok: PASS (enum Role with STUDENT/INSTRUCTOR/ADMIN)
- tsconfig-paths-ok: PASS (start:dev contains NODE_OPTIONS tsconfig-paths/register)
- tsc-alias-ok: PASS (build script contains tsc-alias)
- emitDecoratorMetadata: PASS (tsconfig.json)
- tailwind-vite-ok: PASS (@tailwindcss/vite in vite.config.ts)
- alias-ok: PASS (resolve.alias in vite.config.ts)
- tw-v4-ok: PASS (@import "tailwindcss" in index.css)
- router-ok: PASS (createBrowserRouter in App.tsx)
- named-export-ok: PASS (export const App)
- path-alias-ok: PASS (@/App import in main.tsx)
- esm-ok: PASS (type: module in frontend package.json)
- shared-types-ok: PASS (UserRole, ApiResponse, ApiErrorResponse exported)
- db-push: PASS (users table in PostgreSQL lms database on port 5433)
- client-generated: PASS (src/generated/prisma/ directory exists with client files)
