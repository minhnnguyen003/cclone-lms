# Roadmap: CClone LMS

**Created:** 2026-04-14
**Milestone:** v1.0
**Phases:** 4
**Requirements:** 48 mapped

## Phase Overview

| # | Phase | Goal | Requirements | Plans |
|---|-------|------|--------------|-------|
| 1 | Foundation + Core Teaching Loop | Users can register, manage courses, assign work, submit, and grade in a secure multi-tenant environment | AUTH-01..05, ROLE-01..05, FILE-01..03, CRSE-01..06, ASGN-01..06, GRAD-01..03 (31) | TBD |
| 2 | Assessment + Communication | Students can take quizzes and communicate through discussions, notifications, and calendar | QUIZ-01..06, COMM-01..06 (12) | TBD |
| 3 | Data Pipeline + Analytics | All user actions tracked, stored in ClickHouse, with materialized views for analysis | AUDT-01..02, ANLT-01..03 (5) | TBD |
| 4 | Automation Engine | Instructors can define rules that auto-respond to student behavior | AUTO-01..03 (3) | TBD |

---

## Phase 1: Foundation + Core Teaching Loop

**Goal:** Users can register, manage courses, assign work, submit, and grade in a secure multi-tenant environment

**UI hint**: yes

**Depends on:** Nothing (first phase)

**Requirements:**
- AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
- ROLE-01, ROLE-02, ROLE-03, ROLE-04, ROLE-05
- FILE-01, FILE-02, FILE-03
- CRSE-01, CRSE-02, CRSE-03, CRSE-04, CRSE-05, CRSE-06
- ASGN-01, ASGN-02, ASGN-03, ASGN-04, ASGN-05, ASGN-06
- GRAD-01, GRAD-02, GRAD-03

**Success Criteria:**
1. User can sign up, log in, and stay logged in across browser refreshes
2. Admin can assign roles and add students to courses
3. Users can only access resources within their own tenant (RLS enforced) and cannot escalate privileges
4. Instructor can create assignments with due dates and file attachments
5. Student can submit work (text + file), instructor can grade with inline text comments and feedback files
6. Gradebook displays all grades per course with weighted categories
7. Instructor can create content pages within a course
8. Files upload via MinIO with signed URL access

**Research flags:**
- Multi-tenancy with Prisma v7 + RLS (newer combo, validate compatibility)
- Platform admin vs tenant admin data model separation
- CASL v6 + Prisma v7 integration

---

## Phase 2: Assessment + Communication

**Goal:** Students can take quizzes and communicate through discussions, notifications, and calendar

**UI hint**: yes

**Depends on:** Phase 1

**Requirements:**
- QUIZ-01, QUIZ-02, QUIZ-03, QUIZ-04, QUIZ-05, QUIZ-06
- COMM-01, COMM-02, COMM-03, COMM-04, COMM-05, COMM-06

**Success Criteria:**
1. Instructor can create quizzes with MCQ, true/false, short answer, and essay questions
2. Student can take a timed quiz with countdown, configurable attempts, and question randomization
3. Quiz progress auto-saves and survives browser close or network loss
4. Objective questions are auto-graded on submission; essays enter manual grading queue
5. Each course has a discussion board where students and instructors can create threads with nested replies
6. Users receive in-app notifications for deadlines, submissions, and grades
7. Calendar view shows upcoming assignment and quiz due dates

**Research flags:**
- Quiz engine state management (Redis auto-save, server-side timers, idempotent submission)
- localStorage fallback + navigator.sendBeacon() for crash recovery
- Discussion: standard threaded comment pattern (lighter research needed)

---

## Phase 3: Data Pipeline + Analytics

**Goal:** All user actions tracked, stored in ClickHouse, with materialized views for analysis

**UI hint**: yes

**Depends on:** Phase 1, Phase 2

**Requirements:**
- AUDT-01, AUDT-02
- ANLT-01, ANLT-02, ANLT-03

**Success Criteria:**
1. All significant user actions are logged with filterable audit trail for admins
2. Domain events emitted for all user actions (login, view course, submit, complete quiz, alt-tab during exam)
3. Events stored in ClickHouse with materialized views for student activity, course completion, grade averages, and quiz performance

**Research flags:**
- ClickHouse schema design (MergeTree partitioning, materialized view strategy)
- NestJS 11 + Confluent Kafka client (no official transport adapter)
- Batch insert strategy for ClickHouse (1000+ rows or flush every 5s)

---

## Phase 4: Automation Engine

**Goal:** Instructors can define rules that auto-respond to student behavior

**UI hint**: yes

**Depends on:** Phase 3

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

| Category | Count | Phase |
|----------|-------|-------|
| AUTH | 5 | 1 |
| ROLE | 5 | 1 |
| FILE | 3 | 1 |
| CRSE | 6 | 1 |
| ASGN | 6 | 1 |
| GRAD | 3 | 1 |
| QUIZ | 6 | 2 |
| COMM | 6 | 2 |
| AUDT | 2 | 3 |
| ANLT | 3 | 3 |
| AUTO | 3 | 4 |

---
*Roadmap created: 2026-04-14*
*Last updated: 2026-04-14 after initial creation*
