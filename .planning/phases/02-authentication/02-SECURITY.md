---
phase: 02
slug: authentication
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-17
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Client → NestJS API | React frontend to backend over HTTP (proxied via Vite in dev) | Credentials, JWT access token, refresh cookie |
| NestJS → PostgreSQL | ORM queries via Prisma | Hashed passwords, user records |
| NestJS → Redis | Token blacklist operations (SET/GET/DEL) | JWT token identifiers, TTLs |
| Browser memory | Zustand store holding access token in-memory only | JWT access token (never persisted to storage) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Information Disclosure | .env / secrets | mitigate | `.env` gitignored; `.env.example` has placeholder values only | closed |
| T-02-02 | Tampering | ValidationPipe | mitigate | `whitelist: true, forbidNonWhitelisted: true, transform: true` in `main.ts` | closed |
| T-02-03 | Tampering (CORS) | main.ts | mitigate | Explicit `CORS_ORIGIN` env var, `credentials: true`, no wildcard | closed |
| T-02-04 | Denial of Service | Redis startup | accept | Accepted — documented in Accepted Risks Log | closed |
| T-02-05 | Spoofing (login brute-force) | auth.controller.ts | mitigate | `@Throttle({ default: { ttl: 60000, limit: 5 } })` on POST /auth/login | closed |
| T-02-06 | Spoofing (signup abuse) | auth.controller.ts | mitigate | Same throttle on POST /auth/signup + bcrypt work factor 10 + DB unique constraint | closed |
| T-02-07 | Spoofing (token reuse) | auth.service.ts | mitigate | Token rotation with Redis blacklist; old token blacklisted with remaining TTL | closed |
| T-02-08 | Tampering (cookie) | auth.controller.ts | mitigate | `httpOnly: true, sameSite: 'strict', secure: production, path: '/auth'` | closed |
| T-02-09 | Repudiation | audit logging | accept | Accepted — audit logging deferred to Phase 13 | closed |
| T-02-10 | Information Disclosure (password) | auth.service.ts / users.service.ts | mitigate | Password excluded from all Prisma select clauses and response objects | closed |
| T-02-11 | Information Disclosure (JWT secrets) | auth.service.ts / jwt.strategy.ts | mitigate | Secrets read from `process.env` only, never hardcoded | closed |
| T-02-12 | Denial of Service (signup) | auth.module.ts / main.ts | mitigate | ThrottlerGuard as APP_GUARD + ValidationPipe globally registered | closed |
| T-02-13 | Elevation of Privilege (role) | signup.dto.ts | mitigate | No `role` field in SignupDto; `whitelist: true` strips client-supplied role; DB default `STUDENT` | closed |
| T-02-14 | Information Disclosure (token storage) | auth-store.ts | mitigate | Access token in Zustand memory only — no localStorage/sessionStorage | closed |
| T-02-15 | Denial of Service (interceptor loop) | axios.ts | mitigate | `AUTH_ENDPOINTS` array excludes `/auth/refresh`, `/auth/login`, `/auth/signup` from retry; `_retry` flag prevents double retry | closed |
| T-02-16 | Tampering (open redirect) | private-route.tsx | mitigate | `encodeURIComponent(pathname + search)` — path-only; login validates `?next=` starts with `/` and has no `://` | closed |
| T-02-17 | Information Disclosure (Vite proxy) | vite.config.ts | accept | Accepted — dev-server only, no production impact | closed |
| T-02-18 | Tampering (open redirect) | login.tsx | mitigate | `validateNextParam()` — must start with `/`, must not contain `://`, defaults to `/dashboard` | closed |
| T-02-19 | Spoofing (login error oracle) | login.tsx / auth.service.ts | mitigate | Single "Invalid email or password." message for all 401s; user-not-found and wrong-password throw identical error | closed |
| T-02-20 | Information Disclosure (email enumeration) | auth.controller.ts | accept | Accepted — 409 on signup reveals email existence; standard UX pattern, partially mitigated by rate limiting | closed |
| T-02-21 | Tampering (profile form) | profile.tsx / update-profile.dto.ts | mitigate | Frontend zod + backend class-validator; `whitelist: true` strips unknown fields; only `name` and `timezone` in DTO | closed |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-04 | Redis fail-fast on startup is intentional; Redis unavailability surfaces as startup crash, not silent degradation. Acceptable for MVP — Redis will be monitored in production. | minhNN03 | 2026-04-17 |
| AR-02-02 | T-02-09 | Audit logging (login/logout/failed attempts) deferred to Phase 13 (Analytics pipeline). No compliance requirement for MVP. | minhNN03 | 2026-04-17 |
| AR-02-03 | T-02-17 | Vite dev-server proxy exposes backend routes without auth at the proxy layer — dev-only, not present in production builds. | minhNN03 | 2026-04-17 |
| AR-02-04 | T-02-20 | 409 response on duplicate email registration reveals email existence. This is standard LMS UX and partially mitigated by signup rate limiting (5 req/60s). | minhNN03 | 2026-04-17 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-17 | 21 | 21 | 0 | gsd-security-auditor (Claude Sonnet 4.6) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-17
