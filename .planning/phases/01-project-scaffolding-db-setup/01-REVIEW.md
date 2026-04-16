---
phase: 01-project-scaffolding-db-setup
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 38
files_reviewed_list:
  - .env.example
  - .gitignore
  - .husky/pre-commit
  - .npmrc
  - apps/backend/jest.config.ts
  - apps/backend/nest-cli.json
  - apps/backend/package.json
  - apps/backend/prisma.config.ts
  - apps/backend/prisma/schema.prisma
  - apps/backend/src/app.controller.spec.ts
  - apps/backend/src/app.controller.ts
  - apps/backend/src/app.module.ts
  - apps/backend/src/app.service.ts
  - apps/backend/src/main.ts
  - apps/backend/src/prisma/prisma.module.ts
  - apps/backend/src/prisma/prisma.service.ts
  - apps/backend/tsconfig.build.json
  - apps/backend/tsconfig.json
  - apps/frontend/index.html
  - apps/frontend/package.json
  - apps/frontend/src/App.test.tsx
  - apps/frontend/src/App.tsx
  - apps/frontend/src/index.css
  - apps/frontend/src/main.tsx
  - apps/frontend/src/vite-env.d.ts
  - apps/frontend/tsconfig.app.json
  - apps/frontend/tsconfig.json
  - apps/frontend/tsconfig.node.json
  - apps/frontend/vite.config.ts
  - apps/frontend/vitest.config.ts
  - docker-compose.yml
  - eslint.config.mjs
  - package.json
  - packages/shared/package.json
  - packages/shared/src/index.ts
  - packages/shared/tsconfig.json
  - pnpm-workspace.yaml
  - prettier.config.js
  - tsconfig.base.json
  - turbo.json
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 38
**Status:** issues_found

## Summary

This is the initial project scaffolding phase covering the monorepo setup (Turborepo + pnpm), NestJS backend skeleton, React + Vite frontend skeleton, Prisma schema, Docker Compose dev environment, and shared types package. The overall structure is well-organized and follows the conventions laid out in CLAUDE.md. No critical security vulnerabilities were found.

Five warnings require attention before this phase is considered complete: an unhandled bootstrap rejection, a potentially `undefined` database URL being passed unchecked to Prisma config, a fragile relative `envFilePath` in the app module, a broken `@lms/shared` package entry point, and a non-pinned `minio:latest` Docker image. Four informational items round out the review.

## Warnings

### WR-01: Unhandled promise rejection in bootstrap

**File:** `apps/backend/src/main.ts:11`
**Issue:** `bootstrap()` is called without `.catch()`. If `NestFactory.create()` or `app.listen()` rejects (e.g., port in use, DB config error on startup), the rejection is unhandled. In Node.js, unhandled promise rejections can terminate the process with no diagnostic output depending on the Node version and `--unhandled-rejections` flag setting.
**Fix:**
```typescript
bootstrap().catch((err: unknown) => {
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});
```

### WR-02: DATABASE_URL may be undefined at Prisma config time

**File:** `apps/backend/prisma.config.ts:10`
**Issue:** `process.env['DATABASE_URL']` resolves to `string | undefined`. Passing `undefined` directly to `datasource.url` is accepted by TypeScript only if the Prisma `defineConfig` type allows it, but at runtime Prisma will throw a cryptic error rather than a clear misconfiguration message. There is no guard or early-exit when the variable is absent.
**Fix:**
```typescript
const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
```

### WR-03: Hardcoded relative envFilePath breaks non-CWD invocations

**File:** `apps/backend/src/app.module.ts:10`
**Issue:** `envFilePath: '../../.env'` is resolved relative to the process working directory at runtime, not relative to the file. When the app is started from the monorepo root via Turbo (`turbo dev`), the CWD is the backend package directory and the path resolves correctly. However, if the compiled binary in `dist/` is run directly (e.g., `node dist/main` from the repo root, or inside a Docker container where `WORKDIR` differs), the path resolves incorrectly and no env vars are loaded — without any warning because `ConfigModule` silently ignores a missing file by default.
**Fix:** Use `path.resolve(__dirname, '../../.env')` for an absolute path, or remove `envFilePath` entirely and rely on Docker/process-level env injection (the recommended production approach):
```typescript
ConfigModule.forRoot({
  isGlobal: true,
  // Remove envFilePath — inject env vars at the process level in production.
  // For local dev, the .env file is loaded by dotenv in prisma.config.ts already.
}),
```
If local dev still needs file-based loading, use:
```typescript
import { resolve } from 'path';
// ...
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: resolve(__dirname, '../../.env'),
}),
```

### WR-04: @lms/shared package entry point points to raw TypeScript source

**File:** `packages/shared/package.json:5-6`
**Issue:** Both `main` and `types` fields reference `./src/index.ts` — raw TypeScript. This works when consumers use `ts-node` or have TypeScript source resolution configured, but fails after `pnpm build` when a consumer imports the compiled output from `dist/`. Any package that imports `@lms/shared` post-build will receive a `.ts` file from the `main` field, which Node.js cannot execute directly.
**Fix:** Add a `exports` field that covers both development (source) and production (compiled) paths, or point `main`/`types` to the compiled output and ensure `build` runs first:
```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```
The Turborepo `build` task already declares `^build` dependencies, so dependents will build `@lms/shared` first — the compiled output just needs to be what the entry points resolve to.

### WR-05: Non-pinned minio:latest Docker image tag

**File:** `docker-compose.yml:33`
**Issue:** `image: minio/minio:latest` resolves to a different image on each `docker compose pull`, making local dev environments non-deterministic. All other services use pinned minor versions (`postgres:16-alpine`, `redis:7-alpine`). A breaking MinIO API change could silently break the dev environment.
**Fix:** Pin to a specific MinIO release tag:
```yaml
image: minio/minio:RELEASE.2024-11-07T00-52-20Z
```
(Use the latest stable release tag from https://github.com/minio/minio/releases.)

## Info

### IN-01: tsconfig.base.json sets module:commonjs but frontend needs ESNext

**File:** `tsconfig.base.json:6`
**Issue:** The root `tsconfig.base.json` sets `"module": "commonjs"`, which is correct for the NestJS backend. The frontend overrides this with `"module": "ESNext"` in `tsconfig.app.json`, so there is no functional breakage. However, having a CJS-biased base that is silently overridden by all ESM consumers is a maintenance hazard — future packages or configs that extend the base and forget to override will unexpectedly get CJS module output.
**Fix:** Either set `"module": "ESNext"` in the base and let the backend override to `"commonjs"`, or document the intentional CJS default with a comment in the base file. The backend already sets `"emitDecoratorMetadata": true` and other NestJS-specific options in its own `tsconfig.json`, so it can own `"module": "commonjs"` there:
```json
// tsconfig.base.json — remove "module" and let each app set it
// backend/tsconfig.json — add "module": "commonjs"
```

### IN-02: vitest.config.ts globals:true inconsistent with explicit imports in test

**File:** `apps/frontend/vitest.config.ts:8` / `apps/frontend/src/App.test.tsx:2`
**Issue:** `globals: true` injects `describe`, `it`, `expect` etc. as globals, but `App.test.tsx` explicitly imports them from `vitest`. This is harmless (explicit imports take precedence) but creates inconsistency — future tests may use globals while others use explicit imports, leading to mixed style across the test suite.
**Fix:** Choose one style. Explicit imports are preferable for clarity and IDE support:
```typescript
// vitest.config.ts
test: {
  globals: false, // or remove the line — false is the default
  // ...
}
```
Or, if globals are desired, remove the explicit imports from test files.

### IN-03: console.log left in production bootstrap path

**File:** `apps/backend/src/main.ts:8`
**Issue:** `console.log(`Application is running on: http://localhost:${port}`)` is a bare `console.log` in production code. Per CLAUDE.md conventions, no `console.log` should remain in committed code.
**Fix:** Use NestJS's built-in logger for startup messages:
```typescript
import { Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
}
```

### IN-04: Prisma schema datasource block missing url directive

**File:** `apps/backend/prisma/schema.prisma:7-9`
**Issue:** The `datasource db` block has no `url` field — it relies entirely on `prisma.config.ts` (Prisma 7's programmatic config). This is valid for Prisma 7 CLI operations but means `prisma studio`, IDE language server plugins, and any third-party tooling that parses the schema directly will lack database connection information and may fail or show misleading errors.
**Fix:** Add the `url` directive pointing to the environment variable for broad tooling compatibility:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
The `prisma.config.ts` `datasource.url` override will still take precedence for CLI operations when the config file is present.

---

_Reviewed: 2026-04-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
