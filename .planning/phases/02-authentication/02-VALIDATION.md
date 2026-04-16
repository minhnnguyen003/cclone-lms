---
phase: 2
slug: authentication
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (backend)** | Jest 30.x |
| **Framework (frontend)** | Vitest 4.x + Testing Library |
| **Config file (backend)** | `apps/backend/jest.config.js` or inline in `package.json` — check at Wave 0 |
| **Config file (frontend)** | `apps/frontend/vite.config.ts` (inline `test` block) |
| **Quick run command** | `pnpm --filter backend test -- --passWithNoTests` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~30 seconds (backend unit), ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter backend test -- --passWithNoTests`
- **After every plan wave:** Run `pnpm test` (both backend + frontend full suite)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-??-01 | 01 | 0 | AUTH-01 | — | signup creates user with hashed password | unit | `pnpm --filter backend test -- --testPathPattern auth.service` | ❌ W0 | ⬜ pending |
| 2-??-02 | 01 | 0 | AUTH-01 | — | duplicate email returns 409 | unit | same | ❌ W0 | ⬜ pending |
| 2-??-03 | 01 | 0 | AUTH-02 | — | login with valid creds returns access token | unit | same | ❌ W0 | ⬜ pending |
| 2-??-04 | 01 | 0 | AUTH-02 | — | login with invalid creds throws error | unit | same | ❌ W0 | ⬜ pending |
| 2-??-05 | 01 | 0 | AUTH-03 | — | /auth/refresh with valid cookie issues new tokens | unit | same | ❌ W0 | ⬜ pending |
| 2-??-06 | 01 | 0 | AUTH-03 | — | blacklisted refresh token is rejected | unit | same | ❌ W0 | ⬜ pending |
| 2-??-07 | 03 | 0 | AUTH-03 | — | silent refresh interceptor retries failed request | unit | `npx vitest run --reporter=verbose src/lib/axios.test.ts` | ❌ W0 | ⬜ pending |
| 2-??-08 | 01 | 0 | AUTH-04 | — | logout blacklists token and clears cookie | unit | `pnpm --filter backend test -- --testPathPattern auth.service` | ❌ W0 | ⬜ pending |
| 2-??-09 | 01 | 0 | AUTH-04 | — | after logout, refresh token cannot be reused | unit | same | ❌ W0 | ⬜ pending |
| 2-??-10 | 01 | 0 | AUTH-05 | — | PATCH /users/me updates display name | unit | `pnpm --filter backend test -- --testPathPattern users.service` | ❌ W0 | ⬜ pending |
| 2-??-11 | — | — | AUTH-05 | — | DEFERRED per D-21: PATCH /users/me/password rejects wrong current password | unit | — | — | ⏸️ deferred |
| 2-??-12 | 01 | 0 | ROLE-01 | — | signup sets role = STUDENT by default | unit | `pnpm --filter backend test -- --testPathPattern auth.service` | ❌ W0 | ⬜ pending |
| 2-??-13 | 01 | 0 | ROLE-01 | — | role enum exists: STUDENT, INSTRUCTOR, ADMIN | unit | same | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · ⏸️ deferred*

---

## Wave 0 Requirements

- [ ] `apps/backend/src/auth/auth.service.spec.ts` — stubs for AUTH-01, AUTH-02, AUTH-03, AUTH-04, ROLE-01
- [ ] `apps/backend/src/users/users.service.spec.ts` — stubs for AUTH-05
- [ ] `apps/frontend/src/lib/axios.test.ts` — stubs for AUTH-03 (silent refresh interceptor)
- [ ] `MockRedisService` injectable — avoids live Redis in unit tests
- [ ] Jest config confirmed working in `apps/backend/`
- [ ] Vitest config confirmed working in `apps/frontend/`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login form shows correct error states (field-level, form-level, loading spinner) | AUTH-02 | UI state not unit-testable | Try invalid credentials, check inline field error + form-level toast |
| Signup form shows duplicate email alert with "Sign in instead?" link | AUTH-01 | UI copy verification | Register same email twice, check alert text |
| PrivateRoute shows spinner during hydration then redirects or renders | AUTH-03 | Timing/visual behavior | Refresh page while logged in, check no flicker |
| Sidebar renders with correct active route highlight | AUTH-02 | Visual/routing | Navigate between pages, check active state |
| Profile page loads with current display name pre-populated | AUTH-05 | Pre-population visual check | Open profile page, verify field is pre-filled |
| Toast appears on successful profile save | AUTH-05 | Toast visibility | Save profile, check toast appears and dismisses |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
