# TASKILY CMS — Production Review

**Review Date:** July 18, 2026
**Reviewed By:** Senior Code Review (Automated + Manual Audit)
**Scope:** Full-stack — API routes, services, database schema, frontend, auth, security
**Status:** Pre-Production

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Critical** | 3 |
| **High** | 8 |
| **Medium** | 14 |
| **Low** | 12 |
| **Total Findings** | **49** |

**Estimated Production Readiness: 68%**

The TASKILY CMS has a solid foundation — clean component architecture, consistent API patterns, Prisma ORM integration, RBAC system, and a responsive dashboard. However, three critical security and reliability gaps must be resolved before production deployment. The most pressing issues are missing RBAC checks on audit and stats endpoints, a JWT/cookie expiration mismatch that causes silent auth failures, and a fragile dashboard query chain where one bad query kills the entire page. High-priority items include missing HTTP security headers, a context re-render performance bottleneck, and missing database indexes. The medium and low findings are primarily code quality concerns — dead code, duplication, and missing memoization — that affect maintainability but not runtime safety.

**Bottom line:** The CMS cannot safely go live until Critical and High items are resolved. Estimated remediation time is 2–3 days for a senior developer.

---

# Phase 1 — Critical (Must Fix Before Production)

---

## C1 — Audit API Routes Missing RBAC Permission Checks

### Severity

Critical

### Problem

Three audit-related API routes (`/api/audit`, `/api/audit/[id]`, `/api/audit/stats`) authenticate users by verifying the JWT token but never load the user record or check permissions. Any authenticated user — regardless of role — can read the complete audit trail, including other users' actions, IP addresses, and entity changes.

### Risk

- **Data Exposure:** Full audit log data accessible to unauthorized users
- **Compliance Violation:** Audit trails often contain PII and are subject to access controls under GDPR, SOC2, etc.
- **Privilege Escalation:** Low-privilege users can monitor admin actions

### Evidence

- `pages/api/audit/index.js:7-11` — checks `getUserFromRequest` but never calls `UserService.findById` or checks permissions
- `pages/api/audit/[id].js` — same pattern
- `pages/api/audit/stats.js` — same pattern
- Compare with `pages/api/projects/index.js` which correctly calls `UserService.findById` + permission check

### Recommended Fix

Add the standard RBAC guard to each route:

```js
const user = await UserService.findById(tokenPayload.id);
if (!user || !hasPermission(user, 'audit.read')) {
  return forbiddenResponse(res);
}
```

### Estimated Complexity

Low — copy existing RBAC pattern from protected routes

### Estimated Time

15 minutes

---

## C2 — JWT Expiry vs Cookie maxAge Mismatch

### Severity

Critical

### Problem

`JWT_EXPIRES_IN` is configurable via environment variable (default `'7d'`), but the cookie `maxAge` in `setTokenCookie` is hardcoded to `60 * 60 * 24 * 7` (7 days in seconds). If an administrator sets `JWT_EXPIRES_IN=1d`, the JWT token expires in 1 day but the browser cookie persists for 7 days. During the 6-day window between JWT expiry and cookie expiry, users will be silently rejected on every API call with "Invalid or expired token" errors, even though their cookie still exists.

### Risk

- **Silent Auth Failures:** Users locked out with no clear error message
- **Misconfiguration Trap:** Environment variable appears to work but causes intermittent failures
- **Support Burden:** Hard-to-diagnose bug reports from production

### Evidence

- `lib/auth.js:5` — `const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'`
- `lib/auth.js:33` — `maxAge: 60 * 60 * 24 * 7` (hardcoded, ignores `JWT_EXPIRES_IN`)

### Recommended Fix

Parse `JWT_EXPIRES_IN` to derive `maxAge` dynamically, or import the `ms` library to convert the string to milliseconds:

```js
function parseExpiresInSeconds(str) {
  const num = parseInt(str, 10);
  if (str.endsWith('d')) return num * 86400;
  if (str.endsWith('h')) return num * 3600;
  return num; // assume seconds
}
```

### Estimated Complexity

Low — single function, one call site

### Estimated Time

20 minutes

---

## C3 — Dashboard getOverview() Has No Per-Query Error Isolation

### Severity

Critical

### Problem

`DashboardService.getOverview()` runs 14 parallel queries via `Promise.all`. If any single query throws (bad data, schema drift, timeout), the entire Promise rejects, the API returns HTTP 500, and the frontend renders every widget as empty. This was previously demonstrated when `getStorageBreakdown()` used invalid Prisma syntax — one broken query killed the entire dashboard.

### Risk

- **Single Point of Failure:** Any future query bug takes down the entire dashboard
- **Cascading Failures:** One slow query can timeout and kill unrelated widgets
- **Poor Resilience:** No graceful degradation — all-or-nothing

### Evidence

- `lib/services/DashboardService.js:355-370` — `Promise.all` with 14 queries, no error isolation
- `pages/api/dashboard/overview.js:16-18` — catch block returns HTTP 500 on any failure

### Recommended Fix

Wrap each query in `Promise.resolve(...).catch(() => null)`:

```js
const safeQuery = (fn) => Promise.resolve(fn).catch((e) => {
  console.error('Dashboard query failed:', e);
  return null;
});

await Promise.all([
  safeQuery(this.getStats()),
  safeQuery(this.getRecentProjects(5)),
  // ...
]);
```

Each widget already handles null/empty data gracefully.

### Estimated Complexity

Low — mechanical transformation, no logic changes

### Estimated Time

20 minutes

---

# Phase 2 — High Priority

---

## H1 — Missing Security Headers in next.config.js

### Severity

High

### Problem

The application has no HTTP security headers configured. This leaves the app vulnerable to clickjacking, MIME sniffing, and other browser-based attacks. The `X-Powered-By` header is also not removed, leaking the framework name.

### Risk

- **Clickjacking:** No `X-Frame-Options` — app can be embedded in iframes
- **MIME Sniffing:** No `X-Content-Type-Options` — browsers may interpret responses incorrectly
- **Info Leakage:** `X-Powered-By: Next.js` reveals the stack

### Evidence

- `next.config.js` — entire file has no `headers()` configuration
- Missing: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`

### Recommended Fix

Add `headers()` to `next.config.js` with standard security headers. Next.js supports this natively.

### Estimated Complexity

Low — declarative configuration

### Estimated Time

15 minutes

---

## H2 — AuthContext Value Object Recreated Every Render

### Severity

High

### Problem

The `AuthContext.Provider` passes a `value` object containing bare functions (`login`, `register`, `logout`, `hasPermission`, `hasAnyPermission`, `isAdmin`, `isEditor`) that are recreated on every render. Since this context wraps the entire application, every state change (even `loading` toggling from `true` to `false`) forces every `useAuth()` consumer to re-render — including heavy components like the sidebar, navbar, and all dashboard widgets.

### Risk

- **Performance Degradation:** Unnecessary re-renders across the entire app on every auth state change
- **Render Cascade:** A single `setLoading(false)` triggers re-renders in 20+ components
- **Mobile Impact:** Particularly noticeable on low-end mobile devices

### Evidence

- `contexts/AuthContext.jsx:115-128` — `value` object with bare function references
- `hooks/usePermission.js:6-24` — `can`, `canAny`, `canAll`, `cannot` also recreated every render

### Recommended Fix

Wrap all functions in `useCallback`, memoize the `value` object with `useMemo`:

```js
const value = useMemo(() => ({
  user, loading, error,
  login, register, logout,
  hasPermission, hasAnyPermission, isAdmin, isEditor,
  isAuthenticated: !!user,
}), [user, loading, error]);
```

### Estimated Complexity

Medium — requires careful dependency management

### Estimated Time

45 minutes

---

## H3 — Missing Database Indexes on resetToken / verificationToken

### Severity

High

### Problem

`User.verificationToken` and `User.resetToken` have no database index. Password reset and email verification perform `WHERE resetToken = ?` lookups. As the users table grows, these become full table scans.

### Risk

- **Slow Password Reset:** Query time grows linearly with user count
- **Slow Email Verification:** Same issue for verification flow
- **Database Load:** Sequential scans under concurrent load

### Evidence

- `prisma/schema.prisma:77-78` — no `@@index` on `verificationToken` or `resetToken`

### Recommended Fix

Add indexes to the User model:

```prisma
@@index([resetToken])
@@index([verificationToken])
```

Requires a Prisma migration.

### Estimated Complexity

Low — schema change + migration

### Estimated Time

15 minutes

---

## H4 — Blog/Stats/Dashboard API Routes Missing RBAC

### Severity

High

### Problem

Several API routes check authentication (JWT validity) but skip permission checks entirely. Any authenticated user — even one with zero roles or only `blog.read` — can access dashboard overview data, blog statistics, media statistics, and folder structure.

### Risk

- **Information Disclosure:** Dashboard stats, system health, and media structure exposed to unauthorized users
- **Inconsistent Security:** Some routes have RBAC, others don't — creates false sense of protection

### Evidence

- `pages/api/blogs/stats.js:17-21` — no permission check
- `pages/api/media/stats.js:17` — no permission check
- `pages/api/media/folders.js:17` — no permission check
- `pages/api/dashboard/overview.js` — no permission check
- `pages/api/dashboard/stats.js` — no permission check

### Recommended Fix

Add `UserService.findById` + permission check to each route. ~5 lines per file.

### Estimated Complexity

Low — copy existing RBAC pattern

### Estimated Time

30 minutes

---

## H5 — useApi Hook Forces JSON Content-Type on All Requests

### Severity

High

### Problem

The `useApi` hook always sets `Content-Type: application/json`, even when the request body is `FormData` (used for file uploads). This causes the server-side body parser to fail because it expects JSON but receives multipart form data.

### Risk

- **File Upload Broken:** Any file upload using `useApi` will fail silently or throw a parsing error
- **Developer Confusion:** The hook appears to work but fails at runtime with unhelpful errors

### Evidence

- `hooks/useApi.js:29-32` — unconditional `Content-Type: application/json`

### Recommended Fix

Check body type before setting content-type:

```js
const isFormData = body instanceof FormData;
const headers = {
  ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
  ...customHeaders,
};
```

### Estimated Complexity

Low — conditional check

### Estimated Time

10 minutes

---

## H6 — MediaService.getUsedIn() Queries with Wrong ID Type

### Severity

High

### Problem

`MediaService.getUsedIn()` is called with `media.publicId` (a Cloudinary path string like `taskily/abc123`), but `ProjectImage.publicId` and `BlogImage.publicId` in the database store the Media UUID, not the Cloudinary path. The usage lookup always returns empty results.

### Risk

- **Feature Broken:** "Used in" indicator on media files never shows matches
- **User Confusion:** Media appears unused even when embedded in projects/blogs

### Evidence

- `pages/api/media/[id].js:30` — `MediaService.getUsedIn(media.publicId)`
- `lib/services/MediaService.js:305` — queries `ProjectImage.publicId` with the Cloudinary path

### Recommended Fix

Pass `media.id` (UUID) instead of `media.publicId`:

```js
const usedIn = await MediaService.getUsedIn(media.id);
```

### Estimated Complexity

Low — single argument change

### Estimated Time

5 minutes

---

## H7 — Notification Routes Missing RBAC (Suspended Users Can Access)

### Severity

High

### Problem

Notification endpoints are user-scoped (filtered by JWT userId) so users see only their own data, but there is no check for account status. Suspended users can still read, mark, and manipulate their notifications.

### Risk

- **Suspended User Activity:** Suspended accounts retain full notification access
- **Inconsistent Enforcement:** Users blocked from other features but not notifications

### Evidence

- `pages/api/notifications/index.js` — no status check
- `pages/api/notifications/[id].js` — no status check
- `pages/api/notifications/unread-count.js` — no status check
- `pages/api/notifications/mark-all-read.js` — no status check

### Recommended Fix

Add `if (user.status === 'SUSPENDED') return forbiddenResponse(res)` after user lookup. ~3 lines per file.

### Estimated Complexity

Low

### Estimated Time

15 minutes

---

## H8 — Toast Context setTimeout Never Cleared (Memory Leak)

### Severity

High

### Problem

`ToastContext` creates `setTimeout` callbacks in `addToast` but never stores the timeout IDs or clears them on unmount. If the provider unmounts while timeouts are pending, `setToasts` fires on an unmounted component.

### Risk

- **React Warning:** "Can't perform a React state update on an unmounted component"
- **Memory Leak:** Orphaned timeouts keep references alive
- **Potential Crash:** In strict mode, double-invoked effects may cause unexpected behavior

### Evidence

- `contexts/ToastContext.jsx:35-37` — `setTimeout` without cleanup

### Recommended Fix

Store timeout IDs in a ref, clear them in a cleanup effect:

```js
const timeoutRefs = useRef([]);

useEffect(() => {
  return () => timeoutRefs.current.forEach(clearTimeout);
}, []);
```

### Estimated Complexity

Low

### Estimated Time

15 minutes

---

# Phase 3 — Medium Priority

---

## M1 — Dead Validation Schemas in lib/validation.js

### Severity

Medium

### Problem

10 settings group schemas, `verifyEmailSchema`, and `setCoverImageSchema` are defined but never imported by any API route. The settings API does manual inline validation instead.

### Evidence

- `lib/validation.js:43` — `verifyEmailSchema` (unused)
- `lib/validation.js:137-232` — 10 settings schemas (unused)
- `lib/validation.js:291` — `setCoverImageSchema` (unused)

### Recommended Fix

Remove unused schemas or wire them into API routes.

### Estimated Complexity

Low

### Estimated Time

15 minutes

---

## M2 — usePermission Hook Recreates Functions Every Render

### Severity

Medium

### Problem

`can`, `canAny`, `canAll`, `cannot` are bare functions recreated every render. When passed as props to memoized children, this defeats memoization.

### Evidence

- `hooks/usePermission.js:6-24`

### Recommended Fix

Wrap in `useCallback`.

### Estimated Complexity

Low

### Estimated Time

10 minutes

---

## M3 — AppearanceContext Functions Not Memoized

### Severity

Medium

### Problem

`updateTheme` and `updateAccentColor` are recreated every render, forcing all `useAppearance` consumers to re-render.

### Evidence

- `contexts/AppearanceContext.jsx:30,46`

### Recommended Fix

Wrap in `useCallback`.

### Estimated Complexity

Low

### Estimated Time

10 minutes

---

## M4 — Middleware Encodes JWT Secret on Every Request

### Severity

Medium

### Problem

`new TextEncoder().encode(JWT_SECRET)` runs on every HTTP request. This is a pure function of the env var and should be cached at module scope.

### Evidence

- `middleware.js:85`

### Recommended Fix

Move to module-level constant.

### Estimated Complexity

Low

### Estimated Time

5 minutes

---

## M5 — prisma CLI in Production Dependencies

### Severity

Medium

### Problem

`prisma` (CLI tool) is in `dependencies` instead of `devDependencies`. Only needed at build time.

### Evidence

- `package.json:30`

### Recommended Fix

Move to `devDependencies`.

### Estimated Complexity

Low

### Estimated Time

5 minutes

---

## M6 — Dual JWT Libraries (jsonwebtoken + jose)

### Severity

Medium

### Problem

Both `jsonwebtoken` (Node-only) and `jose` (universal) are installed. `jose` works in both Edge and Node.js runtimes. `jsonwebtoken` is only used in `lib/auth.js`.

### Evidence

- `package.json:25-26`
- `lib/auth.js:1` — imports `jsonwebtoken`
- `middleware.js:2` — imports `jose`

### Recommended Fix

Replace `jsonwebtoken` with `jose` in `lib/auth.js`.

### Estimated Complexity

Low-Medium

### Estimated Time

30 minutes

---

## M7 — EventService.emit Errors Silently Swallowed

### Severity

Medium

### Problem

Every `EventService.emit(...)` is chained with `.catch(() => {})`. If event handlers fail, there is zero observability — no logging, no metrics.

### Evidence

- All service files — every `EventService.emit(...)` call

### Recommended Fix

Change `.catch(() => {})` to `.catch((e) => console.error('EventService error:', e))`.

### Estimated Complexity

Low

### Estimated Time

15 minutes

---

## M8 — Dashboard Notification Query Not User-Scoped

### Severity

Medium

### Problem

`getOverview()` fetches the 5 most recent notifications across ALL users, not the requesting user. The dashboard shows everyone's notifications.

### Evidence

- `lib/services/DashboardService.js:368` — `prisma.notification.findMany({ where: { deletedAt: null } })` — no userId filter

### Recommended Fix

Pass `userId` to `getOverview()` and filter notifications by it.

### Estimated Complexity

Low

### Estimated Time

10 minutes

---

## M9 — useGlobalSearch flatResults Not Memoized

### Severity

Medium

### Problem

`flatResults` is recomputed on every render from `results?.groups`. Should be `useMemo`.

### Evidence

- `hooks/useGlobalSearch.js:128-130`

### Recommended Fix

Wrap in `useMemo`.

### Estimated Complexity

Low

### Estimated Time

5 minutes

---

## M10 — Navbar setTimeout Not Cleared on Unmount

### Severity

Medium

### Problem

`closeWithAnimation` uses `setTimeout` without storing or clearing the timeout ID. If the component unmounts during the 200ms animation, the callback fires on unmounted state.

### Evidence

- `components/layout/Navbar.jsx:18-24`

### Recommended Fix

Store timeout ID in a ref, clear on unmount.

### Estimated Complexity

Low

### Estimated Time

10 minutes

---

## M11 — Missing CSRF Protection

### Severity

Medium

### Problem

No CSRF token validation on state-changing POST/PUT/DELETE requests. `sameSite: 'lax'` provides partial protection but is insufficient for subdomain scenarios.

### Evidence

- `middleware.js` — no CSRF implementation

### Recommended Fix

Add CSRF token validation middleware or use `sameSite: 'strict'`.

### Estimated Complexity

Medium

### Estimated Time

1-2 hours

---

## M12 — useApi Doesn't Handle Non-JSON Responses

### Severity

Medium

### Problem

`response.json()` is called unconditionally. If the server returns HTML (502 proxy error), this throws a cryptic error.

### Evidence

- `hooks/useApi.js:37`

### Recommended Fix

Check `Content-Type` header before parsing.

### Estimated Complexity

Low

### Estimated Time

10 minutes

---

## M13 — AuditLog Missing Composite Indexes

### Severity

Medium

### Problem

No composite index for `[userId, createdAt]` or `[module, createdAt]` — common audit queries will be slow at scale.

### Evidence

- `prisma/schema.prisma` — AuditLog model

### Recommended Fix

Add `@@index([userId, createdAt])` and `@@index([module, createdAt])`. Requires migration.

### Estimated Complexity

Low

### Estimated Time

10 minutes

---

## M14 — 5 Unused Settings Validation Schemas

### Severity

Medium

### Problem

Settings schemas are defined but the API route does manual validation. Schema drift risk — code and validation diverge silently.

### Evidence

- `lib/validation.js:137-232`
- `pages/api/settings/index.js:74-86` — manual validation

### Recommended Fix

Wire schemas into the API route or delete them.

### Estimated Complexity

Low-Medium

### Estimated Time

30 minutes

---

# Phase 4 — Low Priority

---

## L1 — useDebounce Hook Defined 4 Times Identically

### Severity

Low

### Problem

The same `useDebounce` hook is copy-pasted into 4 files.

### Evidence

- `pages/dashboard/projects.jsx:40-47`
- `pages/dashboard/blogs.jsx:39-46`
- `pages/dashboard/media.jsx:39-46`
- `components/modals/MediaPicker.jsx:25-32`

### Recommended Fix

Extract to `hooks/useDebounce.js`.

### Estimated Complexity

Low

### Estimated Time

15 minutes

---

## L2 — Status Color Maps Duplicated 5+ Times

### Severity

Low

### Problem

`STATUS_COLORS` / `ROLE_COLORS` objects defined identically in 5+ files.

### Evidence

- `pages/dashboard/users.jsx`
- `pages/dashboard/team.jsx`
- `components/sections/TeamCollaboration.jsx`
- `components/modals/UserDetailModal.jsx`

### Recommended Fix

Centralize in `lib/constants/statusColors.js`.

### Estimated Complexity

Low

### Estimated Time

20 minutes

---

## L3 — Modal Animation + Scroll-Lock Boilerplate Duplicated in 8 Modals

### Severity

Low

### Problem

`isClosing` / `handleClose` / body-scroll-lock `useEffect` pattern repeated across 8 modal components.

### Recommended Fix

Extract into `useModalAnimation` hook or `AnimatedModal` wrapper component.

### Estimated Complexity

Medium

### Estimated Time

1-2 hours

---

## L4 — formatBytes Duplicated — Already Exists in lib/utils

### Severity

Low

### Problem

`TimeTracker.jsx` defines local `formatBytes` while `lib/utils` exports `formatFileSize`.

### Evidence

- `components/sections/TimeTracker.jsx:38-44`

### Recommended Fix

Import from utils.

### Estimated Complexity

Low

### Estimated Time

5 minutes

---

## L5 — getRelativeTime Duplicated in 2 Components

### Severity

Low

### Problem

Same function defined in `RecentNotifications.jsx` and `RecentAudit.jsx`.

### Recommended Fix

Extract to shared utility.

### Estimated Complexity

Low

### Estimated Time

10 minutes

---

## L6 — formatDate Duplicated in 2 Modals

### Severity

Low

### Problem

Same function defined in `BlogDetailModal.jsx` and `ProjectDetailModal.jsx`.

### Recommended Fix

Extract to shared utility.

### Estimated Complexity

Low

### Estimated Time

10 minutes

---

## L7 — Password Validation Regex Duplicated 5 Times

### Severity

Low

### Problem

Same regex pattern repeated in 5 schema definitions.

### Evidence

- `lib/validation.js:15,32,63,101,117`

### Recommended Fix

Extract to a shared `passwordSchema` constant.

### Estimated Complexity

Low

### Estimated Time

10 minutes

---

## L8 — 22+ Unused Imports Across Dashboard Pages

### Severity

Low

### Problem

Unused `lucide-react` imports in `projects.jsx`, `blogs.jsx`, `media.jsx`, `users.jsx`, `help.jsx`, `SettingsSection.jsx`, `AddProjectModal.jsx`, `AddEventSidebar.jsx`.

### Recommended Fix

Remove unused imports.

### Estimated Complexity

Low

### Estimated Time

15 minutes

---

## L9 — Sidebar Close Button Missing aria-label

### Severity

Low

### Problem

Close button has no accessible name for screen readers.

### Evidence

- `components/layout/Sidebar.jsx:40-42`

### Recommended Fix

Add `aria-label="Close sidebar"`.

### Estimated Complexity

Low

### Estimated Time

2 minutes

---

## L10 — SettingsSection Imports useState and Loader2 Unused

### Severity

Low

### Problem

`useState` and `Loader2` imported but never used.

### Evidence

- `components/settings/SettingsSection.jsx:2,7`

### Recommended Fix

Remove imports.

### Estimated Complexity

Low

### Estimated Time

2 minutes

---

## L11 — paginatedResponse Doesn't Accept Custom Status Code

### Severity

Low

### Problem

`paginatedResponse` hardcodes status 200 unlike `successResponse` and `errorResponse`.

### Evidence

- `lib/api.js:22-31`

### Recommended Fix

Add optional `statusCode` parameter.

### Estimated Complexity

Low

### Estimated Time

5 minutes

---

## L12 — AppearanceContext SSR Hydration Mismatch (Theme Flash)

### Severity

Low

### Problem

Initial state is `'light'` but client may load with `'dark'` from localStorage, causing a flash of incorrect theme on page load.

### Evidence

- `contexts/AppearanceContext.jsx:6-28`

### Recommended Fix

Use `suppressHydrationWarning` on `<html>` and apply theme in a blocking `<script>` tag in `_document.js`.

### Estimated Complexity

Medium

### Estimated Time

30 minutes

---

# Recommended Order of Work

---

## Milestone 1 — Security

**Difficulty:** Low
**Expected Time:** 1.5 hours

| Task | Issue | Files |
|------|-------|-------|
| Add RBAC to audit routes | C1 | `pages/api/audit/index.js`, `[id].js`, `stats.js` |
| Add RBAC to stats/dashboard routes | H4 | `pages/api/blogs/stats.js`, `media/stats.js`, `media/folders.js`, `dashboard/overview.js`, `dashboard/stats.js` |
| Add RBAC to notification routes | H7 | `pages/api/notifications/*.js` (4 files) |
| Add security headers | H1 | `next.config.js` |

---

## Milestone 2 — Authentication

**Difficulty:** Low
**Expected Time:** 30 minutes

| Task | Issue | Files |
|------|-------|-------|
| Fix JWT/cookie expiry mismatch | C2 | `lib/auth.js` |

---

## Milestone 3 — Dashboard

**Difficulty:** Low
**Expected Time:** 45 minutes

| Task | Issue | Files |
|------|-------|-------|
| Add per-query error isolation | C3 | `lib/services/DashboardService.js` |
| Scope notifications to user | M8 | `lib/services/DashboardService.js`, `pages/api/dashboard/overview.js` |
| Fix media usage lookup | H6 | `pages/api/media/[id].js` |

---

## Milestone 4 — Performance

**Difficulty:** Medium
**Expected Time:** 2 hours

| Task | Issue | Files |
|------|-------|-------|
| Memoize AuthContext value | H2 | `contexts/AuthContext.jsx` |
| Memoize usePermission functions | M2 | `hooks/usePermission.js` |
| Memoize AppearanceContext | M3 | `contexts/AppearanceContext.jsx` |
| Fix Toast memory leak | H8 | `contexts/ToastContext.jsx` |
| Fix Navbar setTimeout leak | M10 | `components/layout/Navbar.jsx` |
| Memoize useGlobalSearch | M9 | `hooks/useGlobalSearch.js` |
| Cache JWT secret encoding | M4 | `middleware.js` |

---

## Milestone 5 — Code Cleanup

**Difficulty:** Low
**Expected Time:** 1.5 hours

| Task | Issue | Files |
|------|-------|-------|
| Remove unused imports | L8 | 8+ files |
| Remove unused validation schemas | M1, M14 | `lib/validation.js` |
| Move prisma to devDependencies | M5 | `package.json` |
| Extract useDebounce | L1 | 4 files |
| Extract status color constants | L2 | 5+ files |
| Extract formatDate / getRelativeTime | L5, L6 | 4 files |
| Remove duplicate formatBytes | L4 | `TimeTracker.jsx` |
| Extract password schema | L7 | `lib/validation.js` |
| Fix useApi content-type | H5 | `hooks/useApi.js` |
| Fix useApi non-JSON handling | M12 | `hooks/useApi.js` |
| Add accessibility labels | L9 | `Sidebar.jsx` |

---

## Milestone 6 — Refactoring

**Difficulty:** Medium
**Expected Time:** 3-4 hours

| Task | Issue | Files |
|------|-------|-------|
| Replace jsonwebtoken with jose | M6 | `lib/auth.js`, `package.json` |
| Wire validation schemas into settings API | M14 | `pages/api/settings/index.js`, `lib/validation.js` |
| Add CSRF protection | M11 | `middleware.js` |
| Fix SSR theme flash | L12 | `contexts/AppearanceContext.jsx`, `_document.js` |
| Extract modal animation hook | L3 | 8 modal files |
| Add audit log composite indexes | M13 | `prisma/schema.prisma` |
| Add resetToken indexes | H3 | `prisma/schema.prisma` |
| Log EventService errors | M7 | All service files |

---

# Production Checklist

- [ ] Critical issues fixed (C1, C2, C3)
- [ ] High-priority issues fixed (H1–H8)
- [ ] Security headers configured
- [ ] RBAC verified on all API routes
- [ ] JWT/cookie expiry synchronized
- [ ] Dashboard error isolation in place
- [ ] Database indexes added (resetToken, verificationToken, AuditLog)
- [ ] Performance: AuthContext memoized
- [ ] Performance: Toast memory leak fixed
- [ ] Performance: Navbar setTimeout leak fixed
- [ ] useApi content-type bug fixed
- [ ] Media usage lookup bug fixed
- [ ] Dashboard notification query scoped to user
- [ ] Error handling: EventService errors logged
- [ ] Dead code removed
- [ ] Unused imports cleaned
- [ ] Build passes with zero warnings
- [ ] Manual QA: login, logout, password reset
- [ ] Manual QA: dashboard loads all widgets
- [ ] Manual QA: RBAC enforced (test as AUTHOR, VIEWER roles)
- [ ] Ready for production

---

# Final Verdict

The TASKILY CMS is a well-structured application with clean component architecture, consistent API patterns, and a comprehensive feature set. The codebase demonstrates solid engineering practices — Prisma ORM integration, JWT-based authentication, role-based access control, soft-delete patterns, and a responsive Tailwind-based UI.

**Current Production Readiness: 68%**

**The CMS cannot safely go live today.** Three critical issues must be resolved first:

1. **Audit routes have no RBAC** — any authenticated user can read the full audit trail. This is a data exposure vulnerability that would be a compliance violation in production.
2. **JWT/cookie mismatch** — if the token expiry is configured to anything other than 7 days, users will experience silent authentication failures. This is a ticking time bomb for any deployment that customizes the expiry.
3. **Dashboard fragility** — a single failing query kills the entire dashboard. While we fixed the immediate `getStorageBreakdown()` bug, the architecture remains fragile.

Beyond the critical issues, the missing security headers (H1) and the AuthContext re-render bottleneck (H2) should be addressed before launch. The security headers are a standard production requirement, and the re-render issue will cause noticeable performance problems as the user base grows.

**Estimated time to production-ready: 2–3 days** for a senior developer, working through the milestones in order. The critical and high items alone can be resolved in approximately 4 hours. The medium and low items are quality-of-life improvements that can be addressed in follow-up sprints.

**Recommendation:** Complete Milestones 1–3 (Security, Auth, Dashboard) before any production deployment. Milestones 4–6 can be addressed in the first post-launch sprint.
