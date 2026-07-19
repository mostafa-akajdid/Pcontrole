# 06 — Development Rules

## Engineering Standards

These are not suggestions. These are the rules that govern how code is written, reviewed, and maintained.

### Single Source of Truth

Every piece of information must have exactly one authoritative location.

If a value appears in two places, one must reference the other. If a configuration exists in two files, one must be the source and the other must read from it.

**Why:** Duplicated information diverges. When it diverges, bugs appear that are extremely difficult to diagnose because the code "looks correct" in both places.

**Enforcement:**
- Constants live in one file, imported everywhere
- Configuration lives in one file, referenced everywhere
- Type definitions live in one place, imported everywhere
- Business rules live in one service, called everywhere

### DRY (Don't Repeat Yourself)

Duplication is not just about code — it is about knowledge. If the same logic appears twice, the knowledge is duplicated. When the knowledge changes, one copy is updated and the other is not.

**Enforcement:**
- Extract repeated logic into shared functions
- Extract repeated patterns into shared components
- Extract repeated configurations into shared constants
- Extract repeated business rules into shared services

**Exception:** Acceptable duplication exists when:
- The two instances are likely to evolve independently
- Combining them would create an uncomfortable coupling
- The duplication is coincidental, not structural

### KISS (Keep It Simple, Stupid)

Simple code is easy to understand. Easy-to-understand code is easy to maintain. Easy-to-maintain code is easy to change. Code that is easy to change is code that can evolve.

**Enforcement:**
- Prefer linear code over clever abstractions
- Prefer explicit control flow over implicit magic
- Prefer flat structures over deep nesting
- Prefer clear names over concise names

### SOLID Principles

| Principle | Rule | Example |
|-----------|------|---------|
| Single Responsibility | One reason to change | A service handles one domain, not three |
| Open/Closed | Open for extension, closed for modification | Use interfaces/abstractions, not conditionals |
| Liskov Substitution | Subtypes must be substitutable | Derived classes must honor base class contracts |
| Interface Segregation | Many small interfaces over one large | Split fat interfaces into focused ones |
| Dependency Inversion | Depend on abstractions, not concretions | Inject dependencies, don't import implementations |

### Composition Over Inheritance

Compose behavior from small, focused units rather than building deep inheritance chains.

**Why:** Inheritance creates tight coupling. Composition creates flexible systems where behavior can be mixed, matched, and replaced.

**Enforcement:**
- Prefer function composition over class inheritance
- Prefer component composition over component inheritance
- Prefer hooks/composables over base classes
- Prefer strategy pattern over conditional logic

### Explicit Over Implicit

Code should do what it appears to do. Hidden behavior, magic numbers, implicit conversions, and undeclared dependencies are all enemies of understanding.

**Enforcement:**
- Name variables and functions descriptively
- Declare all dependencies explicitly
- Use constants instead of magic numbers
- Document non-obvious behavior in comments
- Return explicit error states, not null or undefined

### Consistency Over Cleverness

Clever code is code that makes you say "oh, that's smart." Consistent code is code that makes you say "I know exactly what this does."

Always choose the one you can understand in 6 months.

**Enforcement:**
- Follow existing codebase conventions
- Match the style of surrounding code
- Use established patterns, even if you would design differently
- Prefer boring solutions over novel ones

### Security First

Every line of code is a potential attack vector. Security is not a feature — it is a requirement.

**Enforcement:**
- Validate all inputs at system boundaries
- Sanitize all outputs displayed to users
- Use parameterized queries, never string concatenation
- Hash passwords with proper salt, never plain text
- Use httpOnly cookies for authentication tokens
- Implement CSRF protection for state-changing operations
- Apply the principle of least privilege
- Never log secrets or sensitive data

### Performance Second

Performance matters, but correctness matters more. First make it work, then make it fast.

**Enforcement:**
- Do not optimize until you have measured
- Do not add caching until you have proven the need
- Do not pre-optimize for scale you do not have
- Profile before optimizing
- Document performance decisions

### Developer Experience Third

Code is read more than it is written. Optimize for the reader.

**Enforcement:**
- Use descriptive names
- Write self-documenting code
- Keep functions small and focused
- Group related code together
- Provide clear error messages

### Maintainability Always

Every decision should consider the person who maintains the code next. That person might be you in 6 months, or a different developer entirely.

**Enforcement:**
- Document non-obvious decisions
- Write code that is easy to test
- Avoid frameworks that are not widely adopted
- Prefer standard library solutions over custom ones
- Leave the code better than you found it

## Coding Standards

### File Organization

```
file.jsx                    # One component per file
├── imports                 # External imports first
├── constants               # File-level constants
├── component/function      # Main export
└── helpers                 # Private helpers (if any)
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case or PascalCase | `user-service.js`, `UserProfile.jsx` |
| Components | PascalCase | `UserProfile`, `DashboardLayout` |
| Functions | camelCase | `getUserById`, `validateInput` |
| Variables | camelCase | `isActive`, `userCount` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Classes | PascalCase | `UserService`, `EventBus` |
| Interfaces | PascalCase with `I` prefix (if applicable) | `IRepository`, `IEventEmitter` |
| Booleans | `is`, `has`, `should`, `can` prefix | `isLoading`, `hasPermission` |

### Function Rules

- Functions should do one thing
- Functions should be small (ideal: < 20 lines)
- Functions should have fewer than 4 parameters
- Functions should not have side effects (unless documented)
- Functions should have clear input/output types
- Functions should handle errors, not propagate them silently

### Error Handling Rules

- Every external call must be wrapped in try/catch
- Errors must be logged with context
- Errors must be returned in a consistent format
- Never swallow errors silently
- Never catch and ignore — catch and handle or catch and rethrow
- Use specific error types when possible

### Import Rules

```
// 1. External packages
import React from 'react';
import { format } from 'date-fns';

// 2. Internal modules (absolute paths)
import { UserService } from '@/services';
import { validateInput } from '@/lib/validation';

// 3. Relative imports
import Button from '../ui/Button';
import './styles.css';
```

### Comment Rules

- Do not comment what the code does — make the code self-documenting
- Do comment why the code does what it does — the reasoning is not obvious
- Do comment workarounds — explain the problem being worked around
- Do comment non-obvious side effects
- Do not comment obvious code
- Do not leave stale comments

### Test Rules

- Test behavior, not implementation
- Test edge cases, not just happy paths
- Test error conditions
- Test boundary values
- Keep tests independent
- Keep tests fast
- Name tests descriptively
- One assertion per test (when practical)

## Quality Gates

Before any code change is considered complete:

| Gate | Check | Pass Criteria |
|------|-------|---------------|
| Build | `npm run build` or equivalent | Zero errors |
| Lint | `npm run lint` or equivalent | Zero errors (warnings acceptable with justification) |
| Tests | `npm run test` or equivalent | All tests pass |
| Type Check | `npm run typecheck` or equivalent | Zero type errors |
| Security | Manual review | No vulnerabilities introduced |
| Performance | Manual review | No obvious performance issues |
| Accessibility | Manual review | ARIA attributes, alt text, keyboard nav (if UI) |
| Documentation | Manual review | Changes documented |

## See Also

- [01-philosophy.md](./01-philosophy.md) — Why these rules exist
- [02-core-rules.md](./02-core-rules.md) — Golden rules that enforce these standards
- [03-ai-roles.md](./03-ai-roles.md) — Which role enforces which rule
- [07-review-process.md](./07-review-process.md) — How to review against these standards
- [08-documentation-standards.md](./08-documentation-standards.md) — Documentation requirements
