# Roadmap: CClone LMS

**Created:** 2026-04-14
**Milestone:** v1.0
**Phases:** 36
**Requirements:** 48 mapped

## Phase Overview

| # | Phase | Goal | Requirements | Plans |
|---|-------|------|--------------|-------|
| 1 | Project Scaffolding + DB Setup | NestJS project, Prisma, Docker Compose, and dev tooling are configured and running | (infrastructure) | TBD |
| 2 | User Signup | Users can create an account with email and password | AUTH-01 (1) | TBD |
| 3 | User Login & JWT | Users can log in and receive JWT access + refresh tokens | AUTH-02 (1) | TBD |
| 4 | Session Persistence | User session persists across browser refresh via refresh token | AUTH-03 (1) | TBD |
| 5 | Logout & Role Definitions | Users can log out and the system defines three roles | AUTH-04, ROLE-01 (2) | TBD |
| 6 | User Profile | Users can view and edit their profile | AUTH-05 (1) | TBD |
| 7 | Admin Role Assignment | Admin can assign roles to users | ROLE-02 (1) | TBD |
| 8 | Resource-level Authorization | Resource access enforced via CASL based on ownership and enrollment | ROLE-03 (1) | TBD |
| 9 | Multi-tenancy & Isolation | Tenant data isolated via RLS and privilege escalation prevented | ROLE-04, ROLE-05 (2) | TBD |
| 10 | File Management | Files upload to MinIO with validation and signed URL access | FILE-01, FILE-02, FILE-03 (3) | TBD |
| 11 | Admin Course CRUD | Admin can create, edit, and delete courses | CRSE-01 (1) | TBD |
| 12 | Admin Student Enrollment | Admin can add students to a course | CRSE-04 (1) | TBD |
| 13 | Instructor Course Management | Instructor can manage courses assigned to them | CRSE-02 (1) | TBD |
| 14 | Student Course Browsing | Student can view and search available courses | CRSE-03 (1) | TBD |
| 15 | Course Dashboard | Course dashboard displays enrolled users and content | CRSE-05 (1) | TBD |
| 16 | Course Content Pages | Instructor can create content pages within a course | CRSE-06 (1) | TBD |
| 17 | Assignment Creation & Status | Instructor can create assignments with due dates, attachments, and status tracking | ASGN-01, ASGN-03 (2) | TBD |
| 18 | Student Submission | Student can submit work (text and/or file upload) | ASGN-02 (1) | TBD |
| 19 | Instructor Grading | Instructor can grade submissions with score and inline comments | ASGN-04 (1) | TBD |
| 20 | Instructor Feedback Files | Instructor can upload feedback files for submissions | ASGN-05 (1) | TBD |
| 21 | Student Grade View | Student can view their grade and feedback | ASGN-06 (1) | TBD |
| 22 | Gradebook Views | Instructor and student gradebook views per course | GRAD-01, GRAD-02 (2) | TBD |
| 23 | Weighted Grade Categories | Gradebook supports weighted categories | GRAD-03 (1) | TBD |
| 24 | Quiz Question Creation | Instructor can create quizzes with MCQ, true/false, short answer, and essay | QUIZ-01 (1) | TBD |
| 25 | Quiz Configuration | Instructor can configure time limit, attempts, and randomization | QUIZ-02 (1) | TBD |
| 26 | Timed Quiz Taking | Student can take a timed quiz with countdown timer | QUIZ-03 (1) | TBD |
| 27 | Quiz Auto-save & Recovery | Quiz progress auto-saves and survives browser close or network loss | QUIZ-04 (1) | TBD |
| 28 | Auto-grading Objective Questions | MCQ and true/false questions are auto-graded on submission | QUIZ-05 (1) | TBD |
| 29 | Essay Grading Queue | Essay questions enter a manual grading queue for instructor review | QUIZ-06 (1) | TBD |
| 30 | Discussion Board | Courses have threaded discussion boards with nested replies and moderation | COMM-01, COMM-02, COMM-03 (3) | TBD |
| 31 | Notifications & Preferences | In-app notification center with configurable preferences | COMM-04, COMM-05 (2) | TBD |
| 32 | Calendar View | Calendar shows upcoming assignment and quiz due dates | COMM-06 (1) | TBD |
| 33 | Audit Trail | All significant user actions logged with filterable admin view | AUDT-01, AUDT-02 (2) | TBD |
| 34 | Domain Event Emission | All user actions emit domain events | ANLT-01 (1) | TBD |
| 35 | Analytics Storage & Views | Events stored in ClickHouse with materialized views for analysis | ANLT-02, ANLT-03 (2) | TBD |
| 36 | Automation Engine | Instructors can define rules that auto-respond to student behavior | AUTO-01, AUTO-02, AUTO-03 (3) | TBD |

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

## Phase 2: User Signup

**Goal:** Users can create an account with email and password

**UI hint**: yes

**Depends on:** Phase 1

**Requirements:**
- AUTH-01

**Success Criteria:**
1. User can sign up with email and password (password hashed with bcrypt)
2. Duplicate email registration is rejected with a clear error

**Research flags:**
- None

---

## Phase 3: User Login & JWT

**Goal:** Users can log in and receive JWT access + refresh tokens

**UI hint**: yes

**Depends on:** Phase 2

**Requirements:**
- AUTH-02

**Success Criteria:**
1. User can log in with email and password
2. Successful login returns JWT access token and refresh token

**Research flags:**
- None (standard JWT + Passport pattern)

---

## Phase 4: Session Persistence

**Goal:** User session persists across browser refresh via refresh token

**UI hint**: yes

**Depends on:** Phase 3

**Requirements:**
- AUTH-03

**Success Criteria:**
1. User session persists across browser refresh via refresh token rotation
2. Expired access tokens are silently refreshed using the refresh token

**Research flags:**
- None

---

## Phase 5: Logout & Role Definitions

**Goal:** Users can log out and the system defines three roles

**UI hint**: yes

**Depends on:** Phase 4

**Requirements:**
- AUTH-04, ROLE-01

**Success Criteria:**
1. User can log out from any page (token invalidated via Redis blacklist)
2. System supports three roles: Student, Instructor, Admin (role enum defined and seeded)

**Research flags:**
- None

---

## Phase 6: User Profile

**Goal:** Users can view and edit their profile

**UI hint**: yes

**Depends on:** Phase 5

**Requirements:**
- AUTH-05

**Success Criteria:**
1. User can view their profile page with current name and avatar
2. User can edit their name and upload a new avatar

**Research flags:**
- None

---

## Phase 7: Admin Role Assignment

**Goal:** Admin can assign roles to users

**UI hint**: yes

**Depends on:** Phase 6

**Requirements:**
- ROLE-02

**Success Criteria:**
1. Admin can assign roles to users via API and UI
2. Non-admin users cannot change roles

**Research flags:**
- None

---

## Phase 8: Resource-level Authorization

**Goal:** Resource access enforced via CASL based on ownership and enrollment

**UI hint**: no

**Depends on:** Phase 7

**Requirements:**
- ROLE-03

**Success Criteria:**
1. Resource-level authorization enforced via CASL — users can only access resources they own or are enrolled in
2. Permission guards integrated into NestJS route handlers

**Research flags:**
- CASL v6 + Prisma v7 integration (validate `@casl/prisma` compatibility)

---

## Phase 9: Multi-tenancy & Isolation

**Goal:** Tenant data isolated via RLS and privilege escalation prevented

**UI hint**: no

**Depends on:** Phase 8

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

## Phase 10: File Management

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

## Phase 11: Admin Course CRUD

**Goal:** Admin can create, edit, and delete courses

**UI hint**: yes

**Depends on:** Phase 8, Phase 9

**Requirements:**
- CRSE-01

**Success Criteria:**
1. Admin can create a new course with title, description, and metadata
2. Admin can edit and delete existing courses

**Research flags:**
- None

---

## Phase 12: Admin Student Enrollment

**Goal:** Admin can add students to a course

**UI hint**: yes

**Depends on:** Phase 11

**Requirements:**
- CRSE-04

**Success Criteria:**
1. Admin can add students to a course (no self-enrollment or request flow)
2. Enrollment is reflected in the course's student list

**Research flags:**
- None

---

## Phase 13: Instructor Course Management

**Goal:** Instructor can manage courses assigned to them

**UI hint**: yes

**Depends on:** Phase 11

**Requirements:**
- CRSE-02

**Success Criteria:**
1. Instructor can view courses assigned to them
2. Instructor can edit course details for their assigned courses

**Research flags:**
- None

---

## Phase 14: Student Course Browsing

**Goal:** Student can view and search available courses

**UI hint**: yes

**Depends on:** Phase 11

**Requirements:**
- CRSE-03

**Success Criteria:**
1. Student can view a list of available courses
2. Student can search and filter courses

**Research flags:**
- None

---

## Phase 15: Course Dashboard

**Goal:** Course dashboard displays enrolled users and content

**UI hint**: yes

**Depends on:** Phase 12, Phase 13

**Requirements:**
- CRSE-05

**Success Criteria:**
1. Course dashboard displays enrolled users, assignments, and course content

**Research flags:**
- None

---

## Phase 16: Course Content Pages

**Goal:** Instructor can create content pages within a course

**UI hint**: yes

**Depends on:** Phase 15

**Requirements:**
- CRSE-06

**Success Criteria:**
1. Instructor can create content pages (readings, links, embedded content) within a course
2. Students can view content pages

**Research flags:**
- None

---

## Phase 17: Assignment Creation & Status

**Goal:** Instructor can create assignments with due dates, attachments, and status tracking

**UI hint**: yes

**Depends on:** Phase 10, Phase 16

**Requirements:**
- ASGN-01, ASGN-03

**Success Criteria:**
1. Instructor can create assignment with title, description, due date, and file attachments
2. Submission status tracking is in place: draft, submitted, graded

**Research flags:**
- None

---

## Phase 18: Student Submission

**Goal:** Student can submit work (text and/or file upload)

**UI hint**: yes

**Depends on:** Phase 17

**Requirements:**
- ASGN-02

**Success Criteria:**
1. Student can submit work as text and/or file upload
2. Submission updates status to "submitted"

**Research flags:**
- None

---

## Phase 19: Instructor Grading

**Goal:** Instructor can grade submissions with score and inline comments

**UI hint**: yes

**Depends on:** Phase 18

**Requirements:**
- ASGN-04

**Success Criteria:**
1. Instructor can grade a submission with a numeric score
2. Instructor can add inline text comments to submissions

**Research flags:**
- None

---

## Phase 20: Instructor Feedback Files

**Goal:** Instructor can upload feedback files for submissions

**UI hint**: yes

**Depends on:** Phase 19

**Requirements:**
- ASGN-05

**Success Criteria:**
1. Instructor can upload a grading file (docx/txt/pdf) as feedback attached to a submission

**Research flags:**
- None

---

## Phase 21: Student Grade View

**Goal:** Student can view their grade and feedback

**UI hint**: yes

**Depends on:** Phase 19

**Requirements:**
- ASGN-06

**Success Criteria:**
1. Student can view their grade, inline comments, and feedback files for each submission

**Research flags:**
- None

---

## Phase 22: Gradebook Views

**Goal:** Instructor and student gradebook views per course

**UI hint**: yes

**Depends on:** Phase 19

**Requirements:**
- GRAD-01, GRAD-02

**Success Criteria:**
1. Instructor can view all student grades for a course
2. Student can view their own grades across all assignments/quizzes in a course

**Research flags:**
- None

---

## Phase 23: Weighted Grade Categories

**Goal:** Gradebook supports weighted categories

**UI hint**: yes

**Depends on:** Phase 22

**Requirements:**
- GRAD-03

**Success Criteria:**
1. Gradebook supports weighted categories (e.g., Assignments 40%, Quizzes 30%)
2. Final grade calculates correctly based on category weights

**Research flags:**
- None

---

## Phase 24: Quiz Question Creation

**Goal:** Instructor can create quizzes with MCQ, true/false, short answer, and essay

**UI hint**: yes

**Depends on:** Phase 16

**Requirements:**
- QUIZ-01

**Success Criteria:**
1. Instructor can create a quiz with multiple question types (MCQ, true/false, short answer, essay)
2. Questions are stored and retrievable

**Research flags:**
- Quiz schema design (JSONB for question definitions vs normalized tables)

---

## Phase 25: Quiz Configuration

**Goal:** Instructor can configure time limit, attempts, and randomization

**UI hint**: yes

**Depends on:** Phase 24

**Requirements:**
- QUIZ-02

**Success Criteria:**
1. Instructor can set a time limit for a quiz
2. Instructor can enable/disable multiple attempts and question randomization

**Research flags:**
- None

---

## Phase 26: Timed Quiz Taking

**Goal:** Student can take a timed quiz with countdown timer

**UI hint**: yes

**Depends on:** Phase 25

**Requirements:**
- QUIZ-03

**Success Criteria:**
1. Student can start and take a timed quiz
2. Countdown timer displays remaining time and auto-submits when expired

**Research flags:**
- Quiz engine state management (server-side timers, idempotent submission)

---

## Phase 27: Quiz Auto-save & Recovery

**Goal:** Quiz progress auto-saves and survives browser close or network loss

**UI hint**: yes

**Depends on:** Phase 26

**Requirements:**
- QUIZ-04

**Success Criteria:**
1. Quiz progress auto-saves periodically to the server
2. Quiz state survives browser close, timeout, and network loss

**Research flags:**
- Redis auto-save strategy
- localStorage fallback + navigator.sendBeacon() for crash recovery

---

## Phase 28: Auto-grading Objective Questions

**Goal:** MCQ and true/false questions are auto-graded on submission

**UI hint**: yes

**Depends on:** Phase 26

**Requirements:**
- QUIZ-05

**Success Criteria:**
1. Objective questions (MCQ, true/false) are auto-graded immediately on quiz submission
2. Score is calculated and displayed to the student

**Research flags:**
- None

---

## Phase 29: Essay Grading Queue

**Goal:** Essay questions enter a manual grading queue for instructor review

**UI hint**: yes

**Depends on:** Phase 28

**Requirements:**
- QUIZ-06

**Success Criteria:**
1. Essay questions enter a manual grading queue after quiz submission
2. Instructor can review and grade essay responses from the queue

**Research flags:**
- None

---

## Phase 30: Discussion Board

**Goal:** Courses have threaded discussion boards with nested replies and moderation

**UI hint**: yes

**Depends on:** Phase 11

**Requirements:**
- COMM-01, COMM-02, COMM-03

**Success Criteria:**
1. Each course has a discussion board where students and instructors can create threaded topics
2. Users can reply with nested comments
3. Instructor can pin or close discussion threads

**Research flags:**
- Discussion: standard threaded comment pattern (lighter research needed)

---

## Phase 31: Notifications & Preferences

**Goal:** In-app notification center with configurable preferences

**UI hint**: yes

**Depends on:** Phase 16, Phase 17

**Requirements:**
- COMM-04, COMM-05

**Success Criteria:**
1. In-app notification center shows deadline reminders, submission status, grade posted
2. User can configure notification preferences (which notifications to receive)

**Research flags:**
- WebSocket notification delivery (Socket.IO rooms per user)

---

## Phase 32: Calendar View

**Goal:** Calendar shows upcoming assignment and quiz due dates

**UI hint**: yes

**Depends on:** Phase 17, Phase 25

**Requirements:**
- COMM-06

**Success Criteria:**
1. Calendar view shows upcoming assignment and quiz due dates
2. Clicking a date item navigates to the relevant assignment or quiz

**Research flags:**
- None

---

## Phase 33: Audit Trail

**Goal:** All significant user actions logged with filterable admin view

**UI hint**: yes

**Depends on:** Phase 9

**Requirements:**
- AUDT-01, AUDT-02

**Success Criteria:**
1. All significant user actions are logged (login, grade change, submission, enrollment change)
2. Admin can view audit trail with filters

**Research flags:**
- None (standard event logging pattern)

---

## Phase 34: Domain Event Emission

**Goal:** All user actions emit domain events

**UI hint**: no

**Depends on:** Phase 33

**Requirements:**
- ANLT-01

**Success Criteria:**
1. All user actions emit domain events (login, view course, submit, complete quiz, alt-tab during exam)
2. Events are published to an internal event bus

**Research flags:**
- NestJS 11 + Confluent Kafka client (no official transport adapter)

---

## Phase 35: Analytics Storage & Views

**Goal:** Events stored in ClickHouse with materialized views for analysis

**UI hint**: yes

**Depends on:** Phase 34

**Requirements:**
- ANLT-02, ANLT-03

**Success Criteria:**
1. Events stored in ClickHouse with materialized views for common aggregations
2. Student activity tracked per day/week, course completion rates, grade averages, quiz performance distribution

**Research flags:**
- ClickHouse schema design (MergeTree partitioning, materialized view strategy)
- Batch insert strategy for ClickHouse (1000+ rows or flush every 5s)

---

## Phase 36: Automation Engine

**Goal:** Instructors can define rules that auto-respond to student behavior

**UI hint**: yes

**Depends on:** Phase 35

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
| AUTH | 5 | 2, 3, 4, 5, 6 |
| ROLE | 5 | 5, 7, 8, 9 |
| FILE | 3 | 10 |
| CRSE | 6 | 11, 12, 13, 14, 15, 16 |
| ASGN | 6 | 17, 18, 19, 20, 21 |
| GRAD | 3 | 22, 23 |
| QUIZ | 6 | 24, 25, 26, 27, 28, 29 |
| COMM | 6 | 30, 31, 32 |
| AUDT | 2 | 33 |
| ANLT | 3 | 34, 35 |
| AUTO | 3 | 36 |

---
*Roadmap created: 2026-04-14*
*Last updated: 2026-04-15 after splitting to 1 requirement per phase (36 phases)*
