---
phase: 01-project-scaffolding-db-setup
plan: 03
subsystem: tooling
tags: [eslint, prettier, husky, lint-staged, jest, vitest, testing, linting]
dependency_graph:
  requires:
    - 01-02 (NestJS backend with @/ path aliases, React frontend with App component)
  provides:
    - ESLint flat config (eslint.config.mjs) enforcing no-any rule across all workspaces
    - Prettier config (prettier.config.js) with consistent formatting rules
    - husky pre-commit hook running lint-staged on staged files
    - Jest config for backend with @/ moduleNameMapper and ts-jest transform
    - Vitest config for frontend with jsdom environment and @/ alias
    - Passing smoke tests in both backend (Jest) and frontend (Vitest)
  affects:
    - All future plans benefit from linting and test infrastructure from the start
    - Phase 2 plans can add tests immediately without test infrastructure setup
tech_stack:
  added:
    - eslint 10.2.0 (flat config format, eslint.config.mjs)
    - typescript-eslint 8.58.2 (TypeScript ESLint rules)
    - eslint-config-prettier 10.1.8 (disables ESLint formatting rules that conflict with Prettier)
    - prettier 3.8.3 (code formatting)
    - husky 9.1.7 (git hooks)
    - lint-staged 16.4.0 (run linting only on staged files)
    - jest (backend test runner via ts-jest)
    - ts-jest (TypeScript transform for Jest)
    - @types/jest (Jest type definitions)
    - @testing-library/jest-dom (DOM matchers for frontend)
    - jsdom (browser-like environment for Vitest)
    - eslint-plugin-react-hooks (React hooks linting rules)
    - eslint-plugin-react-refresh (React Fast Refresh linting)
  patterns:
    - ESLint flat config (eslint.config.mjs) — ESM module, root-level, applies to all workspaces
    - lint-staged configured in root package.json with workspace glob patterns
    - husky pre-commit runs npx lint-staged (not pnpm test — keeps commits fast)
    - Jest moduleNameMapper maps @/* to <rootDir>/* for NestJS path alias resolution
    - Vitest resolve.alias maps @ to ./src for React path alias resolution
    - Smoke tests co-located with source (app.controller.spec.ts) per CLAUDE.md
key_files:
  created:
    - eslint.config.mjs
    - prettier.config.js
    - .husky/pre-commit
    - apps/backend/jest.config.ts
    - apps/backend/src/app.controller.spec.ts
    - apps/frontend/vitest.config.ts
    - apps/frontend/src/App.test.tsx
  modified:
    - package.json (added lint-staged config, husky prepare script)
    - apps/backend/package.json (added jest, ts-jest, @types/jest devDependencies)
    - apps/frontend/package.json (added @testing-library/jest-dom, jsdom, react-eslint plugins)
    - apps/frontend/tsconfig.app.json (added DOM lib — bug fix)
    - apps/backend/src/prisma/prisma.service.ts (fixed import path — bug fix)
    - .gitignore (added *.tsbuildinfo pattern)
    - pnpm-lock.yaml (updated with all new dependencies)
decisions:
  - "Used eslint.config.mjs (ESM) not eslint.config.js (CJS) because root package.json has no type:module"
  - "Prisma client import changed from ../generated/prisma to ../generated/prisma/client — Prisma v7.7 generates client.ts not index.ts"
  - "Frontend tsconfig.app.json overrides base lib to include DOM and DOM.Iterable — base tsconfig.base.json is backend-oriented (node only)"
  - "Added *.tsbuildinfo to .gitignore — TypeScript incremental build cache is a runtime artifact"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 7
  files_modified: 8
---

# Phase 01 Plan 03: Dev Tooling — ESLint, Prettier, Husky, and Test Runners Summary

**One-liner:** ESLint flat config with typescript-eslint no-any rule, Prettier formatting, husky pre-commit hook via lint-staged, Jest (backend) and Vitest (frontend) with passing smoke tests — `turbo run test` and `turbo run build` both green.

## What Was Built

**Task 1 — ESLint, Prettier, husky, lint-staged:**
Created `eslint.config.mjs` at repo root using ESLint's flat config format. The config extends `typescript-eslint.configs.recommended` and enforces `@typescript-eslint/no-explicit-any: 'error'` per CLAUDE.md's no-any mandate. The `ignores` block excludes `**/src/generated/**` so Prisma-generated files (which use `@ts-nocheck`) don't fail lint. `prettier.config.js` sets `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`. husky was initialized via `pnpm exec husky init` and `.husky/pre-commit` was rewritten to `npx lint-staged` (replacing the default `pnpm test`). `lint-staged` config in root `package.json` covers `apps/backend/**/*.ts`, `apps/frontend/**/*.{ts,tsx,css}`, and `packages/**/*.ts`.

**Task 2 — Test Runners and Smoke Tests:**
Created `apps/backend/jest.config.ts` with ts-jest transform and `moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' }` for path alias resolution — critical for the `@/app.controller` and `@/app.service` imports in the test file. The smoke test `app.controller.spec.ts` uses `Test.createTestingModule` to wire `AppController` + `AppService` and asserts `getHealth()` returns `{ status: 'ok', timestamp: string }`. Created `apps/frontend/vitest.config.ts` with `environment: 'jsdom'` and `resolve.alias` mapping `@` to `./src`. The smoke test `App.test.tsx` renders `<App />` and finds the `CClone LMS` heading text.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | f7422c3 | chore(01-03): configure ESLint, Prettier, husky, and lint-staged |
| Task 2 | 7242100 | feat(01-03): configure Jest/Vitest test runners with smoke tests |
| Cleanup | cdc4163 | chore(01-03): gitignore TypeScript incremental build cache (*.tsbuildinfo) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Frontend TypeScript build missing DOM lib**
- **Found during:** Task 2, step 10 (pnpm build)
- **Issue:** `apps/frontend/src/main.tsx:6` — `Cannot find name 'document'`. The root `tsconfig.base.json` sets `"lib": ["ES2022"]` (node-oriented). `apps/frontend/tsconfig.app.json` extended this without overriding `lib`, so the DOM global types were unavailable.
- **Fix:** Added `"lib": ["ES2020", "DOM", "DOM.Iterable"]` to `apps/frontend/tsconfig.app.json` compiler options.
- **Files modified:** `apps/frontend/tsconfig.app.json`
- **Commit:** 7242100

**2. [Rule 1 - Bug] Prisma v7.7 generates client.ts not index.ts — directory import fails**
- **Found during:** Task 2, step 10 (pnpm build) — backend TypeScript compilation
- **Issue:** `apps/backend/src/prisma/prisma.service.ts` imported `from '../generated/prisma'` (directory import). Prisma v7.7 generates `client.ts` as the entry point, not `index.ts`. TypeScript resolves directory imports via `index.ts` or `package.json#main` — neither existed in the generated folder, so the import failed with `Cannot find module '../generated/prisma'`.
- **Fix:** Updated import to `from '../generated/prisma/client'` (explicit file path).
- **Files modified:** `apps/backend/src/prisma/prisma.service.ts`
- **Commit:** 7242100

**3. [Rule 2 - Missing] TypeScript build artifacts not gitignored**
- **Found during:** Task 2, post-commit check
- **Issue:** `apps/frontend/tsconfig.node.tsbuildinfo` appeared as untracked after `tsc -b`. TypeScript incremental compilation generates `.tsbuildinfo` files that are runtime artifacts and should not be committed.
- **Fix:** Added `*.tsbuildinfo` to `.gitignore`.
- **Files modified:** `.gitignore`
- **Commit:** cdc4163

## Known Stubs

None. This plan adds tooling configuration and smoke tests — no UI rendering or data source wiring.

## Threat Flags

T-01-07 mitigated as planned: `@typescript-eslint/no-explicit-any: 'error'` is enforced in `eslint.config.mjs`. husky pre-commit hook runs lint-staged on all staged TypeScript files.

## Self-Check: PASSED

Files exist:
- eslint.config.mjs: FOUND
- prettier.config.js: FOUND
- .husky/pre-commit: FOUND
- apps/backend/jest.config.ts: FOUND
- apps/backend/src/app.controller.spec.ts: FOUND
- apps/frontend/vitest.config.ts: FOUND
- apps/frontend/src/App.test.tsx: FOUND

Commits exist:
- f7422c3: FOUND (chore(01-03): configure ESLint, Prettier...)
- 7242100: FOUND (feat(01-03): configure Jest/Vitest...)
- cdc4163: FOUND (chore(01-03): gitignore TypeScript...)

Verification results:
- eslint-config-ok: PASS (eslint.config.mjs exists)
- prettier-config-ok: PASS (prettier.config.js exists)
- hook-ok: PASS (.husky/pre-commit contains lint-staged)
- lint-staged-config-ok: PASS (package.json contains lint-staged key)
- no-explicit-any: PASS (@typescript-eslint/no-explicit-any: error in eslint config)
- ignores-generated: PASS (**/src/generated/** in ignores)
- singleQuote: PASS (prettier.config.js)
- trailingComma: PASS (prettier.config.js)
- moduleNameMapper: PASS (jest.config.ts)
- testRegex: PASS (jest.config.ts)
- jsdom: PASS (vitest.config.ts)
- alias-frontend: PASS (vitest.config.ts)
- pnpm --filter backend test: 2 tests PASS
- pnpm --filter frontend test: 1 test PASS
- pnpm test (turbo): 2 tasks successful
- pnpm build (turbo): 3 tasks successful
