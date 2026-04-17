---
phase: 02-authentication
plan: "03"
subsystem: frontend
tags: [react, shadcn, zustand, axios, auth, frontend-shell]
dependency_graph:
  requires:
    - 02-01 (backend auth endpoints: /auth/refresh, /auth/logout)
    - 02-02 (backend auth endpoints used by axios interceptor)
  provides:
    - Frontend auth state management (useAuthStore)
    - Axios instance with silent refresh interceptor
    - Layout components: AuthLayout, AppLayout, Sidebar, PrivateRoute
    - InitialsAvatar component
    - Vite proxy for backend API routing
  affects:
    - 02-04 (auth pages build on AuthLayout, PrivateRoute, useAuthStore, api)
    - All future frontend plans (AppLayout, Sidebar are the persistent shell)
tech_stack:
  added:
    - "@tanstack/react-query ^5.99 — server state management"
    - "zustand ^5.0 — client auth state"
    - "react-hook-form ^7.72 — form management"
    - "@hookform/resolvers ^5.2 — zod integration"
    - "zod ^4.3 — schema validation"
    - "axios ^1.15 — HTTP client with interceptors"
    - "lucide-react ^1.8 — icon library"
    - "@fontsource/inter ^5.2 — self-hosted Inter font"
    - "sonner ^2.0 — toast notifications"
    - "shadcn/ui 4.3 — component library (base-nova style)"
  patterns:
    - "Zustand getState() pattern for non-React contexts (axios interceptors)"
    - "Queue pattern for concurrent 401 handling in axios interceptor"
    - "isHydrating flag pattern to prevent flash-of-redirect on app init"
    - "shadcn/ui with TailwindCSS v4 CSS-first config (@theme blocks in index.css)"
key_files:
  created:
    - apps/frontend/components.json
    - apps/frontend/src/lib/utils.ts
    - apps/frontend/src/lib/axios.ts
    - apps/frontend/src/lib/axios.test.ts
    - apps/frontend/src/stores/auth-store.ts
    - apps/frontend/src/components/ui/button.tsx
    - apps/frontend/src/components/ui/input.tsx
    - apps/frontend/src/components/ui/label.tsx
    - apps/frontend/src/components/ui/card.tsx
    - apps/frontend/src/components/ui/alert.tsx
    - apps/frontend/src/components/ui/form.tsx
    - apps/frontend/src/components/ui/separator.tsx
    - apps/frontend/src/components/ui/sonner.tsx
    - apps/frontend/src/components/ui/initials-avatar.tsx
    - apps/frontend/src/components/layouts/auth-layout.tsx
    - apps/frontend/src/components/layouts/app-layout.tsx
    - apps/frontend/src/components/layouts/sidebar.tsx
    - apps/frontend/src/components/layouts/private-route.tsx
  modified:
    - apps/frontend/package.json
    - apps/frontend/src/main.tsx
    - apps/frontend/src/index.css
    - apps/frontend/vite.config.ts
    - apps/frontend/tsconfig.json
    - pnpm-lock.yaml
decisions:
  - "shadcn init used --defaults flag (base-nova style, neutral base color) — no interactive prompt needed"
  - "form.tsx created manually since shadcn CLI silently skipped it (react-hook-form form helpers)"
  - "tsconfig.json root updated with path alias for shadcn alias validation (paths already in tsconfig.app.json)"
  - "Sidebar has no nav items per D-16 — empty flex-1 space intentional for future phases to fill"
  - "Button component uses @base-ui/react/button (shadcn 4.3 base-nova style) — not the older @radix-ui/react-slot pattern"
metrics:
  duration: "10 minutes"
  completed: "2026-04-16"
  tasks_completed: 3
  files_created: 18
  files_modified: 6
---

# Phase 02 Plan 03: Frontend Infrastructure (shadcn/ui + Auth Shell) Summary

**One-liner:** Initialized shadcn/ui v4.3 with 8 components, installed all frontend packages (TanStack Query, Zustand, react-hook-form, zod, axios), created Zustand auth store with isHydrating guard, axios interceptor with concurrent 401 queue pattern, and all layout components (AuthLayout, AppLayout, Sidebar, PrivateRoute, InitialsAvatar).

---

## What Was Built

### Task 1: shadcn/ui Init, Package Installation, Vite Proxy

- `npx shadcn@latest init --defaults` initialized with base-nova style, neutral base color, CSS variables in `index.css`
- Added root-level `compilerOptions.paths` to `tsconfig.json` for shadcn alias validation (paths were only in `tsconfig.app.json` before)
- shadcn components installed: button, input, label, card, alert, form (manual), separator, sonner
- `form.tsx` created manually with full shadcn form primitives (FormProvider, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage) — CLI silently skipped it
- All frontend packages installed via `pnpm --filter frontend add`
- `main.tsx` updated: Inter font imports, QueryClientProvider, Toaster (bottom-right, richColors, closeButton)
- `vite.config.ts` updated: proxy routes `/auth` and `/users` to `http://localhost:3000`
- `index.css` updated: Inter font-family in body rule (shadcn body base kept intact)

### Task 2: Zustand Auth Store + Axios Interceptor + Tests

**`src/stores/auth-store.ts`** — Zustand store per D-01, D-18:
- State: `user`, `accessToken`, `isAuthenticated`, `isHydrating: true`
- Actions: `setAuth`, `setAccessToken`, `setUser`, `clearAuth`, `setHydrating`
- No localStorage/sessionStorage — token in memory only (XSS protection)

**`src/lib/axios.ts`** — Axios instance per D-03:
- `baseURL: '/'` — relative URLs, Vite proxy handles routing
- `withCredentials: true` — httpOnly cookie sent on all requests
- Request interceptor: reads `useAuthStore.getState().accessToken`, attaches Bearer token
- Response interceptor: silent refresh on 401
  - `isRefreshing` flag prevents parallel refresh calls
  - `failedQueue` array queues concurrent 401 responses until refresh resolves
  - Guard: `originalRequest.url === '/auth/refresh'` prevents infinite loop
  - Guard: `originalRequest._retry` flag prevents double retry
  - On refresh failure: `clearAuth()` + redirect to `/login?next=${encodeURIComponent(currentPath)}`

**`src/lib/axios.test.ts`** — 6 Vitest unit tests:
1. Bearer token attachment from auth store
2. 401 triggers refresh and retries original request
3. Concurrent 401 queue pattern (single refresh, both retried)
4. Refresh failure calls clearAuth() and redirects to /login?next=
5. `_retry` guard prevents infinite retry loop
6. `/auth/refresh` endpoint 401 not intercepted (no recursive refresh)

### Task 3: Layout Components

**`InitialsAvatar`** — deterministic colored circle from user ID hash (D-22):
- 8-color palette (indigo, violet, sky, teal, emerald, amber, rose, slate)
- Hash: `charCodeSum(userId) % 8`
- Sizes: sm (32px/12px) and lg (40px/14px)
- Accessibility: `role="img"`, `aria-label="{displayName}'s avatar"`

**`PrivateRoute`** — auth guard per D-17, D-18:
- `isHydrating: true` → full-screen Loader2 spinner (`aria-label="Loading"`)
- `!isAuthenticated` → `<Navigate to="/login?next={encoded}" replace />`
- Authenticated → `<Outlet />`

**`AuthLayout`** — centered card for unauthenticated routes per D-12:
- Full-screen centered, GraduationCap icon, "CClone LMS" text, `<Outlet />`
- Uses shadcn Card + CardContent

**`Sidebar`** — minimal sidebar per D-16:
- Logo (GraduationCap + "CClone LMS")
- `flex-1` empty space (nav items added by future phases — intentional)
- User section: InitialsAvatar + name + email + Settings link (`aria-label="Account settings"`)
- Logout button: `min-h-[44px]` (WCAG 2.5.5), `text-destructive`, ghost variant
- Logout handler: `DELETE /auth/logout` → `clearAuth()` → redirect to /login

**`AppLayout`** — authenticated shell:
- `flex h-screen overflow-hidden` with `<Sidebar />` and `<main>` + `<Outlet />`

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added path alias to tsconfig.json root**
- **Found during:** Task 1 (shadcn init)
- **Issue:** shadcn CLI validates import alias in `tsconfig.json` root, but the `@/` path was only declared in `tsconfig.app.json`. CLI rejected with "No import alias found".
- **Fix:** Added `compilerOptions.baseUrl` and `compilerOptions.paths` to `tsconfig.json` root. This is additive — `tsconfig.app.json` still takes precedence for actual compilation.
- **Files modified:** `apps/frontend/tsconfig.json`

**2. [Rule 2 - Missing functionality] Created form.tsx manually**
- **Found during:** Task 1 (shadcn add form)
- **Issue:** `npx shadcn@latest add form` silently completed without creating the file. The form component (FormProvider, FormField, FormControl, FormMessage) is required for auth pages in Plan 04.
- **Fix:** Created `src/components/ui/form.tsx` manually with the standard shadcn form primitives pattern using react-hook-form integration.
- **Files created:** `apps/frontend/src/components/ui/form.tsx`

None — plan executed as written for all other items.

---

## Known Stubs

None — all components wire to real state (`useAuthStore`, `api`). No hardcoded empty values that flow to UI rendering.

---

## Threat Flags

No new threat surface identified. All components match the plan's threat model:
- T-02-14: Token in Zustand memory only — confirmed, no localStorage/sessionStorage
- T-02-15: Infinite loop prevention — `_retry` guard + `/auth/refresh` URL check both implemented
- T-02-16: Open redirect prevention — `encodeURIComponent(location.pathname + location.search)` (path-only, no external URLs); login page validation deferred to Plan 04

---

## Self-Check: PASSED

All files created/modified verified to exist on disk:
- apps/frontend/components.json: FOUND
- apps/frontend/src/lib/utils.ts: FOUND
- apps/frontend/src/components/ui/button.tsx: FOUND
- apps/frontend/src/components/ui/form.tsx: FOUND
- apps/frontend/src/stores/auth-store.ts: FOUND
- apps/frontend/src/lib/axios.ts: FOUND
- apps/frontend/src/lib/axios.test.ts: FOUND
- apps/frontend/src/components/layouts/auth-layout.tsx: FOUND
- apps/frontend/src/components/layouts/app-layout.tsx: FOUND
- apps/frontend/src/components/layouts/sidebar.tsx: FOUND
- apps/frontend/src/components/layouts/private-route.tsx: FOUND
- apps/frontend/src/components/ui/initials-avatar.tsx: FOUND

Task 1 commit b893691: FOUND
