---
phase: 02-authentication
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 53
files_reviewed_list:
  - apps/backend/package.json
  - apps/backend/prisma/schema.prisma
  - apps/backend/src/app.module.ts
  - apps/backend/src/auth/auth.controller.ts
  - apps/backend/src/auth/auth.module.ts
  - apps/backend/src/auth/auth.service.spec.ts
  - apps/backend/src/auth/auth.service.ts
  - apps/backend/src/auth/dto/login.dto.ts
  - apps/backend/src/auth/dto/signup.dto.ts
  - apps/backend/src/auth/guards/jwt-auth.guard.ts
  - apps/backend/src/auth/guards/local-auth.guard.ts
  - apps/backend/src/auth/strategies/jwt.strategy.ts
  - apps/backend/src/auth/strategies/local.strategy.ts
  - apps/backend/src/common/errors/domain.error.ts
  - apps/backend/src/common/errors/invalid-credentials.error.ts
  - apps/backend/src/common/errors/user-already-exists.error.ts
  - apps/backend/src/common/errors/user-not-found.error.ts
  - apps/backend/src/common/filters/domain-exception.filter.ts
  - apps/backend/src/main.ts
  - apps/backend/src/redis/redis.module.ts
  - apps/backend/src/redis/redis.service.spec.ts
  - apps/backend/src/redis/redis.service.ts
  - apps/backend/src/users/dto/update-profile.dto.ts
  - apps/backend/src/users/users.controller.ts
  - apps/backend/src/users/users.module.ts
  - apps/backend/src/users/users.service.spec.ts
  - apps/backend/src/users/users.service.ts
  - apps/frontend/components.json
  - apps/frontend/package.json
  - apps/frontend/src/App.tsx
  - apps/frontend/src/components/layouts/app-layout.tsx
  - apps/frontend/src/components/layouts/auth-layout.tsx
  - apps/frontend/src/components/layouts/private-route.tsx
  - apps/frontend/src/components/layouts/sidebar.tsx
  - apps/frontend/src/components/ui/alert.tsx
  - apps/frontend/src/components/ui/button.tsx
  - apps/frontend/src/components/ui/card.tsx
  - apps/frontend/src/components/ui/form.tsx
  - apps/frontend/src/components/ui/initials-avatar.tsx
  - apps/frontend/src/components/ui/input.tsx
  - apps/frontend/src/components/ui/label.tsx
  - apps/frontend/src/components/ui/separator.tsx
  - apps/frontend/src/components/ui/sonner.tsx
  - apps/frontend/src/index.css
  - apps/frontend/src/lib/axios.test.ts
  - apps/frontend/src/lib/axios.ts
  - apps/frontend/src/lib/utils.ts
  - apps/frontend/src/main.tsx
  - apps/frontend/src/pages/dashboard.tsx
  - apps/frontend/src/pages/login.tsx
  - apps/frontend/src/pages/placeholder.tsx
  - apps/frontend/src/pages/profile.tsx
  - apps/frontend/src/pages/signup.tsx
  - apps/frontend/src/stores/auth-store.ts
  - apps/frontend/tsconfig.json
  - apps/frontend/vite.config.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 53
**Status:** issues_found

## Summary

Phase 02 implements a complete JWT-based authentication system (signup, login, refresh, logout) with an httpOnly refresh-token cookie, token rotation via Redis blacklisting, and a matching React frontend with a Zustand auth store and axios silent-refresh interceptor. The architecture is sound: domain errors map cleanly to HTTP responses, the `DomainExceptionFilter` handles all custom error types, password validation is strict on both client and server, and the open-redirect guard on the `next` parameter is correct.

Four warnings require attention before moving to the next phase:

1. `auth.service.ts` — `login()` and `refresh()` look up users by ID without the `deleted_at: null` filter, allowing soft-deleted users to authenticate.
2. `auth.service.ts` — `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are read from `process.env` at call time instead of at module init, meaning a missing secret only surfaces at runtime (a signing call), not at startup.
3. `users.service.ts` — `updateProfile()` calls `prisma.user.update` without first checking existence, so it propagates a raw Prisma `P2025` (record not found) error rather than the domain `UserNotFoundError`.
4. `App.tsx` — `setHydrating` is listed in the `useEffect` dependency array but is never called inside the effect, causing an unnecessary re-run if the store reference changes (unlikely in practice but misleading and a lint warning with `react-hooks/exhaustive-deps`).

Four info items are noted for completeness.

## Warnings

### WR-01: Soft-deleted users can authenticate via `login()` and `refresh()`

**File:** `apps/backend/src/auth/auth.service.ts:91-92` and `131-132`
**Issue:** `login()` queries `prisma.user.findUnique({ where: { id: userId } })` and `refresh()` queries `prisma.user.findUnique({ where: { id: payload.sub } })` — neither includes `deleted_at: null`. A soft-deleted account can therefore receive fresh tokens after deletion. `signup()` and `validateUser()` both correctly include the filter; the omission here is inconsistent and creates a privilege-escalation path if account deletion is ever enforced.
**Fix:**
```typescript
// auth.service.ts — login(), line 91
const user = await this.prisma.user.findUnique({
  where: { id: userId, deleted_at: null },
});

// auth.service.ts — refresh(), line 131
const user = await this.prisma.user.findUnique({
  where: { id: payload.sub, deleted_at: null },
});
```

---

### WR-02: JWT secrets read from `process.env` at call time, not validated at startup

**File:** `apps/backend/src/auth/auth.service.ts:119`, `162`, `174`, `182`
**Issue:** `signAccessToken()` and `signRefreshToken()` read `process.env['JWT_ACCESS_SECRET']` and `process.env['JWT_REFRESH_SECRET']` on every call. If a secret is missing the value is `undefined`, which `@nestjs/jwt` silently accepts and signs with the string `"undefined"`. The error (tokens signed with a worthless secret) would only be discovered when a signed token is later verified. By contrast, `JwtStrategy` correctly throws at construction time if `JWT_ACCESS_SECRET` is absent. The same early-fail pattern should be applied to the service.
**Fix:** Inject secrets once at module init, either via `ConfigService` or by throwing during `AuthService` construction:
```typescript
@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    const accessSecret = process.env['JWT_ACCESS_SECRET'];
    const refreshSecret = process.env['JWT_REFRESH_SECRET'];
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET is not set');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is not set');
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
  }
  // Use this.accessSecret / this.refreshSecret in sign/verify calls
}
```

---

### WR-03: `updateProfile()` leaks raw Prisma error when user does not exist

**File:** `apps/backend/src/users/users.service.ts:59-69`
**Issue:** `updateProfile()` calls `prisma.user.update({ where: { id } })` without first checking that the record exists. If the user ID is not found, Prisma throws `PrismaClientKnownRequestError` with code `P2025`. This exception is not a `DomainError` and is therefore not caught by `DomainExceptionFilter`, causing NestJS to return a generic 500 response (or an unhandled exception in production mode) rather than the expected 404. The `findById()` method in the same service already handles this correctly.
**Fix:**
```typescript
async updateProfile(id: string, dto: UpdateProfileDto): Promise<UpdatedUserProfile> {
  // Verify the user exists first (throws UserNotFoundError if not)
  await this.findById(id);

  const updateData: Partial<{ name: string; timezone: string }> = {};
  if (dto.name !== undefined) updateData.name = dto.name;
  if (dto.timezone !== undefined) updateData.timezone = dto.timezone;

  return this.prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, timezone: true },
  });
}
```

---

### WR-04: `setHydrating` in `useEffect` dependency array but never called in the effect

**File:** `apps/frontend/src/App.tsx:58`
**Issue:** `setHydrating` is included in the `useEffect` dependency array (`[setAuth, setHydrating, clearAuth]`) but is never invoked inside the effect body. The effect calls `setAuth` (which internally sets `isHydrating: false`) and `clearAuth` (which also sets `isHydrating: false`), so hydration state is managed correctly. However, the stale dependency is misleading — it implies `setHydrating` has a role it does not have — and `react-hooks/exhaustive-deps` will flag a "missing" usage. If the intent was to call `setHydrating(true)` at the start and `setHydrating(false)` in the `finally` branch, this is currently missing.
**Fix (remove unused dep):**
```typescript
useEffect(() => {
  const hydrate = async (): Promise<void> => {
    try {
      const { data } = await api.post('/auth/refresh');
      setAuth(data.data.user, data.data.accessToken);
    } catch {
      clearAuth();
    }
  };
  void hydrate();
}, [setAuth, clearAuth]); // removed setHydrating — it is unused here
```

---

## Info

### IN-01: `SignupDto.name` is required on the backend but `User.name` is optional in the schema

**File:** `apps/backend/src/auth/dto/signup.dto.ts:22-26` and `apps/backend/prisma/schema.prisma:17`
**Issue:** `SignupDto` marks `name` as a required field (`@IsNotEmpty()`), but the Prisma model defines `name String?` (nullable). This is an intentional inconsistency — the backend enforces a name at signup via the DTO, while the DB column stays nullable to allow future admin-created accounts or OAuth flows. The mismatch is not a bug today, but worth documenting so future flows that create users without a name do not require a DTO change.
**Fix:** Add a comment on the DTO field clarifying the intent, or create a separate `AdminCreateUserDto` when that use-case arrives. No code change required now.

---

### IN-02: `process.env['NODE_ENV']` read at module load time for cookie `secure` flag

**File:** `apps/backend/src/auth/auth.controller.ts:12`
**Issue:** `REFRESH_COOKIE_OPTIONS` is defined as a module-level constant, so `process.env['NODE_ENV'] === 'production'` is evaluated once when the module is first loaded. This is fine in practice (NODE_ENV does not change at runtime), but duplicating the check at line 79 inside `clearCookie` is an inconsistency — if the constant is updated, the `clearCookie` call must be updated independently.
**Fix:** Reuse `REFRESH_COOKIE_OPTIONS` in `clearCookie` by spreading relevant fields, or extract the `secure` flag to a shared constant:
```typescript
res.clearCookie('refresh_token', {
  httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
  secure: REFRESH_COOKIE_OPTIONS.secure,
  sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
  path: REFRESH_COOKIE_OPTIONS.path,
});
```

---

### IN-03: `console.log` left in `main.ts` bootstrap

**File:** `apps/backend/src/main.ts:36`
**Issue:** `console.log(`Application is running on: http://localhost:${port}`)` is a startup message that leaks configuration details in a production log stream. For a dev-only project at this stage this is minor, but in a multi-tenant LMS it should be replaced with a proper logger (NestJS built-in `Logger`) so the output level can be controlled.
**Fix:**
```typescript
// In bootstrap():
const logger = new Logger('Bootstrap');
logger.log(`Application is running on port ${port}`);
```

---

### IN-04: `axios` interceptor URL matching relies on `originalRequest.url` which can be `undefined`

**File:** `apps/frontend/src/lib/axios.ts:54`
**Issue:** `AUTH_ENDPOINTS.includes(originalRequest.url ?? '')` falls back to an empty string when `url` is undefined. An empty string is not in `AUTH_ENDPOINTS`, so undefined-URL requests will be treated as normal protected requests and trigger a refresh attempt on 401. This is a safe fallback, but the empty-string edge case is worth noting.
**Fix:** No immediate code change required — the fallback is safe. If stricter matching is ever needed, guard with an explicit `if (!originalRequest.url) return Promise.reject(error);` before the check.

---

_Reviewed: 2026-04-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
