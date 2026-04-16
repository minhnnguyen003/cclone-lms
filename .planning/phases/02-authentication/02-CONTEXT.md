# Phase 2: Authentication - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the complete identity layer: sign-up, login, persistent sessions via refresh token rotation, logout with invalidation, and basic profile editing (name + password). The User model and Role enum already exist in the DB from Phase 1.

What's NOT in scope: role assignment UI (Phase 3), file upload for avatars (Phase 4), email change flow, email notifications, OAuth/SSO.

</domain>

<decisions>
## Implementation Decisions

### Token & Session Strategy
*(Industry best practice — Claude's discretion, not discussed interactively)*
- **D-01:** Access token TTL: **15 minutes**, stored in **Zustand memory store only** (never localStorage, never sessionStorage — XSS-proof)
- **D-02:** Refresh token: **7-day sliding window**, stored in **httpOnly, Secure, SameSite=Strict cookie** — inaccessible to JavaScript
- **D-03:** Silent refresh via **axios response interceptor**: on 401, attempt `/auth/refresh` before retrying original request. If refresh fails, clear store and redirect to `/login`
- **D-04:** Logout: DELETE `/auth/logout` endpoint — clears the httpOnly cookie server-side AND adds the refresh token to a **Redis blacklist** (TTL = remaining token lifetime). All subsequent refresh attempts with that token are rejected.
- **D-05:** Refresh token rotation: each `/auth/refresh` call issues a **new refresh token** and invalidates the old one (single-use tokens prevent theft reuse)

### Registration Flow
*(Not discussed — reasonable defaults applied)*
- **D-06:** **Open self-registration** — anyone with an email can sign up via `/auth/signup`
- **D-07:** Default role on self-registration: **STUDENT**. Role changes are an admin action (Phase 3).
- **D-08:** Email uniqueness enforced at DB level (already in schema) + returns a clear 409 error on duplicate

### Frontend Auth Pages
- **D-09:** **Dedicated full-page routes**: `/login` and `/signup` — not modals. Standard LMS pattern, deep-linkable, unauthenticated users are redirected here.
- **D-10:** **Post-login redirect to intended destination**: if the user was trying to access `/courses/123`, they are sent to `/login?next=%2Fcourses%2F123` and redirected back after successful login. Falls back to `/dashboard` if no `next` param.
- **D-11:** **Unauthenticated route protection**: a `<PrivateRoute>` (or `<RequireAuth>`) wrapper reads auth state from Zustand; if not authenticated, redirects to `/login?next={currentPath}`

### App Shell
- **D-12:** **Full sidebar nav skeleton** built in Phase 2 — even with placeholder links. The sidebar contains: logo, nav items (Dashboard, Courses, Assignments, Gradebook — all placeholder links for now), and a bottom section with user avatar + name + logout button. This gives Phase 2 a finished feel and avoids rebuilding the shell in every subsequent phase.
- **D-13:** Sidebar is part of a persistent `<AppLayout>` wrapper that wraps all authenticated routes. Unauthenticated routes (`/login`, `/signup`) use a plain `<AuthLayout>` (centered card, no sidebar).

### Profile Page
- **D-14:** Profile page (`/profile`) is accessible from sidebar / user menu
- **D-15:** Editable fields: **display name** and **password change** (requires current password for verification)
- **D-16:** Email is **read-only** on profile — shown but not editable in Phase 2
- **D-17:** Avatar: **initials placeholder** — a colored circle generated from the user's name initials (e.g., "Minh Nguyen" → "MN"). No file upload (Phase 4). Color derived deterministically from user ID.

### Claude's Discretion
- Exact sidebar nav item labels and icons (use sensible defaults from Heroicons or Lucide)
- Form validation error message copy
- Loading spinner / skeleton approach on auth transitions
- Exact color for initials avatar (deterministic from user ID hash)
- Whether to use React Router `<Outlet>` or explicit wrapper components for layouts

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Authentication (AUTH-01..AUTH-05, ROLE-01) — acceptance criteria for every auth requirement
- `.planning/ROADMAP.md` §Phase 2 — success criteria and phase boundary

### Stack
- `CLAUDE.md` — coding conventions, naming rules, import order, path aliases, error handling patterns
- `apps/backend/prisma/schema.prisma` — existing User model and Role enum (do not redefine)
- `apps/backend/src/prisma/prisma.service.ts` — PrismaService using @prisma/adapter-pg (Prisma v7 runtime pattern)

### Prior Phase Output
- `.planning/phases/01-project-scaffolding-db-setup/01-01-SUMMARY.md` — monorepo structure, env vars
- `.planning/phases/01-project-scaffolding-db-setup/01-02-SUMMARY.md` — NestJS scaffold, module patterns, ConfigModule setup

No external ADRs or specs — all decisions captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/backend/src/prisma/prisma.service.ts` — PrismaService ready to inject into AuthModule
- `apps/backend/src/app.module.ts` — shows ConfigModule.forRoot() pattern; AuthModule follows same pattern
- `apps/frontend/src/index.css` — TailwindCSS v4 @import already set up; no config file needed
- `apps/frontend/vite.config.ts` — `@/` path alias configured; use throughout frontend auth code

### Established Patterns
- **NestJS modules**: feature module pattern (see PrismaModule) — AuthModule, UsersModule follow same structure
- **Path aliases**: `@/` on both backend (`tsconfig.json` + Jest) and frontend (Vite) — use everywhere
- **Environment variables**: injected at process level (no envFilePath); backend reads via `process.env['KEY']` with null guard
- **Error handling (CLAUDE.md)**: domain-specific error classes (`UserAlreadyExistsError`, `InvalidCredentialsError`) extending base `DomainError`, mapped to HTTP exceptions at controller layer
- **API response format (CLAUDE.md)**: JSON:API style `{ data: {...}, meta: {...}, errors: [...] }`

### Integration Points
- AuthModule registers in AppModule (alongside existing ConfigModule, PrismaModule)
- Frontend: React Router wraps routes in `<AppLayout>` (authenticated) or `<AuthLayout>` (public)
- Zustand auth store integrates with axios instance via interceptors
- Redis (already in Docker Compose) used for refresh token blacklist via `ioredis` or `@nestjs/cache-manager`

</code_context>

<specifics>
## Specific Ideas

- Sidebar nav skeleton should feel "real" — use actual route paths and icons even if pages are placeholders. This sets up the routing structure that later phases fill in.
- The `?next=` redirect param should be URL-encoded to handle deep paths like `/courses/123/assignments/456`
- Initials avatar color should be **deterministic** (same color every time for same user) — derive from a hash of the user ID mapped to a small palette of brand-consistent colors

</specifics>

<deferred>
## Deferred Ideas

- Avatar file upload — deferred to Phase 4 (File Management)
- Email change flow — deferred (requires email verification, out of scope for Phase 2)
- OAuth / SSO (Google, GitHub) — not in requirements, defer indefinitely
- "Remember me" checkbox — refresh token is already 7 days; no separate remember-me needed
- Two-factor authentication — not in v1 requirements

</deferred>

---

*Phase: 02-authentication*
*Context gathered: 2026-04-16*
