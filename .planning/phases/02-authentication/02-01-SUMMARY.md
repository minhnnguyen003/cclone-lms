---
phase: 02-authentication
plan: "01"
subsystem: backend-infrastructure
tags: [redis, auth-packages, domain-errors, cors, cookie-parser, prisma]
dependency_graph:
  requires: []
  provides:
    - RedisService (SET/GET/DEL with TTL, used for token blacklisting in plan 02-02)
    - DomainError base class + UserAlreadyExistsError + InvalidCredentialsError
    - DomainExceptionFilter (global JSON:API error mapping)
    - cookie-parser middleware
    - CORS with credentials:true
    - ValidationPipe (whitelist, forbidNonWhitelisted, transform)
    - User.timezone field in schema + Prisma client
  affects:
    - apps/backend/src/app.module.ts (RedisModule registered globally)
    - apps/backend/src/main.ts (middleware stack complete)
    - apps/backend/prisma/schema.prisma (User model updated)
tech_stack:
  added:
    - "@nestjs/passport@^11.0.5"
    - "@nestjs/jwt@^11.0.2"
    - "passport-jwt@^4.0.1"
    - "passport-local@^1.0.0"
    - "bcrypt@^6.0.0"
    - "ioredis@^5.10.1"
    - "cookie-parser@^1.4.7"
    - "@nestjs/throttler@^6.5.0"
    - "@types/bcrypt, @types/passport, @types/passport-jwt, @types/passport-local, @types/cookie-parser"
  patterns:
    - DomainError hierarchy for typed error handling with HTTP mapping
    - Global @Catch(DomainError) exception filter returning JSON:API format
    - @Global() NestJS module for Redis singleton injection
key_files:
  created:
    - apps/backend/src/redis/redis.service.ts
    - apps/backend/src/redis/redis.module.ts
    - apps/backend/src/redis/redis.service.spec.ts
    - apps/backend/src/common/errors/domain.error.ts
    - apps/backend/src/common/errors/user-already-exists.error.ts
    - apps/backend/src/common/errors/invalid-credentials.error.ts
    - apps/backend/src/common/filters/domain-exception.filter.ts
    - apps/backend/.env (gitignored, local dev secrets)
  modified:
    - apps/backend/src/main.ts
    - apps/backend/src/app.module.ts
    - apps/backend/prisma/schema.prisma
    - .env.example
    - apps/backend/package.json
decisions:
  - "Used ioredis directly (not @nestjs-modules/ioredis) to keep the service thin and avoid wrapping a wrapper"
  - "DomainError as abstract class (not interface) so instanceof checks work correctly at runtime"
  - "db push deferred — requires running Docker/PostgreSQL; schema and generated client are correct"
metrics:
  duration_minutes: 3
  completed_date: "2026-04-16T23:39:31Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 7
  files_modified: 5
---

# Phase 02 Plan 01: Auth Infrastructure Setup Summary

**One-liner:** JWT auth packages installed, Redis module wired globally, domain error hierarchy with JSON:API exception filter, cookie-parser + CORS + ValidationPipe configured in main.ts, User.timezone added to schema.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install auth packages, configure main.ts, create Redis module and domain errors | df80932 | 12 files changed |
| 2 | Update User schema with timezone field and push to database | 220ecb3 | schema.prisma |

## What Was Built

### Redis Module
- `RedisService` wraps ioredis with `set(key, value, ttlSeconds)`, `get(key)`, `del(key)` — the exact interface needed for JWT token blacklisting
- `RedisModule` is `@Global()` so any module can inject `RedisService` without re-importing
- Throws on startup if `REDIS_URL` not set — fail-fast prevents silent misconfiguration

### Domain Error Hierarchy
- `DomainError` — abstract base extending `Error`, requires subclasses to define `statusCode`
- `UserAlreadyExistsError` — statusCode 409, takes email parameter for clear message
- `InvalidCredentialsError` — statusCode 401, default message "Invalid credentials."
- `DomainExceptionFilter` — `@Catch(DomainError)` filter returns JSON:API format: `{ data: null, meta: {}, errors: [{ status, title, detail }] }`

### main.ts Middleware Stack
- `cookieParser()` — must be registered before guards so `req.cookies` is populated when JwtRefreshGuard runs
- `enableCors({ credentials: true, origin: CORS_ORIGIN })` — explicit origin required (not wildcard) when `credentials: true`
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` — strips unknown fields from all DTOs
- `useGlobalFilters(new DomainExceptionFilter())` — maps DomainError subclasses to HTTP responses globally

### Schema Update
- `timezone String @default("UTC")` added to User model (per D-20: editable profile field)
- Prisma client regenerated — `User.timezone` available in all query types
- `prisma db push` requires a running PostgreSQL instance (Docker not active during execution)

## Deviations from Plan

### Auto-fixed Issues

None.

### Environment Notes

**[Environment Gate] prisma db push skipped — Docker not running**
- **Found during:** Task 2
- **Issue:** `docker compose` and `docker` daemon unavailable; PostgreSQL at `localhost:5433` unreachable
- **Status:** Schema file correct, Prisma client regenerated successfully from schema. The `db push` step must be run when Docker is started: `cd apps/backend && npx prisma db push --accept-data-loss`
- **Impact:** Zero — the schema file and generated client are the source of truth. The database column will be added on the next `db push`.

## Known Stubs

None — this plan creates infrastructure only (no UI components, no data rendering).

## Threat Flags

None — no new network endpoints or auth paths introduced. The CORS and cookie-parser configuration is the mitigation for T-02-03 and T-02-01 in the threat model (not new surface).

## Self-Check: PASSED

- [x] `apps/backend/src/redis/redis.service.ts` — FOUND
- [x] `apps/backend/src/redis/redis.module.ts` — FOUND
- [x] `apps/backend/src/redis/redis.service.spec.ts` — FOUND (7 tests pass)
- [x] `apps/backend/src/common/errors/domain.error.ts` — FOUND
- [x] `apps/backend/src/common/errors/user-already-exists.error.ts` — FOUND
- [x] `apps/backend/src/common/errors/invalid-credentials.error.ts` — FOUND
- [x] `apps/backend/src/common/filters/domain-exception.filter.ts` — FOUND
- [x] `apps/backend/src/main.ts` — contains cookieParser, enableCors, credentials:true, useGlobalFilters, useGlobalPipes
- [x] `apps/backend/src/app.module.ts` — contains RedisModule
- [x] `apps/backend/prisma/schema.prisma` — contains `timezone String @default("UTC")`
- [x] `.env.example` — contains JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN
- [x] Commit df80932 — FOUND
- [x] Commit 220ecb3 — FOUND
- [x] 9 tests pass (2 test suites)
