# 14 — Testing Guide

> Complete testing methodology for TASKILY CMS,
> covering manual testing workflows, regression matrices,
> security verification, and pre-release checklists.

---

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Environment](#testing-environment)
- [Manual Testing Workflow](#manual-testing-workflow)
- [Authentication Tests](#authentication-tests)
- [Authorization (RBAC) Tests](#authorization-rbac-tests)
- [CRUD Testing](#crud-testing)
- [Pagination, Filtering, Sorting & Search](#pagination-filtering-sorting--search)
- [Validation Testing](#validation-testing)
- [Media Upload Testing](#media-upload-testing)
- [Notification Testing](#notification-testing)
- [Audit Log Verification](#audit-log-verification)
- [Dashboard Verification](#dashboard-verification)
- [Settings Verification](#settings-verification)
- [Global Search Verification](#global-search-verification)
- [Security Verification](#security-verification)
- [Performance Verification](#performance-verification)
- [Accessibility Verification](#accessibility-verification)
- [Cross-Browser Verification](#cross-browser-verification)
- [Pre-Release Checklist](#pre-release-checklist)
- [Production Smoke Tests](#production-smoke-tests)
- [Deployment Verification Checklist](#deployment-verification-checklist)
- [Known Limitations](#known-limitations)
- [Future Automated Testing](#future-automated-testing)

---

## Testing Philosophy

TASKILY CMS currently relies on **manual testing** with structured checklists and regression matrices. This is appropriate for the project's current stage — a single-developer, pre-v1.0 CMS with a consistent pattern across all modules.

### Core Principles

| Principle | Description |
|---|---|
| **Pattern-based testing** | If Projects work, Blogs follow the same pattern. Test one module thoroughly, verify others by pattern. |
| **Security-first verification** | Authentication, authorization, and CSRF are tested before feature functionality. |
| **Regression prevention** | Every bug fix adds a checklist item to prevent recurrence. |
| **Production parity** | Test against a production-like environment (Neon database, Cloudinary, HTTPS). |

### Testing Pyramid

```mermaid
flowchart TD
    A["Production Smoke Tests"] --> B["Security Verification"]
    B --> C["Feature Regression"]
    C --> D["Module-Specific Tests"]
    D --> E["Edge Cases"]
    style A fill:#dc2626,color:#fff
    style B fill:#ea580c,color:#fff
    style C fill:#d97706,color:#fff
    style D fill:#2563eb,color:#fff
    style E fill:#7c3aed,color:#fff
```

---

## Testing Environment

### Prerequisites

| Requirement | Value |
|---|---|
| Node.js | ≥ 18.17.0 |
| Database | PostgreSQL (Neon) — use a test database, not production |
| Cloudinary | Test cloud name or dedicated test environment |
| Browser | Chrome (latest), Firefox (latest), Safari (latest) |
| Accounts | Admin, Editor, Author, Viewer — one per role |

### Test Database

```bash
# Create a separate test database on Neon
# Use a different DATABASE_URL in .env.local for testing
DATABASE_URL="postgresql://user:pass@host:5432/taskily_test?sslmode=require"

# Reset and seed before each full regression
npx prisma migrate reset
npx prisma db seed
```

### Default Test Accounts

| Role | Email | Password | Expected Access |
|---|---|---|---|
| Admin | admin@taskily.com | Admin123! | Full access to everything |
| Editor | (create via admin) | (set by admin) | Content management, no role/user mgmt |
| Author | (create via admin) | (set by admin) | Own content creation, read others |
| Viewer | (create via admin) | (set by admin) | Read-only access |

---

## Manual Testing Workflow

### Step-by-Step Process

```mermaid
flowchart TD
    A[Start Testing Session] --> B[Clear browser data]
    B --> C[Login as Admin]
    C --> D[Run Authentication Tests]
    D --> E{Pass?}
    E -->|No| F[File bug report]
    E -->|Yes| G[Run RBAC Tests]
    G --> H{Pass?}
    H -->|No| F
    H -->|Yes| I[Run CRUD Tests]
    I --> J[Run Security Tests]
    J --> K[Run Edge Case Tests]
    K --> L[Document results]
    L --> M[Run Regression on fixed bugs]
```

### Test Execution Order

1. **Authentication** — Can I log in? Is the token valid? Does logout work?
2. **Authorization** — Can each role access only what they should?
3. **CRUD** — Can I create, read, update, delete, restore each entity?
4. **Cross-cutting** — Pagination, search, filtering, validation, bulk actions
5. **Security** — CSRF, JWT expiry, middleware, headers
6. **Edge cases** — Empty states, concurrent edits, invalid inputs

---

## Authentication Tests

### Login Flow

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| A-01 | Successful login | Enter valid email + password → Submit | Redirects to `/dashboard`, `auth_token` cookie set | ☐ |
| A-02 | Invalid email | Enter non-existent email → Submit | Error: "Invalid email or password" | ☐ |
| A-03 | Invalid password | Enter valid email + wrong password → Submit | Error: "Invalid email or password" | ☐ |
| A-04 | Empty fields | Submit with empty email or password | Validation error displayed | ☐ |
| A-05 | Suspended user | Login as suspended user | Error: "Account is suspended" | ☐ |
| A-06 | Cookie persistence | Login → Close browser → Reopen | Still authenticated (cookie persists) | ☐ |
| A-07 | Token expiry | Login → Wait for `JWT_EXPIRES_IN` → Navigate | Redirected to login page | ☐ |

### Logout Flow

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| A-08 | Successful logout | Click logout button | Redirects to `/`, `auth_token` cookie cleared | ☐ |
| A-09 | Post-logout API call | Logout → Try to access `/api/projects` | 401 Unauthorized | ☐ |
| A-10 | Post-logout page | Logout → Try to visit `/dashboard` | Redirects to `/` | ☐ |

### Registration Flow

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| A-11 | Successful registration | Fill valid form → Submit | Account created, redirect to login or verification | ☐ |
| A-12 | Duplicate email | Register with existing email | Error: "Email already exists" | ☐ |
| A-13 | Weak password | Register with password < 8 chars | Validation error | ☐ |
| A-14 | Missing required fields | Submit incomplete form | Validation errors for each missing field | ☐ |

### Password Reset

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| A-15 | Forgot password | Enter email → Submit | Success message (even if email doesn't exist) | ☐ |
| A-16 | Reset with valid token | Click reset link → Enter new password | Password updated, can login with new password | ☐ |
| A-17 | Reset with expired token | Use expired reset token | Error: "Token expired" | ☐ |

---

## Authorization (RBAC) Tests

### Permission Matrix Verification

Test each role against every module. Use this matrix:

| Module | Action | ADMIN | EDITOR | AUTHOR | VIEWER |
|---|---|---|---|---|---|
| projects | create | ✅ | ✅ | ✅ | ❌ |
| projects | read | ✅ | ✅ | ✅ | ✅ |
| projects | update | ✅ | ✅ | ✅ (own) | ❌ |
| projects | delete | ✅ | ✅ | ❌ | ❌ |
| projects | publish | ✅ | ✅ | ❌ | ❌ |
| blogs | create | ✅ | ✅ | ✅ | ❌ |
| blogs | read | ✅ | ✅ | ✅ | ✅ |
| blogs | update | ✅ | ✅ | ✅ (own) | ❌ |
| blogs | delete | ✅ | ✅ | ❌ | ❌ |
| media | create | ✅ | ✅ | ✅ | ❌ |
| media | read | ✅ | ✅ | ✅ | ✅ |
| media | delete | ✅ | ✅ | ❌ | ❌ |
| users | create | ✅ | ❌ | ❌ | ❌ |
| users | read | ✅ | ✅ | ❌ | ❌ |
| users | update | ✅ | ❌ | ❌ | ❌ |
| users | delete | ✅ | ❌ | ❌ | ❌ |
| roles | create | ✅ | ❌ | ❌ | ❌ |
| roles | read | ✅ | ❌ | ❌ | ❌ |
| roles | update | ✅ | ❌ | ❌ | ❌ |
| settings | read | ✅ | ✅ | ✅ | ✅ |
| settings | update | ✅ | ❌ | ❌ | ❌ |
| audit | view | ✅ | ❌ | ❌ | ❌ |
| audit | export | ✅ | ❌ | ❌ | ❌ |
| notifications | read | ✅ | ✅ | ✅ | ✅ |
| dashboard | read | ✅ | ✅ | ✅ | ✅ |

### RBAC Test Steps

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| R-01 | Admin full access | Login as admin → Navigate all pages | All pages load, all buttons visible | ☐ |
| R-02 | Viewer read-only | Login as viewer → Try to create project | Create button not visible or returns 403 | ☐ |
| R-03 | Author own content | Login as author → Update another user's project | Cannot see edit button or gets 403 | ☐ |
| R-04 | Editor no user mgmt | Login as editor → Try to access `/dashboard/users` | Access denied or menu item hidden | ☐ |
| R-05 | Unauthenticated API | Call `/api/projects` without cookie | 401 Unauthorized | ☐ |
| R-06 | Wrong role API | Login as viewer → POST `/api/projects` | 403 Forbidden | ☐ |
| R-07 | PermissionGuard UI | Login as viewer → Check button visibility | Buttons requiring `projects.create` are hidden | ☐ |
| R-08 | ADMIN bypass | Login as ADMIN → Access any endpoint | Always allowed regardless of specific permissions | ☐ |

---

## CRUD Testing

### Projects Module (Reference Blueprint)

Test the Projects module as the reference pattern. All other content modules (Blogs) follow the same structure.

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| C-01 | Create project | Fill form → Submit | Project created, appears in list, success toast | ☐ |
| C-02 | Create with categories | Select categories → Submit | Categories linked to project | ☐ |
| C-03 | Create with images | Upload images → Submit | Images saved, Cloudinary upload successful | ☐ |
| C-04 | Create validation | Submit empty title | Validation error: "Title is required" | ☐ |
| C-05 | Read project list | Navigate to projects page | List loads with pagination | ☐ |
| C-06 | Read single project | Click project → View detail | Detail modal shows all fields | ☐ |
| C-07 | Update project | Edit fields → Save | Fields updated, success toast | ☐ |
| C-08 | Update status | Change DRAFT → PUBLISHED | Status updated, `publishedAt` set | ☐ |
| C-09 | Soft delete | Click delete → Confirm | Project moves to trash, removed from list | ☐ |
| C-10 | Restore from trash | Go to trash → Click restore | Project restored to active list | ☐ |
| C-11 | Permanent delete | Go to trash → Permanent delete → Confirm | Project permanently removed | ☐ |
| C-12 | Bulk actions | Select multiple → Publish/Unpublish/Delete | All selected items affected | ☐ |
| C-13 | Slug generation | Create project with title "My Project" | Slug: `my-project` | ☐ |
| C-14 | Slug collision | Create another "My Project" | Slug: `my-project-2` | ☐ |
| C-15 | Featured toggle | Toggle featured flag | Project appears in featured filter | ☐ |

### Blogs Module

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| C-16 | Create blog | Fill form with TinyMCE content → Submit | Blog created with rich text content | ☐ |
| C-17 | Custom slug | Provide custom slug in form | Custom slug used instead of auto-generated | ☐ |
| C-18 | Blog categories | Assign categories → Save | Categories linked correctly | ☐ |
| C-19 | Blog CRUD cycle | Create → Read → Update → Delete | Full cycle works like Projects | ☐ |

### Categories

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| C-20 | Create category | Enter name → Save | Category created, slug auto-generated | ☐ |
| C-21 | Duplicate name | Create category with same name as active | Error: "Category already exists" | ☐ |
| C-22 | Delete with projects | Delete category assigned to active projects | Error: "Cannot delete category with assigned projects" | ☐ |
| C-23 | Delete then recreate | Delete "Commercial" → Create new "Commercial" | Second category created (soft delete allows reuse) | ☐ |
| C-24 | Restore category | Restore soft-deleted category | Category reappears in list | ☐ |

---

## Pagination, Filtering, Sorting & Search

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| P-01 | Default pagination | Load projects list | Shows 10 items per page, page 1 | ☐ |
| P-02 | Change page | Click page 2 | Shows next set of items | ☐ |
| P-03 | Change per page | Set perPage to 25 | Shows 25 items | ☐ |
| P-04 | Empty page | Navigate to page beyond total | Shows empty state or last page | ☐ |
| P-05 | Search | Type in search box | List filters to matching items | ☐ |
| P-06 | Debounced search | Type slowly in search box | Search triggers after 300ms debounce | ☐ |
| P-07 | Clear search | Clear search input | Full list restored | ☐ |
| P-08 | Sort by date | Click date column header | Items sorted by creation date | ☐ |
| P-09 | Sort by title | Click title column header | Items sorted alphabetically | ☐ |
| P-10 | Sort direction | Click same header twice | Sort toggles asc/desc | ☐ |
| P-11 | Filter by status | Select "Published" filter | Only published items shown | ☐ |
| P-12 | Filter by status | Select "Draft" filter | Only draft items shown | ☐ |
| P-13 | Combined filters | Search + status filter + sort | All filters applied simultaneously | ☐ |
| P-14 | No results | Search for non-existent term | "No results found" empty state | ☐ |
| P-15 | Pagination with filters | Apply filter → Paginate | Pagination reflects filtered count | ☐ |

---

## Validation Testing

### Backend Validation (Zod)

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| V-01 | Missing required field | POST without `title` | 400 + `{ field: "title", message: "Required" }` | ☐ |
| V-02 | String too long | Title > 200 characters | 400 validation error | ☐ |
| V-03 | Invalid enum | Status = "INVALID_STATUS" | 400 validation error | ☐ |
| V-04 | Invalid email format | Register with "not-an-email" | 400 validation error | ☐ |
| V-05 | Password too short | Register with 3-char password | 400 validation error | ☐ |
| V-06 | Invalid UUID | GET `/api/projects/not-a-uuid` | 400 or 404 error | ☐ |
| V-07 | Extra fields ignored | Send unexpected field in body | Field silently ignored, no error | ☐ |

### Frontend Validation

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| V-08 | Required field empty | Leave title empty → Submit | Inline error message appears | ☐ |
| V-09 | Character limit | Type > 500 chars in description | Input truncated or error shown | ☐ |
| V-10 | Form reset | Submit invalid → Fix → Submit valid | Errors clear, form submits | ☐ |

---

## Media Upload Testing

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| M-01 | Upload image | Select JPG → Upload | File uploaded to Cloudinary, record in DB | ☐ |
| M-02 | Upload PNG | Select PNG → Upload | Successful upload with correct format | ☐ |
| M-03 | Upload video | Select MP4 → Upload | Video uploaded with `resourceType: 'video'` | ☐ |
| M-04 | File too large | Upload > 10MB file | Error: file size limit | ☐ |
| M-05 | Invalid format | Upload .exe or .txt file | Error: unsupported format | ☐ |
| M-06 | Multiple upload | Select 3 files → Upload all | All 3 files appear in media library | ☐ |
| M-07 | Delete media | Select file → Delete → Confirm | File removed from Cloudinary + DB | ☐ |
| M-08 | Soft delete media | Delete → Check trash | File in trash, can be restored | ☐ |
| M-09 | Media picker | Open media picker in project form | Grid of uploaded files shown | ☐ |
| M-10 | Media picker select | Click file in picker → Insert | File URL inserted into project | ☐ |
| M-11 | Folder organization | Filter by folder | Only files in selected folder shown | ☐ |
| M-12 | Storage stats | Check media stats | Storage breakdown by format displayed | ☐ |
| M-13 | Cloudinary verification | Upload file → Check Cloudinary dashboard | File visible in Cloudinary media library | ☐ |

---

## Notification Testing

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| N-01 | Create project notification | Create a project as admin | Notification appears in dropdown | ☐ |
| N-02 | Unread count | Check notification badge | Badge shows correct unread count | ☐ |
| N-03 | Mark as read | Click notification → Mark read | `readAt` set, count decreases | ☐ |
| N-04 | Mark all read | Click "Mark all as read" | All notifications marked read | ☐ |
| N-05 | Delete notification | Delete single notification | Notification removed | ☐ |
| N-06 | Notification page | Navigate to `/dashboard/notifications` | Full notification list displayed | ☐ |
| N-07 | Notification types | Create project + update user | Notifications with different types appear | ☐ |
| N-08 | Polling | Wait 30 seconds on dashboard | Notification badge updates automatically | ☐ |

---

## Audit Log Verification

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| L-01 | Create audit entry | Create a project | Audit log entry with CREATE action | ☐ |
| L-02 | Update audit entry | Update a project | Audit log with old/new values | ☐ |
| L-03 | Delete audit entry | Delete a project | Audit log with DELETE action | ☐ |
| L-04 | Restore audit entry | Restore a project | Audit log with RESTORE action | ☐ |
| L-05 | Bulk action audit | Bulk publish 3 projects | Audit log for bulk action | ☐ |
| L-06 | IP address captured | Perform any action | `ipAddress` field populated | ☐ |
| L-07 | User agent captured | Perform any action | `userAgent` field populated | ☐ |
| L-08 | Audit page access | Navigate to `/dashboard/audit` | Audit log list displayed | ☐ |
| L-09 | Audit permissions | Login as viewer → Try `/dashboard/audit` | Access denied (requires `audit.view`) | ☐ |
| L-10 | Audit stats | Check audit statistics | Action counts by module displayed | ☐ |

---

## Dashboard Verification

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| D-01 | Overview loads | Navigate to `/dashboard` | Stats cards, charts, activity load | ☐ |
| D-02 | Stats accuracy | Compare stats with DB | Numbers match actual counts | ☐ |
| D-03 | Charts render | Check analytics section | Area/bar charts display without errors | ☐ |
| D-04 | Recent activity | Check activity timeline | Recent actions listed | ☐ |
| D-05 | Recent content | Check recent projects/blogs | Latest items shown | ☐ |
| D-06 | System health | Check health card | System status indicators present | ☐ |
| D-07 | Role distribution | Check pie chart | Role distribution matches DB | ☐ |
| D-08 | Quick actions | Click quick action buttons | Navigate to correct pages | ☐ |
| D-09 | Dashboard isolation | If one widget fails | Other widgets still render (Promise.resolve catch) | ☐ |
| D-10 | Empty dashboard | Fresh database with no content | Graceful empty states, no crashes | ☐ |

---

## Settings Verification

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| S-01 | General settings | Update site name → Save | Setting persisted, reflected in UI | ☐ |
| S-02 | Branding settings | Upload logo → Save | Logo URL stored in settings | ☐ |
| S-03 | SEO settings | Update meta title → Save | Setting saved | ☐ |
| S-04 | Email settings | Configure SMTP → Save | SMTP settings stored | ☐ |
| S-05 | SMTP test | Click "Test SMTP" button | Test email sent (or error shown) | ☐ |
| S-06 | Social settings | Add social URLs → Save | URLs saved correctly | ☐ |
| S-07 | Security settings | Change session timeout → Save | Setting persisted | ☐ |
| S-08 | Maintenance mode | Enable maintenance mode → Save | Maintenance mode active | ☐ |
| S-09 | Maintenance bypass | Enable maintenance → Login as admin | Admin can still access site | ☐ |
| S-10 | Profile update | Change name/bio → Save | Profile updated | ☐ |
| S-11 | Password change | Change password → Save | Can login with new password | ☐ |
| S-12 | System info | Navigate to system info | Node version, DB status, package versions shown | ☐ |

---

## Global Search Verification

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| G-01 | Open search | Press Cmd+K or Ctrl+K | Command palette opens | ☐ |
| G-02 | Search projects | Type project title | Matching projects appear | ☐ |
| G-03 | Search blogs | Type blog title | Matching blogs appear | ☐ |
| G-04 | Search users | Type user name or email | Matching users appear | ☐ |
| G-05 | Search media | Type file name | Matching media files appear | ☐ |
| G-06 | No results | Type gibberish | "No results" message | ☐ |
| G-07 | Result click | Click a search result | Navigates to the entity | ☐ |
| G-08 | Debounce | Type quickly | Search debounced (300ms) | ☐ |
| G-09 | Close search | Press Escape | Command palette closes | ☐ |

---

## Security Verification

### JWT Verification

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| SEC-01 | Valid JWT | Login → Access protected route | Request succeeds | ☐ |
| SEC-02 | No JWT | Clear cookies → Access protected route | 401 Unauthorized | ☐ |
| SEC-03 | Expired JWT | Use expired token in cookie | 401 Unauthorized | ☐ |
| SEC-04 | Invalid JWT | Tamper with cookie value | 401 Unauthorized | ☐ |
| SEC-05 | Algorithm confusion | Send token signed with different alg | 401 Unauthorized | ☐ |
| SEC-06 | Cookie httpOnly | Check `auth_token` in browser dev tools | Cookie is httpOnly (not accessible via JS) | ☐ |
| SEC-07 | Cookie secure (prod) | Check cookie in production | `secure: true` flag set | ☐ |
| SEC-08 | No localStorage token | Check localStorage in dev tools | No JWT stored in localStorage | ☐ |

### CSRF Verification

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| SEC-09 | CSRF cookie set | Check cookies after login | `csrf_token` cookie present | ☐ |
| SEC-10 | CSRF header injected | Make POST request via UI | `x-csrf-token` header sent | ☐ |
| SEC-11 | Missing CSRF header | Manually send POST without header | 403 Invalid CSRF token | ☐ |
| SEC-12 | Mismatched CSRF | Send wrong value in header | 403 Invalid CSRF token | ☐ |
| SEC-13 | GET skips CSRF | Send GET request | No CSRF check needed | ☐ |

### Middleware Verification

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| SEC-14 | Public route bypass | Access `/`, `/register`, `/forgot-password` | No auth required | ☐ |
| SEC-15 | API public routes | POST `/api/auth/login` without cookie | Request succeeds (public API) | ☐ |
| SEC-16 | Protected API | GET `/api/projects` without cookie | 401 Unauthorized | ☐ |
| SEC-17 | Protected page | Visit `/dashboard` without cookie | Redirects to `/` | ☐ |
| SEC-18 | Static assets | Access `/_next/*`, `/favicon.ico` | Served without auth check | ☐ |

### Security Headers

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| SEC-19 | X-Frame-Options | Check response headers | `DENY` | ☐ |
| SEC-20 | X-Content-Type-Options | Check response headers | `nosniff` | ☐ |
| SEC-21 | Referrer-Policy | Check response headers | `strict-origin-when-cross-origin` | ☐ |
| SEC-22 | Permissions-Policy | Check response headers | `camera=(), microphone=(), geolocation=()` | ☐ |
| SEC-23 | HSTS (production) | Check response headers in prod | `max-age=63072000; includeSubDomains; preload` | ☐ |
| SEC-24 | X-Powered-By removed | Check response headers | No `X-Powered-By` header | ☐ |

### Input Security

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| SEC-25 | SQL injection | Enter `'; DROP TABLE users; --` in title | Treated as plain text, no DB error | ☐ |
| SEC-26 | XSS in input | Enter `<script>alert('xss')</script>` in title | Rendered as text, not executed | ☐ |
| SEC-27 | XSS in rich text | Enter script tag in TinyMCE content | Content sanitized | ☐ |

---

## Performance Verification

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| PERF-01 | Dashboard load time | Navigate to `/dashboard` | Loads in < 3 seconds | ☐ |
| PERF-02 | Project list load | Navigate to `/dashboard/projects` | Loads in < 2 seconds | ☐ |
| PERF-03 | Search responsiveness | Type in search box | Results appear within 500ms | ☐ |
| PERF-04 | Image load | View project with images | Images lazy-loaded, non-blocking | ☐ |
| PERF-05 | Modal animation | Open/close any modal | Smooth 300ms animation | ☐ |
| PERF-06 | Large dataset | Load projects with 100+ items | Pagination handles correctly, no lag | ☐ |
| PERF-07 | Concurrent users | Open 3 browser tabs as same user | All tabs work independently | ☐ |
| PERF-08 | Memory leak | Navigate between pages 10 times | No growing memory in dev tools | ☐ |

---

## Accessibility Verification

| # | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| A11Y-01 | Keyboard navigation | Tab through login page | All interactive elements focusable | ☐ |
| A11Y-02 | Enter to submit | Focus on login button → Enter | Form submits | ☐ |
| A11Y-03 | Escape to close | Open modal → Press Escape | Modal closes | ☐ |
| A11Y-04 | Focus trap | Tab within open modal | Focus stays within modal | ☐ |
| A11Y-05 | Color contrast | Check text against background | Meets WCAG AA (4.5:1 ratio) | ☐ |
| A11Y-06 | Form labels | Check all form inputs | Each input has associated label | ☐ |
| A11Y-07 | Error announcements | Submit form with errors | Errors announced to screen readers | ☐ |
| A11Y-08 | Alt text | Check images | Meaningful alt text on content images | ☐ |
| A11Y-09 | Skip navigation | Press Tab on page load | "Skip to content" link available | ☐ |

---

## Cross-Browser Verification

| # | Browser | Version | Test Scope | Status |
|---|---|---|---|---|
| CB-01 | Chrome | Latest | Full regression | ☐ |
| CB-02 | Firefox | Latest | Auth + CRUD + modals | ☐ |
| CB-03 | Safari | Latest | Auth + CRUD + modals | ☐ |
| CB-04 | Edge | Latest | Auth + CRUD + modals | ☐ |
| CB-05 | Mobile Chrome | Latest | Responsive layout + touch | ☐ |
| CB-06 | Mobile Safari | Latest | Responsive layout + touch | ☐ |

### Browser-Specific Checks

| # | Test | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|---|
| CB-07 | Cookie handling | ☐ | ☐ | ☐ | ☐ |
| CB-08 | Modal animations | ☐ | ☐ | ☐ | ☐ |
| CB-09 | File upload | ☐ | ☐ | ☐ | ☐ |
| CB-10 | Cmd+K search | ☐ | ☐ | ☐ | ☐ |

---

## Pre-Release Checklist

### Code Quality

- [ ] `npm run lint` passes with zero errors
- [ ] `npm run build` succeeds without warnings
- [ ] No console errors in browser dev tools
- [ ] No React warnings (missing keys, prop types)

### Authentication

- [ ] Login/logout works for all 4 roles
- [ ] JWT expiry correctly enforced
- [ ] Password reset flow works end-to-end
- [ ] Cookie flags correct (httpOnly, secure in prod)

### Authorization

- [ ] ADMIN can access everything
- [ ] EDITOR cannot access user/role management
- [ ] AUTHOR can only manage own content
- [ ] VIEWER is read-only
- [ ] API routes enforce RBAC correctly

### CRUD

- [ ] All entities: create, read, update, soft-delete, restore, permanent-delete
- [ ] Bulk actions work correctly
- [ ] Slug generation and collision handling work
- [ ] Categories: create, assign, delete protection, restore

### Security

- [ ] CSRF protection active on all state-changing requests
- [ ] Security headers present on all responses
- [ ] No XSS vulnerabilities in form inputs or rich text
- [ ] No SQL injection possible
- [ ] JWT cannot be accessed via JavaScript

### Performance

- [ ] Dashboard loads in < 3 seconds
- [ ] No memory leaks on navigation
- [ ] Images are lazy-loaded

### Cross-Browser

- [ ] Chrome: full regression
- [ ] Firefox: auth + CRUD
- [ ] Safari: auth + CRUD
- [ ] Mobile: responsive layout verified

---

## Production Smoke Tests

Run these immediately after deployment:

| # | Test | Steps | Expected Result | Priority |
|---|---|---|---|---|
| SM-01 | Site loads | Visit production URL | Landing page renders | Critical |
| SM-02 | Login works | Enter admin credentials | Dashboard loads | Critical |
| SM-03 | Database connected | Navigate to projects | Data loads from DB | Critical |
| SM-04 | API responds | Check any API endpoint | JSON response returned | Critical |
| SM-05 | Cloudinary works | Upload a test image | Image uploads successfully | Critical |
| SM-06 | CSRF works | Create a project | CSRF token validated | High |
| SM-07 | Logout works | Click logout | Redirected to login, cookie cleared | High |
| SM-08 | Settings load | Navigate to settings | Settings page renders | Medium |
| SM-09 | Notifications | Check notification badge | Badge shows count | Medium |
| SM-10 | Search works | Press Cmd+K, type query | Results appear | Medium |

---

## Deployment Verification Checklist

Run after every production deployment:

| # | Check | Command / Action | Expected | Status |
|---|---|---|---|---|
| DV-01 | Build succeeded | Check deployment logs | Build completed | ☐ |
| DV-02 | Environment variables | Check platform settings | All 10 vars set | ☐ |
| DV-03 | Database migration | `npx prisma migrate status` | All migrations applied | ☐ |
| DV-04 | Seed data | Login as admin | Admin account works | ☐ |
| DV-05 | HTTPS active | Visit production URL | HTTPS certificate valid | ☐ |
| DV-06 | Security headers | Check response headers | All 7 headers present | ☐ |
| DV-07 | Cloudinary | Upload test file | File uploads successfully | ☐ |
| DV-08 | CSRF | Create a record | CSRF validation passes | ☐ |
| DV-09 | Console errors | Open dev tools → Browse app | No JavaScript errors | ☐ |
| DV-10 | Email | Trigger password reset | Email sent successfully | ☐ |

---

## Known Limitations

### Current Testing Constraints

| Limitation | Impact | Mitigation |
|---|---|---|
| No automated test suite | Regression relies on manual checklists | Structured test matrices, checklist-driven testing |
| No unit tests | Service logic not auto-verified | Services follow consistent patterns; manual verification per module |
| No integration tests | API endpoint behavior not auto-verified | API response format is standardized; manual testing per route |
| No E2E tests | User flows not auto-verified | Manual workflow testing with step-by-step checklists |
| Single-developer project | No parallel QA | Testing is part of the development workflow |

### Known Gaps

| Gap | Priority | Notes |
|---|---|---|
| No Playwright/Cypress E2E | High | Would catch regressions automatically |
| No Jest/Vitest unit tests | Medium | Would verify service logic independently |
| No API contract tests | Medium | Would verify response formats |
| No load testing | Low | Would verify performance under load |
| No visual regression tests | Low | Would catch CSS/UI regressions |

---

## Future Automated Testing

### Recommended Test Framework

| Layer | Tool | Purpose |
|---|---|---|
| Unit tests | Vitest | Service method logic, utility functions |
| Integration tests | Vitest + MSW | API route behavior with mocked services |
| E2E tests | Playwright | Full user workflows across browsers |
| API contract | Vitest | Response format verification |

### Priority Implementation Order

```mermaid
flowchart LR
    A["1. Vitest Setup"] --> B["2. Service Unit Tests"]
    B --> C["3. API Integration Tests"]
    C --> D["4. Playwright E2E"]
    D --> E["5. CI/CD Pipeline"]
    style A fill:#2563eb,color:#fff
    style B fill:#2563eb,color:#fff
    style C fill:#2563eb,color:#fff
    style D fill:#2563eb,color:#fff
    style E fill:#2563eb,color:#fff
```

### Recommended First Tests

1. **Service tests** — `ProjectService.create()`, `ProjectService.findById()`, `AuthService.login()`
2. **Validation tests** — `validateRequest()` with all schemas
3. **Utility tests** — `slugify()`, `formatFileSize()`, `parsePagination()`
4. **API tests** — `POST /api/auth/login`, `GET /api/projects`
5. **E2E tests** — Login → Create project → Verify in list → Delete

### Example Vitest Setup (Future)

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js'],
  },
});
```

```javascript
// tests/services/ProjectService.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectService } from '../../lib/services/ProjectService';

describe('ProjectService', () => {
  it('should create a project with valid data', async () => {
    const project = await ProjectService.create(
      { title: 'Test Project', status: 'DRAFT' },
      { actorId: 'test-user-id' }
    );
    expect(project.title).toBe('Test Project');
    expect(project.slug).toBe('test-project');
  });
});
```

---

## See Also

- [05 — Coding Principles](./05-coding-principles.md) — Development rules and conventions
- [06 — API Reference](./06-api-reference.md) — All 60 API endpoints
- [07 — Authentication](./07-authentication.md) — JWT and cookie architecture
- [08 — Permission System](./08-permission-system.md) — RBAC and permission matrix
- [12 — Deployment Guide](./12-deployment-guide.md) — Deployment and production setup
- [15 — Contributing](./15-contributing.md) — Code review and PR process
