# Project Overview

## What is TASKILY CMS

TASKILY CMS is a full-stack content management system built with Next.js. It provides a modular admin dashboard for managing projects, blog posts, media files, users, roles, permissions, notifications, and system settings. The system is designed for teams that need a self-hosted, production-grade CMS without the overhead of a headless CMS API layer.

TASKILY is not a blog engine or a generic admin template. It is a purpose-built CMS where every module — from project management to audit logging — is implemented as a complete vertical slice: database schema, service layer, API route, and frontend interface.

---

## Project Goals

| Goal | Description |
|------|-------------|
| **Production Ready** | Security, performance, error handling, and RBAC are not aspirational — they are implemented and verified |
| **Modular Architecture** | Each feature module (Projects, Blogs, Media, Users, etc.) is isolated and independently maintainable |
| **Developer Maintainable** | Consistent patterns across all layers mean new developers can contribute without learning module-specific conventions |
| **Self-Hosted** | No external CMS service dependency. Database and storage are under your control |
| **Extensible** | Adding a new module follows a repeatable pattern with clear precedent in existing code |

---

## Project Philosophy

### Pattern Consistency Over Cleverness

Every API route follows the same request lifecycle. Every service follows the same static-method pattern. Every modal uses the same animation hook. This is intentional. The codebase prioritizes predictability over optimization.

### Service Layer as the Single Source of Truth

Business logic lives exclusively in `lib/services/`. API routes are thin controllers that parse requests, call services, and format responses. Frontend components never access the database directly.

### Security as Architecture, Not Afterthought

Authentication (HTTP-only cookies), authorization (RBAC with 62 permissions), CSRF protection (Double Submit Cookie pattern), security headers, and input validation (Zod) are structural components, not patches applied later.

### Soft Delete Everywhere

All major entities (users, projects, blogs, categories, media) support soft delete via `deletedAt` timestamps. This enables restore workflows, trash views, and audit trail preservation.

---

## Production Readiness

TASKILY CMS has completed a structured production hardening process across 6 milestones:

| Phase | Scope | Status |
|-------|-------|--------|
| Security Hardening | RBAC on all API routes, security headers, CSRF protection | Complete |
| Critical Production Fixes | JWT/cookie expiry sync, dashboard error isolation, useApi fixes | Complete |
| Security Round 2 | JWT consolidation (jose only), database indexes, audit log indexes | Complete |
| Dead Code Cleanup | Unused schemas, imports, dependencies removed; EventService errors logged | Complete |
| Shared Utilities | useDebounce, useModalAnimation, STATUS_COLORS, date formatters centralized | Complete |
| Final Code Quality | Duplicate getCategoryName, STATUS_STYLES, formatDistanceToNow consolidated | Complete |

**49 production review findings identified and resolved.**

---

## High-Level Features

### Content Management
- Project CRUD with categories, featured status, SEO metadata, image galleries
- Blog post CRUD with categories, featured status, rich text editing (TinyMCE)
- Bulk actions (publish, unpublish, delete, restore)
- Trash workflow with permanent delete

### Media Library
- Cloudinary-backed upload with folder organization
- Media picker modal for selecting existing uploads
- Storage breakdown analytics by file format
- Image reordering within projects and blogs

### User & Role Management
- Full user CRUD with status management (active, inactive, suspended)
- Role-based access control with 62 granular permissions across 12 modules
- Role cloning, permission assignment, force password change
- Admin password reset

### System Administration
- System configuration center (general, branding, email, SEO, social, localization, security, maintenance)
- Global search across all content types
- Notification system with real-time unread count
- Audit trail with detailed action logging, IP tracking, and user agent capture

### Dashboard
- Overview with stats, charts, recent activity, recent content
- Analytics views
- System health monitoring
- Activity timeline
- Role distribution visualization

---

## Completed Milestones

| Milestone | Description |
|-----------|-------------|
| 1 | Security Hardening — RBAC, security headers, CSRF |
| 2A | Critical Production Fixes — JWT sync, dashboard isolation, useApi |
| 2B | Performance & Reliability — Memoization, error isolation, timeouts |
| 3 | Security Round 2 — jose migration, database indexes, audit indexes |
| 4 | Dead Code Cleanup — Unused code, imports, dependencies removed |
| 5 | Shared Utilities — Centralized hooks, constants, formatters |
| 6 | Final Code Quality — Duplicate elimination, dead export removal |

---

## Current Version

**v1.0.0** — Production Release Candidate

- Next.js 14 (Pages Router)
- JavaScript (not TypeScript)
- PostgreSQL via Prisma ORM
- 60 API routes, 15 dashboard pages, 13 modals, 17 section components, 14 UI primitives

---

## Future Extensibility

The architecture is designed for extension. Adding a new module (e.g., "Events" or "FAQ") follows a predictable path:

1. Add models to `prisma/schema.prisma`
2. Create service class in `lib/services/`
3. Add API routes in `pages/api/`
4. Build dashboard page in `pages/dashboard/`
5. Add permissions to the seed script
6. Register in the global search service

Each new module automatically inherits RBAC, audit logging, soft delete, event-driven notifications, and the standard API response format — because these are implemented at the infrastructure layer, not per-module.
