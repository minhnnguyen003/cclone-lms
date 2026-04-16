# Phase 1: Project Scaffolding + DB Setup - Research

**Researched:** 2026-04-16
**Domain:** Monorepo tooling (pnpm workspaces + Turborepo), NestJS scaffolding, Prisma v7, Docker Compose, React+Vite+Tailwind v4, dev tooling (ESLint/Prettier/husky/lint-staged)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** pnpm workspaces monorepo — `apps/backend` (NestJS) + `apps/frontend` (React+Vite) + `packages/shared` (TypeScript types/interfaces shared across apps)
- **D-02:** Turborepo pipeline set up from the start with `turbo.json` defining `build`, `test`, and `lint` task pipelines for parallel execution and caching
- **D-03:** Shared config at repo root — `eslint.config.js`, `prettier.config.js`, `tsconfig.base.json` — each workspace extends with its own overrides
- **D-04:** Root-level husky with a single `.husky/` directory; `pre-commit` runs lint-staged across all changed files in any workspace
- **D-05:** Phase 1-2 essentials only: PostgreSQL 16, Redis 7, MinIO — ClickHouse and Kafka explicitly deferred to Phase 13
- **D-06:** No DB admin UI container — Prisma Studio (`npx prisma studio`) serves dev DB inspection
- **D-07:** MinIO configured with dev credentials (`minioadmin`/`minioadmin`) and a startup script that auto-creates the default bucket (`lms-files`)
- **D-08:** No mail container — email notifications are explicitly out of MVP scope
- **D-09:** Named volumes for all stateful services: `postgres_data`, `redis_data`, `minio_data`
- **D-10:** Health checks + `depends_on` with `condition: service_healthy` on all dependent services

### Claude's Discretion

- **DB schema in Phase 1:** Whether to include an empty migration only (prove Prisma connectivity) or scaffold the core User + Tenant tables. Lean toward scaffolding a minimal User model if it avoids backtracking.
- **Frontend entry point depth:** Whether to include React Router v7 routing shell with placeholder routes or just a Vite+React+Tailwind Hello World. Pragmatic call — enough to verify the stack works and unblock Phase 2 UI work.
- **Environment config pattern:** `.env.example` committed to git with all required variable names and sample values; `.env` gitignored.
- **Testing infrastructure:** Claude's call on whether to wire up Jest (backend) + Vitest (frontend) with a single example passing test each. Recommended: yes.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 1 establishes the entire development foundation for CClone LMS. The core challenge is not any single tool — each is well-documented individually — but getting the pnpm workspaces + Turborepo + NestJS (CommonJS) + React+Vite (ESM) combination to coexist cleanly, particularly around Prisma v7's new TypeScript-first client generation and path alias resolution at both build and runtime.

The most critical non-obvious issue is **Prisma v7's default ESM output**. NestJS 11 runs in CommonJS mode. Without `moduleFormat = "cjs"` in `schema.prisma`, the generated Prisma Client will fail to load in NestJS. This is the single most common Phase 1 failure when upgrading from Prisma 6 to v7.

The second critical area is **path alias resolution in NestJS**. TypeScript `paths` in `tsconfig.json` are compile-time only — at runtime (both `nest start --watch` via ts-jest/webpack and the compiled output), aliases must be actively resolved. The standard fix is `tsconfig-paths` registered as a Node.js require hook for dev, and `tsc-alias` as a post-compile step for production builds.

**Primary recommendation:** Scaffold in this order: (1) repo root + pnpm workspace + Turborepo, (2) Docker Compose + health checks, (3) NestJS app with Prisma + CJS fix + minimal User model migration, (4) React+Vite+Tailwind frontend, (5) shared `packages/shared` TypeScript package, (6) ESLint + Prettier + husky + lint-staged wired to Turborepo, (7) Jest (backend) + Vitest (frontend) smoke tests.

---

## Project Constraints (from CLAUDE.md)

| Directive | Detail |
|-----------|--------|
| Stack locked | NestJS ^11.1, React ^19.2, Vite ^8.0, TailwindCSS ^4.2, Prisma ^7.3, pnpm workspaces |
| Node version | ^22 LTS (NestJS 11 dropped Node 18 support) |
| TypeScript | `strict: true`, `noImplicitAny`, no `any` anywhere |
| No `// @ts-ignore` | Without written justification in the comment |
| Backend naming | camelCase vars/functions, PascalCase classes, kebab-case filenames |
| Path aliases | Use `@/` aliases in both backend and frontend |
| Import order | External libs, then `@/` internal, then relative — alphabetical within each group |
| Testing | Jest for backend (co-located `.spec.ts`), Vitest for frontend, e2e in `test/` |
| Database | UUID PKs, snake_case columns, soft deletes (`deleted_at`), `created_at`/`updated_at` everywhere |
| Prisma models | PascalCase model names, `@@map` to snake_case tables |
| Commits | Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) |
| Language | English only in all code, comments, commits, docs |
| Architecture | Solo dev — convention-over-configuration is a priority |

---

## Standard Stack

### Core — Build & Monorepo
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pnpm | 10.x (latest) | Package manager + workspaces | Strict dependency isolation, disk-efficient, workspace protocol. MUST be installed first via `npm install -g pnpm`. |
| turbo | 2.9.6 | Task orchestration + caching | Parallel builds, remote caching, dependency-aware task graph. Standard for pnpm monorepos. |

[VERIFIED: npm registry — turbo@2.9.6 is current latest]
[VERIFIED: npm registry — pnpm@10.33.0 is current latest; not installed on this machine — must be installed]

### Core — Backend
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @nestjs/cli | 11.0.21 | NestJS scaffolding | Official CLI — generates modules, controllers, services with correct decorator patterns |
| @nestjs/common | 11.1.19 | NestJS core | Core decorators, pipes, guards |
| @nestjs/config | 4.0.4 | Environment config | Type-safe env via ConfigService |
| @nestjs/swagger | 11.3.0 | API docs | Auto-generates OpenAPI from decorators |
| prisma | 7.7.0 | ORM + migrations | Schema-first, pure TypeScript client generation in v7 |
| @prisma/client | 7.7.0 | Generated DB client | Auto-generated from schema |
| tsconfig-paths | 4.2.0 | Runtime path alias resolution | Resolves `@/` aliases at runtime during `nest start` |
| tsc-alias | 1.8.16 | Build-time path alias resolution | Rewrites compiled JS output to real paths — needed for production `dist/` |

[VERIFIED: npm registry — @nestjs/common@11.1.19, @nestjs/cli@11.0.21, prisma@7.7.0]
[VERIFIED: npm registry — @nestjs/config@4.0.4, @nestjs/swagger@11.3.0]
[VERIFIED: npm registry — tsconfig-paths@4.2.0, tsc-alias@1.8.16]

### Core — Frontend
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.5 | UI library | Project-locked |
| react-dom | 19.2.5 | DOM rendering | Required peer |
| vite | 8.0.8 | Build tool | Project-locked |
| @vitejs/plugin-react | latest | React JSX transform | Official Vite React plugin |
| tailwindcss | 4.2.2 | Styling | Project-locked |
| @tailwindcss/vite | 4.2.2 | Vite integration | **Required in v4** — replaces PostCSS plugin |
| react-router | 7.14.1 | Routing | Project-locked |
| vitest | 4.1.4 | Test runner | Project-locked |
| @testing-library/react | 16.x | Component testing | Project-locked |

[VERIFIED: npm registry — react@19.2.5, vite@8.0.8, tailwindcss@4.2.2, react-router@7.14.1, vitest@4.1.4]

### Core — Testing (Backend)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | 30.3.0 | Test runner | Project-locked for backend |
| @nestjs/testing | 11.x | NestJS test utilities | DI-based unit/integration tests |
| supertest | 7.x | E2E HTTP testing | Standard NestJS e2e |

[VERIFIED: npm registry — jest@30.3.0]

### Dev Tooling
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| husky | 9.1.7 | Git hooks | Pre-commit linting |
| lint-staged | 16.4.0 | Staged file linting | Only lints changed files |
| eslint | 9.x | Linting | Flat config (eslint.config.js) |
| prettier | 3.x | Formatting | Code style consistency |
| @types/node | 25.6.0 | Node typings | TypeScript support |

[VERIFIED: npm registry — husky@9.1.7, lint-staged@16.4.0, @types/node@25.6.0]

**Installation (from repo root):**
```bash
# Install pnpm first (not on this machine)
npm install -g pnpm

# Init workspace
pnpm init
pnpm add -Dw turbo husky lint-staged

# Backend
cd apps/backend && pnpm add @nestjs/cli @nestjs/common @nestjs/core @nestjs/config @nestjs/platform-express
pnpm add prisma @prisma/client
pnpm add -D tsconfig-paths tsc-alias jest @nestjs/testing supertest

# Frontend
cd apps/frontend && pnpm create vite . --template react-ts
pnpm add tailwindcss @tailwindcss/vite react-router
pnpm add -D vitest @testing-library/react
```

---

## Architecture Patterns

### Recommended Project Structure
```
/ (repo root)
├── apps/
│   ├── backend/             # NestJS app
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   ├── app.service.ts
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.service.ts
│   │   │   │   └── prisma.module.ts
│   │   │   └── common/      # Guards, filters, interceptors, decorators
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── test/            # e2e tests
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json    # extends ../../tsconfig.base.json
│   │   └── tsconfig.build.json
│   └── frontend/            # React + Vite app
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── index.css    # @import "tailwindcss";
│       │   └── routes/      # React Router routes (placeholder)
│       ├── vite.config.ts
│       ├── index.html
│       └── tsconfig.json    # extends ../../tsconfig.base.json
├── packages/
│   └── shared/              # Shared TypeScript types
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── docker-compose.override.yml  # Optional: dev overrides
├── .env                     # gitignored
├── .env.example             # committed
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json       # Root shared TypeScript config
├── eslint.config.js         # Root ESLint flat config
├── prettier.config.js
├── package.json             # Root package.json with turbo scripts
└── .husky/
    └── pre-commit
```

### Pattern 1: pnpm-workspace.yaml
**What:** Declares all workspace packages to pnpm
**When to use:** Required at repo root for monorepo to function

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

[CITED: https://pnpm.io/workspaces]

### Pattern 2: turbo.json Task Pipeline
**What:** Defines how Turborepo orchestrates tasks across workspaces
**When to use:** Enables parallel build + caching; `dev` must be `cache: false` + `persistent: true`

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

[CITED: https://turborepo.dev/docs/reference/configuration]
[VERIFIED: Turborepo 2.9.6 uses `tasks` key (not `pipeline` which was v1)]

### Pattern 3: Prisma v7 schema.prisma — CRITICAL CJS FIX
**What:** Prisma v7 generates ESM by default; NestJS requires CJS
**When to use:** ALWAYS when using Prisma v7 with NestJS

```prisma
// apps/backend/prisma/schema.prisma
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
  moduleFormat    = "cjs"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

[VERIFIED: Multiple 2025-2026 sources confirm moduleFormat = "cjs" is REQUIRED for NestJS + Prisma v7]
[CITED: https://www.prisma.io/docs/orm/prisma-schema/overview/generators]

### Pattern 4: PrismaService + PrismaModule
**What:** Standard NestJS integration pattern for Prisma
**When to use:** Always — provides DI-managed Prisma connection

```typescript
// apps/backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

```typescript
// apps/backend/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

[CITED: https://docs.nestjs.com/recipes/prisma — pattern confirmed]
[VERIFIED: @Global() decorator pattern confirmed for Phase 1 global availability]

### Pattern 5: Path Aliases in NestJS — tsconfig + runtime fix
**What:** `@/` aliases must work at compile time (tsc) AND runtime (`nest start`)
**When to use:** Required — CLAUDE.md mandates `@/` aliases

```json
// tsconfig.base.json (repo root)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "module": "commonjs",
    "target": "ES2022",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

```json
// apps/backend/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    },
    "outDir": "./dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

```json
// apps/backend/nest-cli.json — REQUIRED for tsc-alias to run post-build
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": [],
    "assets": [],
    "deleteOutDir": true
  }
}
```

Runtime dev fix (add to `main.ts` bootstrap before all imports, or use `tsconfig-paths/register`):
```typescript
// apps/backend/src/main.ts
// tsconfig-paths must be registered at process startup
// Add to package.json scripts: "start:dev": "nest start --watch -r tsconfig-paths/register"
```

Production build fix — add `tsc-alias` post-compile:
```json
// apps/backend/package.json scripts
{
  "build": "nest build && tsc-alias -p tsconfig.json",
  "start:dev": "nest start --watch"
}
```

[CITED: https://dev.to/rubiin/resolving-path-alias-in-nestjs-projects-11o1]
[VERIFIED: tsconfig-paths@4.2.0 and tsc-alias@1.8.16 are current]

**Frontend path aliases (Vite handles natively):**
```typescript
// apps/frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

[CITED: https://tailwindcss.com/docs — @tailwindcss/vite is the v4 way, no PostCSS needed]

### Pattern 6: TailwindCSS v4 Setup
**What:** v4 uses CSS-first config, no `tailwind.config.js`, no PostCSS
**When to use:** Required — breaks if you use v3 patterns

```css
/* apps/frontend/src/index.css */
@import "tailwindcss";
```

That's it — no `content` array, no PostCSS config, no `tailwind.config.js`.
[VERIFIED: tailwindcss@4.2.2, @tailwindcss/vite is the required plugin for Vite projects]

### Pattern 7: Docker Compose with health checks
**What:** Services declare readiness; dependent services wait for `service_healthy`
**When to use:** D-10 requirement — prevents startup race conditions

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-lms}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-lms_dev}
      POSTGRES_DB: ${POSTGRES_DB:-lms}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-lms} -d ${POSTGRES_DB:-lms}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7-alpine
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    ports:
      - "${MINIO_PORT:-9000}:9000"
      - "${MINIO_CONSOLE_PORT:-9001}:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      # curl was REMOVED from recent MinIO images — use TCP check instead
      test: ["CMD-SHELL", "timeout 5s bash -c ':> /dev/tcp/127.0.0.1/9000' || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 20s

  minio-init:
    image: minio/mc:latest
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      mc alias set myminio http://minio:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin};
      mc mb --ignore-existing myminio/${MINIO_BUCKET:-lms-files};
      exit 0;
      "

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

[VERIFIED: MinIO curl removal confirmed — github.com/minio/minio/issues/18371 and /18389]
[VERIFIED: pg_isready for PostgreSQL, redis-cli ping for Redis — current standard]
[CITED: https://docs.docker.com/compose/how-tos/startup-order/]

### Anti-Patterns to Avoid

- **Using `turbo run dev --parallel` directly** — Turborepo 2 handles parallelism internally via task graph; don't override with `--parallel` for dev tasks. Use `persistent: true` and run `turbo dev` from root.
- **Putting Prisma schema in `packages/shared`** — Prisma client generation is tightly coupled to the app that uses it. Keep `prisma/` inside `apps/backend`. Share only the generated TypeScript types via `packages/shared` if needed.
- **Using `@prisma/client` import path directly** — With `output` specified in the generator, import from the output path (`../generated/prisma`), not from `@prisma/client`. The two are different with a custom output path.
- **Using `tailwindcss init`** — v4 no longer has a `tailwind.config.js`. Running `npx tailwindcss init` will fail or generate a v3-style config that breaks v4.
- **Omitting `moduleFormat = "cjs"` in schema.prisma** — This is the single most common Phase 1 failure with Prisma v7 + NestJS. The Prisma client will generate ESM and NestJS will crash on import.
- **Using pnpm `shamefully-hoist`** — Defeats the purpose of pnpm's strict isolation; leads to hidden peer dependency issues. Don't add this unless explicitly debugging a third-party package issue.
- **Turborepo v1 `pipeline` key** — turbo.json in v2 uses `tasks`, not `pipeline`. Using the old key will cause silently ignored configuration.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Monorepo task orchestration | Custom shell scripts | Turborepo | Caching, dependency graph, parallel execution |
| Runtime path alias resolution | Manual module alias | tsconfig-paths + tsc-alias | Node module resolution is complex; these handle all edge cases |
| MinIO bucket creation | Custom Node.js init script | `minio/mc` init container | mc handles auth, retries, idempotency out of the box |
| Docker startup ordering | `sleep` hacks in entrypoints | `depends_on: condition: service_healthy` | Sleep is non-deterministic; health checks are authoritative |
| Prisma connection management | Custom pg pool | PrismaService extending PrismaClient | Prisma manages connection pooling, retry logic, and lifecycle |
| Environment variable validation | Custom parsing | `@nestjs/config` with Joi/Zod schema | Type-safe env with validation at startup, not at first use |

**Key insight:** Every tool in this phase is purpose-built for exactly one sharp problem. The value is in composing them correctly, not in building alternatives.

---

## Common Pitfalls

### Pitfall 1: Prisma v7 ESM/CJS mismatch with NestJS
**What goes wrong:** NestJS starts then crashes with `SyntaxError: Cannot use import statement in a module` or `ERR_REQUIRE_ESM` when importing the Prisma client.
**Why it happens:** Prisma v7 changed the default generator to emit ESM. NestJS compiles to CommonJS by default (tsconfig `"module": "commonjs"`).
**How to avoid:** Add `moduleFormat = "cjs"` to the generator block in `schema.prisma` BEFORE running `prisma generate`.
**Warning signs:** Any `import` statement appearing in generated `.js` files in the Prisma output directory.

[VERIFIED: Multiple 2025-2026 sources including github.com/prisma/prisma/discussions/29146 and DEV.to guides]

### Pitfall 2: MinIO health check with curl fails
**What goes wrong:** `docker-compose up` reports MinIO container as unhealthy, minio-init never starts, bucket not created.
**Why it happens:** Recent MinIO Docker images removed `curl` from the image. Health check examples in MinIO's own docs still reference curl.
**How to avoid:** Use the TCP check: `timeout 5s bash -c ':> /dev/tcp/127.0.0.1/9000' || exit 1`
**Warning signs:** `docker inspect <minio-container>` shows `Status: unhealthy` with `curl: command not found` in logs.

[VERIFIED: github.com/minio/minio/issues/18389 and /18371 confirm curl removal]

### Pitfall 3: Path aliases break at runtime in NestJS
**What goes wrong:** `nest start` runs fine in dev but `node dist/main.js` throws `Cannot find module '@/common/...'`
**Why it happens:** TypeScript's `paths` only affect type-checking. The compiled `.js` files still contain the `@/` strings. Without runtime resolution, Node.js cannot find the modules.
**How to avoid:** (a) In dev: use `tsconfig-paths/register` — `nest start --watch` with `NODE_OPTIONS='-r tsconfig-paths/register'`. (b) In production: run `tsc-alias -p tsconfig.json` after `tsc`/`nest build`.
**Warning signs:** Works in dev (`ts-node`), breaks in prod (`node dist/`).

[CITED: https://dev.to/rubiin/resolving-path-alias-in-nestjs-projects-11o1]

### Pitfall 4: Turborepo v1 vs v2 config key mismatch
**What goes wrong:** Turborepo silently ignores tasks; caching never works; tasks run sequentially instead of in parallel.
**Why it happens:** turbo.json v2 uses `tasks` key. v1 used `pipeline`. If you copy examples from pre-2024 tutorials, you'll use the wrong key.
**How to avoid:** Always use `tasks` (not `pipeline`) in turbo.json. The `$schema` URL `"https://turborepo.com/schema.json"` helps IDEs validate.
**Warning signs:** `turbo run build` output shows no dependency graph, no cache hits.

[VERIFIED: turbo@2.9.6 confirmed — v2 schema uses `tasks`]

### Pitfall 5: TailwindCSS v4 + PostCSS confusion
**What goes wrong:** Styles don't apply; `npx tailwindcss init` fails; `content` array config in non-existent `tailwind.config.js` is ignored.
**Why it happens:** v4 is fundamentally different from v3 — CSS-first config, Vite plugin replaces PostCSS, no content array needed, no `tailwind.config.js`.
**How to avoid:** In Vite: add `@tailwindcss/vite` to `vite.config.ts` plugins. In CSS: `@import "tailwindcss";`. Nothing else needed.
**Warning signs:** Any reference to `tailwind.config.js`, `@tailwindcss/postcss`, or `content: []` in new v4 projects.

[VERIFIED: tailwindcss@4.2.2, @tailwindcss/vite — official Tailwind docs confirm CSS-first approach]

### Pitfall 6: pnpm not installed (this machine)
**What goes wrong:** All `pnpm` commands fail with "command not found".
**Why it happens:** pnpm is not installed globally on this development machine (confirmed by environment check).
**How to avoid:** First task in Phase 1 must install pnpm: `npm install -g pnpm` — then verify with `pnpm --version`.
**Warning signs:** Current environment check confirmed `pnpm: NOT FOUND`.

[VERIFIED: Environment probe confirmed pnpm not available]

### Pitfall 7: Shared `packages/shared` ESM/CJS split
**What goes wrong:** `packages/shared` types fail to import in the NestJS backend with module resolution errors.
**Why it happens:** React+Vite (ESM) and NestJS (CJS) have different module expectations. If `packages/shared` is compiled as pure ESM, NestJS won't load it.
**How to avoid:** Configure `packages/shared` to output both CJS and ESM (dual build) or CJS only since types-only packages don't need runtime. For Phase 1, types-only `packages/shared` with `"module": "commonjs"` in its tsconfig works fine.
**Warning signs:** `ERR_REQUIRE_ESM` when importing from `@lms/shared` in the backend.

[ASSUMED — based on standard ESM/CJS split knowledge; verify if issues arise]

---

## Code Examples

### .env.example (Phase 1 services)
```bash
# Database
DATABASE_URL="postgresql://lms:lms_dev@localhost:5432/lms"
POSTGRES_USER=lms
POSTGRES_PASSWORD=lms_dev
POSTGRES_DB=lms
POSTGRES_PORT=5432

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=lms-files
MINIO_CONSOLE_PORT=9001

# App
NODE_ENV=development
PORT=3000
```

### Minimal User model (Claude's discretion: scaffold now, unblocks Phase 2)
```prisma
// Recommended: minimal User + Tenant to unblock Phase 2 auth work
model User {
  id         String    @id @default(uuid()) @db.Uuid
  email      String    @unique
  password   String
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  @@map("users")
}
```

[ASSUMED — specific schema content; the broader pattern (UUID PK, snake_case, soft delete) is from CLAUDE.md which is locked]

### React Router v7 minimal routing shell (Claude's discretion: yes, include it)
```tsx
// apps/frontend/src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    element: <div className="p-4 text-lg font-semibold">CClone LMS — Phase 1 OK</div>,
  },
]);

export const App = () => <RouterProvider router={router} />;
```

[CITED: react-router@7.14.1 — createBrowserRouter is the v6+ standard API]

### husky + lint-staged root config
```bash
# .husky/pre-commit (created by husky init)
npx lint-staged
```

```json
// package.json (root) — lint-staged config
{
  "lint-staged": {
    "apps/backend/**/*.{ts,json}": ["eslint --fix", "prettier --write"],
    "apps/frontend/**/*.{ts,tsx,json,css}": ["eslint --fix", "prettier --write"],
    "packages/**/*.{ts,json}": ["eslint --fix", "prettier --write"]
  }
}
```

[VERIFIED: husky@9.1.7, lint-staged@16.4.0 — husky v9 uses `.husky/` directory]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` + PostCSS | `@import "tailwindcss"` CSS-first + `@tailwindcss/vite` | TailwindCSS v4 (Jan 2025) | No config file, no content array, 100x faster incremental builds |
| `turbo.json` with `pipeline:` key | `turbo.json` with `tasks:` key | Turborepo v2 (2024) | Old examples on the internet are wrong; v1 config silently ignored |
| `prisma-client-js` generator | `prisma-client` generator (pure TypeScript) | Prisma v7 (Nov 2024) | Requires `moduleFormat = "cjs"` for NestJS; no Rust engine dependency |
| `@prisma/client` default import | Custom `output` path import | Prisma v7 pnpm monorepos | In monorepos with custom output, import from output path directly |
| `@nestjs/mapped-types` + class-validator only | CASL + class-validator | Ongoing | CASL handles resource-level permissions that class-validator cannot |
| `nest new my-app` single-app | pnpm workspaces + Turborepo | 2024+ best practice | Enables shared types; scales to frontend + backend in same repo |

**Deprecated/outdated:**
- `KafkaJS`: Unmaintained since Feb 2023 — use `@confluentinc/kafka-javascript` (Phase 13)
- `tailwind.config.js`: Not used in v4
- `turbo.json pipeline:` key: v1 syntax, broken in v2

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `packages/shared` types-only CJS works for both backend and frontend in Phase 1 | Pitfall 7 | Frontend (Vite/ESM) may fail to import from CJS package — would need dual build or types-only export |
| A2 | Minimal User model migration in Phase 1 unblocks Phase 2 without significant rework | Code Examples | If Phase 2 auth needs Tenant model first, will need to add migration before auth work starts |

---

## Open Questions

1. **Turborepo dev task for NestJS hot reload vs Vite HMR**
   - What we know: `turbo dev` with `persistent: true` runs both simultaneously
   - What's unclear: Whether `nest start --watch` and `vite` both stream logs cleanly through turbo's output
   - Recommendation: Use `turbo dev` from root; both apps declare `dev` scripts; accept that log output may interleave

2. **pnpm `public-hoist-pattern` for NestJS decorators**
   - What we know: NestJS relies on decorator metadata which requires reflect-metadata to be available; pnpm's strict isolation can sometimes surface this
   - What's unclear: Whether pnpm@10 requires `.npmrc` `public-hoist-pattern[]=*` for NestJS to work correctly
   - Recommendation: Start without it; add `public-hoist-pattern[]=*` to `.npmrc` only if `reflect-metadata` errors appear during `nest start`

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All JavaScript | YES | v22.21.1 | — |
| Docker | docker-compose services | YES | 29.1.3 | — |
| Docker Compose | Services orchestration | YES | v5.0.0-desktop.1 | — |
| Git | husky hooks, commits | YES | 2.50.0 | — |
| pnpm | Workspace package manager | NO | — | Install: `npm install -g pnpm` |
| npm | pnpm install, fallback | YES | ships with Node 22 | Used to install pnpm |

**Missing dependencies with no fallback:**
- pnpm — BLOCKING. First task must install it: `npm install -g pnpm`

**Missing dependencies with fallback:**
- None

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework (backend) | Jest 30.3.0 |
| Framework (frontend) | Vitest 4.1.4 |
| Config file (backend) | `apps/backend/jest.config.ts` (Wave 0 gap) |
| Config file (frontend) | `apps/frontend/vitest.config.ts` (Wave 0 gap) |
| Quick run (backend) | `pnpm --filter backend test` |
| Quick run (frontend) | `pnpm --filter frontend test` |
| Full suite | `turbo run test` |

### Phase Requirements → Test Map

This phase has no functional requirements (infrastructure only). Testing goal: confirm tooling wires up correctly.

| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| INF-01 | NestJS app boots without errors | smoke | `pnpm --filter backend start:dev` (manual verify) | Wave 0 |
| INF-02 | Prisma connects to PostgreSQL | smoke | `pnpm --filter backend prisma migrate deploy` | Wave 0 |
| INF-03 | AppController returns 200 | unit | `pnpm --filter backend test -- app.controller.spec.ts` | Wave 0 |
| INF-04 | Frontend renders without errors | smoke | `pnpm --filter frontend test` | Wave 0 |
| INF-05 | Path alias `@/` resolves in backend | unit | Included in AppController test | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter {changed-app} test --run`
- **Per wave merge:** `turbo run test`
- **Phase gate:** Both `turbo run test` and `turbo run build` green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/backend/src/app.controller.spec.ts` — smoke test for bootstrap
- [ ] `apps/backend/jest.config.ts` — Jest configuration with tsconfig-paths
- [ ] `apps/frontend/src/App.test.tsx` — smoke test for React render
- [ ] `apps/frontend/vitest.config.ts` — Vitest configuration

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Not in Phase 1 — deferred to Phase 2 |
| V3 Session Management | No | Not in Phase 1 |
| V4 Access Control | No | Not in Phase 1 |
| V5 Input Validation | No | No user inputs in Phase 1 (infrastructure only) |
| V6 Cryptography | No | No crypto operations in Phase 1 |
| V7 Error Handling | Partial | NestJS global exception filter template should be wired — avoids stack traces leaking in later phases |
| V9 Communication | Partial | HTTPS termination is infrastructure concern; dev is HTTP; note for future |

### Known Threat Patterns for Infrastructure Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Dev credentials in git | Information Disclosure | `.env` gitignored; `.env.example` has placeholder values only |
| Docker services exposed on 0.0.0.0 | Elevation of Privilege | Dev-only; document that prod deployments must bind to 127.0.0.1 |
| Prisma Studio open on all interfaces | Information Disclosure | `prisma studio` is dev-only CLI tool; not in docker-compose |

**Phase 1 security posture:** Infrastructure phase — no sensitive data processed, no auth endpoints. Primary concern is not committing real credentials. The `.env`/`.env.example` pattern (D-04 area from CLAUDE.md) is the only active security control needed here.

---

## Sources

### Primary (HIGH confidence)
- npm registry (verified via `npm view`) — all package versions in Standard Stack table
- [Turborepo configuration reference](https://turborepo.dev/docs/reference/configuration) — `tasks` key, `cache`, `persistent`, `outputs`
- [Prisma pnpm workspaces guide](https://www.prisma.io/docs/guides/use-prisma-in-pnpm-workspaces) — custom output, version pinning
- [TailwindCSS v4 Vite installation](https://tailwindcss.com/docs) — @tailwindcss/vite, CSS-first config
- [Docker Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/) — `condition: service_healthy`

### Secondary (MEDIUM confidence)
- [MinIO curl removal issues](https://github.com/minio/minio/issues/18389) — TCP health check workaround
- [Prisma v7 NestJS compatibility discussion](https://github.com/prisma/prisma/discussions/29146) — confirmed working with NestJS 11
- [NestJS path alias resolution](https://dev.to/rubiin/resolving-path-alias-in-nestjs-projects-11o1) — tsconfig-paths + tsc-alias pattern
- [DEV.to: Prisma v7 NestJS MySQL setup](https://medium.com/@msmiraj8/get-started-with-prisma-7-with-nest-js-mysql-3919eaa7c760) — moduleFormat cjs confirmed
- Environment probe (bash commands) — pnpm NOT installed, Node 22.21.1, Docker 29.1.3, Docker Compose v5.0.0

### Tertiary (LOW confidence)
- [NestJS + React 19 + Turborepo ADR](https://dev.to/xiunotes/2025-nestjs-react-19-drizzle-orm-turborepo-architecture-decision-record-3o1k) — general structure patterns (uses Drizzle not Prisma, but Turborepo patterns apply)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry on 2026-04-16
- Architecture: HIGH — patterns verified against official docs (Turborepo, Prisma, Tailwind)
- Pitfalls: HIGH — MinIO curl removal and Prisma v7 CJS issues verified via GitHub issues; path alias issues verified via npm package docs
- Docker Compose: HIGH — health check patterns verified against official Docker docs

**Research date:** 2026-04-16
**Valid until:** 2026-07-16 (90 days — stack is stable; Prisma and Turborepo move fast but breaking changes are well-documented)
