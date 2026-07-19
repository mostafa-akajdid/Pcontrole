# TASKILY CMS — Documentation

## Documentation Index

| Document | Purpose |
|----------|---------|
| [01-project-overview.md](./01-project-overview.md) | What TASKILY is, goals, philosophy, features, milestones |
| [02-architecture.md](./02-architecture.md) | System architecture, data flow, design decisions |
| [03-folder-structure.md](./03-folder-structure.md) | Every folder and file, purpose and rules |
| [04-tech-stack.md](./04-tech-stack.md) | Every technology and why it was chosen |
| [05-coding-principles.md](./05-coding-principles.md) | Development rules and conventions |

---

## Reading Order

### For New Developers

Start here if you are joining the project for the first time:

1. **[01-project-overview.md](./01-project-overview.md)** — Understand what the project is and what it does
2. **[04-tech-stack.md](./04-tech-stack.md)** — Learn what technologies are used and why
3. **[03-folder-structure.md](./03-folder-structure.md)** — Understand where everything lives
4. **[02-architecture.md](./02-architecture.md)** — Understand how the system works end-to-end
5. **[05-coding-principles.md](./05-coding-principles.md)** — Learn the rules for writing code

### For Code Review

If you are reviewing code changes:

1. **[05-coding-principles.md](./05-coding-principles.md)** — Check against the coding rules
2. **[02-architecture.md](./02-architecture.md)** — Verify architectural consistency
3. **[03-folder-structure.md](./03-folder-structure.md)** — Verify files are in the right places

### For Bug Investigation

If you are debugging an issue:

1. **[02-architecture.md](./02-architecture.md)** — Understand the request lifecycle and data flow
2. **[03-folder-structure.md](./03-folder-structure.md)** — Find the relevant file
3. **[05-coding-principles.md](./05-coding-principles.md)** — Check error handling rules

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

---

## Last Updated

July 19, 2026

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

- **API Reference** — Endpoint-by-endpoint reference with request/response examples
- **Database Schema Reference** — Model-by-model documentation with relationships
- **Deployment Guide** — Step-by-step production deployment instructions
- **Environment Variables** — Complete reference for all `.env` variables
- **Contributing Guide** — Pull request process and code review checklist
- **Changelog** — Version-by-version change history
- **Testing Guide** — How to write and run tests
- **Performance Guide** — Optimization strategies and monitoring
