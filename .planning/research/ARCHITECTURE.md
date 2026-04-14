# Architecture Research

**Domain:** Learning Management System (LMS) -- multi-tenant, event-driven
**Researched:** 2026-04-14
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                    │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  React SPA (Vite + TailwindCSS)                                 │    │
│  │  Pages: Auth | Courses | Assignments | Quizzes | Discussions    │    │
│  └──────────────────────┬───────────────────────────────────────────┘    │
│                         │ HTTP / WebSocket                               │
├─────────────────────────┼────────────────────────────────────────────────┤
│                   API GATEWAY LAYER                                      │
│  ┌──────────────────────┴───────────────────────────────────────────┐    │
│  │  NestJS Application (Modular Monolith)                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │    │
│  │  │  Auth    │ │  Course  │ │  Quiz    │ │  Assignment      │   │    │
│  │  │  Module  │ │  Module  │ │  Engine  │ │  Module          │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │    │
│  │  │ File     │ │ Discuss- │ │ Notifi-  │ │  Event Tracking  │   │    │
│  │  │ Storage  │ │ ion      │ │ cation   │ │  Module          │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐    │    │
│  │  │ Tenant   │ │ Permis-  │ │  Shared: Guards, Pipes,      │    │    │
│  │  │ Module   │ │ sion     │ │  Interceptors, Filters       │    │    │
│  │  └──────────┘ └──────────┘ └──────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                    │              │              │                       │
├────────────────────┼──────────────┼──────────────┼───────────────────────┤
│               DATA & MESSAGING LAYER                                    │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐        │
│  │ PostgreSQL  │ │  Redis   │ │  MinIO   │ │  Kafka           │        │
│  │ (Primary DB)│ │  (Cache  │ │  (File   │ │  (Event Bus)     │        │
│  │             │ │   + WS)  │ │  Store)  │ │       │          │        │
│  └─────────────┘ └──────────┘ └──────────┘ └───────┼──────────┘        │
│                                                     │                   │
│                                              ┌──────┴──────────┐        │
│                                              │  ClickHouse     │        │
│                                              │  (Analytics DB) │        │
│                                              └─────────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Auth Module** | JWT auth, registration, login, token refresh, password reset | Redis (session/blacklist), PostgreSQL (users) |
| **Tenant Module** | Tenant context injection, RLS enforcement, tenant onboarding | PostgreSQL (RLS policies), every module (middleware) |
| **Permission Module** | RBAC + resource-level ownership checks via CASL | Auth Module, all resource modules |
| **Course Module** | Course CRUD, enrollment, semester/section management | Assignment, Quiz, Discussion modules |
| **Assignment Module** | Assignment creation, submission upload, grading workflow | File Storage, Notification, Course Module |
| **Quiz Engine** | Quiz creation, attempt state machine, auto-grading, manual grading queue | Redis (attempt state), PostgreSQL (results), Event Tracking |
| **Discussion Module** | Thread CRUD, nested replies, pin/close/moderate | Course Module, Notification |
| **File Storage Module** | Upload, download, presigned URLs, file metadata | MinIO (object storage), PostgreSQL (metadata) |
| **Notification Module** | In-app notification delivery, read/unread tracking | Redis (pub/sub for real-time), PostgreSQL (notification log) |
| **Event Tracking Module** | Capture all user actions, emit to Kafka | Kafka (producer), ClickHouse (consumer/sink) |
| **Shared Module** | Guards, pipes, interceptors, filters, decorators, base DTOs | Used by all modules |

## Recommended Project Structure

```
apps/
├── api/                          # NestJS backend
│   └── src/
│       ├── modules/
│       │   ├── auth/             # Authentication & JWT
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── strategies/   # Passport strategies
│       │   │   ├── guards/       # JWT guard, roles guard
│       │   │   └── dto/
│       │   ├── tenant/           # Multi-tenant context
│       │   │   ├── tenant.middleware.ts
│       │   │   ├── tenant.module.ts
│       │   │   └── tenant.service.ts
│       │   ├── permission/       # CASL ability factory
│       │   │   ├── permission.module.ts
│       │   │   ├── casl-ability.factory.ts
│       │   │   └── policies/     # Per-resource policy handlers
│       │   ├── user/             # User management
│       │   ├── course/           # Course + enrollment
│       │   ├── assignment/       # Assignments + submissions + grading
│       │   ├── quiz/             # Quiz engine (complex)
│       │   │   ├── quiz.module.ts
│       │   │   ├── quiz.controller.ts
│       │   │   ├── quiz.service.ts
│       │   │   ├── attempt.service.ts      # State machine for attempts
│       │   │   ├── grading.service.ts      # Auto + manual grading
│       │   │   ├── question-bank.service.ts
│       │   │   └── dto/
│       │   ├── discussion/       # Threads + replies
│       │   ├── file/             # MinIO abstraction
│       │   ├── notification/     # In-app notifications
│       │   ├── event-tracking/   # Kafka producer
│       │   └── analytics/        # ClickHouse queries
│       ├── common/               # Shared infrastructure
│       │   ├── decorators/       # @CurrentUser, @TenantId, @Roles
│       │   ├── guards/           # TenantGuard, PoliciesGuard
│       │   ├── interceptors/     # Logging, Transform, Timeout
│       │   ├── filters/          # Global exception filter
│       │   ├── pipes/            # Validation pipe config
│       │   └── interfaces/       # Shared TypeScript interfaces
│       ├── database/             # TypeORM config, migrations, seeds
│       │   ├── migrations/
│       │   ├── seeds/
│       │   └── entities/         # Base entity with tenant_id
│       ├── config/               # Environment config with validation
│       ├── app.module.ts
│       └── main.ts
│
├── web/                          # React frontend
│   └── src/
│       ├── pages/                # Route-level components
│       ├── features/             # Feature-sliced modules
│       │   ├── auth/
│       │   ├── courses/
│       │   ├── assignments/
│       │   ├── quizzes/
│       │   └── discussions/
│       ├── shared/               # Reusable UI components
│       ├── lib/                  # API client, utils
│       └── stores/               # Global state (Zustand)
│
├── analytics-worker/             # Kafka consumer -> ClickHouse (optional separate process)
│   └── src/
│       ├── consumers/            # Kafka consumer groups
│       └── transforms/           # Event -> ClickHouse row transforms
│
└── docker-compose.yml            # PostgreSQL, Redis, MinIO, Kafka, ClickHouse
```

### Structure Rationale

- **`modules/` per domain:** Each NestJS module encapsulates a bounded context. Modules expose only their service through the module's `exports`. No cross-module entity imports -- communicate through service interfaces.
- **`common/`:** Cross-cutting concerns (guards, decorators, interceptors) live here. Prevents duplication and ensures consistency.
- **`database/entities/`:** Centralized entity definitions with a `BaseTenantEntity` that includes `tenant_id`. TypeORM migrations generated from entity changes.
- **Separate `analytics-worker/`:** The Kafka consumer writing to ClickHouse should be a separate process (not the API server). This prevents ClickHouse insert latency from affecting API response times and allows independent scaling.
- **Monorepo layout (`apps/`):** A Turborepo or Nx monorepo is overkill for a solo developer. A simple `apps/` folder with shared `tsconfig` paths is sufficient. Add monorepo tooling only if build times become a problem.

## Architectural Patterns

### Pattern 1: Modular Monolith with Module Contracts

**What:** All NestJS modules live in one deployable process, but communicate only through exported service interfaces -- never direct entity/repository access across modules.
**When to use:** Solo developer, MVP through mid-scale. Extractions to microservices only if specific modules bottleneck.
**Trade-offs:** Simpler deployment and debugging vs. all modules share one process (a crash in one module brings down everything). Acceptable for solo dev.

**Example:**
```typescript
// course.module.ts -- only exports CourseService, not CourseRepository
@Module({
  imports: [TypeOrmModule.forFeature([Course, Enrollment])],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService], // Other modules depend on this interface only
})
export class CourseModule {}

// assignment.module.ts -- imports CourseModule to use CourseService
@Module({
  imports: [CourseModule, TypeOrmModule.forFeature([Assignment, Submission])],
  controllers: [AssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
```

### Pattern 2: Row-Level Security for Multi-Tenancy

**What:** PostgreSQL RLS policies enforce tenant isolation at the database level. A middleware sets `app.current_tenant_id` session variable on every request. Every table with tenant data has an RLS policy that filters by this variable.
**When to use:** Multi-tenant SaaS where data isolation is critical but separate schemas/databases per tenant are operationally expensive for a solo developer.
**Trade-offs:** Strong isolation guarantee at DB level (even raw SQL queries are filtered) vs. RLS adds slight query overhead and requires careful testing. Must remember to set the session variable before every query.

**Example:**
```sql
-- Migration: Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON courses
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

```typescript
// tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.user?.tenantId; // extracted from JWT
    if (tenantId) {
      await this.dataSource.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`
      );
    }
    next();
  }
}
```

### Pattern 3: Quiz Attempt State Machine

**What:** Quiz attempts follow a finite state machine: `NOT_STARTED -> IN_PROGRESS -> SUBMITTED -> GRADING -> GRADED`. State transitions are explicit, validated, and logged. In-progress state is cached in Redis for auto-save resilience.
**When to use:** Any assessment system where partial state, timeouts, and recovery from failure are required.
**Trade-offs:** More complex than simple CRUD but prevents data corruption from concurrent submissions, browser crashes, and timeout edge cases.

**State transitions:**
```
NOT_STARTED ──(start)──> IN_PROGRESS ──(submit)──> SUBMITTED
                  │                                     │
                  │──(timeout)──> SUBMITTED              │
                  │                                     ▼
                  │──(auto-save)──> IN_PROGRESS    GRADING
                                                       │
                                                       ▼
                                                    GRADED
```

**Implementation approach:**
```typescript
// Quiz attempt state stored in Redis for fast reads/writes during exam
// Key: quiz:attempt:{attemptId}
// Value: { answers: {...}, startedAt, remainingSeconds, currentQuestion }
// On submit or timeout: flush Redis state to PostgreSQL, delete Redis key
```

### Pattern 4: Event Sourcing for Analytics (Fire-and-Forget)

**What:** Every significant user action emits an event to Kafka. A separate consumer process writes batched events to ClickHouse. The API never waits for analytics writes.
**When to use:** When you need comprehensive user tracking without impacting API latency.
**Trade-offs:** Eventual consistency for analytics data (seconds of delay) vs. zero impact on user-facing performance.

**Key rule for ClickHouse:** Batch inserts. Never insert one row at a time. Buffer events in the Kafka consumer and flush to ClickHouse in batches of 1000+ rows or every 5 seconds, whichever comes first.

## Data Flow

### Request Flow (Standard CRUD)

```
Browser Request
    │
    ▼
NestJS Controller (route + validation via DTOs + class-validator)
    │
    ▼
Guards: JwtAuthGuard -> TenantGuard -> PoliciesGuard (CASL)
    │
    ▼
Service Layer (business logic, calls repository)
    │
    ▼
TypeORM Repository (SQL executed with RLS active)
    │
    ▼
PostgreSQL (RLS policy filters by tenant_id automatically)
    │
    ▼
Response DTO (class-transformer strips internal fields)
    │
    ▼
EventTrackingInterceptor (emits Kafka event AFTER response)
    │
    ▼
Response to Client
```

### Quiz Taking Flow (Stateful)

```
Student starts quiz
    │
    ▼
API creates attempt record (PostgreSQL) + caches initial state (Redis)
    │
    ▼
Student answers questions
    │ (every answer change)
    ▼
API writes to Redis (fast, auto-save)       ──> Kafka event emitted
    │
    ▼
Student submits OR timer expires
    │
    ▼
API flushes Redis state to PostgreSQL        ──> Kafka event emitted
    │
    ▼
Auto-grading runs for objective questions (synchronous)
    │
    ▼
Essay questions queued for manual grading (notification to instructor)
    │
    ▼
Instructor grades essays via grading queue
    │
    ▼
Final grade calculated, student notified     ──> Kafka event emitted
```

### Analytics Pipeline Flow

```
User actions in API
    │
    ▼
EventTrackingInterceptor / explicit service calls
    │
    ▼
Kafka Producer (topic: user-events)
    │
    ▼
analytics-worker (Kafka Consumer)
    │ (batches events, flushes every 5s or 1000 rows)
    ▼
ClickHouse (MergeTree table: raw_events)
    │
    ▼
Materialized Views (pre-aggregated metrics tables)
    │
    ▼
Analytics API queries ClickHouse for dashboards
```

### Notification Flow

```
Triggering event (submission graded, deadline approaching, etc.)
    │
    ▼
NotificationService.create(userId, type, payload)
    │
    ▼
PostgreSQL (persistent notification record)
    │
    ▼
Redis pub/sub (real-time push to connected WebSocket clients)
    │
    ▼
React frontend receives via WebSocket, updates notification bell
```

### Key Data Flows Summary

1. **Auth flow:** Login -> JWT issued (access + refresh) -> access token in Authorization header -> refresh via /auth/refresh endpoint. Redis stores token blacklist for logout.
2. **File upload flow:** Client requests presigned upload URL from API -> Client uploads directly to MinIO -> Client confirms upload -> API stores file metadata in PostgreSQL.
3. **Multi-tenant flow:** JWT contains `tenantId` -> TenantMiddleware extracts it -> Sets PostgreSQL session variable -> All queries auto-filtered by RLS.

## Data Model Overview

### Core Entities and Relationships

```
Tenant (1) ──────< (M) User
Tenant (1) ──────< (M) Course
User   (M) >─────< (M) Course          [via Enrollment: role=STUDENT|INSTRUCTOR]
Course (1) ──────< (M) Assignment
Course (1) ──────< (M) Quiz
Course (1) ──────< (M) DiscussionThread
Assignment (1) ──< (M) Submission       [one per student per assignment]
Submission (1) ──< (1) Grade
Quiz (1) ────────< (M) Question         [question bank per quiz]
Quiz (1) ────────< (M) QuizAttempt      [per student]
QuizAttempt (1) ─< (M) AttemptAnswer
User (1) ────────< (M) Notification
DiscussionThread (1) < (M) Reply        [nested via parent_reply_id]
```

### Base Entity Pattern

Every tenant-scoped entity extends a base:

```typescript
@Entity()
export abstract class BaseTenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### Multi-Tenancy Data Rules

- **Tenant table** itself has no RLS (admin-level queries only).
- **User** belongs to exactly one tenant. A person at two institutions = two user records.
- **Every other table** has `tenant_id` column with RLS policy.
- **Admin role** is scoped to a tenant (tenant admin, not platform admin). Platform admin is a separate concern (superadmin flag or separate table).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-500 users | Single server, all services in one NestJS process. PostgreSQL + Redis + MinIO on same machine or basic VPS. No Kafka -- use direct inserts to ClickHouse or even defer analytics entirely. |
| 500-10k users | Separate analytics-worker process. Add Kafka for decoupling. Add Redis caching for hot data (course listings, quiz state). Add connection pooling (PgBouncer). |
| 10k-100k users | Horizontal scaling: multiple API instances behind load balancer. Redis cluster for WebSocket state. Read replicas for PostgreSQL. ClickHouse handles this scale easily. |
| 100k+ users | Consider extracting Quiz Engine as separate service (most stateful/complex). Shard tenants across PostgreSQL instances. This is far beyond solo dev scope. |

### Scaling Priorities

1. **First bottleneck: PostgreSQL connections.** NestJS with TypeORM opens many connections. Add PgBouncer early. Use connection pool limits in TypeORM config (max: 20 for solo dev).
2. **Second bottleneck: Quiz engine under concurrent exams.** Many students submitting auto-save requests simultaneously. Redis handles this well, but ensure the flush-to-PostgreSQL path is batched.
3. **Third bottleneck: File uploads.** Direct-to-MinIO presigned uploads prevent the API from being a bottleneck. Never proxy file uploads through the API.

## Anti-Patterns

### Anti-Pattern 1: Cross-Module Repository Access

**What people do:** Import `CourseRepository` directly in `AssignmentModule` to query course data.
**Why it's wrong:** Creates tight coupling between modules. If Course entity schema changes, Assignment module breaks. Prevents future extraction.
**Do this instead:** Import `CourseModule` and inject `CourseService`. Define a service interface method like `courseService.findByIdForTenant(id)`.

### Anti-Pattern 2: Synchronous Analytics Writes

**What people do:** Write to ClickHouse inside the API request handler (await clickhouse.insert(...) before responding).
**Why it's wrong:** ClickHouse insert latency (even 50ms) adds up across every request. If ClickHouse is down, all API requests fail.
**Do this instead:** Fire-and-forget to Kafka. Let the analytics-worker handle inserts asynchronously. API response time stays fast regardless of analytics pipeline health.

### Anti-Pattern 3: File Upload Through API

**What people do:** Accept file in multipart form, buffer in Node.js memory, then forward to MinIO.
**Why it's wrong:** Node.js is single-threaded. Large files (video, PDF) block the event loop and consume memory proportional to file size.
**Do this instead:** Generate presigned upload URLs. Client uploads directly to MinIO. API only stores metadata after client confirms successful upload.

### Anti-Pattern 4: God Permission Guard

**What people do:** One giant guard with if/else chains for every role and resource combination.
**Why it's wrong:** Unmaintainable, error-prone, impossible to test exhaustively.
**Do this instead:** Use CASL ability factory. Define abilities per role declaratively. Use `@CheckPolicies()` decorator per endpoint with policy handler classes.

### Anti-Pattern 5: Storing Quiz State Only in PostgreSQL

**What people do:** Write every answer change directly to PostgreSQL.
**Why it's wrong:** During a timed quiz with 100 students, that is 100 concurrent write streams. PostgreSQL row locks on the attempt table cause contention.
**Do this instead:** Auto-save to Redis. Flush to PostgreSQL only on submit/timeout. Redis handles high-frequency writes without lock contention.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| MinIO | S3-compatible SDK (`@aws-sdk/client-s3`) | Use presigned URLs for upload/download. MinIO API is S3-compatible, so aws-sdk works directly. |
| Kafka | `@nestjs/microservices` KafkaJS transport | Producer in API process, consumer in analytics-worker. Use `ClientKafka` for producing. |
| ClickHouse | `@clickhouse/client` (official Node.js client) | Insert via JSON format in batches. Query via the same client for analytics API. |
| Redis | `@nestjs/cache-manager` + `ioredis` | Cache-manager for simple key-value caching. Raw ioredis for pub/sub (notifications) and quiz state. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Auth <-> All Modules | JWT Guard (passive) | Modules never call Auth service directly. They use `@UseGuards(JwtAuthGuard)` and `@CurrentUser()` decorator. |
| Course <-> Assignment/Quiz/Discussion | Service injection | Assignment/Quiz/Discussion modules import CourseModule and inject CourseService for enrollment checks. |
| Any Module <-> Event Tracking | Interceptor (automatic) or Service call (explicit) | Global interceptor captures all API calls. Specific events (quiz submit, grade posted) use explicit EventTrackingService calls. |
| API Process <-> Analytics Worker | Kafka topics | Fully decoupled. API produces to topic, worker consumes. No direct dependency. |
| Notification <-> All Modules | NotificationService injection | Modules call `notificationService.send()`. Notification module handles persistence + real-time delivery internally. |

## Suggested Build Order

Based on dependency analysis, the recommended build order for phases:

### Phase 1: Foundation (must come first)
1. **Database setup** -- PostgreSQL, TypeORM config, base entities, migration system
2. **Auth module** -- JWT, registration, login (everything depends on authenticated users)
3. **Tenant module** -- RLS setup, middleware (all data is tenant-scoped)
4. **Permission module** -- CASL setup, role definitions (all endpoints need authorization)

### Phase 2: Core Teaching Loop (the product's reason to exist)
5. **User module** -- Profiles, role assignment within tenant
6. **Course module** -- CRUD, enrollment (everything else hangs off courses)
7. **Assignment module** -- Create, submit, grade (core teaching loop)
8. **File storage module** -- MinIO integration, presigned URLs (needed by assignments)

### Phase 3: Assessment & Interaction
9. **Quiz engine** -- Question bank, attempt state machine, auto-grading, manual grading queue (most complex module, benefits from patterns established in Phase 2)
10. **Discussion module** -- Threads, replies, moderation (simpler, can parallelize with quiz)

### Phase 4: Communication & Tracking
11. **Notification module** -- In-app notifications, WebSocket real-time push
12. **Event tracking module** -- Kafka producer, event schema definition
13. **Analytics worker** -- Kafka consumer, ClickHouse sink, materialized views

### Phase 5: Analytics & Automation
14. **Analytics API** -- ClickHouse query endpoints for dashboards
15. **Rule engine** -- JSON-based automation rules (conditions + actions)
16. **Audit log** -- Structured logging of significant actions

**Rationale:** Each phase produces a usable increment. After Phase 2, you have a working LMS for basic teaching. After Phase 3, you have assessments. After Phase 4, users stay informed. Phase 5 is the differentiator (analytics + automation) but requires all prior phases as data sources.

## Sources

- [NestJS Official Docs - Kafka Microservices](https://docs.nestjs.com/microservices/kafka)
- [NestJS Official Docs - Authorization](https://docs.nestjs.com/security/authorization)
- [Modular Monolith in NestJS - Synapse Studios](https://docs.synapsestudios.com/implementation/frameworks/nest/modular-monolith)
- [Multi-Tenant RLS with NestJS and Prisma](https://js.elitedev.in/js/how-to-build-multi-tenant-saas-with-nestjs-prisma-and-postgresql-row-level-security/)
- [Schema-based Multitenancy with NestJS and TypeORM](https://thomasvds.com/schema-based-multitenancy-with-nest-js-type-orm-and-postgres-sql/)
- [AWS - Multi-tenant Data Isolation with PostgreSQL RLS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [CASL with NestJS and Prisma for Granular Authorization](https://blog.devgenius.io/mastering-complex-rbac-in-nestjs-integrating-casl-with-prisma-orm-for-granular-authorization-767941a05ef1)
- [ClickHouse - Building Product Analytics](https://clickhouse.com/blog/building-product-analytics-with-clickhouse)
- [Tinybird - Streaming Ingestion with ClickHouse](https://www.tinybird.co/blog/how-to-streaming-ingestion-clickhouse)
- [LMSPedia - LMS Architecture Explained](https://lmspedia.org/lms-architecture-explained/)
- [NestJS Clean Architecture (Feb 2026)](https://medium.com/@sebastian.iwanczyszyn/building-maintainable-nestjs-apps-with-clean-architecture-056248f04cef)

---
*Architecture research for: CClone LMS*
*Researched: 2026-04-14*
