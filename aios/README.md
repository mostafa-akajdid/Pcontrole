# AIOS — Artificial Intelligence Operating System for Software Engineering

## What This Is

AIOS is a reusable engineering playbook that teaches any AI how to collaborate with a human to build world-class software using a professional engineering process.

It is not documentation. It is an operating system for AI collaboration.

## Who This Is For

Any AI model — ChatGPT, Claude, Gemini, Cursor, OpenCode, Copilot, or future systems — that needs to participate in building software with a human.

Any human who wants their AI collaborator to behave like a senior engineering team.

## What This Covers

- How to think before coding
- How to plan before implementing
- How to review before releasing
- How to communicate during every phase
- How to maintain quality across the entire lifecycle

## Core Principle

The human is the Product Owner. The AI is the Engineering Team.

The human defines what to build. The AI determines how to build it, validates that it works, and delivers it with documentation.

## The Workflow

Every task follows this sequence. No exceptions.

```
Understand → Analyze → Ask Questions → Plan → Architecture →
Break into Milestones → Implementation → Self Review →
Regression Review → Documentation → Release
```

## Reading Order

| Order | Document | Purpose |
|-------|----------|---------|
| 1 | [01-philosophy.md](./01-philosophy.md) | Engineering philosophy and workflow |
| 2 | [02-core-rules.md](./02-core-rules.md) | Golden rules — never break these |
| 3 | [03-ai-roles.md](./03-ai-roles.md) | Role definitions and multi-role simulation |
| 4 | [04-communication-protocol.md](./04-communication-protocol.md) | How to communicate during every phase |
| 5 | [05-planning-framework.md](./05-planning-framework.md) | Epics, milestones, tasks, estimation |
| 6 | [06-development-rules.md](./06-development-rules.md) | Engineering standards and quality gates |
| 7 | [07-review-process.md](./07-review-process.md) | Code review frameworks |
| 8 | [08-documentation-standards.md](./08-documentation-standards.md) | Documentation requirements |
| 9 | [09-release-process.md](./09-release-process.md) | Release workflow and checklist |
| 10 | [10-context-template.md](./10-context-template.md) | Project context template |

## Templates

Reusable templates for recurring engineering tasks:

| Template | Purpose |
|----------|---------|
| [templates/milestone-plan.md](./templates/milestone-plan.md) | Milestone planning template |
| [templates/task-breakdown.md](./templates/task-breakdown.md) | Task decomposition template |
| [templates/code-review.md](./templates/code-review.md) | Code review checklist |
| [templates/release-checklist.md](./templates/release-checklist.md) | Release validation checklist |
| [templates/adr.md](./templates/adr.md) | Architecture Decision Record |
| [templates/bug-report.md](./templates/bug-report.md) | Bug report template |
| [templates/feature-spec.md](./templates/feature-spec.md) | Feature specification template |

## Examples

Real engineering scenarios demonstrating AIOS in practice:

| Example | Purpose |
|---------|---------|
| [examples/new-module.md](./examples/new-module.md) | Adding a new module to an existing system |
| [examples/bug-fix.md](./examples/bug-fix.md) | Investigating and fixing a production bug |
| [examples/refactor.md](./examples/refactor.md) | Refactoring without breaking changes |
| [examples/performance-fix.md](./examples/performance-fix.md) | Performance investigation and optimization |

## How to Use This

1. Copy this `aios/` folder into any project
2. When starting work with an AI, point it to `aios/README.md`
3. The AI will internalize the workflow and follow it for every task
4. The human provides requirements and reviews outputs
5. The AI handles planning, implementation, verification, and documentation

## Version

- **Version:** 1.0.0
- **Date:** July 2026
- **Status:** Production Ready
