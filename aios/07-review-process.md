# 07 — Review Process

## Why Review Exists

Code review is not about finding bugs — it is about ensuring the code is correct, maintainable, secure, and consistent. Bugs are a side effect of poor review. The primary purpose is quality assurance.

Every code change must be reviewed before it is considered complete. The AI reviews its own work. The human reviews the AI's work. Both reviews are mandatory.

## Review Types

### 1. Security Review

**Purpose:** Ensure no vulnerabilities are introduced.

**Checklist:**
- [ ] All inputs are validated at system boundaries
- [ ] No user input is used in queries without parameterization
- [ ] Authentication is required for all protected routes
- [ ] Authorization checks are in place for all operations
- [ ] CSRF protection is applied to state-changing operations
- [ ] Passwords are hashed with proper salt
- [ ] Secrets are not hardcoded or logged
- [ ] Security headers are configured
- [ ] Cookies have appropriate flags (httpOnly, secure, sameSite)
- [ ] No sensitive data is exposed in error messages
- [ ] No sensitive data is exposed in API responses
- [ ] Rate limiting is in place for authentication endpoints

**When to perform:** Every code change that touches authentication, authorization, data handling, or API endpoints.

### 2. Architecture Review

**Purpose:** Ensure changes fit the existing system architecture.

**Checklist:**
- [ ] New code follows existing patterns
- [ ] Module boundaries are respected
- [ ] No circular dependencies introduced
- [ ] Separation of concerns is maintained
- [ ] Public APIs are consistent with existing conventions
- [ ] Database changes are backward compatible
- [ ] New abstractions are justified (not over-engineering)
- [ ] Technology choices align with existing stack

**When to perform:** Every code change that adds new modules, modifies public interfaces, or changes data models.

### 3. Performance Review

**Purpose:** Ensure no performance degradation.

**Checklist:**
- [ ] No N+1 query patterns
- [ ] Database queries use appropriate indexes
- [ ] No unnecessary database calls in loops
- [ ] Large data sets are paginated
- [ ] Expensive computations are cached (if measured)
- [ ] No memory leaks (subscriptions, timers, event listeners cleaned up)
- [ ] No unnecessary re-renders (for UI frameworks)
- [ ] Bundle size impact is acceptable

**When to perform:** Every code change that touches data access, rendering, or computation.

### 4. Maintainability Review

**Purpose:** Ensure the code is easy to understand and modify.

**Checklist:**
- [ ] Functions are small and focused (< 20 lines ideal)
- [ ] Variables and functions have descriptive names
- [ ] No magic numbers or strings
- [ ] No deep nesting (> 3 levels)
- [ ] Code follows existing style conventions
- [ ] Complex logic has explanatory comments
- [ ] Error messages are descriptive
- [ ] No dead code paths

**When to perform:** Every code change.

### 5. Dead Code Review

**Purpose:** Ensure no unused code is introduced or left behind.

**Checklist:**
- [ ] No unused imports
- [ ] No unused variables
- [ ] No unused functions
- [ ] No unused files
- [ ] No commented-out code (unless documenting a specific decision)
- [ ] No unused dependencies
- [ ] No unreachable code paths

**When to perform:** Every code change, and periodically across the entire codebase.

### 6. Regression Review

**Purpose:** Ensure existing functionality is not broken.

**Checklist:**
- [ ] Existing tests still pass
- [ ] No public API changes without migration plan
- [ ] No database schema changes without migration
- [ ] No behavior changes in existing code paths
- [ ] Edge cases in existing code are not affected
- [ ] Error handling in existing code is not affected

**When to perform:** Every code change that modifies shared code, public interfaces, or core logic.

### 7. Naming Review

**Purpose:** Ensure all names are clear and consistent.

**Checklist:**
- [ ] Variable names describe their content
- [ ] Function names describe their action
- [ ] Component names describe their purpose
- [ ] File names follow project conventions
- [ ] Boolean variables use `is`, `has`, `should`, `can` prefix
- [ ] Constants use UPPER_SNAKE_CASE
- [ ] No abbreviations unless universally understood

**When to perform:** Every code change.

### 8. API Review

**Purpose:** Ensure API contracts are correct and consistent.

**Checklist:**
- [ ] HTTP methods are correct (GET, POST, PUT, DELETE)
- [ ] Status codes are appropriate (200, 201, 400, 401, 403, 404, 500)
- [ ] Response format is consistent with existing endpoints
- [ ] Error responses include useful information
- [ ] Request validation covers all required fields
- [ ] Response does not leak internal data
- [ ] Pagination is implemented for list endpoints
- [ ] Rate limiting is in place

**When to perform:** Every API endpoint change.

### 9. Database Review

**Purpose:** Ensure data integrity and performance.

**Checklist:**
- [ ] Schema changes are backward compatible
- [ ] Indexes are added for query patterns
- [ ] Foreign keys have appropriate on-delete behavior
- [ ] Soft delete is used where data retention is required
- [ ] Unique constraints are in place for business keys
- [ ] Migrations are reversible
- [ ] No data loss in migrations

**When to perform:** Every schema change.

### 10. Frontend Review

**Purpose:** Ensure UI quality and consistency.

**Checklist:**
- [ ] Loading states are implemented
- [ ] Error states are implemented
- [ ] Empty states are implemented
- [ ] Responsive design works on all target sizes
- [ ] Keyboard navigation works
- [ ] Focus management is correct
- [ ] Color contrast meets WCAG AA
- [ ] Images have alt text
- [ ] Interactive elements have accessible names
- [ ] Toast/notification messages are clear

**When to perform:** Every UI change.

### 11. Accessibility Review

**Purpose:** Ensure the application is usable by everyone.

**Checklist:**
- [ ] All images have descriptive alt text
- [ ] Interactive elements are keyboard accessible
- [ ] Focus order is logical
- [ ] ARIA labels are present on interactive elements
- [ ] Color is not the only way to convey information
- [ ] Form inputs have associated labels
- [ ] Error messages are associated with form fields
- [ ] Dynamic content changes are announced to screen readers

**When to perform:** Every UI change, and periodically across the entire application.

## Self-Review Process

The AI must review its own code before presenting it to the human. This is not optional.

### Step 1: Read Every Changed File

After making changes, read every file that was modified. Do not trust that the changes are correct — verify.

### Step 2: Apply Relevant Review Checklists

Based on what was changed, apply the relevant review types from the list above.

### Step 3: Run Quality Gates

Execute all applicable quality gates from [06-development-rules.md](./06-development-rules.md).

### Step 4: Document Findings

Report all findings using the Communication Protocol from [04-communication-protocol.md](./04-communication-protocol.md).

### Step 5: Fix Issues

Fix all issues found during self-review. If an issue cannot be fixed (e.g., it requires human decision), document it as a risk.

## Review Report Format

```
## Review Report

### Security Review
- [x] All inputs validated
- [x] Authentication required for protected routes
- [ ] Rate limiting not implemented (known limitation)

### Architecture Review
- [x] Follows existing patterns
- [x] No circular dependencies
- [x] Module boundaries respected

### Performance Review
- [x] No N+1 queries
- [x] Pagination implemented
- [x] No unnecessary re-renders

### Maintainability Review
- [x] Functions are focused (< 20 lines)
- [x] Names are descriptive
- [x] No magic numbers

### Regression Review
- [x] Existing tests pass
- [x] No public API changes
- [x] No behavior changes in existing paths

### Findings
- None

### Verdict
PASS — All applicable review criteria met.
```

## See Also

- [02-core-rules.md](./02-core-rules.md) — Golden rules enforced during review
- [06-development-rules.md](./06-development-rules.md) — Engineering standards reviewed against
- [08-documentation-standards.md](./08-documentation-standards.md) — Documentation review criteria
- [09-release-process.md](./09-release-process.md) — Release review gates
- [templates/code-review.md](./templates/code-review.md) — Reusable review template
