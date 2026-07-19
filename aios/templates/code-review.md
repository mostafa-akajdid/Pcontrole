# Code Review Checklist

## Review Information

- **Reviewer:** [AI / Human name]
- **Date:** [YYYY-MM-DD]
- **Files reviewed:** [count]
- **Change type:** [Feature / Fix / Refactor / Documentation]

## Security Review

- [ ] All inputs validated at system boundaries
- [ ] No user input used in queries without parameterization
- [ ] Authentication required for protected routes
- [ ] Authorization checks in place
- [ ] CSRF protection for state-changing operations
- [ ] Passwords hashed with proper salt
- [ ] No secrets hardcoded or logged
- [ ] Security headers configured
- [ ] Cookies have appropriate flags
- [ ] No sensitive data in error messages
- [ ] No sensitive data in API responses

## Architecture Review

- [ ] Follows existing patterns
- [ ] Module boundaries respected
- [ ] No circular dependencies
- [ ] Separation of concerns maintained
- [ ] Public APIs consistent with conventions
- [ ] New abstractions justified

## Performance Review

- [ ] No N+1 query patterns
- [ ] Database queries use appropriate indexes
- [ ] No unnecessary database calls in loops
- [ ] Large data sets paginated
- [ ] No memory leaks
- [ ] No unnecessary re-renders

## Maintainability Review

- [ ] Functions small and focused
- [ ] Variables and functions descriptively named
- [ ] No magic numbers or strings
- [ ] No deep nesting
- [ ] Follows codebase style conventions
- [ ] Complex logic has explanatory comments

## Dead Code Review

- [ ] No unused imports
- [ ] No unused variables
- [ ] No unused functions
- [ ] No unused files
- [ ] No commented-out code
- [ ] No unused dependencies

## Regression Review

- [ ] Existing tests pass
- [ ] No public API changes without migration
- [ ] No database schema changes without migration
- [ ] No behavior changes in existing code paths
- [ ] Error handling preserved

## Naming Review

- [ ] Variable names describe content
- [ ] Function names describe action
- [ ] Component names describe purpose
- [ ] File names follow conventions
- [ ] Booleans use is/has/should/can prefix
- [ ] Constants use UPPER_SNAKE_CASE

## API Review

- [ ] HTTP methods correct
- [ ] Status codes appropriate
- [ ] Response format consistent
- [ ] Error responses useful
- [ ] Request validation complete
- [ ] No internal data leaked
- [ ] Pagination for lists

## Database Review

- [ ] Schema changes backward compatible
- [ ] Indexes for query patterns
- [ ] Foreign keys have appropriate on-delete
- [ ] Soft delete where required
- [ ] Unique constraints for business keys
- [ ] Migrations reversible

## Frontend Review

- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented
- [ ] Responsive design works
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] Color contrast meets WCAG AA
- [ ] Images have alt text

## Findings

| # | File | Line | Severity | Description | Status |
|---|------|------|----------|-------------|--------|
| 1 | [file] | [line] | Critical/High/Medium/Low | [description] | Open/Fixed |

## Verdict

- [ ] **APPROVE** — All criteria met
- [ ] **APPROVE WITH NOTES** — Minor issues, non-blocking
- [ ] **REQUEST CHANGES** — Issues must be fixed before merge
- [ ] **REJECT** — Fundamental problems, rework needed

## Notes

[Additional context or observations.]
