# Roadmap: CClone LMS

**Created:** 2026-04-14
**Milestone:** v1.0
**Phases:** 14
**Requirements:** 48 mapped

## Phase Overview

| # | Phase | Goal | Requirements | Plans |
|---|-------|------|--------------|-------|
| 1 | Project Scaffolding + DB Setup | NestJS project, Prisma, Docker Compose, and dev tooling are configured and running | (infrastructure) | 3 plans |
| 2 | Authentication | Users can sign up, log in, stay logged in, log out, and edit their profile | AUTH-01..05, ROLE-01 (6) | 4 plans |
| 3 | Access Control | Admin assigns roles, CASL enforces resource access, RLS isolates tenant data | ROLE-02..05 (4) | TBD |
| 4 | File Management | Files upload to MinIO with validation and signed URL access | FILE-01, FILE-02, FILE-03 (3) | TBD |
| 5 | Course Management | Admin can create courses and enroll students, instructors can manage courses, students can browse | CRSE-01..04 (4) | TBD |
| 6 | Course Dashboard & Content | Course dashboard shows enrolled users and instructors can create content pages | CRSE-05, CRSE-06 (2) | TBD |
| 7 | Assignments | Instructors create assignments, students submit, instructors grade with comments and feedback | ASGN-01..06 (6) | TBD |
| 8 | Gradebook | Instructors and students can view grades with weighted categories | GRAD-01, GRAD-02, GRAD-03 (3) | TBD |
| 9 | Quiz Creation & Config | Instructors create quizzes with multiple question types and configure settings | QUIZ-01, QUIZ-02 (2) | TBD |
| 10 | Quiz Taking & Grading | Students take timed quizzes with auto-save; objective auto-graded, essays enter grading queue | QUIZ-03..06 (4) | TBD |
| 11 | Discussion Board | Courses have threaded discussion boards with nested replies and moderation | COMM-01, COMM-02, COMM-03 (3) | TBD |
| 12 | Notifications & Calendar | In-app notifications with preferences and calendar view for due dates | COMM-04, COMM-05, COMM-06 (3) | TBD |
| 13 | Audit & Analytics | User actions logged with audit trail; events stored in ClickHouse with analytics views | AUDT-01, AUDT-02, ANLT-01, ANLT-02, ANLT-03 (5) | TBD |
| 14 | Automation Engine | Instructors can define rules that auto-respond to student behavior | AUTO-01, AUTO-02, AUTO-03 (3) | TBD |

---

## Phase 1: Project Scaffolding + DB Setup

**Goal:** NestJS project, Prisma, Docker Compose, and dev tooling are configured and running

**UI hint**: no

**Depends on:** Nothing (first phase)

**Requirements:**
- (Infrastructure phase — no functional requirements)

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Monorepo skeleton (pnpm + Turborepo + Docker Compose + env config)
- [x] 01-02-PLAN.md — NestJS backend with Prisma + React frontend + shared types package
- [x] 01-03-PLAN.md — Dev tooling (ESLint, Prettier, husky, lint-staged) + test infrastructure

**Success Criteria:**
1. NestJS project initializes and starts without errors
2. Prisma connects to PostgreSQL and runs an empty migration
3. Docker Compose brings up PostgreSQL, Redis, and MinIO
4. ESLint, Prettier, husky, and lint-staged are configured
5. Path aliases (`@/`) work in both backend and frontend
6. React + Vite + TailwindCSS frontend scaffolded and running

**Research flags:**
- None

---

## Phase 2: Authentication

**Goal:** Users can sign up, log in, stay logged in, log out, and edit their profile

**UI hint**: yes

**Depends on:** Phase 1

**Requirements:**
- AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, ROLE-01

**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md — Backend auth infrastructure (Redis module, domain errors, main.ts config, schema update)
- [ ] 02-02-PLAN.md — Backend auth endpoints (signup, login, refresh, logout, profile CRUD)
- [x] 02-03-PLAN.md — Frontend foundation (shadcn/ui, Zustand auth store, axios interceptors, layouts)
- [ ] 02-04-PLAN.md — Frontend pages + wiring (login, signup, profile, routing, end-to-end verification)

**Success Criteria:**
1. User can sign up with email and password (password hashed with bcrypt)
2. User can log in and receive JWT access + refresh tokens
3. User session persists across browser refresh via refresh token rotation
4. User can log out from any page (token invalidated via Redis blacklist)
5. User can view and edit their profile (name, avatar)
6. System supports three roles: Student, Instructor, Admin (role enum defined and seeded)

**Research flags:**
- None (standard JWT + Passport pattern)

---

## Phase 3: Access Control

**Goal:** Admin assigns roles, CASL enforces resource access, RLS isolates tenant data

**UI hint**: yes

**Depends on:** Phase 2

**Requirements:**
- ROLE-02, ROLE-03, ROLE-04, ROLE-05

**Success Criteria:**
1. Admin can assign roles to users via API and UI
2. Resource-level authorization enforced via CASL — users can only access resources they own or are enrolled in
3. Permission guards integrated into NestJS route handlers
4. Multi-tenant isolation enforced via PostgreSQL RLS — tenant data never exposed across boundaries
5. Horizontal privilege escalation prevented (student cannot access another student's submissions)
6. All existing queries respect tenant context automatically

**Research flags:**
- CASL v6 + Prisma v7 integration (validate `@casl/prisma` compatibility)
- Multi-tenancy with Prisma v7 + RLS (newer combo, validate compatibility)
- Platform admin vs tenant admin data model separation

---

## Phase 4: File Management

**Goal:** Files upload to MinIO with validation and signed URL access

**UI hint**: yes

**Depends on:** Phase 1

**Requirements:**
- FILE-01, FILE-02, FILE-03

**Success Criteria:**
1. File upload service supports PDF, images, video via MinIO/S3
2. File size and type validation is enforced on upload
3. Files are accessed via signed URLs (time-limited, secure)

**Research flags:**
- None (standard MinIO SDK pattern)

---

## Phase 5: Course Management

**Goal:** Admin can create courses and enroll students, instructors can manage courses, students can browse

**UI hint**: yes

**Depends on:** Phase 3

**Requirements:**
- CRSE-01, CRSE-02, CRSE-03, CRSE-04

**Success Criteria:**
1. Admin can create, edit, and delete courses
2. Instructor can manage courses assigned to them
3. Student can view and search available courses
4. Admin can add students to a course

**Research flags:**
- None

---

## Phase 6: Course Dashboard & Content

**Goal:** Course dashboard shows enrolled users and instructors can create content pages

**UI hint**: yes

**Depends on:** Phase 5

**Requirements:**
- CRSE-05, CRSE-06

**Success Criteria:**
1. Course dashboard displays enrolled users and content
2. Instructor can create content pages (readings, links, embedded content) within a course

**Research flags:**
- None

---

## Phase 7: Assignments

**Goal:** Instructors create assignments, students submit, instructors grade with comments and feedback

**UI hint**: yes

**Depends on:** Phase 4, Phase 6

**Requirements:**
- ASGN-01, ASGN-02, ASGN-03, ASGN-04, ASGN-05, ASGN-06

**Success Criteria:**
1. Instructor can create assignment with title, description, due date, and file attachments
2. Student can submit work (text and/or file upload)
3. Submission status is tracked: draft, submitted, graded
4. Instructor can grade submission with score and inline text comments
5. Instructor can upload a grading file (docx/txt/pdf) as feedback
6. Student can view their grade and feedback

**Research flags:**
- None

---

## Phase 8: Gradebook

**Goal:** Instructors and students can view grades with weighted categories

**UI hint**: yes

**Depends on:** Phase 7

**Requirements:**
- GRAD-01, GRAD-02, GRAD-03

**Success Criteria:**
1. Instructor can view all student grades for a course
2. Student can view their own grades across all assignments/quizzes in a course
3. Gradebook supports weighted categories (e.g., Assignments 40%, Quizzes 30%)

**Research flags:**
- None

---

## Phase 9: Quiz Creation & Config

**Goal:** Instructors create quizzes with multiple question types and configure settings

**UI hint**: yes

**Depends on:** Phase 6

**Requirements:**
- QUIZ-01, QUIZ-02

**Success Criteria:**
1. Instructor can create quiz with multiple question types (MCQ, true/false, short answer, essay)
2. Instructor can configure time limit, multiple attempts (enable/disable), and question randomization

**Research flags:**
- Quiz schema design (JSONB for question definitions vs normalized tables)

---

## Phase 10: Quiz Taking & Grading

**Goal:** Students take timed quizzes with auto-save; objective auto-graded, essays enter grading queue

**UI hint**: yes

**Depends on:** Phase 9

**Requirements:**
- QUIZ-03, QUIZ-04, QUIZ-05, QUIZ-06

**Success Criteria:**
1. Student can take a timed quiz with countdown timer
2. Quiz progress auto-saves periodically and survives browser close, timeout, and network loss
3. Objective questions (MCQ, true/false) are auto-graded on submission
4. Essay questions enter a manual grading queue for instructor review

**Research flags:**
- Quiz engine state management (Redis auto-save, server-side timers, idempotent submission)
- localStorage fallback + navigator.sendBeacon() for crash recovery

---

## Phase 11: Discussion Board

**Goal:** Courses have threaded discussion boards with nested replies and moderation

**UI hint**: yes

**Depends on:** Phase 5

**Requirements:**
- COMM-01, COMM-02, COMM-03

**Success Criteria:**
1. Each course has a discussion board where students and instructors can create threaded topics
2. Users can reply with nested comments
3. Instructor can pin or close discussion threads

**Research flags:**
- Discussion: standard threaded comment pattern (lighter research needed)

---

## Phase 12: Notifications & Calendar

**Goal:** In-app notifications with preferences and calendar view for due dates

**UI hint**: yes

**Depends on:** Phase 6, Phase 7

**Requirements:**
- COMM-04, COMM-05, COMM-06

**Success Criteria:**
1. In-app notification center shows deadline reminders, submission status, grade posted
2. User can configure notification preferences
3. Calendar view shows upcoming assignment and quiz due dates

**Research flags:**
- WebSocket notification delivery (Socket.IO rooms per user)

---

## Phase 13: Audit & Analytics

**Goal:** User actions logged with audit trail; events stored in ClickHouse with analytics views

**UI hint**: yes

**Depends on:** Phase 3

**Requirements:**
- AUDT-01, AUDT-02, ANLT-01, ANLT-02, ANLT-03

**Success Criteria:**
1. All significant user actions are logged (login, grade change, submission, enrollment change)
2. Admin can view audit trail with filters
3. All user actions emit domain events (login, view course, submit, complete quiz, alt-tab during exam)
4. Events stored in ClickHouse with materialized views for common aggregations
5. Student activity tracked per day/week, course completion rates, grade averages, quiz performance distribution

**Research flags:**
- ClickHouse schema design (MergeTree partitioning, materialized view strategy)
- NestJS 11 + Confluent Kafka client (no official transport adapter)
- Batch insert strategy for ClickHouse (1000+ rows or flush every 5s)

---

## Phase 14: Automation Engine

**Goal:** Instructors can define rules that auto-respond to student behavior

**UI hint**: yes

**Depends on:** Phase 13

**Requirements:**
- AUTO-01, AUTO-02, AUTO-03

**Success Criteria:**
1. Instructor can create JSON-based rules with conditions and actions
2. Rules trigger on conditions: student inactive N days, assignment overdue, quiz score below threshold
3. Actions execute automatically: send notification, update status, trigger webhook

**Research flags:**
- Rule evaluation engine design (cron-based vs event-driven)
- Standard patterns available, lighter research needed

---

## Coverage Validation

**Total v1 requirements:** 48
**Mapped to phases:** 48
**Unmapped:** 0

| Category | Count | Phase(s) |
|----------|-------|----------|
| AUTH | 5 | 2 |
| ROLE | 5 | 2, 3 |
| FILE | 3 | 4 |
| CRSE | 6 | 5, 6 |
| ASGN | 6 | 7 |
| GRAD | 3 | 8 |
| QUIZ | 6 | 9, 10 |
| COMM | 6 | 11, 12 |
| AUDT | 2 | 13 |
| ANLT | 3 | 13 |
| AUTO | 3 | 14 |

---
*Roadmap created: 2026-04-14*
*Last updated: 2026-04-16 after planning Phase 2 (4 plans)*
