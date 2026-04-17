---
phase: 02-authentication
generated: 2026-04-17
asvs_level: 1
auditor: gsd-secure-phase
---

# Security Audit — Phase 02 Authentication

## Summary

**Threats Closed:** 21/21
**Threats Open:** 0/21
**Unregistered Flags:** 0

---

## Threat Verification Table

| Threat ID | Plan | Category | Disposition | Status | Evidence |
|-----------|------|----------|-------------|--------|----------|
| T-02-01 | 02-01 | Information Disclosure | mitigate | CLOSED | `.env.example` contains placeholder values only; `.env.example` line 6 `JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars`. Git tracks `.env.example`, `.env` is gitignored. |
| T-02-02 | 02-01 | Tampering | mitigate | CLOSED | `apps/backend/src/main.ts` line 25-29: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` strips unknown fields from all DTOs globally. |
| T-02-03 | 02-01 | Tampering | mitigate | CLOSED | `apps/backend/src/main.ts` lines 15-20: `app.enableCors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173', credentials: true, ... })` — explicit origin, not wildcard. |
| T-02-04 | 02-01 | Denial of Service | accept | CLOSED | Accepted risk documented: Redis failure at startup throws, preventing silent misconfiguration. Acceptable for dev environment. |
| T-02-05 | 02-02 | Spoofing | mitigate | CLOSED | `apps/backend/src/auth/auth.controller.ts` line 33: `@Throttle({ default: { ttl: 60000, limit: 5 } })` on `POST /auth/login`. ThrottlerGuard registered as APP_GUARD in `auth.module.ts` line 23. |
| T-02-06 | 02-02 | Spoofing | mitigate | CLOSED | `apps/backend/src/auth/auth.controller.ts` line 22: `@Throttle({ default: { ttl: 60000, limit: 5 } })` on `POST /auth/signup`. `apps/backend/src/auth/auth.service.ts` line 48: `await bcrypt.hash(dto.password, 10)`. `apps/backend/prisma/schema.prisma`: `email String @unique`. |
| T-02-07 | 02-02 | Spoofing | mitigate | CLOSED | `apps/backend/src/auth/auth.service.ts` lines 125-144: old token verified, blacklist checked via `redisService.get('blacklist:...')`, new tokens issued, old token blacklisted with remaining TTL via `redisService.set('blacklist:...', '1', ttl)`. |
| T-02-08 | 02-02 | Tampering | mitigate | CLOSED | `apps/backend/src/auth/auth.controller.ts` lines 10-16: `REFRESH_COOKIE_OPTIONS = { httpOnly: true, secure: process.env['NODE_ENV'] === 'production', sameSite: 'strict', maxAge: 30*24*60*60*1000, path: '/auth' }`. Applied on lines 29, 43, 62. |
| T-02-09 | 02-02 | Repudiation | accept | CLOSED | Accepted risk documented: audit logging deferred to Phase 13 (AUDT-01). Acceptable for v1 auth phase. |
| T-02-10 | 02-02 | Information Disclosure | mitigate | CLOSED | `apps/backend/src/users/users.service.ts`: Prisma `select` clause excludes password field. `apps/backend/src/auth/auth.service.ts`: user created/queried but only `id, email, name, role, timezone` returned in all response objects (lines 62-71, 103-112, 147-156). No `password` field appears in any select clause. |
| T-02-11 | 02-02 | Information Disclosure | mitigate | CLOSED | `apps/backend/src/auth/auth.service.ts` lines 174, 182: `secret: process.env['JWT_ACCESS_SECRET']` and `secret: process.env['JWT_REFRESH_SECRET']`. `apps/backend/src/auth/strategies/jwt.strategy.ts` line 16: reads from `process.env['JWT_ACCESS_SECRET']`. Never hardcoded. |
| T-02-12 | 02-02 | Denial of Service | mitigate | CLOSED | ThrottlerGuard as APP_GUARD (`auth.module.ts` line 23). `main.ts` lines 22-29: `ValidationPipe` rejects malformed input before business logic. |
| T-02-13 | 02-02 | Elevation of Privilege | mitigate | CLOSED | `apps/backend/src/auth/dto/signup.dto.ts`: no `role` field present — `whitelist: true` strips any role field submitted by client. Prisma `user.create` does not pass role, so DB default `STUDENT` applies. |
| T-02-14 | 02-03 | Information Disclosure | mitigate | CLOSED | `apps/frontend/src/stores/auth-store.ts`: token stored only in Zustand memory (`accessToken: string | null`). Grep for `localStorage`/`sessionStorage` across entire `apps/frontend/src/` returns zero matches. |
| T-02-15 | 02-03 | Denial of Service | mitigate | CLOSED | `apps/frontend/src/lib/axios.ts` lines 50-57: `AUTH_ENDPOINTS.includes(originalRequest.url ?? '')` prevents `/auth/refresh` 401 from re-triggering refresh. Line 45-46: `originalRequest._retry` flag prevents double retry. |
| T-02-16 | 02-03 | Tampering | mitigate | CLOSED | `apps/frontend/src/pages/login.tsx` lines 22-30: `validateNextParam()` — decoded value must start with `/` and must not contain `://`; returns `/dashboard` if invalid. `apps/frontend/src/components/layouts/private-route.tsx`: uses `encodeURIComponent(location.pathname + location.search)` — path-only. |
| T-02-17 | 02-03 | Information Disclosure | accept | CLOSED | Accepted risk documented: Vite proxy is dev-server-only. Production uses reverse proxy. No security impact at runtime. |
| T-02-18 | 02-04 | Tampering | mitigate | CLOSED | `apps/frontend/src/pages/login.tsx` lines 22-30: `validateNextParam()` validates must start with `/` and not contain `://`. Matches threat plan exactly. |
| T-02-19 | 02-04 | Spoofing | mitigate | CLOSED | `apps/frontend/src/pages/login.tsx` line 67: single error message "Invalid email or password. Please try again." for all 401 responses — does not reveal whether email or password is wrong. Backend `auth.service.ts` throws `InvalidCredentialsError()` for both user-not-found and wrong-password cases. |
| T-02-20 | 02-04 | Information Disclosure | accept | CLOSED | Accepted risk documented: 409 on duplicate email reveals email existence. Rate limiting on signup (5 req/60s via ThrottlerGuard) partially mitigates enumeration. Accepted for v1. |
| T-02-21 | 02-04 | Tampering | mitigate | CLOSED | `apps/frontend/src/pages/profile.tsx`: zod validation on frontend. `apps/backend/src/users/dto/update-profile.dto.ts`: class-validator on backend. `main.ts` `whitelist: true` strips unknown fields. Only `name` and `timezone` are updatable fields. |

---

## Accepted Risks Log

| Threat ID | Risk | Rationale |
|-----------|------|-----------|
| T-02-04 | Redis connection failure causes startup crash | Acceptable for dev. Production would add connection retry/health check. |
| T-02-09 | No audit logging for auth actions | Deferred to Phase 13 (AUDT-01). Standard for v1. |
| T-02-17 | Vite proxy exposes backend routes during development | Dev-server-only feature. No production impact. |
| T-02-20 | Duplicate email signup returns 409, revealing email existence | Standard UX pattern. Partially mitigated by rate limiting. Accepted for v1. |

---

## Unregistered Threat Flags

None. All SUMMARY.md `## Threat Flags` sections across plans 02-01 through 02-04 report "None" or "No new threat surface." No unregistered attack surface was identified by the executor during implementation.

---

## Notes

- T-02-16 and T-02-18 both address the same `?next=` open redirect vector (the former from Plan 03's `encodeURIComponent` encoding in PrivateRoute, the latter from Plan 04's `validateNextParam` in LoginPage). Both controls are present and complementary.
- The axios interceptor deviation from the plan (implementing `AUTH_ENDPOINTS` list instead of just `/auth/refresh`) is a security improvement — it additionally excludes `/auth/login` and `/auth/signup` from silent refresh retry, reducing potential for unexpected request amplification.
- The `password` field exclusion (T-02-10) is enforced at the service layer via explicit Prisma `select` clauses and by never including password in any return type. No `password` field was found in any API response shape across the entire auth codebase.
