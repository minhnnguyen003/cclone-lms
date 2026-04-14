# Feature Landscape

**Domain:** Learning Management System (LMS) for educational institutions
**Researched:** 2026-04-14
**Competitors analyzed:** Canvas, Moodle, Google Classroom, Blackboard

## Table Stakes

Features users expect. Missing = product feels incomplete. Every major LMS (Canvas, Moodle, Blackboard, Google Classroom) has these.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User auth (JWT) + registration | Cannot use the product without it | Low | Email/password minimum. OAuth (Google) strongly expected by edu users but can defer to phase 2 |
| Role-based access (Student, Instructor, Admin) | All 4 competitors have role hierarchies; users assume roles exist | Low | Three roles sufficient for MVP. Canvas/Moodle have 5+ roles but that's overkill early |
| Course CRUD + catalog | Core unit of organization in every LMS | Low | Admin creates, Instructor manages (per PROJECT.md decision) |
| Student enrollment | Students must join courses to do anything | Low | Invite-based or request-based both work. Self-enrollment with course codes is simplest UX |
| Assignment creation + due dates | Fundamental teaching workflow; all competitors have this | Medium | Must support text descriptions + file attachments. Due date enforcement is critical |
| Student submission (text + file upload) | Completes the assignment loop | Medium | File upload (PDF, images, docs) is non-negotiable. Max file size limits needed |
| Instructor grading with feedback | Core value prop: "grade submissions" is the primary instructor action | Medium | Score + text feedback minimum. Canvas SpeedGrader is gold standard but overkill for MVP |
| Gradebook with weighted categories | Every LMS has a gradebook. Instructors expect grade calculation | High | Weighted categories (Assignments 40%, Quizzes 30%, etc.) are standard. Points-based alternative simpler to build first |
| Quiz engine (MCQ, T/F, short answer) | Quizzes are the second most-used feature after assignments in every LMS | High | Auto-grading for objective types. Timed quizzes expected. Randomization expected |
| Discussion forums (per course) | Canvas, Moodle, Blackboard all have forums. Google Classroom has comment streams | Medium | Threaded replies, pin/close. Graded discussions are a differentiator (defer) |
| Notification center (in-app) | Users need to know about deadlines, grades, submissions | Medium | In-app is sufficient for MVP. Email notifications deferred per PROJECT.md |
| File management | Content delivery requires organized file storage | Medium | S3/MinIO abstraction. PDF/image/video support. Per-course file areas |
| Basic progress tracking | Students need to see their own grades; instructors need completion status | Low | Per-student grade view. Course-level completion percentages |
| Content pages / course materials | Instructors need to post readings, links, embedded content beyond assignments | Low | Rich text pages with embedded media. All 4 competitors have this |
| Calendar / due date view | Students need a consolidated view of upcoming deadlines | Medium | Assignment and quiz due dates on a calendar. Canvas and Blackboard both have this as core |

## Differentiators

Features that set the product apart. The user's stated differentiator is **data-driven analytics with event tracking and automation**. These are features where CClone LMS can win against incumbents.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Event tracking (all user actions) | Canvas/Moodle track page views but not granular actions. Tracking clicks, time-on-task, navigation patterns, alt-tab during exams gives far richer data | High | Kafka + ClickHouse pipeline. This is the data foundation everything else builds on |
| ClickHouse analytics database | Column-oriented DB enables sub-second aggregations over millions of events. Moodle/Canvas use same OLTP DB for analytics = slow | High | Materialized views for common queries. Separation of OLTP (Postgres) and OLAP (ClickHouse) is architecturally superior |
| Real-time engagement scoring | No major LMS does real-time engagement scoring natively. Moodle has "Analytics API" but it's batch-based and basic | High | Composite score from: login frequency, assignment submission timing, quiz performance trends, content interaction depth |
| At-risk student identification | Predictive flags based on engagement drop-off. Canvas has basic "missing assignment" alerts but no predictive analytics | High | Rule-based first (engagement score below threshold), ML-based later. Huge value for institutions |
| Rule engine for automation | JSON-based rules with conditions and actions. No major LMS has user-configurable automation rules | High | "If student misses 2 assignments, notify instructor." "If quiz score < 50%, assign remedial content." This is genuinely novel |
| Instructor analytics dashboard | Beyond basic gradebook: time-on-task per assignment, question difficulty analysis, class engagement trends over time | Medium | Deferred per PROJECT.md but is the key presentation layer for the analytics pipeline |
| Exam integrity monitoring (alt-tab tracking) | Lightweight anti-cheat without full lockdown browser requirement. Most LMS require third-party proctoring tools (Proctorio, Respondus) | Medium | Track focus changes, tab switches during timed quizzes. Less invasive than full lockdown |
| Quiz progress auto-save | Handle browser close, timeout, network loss gracefully. Canvas New Quizzes has this; Moodle's is unreliable | Medium | Critical for timed exams. WebSocket or periodic save. Differentiator in reliability |
| Audit log for all actions | Full accountability trail. Most LMS have server logs but not structured, queryable audit logs | Medium | Who did what, when, to what resource. Valuable for institutional compliance |
| Granular permission system | Resource-level ownership checks beyond role-based. Canvas has this; Moodle's is notoriously complex | High | Per-course, per-resource permissions. "Instructor can only edit own courses" is baseline |

## Anti-Features

Features to explicitly NOT build. These are scope traps, complexity sinks, or features where incumbents have insurmountable advantages.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| SCORM/xAPI content packaging | Massive spec compliance burden. Moodle has 20+ years of SCORM support. You will never catch up | Support file uploads and embedded content. Link to external SCORM players if needed |
| Built-in video conferencing | Google Classroom has Meet, Blackboard has Collaborate. Building video infra is a separate product | Integrate with Zoom/Meet/Teams via links or LTI |
| Full LTI (Learning Tools Interoperability) support | Complex spec (LTI 1.3 + Advantage). Only matters for institutions already using LTI tools | Build a clean REST API instead. LTI can come in v2+ if market demands it |
| Plagiarism detection engine | Turnitin has decades of corpus data. Building your own is not viable | Integrate with Turnitin/Copyscape API if needed. Or defer entirely |
| Full lockdown browser / proctoring | Requires OS-level browser control (Respondus). Alt-tab tracking covers 80% of use case | Alt-tab tracking + IP logging during exams is sufficient for v1 |
| Gamification (badges, leaderboards, XP) | Sounds fun, low actual impact on learning outcomes. Adds UI complexity | Focus on analytics that actually drive instructor decisions |
| Adaptive learning paths | Requires sophisticated content tagging + recommendation engine. Canvas and Moodle still struggle with this | Rule engine can approximate: "If quiz < 60%, assign review material" |
| Mobile app (native) | Responsive web is sufficient. Native apps are a separate team-sized project | Build responsive web UI. PWA if needed later |
| WCAG AAA accessibility | AA is the legal standard. AAA is aspirational and extremely costly to achieve fully | Target WCAG 2.1 AA from the start. Use semantic HTML, ARIA, color contrast |
| Multi-language / i18n | Enormous translation burden. Focus on English first for one market | Use i18n-ready framework (react-intl) so it's possible later, but don't translate now |
| Social learning features (profiles, feeds, follows) | Turns LMS into social network. Distracts from core teaching workflow | Discussion forums cover collaboration needs |
| AI content generation | Moodle 5.0 and Canvas are adding AI features. This is a fast-moving space where you can't compete on model quality | Focus on analytics AI (predictions, risk scoring) not generative AI |

## Feature Dependencies

```
Auth + Roles ─────────────────┐
                               ├──> Course CRUD ──> Enrollment
                               │         │
                               │         ├──> Assignments ──> Submissions ──> Grading ──> Gradebook
                               │         │
                               │         ├──> Quiz Engine ──> Quiz Submissions ──> Auto-grading
                               │         │         │
                               │         │         └──> Quiz Auto-save
                               │         │
                               │         ├──> Discussion Forums
                               │         │
                               │         ├──> Content Pages
                               │         │
                               │         └──> File Management (supports Assignments, Content, Quizzes)
                               │
Permissions ──────────────────┘
                               
Notification Center ──────────> Depends on: Assignments (due dates), Grading (grade posted), Submissions

Event Tracking ───────────────> Depends on: Auth (user identity), all features emit events
       │
       └──> ClickHouse Analytics ──> Materialized Views
                    │
                    ├──> Engagement Scoring ──> At-risk Identification
                    │
                    └──> Instructor Dashboard (deferred)

Rule Engine ──────────────────> Depends on: Event Tracking (triggers), Notifications (actions)
       │
       └──> Automation Actions: notify instructor, send student notification, flag for review

Audit Log ────────────────────> Depends on: Auth (who), all features (what happened)

Calendar ─────────────────────> Depends on: Assignments (due dates), Quizzes (scheduled times)
```

## Critical Build Order Constraints

1. **Auth + Roles + Permissions** must come first. Everything depends on knowing who the user is and what they can do.
2. **Course CRUD + Enrollment** is the container for all learning content.
3. **File Management** must exist before Assignments (attachments) and Content Pages.
4. **Assignment -> Submission -> Grading** is the core teaching loop (PROJECT.md's "Core Value").
5. **Quiz Engine** is complex and should be its own phase after the assignment loop works.
6. **Event Tracking** should be wired in early (even if ClickHouse comes later) so events aren't lost retroactively.
7. **ClickHouse + Analytics** depends on having event data flowing, so it comes after event tracking.
8. **Rule Engine** is the capstone: it requires events (triggers) and notifications (actions) to be useful.

## MVP Recommendation

### Phase 1: Core Teaching Loop (Must Ship First)
1. Auth + JWT + Role-based access (Student, Instructor, Admin)
2. Course CRUD + student enrollment
3. File management (S3/MinIO)
4. Assignment creation + submission + grading
5. Basic gradebook (points-based, defer weighted categories)
6. Content pages (course materials)

### Phase 2: Assessment + Communication
7. Quiz engine (MCQ, T/F, short answer, timed)
8. Auto-grading for objective questions
9. Quiz auto-save
10. Discussion forums (threaded, per-course)
11. Notification center (in-app)
12. Granular permissions (resource-level)
13. Calendar / due date view

### Phase 3: Data Pipeline (The Differentiator)
14. Event tracking (all user actions, Kafka pipeline)
15. ClickHouse analytics database + materialized views
16. Audit log (structured, queryable)
17. Alt-tab tracking during exams
18. Engagement scoring (composite metric)

### Phase 4: Automation + Intelligence
19. Rule engine (JSON-based conditions + actions)
20. At-risk student identification
21. Instructor analytics dashboard
22. Weighted gradebook categories

### Defer Indefinitely
- SCORM/xAPI, LTI, plagiarism detection, video conferencing, gamification, native mobile, AI content generation

## Competitor Feature Matrix

| Feature | Canvas | Moodle | Google Classroom | Blackboard | CClone (Planned) |
|---------|--------|--------|-----------------|------------|-------------------|
| Course management | Yes | Yes | Yes | Yes | Yes |
| Assignments + grading | Yes (SpeedGrader) | Yes | Yes | Yes | Yes |
| Quiz engine | Yes (New Quizzes) | Yes (15+ types) | Limited (Forms) | Yes | Yes (6 types) |
| Discussion forums | Yes | Yes (rich) | Comments only | Yes | Yes |
| Gradebook | Yes (weighted) | Yes (weighted) | Basic | Yes (weighted) | Yes (points first) |
| File management | Yes | Yes | Google Drive | Yes (Content Collection) | Yes (MinIO) |
| Notifications | Yes (email + in-app) | Yes (email + in-app) | Yes (email) | Yes (email + in-app) | In-app only (MVP) |
| Calendar | Yes | Yes | Yes | Yes | Yes |
| Analytics | Basic (admin only) | Basic (batch) | Basic (class insights) | Basic (reports) | **Deep (ClickHouse, real-time)** |
| Event tracking | Page views only | Limited | Minimal | Limited | **All user actions** |
| Engagement scoring | No | No (plugin) | No | No | **Yes (real-time)** |
| At-risk alerts | Missing assignments only | Plugin (basic) | Missing assignments | Basic flags | **Predictive (rule-based)** |
| Automation rules | No | No | No | No | **Yes (rule engine)** |
| Exam integrity | Requires Proctorio/Respondus | Requires plugin | No | Requires Respondus | **Built-in alt-tab tracking** |
| Audit log | Admin logs | Server logs | No | Admin logs | **Structured, queryable** |
| API | 400+ endpoints | Web services | Limited | REST API | REST API |
| LTI support | Full (1.3) | Full (1.3) | Partial | Full (1.3) | No (intentional) |
| SCORM | Yes | Yes (deep) | No | Yes | No (intentional) |
| Mobile app | Yes (native) | Yes (native) | Yes (native) | Yes (native) | Web only |
| AI features | Rubric generation | Content generation (5.0) | Gemini integration | AI knowledge checks | Analytics AI only |

## Sources

- [Canvas LMS Features - G2](https://www.g2.com/products/canvas-lms/features)
- [Canvas 2025 Highlights - Instructure](https://www.instructure.com/resources/videos/canvas-2025-highlights)
- [Moodle Features - MoodleDocs](https://docs.moodle.org/501/en/Features)
- [Moodle LMS Guide 2026 - Accipio](https://www.accipio.com/blog/moodle-lms-guide-2026/)
- [Moodle 5.0 Features - Pimenko](https://pimenko.com/en/moodle-5-0-new-features-technical-evolutions-and-impact-on-your-lms-2025/)
- [Google Classroom Features - Google for Education](https://edu.google.com/intl/ALL_us/workspace-for-education/classroom/editions/)
- [Blackboard LMS Capabilities](https://www.blackboard.com/products/teaching-and-learning/learning-effectiveness/blackboard-lms/capabilities)
- [Top 15 Must-Have LMS Features 2025 - eLeaP](https://www.eleapsoftware.com/top-15-must-have-lms-features-for-2025-the-ultimate-guide-to-building-a-smarter-learning-platform/)
- [LMS Analytics - Docebo](https://www.docebo.com/learning-network/blog/lms-analytics-insights/)
- [Predictive Analytics for Student Retention - Mapademics](https://mapademics.com/whitepapers/predictive-analytics-student-retention-ai)
- [LMS Development Pitfalls - DevOpsSchool](https://www.devopsschool.com/blog/5-common-lms-development-pitfalls-to-avoid-and-how-to-build-a-solution-that-actually-works/)
