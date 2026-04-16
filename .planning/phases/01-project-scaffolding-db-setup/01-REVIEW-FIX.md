---
phase: 01-project-scaffolding-db-setup
fixed_at: 2026-04-16T00:00:00Z
review_path: .planning/phases/01-project-scaffolding-db-setup/01-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-04-16T00:00:00Z
**Source review:** .planning/phases/01-project-scaffolding-db-setup/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### WR-01: Unhandled promise rejection in bootstrap

**Files modified:** `apps/backend/src/main.ts`
**Commit:** 70e928f
**Applied fix:** Added `.catch((err: unknown) => { console.error(...); process.exit(1); })` to the bare `bootstrap()` call so unhandled rejections during startup produce a clear diagnostic and exit cleanly.

### WR-02: DATABASE_URL may be undefined at Prisma config time

**Files modified:** `apps/backend/prisma.config.ts`
**Commit:** 05058b0
**Applied fix:** Extracted `process.env['DATABASE_URL']` into a `const databaseUrl` variable, added an early-exit guard that throws `Error('DATABASE_URL environment variable is not set')` when the variable is absent, and passed the narrowed `string` variable to `datasource.url` eliminating the `string | undefined` type issue.

### WR-03: Hardcoded relative envFilePath breaks non-CWD invocations

**Files modified:** `apps/backend/src/app.module.ts`
**Commit:** c1447f7
**Applied fix:** Removed the `envFilePath: '../../.env'` option from `ConfigModule.forRoot()`. Env vars are injected at the process level in production; for local dev, `dotenv/config` in `prisma.config.ts` already loads `.env`. A comment documents this intent.

### WR-04: @lms/shared package entry point points to raw TypeScript source

**Files modified:** `packages/shared/package.json`
**Commit:** d19cc06
**Applied fix:** Changed `main` from `./src/index.ts` to `./dist/index.js`, changed `types` from `./src/index.ts` to `./dist/index.d.ts`, and added an `exports` field with `import`/`require`/`types` conditions pointing to the compiled `dist/` output. Turborepo's `^build` dependency ensures `@lms/shared` is compiled before its consumers.

### WR-05: Non-pinned minio:latest Docker image tag

**Files modified:** `docker-compose.yml`
**Commit:** e9bfcda
**Applied fix:** Replaced `minio/minio:latest` with `minio/minio:RELEASE.2024-11-07T00-52-20Z` — a specific stable release tag matching the reviewer's recommendation, consistent with how postgres and redis services use pinned version tags.

---

_Fixed: 2026-04-16T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
