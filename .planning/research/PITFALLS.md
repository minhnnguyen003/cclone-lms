# Domain Pitfalls

**Domain:** Multi-tenant Learning Management System (NestJS + PostgreSQL + Kafka + ClickHouse)
**Researched:** 2026-04-14
**Overall confidence:** HIGH (multiple corroborating sources across all categories)

---

## Critical Pitfalls

Mistakes that cause data breaches, rewrites, or months of wasted effort.

---

### Pitfall 1: Tenant Data Leakage Through Missing or Bypassed RLS

**What goes wrong:** A student or instructor in Tenant A sees courses, grades, or submissions from Tenant B. This is not a bug -- it is a data breach. In a multi-tenant LMS serving educational institutions, this can mean FERPA violations and contract termination.

**Why it happens:**
- Forgetting to add RLS policies on new tables (every new feature adds tables, and one missed `tenant_id` filter leaks data)
- Application role has SUPERUSER or BYPASSRLS privileges
- Table owner queries bypass RLS unless `FORCE ROW LEVEL SECURITY` is explicitly enabled
- Connection pooling (PgBouncer or NestJS connection pool) reuses connections without resetting `app.current_tenant`, so Tenant A's session context leaks to Tenant B's request

**Consequences:** Complete data isolation failure. Legal liability. Loss of all institutional customers.

**Prevention:**
- Add a migration lint check: every table with a `tenant_id` column MUST have RLS enabled and a policy attached. Fail CI if not.
- NEVER grant BYPASSRLS to the application database role. Use a separate superuser role only for migrations.
- Set `FORCE ROW LEVEL SECURITY` on all tenant-scoped tables.
- In NestJS middleware, call `SET app.current_tenant = $tenantId` at the START of every request, before any query runs. Never assume the connection is clean.
- Write integration tests that explicitly attempt cross-tenant access and assert failure.

**Detection:** Add a `tenant_id` assertion in a base repository/service layer that throws if the returned rows contain a tenant_id different from the request context. This is a safety net, not the primary defense.

**Phase:** Must be designed in Phase 1 (MVP), enforced from the first migration. Retrofitting RLS onto existing tables is painful and error-prone.

**Confidence:** HIGH -- AWS documentation, Permit.io guide, and multiple production post-mortems confirm these exact failure modes.

---

### Pitfall 2: NestJS Request-Scoped Tenant Context Breaking in Non-HTTP Contexts

**What goes wrong:** You implement multi-tenancy using NestJS REQUEST-scoped providers (injecting tenant context from the HTTP request). This works for REST endpoints. Then you add a Bull/BullMQ background job for grading or notification delivery, and `REQUEST` is undefined -- the job runs with no tenant context, either failing silently or operating on the wrong tenant's data.

**Why it happens:**
- NestJS REQUEST scope only exists during HTTP request lifecycle
- Background jobs (Bull queues), WebSocket gateways, Kafka consumers, and CRON jobs have no HTTP request
- REQUEST-scoped providers force the entire dependency chain to become request-scoped (scope bubbling), destroying singleton performance benefits

**Consequences:** Background grading processes wrong tenant's submissions. Notifications sent to wrong users. Performance degradation from scope bubbling across the entire DI tree.

**Prevention:**
- Do NOT use REQUEST-scoped providers for tenant context. Instead, use `AsyncLocalStorage` (Node.js CLS) to propagate tenant context across both HTTP and non-HTTP flows.
- For Bull jobs: serialize `tenantId` into the job payload. In the job processor, set the tenant context from the payload before any business logic.
- For Kafka consumers: include `tenantId` in every event message. Set context before processing.
- Create a `TenantContext` utility class that works identically regardless of entry point (HTTP, job, event).

**Detection:** Write a test that processes a Bull job and asserts the tenant context is correctly set. If this test does not exist, the bug will ship.

**Phase:** Phase 1 (MVP) architecture decision. If you start with REQUEST scope you will refactor later.

**Confidence:** HIGH -- documented in NestJS GitHub issues and multiple multi-tenancy blog posts.

---

### Pitfall 3: Quiz Auto-Save Data Loss on Browser Close / Network Loss

**What goes wrong:** A student is 45 minutes into a 60-minute exam. Their browser crashes, laptop dies, or WiFi drops. When they reopen the quiz, their answers are gone. They get a zero. Parents call the dean. The institution drops your LMS.

**Why it happens:**
- Auto-save interval is too long (e.g., every 60 seconds means up to 59 seconds of lost work)
- Auto-save uses a single endpoint that fails silently on network errors
- No client-side persistence as fallback
- Timer logic is purely client-side, so refreshing the page resets the timer
- Auto-submit on timeout depends on JavaScript executing (which does not happen if the tab is closed)

**Consequences:** Student grade disputes. Institutional loss of trust. The quiz engine is the most user-visible, highest-stakes component of an LMS.

**Prevention:**
- Save to `localStorage` after EVERY answer change (immediate, zero-latency backup)
- Debounced server sync every 10-15 seconds (not 60)
- On reconnection, merge localStorage state with server state (server is source of truth for timer, localStorage is source of truth for unsaved answers)
- Timer MUST be server-side. Store `quiz_attempt.started_at` and `quiz_attempt.duration_seconds` in the database. Calculate remaining time on every page load from the server.
- Auto-submit logic: a server-side CRON job that finalizes any attempt where `started_at + duration_seconds < NOW()` and status is still `in_progress`. Never rely solely on the client.
- Use `navigator.sendBeacon()` for a last-chance save on `beforeunload` event

**Detection:** Test by killing the browser process mid-quiz and verifying answers persist on reopen.

**Phase:** Phase 2 (Hardening) -- quiz engine implementation. But the database schema for attempts must support this from Phase 1.

**Confidence:** HIGH -- Moodle forum discussions document this exact failure pattern. Canvas student guides explicitly warn about it.

---

### Pitfall 4: Quiz Submission Race Conditions and Double-Grading

**What goes wrong:** Student clicks "Submit" twice quickly, or auto-submit fires while manual submit is in-flight. Two submissions are created. Both get graded. The gradebook shows conflicting scores, or the student exploits the race to submit different answers.

**Why it happens:**
- No idempotency on the submission endpoint
- No optimistic locking on the quiz attempt record
- Auto-submit CRON job and manual submit endpoint both try to finalize the same attempt concurrently

**Consequences:** Grade integrity compromised. Students discover they can exploit timing to change answers after deadline. Grading queue processes the same submission twice, wasting instructor time.

**Prevention:**
- Use a state machine for quiz attempts: `not_started -> in_progress -> submitted -> graded`. Transitions must be atomic (database transaction with `WHERE status = 'in_progress'` -- if zero rows updated, the transition already happened).
- Add a unique constraint or database-level lock to prevent two finalization operations on the same attempt.
- Submission endpoint returns the same response for duplicate calls (idempotent). Use the attempt ID as the idempotency key.
- Disable the submit button client-side immediately on click (defense in depth, not primary defense).

**Detection:** Load test the submission endpoint with concurrent requests for the same attempt. Assert exactly one submission is created.

**Phase:** Phase 2 (Hardening) -- quiz engine.

**Confidence:** HIGH -- race conditions in grading/submission are well-documented in web security literature.

---

### Pitfall 5: Over-Engineering the Analytics Pipeline as a Solo Developer

**What goes wrong:** You spend 3-4 weeks setting up Kafka + Zookeeper/KRaft + ClickHouse + a consumer service + schema registry + dead letter queues + retry logic before writing a single LMS feature. The pipeline works but is brittle. When it breaks at 2 AM, you are the only person who can fix it. Meanwhile, the core course-assignment-grading loop is still incomplete.

**Why it happens:**
- Resume-driven development: Kafka + ClickHouse sounds impressive
- Premature optimization: "we need real-time analytics from day one"
- Underestimating operational burden: Kafka requires partition management, consumer group rebalancing, offset tracking, and monitoring. ClickHouse requires merge management, disk monitoring, and query optimization.
- Ignoring the fact that with < 1000 users, PostgreSQL can handle the analytics queries

**Consequences:** MVP deadline missed. Core teaching workflow incomplete. Operational burden consumes development time. Analytics pipeline becomes the bottleneck instead of the differentiator.

**Prevention:**
- Phase 1 (MVP): Log events to a PostgreSQL `events` table. Simple, reliable, zero operational overhead. This handles up to ~10M events easily.
- Phase 2: When PostgreSQL event queries become slow (measure, do not guess), introduce ClickHouse with a simple batch ETL (pg_dump events -> ClickHouse import on a CRON schedule). This gives you 90% of the benefit with 10% of the complexity.
- Phase 3: Only introduce Kafka when you need real-time streaming AND have proven the analytics features are valuable to users.
- At every stage, ask: "If this breaks, can I fix it in 30 minutes while also supporting active users?"

**Detection:** If you have spent more than 1 week on infrastructure before core CRUD works end-to-end, you are over-engineering.

**Phase:** Defer Kafka to Phase 3 at earliest. Start analytics with PostgreSQL in Phase 1.

**Confidence:** HIGH -- widespread consensus in engineering community. The "start with a monolith" advice applies doubly for solo developers.

---

## Moderate Pitfalls

Mistakes that cause significant rework or performance problems but are recoverable.

---

### Pitfall 6: Permission System Grows Into an Unmanageable Mess

**What goes wrong:** You start with 3 roles (Student, Instructor, Admin). Then you need "Teaching Assistant" who can grade but not create assignments. Then "Department Head" who can view all courses in their department. Then "Auditor" who can view but not participate. Each new role requires touching dozens of guards and if-statements scattered across controllers.

**Why it happens:**
- Starting with hardcoded role checks (`if (user.role === 'admin')`) instead of a capability-based system
- Not separating "what can this role do?" from "what does this role own?"
- Mixing authorization logic into business logic
- Not anticipating that different tenants may want different role configurations

**Prevention:**
- Use CASL from day one. Define abilities centrally, not in each controller.
- Separate three concerns: (1) Role -> Abilities mapping (what a role CAN do), (2) Resource ownership (who OWNS this resource), (3) Tenant scoping (which tenant context). Each is a distinct layer.
- Store permission definitions in the database, not in code. This allows per-tenant role customization later.
- For resource-level checks (e.g., "can this instructor edit THIS course?"), use CASL conditions that match against the resource's `instructorId` or similar ownership field. Do not fetch the resource and then check -- let CASL generate the query condition.
- Keep a permissions matrix document that maps every API endpoint to its required ability. Review it when adding endpoints.

**Detection:** If you find yourself writing `if (user.role === 'X')` in a service file, the abstraction is leaking.

**Phase:** Phase 1 (MVP) must use CASL with a clean ability factory. Phase 2 (Hardening) adds resource-level ownership checks and the granular permission system.

**Confidence:** HIGH -- CASL documentation and NestJS authorization guides confirm this approach.

---

### Pitfall 7: File Upload Without Size Limits, Type Validation, or Multipart Support

**What goes wrong:** A student uploads a 4GB video as a "homework submission." The NestJS server buffers it in memory, runs out of RAM, and crashes -- taking down the LMS for all tenants. Or: someone uploads a `.exe` disguised as a `.pdf`, and another user downloads and runs it.

**Why it happens:**
- Default NestJS file upload (Multer) loads files into memory before writing to disk/S3
- No server-side file type validation (trusting the `Content-Type` header, which is trivially spoofed)
- No per-tenant storage quotas
- MinIO/S3 multipart upload not configured, so large files timeout or corrupt

**Consequences:** Server crashes (memory exhaustion). Storage costs explode. Potential security vectors through malicious file uploads.

**Prevention:**
- Stream uploads directly to MinIO/S3 using presigned URLs. The file never touches the NestJS server's memory. Client uploads directly to MinIO with a presigned PUT URL.
- Enforce file size limits at two layers: (1) Nginx/reverse proxy (client_max_body_size), (2) Presigned URL policy (conditions on content-length).
- Validate file types by reading magic bytes (file signatures), not the Content-Type header or file extension. Use a library like `file-type`.
- Set per-tenant storage quotas in the database. Check before issuing presigned URLs.
- For large files (videos): require multipart upload. MinIO supports this natively via the S3 multipart API.
- Organize S3 buckets by tenant: `/{tenant_id}/submissions/{assignment_id}/{filename}`. This makes per-tenant cleanup and quota enforcement trivial.

**Detection:** Load test with a 2GB upload. If the server's memory usage spikes, you are buffering.

**Phase:** Phase 1 (MVP) -- file upload is part of the assignment submission workflow.

**Confidence:** HIGH -- MinIO GitHub issues document timeout and corruption bugs with large uploads.

---

### Pitfall 8: ClickHouse Materialized View "Lies" and Deduplication Illusion

**What goes wrong:** You set up ClickHouse with ReplacingMergeTree for event deduplication and Materialized Views for pre-aggregated dashboards. Analytics dashboards show slightly wrong numbers. Sometimes an event is counted twice. After a server restart, counts jump because background merges had not completed.

**Why it happens:**
- ReplacingMergeTree only deduplicates during background merges, which happen on ClickHouse's own unpredictable schedule (10 minutes to hours)
- Materialized Views act as INSERT triggers -- they see raw inserted blocks, NOT the final deduplicated state
- Cascading Materialized Views compound the problem: MV2 reads from MV1's target table, but MV1 has not merged yet
- Using `SELECT ... FINAL` forces deduplication but is 10-50x slower on large tables

**Consequences:** Incorrect analytics (dashboard says 150 quiz completions, actual is 147). Loss of trust in the analytics system -- the supposed competitive differentiator.

**Prevention:**
- For the LMS event tracking use case, use `MergeTree` (not ReplacingMergeTree) for raw events. Events are append-only and immutable -- deduplication is not needed if your event producer is idempotent.
- Use `SummingMergeTree` or `AggregatingMergeTree` for Materialized View target tables that compute aggregates. These engines are designed for incremental aggregation and handle merges correctly.
- Never cascade Materialized Views beyond one level. If you need multi-stage aggregation, use scheduled batch queries instead.
- Accept eventual consistency for dashboards (seconds to minutes of delay is fine for LMS analytics). Do not try to make ClickHouse transactionally consistent.
- Deduplicate at the producer level (in Kafka or your event service), not in ClickHouse.

**Detection:** Compare a `SELECT count(*) FROM events` with `SELECT count(*) FROM events FINAL`. If the numbers differ significantly, you have a deduplication problem.

**Phase:** Phase 3 (Tracking) -- analytics implementation.

**Confidence:** HIGH -- ClickHouse official docs and multiple blog posts confirm these limitations.

---

### Pitfall 9: Tightly Coupling Grading Logic to Question Types

**What goes wrong:** You write grading logic as `if (questionType === 'mcq') { ... } else if (questionType === 'true_false') { ... }` inside the submission handler. Adding a new question type (matching, fill-in-the-blank, code execution) requires modifying the core grading flow, risking regression in existing question types.

**Why it happens:**
- Starting with only 2-3 question types and not anticipating growth
- Mixing question rendering, validation, and grading into one module
- No strategy pattern or plugin architecture

**Consequences:** Every new question type is a risky surgery on the grading engine. Testing becomes exponentially harder as types multiply.

**Prevention:**
- Define a `QuestionGrader` interface: `grade(question: Question, answer: Answer): GradeResult`
- Implement one grader per question type: `McqGrader`, `TrueFalseGrader`, `ShortAnswerGrader`, `EssayGrader` (which just marks as "needs manual review")
- Register graders in a map: `Map<QuestionType, QuestionGrader>`
- The grading engine iterates quiz answers and dispatches to the correct grader. It never knows the specifics of any question type.
- Store question configuration as a typed JSON column (`question_config: jsonb`), with a JSON Schema per question type for validation.

**Detection:** If adding a new question type requires modifying more than one file (the new grader + the grader registry), the coupling is too tight.

**Phase:** Phase 2 (Hardening) -- quiz engine design.

**Confidence:** MEDIUM -- this is a well-known software pattern, but specific to LMS quiz engines based on analysis of Moodle's architecture.

---

### Pitfall 10: Ignoring Time Zones in Due Dates and Quiz Timers

**What goes wrong:** An instructor in New York sets a due date of "Friday 11:59 PM." A student in California sees it as "Friday 8:59 PM" -- or worse, the server stores it as UTC and displays the raw UTC time, so neither the instructor nor student sees the correct local time. Submissions marked "late" that were actually on time.

**Why it happens:**
- Storing dates without timezone information
- Assuming all users are in the same timezone
- Mixing client-side and server-side time calculations
- Not specifying whose timezone the due date is in

**Consequences:** Grade disputes. Students penalized for "late" submissions that were on time in their timezone.

**Prevention:**
- Store ALL timestamps as UTC in the database (`TIMESTAMP WITH TIME ZONE` in PostgreSQL)
- Due dates are set by the instructor in THEIR timezone. Store the UTC equivalent and the original timezone. Display to students in the STUDENT's timezone.
- Quiz timer calculations happen server-side only. The client displays a countdown but never decides whether time is up.
- For multi-tenant: each institution (tenant) has a default timezone. Courses can override. Individual due dates always reference a specific timezone.

**Detection:** Create test fixtures with users in different timezones and verify due date display and late-submission logic.

**Phase:** Phase 1 (MVP) -- database schema and API design.

**Confidence:** HIGH -- universal web application concern, especially critical for education.

---

## Minor Pitfalls

Issues that cause developer frustration or minor UX problems but are fixable without rewrite.

---

### Pitfall 11: Not Handling Quiz Question Randomization Deterministically

**What goes wrong:** You randomize question order using `Math.random()` on each page load. Student refreshes the page mid-quiz, and questions appear in a different order. Their answers are now mapped to wrong questions, or their "current position" is lost.

**Prevention:**
- Generate a random seed per quiz attempt (store in `quiz_attempt.seed`). Use a seeded PRNG to generate the question order. Same seed = same order on every page load.
- Store the question order as a JSON array in the attempt record at creation time. Never regenerate it.

**Phase:** Phase 2 (Hardening).

---

### Pitfall 12: Audit Log Table Grows Unboundedly in PostgreSQL

**What goes wrong:** Every user action writes to an `audit_log` table. After 6 months, it has 50M rows. Queries on recent logs are slow. Backups take 3x longer. Disk usage alerts fire.

**Prevention:**
- Use PostgreSQL table partitioning by month from day one (`PARTITION BY RANGE (created_at)`)
- Define a retention policy: drop partitions older than N months
- For the analytics events table: this is an argument for moving to ClickHouse eventually, but partitioning buys you time in PostgreSQL

**Phase:** Phase 1 (MVP) -- schema design.

---

### Pitfall 13: WebSocket Notification Connections Not Tenant-Isolated

**What goes wrong:** Notification WebSocket channels are structured as `/notifications/{userId}` without tenant scoping. A malicious user guesses another user's ID and subscribes to their notification channel across tenants.

**Prevention:**
- Authenticate WebSocket connections with JWT on handshake
- Channel names include tenant: `/{tenantId}/notifications/{userId}`
- Validate that the JWT's tenant matches the channel's tenant on every connection

**Phase:** Phase 2 (Hardening) -- notification system.

---

### Pitfall 14: Discussion Board N+1 Queries with Nested Replies

**What goes wrong:** Discussion threads with nested replies are loaded with recursive queries or lazy-loaded N+1 patterns. A thread with 200 replies triggers 200+ database queries.

**Prevention:**
- Use adjacency list with a `path` column (materialized path pattern): `path = '1.5.12'` for reply 12 which is a child of 5 which is a child of 1. Load entire thread with `WHERE path LIKE '1.%'` in a single query.
- Limit nesting depth to 2-3 levels. Deeper nesting adds UX complexity with no value.
- Paginate at the top level, eager-load nested replies.

**Phase:** Phase 2 (Hardening) -- discussion board.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 (MVP) | Multi-tenancy | Tenant context leaking via connection pooling | Set tenant context in middleware on EVERY request; never trust pool state |
| Phase 1 (MVP) | Database schema | Not partitioning audit/event tables from the start | Use PostgreSQL partitioning by month from first migration |
| Phase 1 (MVP) | File uploads | Buffering uploads in server memory | Use presigned URLs for direct-to-MinIO uploads |
| Phase 1 (MVP) | Timestamps | Storing dates without timezone | Always use `TIMESTAMPTZ`; store instructor's timezone with due dates |
| Phase 2 (Hardening) | Permissions | Hardcoded role checks scattered across codebase | Use CASL ability factory; centralize all permission definitions |
| Phase 2 (Hardening) | Quiz engine | Auto-save only on server, no client fallback | localStorage + debounced server sync + server-side timer |
| Phase 2 (Hardening) | Quiz engine | Race conditions on concurrent submit | State machine with atomic transitions; idempotent submission endpoint |
| Phase 2 (Hardening) | Quiz engine | Question randomization changes on refresh | Store question order in attempt record with seeded PRNG |
| Phase 3 (Tracking) | Analytics | Premature Kafka adoption | Start with PostgreSQL events table; add ClickHouse via batch ETL when needed |
| Phase 3 (Tracking) | ClickHouse | ReplacingMergeTree deduplication illusion | Use MergeTree for append-only events; deduplicate at producer level |
| Phase 3 (Tracking) | ClickHouse | Cascading materialized views giving wrong numbers | Never cascade MVs beyond one level; accept eventual consistency |

---

## Solo Developer Meta-Pitfalls

These are not LMS-specific but are amplified by the solo developer constraint documented in PROJECT.md.

| Anti-Pattern | What Happens | Rule of Thumb |
|-------------|-------------|---------------|
| Premature microservices | You spend weeks on inter-service communication instead of features | Stay monolith until a specific service needs independent scaling |
| Infrastructure before features | Kafka/ClickHouse/K8s consume all your time | If core CRUD does not work end-to-end, stop building infrastructure |
| No feature flags | You cannot ship partial features; every deploy is all-or-nothing | Add a simple feature flag table from Phase 1 |
| No error monitoring | Production bugs are discovered by users, not by you | Add Sentry or equivalent in week 1 |
| Skipping automated tests on the quiz engine | Quiz edge cases are discovered by students during exams | Quiz engine needs the highest test coverage of any module |

---

## Sources

- [Postgres RLS Implementation Guide - Permit.io](https://www.permit.io/blog/postgres-rls-implementation-guide)
- [Multi-tenant data isolation with PostgreSQL RLS - AWS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [Row-level security in PostgreSQL for SaaS - MVP Factory](https://mvpfactory.io/blog/row-level-security-in-postgresql-multi-tenant-data-isolation-for-your-saas)
- [Schema-based multitenancy with NestJS - Thomas Vanderstraeten](https://thomasvds.com/schema-based-multitenancy-with-nest-js-type-orm-and-postgres-sql/)
- [NestJS Multi-Tenancy - Fabian Isele](https://fabian.ski/posts/nestjs-tenants/)
- [Why Kafka pipelines fail - Tinybird](https://www.tinybird.co/blog/why-kafka-pipelines-fail)
- [ClickHouse ReplacingMergeTree Deduplication Illusion](https://www.michal-drozd.com/en/blog/clickhouse-replacingmergetree-deduplication/)
- [ClickHouse Materialized Views Limitations - GlassFlow](https://www.glassflow.dev/blog/clickhouse-materialized-views)
- [Moodle Quiz Autosave Issues - Moodle.org Forum](https://moodle.org/mod/forum/discuss.php?d=449111)
- [RBAC Best Practices - Oso](https://www.osohq.com/learn/rbac-best-practices)
- [CASL with NestJS and Prisma - Dev Genius](https://blog.devgenius.io/mastering-complex-rbac-in-nestjs-integrating-casl-with-prisma-orm-for-granular-authorization-767941a05ef1)
- [Why Over-Engineering Happens - Yusuf Aytas](https://yusufaytas.com/why-over-engineering-happens/)
- [MinIO Large File Upload Issues - GitHub](https://github.com/minio/console/issues/1818)
