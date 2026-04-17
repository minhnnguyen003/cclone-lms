---
phase: 02
plan: 05
slug: fix-vite-react-plugin-compatibility
subsystem: frontend/build-tooling
tags: [vite, rolldown, plugin-react, dependency-upgrade, dev-tooling]
dependency_graph:
  requires: []
  provides: [clean-dev-server-startup]
  affects: [apps/frontend]
tech_stack:
  added: ["@vitejs/plugin-react@6.0.1"]
  patterns: [rolldown-native-jsx-transform]
key_files:
  created: []
  modified:
    - apps/frontend/package.json
    - pnpm-lock.yaml
decisions:
  - "Upgrade @vitejs/plugin-react to v6 (Vite 8-only) rather than switching to @vitejs/plugin-react-oxc which has incompatible Vite 8 peer dependency"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-17T04:17:51Z"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 2
---

# Phase 02 Plan 05: Fix Vite React Plugin Compatibility Summary

## One-Liner

Upgraded `@vitejs/plugin-react` from v4 to v6.0.1 (Rolldown-native) to eliminate the `Invalid input options: jsx` warning on Vite 8 dev server startup.

## What Was Done

**Task 1: Upgrade @vitejs/plugin-react to v6 (Vite 8-native)**
- Commit: `3675f5b`
- Changed `@vitejs/plugin-react` version in `apps/frontend/package.json` from `"^4.0.0"` to `"^6.0.1"`
- Ran `pnpm install` from monorepo root — lockfile updated cleanly, no peer dependency errors for the upgraded package
- `vite.config.ts` left completely unchanged (import and `react()` call are identical to before)
- Verified installed version: `@vitejs/plugin-react@6.0.1`
- Verified dev server startup produces zero `Invalid input options`, `jsx`, or Rolldown warnings

## Root Cause Fixed

`@vitejs/plugin-react@4.x` detects `rolldownVersion` in Vite 8 and returns `{ rollupOptions: { jsx: { mode: "automatic" } } }` from its `config()` hook. Vite 8 forwards `rollupOptions` to `rolldownOptions`, placing `jsx` as a top-level `InputOption`. Rolldown 1.0.0-rc.15 removed `jsx` from `InputOptions` (it now belongs in `TransformOptions`), causing the warning:

> Warning: Invalid input options (1 issue found) — For the 'jsx'. Invalid key: Expected never but received 'jsx'.

v6 is Vite 8-native and does not set this legacy `jsx` InputOption.

## Verification Results

```
$ pnpm --filter frontend list @vitejs/plugin-react
@vitejs/plugin-react@6.0.1   (devDependency)

$ timeout 12 pnpm dev (startup check)
VITE v8.0.8  ready in 703 ms
→ Local: http://localhost:5175/
PASS: No jsx/rolldown warnings found
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

No new security-relevant surface introduced. This change only affects the build toolchain (Vite plugin upgrade) — no network endpoints, auth paths, file access patterns, or schema changes were introduced.

## Self-Check: PASSED

- [x] `apps/frontend/package.json` modified — FOUND
- [x] `pnpm-lock.yaml` updated — FOUND
- [x] Task commit `3675f5b` exists — VERIFIED
- [x] `@vitejs/plugin-react@6.0.1` installed and confirmed via `pnpm list`
- [x] Dev server starts with zero jsx/rolldown warnings
