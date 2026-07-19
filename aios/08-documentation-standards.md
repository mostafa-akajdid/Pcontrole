# 08 — Documentation Standards

## Why Documentation Exists

Code tells you what the system does. Documentation tells you why it does it that way.

Without documentation, every new developer — including the AI in a future session — must reverse-engineer the reasoning behind every decision. This is expensive, error-prone, and wasteful.

Documentation is not optional. It is a deliverable.

## Documentation Types

### Architecture Documentation

**Purpose:** Explain how the system is structured and why.

**Contents:**
- System overview (high-level diagram)
- Module boundaries and responsibilities
- Data flow through the system
- Technology choices and rationale
- Security architecture
- Deployment architecture
- Scalability considerations

**When to write:** At project start, and whenever architecture changes.

**Format:**
```markdown
# System Architecture

## Overview
[1-paragraph description of what the system does]

## Data Flow
[Mermaid diagram showing how data moves through the system]

## Module Responsibilities
| Module | Responsibility | Dependencies |
|--------|---------------|-------------|
| ... | ... | ... |

## Technology Choices
| Decision | Choice | Rationale | Trade-offs |
|----------|--------|-----------|------------|
| ... | ... | ... | ... |
```

### API Documentation

**Purpose:** Explain how to interact with the system programmatically.

**Contents:**
- Authentication mechanism
- All endpoints with methods, paths, and descriptions
- Request/response formats with examples
- Error response formats
- Rate limiting details
- Pagination format
- Filtering and search parameters

**When to write:** For every API endpoint, updated when endpoints change.

**Format:**
```markdown
## POST /api/resource

### Description
Creates a new resource.

### Authentication
Required. Bearer token or cookie.

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ... | ... | ... | ... |

### Response (201)
{
  "success": true,
  "data": { ... }
}

### Errors
| Status | Message | When |
|--------|---------|------|
| 400 | Validation error | Invalid input |
| 401 | Unauthorized | No auth token |
| 403 | Forbidden | Insufficient permissions |
```

### Deployment Documentation

**Purpose:** Explain how to deploy and run the system.

**Contents:**
- Prerequisites
- Environment variables (all required and optional)
- Step-by-step deployment instructions
- Health check endpoints
- Monitoring setup
- Rollback procedures
- Troubleshooting guide

**When to write:** At project start, updated before every release.

### Testing Documentation

**Purpose:** Explain how to test the system.

**Contents:**
- How to run existing tests
- Test structure and conventions
- How to write new tests
- Test data management
- Manual testing procedures
- Regression testing checklist

**When to write:** When test infrastructure is set up, updated when testing approach changes.

### Architecture Decision Records (ADRs)

**Purpose:** Document why specific decisions were made.

**Contents:**
- The decision
- The context (what was the situation)
- The options considered
- The chosen option
- The rationale (why this option)
- The trade-offs (what was accepted)
- The consequences (what this means going forward)

**When to write:** Every time a significant decision is made.

**Format:** See [templates/adr.md](./templates/adr.md).

### Changelog

**Purpose:** Document what changed in each version.

**Contents:**
- Version number
- Date
- Added features
- Changed features
- Fixed bugs
- Removed features
- Security updates
- Breaking changes

**When to write:** Before every release.

**Format:**
```markdown
## [1.2.0] - 2026-07-19

### Added
- User profile management
- Bulk user import

### Changed
- Improved dashboard loading time by 40%

### Fixed
- Fixed pagination bug on user list page

### Security
- Updated authentication library to patch CVE-XXXX
```

### README

**Purpose:** The entry point for anyone encountering the project.

**Contents:**
- What the project is
- How to set it up
- How to run it
- How to contribute
- Where to find more information

**When to write:** At project start, updated as project evolves.

## Documentation Rules

### Write for the Reader

The reader is not you. The reader is someone who has never seen this code before — possibly an AI in a future session. Write for that person.

### Be Specific

"Add authentication" is not documentation. "Add JWT authentication using the jose library, with httpOnly cookies, CSRF double-submit pattern, and 7-day token expiry" is documentation.

### Cross-Reference

Every document should reference related documents. If architecture decisions affect the API, the API documentation should reference the architecture decision. Cross-references create a web of knowledge that is easy to navigate.

### Keep Updated

Outdated documentation is worse than no documentation. If documentation cannot be kept updated, do not write it — or mark it as explicitly outdated.

### Document Decisions, Not Just Outcomes

The outcome is what was built. The decision is why it was built that way. The decision is more valuable because it prevents re-litigation.

### Use Consistent Format

Every document type should have a consistent format. Use the templates in [templates/](./templates/) as starting points.

## Documentation Checklist

Before considering documentation complete:

- [ ] All public APIs are documented
- [ ] All architecture decisions are recorded
- [ ] Environment variables are documented
- [ ] Deployment steps are documented
- [ ] Testing procedures are documented
- [ ] README is up to date
- [ ] Changelog is updated
- [ ] All cross-references are valid

## Anti-Patterns

| Anti-Pattern | Problem | Correct Behavior |
|-------------|---------|-----------------|
| "I'll document later" | Documentation debt | Document now |
| "The code is self-documenting" | Only true for trivial code | Document decisions and reasoning |
| "It's obvious" | Obvious to you, not to others | Document anyway |
| Outdated docs | Misleading information | Update or remove |
| Duplicate docs | Divergence | Single source of truth |
| No docs | Knowledge loss | Write documentation |

## See Also

- [01-philosophy.md](./01-philosophy.md) — Why documentation is a phase, not an afterthought
- [06-development-rules.md](./06-development-rules.md) — Coding standards that support documentation
- [09-release-process.md](./09-release-process.md) — Documentation as a release gate
- [templates/adr.md](./templates/adr.md) — Architecture Decision Record template
