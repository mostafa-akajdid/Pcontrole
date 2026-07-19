# 17 — Architecture Decisions

> Architecture Decision Records (ADR) explaining WHY every important
> technical decision was made in TASKILY CMS. Not how it works —
> why it exists.

---

## Table of Contents

- [ADR Format](#adr-format)
- [ADR-001: Next.js Pages Router](#adr-001-nextjs-pages-router)
- [ADR-002: JavaScript over TypeScript](#adr-002-javascript-over-typescript)
- [ADR-003: Prisma ORM](#adr-003-prisma-orm)
- [ADR-004: PostgreSQL (Neon)](#adr-004-postgresql-neon)
- [ADR-005: Service Layer Architecture](#adr-005-service-layer-architecture)
- [ADR-006: Event-Driven Architecture](#adr-006-event-driven-architecture)
- [ADR-007: JWT Authentication](#adr-007-jwt-authentication)
- [ADR-008: jose over jsonwebtoken](#adr-008-jose-over-jsonwebtoken)
- [ADR-009: HTTP-Only Cookies](#adr-009-http-only-cookies)
- [ADR-010: Double Submit Cookie CSRF](#adr-010-double-submit-cookie-csrf)
- [ADR-011: Middleware Authentication](#adr-011-middleware-authentication)
- [ADR-012: RBAC Authorization](#adr-012-rbac-authorization)
- [ADR-013: Audit Logs](#adr-013-audit-logs)
- [ADR-014: Notifications](#adr-014-notifications)
- [ADR-015: Soft Delete](#adr-015-soft-delete)
- [ADR-016: Cloudinary](#adr-016-cloudinary)
- [ADR-017: TinyMCE](#adr-017-tinymce)
- [ADR-018: Shared Utilities](#adr-018-shared-utilities)
- [ADR-019: Shared Validation (Zod)](#adr-019-shared-validation-zod)
- [ADR-020: Response Helpers](#adr-020-response-helpers)
- [ADR-021: Global Search Architecture](#adr-021-global-search-architecture)
- [ADR-022: Settings Cache](#adr-022-settings-cache)
- [ADR-023: Promise.allSettled in EventService](#adr-023-promiseallsettled-in-eventservice)
- [ADR-024: Dynamic Imports](#adr-024-dynamic-imports)
- [ADR-025: Security Headers](#adr-025-security-headers)
- [ADR-026: Folder Organization](#adr-026-folder-organization)
- [ADR-027: Modular CMS Architecture](#adr-027-modular-cms-architecture)
- [Decision Summary](#decision-summary)

---

## ADR Format

Each decision record follows this structure:

| Field | Description |
|---|---|
| **Problem** | What problem needed solving |
| **Alternatives considered** | Options evaluated |
| **Advantages** | Benefits of the chosen solution |
| **Disadvantages** | Costs and limitations |
| **Trade-offs** | What was sacrificed |
| **Why it fits TASKILY** | Specific reasons for this project |
| **Future evolution** | How this decision might change |
| **When to revisit** | Conditions that would trigger re-evaluation |

---

## ADR-001: Next.js Pages Router

**Status:** Accepted
**Date:** Project origin
**Related:** [04 — Tech Stack](./04-tech-stack.md)

### Problem

The project needs a full-stack framework that handles routing, API endpoints, server-side rendering, and middleware in a single codebase.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Next.js Pages Router** | Stable, well-documented, simple API routes, proven pattern | Older API, no React Server Components |
| Next.js App Router | React Server Components, streaming, layouts | Newer, evolving, steeper learning curve |
| Remix | Excellent conventions, nested routes | Smaller ecosystem, less mature |
| Express + React | Full control | Separate backend deployment, more infrastructure |
| Nuxt.js | Vue-based, good DX | Project uses React |

### Advantages

- Stable and battle-tested across thousands of production apps
- File-based routing is intuitive
- `pages/api/` provides simple serverless API routes
- Edge Runtime middleware is well-documented
- Large community and ecosystem

### Disadvantages

- No React Server Components (App Router feature)
- No parallel routes or intercepting routes
- `getStaticProps` / `getServerSideProps` patterns are older

### Trade-offs

Sacrificed RSC and streaming for stability and simplicity. Dashboard apps don't need streaming — they need reliability.

### Why It Fits TASKILY

A CMS dashboard doesn't benefit from RSC or streaming. The Pages Router provides everything needed: API routes, middleware, static generation, and a mature ecosystem. The team's familiarity with the pattern accelerates development.

### Future Evolution

Consider App Router migration when:
- App Router reaches LTS stability
- Team needs RSC for specific use cases
- Dashboard performance requires streaming

### When to Revisit

When Next.js officially deprecates Pages Router or when a specific feature requires App Router capabilities.

---

## ADR-002: JavaScript over TypeScript

**Status:** Accepted
**Date:** Project origin
**Related:** [04 — Tech Stack](./04-tech-stack.md)

### Problem

Choose a language for the entire codebase.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **JavaScript** | Zero config, faster iteration, no compilation step | No static type checking |
| TypeScript | Type safety, better IDE support, catches errors at compile time | Requires tsconfig, type annotations, slower initial development |

### Advantages

- Zero configuration overhead
- Faster prototyping and iteration
- Prisma generates types regardless of language
- Simpler build pipeline
- Lower barrier for contributors

### Disadvantages

- No compile-time type checking
- IDE support is less powerful without types
- Refactoring is riskier without type guarantees

### Trade-offs

Sacrificed type safety for development speed. For a project of this scope (~50 source files, single developer), the trade-off favors JavaScript.

### Why It Fits TASKILY

The project has ~50 source files maintained by a single developer. TypeScript's benefits scale with team size and codebase complexity. At this scale, JavaScript with Prisma's generated types provides sufficient developer experience.

### Future Evolution

TypeScript migration becomes valuable when:
- Team exceeds 3 developers
- Codebase exceeds ~100 source files
- Third-party contributors need type documentation

### When to Revisit

When onboarding new developers who expect TypeScript, or when the codebase reaches ~100 source files.

---

## ADR-003: Prisma ORM

**Status:** Accepted
**Date:** Project origin
**Related:** [04 — Tech Stack](./04-tech-stack.md), [11 — Database Reference](./11-database-reference.md)

### Problem

The application needs an ORM for database access, schema management, and type generation.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Prisma** | Schema-first, auto-generated types, excellent DX, visual studio | Vendor lock-in, less raw SQL control |
| Drizzle | SQL-like API, lightweight, fast | Less mature, fewer features |
| TypeORM | Decorator-based, familiar to Angular devs | Verbose, less intuitive schema |
| Knex.js | Flexible query builder | No schema management |
| Raw pg/node-postgres | Full control, no abstraction | Manual everything |

### Advantages

- Schema is the single source of truth
- Auto-generated TypeScript/JavaScript types
- `prisma db push` for rapid development
- `prisma studio` for visual database browsing
- First-class relation handling
- Excellent documentation

### Disadvantages

- Less control over generated SQL
- Vendor lock-in to Prisma ecosystem
- Schema-first approach requires discipline

### Trade-offs

Sacrificed raw SQL flexibility for developer experience and schema consistency.

### Why It Fits TASKILY

Prisma's schema-first approach enforces consistency across all 14 models. The auto-generated client eliminates manual type definitions. `prisma studio` provides instant database visibility without external tools.

### Future Evolution

Consider Drizzle if:
- Need more SQL control
- Want lighter dependency footprint
- Prisma introduces breaking changes

### When to Revisit

When Prisma's limitations block a specific use case, or when a lighter ORM would suffice.

---

## ADR-004: PostgreSQL (Neon)

**Status:** Accepted
**Date:** Project origin
**Related:** [04 — Tech Stack](./04-tech-stack.md), [12 — Deployment Guide](./12-deployment-guide.md)

### Problem

Choose a database for production data storage.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **PostgreSQL (Neon)** | Full PG feature set, serverless, branching, free tier | Vendor dependency |
| Supabase | PostgreSQL + realtime + auth | More features than needed |
| PlanetScale | MySQL, branching, serverless | MySQL, not PostgreSQL |
| SQLite | Zero config, embedded | No server-side capabilities |
| MongoDB | Flexible schema | Document DB; TASKILY data is relational |
| Self-hosted PG | Full control | Server management overhead |

### Advantages

- Serverless: no server management, scales to zero
- Branching: database branches for development
- Connection pooling: built-in PgBouncer
- Generous free tier for development
- Full PostgreSQL feature set

### Disadvantages

- Vendor dependency on Neon
- Cold start latency when scaled to zero
- Free tier limitations

### Trade-offs

Sacrificed self-hosting control for serverless convenience.

### Why It Fits TASKILY

Neon provides production PostgreSQL without infrastructure management. The free tier covers development and small production. Branching enables safe schema experimentation.

### Future Evolution

Consider self-hosted PostgreSQL when:
- Traffic exceeds Neon free tier
- Need for specific PostgreSQL extensions
- Regulatory requirements for data location

### When to Revisit

When Neon pricing becomes prohibitive, or when specific PostgreSQL features require self-hosting.

---

## ADR-005: Service Layer Architecture

**Status:** Accepted
**Date:** Milestone 1
**Related:** [02 — Architecture](./02-architecture.md), [09 — Services](./09-services.md), [05 — Coding Principles](./05-coding-principles.md)

### Problem

Business logic needs a dedicated layer separate from API routes and frontend components.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Service layer (static methods)** | Clear separation, testable, consistent pattern | Verbose for simple CRUD |
| Logic in API routes | Simpler, less files | Tightly coupled, untestable |
| Repository pattern | Clean data access | Extra abstraction layer |
| Domain-driven design | Rich domain models | Over-engineered for CMS |

### Advantages

- Single source of truth for business logic
- API routes become thin controllers
- Services are independently testable
- Event emission centralized in services
- Consistent pattern across all modules

### Disadvantages

- More files and boilerplate
- Static methods can't be easily mocked in some test frameworks
- Some duplication between similar services

### Trade-offs

Sacrificed simplicity for separation of concerns and testability.

### Why It Fits TASKILY

Every module follows the same service pattern: `findAll`, `findById`, `create`, `update`, `delete`, `restore`, `permanentDelete`, `bulkAction`. This consistency means new modules are predictable and developers only learn one pattern.

### Future Evolution

Consider instance-based services when:
- Need dependency injection
- Adding complex caching layers
- Migrating to TypeScript with interfaces

### When to Revisit

When testing patterns require mocking services, or when service complexity warrants dependency injection.

---

## ADR-006: Event-Driven Architecture

**Status:** Accepted
**Date:** Milestone 1
**Related:** [10 — Event System](./10-event-system.md)

### Problem

Side effects (audit logging, notifications, activity logging) should not be coupled to business logic.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **EventService (in-process pub/sub)** | Simple, no infrastructure, fast | No persistence, no retry |
| Message queue (RabbitMQ, Redis) | Persistent, retry, distributed | Infrastructure overhead |
| Database triggers | Automatic, no code | Hard to debug, limited logic |
| Middleware pattern | Express-style | Requires framework support |
| Direct calls in services | Simplest | Tightly coupled |

### Advantages

- Zero infrastructure requirements
- Services don't import each other
- New subscribers added without modifying publishers
- Fire-and-forget keeps API responses fast
- Audit logs and notifications are automatic

### Disadvantages

- No event persistence (lost on crash)
- No retry mechanism
- In-process only (no distributed events)
- Handler errors logged but not retried

### Trade-offs

Sacrificed reliability and persistence for simplicity and zero infrastructure.

### Why It Fits TASKILY

For a CMS, audit logging and notifications don't need guaranteed delivery. If an event is lost, the data still exists in the database. The simplicity of in-process events outweighs the reliability benefits of a message queue.

### Future Evolution

Consider a message queue when:
- Need guaranteed event delivery
- Events span multiple services
- Audit compliance requires event persistence

### When to Revisit

When regulatory requirements demand guaranteed audit trail, or when scaling to microservices.

---

## ADR-007: JWT Authentication

**Status:** Accepted
**Date:** Milestone 1
**Related:** [07 — Authentication](./07-authentication.md)

### Problem

The application needs stateless authentication that works with serverless deployment.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **JWT** | Stateless, scalable, standard | Cannot revoke, larger cookies |
| Session-based | Revocable, smaller tokens | Requires server-side storage |
| OAuth/Social | User convenience | External dependency, complexity |
| API keys | Simple | Not suitable for user auth |

### Advantages

- Stateless: no server-side session storage
- Scalable: works across serverless instances
- Standard: widely supported
- Configurable expiry
- Works with HTTP-only cookies

### Disadvantages

- Cannot revoke before expiry
- Token size affects cookie size
- Requires careful secret management

### Trade-offs

Sacrificed revocability for statelessness.

### Why It Fits TASKILY

Serverless deployment (Vercel) requires stateless auth. JWT in HTTP-only cookies provides the right balance of security and simplicity. Token expiry (configurable, default 7 days) limits exposure window.

### Future Evolution

Consider session-based auth when:
- Need immediate token revocation
- Implementing admin security features
- Compliance requires session management

### When to Revoke

When implementing account lockout, session management UI, or when regulatory requirements demand revocable sessions.

---

## ADR-008: jose over jsonwebtoken

**Status:** Accepted
**Date:** Milestone 3 (replaced jsonwebtoken)
**Related:** [07 — Authentication](./07-authentication.md), [04 — Tech Stack](./04-tech-stack.md)

### Problem

JWT operations must work in both Edge Runtime (middleware) and Node.js (API routes).

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **jose** | Edge Runtime compatible, universal, actively maintained | Different API than jsonwebtoken |
| jsonwebtoken | Familiar API, battle-tested | Node-only, doesn't work in Edge Runtime |
| jose + jsonwebtoken | Best of both | Two libraries, inconsistency |

### Advantages

- Works in Edge Runtime and Node.js
- Single library for all JWT operations
- Standards-compliant (JOSE)
- Actively maintained
- Smaller bundle size

### Disadvantages

- Different API from jsonwebtoken (learning curve)
- Newer library, less historical documentation

### Trade-offs

Sacrificed familiarity for universal compatibility.

### Why It Fits TASKILY

Next.js middleware runs in Edge Runtime, which cannot use Node.js-only libraries. `jose` is the only mature JWT library that works in both environments. Using a single library eliminates the inconsistency that previously existed.

### Future Evolution

No migration needed. `jose` is the standard for Edge Runtime JWT operations.

### When to Revisit

If Edge Runtime adds native JWT support, or if a more suitable library emerges.

---

## ADR-009: HTTP-Only Cookies

**Status:** Accepted
**Date:** Milestone 1
**Related:** [07 — Authentication](./07-authentication.md)

### Problem

JWT tokens must be stored securely, inaccessible to JavaScript.

### Alternatives Considered

| Option | XSS Risk | CSRF Risk | Mobile Support |
|---|---|---|---|
| **HTTP-only cookie** | Token inaccessible to JS | Sent automatically (needs CSRF) | Universal |
| localStorage | Token exposed to XSS | Not sent (no CSRF) | Inconsistent |
| sessionStorage | Token exposed to XSS | Not sent (no CSRF) | Inconsistent |
| Authorization header | Token in JS memory | Not sent (no CSRF) | Requires manual management |

### Advantages

- Token completely inaccessible to JavaScript
- Browser handles lifecycle automatically
- Works on all platforms
- Server controls expiry via MaxAge

### Disadvantages

- Sent automatically (requires CSRF protection)
- Cookie size limits (~4KB)
- Cannot be read by JavaScript for custom logic

### Trade-offs

Sacrificed convenience (can't read token in JS) for security (XSS can't steal token).

### Why It Fits TASKILY

The XSS risk of localStorage far outweighs the CSRF risk of cookies. CSRF is mitigated by the Double Submit Cookie pattern (ADR-010). HTTP-only cookies are the industry standard for secure token storage.

### Future Evolution

No migration needed. This is the correct security architecture.

### When to Revisit

Never. This is a security best practice.

---

## ADR-010: Double Submit Cookie CSRF

**Status:** Accepted
**Date:** Milestone 1
**Related:** [07 — Authentication](./07-authentication.md)

### Problem

HTTP-only cookies are sent automatically, creating CSRF vulnerability. Need protection without server-side sessions.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Double Submit Cookie** | No server-side state, simple | Relies on Same-Origin Policy |
| Synchronizer Token | Proven, battle-tested | Requires server-side session storage |
| SameSite cookie attribute | Browser-enforced | Not supported in all browsers (older) |
| Custom headers | Simple | Only works with CORS |

### Advantages

- No server-side state required
- Works with serverless deployment
- Simple implementation
- Proven security model

### Disadvantages

- Relies on Same-Origin Policy
- Subdomain attacks possible (mitigated by `sameSite: strict`)
- Slightly more complex than no CSRF protection

### Trade-offs

Sacrificed simplicity for stateless CSRF protection.

### Why It Fits TASKILY

Serverless deployment cannot maintain server-side sessions. The Double Submit pattern provides CSRF protection without session storage. The `csrf_token` cookie is readable by JavaScript (not httpOnly), and the `x-csrf-token` header must match. Attackers can force cookies but cannot read them (Same-Origin Policy).

### Future Evolution

Consider Synchronizer Token pattern when:
- Implementing server-side sessions
- Need stronger CSRF guarantees

### When to Revisit

When Same-Origin Policy bypasses are discovered, or when regulatory requirements demand stronger CSRF protection.

---

## ADR-011: Middleware Authentication

**Status:** Accepted
**Date:** Milestone 1
**Related:** [02 — Architecture](./02-architecture.md), [07 — Authentication](./07-authentication.md)

### Problem

JWT verification should happen before API routes execute, at the edge.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Edge Middleware** | Fast, before routes, Edge Runtime | Cannot access database |
| API route middleware | Can access DB | Duplicated in every route |
| Higher-order functions | Reusable | Still runs in API route context |
| Next.js `getServerSideProps` | Server-side | Only for pages, not API routes |

### Advantages

- Runs before every request
- Edge Runtime: sub-millisecond latency
- Centralized auth logic
- Prevents unauthenticated requests from reaching API routes
- CSRF validation at the edge

### Disadvantages

- Cannot access database (Edge Runtime limitation)
- Cannot do RBAC (requires user lookup from DB)
- Limited to JWT verification only

### Trade-offs

Sacrificed full authorization capability for speed and centralization. RBAC lives in API routes because middleware can't query the database.

### Why It Fits TASKILY

Middleware handles the two things it CAN do at the edge: JWT verification and CSRF validation. Authorization (RBAC) lives in API routes where the database is accessible. This separation is forced by Edge Runtime constraints and results in a clean two-layer security model.

### Future Evolution

Consider database-accessible middleware when:
- Next.js adds DB access to Edge Runtime
- Neon provides edge-compatible driver

### When to Revisit

When Edge Runtime gains database access capabilities.

---

## ADR-012: RBAC Authorization

**Status:** Accepted
**Date:** Milestone 1
**Related:** [08 — Permission System](./08-permission-system.md)

### Problem

Different users need different access levels. Authorization must be enforced in both backend and frontend.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **RBAC** | Industry standard, scalable, role-based | Less flexible than ABAC |
| ABAC | Attribute-based, very flexible | Complex, harder to implement |
| ACL | Fine-grained | Doesn't scale well |
| Hard-coded checks | Simple | Not configurable, not maintainable |

### Advantages

- Industry standard
- Roles group permissions logically
- 62 granular permissions across 12 modules
- Backend + frontend enforcement
- ADMIN bypass simplifies admin operations

### Disadvantages

- Role explosion if too many custom roles
- Permission checks duplicated in backend and frontend
- System roles cannot be modified

### Trade-offs

Sacrificed flexibility (ABAC) for simplicity and maintainability (RBAC).

### Why It Fits TASKILY

A CMS has clear user types: admins, editors, authors, viewers. RBAC maps naturally to these roles. 62 permissions provide fine-grained control without the complexity of attribute-based policies.

### Future Evolution

Consider ABAC when:
- Need conditional access (e.g., "only during business hours")
- Need resource-level attributes (e.g., "only own projects")
- Role count exceeds ~20

### When to Revisit

When permission requirements become too complex for role-based grouping.

---

## ADR-013: Audit Logs

**Status:** Accepted
**Date:** Milestone 1
**Related:** [02 — Architecture](./02-architecture.md), [10 — Event System](./10-event-system.md)

### Problem

Compliance and security require tracking every significant system action.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Event-driven audit** | Automatic, decoupled | May miss events |
| Manual logging in services | Explicit | Easy to forget, inconsistent |
| Database triggers | Automatic | Hard to customize |
| External audit service | Specialized | Cost, complexity |

### Advantages

- Automatic via event handlers
- Captures old/new values for diff tracking
- Includes IP address and user agent
- Decoupled from business logic
- Append-only, immutable

### Disadvantages

- Events may be lost on crash (no persistence)
- Requires event registration for each action
- Storage grows unbounded

### Trade-offs

Sacrificed guaranteed delivery for simplicity and zero infrastructure.

### Why It Fits TASKILY

Event-driven audit logging means every service automatically creates audit entries when events are emitted. No manual logging required. The audit trail includes everything needed for compliance: who, what, when, where (IP), and how (user agent).

### Future Evolution

Consider persistent event queue when:
- Regulatory compliance requires guaranteed audit trail
- Event replay capability needed

### When to Revisit

When audit compliance requirements exceed in-memory event reliability.

---

## ADR-014: Notifications

**Status:** Accepted
**Date:** Milestone 1
**Related:** [02 — Architecture](./02-architecture.md)

### Problem

Users need to be informed about relevant system events.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Database-backed notifications** | Persistent, queryable | No real-time push |
| WebSocket notifications | Real-time | Infrastructure complexity |
| Email notifications | Universal | SMTP configuration, cost |
| In-app + email | Comprehensive | Implementation complexity |

### Advantages

- Persistent (stored in database)
- User-scoped (each user sees only their notifications)
- Priority levels (LOW, MEDIUM, HIGH)
- Auto-generated via event handlers
- Unread count polling

### Disadvantages

- Not real-time (polling-based)
- No email integration (yet)
- Storage grows over time

### Trade-offs

Sacrificed real-time delivery for simplicity and persistence.

### Why It Fits TASKILY

A CMS dashboard benefits from persistent notifications that users can review at their own pace. Polling (every 30 seconds) provides near-real-time experience without WebSocket infrastructure. Email integration can be added later.

### Future Evolution

Consider WebSocket notifications when:
- Need true real-time delivery
- Implementing mobile push notifications

### When to Revisit

When users report missed notifications, or when real-time requirements become critical.

---

## ADR-015: Soft Delete

**Status:** Accepted
**Date:** Milestone 1
**Related:** [11 — Database Reference](./11-database-reference.md), [05 — Coding Principles](./05-coding-principles.md)

### Problem

Data should be recoverable after accidental deletion.

### Alternatives Considered | Option | Pros | Cons |
|---|---|---|
| **Soft delete (`deletedAt`)** | Recoverable, audit-friendly | Storage overhead, query complexity |
| Hard delete | Clean, no storage overhead | Data loss, no recovery |
| Archive table | Clean main table | Complex, data duplication |

### Advantages

- Data recoverable via restore
- Trash view for deleted items
- Audit trail preserved
- Categories can be reused after deletion
- No data loss from accidental clicks

### Disadvantages

- Queries must filter `deletedAt: null`
- Storage not reclaimed
- Unique constraints must include `deletedAt`
- Permanent delete requires extra step

### Trade-offs

Sacrificed storage efficiency for data safety.

### Why It Fits TASKILY

A CMS handles valuable content. Accidental deletion of a project or blog post could be costly. Soft delete provides a safety net with trash/restore workflow. The 7 soft-deletable models cover all user-managed entities.

### Future Evolution

Consider hard delete archival when:
- Storage costs become significant
- Compliance requires data deletion
- Trash items older than retention period

### When to Revisit

When storage optimization becomes a priority, or when GDPR "right to be forgotten" requires permanent deletion.

---

## ADR-016: Cloudinary

**Status:** Accepted
**Date:** Milestone 1
**Related:** [04 — Tech Stack](./04-tech-stack.md)

### Problem

File uploads need storage, CDN delivery, and image transformations.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Cloudinary** | CDN, transformations, generous free tier | Vendor dependency |
| AWS S3 + CloudFront | Full control, scalable | Complex setup, multiple services |
| Uploadthing | Simple, modern | Less proven |
| Firebase Storage | Google ecosystem | Vendor lock-in |
| Supabase Storage | Tied to Supabase | Less mature |

### Advantages

- Built-in CDN for global delivery
- On-the-fly image transformations
- Generous free tier (25GB storage, 25GB bandwidth)
- Simple API
- Admin dashboard for media management

### Disadvantages

- Vendor dependency
- Transformation costs at scale
- Less control than self-hosted

### Trade-offs

Sacrificed control for convenience and built-in CDN.

### Why It Fits TASKILY

Cloudinary provides everything needed: upload, transform, deliver. The free tier covers development and small production. No infrastructure to manage. The `CloudinaryService` abstracts all Cloudinary operations.

### Future Evolution

Consider AWS S3 when:
- Need full control over storage
- Exceed Cloudinary free tier
- Require specific S3 features

### When to Revisit

When Cloudinary costs exceed S3 costs, or when specific storage requirements emerge.

---

## ADR-017: TinyMCE

**Status:** Accepted
**Date:** Blog module implementation

### Problem

Blog posts and project descriptions need rich text editing.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **TinyMCE** | Industry standard, plugin ecosystem, clean HTML | Cloud dependency for premium plugins |
| Quill | Modern, lightweight | Less mature, smaller ecosystem |
| TipTap | Extensible, ProseMirror-based | Newer, less documentation |
| CKEditor | Feature-rich | Heavier, more complex |
| Markdown editor | Simple, version-control friendly | Not WYSIWYG |

### Advantages

- Industry-standard WYSIWYG editor
- Clean HTML output
- Plugin ecosystem
- Self-hostable
- Image upload integration

### Disadvantages

- Premium plugins require subscription
- Larger bundle size than alternatives
- Cloud dependency for some features

### Trade-offs

Sacrificed bundle size for editor quality and ecosystem.

### Why It Fits TASKILY

TinyMCE is the most widely used rich text editor. Content editors are familiar with it. The HTML output is clean and predictable. For a CMS, editor quality matters more than bundle size.

### Future Evolution

Consider TipTap when:
- Need more extensibility
- Want ProseMirror-based architecture
- TinyMCE costs become prohibitive

### When to Revisit

When TinyMCE licensing becomes expensive, or when a lighter editor meets requirements.

---

## ADR-018: Shared Utilities

**Status:** Accepted
**Date:** Milestone 5
**Related:** [05 — Coding Principles](./05-coding-principles.md)

### Problem

Utility functions were duplicated across multiple files.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Centralized `lib/utils.js`** | Single source, import everywhere | File can grow large |
| Per-module utils | Co-located with usage | Duplication |
| External utility library | Battle-tested | Unnecessary dependency |

### Advantages

- Single source of truth
- Consistent behavior across modules
- Reduced code duplication
- Easy to maintain and update
- Shared hooks in `hooks/` directory

### Disadvantages

- `lib/utils.js` can grow large
- Import path less obvious for new developers
- All utils loaded even if only one is used (mitigated by tree-shaking)

### Trade-offs

Sacrificed co-location for consistency.

### Why It Fits TASKILY

With 8+ modules using the same utilities (date formatting, status colors, slugification), centralization eliminates duplication and ensures consistency. Tree-shaking prevents unused utils from affecting bundle size.

### Future Evolution

Consider splitting utils into domain-specific files when:
- `lib/utils.js` exceeds ~200 lines
- Distinct domains emerge (auth utils, content utils, etc.)

### When to Revisit

When the utils file becomes difficult to navigate, or when distinct utility domains emerge.

---

## ADR-019: Shared Validation (Zod)

**Status:** Accepted
**Date:** Milestone 1
**Related:** [04 — Tech Stack](./04-tech-stack.md), [05 — Coding Principles](./05-coding-principles.md)

### Problem

API input validation needs to be consistent and reusable.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Zod** | Schema-first, excellent DX, lightweight | Newer library |
| Joi | Battle-tested, large community | Heavier, slower |
| Yup | Similar to Zod | Less maintained |
| express-validator | Express-specific | Not for Next.js API routes |
| Ajv | JSON Schema based | Less ergonomic |

### Advantages

- Schema-first: validation rules are declarative
- `safeParse()` returns structured errors
- Lightweight (small bundle)
- TypeScript-ready if migrated later
- Coercion support for query params

### Disadvantages

- Newer than Joi (less historical documentation)
- Smaller community than Joi
- Some advanced features require more code

### Trade-offs

Sacrificed community size for modern DX and bundle size.

### Why It Fits TASKILY

Zod's schema-first approach maps directly to the project's validation needs. 28 schemas in `lib/validation.js` cover all write endpoints. The `validateRequest()` helper standardizes error formatting.

### Future Evolution

No migration needed. Zod is the standard for modern JavaScript validation.

### When to Revisit

When Zod introduces breaking changes, or when validation requirements exceed Zod's capabilities.

---

## ADR-020: Response Helpers

**Status:** Accepted
**Date:** Milestone 1
**Related:** [05 — Coding Principles](./05-coding-principles.md), [06 — API Reference](./06-api-reference.md)

### Problem

API responses need consistent format across all 60 endpoints.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Response helper functions** | Consistent, DRY, type-safe | Extra abstraction |
| Raw `res.json()` | Simple, no abstraction | Inconsistent format |
| Response class | OOP approach | Over-engineered |

### Advantages

- Consistent `{ success, data, message }` format
- DRY: 9 helpers cover all response types
- `extractRequestMetadata()` standardizes audit data
- Easy to change response format globally

### Disadvantages

- Indirection: must check helper source to understand response
- Less flexible than raw responses

### Trade-offs

Sacrificed flexibility for consistency.

### Why It Fits TASKILY

With 60 API endpoints, consistent responses are critical for frontend reliability. The frontend `useApi` hook depends on the `{ success, data, message }` format. Response helpers ensure this contract.

### Future Evolution

Consider response class when:
- Need response middleware
- Adding response transformation
- Implementing API versioning

### When to Revisit

When response format needs to change globally, or when API versioning is implemented.

---

## ADR-021: Global Search Architecture

**Status:** Accepted
**Date:** Milestone 1
**Related:** [02 — Architecture](./02-architecture.md)

### Problem

Users need to search across all content types from a single interface.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Parallel queries across entities** | Simple, no external dependency | No relevance scoring |
| Elasticsearch | Powerful full-text search | Infrastructure overhead |
| PostgreSQL full-text search | Built-in, no extra service | Limited ranking |
| Algolia | Managed, fast | Vendor dependency, cost |

### Advantages

- No external infrastructure
- Works with existing Prisma queries
- Results grouped by entity type
- Simple implementation
- Zero cost

### Disadvantages

- No relevance scoring
- No full-text search optimization
- Performance depends on query count
- No search analytics

### Trade-offs

Sacrificed search quality for zero infrastructure.

### Why It Fits TASKILY

A CMS with <10,000 records doesn't need Elasticsearch. Parallel Prisma queries across 5 entity types return results in <200ms. The `CommandPalette` (Cmd+K) provides instant access.

### Future Evolution

Consider Elasticsearch when:
- Record count exceeds 100,000
- Need advanced full-text search
- Require search analytics

### When to Revisit

When search performance degrades, or when full-text search requirements exceed Prisma's capabilities.

---

## ADR-022: Settings Cache

**Status:** Accepted
**Date:** Milestone 1
**Related:** [02 — Architecture](./02-architecture.md)

### Problem

System settings are read frequently but updated rarely.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **In-memory cache** | Fast, simple | Not shared across instances |
| Redis cache | Shared, persistent | Infrastructure overhead |
| No cache | Simplest | Slow on every read |
| CDN cache | Fast for reads | Complex invalidation |

### Advantages

- Near-instant reads
- Simple implementation
- Auto-invalidation on update
- Zero infrastructure

### Disadvantages

- Not shared across serverless instances
- Cache miss on cold start
- Memory usage

### Trade-offs

Sacrificed cache sharing for simplicity.

### Why It Fits TASKILY

Settings are read on every page load but updated infrequently. In-memory cache eliminates database reads for 99% of requests. Cache miss on cold start is acceptable for serverless.

### Future Evolution

Consider Redis when:
- Need shared cache across instances
- Settings update frequently
- Require cache persistence

### When to Revisit

When cold start cache misses impact user experience, or when settings update frequency increases.

---

## ADR-023: Promise.allSettled in EventService

**Status:** Accepted
**Date:** Milestone 2B
**Related:** [10 — Event System](./10-event-system.md)

### Problem

One failing event handler should not block other handlers or the caller.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Promise.allSettled** | Individual failure isolation | Slower than Promise.all |
| Promise.all | Fast | One failure blocks all |
| Sequential await | Simple | Slow, one failure blocks rest |
| Fire-and-forget with catch | Fast | Only catches first error |

### Advantages

- Each handler runs independently
- One failure doesn't affect others
- All results available after completion
- Caller never blocked by handler errors

### Disadvantages

- Slightly slower than `Promise.all`
- Error details require inspection of results
- No automatic retry

### Trade-offs

Sacrificed speed for reliability.

### Why It Fits TASKILY

Event handlers create notifications, audit logs, and activity logs. If notification creation fails, audit logging should still proceed. `Promise.allSettled` ensures each handler completes independently.

### Future Evolution

No migration needed. This is the correct pattern for independent async operations.

### When to Revisit

Never. `Promise.allSettled` is the right tool for independent handler execution.

---

## ADR-024: Dynamic Imports

**Status:** Accepted
**Date:** Milestone 1
**Related:** [10 — Event System](./10-event-system.md)

### Problem

EventService handlers need to import NotificationService and AuditService, but those services import from EventService, creating circular dependencies.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Dynamic imports** | Breaks circular dependency | Slightly slower |
| Dependency injection | Clean architecture | Complex setup |
| Separate event bus module | Clear boundaries | Extra module |
| Avoid circular deps by design | Clean | Requires restructuring |

### Advantages

- Breaks circular dependency cleanly
- No restructuring required
- Lazy loading reduces initial bundle
- Standard JavaScript feature

### Disadvantages

- Dynamic import is async (must await)
- Less obvious than static imports
- IDE support may be limited

### Trade-offs

Sacrificed import clarity for dependency resolution.

### Why It Fits TASKILY

EventService is the central hub. Handlers need to import services that import EventService. Dynamic imports inside handlers break the cycle without architectural changes.

### Future Evolution

Consider dependency injection when:
- Handler count grows significantly
- Need explicit dependency management

### When to Revisit

When circular dependencies become a broader pattern, or when dynamic import performance becomes measurable.

---

## ADR-025: Security Headers

**Status:** Accepted
**Date:** Milestone 1
**Related:** [02 — Architecture](./02-architecture.md)

### Problem

HTTP responses need security headers to prevent common attacks.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **next.config.js headers** | Built-in, automatic, no middleware overhead | Limited to static headers |
| Middleware headers | Dynamic | Edge Runtime overhead |
| Reverse proxy headers | Offloads from app | Requires infrastructure |

### Advantages

- Applied to every response automatically
- No middleware overhead
- Production-only HSTS via conditional logic
- `poweredByHeader: false` removes framework fingerprint

### Disadvantages

- Static headers (can't vary per request)
- Must update `next.config.js` for changes

### Trade-offs

Sacrificed dynamic header capability for simplicity.

### Why It Fits TASKILY

The 7 security headers cover the OWASP recommended set. Static configuration in `next.config.js` is sufficient for a CMS dashboard. HSTS is conditionally added only in production.

### Future Evolution

Consider dynamic headers when:
- Need per-route security policies
- Implementing Content Security Policy (CSP)

### When to Revisit

When CSP is needed, or when security requirements exceed static header capabilities.

---

## ADR-026: Folder Organization

**Status:** Accepted
**Date:** Project origin
**Related:** [03 — Folder Structure](./03-folder-structure.md)

### Problem

A growing codebase needs predictable file locations.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Feature-based folders** | Co-location, discoverable | Cross-feature imports |
| Layer-based folders | Clear architecture boundaries | Scattered feature code |
| Domain-driven folders | Rich domain models | Over-engineered |

### Advantages

- Every file has a predictable location
- New developers can find files by convention
- `components/` organized by responsibility
- `lib/` contains all backend logic
- `pages/` follows Next.js conventions

### Disadvantages

- Feature code split across multiple folders
- Cross-feature imports can be confusing
- Large files in popular folders

### Trade-offs

Sacrificed feature co-location for architectural clarity.

### Why It Fits TASKILY

The layer-based approach (components, services, pages, lib) makes the architecture visible at the file system level. Every developer knows where to find and place files.

### Future Evolution

Consider feature-based organization when:
- Individual features become complex
- Team size exceeds 5 developers
- Feature isolation becomes critical

### When to Revisit

When cross-feature imports become the norm, or when team organization requires feature-based code ownership.

---

## ADR-027: Modular CMS Architecture

**Status:** Accepted
**Date:** Project origin
**Related:** [01 — Project Overview](./01-project-overview.md), [02 — Architecture](./02-architecture.md)

### Problem

The CMS needs to be extensible without modifying existing modules.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Modular vertical slices** | Independent, extensible, consistent | More files |
| Monolithic single file | Simple | Unmaintainable at scale |
| Plugin system | Highly extensible | Complex architecture |
| Microservices | Independent deployment | Infrastructure overhead |

### Advantages

- Each module is a complete vertical slice
- New modules follow the same pattern
- Modules inherit RBAC, audit, events automatically
- Independent development and testing
- Clear ownership boundaries

### Disadvantages

- More files and boilerplate
- Some duplication between similar modules
- Module interactions require event system

### Trade-offs

Sacrificed simplicity for extensibility.

### Why It Fits TASKILY

The modular architecture means adding a new module (e.g., "Events" or "FAQ") follows a 10-step checklist documented in [15 — Contributing Guide](./15-contributing.md). Every new module automatically gets RBAC, audit logging, notifications, soft delete, and the standard API response format — because these are implemented at the infrastructure layer.

### Future Evolution

Consider plugin system when:
- Third-party modules needed
- Module count exceeds ~20
- Need runtime module loading

### When to Revisit

When module interactions become too complex for events, or when third-party extensibility is required.

---

## Decision Summary

| # | Decision | Choice | Key Reason |
|---|---|---|---|
| 001 | Framework | Next.js Pages Router | Stability, simplicity |
| 002 | Language | JavaScript | Faster iteration |
| 003 | ORM | Prisma 5 | Schema-first, DX |
| 004 | Database | PostgreSQL (Neon) | Serverless, full PG |
| 005 | Architecture | Service layer | Separation of concerns |
| 006 | Side effects | Event-driven | Decoupling |
| 007 | Auth | JWT | Stateless, scalable |
| 008 | JWT library | jose | Edge Runtime compatible |
| 009 | Token storage | HTTP-only cookies | XSS protection |
| 010 | CSRF | Double Submit Cookie | Stateless protection |
| 011 | Auth verification | Edge Middleware | Speed, centralization |
| 012 | Authorization | RBAC | Industry standard |
| 013 | Audit | Event-driven logs | Automatic, decoupled |
| 014 | Notifications | Database-backed | Persistent, queryable |
| 015 | Deletion | Soft delete | Recoverable, safe |
| 016 | File storage | Cloudinary | CDN, transformations |
| 017 | Rich text | TinyMCE | Industry standard |
| 018 | Utilities | Centralized | Single source of truth |
| 019 | Validation | Zod | Schema-first, lightweight |
| 020 | API responses | Helper functions | Consistency |
| 021 | Search | Parallel queries | Zero infrastructure |
| 022 | Settings | In-memory cache | Fast, simple |
| 023 | Event errors | Promise.allSettled | Handler isolation |
| 024 | Circular deps | Dynamic imports | Clean resolution |
| 025 | Security headers | next.config.js | Automatic, zero overhead |
| 026 | File structure | Layer-based | Architectural clarity |
| 027 | CMS architecture | Modular vertical slices | Extensibility |

---

## See Also

- [02 — Architecture](./02-architecture.md) — System architecture overview
- [04 — Tech Stack](./04-tech-stack.md) — Technology choices
- [05 — Coding Principles](./05-coding-principles.md) — Development rules
- [16 — Changelog](./16-changelog.md) — When decisions were implemented
- [15 — Contributing](./15-contributing.md) — How to work within these decisions
