# TASKILY CMS — Documentation

## Documentation Index

| Document | Purpose |
|----------|---------|
| [01-project-overview.md](./01-project-overview.md) | What TASKILY is, goals, philosophy, features, milestones |
| [02-architecture.md](./02-architecture.md) | System architecture, data flow, design decisions |
| [03-folder-structure.md](./03-folder-structure.md) | Every folder and file, purpose and rules |
| [04-tech-stack.md](./04-tech-stack.md) | Every technology and why it was chosen |
| [05-coding-principles.md](./05-coding-principles.md) | Development rules and conventions |
| [06-api-reference.md](./06-api-reference.md) | Complete API endpoint reference with request/response examples |
| [07-authentication.md](./07-authentication.md) | JWT lifecycle, cookie strategy, CSRF, security |
| [08-permission-system.md](./08-permission-system.md) | RBAC, permissions, roles, authorization |
| [09-services.md](./09-services.md) | Service layer reference, all 16 services |
| [10-event-system.md](./10-event-system.md) | EventService, events, listeners, audit/notification integration |
| [11-database-reference.md](./11-database-reference.md) | PostgreSQL schema, all 14 Prisma models, relationships, indexes |
| [12-deployment-guide.md](./12-deployment-guide.md) | Step-by-step deployment, environment setup, Vercel and self-hosted |
| [13-environment-reference.md](./13-environment-reference.md) | Complete reference for all environment variables |
| [14-testing-guide.md](./14-testing-guide.md) | Testing methodology, checklists, matrices, pre-release verification |
| [15-contributing.md](./15-contributing.md) | Contributor guide, conventions, extension guides |
| [16-changelog.md](./16-changelog.md) | Complete version history (v1.0.0) |
| [17-architecture-decisions.md](./17-architecture-decisions.md) | Architecture Decision Records — WHY every decision was made |

---

## Reading Order

### For New Developers

Start here if you are joining the project for the first time:

1. **[01-project-overview.md](./01-project-overview.md)** — Understand what the project is and what it does
2. **[04-tech-stack.md](./04-tech-stack.md)** — Learn what technologies are used and why
3. **[03-folder-structure.md](./03-folder-structure.md)** — Understand where everything lives
4. **[02-architecture.md](./02-architecture.md)** — Understand how the system works end-to-end
5. **[05-coding-principles.md](./05-coding-principles.md)** — Learn the rules for writing code
6. **[07-authentication.md](./07-authentication.md)** — Understand the auth architecture
7. **[08-permission-system.md](./08-permission-system.md)** — Understand RBAC and permissions
8. **[13-environment-reference.md](./13-environment-reference.md)** — Know what environment variables are needed
9. **[17-architecture-decisions.md](./17-architecture-decisions.md)** — Understand WHY decisions were made

### For Backend Developers

1. **[06-api-reference.md](./06-api-reference.md)** — Complete API endpoint reference
2. **[09-services.md](./09-services.md)** — Service layer architecture and methods
3. **[10-event-system.md](./10-event-system.md)** — Event-driven architecture
4. **[11-database-reference.md](./11-database-reference.md)** — Database schema and relationships
5. **[07-authentication.md](./07-authentication.md)** — JWT and cookie strategy
6. **[08-permission-system.md](./08-permission-system.md)** — Permission system
7. **[15-contributing.md](./15-contributing.md)** — How to add new modules, services, endpoints

### For Frontend Developers

1. **[08-permission-system.md](./08-permission-system.md)** — usePermission hook, button-level protection
2. **[06-api-reference.md](./06-api-reference.md)** — API endpoints and response formats
3. **[07-authentication.md](./07-authentication.md)** — How auth flows work
4. **[15-contributing.md](./15-contributing.md)** — Component conventions, modal patterns

### For DevOps / Deployment

1. **[12-deployment-guide.md](./12-deployment-guide.md)** — Complete deployment instructions
2. **[13-environment-reference.md](./13-environment-reference.md)** — All environment variables
3. **[11-database-reference.md](./11-database-reference.md)** — Database setup and migration strategy
4. **[14-testing-guide.md](./14-testing-guide.md)** — Deployment verification checklists

### For QA / Testing

1. **[14-testing-guide.md](./14-testing-guide.md)** — Complete testing methodology and checklists
2. **[06-api-reference.md](./06-api-reference.md)** — API endpoint reference for test cases
3. **[08-permission-system.md](./08-permission-system.md)** — Permission matrix for RBAC tests

### For Technical Leads / Architects

1. **[17-architecture-decisions.md](./17-architecture-decisions.md)** — WHY every decision was made
2. **[02-architecture.md](./02-architecture.md)** — System architecture overview
3. **[16-changelog.md](./16-changelog.md)** — Complete project history
4. **[15-contributing.md](./15-contributing.md)** — Architecture rules that must never be broken

### For Code Review

If you are reviewing code changes:

1. **[05-coding-principles.md](./05-coding-principles.md)** — Check against the coding rules
2. **[02-architecture.md](./02-architecture.md)** — Verify architectural consistency
3. **[03-folder-structure.md](./03-folder-structure.md)** — Verify files are in the right places
4. **[15-contributing.md](./15-contributing.md)** — Code review checklist

### For Bug Investigation

If you are debugging an issue:

1. **[02-architecture.md](./02-architecture.md)** — Understand the request lifecycle and data flow
2. **[03-folder-structure.md](./03-folder-structure.md)** — Find the relevant file
3. **[05-coding-principles.md](./05-coding-principles.md)** — Check error handling rules
4. **[17-architecture-decisions.md](./17-architecture-decisions.md)** — Understand why the system works this way

---

## Project Status

| Field | Value |
|-------|-------|
| **Current Version** | v1.0.0 |
| **Status** | Production Release Candidate |
| **Framework** | Next.js 14 (Pages Router) |
| **Language** | JavaScript |
| **Database** | PostgreSQL (Neon) via Prisma 5 |
| **API Routes** | 60 endpoints |
| **Dashboard Pages** | 15 pages |
| **Components** | 63 components |
| **Services** | 16 service classes |
| **Permissions** | 62 across 12 modules |
| **Production Findings** | 49/49 resolved |
| **Documentation** | 17 files (Phases 1–3B) |

---

## Last Updated

July 19, 2026 (Documentation Version 1 complete)

---

## Related Documentation

| File | Location | Purpose |
|------|----------|---------|
| `PRODUCTION_REVIEW.md` | Project root | Full production audit with 49 findings |
| `README.md` | Project root | Project setup and quick start |
| `.env.example` | Project root | Environment variable template |

---

## Future Documentation

The following documentation could be added in future phases:

- **Performance Guide** — Optimization strategies and monitoring
- **API Client Guide** — Frontend data fetching patterns and hooks
- **Component Library** — Shared UI component documentation
- **Testing Guide (Automated)** — Vitest unit tests, Playwright E2E setup
- **Internationalization Guide** — Multi-language support
