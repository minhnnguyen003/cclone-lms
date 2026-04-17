---
phase: 02-authentication
plan: 06
subsystem: testing
tags: [vitest, react-testing-library, axios, vitest-mocks, frontend-tests]

# Dependency graph
requires:
  - phase: 02-authentication
    provides: App.tsx with RouterProvider + PrivateRoute hydration spinner, axios interceptor with Bearer token attachment
provides:
  - All 7 frontend unit tests pass (App smoke test + 6 axios interceptor tests)
  - Fixed App.test.tsx to match Phase 2 hydration-spinner behaviour
  - Fixed axios.test.ts mock ordering and interceptor spy approach
affects: [02-authentication, ci, frontend-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use adapter (api.defaults.adapter) to inspect config after all request interceptors have run — not a spy interceptor"
    - "vi.clearAllMocks() belongs in afterEach (post-test cleanup), not beforeEach"
    - "Mock useAuthStore and api in App.test.tsx to prevent network calls and match real initial store state"

key-files:
  created: []
  modified:
    - apps/frontend/src/App.test.tsx
    - apps/frontend/src/lib/axios.test.ts

key-decisions:
  - "Use api.defaults.adapter to capture config after interceptors run — axios uses LIFO ordering (legacyInterceptorReqResOrdering=true default), so a spy added via interceptors.request.use() runs BEFORE the token-setting interceptor"
  - "Move vi.clearAllMocks() to afterEach to avoid wiping mock return values set in beforeEach before the test body runs"
  - "Mock both useAuthStore and api in App.test.tsx to isolate the component from network and store state"

patterns-established:
  - "Axios interceptor order: LIFO (legacyInterceptorReqResOrdering=true) — test spies added after the module loads run FIRST"
  - "To assert on headers set by axios.ts interceptors, use api.defaults.adapter not interceptors.request.use()"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, ROLE-01]

# Metrics
duration: 25min
completed: 2026-04-17
---

# Phase 02 Plan 06: Fix Frontend Unit Tests (Gap Closure) Summary

**Frontend test suite restored to 7/7 passing: fixed App smoke test for Phase 2 router + fixed axios Bearer token test using adapter-based config capture instead of LIFO-ordered spy interceptor**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-17T11:40:00Z
- **Completed:** 2026-04-17T11:52:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- App.test.tsx updated to match Phase 2 behaviour — checks for `aria-label="Loading"` hydration spinner (rendered by PrivateRoute when `isHydrating: true`) instead of the removed 'CClone LMS' heading
- axios.test.ts "attaches Bearer token" test fixed by using `api.defaults.adapter` to capture the fully-processed config, which correctly sees the Bearer token set by the axios.ts request interceptor
- vi.clearAllMocks() moved from beforeEach to afterEach so mock return values are in place when test bodies run
- All 7 frontend unit tests pass; pnpm --filter frontend test exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Update App.test.tsx to match Phase 2 hydration spinner** - `90e575b` (fix)
2. **Task 2: Fix axios.test.ts mock ordering and Bearer token test approach** - `baea426` (fix)
3. **Task 3: Verify full test suite exits 0** - (verification only, no code changes)

## Files Created/Modified

- `apps/frontend/src/App.test.tsx` - Replaced stale Phase 1 heading test with hydration spinner assertion; added mocks for useAuthStore and api
- `apps/frontend/src/lib/axios.test.ts` - Moved vi.clearAllMocks() to afterEach; replaced spy-via-interceptor with adapter-based config capture for Bearer token test

## Decisions Made

- **axios LIFO interceptor ordering is the root cause of the Bearer token test failure.** axios defaults `legacyInterceptorReqResOrdering: true`, which means request interceptors run in LIFO order (last registered = first run). A spy added via `api.interceptors.request.use()` in the test body runs BEFORE the token-setting interceptor from axios.ts, seeing `undefined` for the Authorization header. Fix: use `api.defaults.adapter` — it runs after all interceptors and receives the fully-processed config.
- **vi.clearAllMocks() belongs in afterEach, not beforeEach.** Placing it in beforeEach (before `mockGetState.mockReturnValue(...)`) would clear it too early. In afterEach it cleans up after the test without affecting setup for the next test.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] axios Bearer token test required adapter-based approach, not spy interceptor**
- **Found during:** Task 2 (Fix axios.test.ts mock ordering)
- **Issue:** The plan described moving vi.clearAllMocks() as the only fix. However, investigation revealed the real root cause: axios uses LIFO interceptor ordering (legacyInterceptorReqResOrdering=true), so the test's spy interceptor (added second) ran BEFORE the token-setting interceptor (registered first in axios.ts), seeing undefined.
- **Fix:** Replaced `api.interceptors.request.use(spy)` pattern with `api.defaults.adapter` that captures `config.headers.Authorization` after all request interceptors have completed.
- **Files modified:** apps/frontend/src/lib/axios.test.ts
- **Verification:** All 6 axios interceptor tests pass including the previously-failing Bearer token test.
- **Committed in:** baea426 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** The vi.clearAllMocks() move was still correct and applied. The additional adapter-based fix addressed the actual root cause which was interceptor ordering, not just mock timing. No scope creep.

## Issues Encountered

- Worktree node_modules were missing — required `pnpm install --frozen-lockfile` from the worktree root before tests could run. This is expected for a fresh git worktree.
- Backend tests in the worktree show TypeScript compilation errors (`$connect`/`$disconnect` on PrismaService) but all 9 individual test assertions still pass. This is a pre-existing condition at the base commit (59c8967), not caused by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 7 frontend unit tests pass: gap closed for VERIFICATION.md item "Frontend unit tests pass (5/7 → 7/7)"
- CI test suite is now green for frontend
- Backend tests at the worktree base commit (59c8967) have pre-existing TypeScript type errors that are resolved in later commits (0e12092)

---

*Phase: 02-authentication*
*Completed: 2026-04-17*
