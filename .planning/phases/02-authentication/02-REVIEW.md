---
phase: 02-authentication
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 43
files_reviewed_list:
  - .env.example
  - apps/backend/jest.config.ts
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
  - apps/frontend/src/App.test.tsx
  - apps/frontend/src/App.tsx
  - apps/frontend/src/components/layouts/app-layout.tsx
  - apps/frontend/src/components/layouts/auth-layout.tsx
  - apps/frontend/src/components/layouts/private-route.tsx
  - apps/frontend/src/components/layouts/sidebar.tsx
  - apps/frontend/src/components/ui/initials-avatar.tsx
  - apps/frontend/src/lib/axios.test.ts
  - apps/frontend/src/lib/axios.ts
  - apps/frontend/src/pages/dashboard.tsx
  - apps/frontend/src/pages/login.tsx
  - apps/frontend/src/pages/profile.tsx
  - apps/frontend/src/pages/signup.tsx
  - apps/frontend/src/stores/auth-store.ts
findings:
  critical: 2
  warning: 5
  info: 4
  total: 11
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 43
**Status:** issues_found

## Summary

Phase 02 implements a complete JWT-based authentication system: signup, login, token rotation with Redis blacklisting, logout, silent refresh via an axios interceptor, and a user profile endpoint — with a full React frontend. The architecture is well-structured: domain errors map cleanly to HTTP responses via `DomainExceptionFilter`, the IANA-timezone dropdown and open-redirect guard on the `next` parameter are both correctly implemented, and test coverage exists for the service layer.

Two critical issues require immediate attention before this phase can be considered production-ready:

1. `auth.service.ts` — `findUnique` is called with a compound `where` that mixes the unique field (`email`) with a non-unique field (`deleted_at: null`). Prisma v7 rejects this at runtime with a validation error, meaning `signup` and `validateUser` (and therefore every login attempt) will throw a `PrismaClientValidationError` in the real database — even though the unit tests pass because they mock Prisma entirely.

2. `auth.service.ts` — JWT secrets are read from `process.env` at every sign/verify call site rather than being validated at startup. If either secret is absent, `@nestjs/jwt` receives `undefined` and silently signs tokens with the string `"undefined"` — tokens that will appear valid during the same session but will fail cross-instance and restart verification.

Five warnings and four info items are documented below.

---

## Critical Issues

### CR-01: `findUnique` with `deleted_at` filter will throw at runtime — use `findFirst`

**File:** `apps/backend/src/auth/auth.service.ts:41-43` and `75-77`

**Issue:** Prisma's `findUnique` only accepts fields that together constitute a unique index in its `where` clause. Passing `{ email: dto.email, deleted_at: null }` combines `email` (unique) with `deleted_at` (non-unique), which is not a valid `UserWhereUniqueInput`. Prisma v7 will throw a `PrismaClientValidationError` at runtime:

```
Argument `where` of type `UserWhereUniqueInput` needs exactly one argument, but received 2.
```

Because the unit tests mock Prisma entirely, this bug does not surface in the test suite. It will crash every signup attempt and every login attempt (via `validateUser`) against a real database.

**Fix:** Replace `findUnique` with `findFirst` for any lookup that filters on non-unique columns alongside a unique one:

```typescript
// signup — line 41
const existing = await this.prisma.user.findFirst({
  where: { email: dto.email, deleted_at: null },
});

// validateUser — line 75
const user = await this.prisma.user.findFirst({
  where: { email, deleted_at: null },
});
```

Note: `findFirst` does not guarantee the same uniqueness semantics as `findUnique` for the return value, but because `email` has a unique index in the schema, at most one non-deleted row will ever match, so the behavior is equivalent.

---

### CR-02: JWT secrets read from `process.env` at call time — undefined secret silently accepted

**File:** `apps/backend/src/auth/auth.service.ts:119`, `162`, `174-175`, `181-182`

**Issue:** `signAccessToken` and `signRefreshToken` pass `process.env['JWT_ACCESS_SECRET']` and `process.env['JWT_REFRESH_SECRET']` to `jwtService.sign/verify` on every invocation. If either variable is absent, the value is `undefined`. `@nestjs/jwt` (via `jsonwebtoken`) coerces `undefined` to the string `"undefined"` and uses it as the HMAC secret — signing tokens that look syntactically valid but are signed with a worthless secret. These tokens will be accepted by the same process in the same run but will fail verification anywhere else (different instance, after restart), and the problem will only appear as intermittent 401 errors rather than a clear startup failure.

`JwtStrategy` (line 16-17 in `jwt.strategy.ts`) correctly validates `JWT_ACCESS_SECRET` at construction time and throws if missing. The same fail-fast pattern must be applied to `JWT_REFRESH_SECRET` and to the service's call sites.

**Fix:** Validate and cache secrets in the `AuthService` constructor:

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
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET environment variable is not set');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
  }

  private signAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: (process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m') as JwtSignOptions['expiresIn'],
    });
  }

  private signRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: (process.env['JWT_REFRESH_EXPIRES_IN'] ?? '30d') as JwtSignOptions['expiresIn'],
    });
  }
}
```

---

## Warnings

### WR-01: Soft-deleted users can log in and refresh tokens

**File:** `apps/backend/src/auth/auth.service.ts:91-92` and `131-133`

**Issue:** `login` and `refresh` look up users by `id` without filtering `deleted_at: null`. A soft-deleted account can receive fresh tokens after deletion. `signup` and `validateUser` correctly apply the filter; the omission here is an inconsistency that becomes a privilege-escalation path once account deactivation is enforced.

**Fix:** Add `deleted_at: null` to both lookups:

```typescript
// login — line 91
const user = await this.prisma.user.findUnique({
  where: { id: userId, deleted_at: null },
});

// refresh — line 131
const user = await this.prisma.user.findUnique({
  where: { id: payload.sub, deleted_at: null },
});
```

(`findUnique` with a primary key (`id`) plus `deleted_at` is valid Prisma — the uniqueness is determined by `id` alone, and `deleted_at` acts as an additional filter.)

---

### WR-02: `updateProfile()` leaks a raw Prisma error when the user does not exist

**File:** `apps/backend/src/users/users.service.ts:59-69`

**Issue:** `updateProfile` calls `prisma.user.update({ where: { id } })` without first checking that the record exists. If the user ID is absent, Prisma throws `PrismaClientKnownRequestError` with code `P2025`. This is not a `DomainError` and is not caught by `DomainExceptionFilter`, causing NestJS to return a generic 500 response (or an unhandled exception log) instead of a clean 404. `findById()` in the same service already handles this correctly.

**Fix:**

```typescript
async updateProfile(id: string, dto: UpdateProfileDto): Promise<UpdatedUserProfile> {
  // Verifies existence and soft-delete in one call; throws UserNotFoundError if absent
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

### WR-03: Missing `MaxLength` on `SignupDto.password` — bcrypt CPU exhaustion possible

**File:** `apps/backend/src/auth/dto/signup.dto.ts:8-19`

**Issue:** `password` has `@MinLength(8)` but no `@MaxLength`. bcrypt silently truncates input at 72 bytes, so two passwords sharing the same first 72 characters hash identically (a correctness issue), and a malicious actor can send a multi-kilobyte password to force bcrypt to spend significant CPU time on each signup request — a denial-of-service amplifier that operates within the 5-request-per-minute rate limit.

**Fix:**

```typescript
@IsString()
@MinLength(8)
@MaxLength(128)
// ... existing @Matches decorators
password!: string;
```

---

### WR-04: `setAccessToken` in auth store does not update `isAuthenticated`

**File:** `apps/frontend/src/stores/auth-store.ts:32`

**Issue:** `setAccessToken` sets only `accessToken` without updating `isAuthenticated`. If a future code path calls `setAccessToken` independently (e.g., a partial token refresh), the store will hold a valid token but `isAuthenticated` will remain `false`, causing `PrivateRoute` to redirect to login.

**Fix:**

```typescript
setAccessToken: (token: string) =>
  set({ accessToken: token, isAuthenticated: true }),
```

Or remove `setAccessToken` entirely, since `setAuth` already handles the full atomic update and is what every current call site uses.

---

### WR-05: `setHydrating` in `App.tsx` `useEffect` dependency array but never called inside the effect

**File:** `apps/frontend/src/App.tsx:43`, `58`

**Issue:** `setHydrating` is destructured from the store and listed in the `useEffect` dependency array, but is never called inside the effect. Both `setAuth` and `clearAuth` already set `isHydrating: false` internally, so hydration state is managed correctly — but the stale dependency is misleading and will cause `react-hooks/exhaustive-deps` to emit a lint warning about an unused dependency.

**Fix:**

```typescript
const { setAuth, clearAuth } = useAuthStore(); // remove setHydrating

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
}, [setAuth, clearAuth]); // remove setHydrating from deps
```

---

## Info

### IN-01: Duplicate `clearCookie` options in `logout` — not reusing the shared constant

**File:** `apps/backend/src/auth/auth.controller.ts:77-82`

**Issue:** The `logout` handler calls `res.clearCookie` with inline options that duplicate `REFRESH_COOKIE_OPTIONS`. If `REFRESH_COOKIE_OPTIONS` is updated (e.g., `sameSite` changed), the `clearCookie` call must be updated separately or the cookie will not be cleared in the browser (mismatched attributes prevent cookie deletion).

**Fix:** Destructure the shared constant:

```typescript
res.clearCookie('refresh_token', {
  httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
  secure: REFRESH_COOKIE_OPTIONS.secure,
  sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
  path: REFRESH_COOKIE_OPTIONS.path,
});
```

---

### IN-02: `console.log` in production bootstrap

**File:** `apps/backend/src/main.ts:36`

**Issue:** `console.log` is used to print the server URL on startup. NestJS's built-in `Logger` should be used so output respects log levels in production environments.

**Fix:**

```typescript
import { Logger } from '@nestjs/common';
const logger = new Logger('Bootstrap');
logger.log(`Application is running on port ${port}`);
```

---

### IN-03: Forgot password link is a non-functional anchor

**File:** `apps/frontend/src/pages/login.tsx:108`

**Issue:** `<a href="#">Forgot password?</a>` scrolls to the top of the page on click and provides no functional behavior. Since the feature is not yet implemented, it should not present as a clickable link.

**Fix:** Replace with a visually styled but non-interactive element until the feature is built:

```tsx
<span className="text-sm text-muted-foreground">Forgot password?</span>
```

---

### IN-04: `SignupDto.name` is required but `User.name` is nullable in the schema

**File:** `apps/backend/src/auth/dto/signup.dto.ts:22-26` and `apps/backend/prisma/schema.prisma:17`

**Issue:** `SignupDto` marks `name` as required (`@IsNotEmpty()`), but the Prisma model defines `name String?` (nullable). The mismatch is not a bug today — the DTO enforces a name at signup while the nullable column allows future admin-created or OAuth-based accounts without a name. It is worth documenting so future code paths that create users without a name do not require a DTO change.

**Fix:** Add an inline comment on the DTO field clarifying the intent. No code change required now.

```typescript
// Required at signup; DB column is nullable to support future admin-created / OAuth accounts
@IsString()
@IsNotEmpty()
@MinLength(2)
@MaxLength(100)
name!: string;
```

---

_Reviewed: 2026-04-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
