# Phase 2: Authentication - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the complete identity layer: sign-up, login, persistent sessions via refresh token rotation, logout with invalidation, and basic profile editing (display name + timezone). The User model and Role enum already exist in the DB from Phase 1.

What's NOT in scope: password change UI (later phase), role assignment UI (Phase 3), file upload for avatars (Phase 4), email change flow, email verification, OAuth/SSO, dark mode.

</domain>

<decisions>
## Implementation Decisions

### Token & Session Strategy
- **D-01:** Access token TTL: **15 minutes**, stored in **Zustand memory store only** (never localStorage, never sessionStorage — XSS-proof)
- **D-02:** Refresh token: **30-day fixed**, stored in **httpOnly, Secure, SameSite=Strict cookie** — inaccessible to JavaScript
- **D-03:** Silent refresh via **axios response interceptor**: on 401, attempt `/auth/refresh` before retrying original request. If refresh fails, clear Zustand store and redirect to `/login`
- **D-04:** Logout: DELETE `/auth/logout` endpoint — clears the httpOnly cookie server-side AND adds the refresh token to a **Redis blacklist** (TTL = remaining token lifetime). All subsequent refresh attempts with that token are rejected.
- **D-05:** Refresh token rotation: each `/auth/refresh` call issues a **new refresh token** and invalidates the old one (single-use tokens prevent theft reuse)

### Registration & Default Role
- **D-06:** **Open self-registration** — anyone with an email can sign up via `/auth/signup`. No invite required.
- **D-07:** **No email verification** — immediate access after signup. Email flows are v2 scope.
- **D-08:** Default role on self-registration: **STUDENT**. Role changes are an admin action (Phase 3).
- **D-09:** Email uniqueness enforced at DB level (already in schema) + returns a clear 409 error on duplicate.
- **D-10:** Signup form collects: **email + password + display name** (all three required).
- **D-11:** Password policy:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 number
  - At least 1 symbol
  - No sequential digit runs of 3+ (e.g. `123`, `456`, `987`)
  - No repeating same digit 3+ times in a row (e.g. `111`, `aaa`)

### Frontend Auth Pages & Shell
- **D-12:** Auth layout: **centered card on plain background**. If an institution logo exists, show it above the form card; otherwise just center the form. Uses `<AuthLayout>` wrapper.
- **D-13:** Password field on signup: **real-time validation checklist** — each policy condition displays with a ✓ (green) or ✗ (red) icon updating as the user types. All conditions listed explicitly.
- **D-14:** First input auto-focused on page load with **visible focus ring** (accessible, not suppressed).
- **D-15:** Auth errors: **inline under the relevant form field** for validation errors. Server errors (wrong password, email taken) shown as a **banner above the form**.
- **D-16:** App shell scope in Phase 2: **minimal** — sidebar contains logo, user avatar + name (initials placeholder), and logout button only. Nav items (Dashboard, Courses, etc.) are added by each subsequent phase as they build out.
- **D-17:** Unauthenticated route protection: `<RequireAuth>` wrapper redirects to `/login?next={encodedPath}`. After login, user is sent to the `next` destination. Falls back to `/dashboard` if no `next` param.
- **D-18:** Initial auth load state: **full-screen spinner** while refresh token is being validated. No flash of wrong content.

### Profile Page
- **D-19:** Profile page (`/profile`) accessible from user section in sidebar.
- **D-20:** Editable fields: **display name** and **timezone**. Email is read-only.
- **D-21:** Password change: **deferred** to a later phase.
- **D-22:** Avatar: **initials placeholder** — a colored circle generated from the user's name initials (e.g. "Minh Nguyen" → "MN"). Color derived deterministically from user ID hash, using role-hinted palette.

### Design System
- **D-23:** Icon library: **Lucide React** (tree-shakeable, TypeScript-first, line-art style).
- **D-24:** Dark mode: **deferred**. Build light palette only in Phase 2.
- **D-25:** Color palette (authoritative — all components must use these tokens):

  **Primary (Brand — Indigo)**
  - `#4F46E5` (primary-500) — main actions, links, highlights
  - `#4338CA` (primary-600) — hover state
  - `#E0E7FF` (primary-100) — background highlight

  **Secondary (Cyan)**
  - `#06B6D4` (secondary-500) — secondary buttons, selected filters
  - `#CFFAFE` (secondary-100)

  **Neutral Foundation**
  - App background: `#F9FAFB`
  - Card background: `#FFFFFF`
  - Sidebar: `#111827` (dark sidebar)
  - Text primary: `#111827`
  - Text secondary: `#6B7280`
  - Text disabled: `#9CA3AF`
  - Border default: `#E5E7EB`
  - Border strong: `#D1D5DB`

  **Semantic Colors**
  - Success: `#10B981` / light `#D1FAE5` — submitted assignments, passed grades
  - Warning: `#F59E0B` / light `#FEF3C7` — upcoming deadlines, draft states
  - Error: `#EF4444` / light `#FEE2E2` — missing assignments, validation errors
  - Info: `#3B82F6` / light `#DBEAFE` — neutral system messages

  **LMS Status → Color Mapping**
  | Status      | Color              | Hex       |
  |-------------|-------------------|-----------|
  | Not Started | Gray              | `#9CA3AF` |
  | In Progress | Blue              | `#3B82F6` |
  | Submitted   | Green             | `#10B981` |
  | Graded      | Indigo            | `#4F46E5` |
  | Late        | Red               | `#EF4444` |

  **Role-Based Accent Colors** (avatar ring, small badges, sidebar indicator — subtle use only)
  | Role       | Color   | Hex       |
  |------------|---------|-----------|
  | Student    | Indigo  | `#4F46E5` |
  | Instructor | Emerald | `#059669` |
  | Admin      | Purple  | `#7C3AED` |

### Claude's Discretion
- Exact sidebar height, padding, logo treatment details
- Form validation error message copy
- Loading spinner animation style
- Exact color mapping for initials avatar (use role-hinted palette above, deterministic from user ID hash)
- Whether to use React Router `<Outlet>` or explicit wrapper components for layouts
- Timezone picker UI component choice (react-select, native select, or similar)

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

- Auth pages: if no institution logo exists, center the form card with no branding header. When a logo is eventually added, it slots in above the card without restructuring.
- Password checklist on signup form: show all 6 conditions listed at all times; each turns green (✓) as the condition is met in real time. Conditions: min 8 chars, 1 uppercase, 1 number, 1 symbol, no 3+ sequential digits, no 3+ repeating same character.
- First input auto-focus: both `/login` (email field) and `/signup` (display name or email — whichever is first) should auto-focus on mount, with a visible Tailwind `ring` focus style (not `outline: none`).
- The `?next=` redirect param should be URL-encoded to handle deep paths like `/courses/123/assignments/456`
- Initials avatar: use the role-based accent color table (D-25) mapped deterministically from user ID — students get indigo ring, instructors get emerald, admins get purple.
- Sidebar in Phase 2: just logo + user block + logout. The empty space below the logo is intentional — future nav items fill it in. Avoid adding placeholder nav items that future phases will need to re-wire.

</specifics>

<deferred>
## Deferred Ideas

- Avatar file upload — deferred to Phase 4 (File Management)
- Password change UI — deferred to a later phase
- Email change flow — requires email verification, out of scope for Phase 2
- OAuth / SSO (Google, GitHub) — v2 requirements (AUTH-V2-01), not v1
- Two-factor authentication — v2 requirements (AUTH-V2-03)
- Dark mode — deferred; light palette only in Phase 2
- Email verification on signup — v2 scope

</deferred>

---

*Phase: 02-authentication*
*Context gathered: 2026-04-16*
