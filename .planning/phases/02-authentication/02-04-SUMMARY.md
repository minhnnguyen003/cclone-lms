---
phase: 02-authentication
plan: "04"
subsystem: frontend-auth-pages
tags: [react, react-router, react-hook-form, zod, zustand, axios, auth-pages, routing]
dependency_graph:
  requires:
    - 02-02 (backend auth endpoints: /auth/login, /auth/signup, /auth/refresh, /auth/logout, /users/me, /users/me PATCH)
    - 02-03 (useAuthStore, api axios instance, AuthLayout, AppLayout, PrivateRoute, InitialsAvatar)
  provides:
    - LoginPage (/login) — email+password form, ?next= redirect, silent refresh hydration on App mount
    - SignupPage (/signup) — name+email+password+confirm form, 6-condition real-time password checklist
    - ProfilePage (/profile) — display name + timezone editing, InitialsAvatar identity header
    - DashboardPage (/dashboard) — placeholder
    - PlaceholderPage — reusable placeholder for Courses/Assignments/Gradebook
    - App.tsx — full React Router config with AuthLayout, PrivateRoute, AppLayout nesting
  affects:
    - All future frontend plans (App.tsx routing is the entry point)
tech_stack:
  added: []
  patterns:
    - "react-hook-form + zodResolver for all form validation"
    - "Submit-first validation switching to onChange mode after first failed submit"
    - "Error type narrowing via typeof/in/instanceof checks (no any)"
    - "useAuthStore.getState() for non-hook contexts (form submit handlers)"
    - "void operator on async navigate calls to satisfy floating promise lint"
key_files:
  created:
    - apps/frontend/src/pages/login.tsx
    - apps/frontend/src/pages/signup.tsx
    - apps/frontend/src/pages/profile.tsx
    - apps/frontend/src/pages/dashboard.tsx
    - apps/frontend/src/pages/placeholder.tsx
  modified:
    - apps/frontend/src/App.tsx
decisions:
  - "Password checklist shows green/red icons at all times (not hidden until typing) — all 6 conditions start red then turn green as met"
  - "Profile page uses 'Save changes' button label (not 'Save name') — plan says 'Save changes' in the action, UI-SPEC says 'Save name'; plan action takes precedence as it is more recent"
  - "Toast message 'Display name updated.' as specified in UI-SPEC copywriting contract"
  - "Native <select> for timezone picker per CONTEXT.md Claude's discretion — simplest correct solution"
  - "setHydrating included in App.tsx useEffect dependency array per plan spec even though not called (ESLint exhaustive-deps would require it)"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-17"
  tasks_completed: 2
  tasks_total: 3
  files_created: 5
  files_modified: 1
---

# Phase 02 Plan 04: Auth Pages and Router Configuration Summary

**One-liner:** Login and Signup pages with react-hook-form+zod validation and real-time password checklist, Profile page with display name+timezone editing, full React Router config with PrivateRoute+AuthLayout nesting, and session hydration via silent refresh on app mount.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create Login and Signup pages with form validation | 125ed51 | login.tsx, signup.tsx |
| 2 | Create Profile page, placeholder pages, and Router config with auth hydration | cc0fb2f | profile.tsx, dashboard.tsx, placeholder.tsx, App.tsx |

## What Was Built

### LoginPage (`/login`)

- `react-hook-form` with `zodResolver(loginSchema)` — zod v4 compatible
- Email field with `autoFocus` (D-14), `type="email"`, `autoComplete="email"`
- Password field with Eye/EyeOff Lucide icon toggle button (`aria-label="Show/Hide password"`)
- "Forgot password?" right-aligned link (no-op `#` per Phase 2 scope)
- Form-level `Alert variant="destructive"` for 401 → "Invalid email or password. Please try again." and network errors
- `?next=` param reading and validation: must start with `/`, must not contain `://` (T-02-18)
- Submit button: full width, `min-h-[44px]`, `Loader2` spinner during loading, disabled during async
- Footer: "Don't have an account? Sign up" → `<Link to="/signup">`

### SignupPage (`/signup`)

- `react-hook-form` with `zodResolver(signupSchema)` — `.refine()` for password match
- Full name, email, password, confirm password fields
- `autoFocus` on name field (first field, D-14)
- Password visibility toggles on both password fields
- `PasswordChecklist` component: 6 conditions with real-time Check/X Lucide icons:
  1. At least 8 characters
  2. At least 1 uppercase letter
  3. At least 1 number
  4. At least 1 symbol
  5. No 3+ sequential digits
  6. No 3+ repeating characters
- 409 duplicate email handling: separate `isDuplicateEmail` state → "An account with this email already exists. Sign in instead?" alert with `<Link to="/login">`
- Footer: "Already have an account? Sign in" → `<Link to="/login">`

### ProfilePage (`/profile`)

- Identity header: `InitialsAvatar size="lg"`, user name (semibold), email (muted, read-only), "Avatar upload coming in a future update." note
- `react-hook-form` with `zodResolver(profileSchema)` — name + timezone fields
- `defaultValues` pre-populated from `useAuthStore().user`
- `PATCH /users/me` on submit → `setUser()` updates Zustand store → `toast('Display name updated.', { duration: 3000 })`
- `isDirty` guard: "Save changes" button disabled when no changes
- `reset()` called after successful save with updated values (clears isDirty)
- Inline error text below form on failure: "Failed to save. Please try again."
- Native `<select>` with 17 curated IANA timezones (D-20, Claude's discretion)
- No password change section per D-21 deferral

### DashboardPage and PlaceholderPage

- `DashboardPage`: simple placeholder with welcome message
- `PlaceholderPage`: reusable component accepting `title` prop for Courses/Assignments/Gradebook

### App.tsx — Router Configuration

- `createBrowserRouter` with 3 route groups:
  1. `AuthLayout` → `/login`, `/signup` (public)
  2. `PrivateRoute` → `AppLayout` → `/dashboard`, `/profile`, `/courses`, `/assignments`, `/gradebook` (authenticated)
  3. Root `/` and `*` catch-all → `<Navigate to="/dashboard" replace />`
- `useEffect` on mount: calls `api.post('/auth/refresh')` to silently restore session
  - Success: `setAuth(user, accessToken)` → `isHydrating: false, isAuthenticated: true`
  - Failure: `clearAuth()` → `isHydrating: false, isAuthenticated: false` → PrivateRoute redirects to /login

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written.

### Decision Notes

**Profile page button label:** The plan action says "Save changes" while the UI-SPEC copywriting contract says "Save name". Used "Save changes" as specified in the plan task action section. This is a minor copy inconsistency between plan and spec; the plan section is more authoritative as the implementation guide.

## Known Stubs

None — all pages are fully wired to live API endpoints and Zustand state. No placeholder data or hardcoded returns.

- LoginPage: calls real `/auth/login` endpoint
- SignupPage: calls real `/auth/signup` endpoint
- ProfilePage: calls real `/users/me` endpoints (GET via Zustand state, PATCH for updates)
- App.tsx: calls real `/auth/refresh` for hydration

## Threat Flags

No new threat surface beyond the plan's threat model. All mitigations implemented:
- T-02-18: `?next=` param validated — must start with `/`, must not contain `://` (defaulting to `/dashboard` if invalid)
- T-02-19: Login form-level error does not distinguish between wrong email and wrong password ("Invalid email or password. Please try again." for all 401s)
- T-02-21: Profile form uses zod validation; backend enforces via ValidationPipe + whitelist

## Checkpoint Status

**Task 3 (human-verify) pending.** The plan requires end-to-end verification of the complete auth flow. See checkpoint message below.

## Self-Check: PASSED

- [x] `apps/frontend/src/pages/login.tsx` — FOUND, exports `LoginPage`
- [x] `apps/frontend/src/pages/signup.tsx` — FOUND, exports `SignupPage`
- [x] `apps/frontend/src/pages/profile.tsx` — FOUND, exports `ProfilePage`
- [x] `apps/frontend/src/pages/dashboard.tsx` — FOUND, exports `DashboardPage`
- [x] `apps/frontend/src/pages/placeholder.tsx` — FOUND, exports `PlaceholderPage`
- [x] `apps/frontend/src/App.tsx` — FOUND, contains createBrowserRouter, AuthLayout, PrivateRoute, AppLayout, /auth/refresh
- [x] Commit 125ed51 — FOUND (Task 1)
- [x] Commit cc0fb2f — FOUND (Task 2)
- [x] TypeScript compilation (`npx tsc --noEmit`) — PASSES with no errors
