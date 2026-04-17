---
phase: 02-authentication
plan: "02"
subsystem: backend-auth-api
tags: [auth, jwt, passport, bcrypt, redis-blacklist, throttler, users, nestjs]
dependency_graph:
  requires:
    - RedisService (plan 02-01) — used for token blacklist in refresh/logout
    - DomainError hierarchy (plan 02-01) — UserAlreadyExistsError, InvalidCredentialsError
    - DomainExceptionFilter (plan 02-01) — maps errors to HTTP responses
    - cookie-parser middleware (plan 02-01) — required for req.cookies in refresh/logout
    - User.timezone field in schema (plan 02-01) — returned in all user responses
  provides:
    - POST /auth/signup — open registration, STUDENT default role, httpOnly refresh cookie
    - POST /auth/login — LocalStrategy email+password validation, rate-limited 5 req/60s
    - POST /auth/refresh — token rotation with Redis blacklist check
    - DELETE /auth/logout — blacklists token, clears cookie
    - GET /users/me — authenticated user profile (never exposes password)
    - PATCH /users/me — updates display name and/or timezone
    - JwtAuthGuard — reusable guard for all future protected routes
    - UserNotFoundError (statusCode 404) — available for future use
  affects:
    - apps/backend/src/app.module.ts (AuthModule + UsersModule registered)
tech_stack:
  added:
    - "@nestjs/passport (LocalStrategy, JwtStrategy via PassportModule)"
    - "@nestjs/jwt (JwtService with per-call secret signing)"
    - "@nestjs/throttler (ThrottlerGuard as APP_GUARD, 5 req/60s on auth endpoints)"
    - "bcrypt (async hash/compare with work factor 10)"
    - "passport-local (email+password validation strategy)"
    - "passport-jwt (Bearer token extraction + validation)"
  patterns:
    - Token rotation — old refresh token blacklisted on each /auth/refresh use
    - httpOnly cookie for refresh token (path=/auth, sameSite=strict, secure=production)
    - Bearer token in Authorization header for access token
    - JSON:API response format — { data, meta, errors } on all endpoints
    - ThrottlerGuard as APP_GUARD with per-endpoint @Throttle override for stricter limits
    - JwtSignOptions cast for expiresIn StringValue type compatibility with @nestjs/jwt v11
key_files:
  created:
    - apps/backend/src/auth/auth.module.ts
    - apps/backend/src/auth/auth.controller.ts
    - apps/backend/src/auth/auth.service.ts
    - apps/backend/src/auth/auth.service.spec.ts
    - apps/backend/src/auth/dto/signup.dto.ts
    - apps/backend/src/auth/dto/login.dto.ts
    - apps/backend/src/auth/strategies/jwt.strategy.ts
    - apps/backend/src/auth/strategies/local.strategy.ts
    - apps/backend/src/auth/guards/jwt-auth.guard.ts
    - apps/backend/src/auth/guards/local-auth.guard.ts
    - apps/backend/src/users/users.module.ts
    - apps/backend/src/users/users.controller.ts
    - apps/backend/src/users/users.service.ts
    - apps/backend/src/users/users.service.spec.ts
    - apps/backend/src/users/dto/update-profile.dto.ts
    - apps/backend/src/common/errors/user-not-found.error.ts
  modified:
    - apps/backend/src/app.module.ts (added AuthModule, UsersModule imports)
decisions:
  - "Used JwtModule.register({}) with per-call secret signing to support separate JWT_ACCESS_SECRET and JWT_REFRESH_SECRET without module-level config"
  - "ThrottlerGuard registered as APP_GUARD in AuthModule to apply globally; per-endpoint @Throttle({ default: { ttl: 60000, limit: 5 } }) overrides with stricter limits on login/signup"
  - "Logout silently ignores invalid/expired refresh tokens — cookie clearing must always succeed for good UX"
  - "JwtSignOptions['expiresIn'] cast used to bridge process.env string type to StringValue type required by @nestjs/jwt v11 / jsonwebtoken"
  - "UserNotFoundError created separately from InvalidCredentialsError to give 404 semantics for /users/me missing user case"
metrics:
  duration_minutes: 25
  completed_date: "2026-04-17T00:00:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 16
  files_modified: 1
---

# Phase 02 Plan 02: Auth and Users API Summary

**One-liner:** Complete JWT auth API with signup/login/refresh/logout using bcrypt+Passport+Redis token rotation, and users profile read/update endpoints, with 15 unit tests covering all AUTH-01 through AUTH-05 requirements.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create Auth module with signup, login, refresh, and logout endpoints | 4f51bb5 | 11 files changed (10 created, 1 modified) |
| 2 | Create Users module with profile read and update endpoints | 32aa937 | 6 files created |

## What Was Built

### Auth Module (4 endpoints)

- **POST /auth/signup** — validates SignupDto (email, strong password, name), hashes with bcrypt work factor 10, creates user with STUDENT default role, returns access token + sets httpOnly refresh cookie. Rate-limited 5 req/60s (T-02-06).
- **POST /auth/login** — protected by LocalAuthGuard (passport-local validates email+password via `validateUser`), issues new token pair, sets refresh cookie. Rate-limited 5 req/60s (T-02-05).
- **POST /auth/refresh** — reads refresh token from httpOnly cookie, verifies with JWT_REFRESH_SECRET, checks Redis blacklist, issues new tokens, blacklists old token with remaining TTL (token rotation per D-05, T-02-07).
- **DELETE /auth/logout** — requires valid Bearer token, blacklists refresh token, clears cookie. Silent on invalid token (D-04).

### JWT Strategy and Guards

- `JwtStrategy` — extracts Bearer token from Authorization header, validates against JWT_ACCESS_SECRET. Fails on missing env var at startup.
- `LocalStrategy` — uses `usernameField: 'email'` so Passport maps the `email` field correctly.
- `JwtAuthGuard` and `LocalAuthGuard` — thin wrappers for reuse across all future protected routes.

### Users Module (2 endpoints)

- **GET /users/me** — JwtAuthGuard protected, returns id/email/name/role/timezone/created_at. Password never in select clause (T-02-10).
- **PATCH /users/me** — partial update of name and/or timezone. Password change deferred per D-21.

### SignupDto Password Policy

Enforces per D-10/D-11: minimum 8 chars, at least 1 uppercase, 1 number, 1 symbol, no 3+ sequential digits, no 3+ repeating characters.

### Rate Limiting

`ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])` in AuthModule with `ThrottlerGuard` as `APP_GUARD`. Login and signup override with `@Throttle({ default: { ttl: 60000, limit: 5 } })` for stricter limits.

## Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| auth.service.spec.ts | 10 | PASS |
| users.service.spec.ts | 5 | PASS |
| redis.service.spec.ts | 7 | PASS |
| app.controller.spec.ts | 2 | PASS |
| **Total** | **24** | **ALL PASS** |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JwtSignOptions.expiresIn type incompatibility with @nestjs/jwt v11**
- **Found during:** Task 1 (first test run)
- **Issue:** `@nestjs/jwt` v11 uses `jsonwebtoken` types where `expiresIn` expects `StringValue` from `ms` package, not plain `string`. `process.env` returns `string | undefined`, causing TS2769 type error on both `signAccessToken` and `signRefreshToken`.
- **Fix:** Cast using `JwtSignOptions['expiresIn']` as the target type — bridges the `string` → `StringValue` gap without importing `ms` directly (which wasn't available as a direct module path in the project).
- **Files modified:** `apps/backend/src/auth/auth.service.ts`
- **Commit:** 4f51bb5 (included in original commit)

**2. [Rule 3 - Blocking] Prisma client not generated in worktree**
- **Found during:** Task 1 (first test run)
- **Issue:** Fresh worktree had no `apps/backend/src/generated/` directory — Prisma client was not generated, causing TS import errors in all test files that reference `PrismaService`.
- **Fix:** Ran `DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm exec prisma generate` to regenerate client from schema.
- **Files modified:** `apps/backend/src/generated/` (generated, gitignored)

## Known Stubs

None — all endpoints are fully wired to business logic. No placeholder data or hardcoded returns.

## Threat Flags

None — all threat mitigations from the plan's threat model were implemented as specified:
- T-02-05/T-02-06: ThrottlerGuard active on login/signup
- T-02-07: Token rotation with Redis blacklist
- T-02-08: httpOnly, sameSite=strict, path=/auth cookie attributes
- T-02-10: Password field excluded from all Prisma select clauses
- T-02-11: Separate JWT_ACCESS_SECRET/JWT_REFRESH_SECRET from process.env
- T-02-12: ThrottlerGuard + ValidationPipe on all endpoints
- T-02-13: Role field not in SignupDto (whitelist:true strips it), default STUDENT server-side

## Self-Check: PASSED

- [x] `apps/backend/src/auth/auth.module.ts` — FOUND
- [x] `apps/backend/src/auth/auth.controller.ts` — FOUND, contains @Controller('auth'), res.cookie('refresh_token'..., httpOnly: true
- [x] `apps/backend/src/auth/auth.service.ts` — FOUND, contains bcrypt.hash, bcrypt.compare, blacklist:, JWT_REFRESH_SECRET
- [x] `apps/backend/src/auth/auth.service.spec.ts` — FOUND, 10 tests pass
- [x] `apps/backend/src/auth/dto/signup.dto.ts` — FOUND, @IsEmail, @MinLength(8), password policy regexes
- [x] `apps/backend/src/auth/dto/login.dto.ts` — FOUND
- [x] `apps/backend/src/auth/strategies/jwt.strategy.ts` — FOUND, fromAuthHeaderAsBearerToken, JWT_ACCESS_SECRET
- [x] `apps/backend/src/auth/strategies/local.strategy.ts` — FOUND, usernameField: 'email'
- [x] `apps/backend/src/auth/guards/jwt-auth.guard.ts` — FOUND, AuthGuard('jwt')
- [x] `apps/backend/src/auth/guards/local-auth.guard.ts` — FOUND, AuthGuard('local')
- [x] `apps/backend/src/users/users.module.ts` — FOUND, exports: [UsersService]
- [x] `apps/backend/src/users/users.controller.ts` — FOUND, @Controller('users'), @UseGuards(JwtAuthGuard), @Get('me'), @Patch('me')
- [x] `apps/backend/src/users/users.service.ts` — FOUND, findById, updateProfile, no password in select
- [x] `apps/backend/src/users/users.service.spec.ts` — FOUND, 5 tests pass
- [x] `apps/backend/src/users/dto/update-profile.dto.ts` — FOUND, @IsOptional on both fields, no password field
- [x] `apps/backend/src/common/errors/user-not-found.error.ts` — FOUND, statusCode = 404
- [x] `apps/backend/src/app.module.ts` — FOUND, imports AuthModule and UsersModule
- [x] Commit 4f51bb5 — FOUND
- [x] Commit 32aa937 — FOUND
- [x] Full test suite: 24 tests pass across 4 suites
