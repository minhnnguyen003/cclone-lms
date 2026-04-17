---
phase: 02-authentication
fixed_at: 2026-04-17T00:00:00Z
review_path: .planning/phases/02-authentication/02-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-04-17T00:00:00Z
**Source review:** .planning/phases/02-authentication/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (2 Critical, 5 Warning)
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: `findUnique` with `deleted_at` filter will throw at runtime — use `findFirst`

**Files modified:** `apps/backend/src/auth/auth.service.ts`
**Commit:** 39fa22b
**Applied fix:** Replaced `prisma.user.findUnique` with `prisma.user.findFirst` in both `signup` (line 41) and `validateUser` (line 75), where the `where` clause combines the unique `email` field with the non-unique `deleted_at` column. `findFirst` accepts mixed unique/non-unique filters and returns equivalent results because `email` has a unique index.

---

### CR-02: JWT secrets read from `process.env` at call time — undefined secret silently accepted

**Files modified:** `apps/backend/src/auth/auth.service.ts`
**Commit:** 39fa22b
**Applied fix:** Added `private readonly accessSecret: string` and `private readonly refreshSecret: string` fields to `AuthService`. The constructor now reads both env vars, throws `Error` if either is absent, and assigns the validated strings. All four call sites (`signAccessToken`, `signRefreshToken`, `refresh`, `logout`) now reference `this.accessSecret` / `this.refreshSecret` instead of `process.env` at invocation time.

---

### WR-01: Soft-deleted users can log in and refresh tokens

**Files modified:** `apps/backend/src/auth/auth.service.ts`
**Commit:** ccffded
**Applied fix:** Added `deleted_at: null` to the `findUnique` `where` clause in both `login` (lookup by `id: userId`) and `refresh` (lookup by `id: payload.sub`). Both use `findUnique` with a primary-key lookup, which is valid Prisma — `id` establishes uniqueness and `deleted_at: null` acts as an additional filter.

---

### WR-02: `updateProfile()` leaks a raw Prisma error when the user does not exist

**Files modified:** `apps/backend/src/users/users.service.ts`
**Commit:** 10cceb1
**Applied fix:** Added `await this.findById(id)` as the first statement in `updateProfile`. This reuses the existing method which checks `deleted_at: null` and throws `UserNotFoundError` if the user is absent — a domain error that `DomainExceptionFilter` maps to a clean 404. The `prisma.user.update` call that would previously throw `P2025` now only runs after existence is confirmed.

---

### WR-03: Missing `MaxLength` on `SignupDto.password` — bcrypt CPU exhaustion possible

**Files modified:** `apps/backend/src/auth/dto/signup.dto.ts`
**Commit:** 779b4ef
**Applied fix:** Added `@MaxLength(128)` decorator to the `password` field, positioned between `@MinLength(8)` and the `@Matches` decorators. `MaxLength` was already imported in the file so no import change was needed.

---

### WR-04: `setAccessToken` in auth store does not update `isAuthenticated`

**Files modified:** `apps/frontend/src/stores/auth-store.ts`
**Commit:** 3d04c8d
**Applied fix:** Changed `setAccessToken` from `set({ accessToken: token })` to `set({ accessToken: token, isAuthenticated: true })`. This ensures any code path that calls `setAccessToken` independently does not leave `PrivateRoute` in a redirect-to-login state with a valid token present.

---

### WR-05: `setHydrating` in `App.tsx` `useEffect` dependency array but never called inside the effect

**Files modified:** `apps/frontend/src/App.tsx`
**Commit:** 1c4a2db
**Applied fix:** Removed `setHydrating` from the `useAuthStore` destructuring on line 43 and from the `useEffect` dependency array on line 58. Both `setAuth` and `clearAuth` already set `isHydrating: false` internally, so hydration state is managed correctly without the stale dependency.

---

_Fixed: 2026-04-17T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
