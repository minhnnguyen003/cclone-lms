# Technology Stack

**Project:** CClone LMS
**Researched:** 2026-04-14
**Overall Confidence:** HIGH

## Recommended Stack

### Core Framework — Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| NestJS | ^11.1 | Backend framework | Modular architecture, decorator-based DI, first-class TypeScript, built-in support for WebSockets/microservices/queues. Solo dev benefits from convention-over-configuration. |
| Node.js | ^22 LTS | Runtime | Current LTS. NestJS 11 dropped Node 18 support. |
| TypeScript | ^5.7 | Language | Ships with NestJS 11. Strict mode recommended. |

### Core Framework — Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | ^19.2 | UI library | Stable, mature ecosystem. v19 concurrent features useful for quiz engine real-time state. |
| Vite | ^8.0 | Build tool | Rolldown-based bundler (10-30x faster builds). Native Tailwind integration. |
| TailwindCSS | ^4.2 | Styling | CSS-first config (no tailwind.config.js), 5x faster full builds, 100x faster incremental. Vite plugin ships natively. |
| React Router | ^7.14 | Routing | De facto standard. v7 includes Vite 8 support, type-safe routes. |

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16+ | Primary database | JSONB for quiz schemas, row-level security potential, mature ecosystem. Best relational DB for complex LMS data models. |
| Redis | 7+ | Cache + queues | Session cache, BullMQ job backend, Socket.IO adapter for horizontal scaling. |
| ClickHouse | Latest | Analytics OLAP | Column-oriented, sub-second aggregations on billions of events. Purpose-built for the event tracking pipeline. |

### ORM

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Prisma | ^7.3 | ORM + migrations | Schema-first design fits LMS domain modeling. v7 is pure TypeScript (no Rust engine), faster cold starts. Best DX with auto-generated types, Prisma Studio for debugging. NestJS has official recipe. |

**Why Prisma over Drizzle:** Drizzle is faster at raw queries, but Prisma's schema-first approach, migration tooling, and `@casl/prisma` integration for permission filtering are critical for an LMS with complex authorization. Solo dev productivity trumps microsecond query differences.

**Why not TypeORM:** Legacy patterns, poor TypeScript inference, decorator-heavy approach conflicts with Prisma's cleaner model. Community momentum has shifted away.

**Critical Prisma v7 config for NestJS:**
```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"  // Required: NestJS uses CommonJS
}
```

### Authentication & Authorization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @nestjs/passport | ^11.0 | Auth framework | NestJS-native Passport integration. Supports JWT, Local, OAuth strategies. |
| @nestjs/jwt | ^11.0 | JWT tokens | Access + refresh token pattern. Stateless auth with Redis blacklist for revocation. |
| passport-jwt | ^4.0 | JWT strategy | Standard Passport strategy for Bearer token validation. |
| bcrypt | ^5.1 | Password hashing | Industry standard. Use `bcryptjs` if native compilation is problematic. |
| @casl/ability | ^6.8 | Authorization | Attribute-based access control. Handles "instructor can edit own course" rules declaratively. |
| @casl/prisma | ^1.6 | Prisma + CASL | Translates CASL rules into Prisma `where` clauses for DB-level permission filtering. Essential for resource-level ownership checks. |

### File Upload & Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| minio | ^8.0 | S3-compatible client | Official MinIO JS SDK. Works with both MinIO (dev/self-hosted) and AWS S3 (production). |
| @nestjs/platform-express (Multer) | ^11.0 | File upload handling | Built into NestJS Express platform. Handles multipart/form-data, file size limits, MIME validation. |

**Approach:** Use Multer for upload handling, stream directly to MinIO via the `minio` SDK. Do NOT use `@aws-sdk/client-s3` — the `minio` package is lighter, purpose-built, and avoids AWS SDK bloat for a MinIO-first deployment.

### Real-Time Features

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @nestjs/websockets | ^11.0 | WebSocket framework | NestJS gateway abstraction. Decorators for events, rooms, namespaces. |
| @nestjs/platform-socket.io | ^11.0 | Socket.IO adapter | Auto-reconnection, room support, fallback to polling. Essential for quiz progress sync and notifications. |
| socket.io | ^4.8 | WebSocket engine | Battle-tested, handles reconnection gracefully. Redis adapter for multi-instance. |
| @socket.io/redis-adapter | ^8.0 | Scaling adapter | Distributes WebSocket events across multiple NestJS instances via Redis pub/sub. |

### Event Streaming & Analytics Pipeline

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @nestjs/event-emitter | ^3.0 | In-process events | Phase 1-2: lightweight event bus for decoupling without Kafka overhead. EventEmitter2 under the hood. |
| @nestjs/bullmq | ^11.0 | Job queues | Durable background jobs: email (future), file processing, analytics batch writes. Redis-backed. |
| bullmq | ^5.71 | Queue engine | Reliable job processing with retries, delayed jobs, rate limiting. |
| @confluentinc/kafka-javascript | ^1.8 | Kafka client | Phase 3 only. Replaces abandoned KafkaJS. Based on librdkafka, officially supported by Confluent. |
| @clickhouse/client | ^1.18 | ClickHouse client | Official Node.js client. HTTP-based, supports streaming inserts for high-throughput event ingestion. |

**Phased approach for events:**
1. **Phase 1-2 (MVP + Hardening):** Use `@nestjs/event-emitter` for in-process events + BullMQ for durable jobs. Write events to PostgreSQL `event_log` table. Batch-sync to ClickHouse via scheduled BullMQ jobs.
2. **Phase 3 (Tracking):** Introduce Kafka for real-time event streaming. Events flow: App -> Kafka -> ClickHouse consumer. Keep BullMQ for non-streaming jobs.

**Why NOT KafkaJS:** KafkaJS is unmaintained since February 2023. The `@confluentinc/kafka-javascript` package is the official replacement, based on librdkafka with KafkaJS-compatible API for easier migration.

### State Management (Frontend)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @tanstack/react-query | ^5.99 | Server state | Caching, deduplication, background refetch for API data. Eliminates 80% of state management needs. |
| zustand | ^5.0 | Client state | Lightweight (1.2kb), no boilerplate. UI state: sidebar open, quiz timer, modal state. |
| @tanstack/react-query-devtools | ^5.99 | Debug tools | Dev-only. Inspect cache, queries, mutations. |

**Why not Redux:** Overkill for this project. TanStack Query handles server state, Zustand handles UI state. No need for Redux middleware complexity.

### Forms & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-hook-form | ^7.72 | Form management | Performant (uncontrolled components), minimal re-renders. Quiz creation forms are complex — RHF handles dynamic fields well. |
| zod | ^3.24 | Schema validation | TypeScript-first validation. Shared between frontend (RHF resolver) and can inform backend DTOs. |
| class-validator | ^0.14 | Backend DTO validation | NestJS convention. Used with ValidationPipe for request validation. |
| class-transformer | ^0.5 | DTO transformation | Pairs with class-validator for NestJS pipe transformation. |

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | ^4.1 | Test runner (frontend) | Native Vite integration, 2-5x faster than Jest. Jest-compatible API. |
| Jest | ^29.7 | Test runner (backend) | NestJS ships with Jest config. Migrating NestJS to Vitest has decorator/metadata edge cases — not worth the effort for backend. |
| @nestjs/testing | ^11.0 | NestJS test utilities | Test module builder for DI-based unit/integration tests. |
| supertest | ^7.0 | E2E HTTP testing | Standard for NestJS e2e tests. Tests controllers through the full HTTP stack. |
| @testing-library/react | ^16.0 | Component testing | User-centric testing for React components. |

**Split strategy:** Vitest for frontend (natural Vite integration), Jest for backend (NestJS convention, avoids decorator mocking issues). Both use similar APIs so cognitive overhead is minimal.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @nestjs/config | ^4.0 | Environment config | Always. Type-safe env vars via ConfigService. |
| @nestjs/throttler | ^6.0 | Rate limiting | Always. Protect auth endpoints, file uploads, quiz submissions. |
| @nestjs/swagger | ^11.0 | API documentation | Always. Auto-generate OpenAPI spec from decorators. |
| @nestjs/schedule | ^5.0 | Cron jobs | Phase 2+. Deadline reminders, analytics batch sync. |
| dayjs | ^1.11 | Date handling | Always. Lightweight Moment.js replacement for due dates, timezones. |
| sharp | ^0.33 | Image processing | File uploads. Thumbnail generation for course images. |
| uuid | ^11.0 | ID generation | Always. UUIDs for entities, file naming. |
| helmet | ^8.0 | Security headers | Always. HTTP security headers middleware. |
| compression | ^1.8 | Response compression | Always. Gzip/Brotli for API responses. |
| axios | ^1.7 | HTTP client (frontend) | API calls. TanStack Query wraps axios for requests. |

### DevOps & Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker + Docker Compose | Latest | Local dev environment | Run PostgreSQL, Redis, MinIO, ClickHouse, Kafka locally. Reproducible setup. |
| ESLint | ^9.0 | Linting | Flat config format (eslint.config.js). NestJS + React presets. |
| Prettier | ^3.4 | Formatting | Consistent code style. Run via ESLint integration. |
| husky | ^9.0 | Git hooks | Pre-commit linting, pre-push tests. |
| lint-staged | ^15.0 | Staged file linting | Only lint changed files for fast commits. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| ORM | Prisma | Drizzle ORM | Drizzle faster at raw SQL but lacks schema-first DX, weaker migration tooling, no CASL integration for permission filtering |
| ORM | Prisma | TypeORM | Poor TypeScript inference, legacy patterns, community declining |
| State mgmt | Zustand | Redux Toolkit | Overkill for this project size. Solo dev doesn't need Redux middleware complexity |
| Kafka client | @confluentinc/kafka-javascript | KafkaJS | KafkaJS unmaintained since Feb 2023. Confluent client is official replacement |
| S3 client | minio SDK | @aws-sdk/client-s3 | AWS SDK is bloated (100+ packages). MinIO SDK is purpose-built, lighter, S3-compatible |
| CSS | TailwindCSS | CSS Modules | Tailwind faster for solo dev, utility-first eliminates naming debates, consistent design system |
| Testing (FE) | Vitest | Jest | Vitest is native to Vite, 2-5x faster. No reason to use Jest on frontend |
| Testing (BE) | Jest | Vitest | NestJS decorator metadata has edge cases with Vitest. Jest is the path of least resistance for backend |
| Queue | BullMQ | RabbitMQ | BullMQ reuses existing Redis infra. RabbitMQ adds another service to operate solo |

## Installation

```bash
# === Backend (NestJS) ===

# Core
npm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs

# Database
npm install prisma@latest @prisma/client@latest
npm install -D prisma

# Auth
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install @casl/ability @casl/prisma
npm install -D @types/passport-jwt @types/bcrypt

# File upload (Multer built into @nestjs/platform-express)
npm install minio
npm install -D @types/multer

# Real-time
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @socket.io/redis-adapter

# Queues & Events
npm install @nestjs/event-emitter @nestjs/bullmq bullmq

# Analytics (Phase 3)
npm install @clickhouse/client
npm install @confluentinc/kafka-javascript

# Utilities
npm install @nestjs/config @nestjs/throttler @nestjs/swagger @nestjs/schedule
npm install class-validator class-transformer
npm install dayjs sharp uuid helmet compression
npm install -D @types/uuid

# Testing
npm install -D jest @nestjs/testing supertest @types/jest ts-jest @types/supertest

# === Frontend (React + Vite) ===

# Core
npm install react react-dom react-router
npm install -D @vitejs/plugin-react vite typescript

# Styling
npm install -D tailwindcss @tailwindcss/vite

# State & Data
npm install @tanstack/react-query zustand axios
npm install -D @tanstack/react-query-devtools

# Forms
npm install react-hook-form zod @hookform/resolvers

# Real-time
npm install socket.io-client

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Version Confidence

| Technology | Version | Confidence | Verification Source |
|------------|---------|------------|---------------------|
| NestJS | ^11.1 | HIGH | npm registry (11.1.18 published 9 days ago) |
| React | ^19.2 | HIGH | npm registry, react.dev blog |
| Vite | ^8.0 | HIGH | vite.dev blog, npm registry |
| TailwindCSS | ^4.2 | HIGH | npm registry, tailwindcss.com |
| Prisma | ^7.3 | HIGH | npm registry, prisma.io blog |
| @tanstack/react-query | ^5.99 | HIGH | npm registry |
| Zustand | ^5.0 | HIGH | npm registry |
| Socket.IO | ^4.8 | HIGH | npm registry |
| BullMQ | ^5.71 | HIGH | npm registry, bullmq.io |
| @confluentinc/kafka-javascript | ^1.8 | HIGH | npm registry, confluent.io blog |
| @clickhouse/client | ^1.18 | HIGH | npm registry, clickhouse.com |
| Vitest | ^4.1 | HIGH | npm registry |
| @casl/ability | ^6.8 | HIGH | npm registry |
| minio | ^8.0 | HIGH | npm registry |
| React Router | ^7.14 | HIGH | npm registry |
| react-hook-form | ^7.72 | HIGH | npm registry |

## Sources

- [NestJS GitHub Releases](https://github.com/nestjs/nest/releases) — v11.1.18 confirmed
- [Prisma ORM 7.0 Announcement](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) — Pure TypeScript, no Rust engine
- [Prisma + NestJS Official Guide](https://www.prisma.io/docs/guides/frameworks/nestjs) — moduleFormat: "cjs" requirement
- [Vite 8 Announcement](https://vite.dev/blog/announcing-vite8) — Rolldown bundler
- [React 19.2 Blog](https://react.dev/blog/2025/10/01/react-19-2)
- [Confluent Kafka JavaScript GA](https://www.confluent.io/blog/introducing-confluent-kafka-javascript/) — KafkaJS replacement
- [KafkaJS Maintenance Issue](https://github.com/nestjs/nest/issues/13223) — Unmaintained since Feb 2023
- [NestJS Official Docs](https://docs.nestjs.com/) — Auth, WebSockets, Queues recipes
- [CASL Authorization](https://casl.js.org/v6/en/guide/install/) — ABAC library
- [BullMQ Docs for NestJS](https://docs.bullmq.io/guide/nestjs)
- [ClickHouse Node.js Client](https://github.com/ClickHouse/clickhouse-js)
- [TailwindCSS v4.2](https://tailwindcss.com/blog) — CSS-first config
- [Vitest 4.0 Announcement](https://vitest.dev/blog/vitest-4)
