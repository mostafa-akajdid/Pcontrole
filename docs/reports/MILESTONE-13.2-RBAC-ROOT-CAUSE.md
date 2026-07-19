# Milestone 13.2 — RBAC Root Cause Analysis

**Date:** 2026-07-18
**Status:** COMPLETE

---

## Problem Statement

Authenticated admin user receives HTTP 403 on:
- `POST /api/projects` (projects.create)
- `GET /api/projects/stats` (projects.read)
- `GET /api/users` (users.read)
- All write operations across all modules

While read-only endpoints (e.g., `GET /api/projects`) work fine.

---

## Root Cause

**`UserService.findById()` did not load permissions.**

This single method is the permission backbone — every API route calls it to get the authenticated user's permissions. It was querying:

```js
include: { role: true }
```

Which returns:
```
{
  id, name, email, ...
  role: { id: name, description, isSystem }
  // ← NO permissions property
}
```

Every API route then checks:
```js
const user = await UserService.findById(tokenPayload.userId);
if (!user.permissions?.includes('projects.create')) {
  return forbiddenResponse(res);
}
```

Since `user.permissions` was **always `undefined`**, `undefined?.includes(...)` is `undefined` (falsy), and **every permission check failed** → 403 for ALL authenticated write operations.

### Why reads worked

Read endpoints like `GET /api/projects` don't call `UserService.findById` and don't check permissions — they rely only on JWT authentication (which passes through middleware). This is why the projects list loaded successfully while creating returned 403.

---

## Secondary Bug: Permission Name Mismatches

Even after fixing `findById`, 10 routes and 5 frontend references would still fail because they checked permission names that don't exist in the seed data:

| Checked in code | Exists in seed | Routes affected |
|----------------|---------------|-----------------|
| `users.view` | `users.read` | 3 API routes + 2 frontend components |
| `roles.view` | `roles.read` | 4 API routes + 1 frontend component |

The seed uses `{ module: 'users', action: 'read' }` → permission name `users.read`, but code was checking `users.view`.

---

## Fix

### Primary Fix: `lib/services/UserService.js` — `findById()`

**Before:**
```js
static async findById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
```

**After:**
```js
static async findById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: {
        include: { permissions: true },
      },
    },
  });
  const { password, ...userWithoutPassword } = user;
  const permissions = user.role?.permissions?.map((p) => p.name) || [];
  return { ...userWithoutPassword, permissions };
}
```

This matches the pattern already used in `AuthService.login()` and `AuthService.getMe()`.

### Secondary Fix: Permission name corrections

**10 API routes** — `users.view` → `users.read`, `roles.view` → `roles.read`:

| File | Line | Before | After |
|------|------|--------|-------|
| `pages/api/users/index.js` | 27 | `users.view` | `users.read` |
| `pages/api/users/stats.js` | 18 | `users.view` | `users.read` |
| `pages/api/users/[id].js` | 30 | `users.view` | `users.read` |
| `pages/api/roles/index.js` | 26 | `roles.view` | `roles.read` |
| `pages/api/roles/stats.js` | 18 | `roles.view` | `roles.read` |
| `pages/api/roles/permissions-by-module.js` | 18 | `roles.view` | `roles.read` |
| `pages/api/roles/[id].js` | 30 | `roles.view` | `roles.read` |

**3 frontend components:**

| File | Line | Before | After |
|------|------|--------|-------|
| `components/ui/CommandPalette.jsx` | 324 | `users.view` | `users.read` |
| `components/ui/CommandPalette.jsx` | 325 | `roles.view` | `roles.read` |
| `components/sections/QuickActions.jsx` | 10 | `users.view` | `users.read` |

**2 service files:**

| File | Line | Before | After |
|------|------|--------|-------|
| `lib/services/GlobalSearchService.js` | 137 | `users.view` | `users.read` |
| `lib/services/GlobalSearchService.js` | 175 | `roles.view` | `roles.read` |

---

## Complete Authorization Pipeline (After Fix)

### 1. JWT Payload (created at login)
```js
signToken({ userId: user.id, roleId: user.roleId, role: user.role.name })
```
Contains: `userId`, `roleId`, `role` — no permissions in JWT.

### 2. getUserFromRequest()
```js
verifyToken(token) → { userId, roleId, role }
```
Returns decoded JWT. No permissions.

### 3. API Route Handler
```js
const user = await UserService.findById(tokenPayload.userId);
// Returns: { id, name, email, roleId, role, permissions: [...] }
```

### 4. Permission Check
```js
if (!user.permissions?.includes('projects.create')) {
  return forbiddenResponse(res);
}
```

### 5. For ADMIN role
ADMIN role has ALL 50 seeded permissions. `user.permissions` contains all of them. Every `.includes()` check passes.

### 6. For EDITOR role
EDITOR has all permissions except `roles.*`, `users.*`, `audit.*`. Permission checks on those modules correctly return 403.

### 7. For AUTHOR role
AUTHOR has `blogs.create`, `blogs.read`, `blogs.update`, `blogs.delete`, `blogs.publish`, `notifications.read`, `dashboard.read`. Permission checks on projects/users/roles/settings correctly return 403.

### 8. For VIEWER role
VIEWER has only `*.read` + `dashboard.read` + `notifications.read`. All write operations correctly return 403.

---

## Verification

### ADMIN access (all should pass):
- `POST /api/projects` — projects.create ✅
- `GET /api/projects/stats` — projects.read ✅
- `GET /api/users` — users.read ✅
- `POST /api/users` — users.create ✅
- `GET /api/roles` — roles.read ✅
- `POST /api/roles` — roles.create ✅
- `PUT /api/settings` — settings.update ✅
- `POST /api/blogs` — blogs.create ✅
- `POST /api/media/upload` — media.create ✅
- All other endpoints — ✅

### EDITOR access:
- `POST /api/projects` — projects.create ✅
- `GET /api/users` — users.read → 403 ✅ (correct limit)
- `POST /api/roles` — roles.create → 403 ✅ (correct limit)

### AUTHOR access:
- `POST /api/blogs` — blogs.create ✅
- `POST /api/projects` — projects.create → 403 ✅ (correct limit)
- `GET /api/users` — users.read → 403 ✅ (correct limit)

### VIEWER access:
- `GET /api/projects` — projects.read ✅
- `POST /api/projects` — projects.create → 403 ✅ (correct limit)
- `GET /api/users` — users.read → 403 ✅ (correct limit)

### Build:
```
✓ Compiled successfully
✓ 21 static pages generated
✓ Middleware: 32.5 kB
```

---

## Files Modified

| File | Change |
|------|--------|
| `lib/services/UserService.js` | `findById()` now includes `role.permissions` and flattens to `permissions[]` |
| `pages/api/users/index.js` | `users.view` → `users.read` |
| `pages/api/users/stats.js` | `users.view` → `users.read` |
| `pages/api/users/[id].js` | `users.view` → `users.read` |
| `pages/api/roles/index.js` | `roles.view` → `roles.read` |
| `pages/api/roles/stats.js` | `roles.view` → `roles.read` |
| `pages/api/roles/permissions-by-module.js` | `roles.view` → `roles.read` |
| `pages/api/roles/[id].js` | `roles.view` → `roles.read` |
| `components/ui/CommandPalette.jsx` | `users.view` → `users.read`, `roles.view` → `roles.read` |
| `components/sections/QuickActions.jsx` | `users.view` → `users.read` |
| `lib/services/GlobalSearchService.js` | `users.view` → `users.read`, `roles.view` → `roles.read` |

---

## Why This Was Missed in Milestone 13 Review

The Milestone 13 RC review checked permission names in `Sidebar.jsx` (which was fixed: `users.view` → `users.read`), but did not trace the runtime path through `UserService.findById()`. The bug is architectural — `findById` was returning a user object WITHOUT the `permissions` property that every route depends on. This was not a naming issue but a missing data loading issue.

The permission name mismatches in 15 other files were also missed because the review agents checked each file in isolation without comparing the full set of route-checked names against the seed data.

---

## Conclusion

**Two bugs, one fix category:** `UserService.findById()` was not loading role permissions (structural bug), and 15 references used `users.view`/`roles.view` instead of `users.read`/`roles.read` (naming bug). Both caused the same symptom: every authenticated permission check returned 403.

The fix restores the complete authorization pipeline: JWT → getUserFromRequest → UserService.findById (with permissions) → permission check → authorized/denied.
