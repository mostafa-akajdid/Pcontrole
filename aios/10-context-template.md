# 10 — Context Template

## Purpose

Before any AI begins work on a project, it must understand the project. This template defines what the AI needs to know.

The human fills in this template once. The AI reads it at the start of every session. This eliminates the "ramp-up" phase where the AI asks basic questions about the project.

## How to Use This Template

1. Copy this template into your project as `PROJECT_CONTEXT.md`
2. Fill in every section
3. Point the AI to this file at the start of every session
4. Update it when the project changes significantly

## The Template

```markdown
# Project Context

## Project Overview

**Name:** [Project name]
**Type:** [Web app / Mobile app / SaaS / CMS / API / Library / CLI / Desktop]
**Stage:** [Prototype / Alpha / Beta / Production / Maintenance]
**Version:** [Current version]
**Status:** [Active development / Feature complete / Maintenance mode]

## Problem Statement

[What problem does this project solve? 2-3 sentences.]

## Target Users

[Who uses this system? What are their primary goals?]

## Tech Stack

### Frontend
- Framework: [e.g., React, Vue, Svelte, SwiftUI, Jetpack Compose]
- Language: [e.g., JavaScript, TypeScript, Kotlin, Swift]
- State Management: [e.g., Context, Redux, Zustand, Vuex]
- Styling: [e.g., Tailwind, CSS Modules, Styled Components]
- Build Tool: [e.g., Vite, Webpack, Xcode, Gradle]

### Backend
- Framework: [e.g., Express, FastAPI, Spring Boot, Rails]
- Language: [e.g., JavaScript, Python, Java, Ruby]
- Authentication: [e.g., JWT, Session, OAuth, Firebase Auth]
- ORM/Database Access: [e.g., Prisma, SQLAlchemy, ActiveRecord]

### Database
- Type: [e.g., PostgreSQL, MySQL, MongoDB, SQLite]
- Hosting: [e.g., Neon, Supabase, RDS, local]
- Version: [e.g., PostgreSQL 15]

### Infrastructure
- Hosting: [e.g., Vercel, AWS, Railway, self-hosted]
- CDN: [e.g., Cloudflare, CloudFront, none]
- File Storage: [e.g., S3, Cloudinary, local filesystem]
- Email: [e.g., SendGrid, SES, SMTP]

## Architecture

### High-Level Structure

[Describe the major components and how they interact.]

### Data Flow

[How does data move through the system?]

### Key Patterns

[List the architectural patterns used.]
- [e.g., MVC, MVVM, Service Layer, Event-Driven]
- [e.g., Repository Pattern, Unit of Work]
- [e.g., CQRS, Event Sourcing]

## Project Structure

[Key directories and their purposes.]

## Key Files

| File | Purpose |
|------|---------|
| [path] | [what it does] |
| [path] | [what it does] |
| [path] | [what it does] |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| [NAME] | Yes/No | [value] | [what it does] |

## Build and Run

```bash
# Setup
[command]

# Development
[command]

# Build
[command]

# Test
[command]

# Deploy
[command]
```

## Coding Conventions

### Language
- [e.g., JavaScript (no TypeScript)]
- [e.g., Functional components only]
- [e.g., No class components]

### Naming
- Files: [e.g., PascalCase for components, kebab-case for utilities]
- Variables: [e.g., camelCase]
- Constants: [e.g., UPPER_SNAKE_CASE]
- Components: [e.g., PascalCase]

### Patterns
- [e.g., All API routes use service layer]
- [e.g., Error handling via try/catch with errorResponse helper]
- [e.g., State managed via React Context]

## Constraints

### Do NOT
- [List things the AI must never do]
- [e.g., Do not modify the database schema without approval]
- [e.g., Do not add new dependencies without approval]
- [e.g., Do not change the authentication approach]

### Always
- [List things the AI must always do]
- [e.g., Always verify the build after changes]
- [e.g., Always update documentation]
- [e.g., Always use existing utility functions]

## Known Issues

| Issue | Severity | Status | Workaround |
|-------|----------|--------|------------|
| [description] | P0-P4 | Open/Fixed | [if any] |

## Technical Debt

| Item | Priority | Impact | Notes |
|------|----------|--------|-------|
| [description] | P0-P4 | [what it affects] | [context] |

## Team Conventions

### Git
- Branch naming: [e.g., feature/name, fix/name, docs/name]
- Commit messages: [e.g., conventional commits]
- PR process: [e.g., one reviewer, all checks pass]

### Code Review
- Reviewers: [who reviews]
- Checklist: [what is checked]
- Required: [what must pass]

## AI Session Start

When starting a new session, the AI should:

1. Read this file
2. Read the most recent changelog
3. Read any open task descriptions
4. Ask the human what they want to work on
5. Begin the workflow from [01-philosophy.md](../aios/01-philosophy.md)
```

## Completeness Guide

| Section | Importance | Notes |
|---------|-----------|-------|
| Project Overview | Critical | The AI must know what the project is |
| Tech Stack | Critical | The AI must know what tools are available |
| Architecture | Critical | The AI must understand the system structure |
| Project Structure | High | The AI must know where things live |
| Key Files | High | The AI must know the most important files |
| Environment Variables | High | The AI must know what configuration is needed |
| Build and Run | High | The AI must know how to build and test |
| Coding Conventions | High | The AI must know the style rules |
| Constraints | Critical | The AI must know what not to do |
| Known Issues | Medium | The AI should know existing problems |
| Technical Debt | Medium | The AI should know what needs improvement |
| Team Conventions | Medium | The AI should know process rules |

## See Also

- [01-philosophy.md](./01-philosophy.md) — The workflow this context feeds into
- [05-planning-framework.md](./05-planning-framework.md) — How to plan work given this context
- [06-development-rules.md](./06-development-rules.md) — Rules that apply given this context
