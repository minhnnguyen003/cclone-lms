# CClone LMS

## What This Is

A general-purpose, data-driven Learning Management System built for educational institutions. It provides course management, assignment workflows, quiz engines, and analytics — with event-driven tracking and automation as its core differentiator over existing LMS platforms.

## Core Value

Instructors can create courses, assign work, and grade submissions in a complete end-to-end teaching workflow — this core loop must work reliably before anything else.

## Requirements

### Validated

- [x] pnpm monorepo with Turborepo task pipeline — Validated in Phase 1: Project Scaffolding + DB Setup
- [x] NestJS backend with Prisma v7, PrismaService/PrismaModule, and User schema — Validated in Phase 1
- [x] React + Vite 8 + TailwindCSS v4 frontend (CSS-first, no config file) — Validated in Phase 1
- [x] Docker Compose dev infrastructure (PostgreSQL 16, Redis 7, MinIO with auto-bucket) — Validated in Phase 1
- [x] ESLint flat config, Prettier, husky pre-commit hooks, lint-staged — Validated in Phase 1
- [x] Jest (backend) + Vitest (frontend) test runners with smoke tests — Validated in Phase 1
- [x] Path aliases (@/) in both backend (tsconfig + Jest) and frontend (Vite) — Validated in Phase 1

### Active

- [ ] User registration and login with JWT authentication
- [ ] Role-based access control (Student, Instructor, Admin)
- [ ] Course CRUD (Admin creates, Instructor manages)
- [ ] Student enrollment (invite or request)
- [ ] Assignment creation with due dates and attachments
- [ ] Student submission (text + file upload)
- [ ] Instructor grading with score and feedback
- [ ] Granular permission system (resource-level ownership checks)
- [ ] In-app notification center (deadline reminders, submission status, grade posted)
- [ ] File management service (S3/MinIO abstraction, PDF/image/video support)
- [ ] Quiz engine (MCQ, true/false, short answer, essay, timed, randomized)
- [ ] Auto-grading for objective questions, manual grading queue for essays
- [ ] Quiz progress auto-save (handle browser close, timeout, network loss)
- [ ] Audit log for significant user actions
- [ ] Discussion board per course (threads, nested replies, pin/close)
- [ ] Event tracking for all user actions (including alt-tab during exams)
- [ ] Analytics database (ClickHouse) with materialized views
- [ ] Rule engine for automation (JSON-based rules, conditions, actions)

### Out of Scope

- Responsive/mobile-first UI — deferred, not current priority
- Email notifications (SMTP) — deferred to later phase
- Dashboards (instructor/admin/student) — deferred to later phase
- CSV/PDF export — deferred to later phase
- Public API with API key auth — deferred to later phase
- Webhook system — deferred to later phase
- Plagiarism detection integration — deferred
- Full browser lockdown anti-cheat — alt-tab tracking only for now

## Context

- Solo developer project with 1-2 month MVP timeline
- General-purpose product targeting educational institutions (not single-tenant)
- Existing planning docs in `docs/FEATURES.md` and `docs/PROJECT_PLAN.md` (Vietnamese) capture initial vision
- Analytics pipeline (Kafka + ClickHouse) is the intended competitive advantage over Moodle/Blackboard/Canvas
- Three-phase structure: MVP (core loop), Hardening (permissions, quizzes, notifications), Tracking (events, analytics, automation)

## Constraints

- **Team**: Solo developer — architecture must be maintainable by one person
- **Timeline**: MVP in 1-2 months, full system over several months
- **Stack**: NestJS (TypeScript) backend, React + Vite + TailwindCSS frontend, PostgreSQL, Redis, MinIO
- **Scale**: Must support multi-tenant architecture (multiple institutions) from the start
- **Complexity**: Quiz engine state management and permission system are identified as hardest parts

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| NestJS over Spring Boot | TypeScript full-stack, solo dev efficiency | -- Committed |
| ClickHouse for analytics | Column-oriented, fast aggregations for event data | -- Pending |
| Alt-tab tracking only (no full anti-cheat) | Scope control — full lockdown is complex, alt-tab is sufficient for v1 | -- Committed |
| No email notifications in MVP | Reduces infra complexity, in-app notifications sufficient initially | -- Committed |
| Admin creates courses (not Instructor) | User's explicit edit to FEATURES.md | -- Committed |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 — Phase 1 (Project Scaffolding + DB Setup) complete*
