# Release Checklist

## Release: [Version]

### Pre-Release

- [ ] All planned features implemented
- [ ] All planned fixes applied
- [ ] No open P0 or P1 bugs
- [ ] All quality gates pass

### Build

- [ ] Production build succeeds
- [ ] Zero build errors
- [ ] Build warnings documented (if any)
- [ ] All pages/routes generated
- [ ] Bundle size acceptable

### Security

- [ ] Authentication working correctly
- [ ] Authorization enforced on all routes
- [ ] CSRF protection active
- [ ] Security headers configured
- [ ] No sensitive data exposed
- [ ] No hardcoded secrets
- [ ] Cookies have proper flags

### Performance

- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] No memory leaks detected
- [ ] No unnecessary network requests
- [ ] Database queries optimized

### API

- [ ] All endpoints documented
- [ ] Response format consistent
- [ ] Error responses clear
- [ ] Pagination working
- [ ] Rate limiting in place (if applicable)

### Database

- [ ] Schema changes migrated
- [ ] Migrations tested
- [ ] Backward compatibility verified
- [ ] Indexes in place
- [ ] Data integrity preserved

### UI

- [ ] All pages render correctly
- [ ] Responsive on all target sizes
- [ ] Loading states present
- [ ] Error states present
- [ ] Empty states present
- [ ] Forms validate correctly
- [ ] Toasts/notifications work

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Focus order is logical

### Documentation

- [ ] README updated
- [ ] API documentation current
- [ ] Changelog updated
- [ ] Deployment guide current
- [ ] Architecture docs current (if changed)
- [ ] All cross-references valid

### Dependencies

- [ ] No new dependencies without approval
- [ ] All dependencies up to date
- [ ] No known vulnerabilities
- [ ] Package lock file committed

### Git

- [ ] Working tree clean
- [ ] No TODO/FIXME in committed code
- [ ] No console.log in committed code
- [ ] No debug statements
- [ ] No temporary files
- [ ] Branch up to date with main

### Regression

- [ ] All existing tests pass
- [ ] Critical user flows verified
- [ ] API contracts preserved
- [ ] No breaking changes without migration
- [ ] Performance not degraded

### Final

- [ ] Release notes prepared
- [ ] Version number updated
- [ ] Human approval received
- [ ] Deployment plan confirmed
- [ ] Rollback plan documented
- [ ] Post-release monitoring planned

## Sign-Off

| Role | Name | Status | Date |
|------|------|--------|------|
| AI (Engineering Lead) | — | Complete | [date] |
| Human (Product Owner) | [name] | Approved | [date] |
