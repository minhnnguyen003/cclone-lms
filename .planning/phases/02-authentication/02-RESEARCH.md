# Phase 2: Authentication - Research

**Researched:** 2026-04-16
**Domain:** JWT authentication, NestJS Passport, React auth state, httpOnly cookies, Redis token blacklist
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Token & Session Strategy**
- D-01: Access token TTL: 15 minutes, stored in Zustand memory store only (never localStorage, never sessionStorage — XSS-proof)
- D-02: Refresh token: 7-day sliding window, stored in httpOnly, Secure, SameSite=Strict cookie — inaccessible to JavaScript
- D-03: Silent refresh via axios response interceptor: on 401, attempt `/auth/refresh` before retrying original request. If refresh fails, clear store and redirect to `/login`
- D-04: Logout: DELETE `/auth/logout` endpoint — clears the httpOnly cookie server-side AND adds the refresh token to a Redis blacklist (TTL = remaining token lifetime)
- D-05: Refresh token rotation: each `/auth/refresh` call issues a new refresh token and invalidates the old one (single-use tokens prevent theft reuse)

**Registration Flow**
- D-06: Open self-registration — anyone with an email can sign up via `/auth/signup`
- D-07: Default role on self-registration: STUDENT. Role changes are an admin action (Phase 3)
- D-08: Email uniqueness enforced at DB level + returns a clear 409 error on duplicate

**Frontend Auth Pages**
- D-09: Dedicated full-page routes: `/login` and `/signup` — not modals
- D-10: Post-login redirect to intended destination via `?next=` param; falls back to `/dashboard`
- D-11: Unauthenticated route protection via `<PrivateRoute>` wrapper that reads Zustand auth state

**App Shell**
- D-12: Full sidebar nav skeleton built in Phase 2 — with actual route paths and placeholder pages for Dashboard, Courses, Assignments, Gradebook
- D-13: `<AppLayout>` wraps authenticated routes (has sidebar); `<AuthLayout>` wraps unauthenticated routes (centered card, no sidebar)

**Profile Page**
- D-14: Profile page (`/profile`) accessible from sidebar user menu
- D-15: Editable fields: display name and password change (requires current password)
- D-16: Email is read-only on profile
- D-17: Avatar: initials placeholder — deterministic colored circle from user ID hash. No file upload (Phase 4)

### Claude's Discretion
- Exact sidebar nav item labels and icons (use sensible defaults from Heroicons or Lucide)
- Form validation error message copy
- Loading spinner / skeleton approach on auth transitions
- Exact color for initials avatar (deterministic from user ID hash)
- Whether to use React Router `<Outlet>` or explicit wrapper components for layouts

### Deferred Ideas (OUT OF SCOPE)
- Avatar file upload — Phase 4 (File Management)
- Email change flow — requires email verification, out of scope
- OAuth / SSO (Google, GitHub) — not in requirements
- "Remember me" checkbox — refresh token is already 7 days
- Two-factor authentication — not in v1 requirements
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up with email and password | `/auth/signup` endpoint, bcrypt hashing, email uniqueness 409 |
| AUTH-02 | User can log in and receive JWT access + refresh tokens | `/auth/login`, `@nestjs/jwt`, Passport local strategy, httpOnly cookie |
| AUTH-03 | User session persists across browser refresh (refresh token) | `/auth/refresh`, axios interceptor, refresh token rotation, hydration pattern |
| AUTH-04 | User can log out from any page | `/auth/logout` DELETE endpoint, Redis blacklist, cookie clear |
| AUTH-05 | User can view and edit their profile (name, avatar) | `/users/me` GET/PATCH, `PATCH /users/me/password`, initials avatar component |
| ROLE-01 | System supports three roles: Student, Instructor, Admin | Role enum already in schema, default STUDENT on signup, seed script if needed |
</phase_requirements>

---

## Summary

Phase 2 implements the complete authentication layer on a stack that is already partially wired: the User model and Role enum exist in PostgreSQL from Phase 1, PrismaService is injectable, and ConfigModule is globally available. The backend work is a standard NestJS Passport JWT pattern — `AuthModule` with a local strategy for login and a JWT strategy for protected routes — with the key complexity being the refresh token rotation pattern using Redis as a blacklist store and httpOnly cookies for token delivery.

The frontend work is larger than typical auth phases because D-12 requires building the full sidebar shell now. This means Phase 2 also establishes the React Router layout architecture (AppLayout / AuthLayout split), the Zustand auth store with silent refresh via axios interceptors, and the profile page. The UI-SPEC.md provides a complete visual contract including exact component structure, shadcn primitives, copy, and accessibility requirements.

The main technical risks are: (1) cookie configuration correctness in NestJS (requires `cookie-parser` middleware and exact `Set-Cookie` attributes), (2) the silent refresh interceptor needing to prevent infinite retry loops, and (3) `isHydrating` state in the Zustand store to prevent flash-of-redirect on page load before the initial refresh resolves.

**Primary recommendation:** Implement backend first (AuthModule -> endpoints -> tests), then frontend (shadcn init -> Zustand store + axios interceptor -> layouts -> pages -> profile). The clear dependency direction avoids parallel work blocking.

---

## Project Constraints (from CLAUDE.md)

The following directives from CLAUDE.md are binding on all plans and implementation:

| Directive | Constraint |
|-----------|------------|
| TypeScript strict | `strict: true`, `noImplicitAny` — no `any` anywhere. Use `unknown` + narrowing instead |
| No `@ts-ignore` / `eslint-disable` | Only allowed with written justification in the comment |
| Backend naming | camelCase vars/functions, PascalCase classes/interfaces/enums, kebab-case file names |
| Path aliases | Use `@/` aliases on both backend and frontend — no relative `../` across directory boundaries |
| Import order | External libs first, then `@/` internal, then relative. Alphabetical within each group |
| Error handling | Domain-specific error classes (`UserAlreadyExistsError`, `InvalidCredentialsError`) extending `DomainError`. Map to HTTP at controller layer |
| API response format | JSON:API style: `{ data: {...}, meta: {...}, errors: [...] }` |
| Backend validation | `class-validator` + `class-transformer` on DTOs with `ValidationPipe` |
| Backend testing | Unit tests co-located with source (`.spec.ts`), e2e tests in `test/` directory |
| Frontend components | Arrow function with named export: `export const MyComponent = () => { ... }` |
| Frontend state | TanStack Query for server state, Zustand for client/UI state |
| Frontend forms | react-hook-form + zod for validation |
| Database | UUID PKs, snake_case columns, soft deletes (`deleted_at`), `created_at`/`updated_at` on every table |
| Language | All code, comments, commit messages, and docs in English only |
| Git commits | Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:` with optional scope |

---

## Standard Stack

### Core — Backend Auth Packages (not yet installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/passport` | ^11.0.5 | Passport integration for NestJS | NestJS-native; provides `@UseGuards(AuthGuard())`, strategy DI wiring |
| `passport` | ^0.7.0 | Passport core | Required peer dep of `@nestjs/passport` |
| `@nestjs/jwt` | ^11.0.2 | JWT token signing/verification | NestJS-native; `JwtService.sign()`, `JwtService.verify()` |
| `passport-jwt` | ^4.0.1 | JWT Passport strategy | Standard `ExtractJwt.fromAuthHeaderAsBearerToken()` |
| `passport-local` | ^1.0.0 | Username/password strategy | Used for `/auth/login` credential validation |
| `bcrypt` | ^6.0.0 | Password hashing | Industry standard; `bcrypt.hash()` + `bcrypt.compare()` |
| `ioredis` | ^5.10.1 | Redis client for blacklist | Type-safe, Promise-based; `SET key value EX ttl` for token blacklist |
| `cookie-parser` | ^1.4.7 | Parse httpOnly cookies in NestJS | Required for NestJS to read `req.cookies` |

**Version verified:** [VERIFIED: npm registry] — all versions confirmed 2026-04-16

**Type packages (devDependencies):**

| Package | Version |
|---------|---------|
| `@types/bcrypt` | ^6.0.0 |
| `@types/passport` | ^1.0.17 |
| `@types/passport-jwt` | ^4.0.1 |
| `@types/passport-local` | ^1.0.38 |
| `@types/cookie-parser` | ^1.4.10 |

### Core — Frontend Auth Packages (not yet installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-query` | ^5.99.0 | Server state management | Caching, deduplication, background refetch for API data |
| `@tanstack/react-query-devtools` | ^5.99.0 | Dev tooling for TanStack Query | Dev-only cache inspector |
| `zustand` | ^5.0.12 | Client/UI state | Auth store: `user`, `accessToken`, `isAuthenticated`, `isHydrating` |
| `react-hook-form` | ^7.72.1 | Form management | Login, signup, profile forms — handles async validation, loading states |
| `zod` | ^4.3.6 | Schema validation | Frontend validation resolver for react-hook-form |
| `axios` | ^1.15.0 | HTTP client | API calls with interceptor for silent refresh |
| `lucide-react` | ^1.8.0 | Icon library | Sidebar icons, form icons (Eye/EyeOff, Loader2, LogOut, etc.) |
| `@fontsource/inter` | ^5.2.8 | Inter font (self-hosted) | Avoids Google Fonts network dependency |

**shadcn/ui components (installed via CLI):** `button`, `input`, `label`, `card`, `alert`, `form`, `separator`, `sonner`

> Note: shadcn/ui is not an npm package — it's a CLI that copies component source into `apps/frontend/src/components/ui/`. Run `npx shadcn@latest init` before any component work. The UI-SPEC.md documents exact init configuration.

**Version verified:** [VERIFIED: npm registry] — all versions confirmed 2026-04-16

### Already Installed (Phase 1)

| Package | Location | Relevant to Phase 2 |
|---------|----------|---------------------|
| `@nestjs/config` | backend | ConfigService for reading JWT_SECRET, REDIS_URL from env |
| `@nestjs/common`, `@nestjs/core` | backend | Module/Guard/Decorator infrastructure |
| `@nestjs/swagger` | backend | Decorate auth endpoints for OpenAPI |
| `react`, `react-router` | frontend | Routing for /login, /signup, /profile |
| `tailwindcss`, `@tailwindcss/vite` | frontend | Styling already configured |
| `vitest`, `@testing-library/react` | frontend | Test infrastructure ready |
| `jest`, `@nestjs/testing` | backend | Test infrastructure ready |

### Installation Commands

```bash
# Backend
pnpm --filter backend add @nestjs/passport passport @nestjs/jwt passport-jwt passport-local bcrypt ioredis cookie-parser
pnpm --filter backend add -D @types/bcrypt @types/passport @types/passport-jwt @types/passport-local @types/cookie-parser

# Frontend (after shadcn init)
pnpm --filter frontend add @tanstack/react-query zustand react-hook-form zod axios lucide-react @fontsource/inter
pnpm --filter frontend add -D @tanstack/react-query-devtools

# shadcn init (run inside apps/frontend/)
npx shadcn@latest init
# Then add components:
npx shadcn@latest add button input label card alert form separator sonner
```

---

## Architecture Patterns

### Recommended Project Structure — Backend

```
apps/backend/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.service.spec.ts
│   ├── dto/
│   │   ├── signup.dto.ts
│   │   ├── login.dto.ts
│   │   └── change-password.dto.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts        # Bearer token validation
│   │   └── local.strategy.ts      # Email+password login
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── local-auth.guard.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts        # GET /users/me, PATCH /users/me, PATCH /users/me/password
│   ├── users.service.ts
│   ├── users.service.spec.ts
│   └── dto/
│       └── update-profile.dto.ts
├── common/
│   ├── errors/
│   │   ├── domain.error.ts        # Base DomainError class
│   │   ├── user-already-exists.error.ts
│   │   └── invalid-credentials.error.ts
│   └── filters/
│       └── domain-exception.filter.ts  # Maps DomainErrors to HTTP responses
└── redis/
    ├── redis.module.ts
    └── redis.service.ts           # Wraps ioredis; blacklist get/set/del
```

### Recommended Project Structure — Frontend

```
apps/frontend/src/
├── components/
│   ├── layouts/
│   │   ├── auth-layout.tsx        # Centered card, no sidebar
│   │   ├── app-layout.tsx         # Sidebar + main content
│   │   ├── sidebar.tsx            # Nav skeleton + user section + logout
│   │   └── private-route.tsx      # Auth guard wrapper
│   └── ui/
│       ├── initials-avatar.tsx    # Deterministic colored circle
│       └── (shadcn auto-generated components)
├── lib/
│   ├── axios.ts                   # Axios instance + interceptors
│   └── utils.ts                   # shadcn cn() utility
├── pages/
│   ├── login.tsx
│   ├── signup.tsx
│   ├── profile.tsx
│   └── dashboard.tsx              # Placeholder page
├── stores/
│   └── auth-store.ts              # Zustand: user, accessToken, isAuthenticated, isHydrating
└── App.tsx                        # Router config (replaces Phase 1 scaffold)
```

### Pattern 1: NestJS JWT + Passport Dual-Strategy

**What:** Two strategies handle two different auth flows. LocalStrategy validates email+password for `/auth/login`. JwtStrategy validates the Bearer token on all protected routes.

**When to use:** Always. This is the NestJS canonical pattern.

```typescript
// Source: [ASSUMED - NestJS Passport docs pattern]
// apps/backend/src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;      // user UUID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // Return value is attached to req.user by Passport
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Pattern 2: Refresh Token Rotation with Redis Blacklist

**What:** Each refresh issues a new refresh token and invalidates the old one by adding it to a Redis set. The `/auth/refresh` endpoint reads the httpOnly cookie, validates the token is not blacklisted, signs a new access+refresh token pair, sets a new cookie, and blacklists the old refresh token.

**When to use:** Required for D-04 and D-05.

```typescript
// Source: [ASSUMED - standard refresh rotation pattern]
// apps/backend/src/auth/auth.service.ts (outline)

async refresh(oldRefreshToken: string): Promise<{ accessToken: string }> {
  // 1. Verify JWT signature + expiry
  const payload = this.jwtService.verify(oldRefreshToken, {
    secret: this.config.get('JWT_REFRESH_SECRET'),
  });

  // 2. Check Redis blacklist — reject if present
  const isBlacklisted = await this.redisService.get(`blacklist:${oldRefreshToken}`);
  if (isBlacklisted) throw new InvalidCredentialsError('Token revoked');

  // 3. Issue new tokens
  const newAccessToken = this.signAccessToken(payload);
  const newRefreshToken = this.signRefreshToken(payload);

  // 4. Blacklist the OLD refresh token with TTL = remaining lifetime
  const remainingTtl = payload.exp - Math.floor(Date.now() / 1000);
  await this.redisService.set(`blacklist:${oldRefreshToken}`, '1', remainingTtl);

  return { accessToken: newAccessToken, newRefreshToken };
}
```

### Pattern 3: httpOnly Cookie Setup in NestJS

**What:** NestJS needs `cookie-parser` middleware applied in `main.ts` to parse incoming cookies. The refresh token cookie must be set with `httpOnly: true, secure: true, sameSite: 'strict'`.

**Critical:** In NestJS, cookie-parser must be applied before guards run.

```typescript
// apps/backend/src/main.ts addition
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  // ... rest of bootstrap
}
```

```typescript
// In auth.controller.ts — setting the cookie on login/refresh
@Post('login')
async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
  const { accessToken, refreshToken } = await this.authService.login(dto);
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/auth/refresh',            // Scope cookie to refresh endpoint only
  });
  return { data: { accessToken }, meta: {}, errors: [] };
}
```

> **Pitfall:** Setting `path: '/auth/refresh'` scopes the cookie so it is not sent on every request — only on the refresh endpoint. This is a security improvement. [ASSUMED]

### Pattern 4: Axios Silent Refresh Interceptor (Frontend)

**What:** A response interceptor on the axios instance intercepts 401 responses, attempts a single `/auth/refresh` call, then retries the original request with the new access token. A flag prevents infinite retry loops.

**When to use:** Required for D-03.

```typescript
// Source: [ASSUMED - standard axios interceptor pattern]
// apps/frontend/src/lib/axios.ts

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axiosInstance.post('/auth/refresh');
        const newToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        failedQueue.forEach((p) => p.resolve(newToken));
        failedQueue = [];
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach((p) => p.reject(refreshError));
        failedQueue = [];
        useAuthStore.getState().clearAuth();
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
```

### Pattern 5: Zustand Auth Store with Hydration

**What:** The store holds `user`, `accessToken`, `isAuthenticated`, and `isHydrating`. On app startup, `isHydrating = true` while the silent refresh attempt resolves. `PrivateRoute` shows a spinner during hydration to prevent flash-of-redirect.

```typescript
// Source: [ASSUMED - standard Zustand auth store pattern]
// apps/frontend/src/stores/auth-store.ts

interface AuthState {
  user: { id: string; email: string; name: string | null; role: string } | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setAuth: (user: AuthState['user'], accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setHydrating: (value: boolean) => void;
}
```

### Pattern 6: React Router Layout Architecture

**What:** React Router v7 nested routes with layout components as route elements. `AppLayout` wraps authenticated routes; `AuthLayout` wraps unauthenticated routes. `PrivateRoute` sits between the router and `AppLayout`.

```typescript
// Source: [ASSUMED - React Router v7 nested route pattern]
// apps/frontend/src/App.tsx

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/courses', element: <PlaceholderPage title="Courses" /> },
          { path: '/assignments', element: <PlaceholderPage title="Assignments" /> },
          { path: '/gradebook', element: <PlaceholderPage title="Gradebook" /> },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
]);
```

### Anti-Patterns to Avoid

- **Storing access token in localStorage or sessionStorage:** XSS attack surface. Decision D-01 mandates Zustand memory store only.
- **Storing refresh token in memory (JavaScript-accessible):** CSRF risk if combined with XSS. Decision D-02 mandates httpOnly cookie.
- **Single shared JWT secret for both access and refresh tokens:** If the access secret is compromised, refresh tokens are also at risk. Use `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` as separate env vars.
- **Not scoping the refresh cookie path:** Setting cookie on all paths means it is sent on every API request, unnecessarily exposing it. Scope to `path: '/auth/refresh'`.
- **Infinite refresh loop:** If the `/auth/refresh` endpoint itself returns 401, the interceptor must not retry. The `_retry` flag and `isRefreshing` lock prevent this.
- **Not handling concurrent 401s:** Without a queue, multiple concurrent requests failing on 401 all trigger simultaneous refresh calls. The `failedQueue` pattern handles this.
- **Not invalidating the old refresh token on rotation:** Without Redis blacklisting the old token, a stolen token can be reused after rotation.
- **Using `res.json()` instead of `passthrough: true`:** In NestJS, using `@Res()` without `passthrough: true` disables NestJS response handling and breaks the JSON:API format. Always use `@Res({ passthrough: true })` when setting cookies alongside a body.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom crypto | `bcrypt` | Timing-safe comparison, adaptive work factor, industry standard |
| JWT signing/verification | `jsonwebtoken` directly | `@nestjs/jwt` wrapping it | NestJS DI integration, secret from ConfigService, testable |
| Passport strategy wiring | Manual middleware | `@nestjs/passport` + `PassportStrategy` | Handles guard execution, strategy registration, req.user injection |
| Form state + validation | Custom useState chains | `react-hook-form` + `zod` | Uncontrolled inputs, minimal re-renders, async validation, error registration |
| Server state caching | Custom fetch + useState | `@tanstack/react-query` | Deduplication, background refetch, stale-while-revalidate |
| Redis client | Custom TCP connection | `ioredis` | Connection pooling, reconnection, Cluster support, TypeScript types |
| Cookie parsing | Manual header splitting | `cookie-parser` | Signed cookies, edge cases in cookie spec |

**Key insight:** The entire refresh token rotation pattern looks custom but is assembled from standard primitives — ioredis SET with TTL, JwtService.verify(), and cookie-parser. No piece of it requires hand-rolling crypto or protocol logic.

---

## Common Pitfalls

### Pitfall 1: `reflect-metadata` Missing from NestJS Module
**What goes wrong:** NestJS decorators (`@Injectable`, `@Module`, `@Controller`) require `reflect-metadata` to be imported before any NestJS module code runs. If missing, DI fails silently or throws cryptic errors about missing providers.
**Why it happens:** Phase 1 installed it as a dependency, but if `main.ts` does not import it first, the module resolution fails.
**How to avoid:** Verify `import 'reflect-metadata'` is the first import in `main.ts`. Check `apps/backend/src/main.ts`.
**Warning signs:** `Nest can't resolve dependencies of the AuthService` despite providers being correctly declared.

### Pitfall 2: Passport Strategy Not Registered
**What goes wrong:** `@UseGuards(AuthGuard('jwt'))` throws "Unknown authentication strategy jwt".
**Why it happens:** The strategy class must be declared in the `providers` array of `AuthModule`. It's easy to declare the class but forget to add it to providers.
**How to avoid:** `AuthModule` providers must include `JwtStrategy`, `LocalStrategy`, `AuthService`.
**Warning signs:** 500 error with "Unknown authentication strategy" on any guarded route.

### Pitfall 3: Cookie Not Sent on Refresh
**What goes wrong:** `/auth/refresh` receives no cookie even though login set one.
**Why it happens:** Either (a) axios defaults do not send cookies cross-origin (`withCredentials: false` by default), (b) the cookie path was scoped too narrowly, or (c) CORS is not configured to allow credentials.
**How to avoid:**
- Set `withCredentials: true` on the axios instance (or on the specific refresh request)
- CORS in NestJS must include `credentials: true` and explicit origin (not `*`)
- Cookie `path: '/auth/refresh'` means the cookie is only sent to that path — this is correct for security
**Warning signs:** `/auth/refresh` succeeds at login but throws "no refresh token" on the first refresh attempt.

### Pitfall 4: `@Res()` Without `passthrough: true` Breaks Response Handling
**What goes wrong:** When using `@Res()` to set cookies, NestJS hands raw Express response to the controller. If `passthrough: true` is not set, returning a value from the controller method does nothing — the response is never sent unless you call `res.json()` manually.
**Why it happens:** NestJS's response interceptors and serialization only apply when using `passthrough: true`.
**How to avoid:** Always use `@Res({ passthrough: true })` when you only need to set cookies. NestJS then handles sending the returned value normally.
**Warning signs:** Endpoint hangs indefinitely or returns empty 200.

### Pitfall 5: bcrypt Synchronous Calls Blocking Event Loop
**What goes wrong:** `bcrypt.hashSync()` or `bcrypt.compareSync()` block the Node.js event loop during hashing, degrading throughput on concurrent requests.
**Why it happens:** Bcrypt is CPU-intensive by design (work factor). Synchronous calls block the single-threaded event loop.
**How to avoid:** Always use `bcrypt.hash()` and `bcrypt.compare()` (async versions with callback/Promise).
**Warning signs:** Server becomes unresponsive during load tests on auth endpoints.

### Pitfall 6: `isHydrating` Flash-of-Redirect
**What goes wrong:** On page refresh, `PrivateRoute` reads `isAuthenticated = false` (Zustand store starts empty) and immediately redirects to `/login` before the silent refresh resolves.
**Why it happens:** Zustand memory store is empty on cold start. The refresh call is async.
**How to avoid:** Initialize `isHydrating: true` in the store. `PrivateRoute` renders a spinner when `isHydrating` is true. The app's root effect calls `/auth/refresh` on mount and sets `isHydrating: false` when done (success or failure).
**Warning signs:** Users are logged out on every browser refresh despite valid refresh token cookies.

### Pitfall 7: zod v4 API Changes
**What goes wrong:** zod 4.x (current: 4.3.6) has breaking changes from zod 3.x. If documentation or examples reference `z.string().email()`, the API is the same, but `z.object()` shape inference and error format changed.
**Why it happens:** zod 4 released recently; many guides still reference v3.
**How to avoid:** Use `@hookform/resolvers` v5.x which supports zod v4 via the Standard Schema protocol (see resolved Q1 below). The `zodResolver` import path remains `@hookform/resolvers/zod`.
**Warning signs:** TypeScript errors on `zodResolver(schema)` or runtime parse errors with unexpected shape.

### Pitfall 8: JWT Secret in Code
**What goes wrong:** JWT_ACCESS_SECRET or JWT_REFRESH_SECRET hardcoded in source or committed to git.
**Why it happens:** Convenient during development.
**How to avoid:** Always read from `ConfigService`. Add both secrets to `.env.example` as placeholders. Verify `.env` is gitignored (it is, from Phase 1).
**Warning signs:** Secret appearing in git diff or in compiled output.

---

## Code Examples

Verified patterns from official sources or well-established conventions:

### NestJS JwtModule Registration

```typescript
// Source: [ASSUMED - NestJS JWT docs pattern]
// apps/backend/src/auth/auth.module.ts
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    PassportModule,
    PrismaModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
```

### Redis Blacklist Service

```typescript
// Source: [ASSUMED - ioredis standard pattern]
// apps/backend/src/redis/redis.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) throw new Error('REDIS_URL environment variable is not set');
    this.client = new Redis(url);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }
}
```

### InitialsAvatar Component (hash function)

```typescript
// Source: [ASSUMED - deterministic color from user ID]
// apps/frontend/src/components/ui/initials-avatar.tsx

const PALETTE = [
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#0ea5e9', // sky-500
  '#14b8a6', // teal-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#64748b', // slate-500
];

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

function getColor(userId: string): string {
  const sum = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[sum % 8];
}
```

### New Environment Variables Required

Add to `.env` and `.env.example`:

```bash
# JWT
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Redis URL already exists in `.env.example` from Phase 1: `REDIS_URL="redis://localhost:6379"`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage access tokens | Memory store (Zustand) + httpOnly cookie refresh | ~2020 (XSS awareness) | Access tokens never persisted; refresh tokens inaccessible to JS |
| Single JWT secret | Separate access + refresh secrets | Industry norm | Refresh token compromise doesn't expose access token key |
| `passport.initialize()` middleware manually | `@nestjs/passport` handles it via `PassportModule` | NestJS v6+ | No manual middleware wiring needed |
| `useSelector` / Redux for auth state | Zustand lightweight store | 2022-2024 | Eliminates Redux boilerplate for simple auth state |
| zod v3 schema validation | zod v4 (current: 4.3.6) | 2025 | Breaking API changes — use `@hookform/resolvers` v5.x (Standard Schema protocol) for compatibility |

**Deprecated/outdated:**
- KafkaJS: unmaintained since Feb 2023 (irrelevant to Phase 2 but documented in CLAUDE.md)
- `@nestjs/passport` < v10: older versions had different peer dependency requirements — v11.0.5 is current

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cookie `path: '/auth/refresh'` scoping prevents the cookie from being sent on other endpoints | Architecture Patterns (Pattern 3) | Cookie sent on all requests = unnecessary exposure, but not a blocker |
| A2 | ~~`@hookform/resolvers` supports zod v4~~ | ~~Common Pitfalls (Pitfall 7)~~ | **RESOLVED** — see Q1 below. `@hookform/resolvers@5.2.2` uses `@standard-schema/utils` and ships with explicit zod v4 test fixtures. Confirmed compatible. |
| A3 | `ioredis` v5 is compatible with NestJS 11 lifecycle hooks pattern (`OnModuleInit`/`OnModuleDestroy`) | Standard Stack | Alternative: use `@nestjs/cache-manager` with Redis adapter |
| A4 | Refresh token rotation (single-use) with Redis blacklist is sufficient security for v1 LMS (not a banking app) | Architecture Patterns | Accepted risk for v1; refresh family invalidation (not single token) is a hardened alternative |
| A5 | `passport-local` strategy is needed (vs implementing manual email/password check in AuthService) | Standard Stack | Alternative: skip LocalStrategy, validate credentials in service, use only JwtStrategy for guards |
| A6 | `withCredentials: true` is needed on the axios instance for cookie transmission | Common Pitfalls (Pitfall 3) | If API is same-origin (both served from localhost:3000 via proxy), cookies transmit without `withCredentials`. Need to verify dev proxy setup. |

---

## Open Questions (RESOLVED)

1. **Is `@hookform/resolvers` compatible with zod v4?**
   - **RESOLVED (2026-04-16):** Yes. `@hookform/resolvers@5.2.2` depends on `@standard-schema/utils@^0.3.0` and uses the Standard Schema protocol. Zod v4 implements the `@standard-schema/spec` interface natively (built-in, no extra dependency). The `@hookform/resolvers` package ships with explicit test fixtures for zod v4 (`data-v4.ts`, `data-v4-mini.ts`) alongside zod v3 fixtures. The `zodResolver` import path `@hookform/resolvers/zod` continues to work. No fallback to zod v3 needed.
   - **Verification:** `npm view @hookform/resolvers peerDependencies` returns `{ 'react-hook-form': '^7.55.0' }` (no zod peer dep -- uses Standard Schema instead). `npm view @hookform/resolvers dependencies` returns `{ '@standard-schema/utils': '^0.3.0' }`.

2. **Same-origin or cross-origin API calls in dev?**
   - **RESOLVED (2026-04-16):** Plan 02-03 Task 1 adds a Vite proxy in `vite.config.ts` that forwards `/auth/*` and `/users/*` to `http://localhost:3000`. This makes API calls same-origin during development, so cookies are sent automatically. The `withCredentials: true` on the axios instance is kept for robustness (harmless for same-origin, required if proxy is ever removed).

3. **Redis connection in test environment?**
   - **RESOLVED (2026-04-16):** Plan 02-01 Task 1 creates `redis.service.spec.ts` using `jest.mock('ioredis')` to mock the Redis constructor. Plan 02-02 Task 1 mocks `RedisService` in auth service tests via NestJS Testing module (`Test.createTestingModule` with mock providers). No live Redis connection needed for unit tests. E2e tests (if added later) would use Docker.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | User model, auth queries | Confirmed (Phase 1 docker-compose) | 16-alpine | — |
| Redis | Token blacklist | Confirmed (Phase 1 docker-compose) | 7-alpine | — |
| Node.js | Backend runtime | Confirmed (Phase 1) | 22.x | — |
| npm / pnpm | Package installation | Confirmed (Phase 1) | pnpm 10.33.0 | — |

All external dependencies are available. No blocking gaps.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework (backend) | Jest 30.x — configured in `apps/backend/package.json` |
| Framework (frontend) | Vitest 4.x + Testing Library — configured in `apps/frontend/package.json` |
| Config file (backend) | `apps/backend/jest.config.js` or inline in `package.json` — check at Wave 0 |
| Config file (frontend) | `apps/frontend/vite.config.ts` (inline `test` block) |
| Quick run (backend) | `pnpm --filter backend test` |
| Quick run (frontend) | `pnpm --filter frontend test` |
| Full suite | `pnpm test` (Turborepo runs both) |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Sign up creates user with hashed password, STUDENT role | unit (AuthService) | `pnpm --filter backend test -- --testPathPattern auth.service` | Wave 0 |
| AUTH-01 | Duplicate email returns 409 | unit (AuthService) | same | Wave 0 |
| AUTH-02 | Login with valid credentials returns access token | unit (AuthService) | same | Wave 0 |
| AUTH-02 | Login with invalid credentials throws InvalidCredentialsError | unit (AuthService) | same | Wave 0 |
| AUTH-03 | `/auth/refresh` with valid cookie issues new tokens | unit (AuthService) | `pnpm --filter backend test -- --testPathPattern auth.service` | Wave 0 |
| AUTH-03 | Blacklisted refresh token is rejected | unit (AuthService) | same | Wave 0 |
| AUTH-03 | Silent refresh interceptor retries failed request | unit (axios.ts) | `pnpm --filter frontend test -- --reporter=verbose` | Wave 0 |
| AUTH-04 | Logout blacklists token and clears cookie | unit (AuthService) | same backend | Wave 0 |
| AUTH-04 | After logout, refresh token cannot be reused | unit (AuthService) | same | Wave 0 |
| AUTH-05 | PATCH /users/me updates display name | unit (UsersService) | `pnpm --filter backend test -- --testPathPattern users.service` | Wave 0 |
| AUTH-05 | PATCH /users/me/password rejects wrong current password | unit (UsersService) | same | Wave 0 |
| ROLE-01 | Signup sets role = STUDENT by default | unit (AuthService) | same auth.service | Wave 0 |
| ROLE-01 | Role enum exists: STUDENT, INSTRUCTOR, ADMIN | schema test / db check | `pnpm --filter backend test -- --testPathPattern auth.service` | Wave 0 |

**Manual verification (cannot be automated in unit tests):**
- Login form shows correct error states (field-level, form-level, loading spinner)
- Signup form shows duplicate email alert with "Sign in instead?" link
- PrivateRoute shows spinner during hydration, then redirects or renders content
- Sidebar renders with correct active route highlight
- Profile page loads with current display name pre-populated
- Toast appears on successful profile save

### Sampling Rate

- **Per task commit:** `pnpm --filter backend test -- --passWithNoTests` (backend only, fast)
- **Per wave merge:** `pnpm test` (both backend + frontend full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `apps/backend/src/auth/auth.service.spec.ts` — covers AUTH-01, AUTH-02, AUTH-03, AUTH-04, ROLE-01
- [ ] `apps/backend/src/users/users.service.spec.ts` — covers AUTH-05
- [ ] `apps/backend/src/redis/redis.service.spec.ts` — mock Redis client test
- [ ] `apps/frontend/src/lib/axios.test.ts` — interceptor retry logic (Vitest + msw or vi.mock)
- [ ] Jest config file at `apps/backend/jest.config.js` — check if auto-generated by NestJS CLI or needs creation

---

## Security Domain

> `security_enforcement` is not explicitly set to `false` in config — treating as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | YES | bcrypt for password hashing; no plaintext passwords; email uniqueness |
| V3 Session Management | YES | httpOnly cookie for refresh token; 15m access token TTL; Redis blacklist on logout; single-use refresh rotation |
| V4 Access Control | Partial (Phase 3 full) | JwtAuthGuard on protected routes; role in JWT payload (enforcement in Phase 3) |
| V5 Input Validation | YES | class-validator + ValidationPipe on all DTOs; zod resolver on frontend forms |
| V6 Cryptography | YES | bcrypt (never hand-rolled); jwt HS256 with strong secrets from env |

### Known Threat Patterns for JWT + Cookie Auth Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS stealing access token | Information Disclosure | Store in Zustand memory only — not localStorage. Access token TTL 15m limits damage window |
| CSRF forging refresh | Tampering | SameSite=Strict cookie attribute blocks cross-site requests |
| Refresh token theft + reuse | Spoofing | Single-use rotation: old token blacklisted in Redis on each refresh. Stolen token can only be used once before being invalidated |
| Brute-force login | Tampering | `@nestjs/throttler` (Phase 2 should configure rate limiting on `/auth/login` and `/auth/signup`) |
| JWT secret in environment | Information Disclosure | ConfigService reads from process.env; `.env` gitignored; separate access + refresh secrets |
| Insecure password storage | Information Disclosure | bcrypt with work factor >= 10 (bcrypt default is 10) |
| Open redirect via `?next=` | Tampering | Validate: must start with `/`, must not contain `://`. Reject external URLs |

> **Rate limiting note:** `@nestjs/throttler` is listed in CLAUDE.md stack for auth endpoints. It is not yet installed (not in `apps/backend/package.json`). Phase 2 plans should include installing and configuring `@nestjs/throttler` on `/auth/login` and `/auth/signup` to satisfy ASVS V4.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] — `@nestjs/passport@11.0.5`, `@nestjs/jwt@11.0.2`, `passport@0.7.0`, `passport-jwt@4.0.1`, `passport-local@1.0.0`, `bcrypt@6.0.0`, `ioredis@5.10.1`, `cookie-parser@1.4.7` — all verified 2026-04-16
- [VERIFIED: npm registry] — `@tanstack/react-query@5.99.0`, `zustand@5.0.12`, `react-hook-form@7.72.1`, `zod@4.3.6`, `axios@1.15.0`, `lucide-react@1.8.0`, `@fontsource/inter@5.2.8` — all verified 2026-04-16
- [VERIFIED: npm registry] — `@hookform/resolvers@5.2.2` — depends on `@standard-schema/utils@^0.3.0`, ships with zod v3 + v4 test fixtures, confirmed zod v4 compatible — verified 2026-04-16
- [VERIFIED: codebase] — `apps/backend/prisma/schema.prisma` — User model with Role enum already exists (STUDENT/INSTRUCTOR/ADMIN)
- [VERIFIED: codebase] — `apps/backend/src/prisma/prisma.service.ts` — PrismaService injectable pattern confirmed
- [VERIFIED: codebase] — `apps/backend/src/app.module.ts` — ConfigModule pattern for AuthModule to follow
- [VERIFIED: codebase] — `apps/frontend/package.json` — confirms what is and is not installed
- [VERIFIED: codebase] — `02-UI-SPEC.md` — complete visual contract, component inventory, file placement

### Secondary (MEDIUM confidence)
- CLAUDE.md — error handling patterns (DomainError, HTTP mapping), API response format, coding conventions
- Phase 1 SUMMARY files — established patterns for NestJS module structure, path aliases, environment loading

### Tertiary (LOW confidence)
- [ASSUMED] — Axios interceptor queue pattern for concurrent 401 handling
- [ASSUMED] — Cookie `path: '/auth/refresh'` scoping behavior
- [ASSUMED] — `withCredentials: true` requirement depends on dev proxy configuration

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against npm registry 2026-04-16
- Architecture: HIGH — established NestJS + Passport + JWT patterns; decisions locked in CONTEXT.md
- Frontend patterns: HIGH — Zustand + axios interceptor patterns well-established; zod v4 + @hookform/resolvers v5.x compatibility confirmed
- Security: HIGH — ASVS categories verified against phase tech stack; threats identified from established attack patterns

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable ecosystem — 30 days)
