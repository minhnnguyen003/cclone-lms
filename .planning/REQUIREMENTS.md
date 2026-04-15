# Requirements: CClone LMS

**Defined:** 2026-04-14
**Core Value:** Instructors can create courses, assign work, and grade submissions in a complete end-to-end teaching workflow

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in and receive JWT access + refresh tokens
- [ ] **AUTH-03**: User session persists across browser refresh (refresh token)
- [ ] **AUTH-04**: User can log out from any page
- [ ] **AUTH-05**: User can view and edit their profile (name, avatar)

### Roles & Permissions

- [ ] **ROLE-01**: System supports three roles: Student, Instructor, Admin
- [ ] **ROLE-02**: Admin can assign roles to users
- [ ] **ROLE-03**: Resource-level authorization enforced (CASL) -- users can only access resources they own or are enrolled in
- [ ] **ROLE-04**: Multi-tenant isolation via PostgreSQL RLS -- tenant data is never exposed across boundaries
- [ ] **ROLE-05**: Horizontal privilege escalation is prevented (student cannot access another student's submissions)

### Course Management

- [ ] **CRSE-01**: Admin can create, edit, and delete courses
- [ ] **CRSE-02**: Instructor can manage courses assigned to them
- [ ] **CRSE-03**: Student can view and search available courses
- [ ] **CRSE-04**: Admin can add students to a course (no self-enrollment or request flow)
- [ ] **CRSE-05**: Course dashboard displays enrolled users and content
- [ ] **CRSE-06**: Instructor can create content pages (readings, links, embedded content) within a course

### Assignments

- [ ] **ASGN-01**: Instructor can create assignment with title, description, due date, and file attachments
- [ ] **ASGN-02**: Student can submit work (text and/or file upload)
- [ ] **ASGN-03**: Submission status is tracked: draft, submitted, graded
- [ ] **ASGN-04**: Instructor can grade submission with score and inline text comments
- [ ] **ASGN-05**: Instructor can upload a grading file (docx/txt/pdf) as feedback
- [ ] **ASGN-06**: Student can view their grade and feedback

### Gradebook

- [ ] **GRAD-01**: Instructor can view all student grades for a course
- [ ] **GRAD-02**: Student can view their own grades across all assignments/quizzes in a course
- [ ] **GRAD-03**: Gradebook supports weighted categories (e.g., Assignments 40%, Quizzes 30%)

### Quiz Engine

- [ ] **QUIZ-01**: Instructor can create quiz with multiple question types (MCQ, true/false, short answer, essay)
- [ ] **QUIZ-02**: Instructor can configure time limit, multiple attempts (enable/disable), and question randomization
- [ ] **QUIZ-03**: Student can take a timed quiz with countdown timer
- [ ] **QUIZ-04**: Quiz progress auto-saves periodically (handles browser close, timeout, network loss)
- [ ] **QUIZ-05**: Objective questions (MCQ, true/false) are auto-graded on submission
- [ ] **QUIZ-06**: Essay questions enter a manual grading queue for instructor review

### Communication

- [ ] **COMM-01**: Each course has a discussion board where students and instructors can create threaded topics
- [ ] **COMM-02**: Users can reply with nested comments
- [ ] **COMM-03**: Instructor can pin or close discussion threads
- [ ] **COMM-04**: In-app notification center shows deadline reminders, submission status, grade posted
- [ ] **COMM-05**: User can configure notification preferences
- [ ] **COMM-06**: Calendar view shows upcoming assignment and quiz due dates

### File Management

- [ ] **FILE-01**: File upload service supports PDF, images, video via MinIO/S3
- [ ] **FILE-02**: File size and type validation is enforced
- [ ] **FILE-03**: Files are accessed via signed URLs (time-limited, secure)

### Audit & Security

- [ ] **AUDT-01**: All significant user actions are logged (login, grade change, submission, enrollment change)
- [ ] **AUDT-02**: Admin can view audit trail with filters

### Analytics & Tracking

- [ ] **ANLT-01**: All user actions emit domain events (login, view course, submit, complete quiz, alt-tab during exam)
- [ ] **ANLT-02**: Events are stored in ClickHouse with materialized views for common aggregations
- [ ] **ANLT-03**: Student activity tracked per day/week, course completion rates, grade averages, quiz performance distribution

### Automation

- [ ] **AUTO-01**: Rule engine supports JSON-based rule definitions (conditions + actions)
- [ ] **AUTO-02**: Conditions include: student inactive N days, assignment overdue, quiz score below threshold
- [ ] **AUTO-03**: Actions include: send notification, update status, trigger webhook

## v2 Requirements

### Authentication

- **AUTH-V2-01**: User can log in via OAuth (Google)
- **AUTH-V2-02**: User can log in via magic link
- **AUTH-V2-03**: Two-factor authentication (2FA)

### Grading

- **GRADE-V2-01**: PDF markup annotation on student submissions (highlight, underline, notes)
- **GRADE-V2-02**: Full annotation suite (text comments + PDF markup + drawing/freehand)

### Communication

- **COMM-V2-01**: Email notifications via SMTP
- **COMM-V2-02**: Graded discussions

### Analytics

- **ANLT-V2-01**: Instructor dashboard (submission rates, grade distribution, student engagement)
- **ANLT-V2-02**: Admin dashboard (active users, course creation trends, platform KPIs)
- **ANLT-V2-03**: Student dashboard (grades over time, activity streak, upcoming deadlines)
- **ANLT-V2-04**: CSV and PDF export for grade reports

### Integration

- **INTG-V2-01**: Public REST API with API key authentication
- **INTG-V2-02**: Webhook system for external tool integration

## Out of Scope

| Feature | Reason |
|---------|--------|
| SCORM/xAPI support | High complexity standard, scope trap for solo dev |
| LTI integration | Complex specification, defer to post-v2 |
| Plagiarism detection | Complex integration, alt-tab tracking sufficient for v1 |
| Video conferencing | High infra cost, external tools (Zoom) handle this |
| Gamification (badges, leaderboards) | Not core to teaching workflow |
| Native mobile app | Web-first, mobile deferred indefinitely |
| Full browser lockdown anti-cheat | Alt-tab tracking only for v1, lockdown is high complexity |
| Self-enrollment / enrollment requests | Admin manages enrollment directly |
| Responsive / mobile-first UI | Deferred, desktop-first for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| ROLE-01 | Phase 2 | Pending |
| ROLE-02 | Phase 3 | Pending |
| ROLE-03 | Phase 3 | Pending |
| ROLE-04 | Phase 4 | Pending |
| ROLE-05 | Phase 4 | Pending |
| FILE-01 | Phase 5 | Pending |
| FILE-02 | Phase 5 | Pending |
| FILE-03 | Phase 5 | Pending |
| CRSE-01 | Phase 6 | Pending |
| CRSE-02 | Phase 6 | Pending |
| CRSE-03 | Phase 6 | Pending |
| CRSE-04 | Phase 6 | Pending |
| CRSE-05 | Phase 7 | Pending |
| CRSE-06 | Phase 7 | Pending |
| ASGN-01 | Phase 8 | Pending |
| ASGN-02 | Phase 8 | Pending |
| ASGN-03 | Phase 8 | Pending |
| ASGN-04 | Phase 8 | Pending |
| ASGN-05 | Phase 8 | Pending |
| ASGN-06 | Phase 8 | Pending |
| GRAD-01 | Phase 9 | Pending |
| GRAD-02 | Phase 9 | Pending |
| GRAD-03 | Phase 9 | Pending |
| QUIZ-01 | Phase 10 | Pending |
| QUIZ-02 | Phase 10 | Pending |
| QUIZ-03 | Phase 11 | Pending |
| QUIZ-04 | Phase 11 | Pending |
| QUIZ-05 | Phase 11 | Pending |
| QUIZ-06 | Phase 11 | Pending |
| COMM-01 | Phase 12 | Pending |
| COMM-02 | Phase 12 | Pending |
| COMM-03 | Phase 12 | Pending |
| COMM-04 | Phase 13 | Pending |
| COMM-05 | Phase 13 | Pending |
| COMM-06 | Phase 13 | Pending |
| AUDT-01 | Phase 14 | Pending |
| AUDT-02 | Phase 14 | Pending |
| ANLT-01 | Phase 14 | Pending |
| ANLT-02 | Phase 14 | Pending |
| ANLT-03 | Phase 14 | Pending |
| AUTO-01 | Phase 15 | Pending |
| AUTO-02 | Phase 15 | Pending |
| AUTO-03 | Phase 15 | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-15 after consolidating to 15 phases*
