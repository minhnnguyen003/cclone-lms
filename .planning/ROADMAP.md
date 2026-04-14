# Roadmap: CClone LMS

**Created:** 2026-04-14
**Milestone:** v1.0
**Phases:** 20
**Requirements:** 48 mapped

## Phase Overview

| # | Phase | Goal | Requirements | Plans |
|---|-------|------|--------------|-------|
| 1 | Project Scaffolding + DB Setup | NestJS project, Prisma, Docker Compose, and dev tooling are configured and running | (infrastructure) | TBD |
| 2 | Auth - Signup & Login | Users can register and log in with JWT tokens | AUTH-01, AUTH-02, AUTH-03 (3) | TBD |
| 3 | Auth - Session Management | Users stay logged in across refreshes and can log out securely | AUTH-04, ROLE-01 (2) | TBD |
| 4 | User Profile | Users can view and edit their profile | AUTH-05 (1) | TBD |
| 5 | Roles & Permissions | Admin can assign roles and resource-level authorization is enforced | ROLE-02, ROLE-03 (2) | TBD |
| 6 | Multi-tenancy & Isolation | Tenant data is isolated via PostgreSQL RLS and privilege escalation is prevented | ROLE-04, ROLE-05 (2) | TBD |
| 7 | File Management | Files upload to MinIO with validation and signed URL access | FILE-01, FILE-02, FILE-03 (3) | TBD |
| 8 | Course CRUD & Enrollment | Admin can create courses, instructors can manage them, students can view and be enrolled | CRSE-01..04 (4) | TBD |
| 9 | Course Dashboard & Content | Course dashboard shows enrolled users and instructors can create content pages | CRSE-05, CRSE-06 (2) | TBD |
| 10 | Assignment Creation | Instructors can create assignments with due dates, attachments, and status tracking | ASGN-01, ASGN-03 (2) | TBD |
| 11 | Assignment Submission & Feedback | Students submit work, instructors grade with comments and feedback files | ASGN-02, ASGN-04, ASGN-05, ASGN-06 (4) | TBD |
| 12 | Gradebook | Instructors and students can view grades with weighted categories | GRAD-01, GRAD-02, GRAD-03 (3) | TBD |
| 13 | Quiz Creation & Config | Instructors can create quizzes with multiple question types and configure settings | QUIZ-01, QUIZ-02 (2) | TBD |
| 14 | Quiz Taking & Auto-save | Students can take timed quizzes with auto-save and crash recovery | QUIZ-03, QUIZ-04 (2) | TBD |
| 15 | Quiz Grading | Objective questions auto-grade; essays enter manual grading queue | QUIZ-05, QUIZ-06 (2) | TBD |
| 16 | Discussion Board | Courses have threaded discussion boards with nested replies and moderation | COMM-01, COMM-02, COMM-03 (3) | TBD |
| 17 | Notifications & Calendar | Users receive in-app notifications and see upcoming deadlines on a calendar | COMM-04, COMM-05, COMM-06 (3) | TBD |
| 18 | Audit & Security | All significant user actions are logged with a filterable audit trail | AUDT-01, AUDT-02 (2) | TBD |
| 19 | Analytics Pipeline | Domain events stored in ClickHouse with materialized views for analysis | ANLT-01, ANLT-02, ANLT-03 (3) | TBD |
| 20 | Automation Engine | Instructors can define rules that auto-respond to student behavior | AUTO-01, AUTO-02, AUTO-03 (3) | TBD |

---

## Phase 1: Project Scaffolding + DB Setup

**Goal:** NestJS project, Prisma, Docker Compose, and dev tooling are configured and running

**UI hint**: no

**Depends on:** Nothing (first phase)

**Requirements:**
- (Infrastructure phase — no functional requirements)

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

## Phase 2: Auth - Signup & Login

**Goal:** Users can register and log in with JWT tokens

**UI hint**: yes

**Depends on:** Phase 1

**Requirements:**
- AUTH-01, AUTH-02, AUTH-03

**Success Criteria:**
1. User can sign up with email and password (password hashed with bcrypt)
2. User can log in and receive JWT access + refresh tokens
3. User session persists across browser refresh via refresh token rotation

**Research flags:**
- None (standard JWT + Passport pattern)

---

## Phase 3: Auth - Session Management

**Goal:** Users stay logged in across refreshes and can log out securely

**UI hint**: yes

**Depends on:** Phase 2

**Requirements:**
- AUTH-04, ROLE-01

**Success Criteria:**
1. User can log out from any page (token invalidated via Redis blacklist)
2. System supports three roles: Student, Instructor, Admin (role enum defined and seeded)

**Research flags:**
- None

---

## Phase 4: User Profile

**Goal:** Users can view and edit their profile

**UI hint**: yes

**Depends on:** Phase 3

**Requirements:**
- AUTH-05

**Success Criteria:**
1. User can view their profile page with current name and avatar
2. User can edit their name and upload a new avatar

**Research flags:**
- None

---

## Phase 5: Roles & Permissions

**Goal:** Admin can assign roles and resource-level authorization is enforced

**UI hint**: yes

**Depends on:** Phase 4

**Requirements:**
- ROLE-02, ROLE-03

**Success Criteria:**
1. Admin can assign roles to users via API and UI
2. Resource-level authorization enforced via CASL — users can only access resources they own or are enrolled in
3. Permission guards integrated into NestJS route handlers

**Research flags:**
- CASL v6 + Prisma v7 integration (validate `@casl/prisma` compatibility)

---

## Phase 6: Multi-tenancy & Isolation

**Goal:** Tenant data is isolated via PostgreSQL RLS and privilege escalation is prevented

**UI hint**: no

**Depends on:** Phase 5

**Requirements:**
- ROLE-04, ROLE-05

**Success Criteria:**
1. Multi-tenant isolation enforced via PostgreSQL RLS — tenant data never exposed across boundaries
2. Horizontal privilege escalation prevented (student cannot access another student's submissions)
3. All existing queries respect tenant context automatically

**Research flags:**
- Multi-tenancy with Prisma v7 + RLS (newer combo, validate compatibility)
- Platform admin vs tenant admin data model separation

---

## Phase 7: File Management

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

## Phase 8: Course CRUD & Enrollment

**Goal:** Admin can create courses, instructors can manage them, students can view and be enrolled

**UI hint**: yes

**Depends on:** Phase 5, Phase 6

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

## Phase 9: Course Dashboard & Content

**Goal:** Course dashboard shows enrolled users and instructors can create content pages

**UI hint**: yes

**Depends on:** Phase 8

**Requirements:**
- CRSE-05, CRSE-06

**Success Criteria:**
1. Course dashboard displays enrolled users and content
2. Instructor can create content pages (readings, links, embedded content) within a course

**Research flags:**
- None

---

## Phase 10: Assignment Creation

**Goal:** Instructors can create assignments with due dates, attachments, and status tracking

**UI hint**: yes

**Depends on:** Phase 7, Phase 9

**Requirements:**
- ASGN-01, ASGN-03

**Success Criteria:**
1. Instructor can create assignment with title, description, due date, and file attachments
2. Submission status tracking is in place: draft, submitted, graded

**Research flags:**
- None

---

## Phase 11: Assignment Submission & Feedback

**Goal:** Students submit work, instructors grade with comments and feedback files

**UI hint**: yes

**Depends on:** Phase 10

**Requirements:**
- ASGN-02, ASGN-04, ASGN-05, ASGN-06

**Success Criteria:**
1. Student can submit work (text and/or file upload)
2. Instructor can grade submission with score and inline text comments
3. Instructor can upload a grading file (docx/txt/pdf) as feedback
4. Student can view their grade and feedback

**Research flags:**
- None

---

## Phase 12: Gradebook

**Goal:** Instructors and students can view grades with weighted categories

**UI hint**: yes

**Depends on:** Phase 11

**Requirements:**
- GRAD-01, GRAD-02, GRAD-03

**Success Criteria:**
1. Instructor can view all student grades for a course
2. Student can view their own grades across all assignments/quizzes in a course
3. Gradebook supports weighted categories (e.g., Assignments 40%, Quizzes 30%)

**Research flags:**
- None

---

## Phase 13: Quiz Creation & Config

**Goal:** Instructors can create quizzes with multiple question types and configure settings

**UI hint**: yes

**Depends on:** Phase 9

**Requirements:**
- QUIZ-01, QUIZ-02

**Success Criteria:**
1. Instructor can create quiz with multiple question types (MCQ, true/false, short answer, essay)
2. Instructor can configure time limit, multiple attempts (enable/disable), and question randomization

**Research flags:**
- Quiz schema design (JSONB for question definitions vs normalized tables)

---

## Phase 14: Quiz Taking & Auto-save

**Goal:** Students can take timed quizzes with auto-save and crash recovery

**UI hint**: yes

**Depends on:** Phase 13

**Requirements:**
- QUIZ-03, QUIZ-04

**Success Criteria:**
1. Student can take a timed quiz with countdown timer
2. Quiz progress auto-saves periodically and survives browser close, timeout, and network loss

**Research flags:**
- Quiz engine state management (Redis auto-save, server-side timers, idempotent submission)
- localStorage fallback + navigator.sendBeacon() for crash recovery

---

## Phase 15: Quiz Grading

**Goal:** Objective questions auto-grade; essays enter manual grading queue

**UI hint**: yes

**Depends on:** Phase 14

**Requirements:**
- QUIZ-05, QUIZ-06

**Success Criteria:**
1. Objective questions (MCQ, true/false) are auto-graded on submission
2. Essay questions enter a manual grading queue for instructor review

**Research flags:**
- None

---

## Phase 16: Discussion Board

**Goal:** Courses have threaded discussion boards with nested replies and moderation

**UI hint**: yes

**Depends on:** Phase 8

**Requirements:**
- COMM-01, COMM-02, COMM-03

**Success Criteria:**
1. Each course has a discussion board where students and instructors can create threaded topics
2. Users can reply with nested comments
3. Instructor can pin or close discussion threads

**Research flags:**
- Discussion: standard threaded comment pattern (lighter research needed)

---

## Phase 17: Notifications & Calendar

**Goal:** Users receive in-app notifications and see upcoming deadlines on a calendar

**UI hint**: yes

**Depends on:** Phase 9, Phase 10

**Requirements:**
- COMM-04, COMM-05, COMM-06

**Success Criteria:**
1. In-app notification center shows deadline reminders, submission status, grade posted
2. User can configure notification preferences
3. Calendar view shows upcoming assignment and quiz due dates

**Research flags:**
- WebSocket notification delivery (Socket.IO rooms per user)

---

## Phase 18: Audit & Security

**Goal:** All significant user actions are logged with a filterable audit trail

**UI hint**: yes

**Depends on:** Phase 6

**Requirements:**
- AUDT-01, AUDT-02

**Success Criteria:**
1. All significant user actions are logged (login, grade change, submission, enrollment change)
2. Admin can view audit trail with filters

**Research flags:**
- None (standard event logging pattern)

---

## Phase 19: Analytics Pipeline

**Goal:** Domain events stored in ClickHouse with materialized views for analysis

**UI hint**: yes

**Depends on:** Phase 18

**Requirements:**
- ANLT-01, ANLT-02, ANLT-03

**Success Criteria:**
1. All user actions emit domain events (login, view course, submit, complete quiz, alt-tab during exam)
2. Events stored in ClickHouse with materialized views for common aggregations
3. Student activity tracked per day/week, course completion rates, grade averages, quiz performance distribution

**Research flags:**
- ClickHouse schema design (MergeTree partitioning, materialized view strategy)
- NestJS 11 + Confluent Kafka client (no official transport adapter)
- Batch insert strategy for ClickHouse (1000+ rows or flush every 5s)

---

## Phase 20: Automation Engine

**Goal:** Instructors can define rules that auto-respond to student behavior

**UI hint**: yes

**Depends on:** Phase 19

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
| AUTH | 5 | 2, 3, 4 |
| ROLE | 5 | 3, 5, 6 |
| FILE | 3 | 7 |
| CRSE | 6 | 8, 9 |
| ASGN | 6 | 10, 11 |
| GRAD | 3 | 12 |
| QUIZ | 6 | 13, 14, 15 |
| COMM | 6 | 16, 17 |
| AUDT | 2 | 18 |
| ANLT | 3 | 19 |
| AUTO | 3 | 20 |

---
*Roadmap created: 2026-04-14*
*Last updated: 2026-04-14 after splitting Phase 3 into Session Management + User Profile (20 phases)*
