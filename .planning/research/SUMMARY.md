# Project Research Summary

**Project:** CClone LMS
**Domain:** Multi-tenant Learning Management System
**Researched:** 2026-04-14
**Confidence:** HIGH

## Executive Summary

CClone LMS is a general-purpose, multi-tenant LMS targeting educational institutions. Research across stack, features, architecture, and pitfalls converges on a clear strategy: build a **modular monolith with NestJS**, enforce **PostgreSQL Row-Level Security (RLS) for tenant isolation from day one**, and **defer the Kafka + ClickHouse analytics pipeline** until the core teaching loop is proven. The user's chosen stack (NestJS, React, PostgreSQL, Redis, MinIO) is well-validated for this domain.

The competitive differentiator -- real-time event tracking with a user-configurable rule engine -- is genuinely novel. No major LMS (Canvas, Moodle, Blackboard, Google Classroom) offers native "if X then Y" automation or granular engagement scoring. However, this advantage only matters after the table-stakes features work reliably. The recommended approach is to nail the core loop first, then layer analytics and automation on top.

The highest-risk components are the **permission system** (multi-tenant RLS + CASL resource-level authorization) and the **quiz engine** (state machine, auto-save, server-side timers). Both are identified across multiple research dimensions as architecturally complex. Building them after establishing CRUD patterns reduces risk.

## Key Findings

### Recommended Stack

The chosen stack is sound. Key version specifics: NestJS 11.1+ (dropped Node 18), React 19, Vite 8 (Rolldown-based), Prisma v7 (pure TypeScript, requires `moduleFormat: "cjs"` for NestJS), and CASL v6 for authorization.

**Core technologies:**
- **NestJS 11 + Prisma v7**: Modular monolith with decorator-based DI, convention-over-configuration suits solo dev
- **CASL v6**: Declarative, testable resource-level + field-level permissions, scales with complexity
- **BullMQ**: Redis-backed job queue for Phase 1-2 background work; Kafka deferred to Phase 3
- **@confluentinc/kafka-javascript v1.8**: Replaces abandoned KafkaJS; KafkaJS-compatible API
- **ClickHouse (MergeTree, not ReplacingMergeTree)**: Append-only events, deduplicate at producer level

**Critical stack note:** KafkaJS is abandoned (unmaintained since Feb 2023). Use the Confluent client instead.

### Expected Features

**Must have (table stakes):**
- Auth (JWT) + role-based access (Student, Instructor, Admin)
- Course CRUD + enrollment + course materials / content pages
- Assignment creation, submission, grading with feedback
- Quiz engine (MCQ, T/F, short answer, timed, randomized, auto-grading)
- Discussion forums, in-app notifications, file management
- Basic gradebook (points-based first, weighted categories later)
- Calendar / due date view

**Should have (competitive):**
- Real-time event tracking with engagement scoring
- User-configurable rule engine (if X then Y automation)
- ClickHouse-powered analytics dashboards
- At-risk student detection

**Defer (v2+):**
- SCORM/xAPI, LTI integration, plagiarism detection
- OAuth / Google login (Phase 2 at minimum)
- Video conferencing, gamification, native mobile
- Email notifications, CSV/PDF export, public API

**Research gap:** Content pages / course materials are missing from PROJECT.md but are table stakes. Instructors need to post readings and links beyond assignments.

### Architecture Approach

A modular monolith where each NestJS module maps to a bounded context (Auth, Course, Quiz, Assignment, File, Discussion, Notification, Event). Modules communicate only through exported services -- never cross-module repository access. PostgreSQL RLS provides tenant isolation at the database level. A single middleware sets `SET LOCAL app.current_tenant_id` from JWT on every request.

**Major components:**
1. **Auth + Tenant Module** -- JWT, RLS middleware, CASL ability factory
2. **Course + Assignment Module** -- Core teaching loop CRUD
3. **Quiz Engine** -- State machine, Redis auto-save, server-side timer
4. **File Storage** -- MinIO presigned URLs, abstraction layer
5. **Notification + Event Module** -- BullMQ jobs, in-app notifications
6. **Analytics Pipeline** -- PostgreSQL events table first, ClickHouse + Kafka later

### Critical Pitfalls

1. **Tenant data leakage** -- Missing RLS on new tables creates data breaches. Prevention: migration lint check, never grant BYPASSRLS to app role, reset connection state on every request
2. **NestJS REQUEST-scoped tenant context breaks in background jobs** -- Use AsyncLocalStorage instead, serialize tenant ID into every job/event payload
3. **Quiz auto-save data loss** -- Browser crash mid-exam loses answers. Prevention: localStorage fallback + server sync, server-side timer, `navigator.sendBeacon()`, idempotent submission
4. **Premature Kafka/ClickHouse adoption** -- PostgreSQL events table handles MVP analytics. Defer infrastructure until event volume justifies it
5. **ClickHouse deduplication illusion** -- ReplacingMergeTree only deduplicates during unpredictable background merges. Use plain MergeTree for append-only events

## Implications for Roadmap

### Phase 1: Foundation + Core Teaching Loop
**Rationale:** Auth, tenant isolation, and permissions are prerequisites for everything. Course + assignment CRUD validates the core value proposition.
**Delivers:** Working teaching workflow -- create course, enroll students, assign work, submit, grade
**Addresses:** Auth, RBAC, course CRUD, enrollment, assignments, submissions, grading, file upload, content pages
**Avoids:** Tenant data leakage (RLS from day one), premature infrastructure (BullMQ not Kafka)

### Phase 2: Assessment + Communication
**Rationale:** Quiz engine is the highest-risk module but depends on established CRUD patterns. Notifications and discussions complete the communication layer.
**Delivers:** Full assessment capability + real-time communication
**Addresses:** Quiz engine, discussion forums, in-app notifications, calendar view
**Avoids:** Quiz data loss (auto-save architecture), permission escalation (CASL granular rules)

### Phase 3: Data Pipeline + Analytics
**Rationale:** Requires all prior modules as data sources. This is the competitive differentiator.
**Delivers:** Event tracking, ClickHouse analytics, engagement scoring
**Addresses:** Event tracking, analytics database, materialized views, audit log enhancement

### Phase 4: Automation + Intelligence
**Rationale:** Rule engine requires both events (triggers) and notifications (actions) from prior phases.
**Delivers:** User-configurable automation, at-risk student detection
**Addresses:** Rule engine, automated actions, advanced analytics

### Phase Ordering Rationale

- Auth + RLS must come first -- every module depends on tenant isolation
- Course/Assignment before Quiz -- establishes CRUD patterns, reduces quiz engine risk
- Notifications before Analytics -- notification infrastructure enables rule engine actions
- Analytics pipeline last -- requires all prior modules generating events

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Multi-tenancy with Prisma v7 + RLS (newer combo, less community validation)
- **Phase 2:** Quiz engine state management (Redis auto-save pattern is community-validated but LMS-specific edge cases need investigation)
- **Phase 3:** ClickHouse schema design (MergeTree partitioning, materialized view strategy)

Phases with standard patterns (lighter research):
- **Phase 1 CRUD:** Well-documented NestJS + Prisma patterns
- **Phase 2 Discussions:** Standard threaded comment pattern

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry and official docs |
| Features | HIGH | Verified across 4 competitors (Canvas, Moodle, Blackboard, Google Classroom) |
| Architecture | HIGH | Modular monolith + RLS well-documented, multiple authoritative sources |
| Pitfalls | HIGH | Multiple corroborating sources across all categories |

**Overall confidence:** HIGH

### Gaps to Address

- **Prisma v7 + CASL v6 compatibility:** Tested primarily with Prisma v5-6. Validate in Phase 1.
- **NestJS 11 + Confluent Kafka client:** No official transport adapter. May need custom adapter in Phase 3.
- **Platform admin vs tenant admin separation:** Data model decision needed in Phase 1.
- **Gradebook complexity:** Weighted categories are High complexity. Ship points-based first.
- **Calendar view:** Table stakes but not in original PROJECT.md scope. Recommend adding to Phase 2.

---
*Research completed: 2026-04-14*
*Ready for roadmap: yes*
