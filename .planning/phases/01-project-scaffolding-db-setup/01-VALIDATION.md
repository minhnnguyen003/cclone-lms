---
phase: 1
slug: project-scaffolding-db-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (backend) / vitest 4.x (frontend) |
| **Config file** | `apps/backend/jest.config.ts` / `apps/frontend/vitest.config.ts` — Wave 0 creates |
| **Quick run command** | `pnpm --filter backend test --passWithNoTests` |
| **Full suite command** | `pnpm test` (turbo runs both backend + frontend) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter backend test --passWithNoTests`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-scaffold-01 | 01 | 1 | Infra | — | N/A | smoke | `pnpm --filter backend start:dev --help` | ✅ / ❌ W0 | ⬜ pending |
| 1-scaffold-02 | 01 | 1 | Infra | — | N/A | smoke | `docker compose config --quiet` | ✅ / ❌ W0 | ⬜ pending |
| 1-scaffold-03 | 01 | 1 | Infra | — | N/A | integration | `pnpm --filter backend exec prisma migrate status` | ✅ / ❌ W0 | ⬜ pending |
| 1-scaffold-04 | 01 | 2 | Infra | — | N/A | unit | `pnpm --filter backend test --passWithNoTests` | ✅ / ❌ W0 | ⬜ pending |
| 1-scaffold-05 | 01 | 2 | Infra | — | N/A | unit | `pnpm --filter frontend test --passWithNoTests` | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/backend/src/app.controller.spec.ts` — placeholder test confirming jest runs
- [ ] `apps/frontend/src/App.test.tsx` — placeholder test confirming vitest runs
- [ ] `apps/backend/jest.config.ts` — jest config with ts-jest
- [ ] `apps/frontend/vitest.config.ts` — vitest config with @testing-library/react

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker Compose services healthy | Infra | Requires Docker daemon + image pulls | `docker compose up -d && docker compose ps` — all services show "healthy" |
| MinIO bucket auto-created | Infra | Requires running MinIO instance | Open http://localhost:9001, login minioadmin/minioadmin, confirm `lms-files` bucket exists |
| NestJS dev server starts | Infra | Requires full runtime | `pnpm --filter backend start:dev` — server logs "Application is running on" without error |
| Vite dev server starts | Infra | Requires browser check | `pnpm --filter frontend dev` — http://localhost:5173 loads Hello World page |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
