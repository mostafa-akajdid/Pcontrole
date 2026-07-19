# Coding Principles

This document defines the development rules, conventions, and patterns used throughout TASKILY CMS. Follow these rules when adding or modifying code.

---

## 1. Service Layer Is the Single Source of Truth

All business logic lives in `lib/services/`. This is the only layer that interacts with the database (via Prisma) and emits events.

**Rules:**
- API routes call services. They do not contain business logic.
- Frontend components never import Prisma or access the database directly.
- Services are stateless classes with static methods.
- Services emit events for side effects (notifications, audit logs).

```javascript
// ✅ Correct — API route delegates to service
const project = await ProjectService.create(data, metadata);

// ❌ Wrong — API route contains business logic
const project = await prisma.project.create({ data: { ... } });
```

---

## 2. Backend Response Format

Every API response uses helpers from `lib/api.js`. Never construct raw response objects.

**Success:**
```javascript
return successResponse(res, data, 'Project created successfully', 201);
```

**Error:**
```javascript
return errorResponse(res, 'Project not found', 404);
```

**Validation:**
```javascript
return validationErrorResponse(res, validation.errors);
```

**Standard shape:**
```json
{
  "success": true|false,
  "data": { ... },
  "message": "Description"
}
```

---

## 3. Error Handling Rules

### Backend

- Every API route wraps logic in `try/catch`
- Errors are logged with `console.error` for observability
- User-facing messages are human-readable, not technical
- Event handler errors are caught by `EventService.logError()` and never propagate

```javascript
try {
  const project = await ProjectService.create(data, metadata);
  return successResponse(res, project, 'Project created', 201);
} catch (error) {
  console.error('Create project error:', error);
  return errorResponse(res, 'Failed to create project');
}
```

### Frontend

- `useApi` hook handles HTTP errors and non-JSON responses
- Toast notifications for user-facing errors
- Graceful degradation for missing data (empty states)

---

## 4. Validation Rules

### Schema Definition

All validation schemas are defined in `lib/validation.js` using Zod.

```javascript
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  shortDescription: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});
```

### API Route Usage

```javascript
const validation = validateRequest(createProjectSchema, req.body);
if (!validation.success) {
  return validationErrorResponse(res, validation.errors);
}
```

### Rules
- Every write endpoint (POST/PUT/PATCH) must validate input
- Read endpoints validate query parameters via `parsePagination`, `parseSort`, `parseSearch`
- Password validation uses the shared `passwordSchema` constant
- Never trust client input — always validate on the server

---

## 5. Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `ProjectFormModal.jsx` |
| Hooks | camelCase with `use` prefix | `useDebounce.js` |
| Services | PascalCase | `ProjectService.js` |
| Utilities | camelCase | `slugify.js` |
| API routes | camelCase (file-based) | `pages/api/projects/index.js` |
| Contexts | PascalCase + Context suffix | `AuthContext.jsx` |

### Variables and Functions

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `projectTitle` |
| Constants | UPPER_SNAKE_CASE | `STATUS_COLORS` |
| Functions | camelCase | `formatDate()` |
| Service methods | camelCase | `ProjectService.findById()` |
| React components | PascalCase | `<ProjectCard />` |
| Boolean variables | `is`, `has`, `should` prefix | `isLoading`, `hasPermission` |

### Database

| Type | Convention | Example |
|------|-----------|---------|
| Models | PascalCase | `Project`, `BlogCategory` |
| Table names | snake_case (via `@@map`) | `projects`, `blog_categories` |
| Fields | camelCase | `createdAt`, `authorId` |
| Enums | PascalCase | `ProjectStatus`, `UserStatus` |
| Enum values | UPPER_SNAKE_CASE | `DRAFT`, `PUBLISHED` |

---

## 6. Folder Conventions

### Component Organization

| Folder | Contains | Rule |
|--------|----------|------|
| `components/layout/` | Page wrappers, navigation | Only layout-level components |
| `components/modals/` | Overlay dialogs | Must use `useModalAnimation` hook |
| `components/sections/` | Dashboard content sections | Receive data via props, never fetch |
| `components/ui/` | Reusable primitives | Presentation-only, no business logic |
| `components/settings/` | Settings page sections | One file per settings group |
| `components/notifications/` | Notification UI | Poll for updates |

### Import Order

```javascript
// 1. React/Next imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 2. Third-party libraries
import { Search, Plus } from 'lucide-react';

// 3. Internal components
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';

// 4. Contexts and hooks
import { useToast } from '@/contexts/ToastContext';
import { useDebounce } from '@/hooks/useDebounce';

// 5. Services and utilities
import { formatDate } from '@/lib/utils';
```

---

## 7. Permission Conventions

### Naming Pattern

Permissions follow the format: `{module}.{action}`

```
projects.view
projects.create
projects.edit
projects.delete
projects.bulk_delete
projects.restore
projects.publish
```

### 12 Modules

projects, blogs, media, users, roles, settings, dashboard, audit, notifications, categories, search, system

### 62 Total Permissions

Defined in `prisma/seed.js` and assigned to roles.

### API Route Pattern

```javascript
// 1. Authenticate
const tokenPayload = getUserFromRequest(req);
if (!tokenPayload) return unauthorizedResponse(res);

// 2. Load user
const user = await UserService.findById(tokenPayload.id);
if (!user || user.status !== 'ACTIVE') return forbiddenResponse(res);

// 3. Check permission
if (!hasPermission(user, 'projects.create')) return forbiddenResponse(res);
```

### Frontend Pattern

```jsx
<PermissionGuard permission="projects.create">
  <Button onClick={handleCreate}>New Project</Button>
</PermissionGuard>
```

---

## 8. Audit Logging

Every state-changing operation creates an `AuditLog` entry.

### What Gets Logged

| Action | Entity | Old/New Values |
|--------|--------|----------------|
| CREATE | Project, Blog, User, Role, Media | New values only |
| UPDATE | Project, Blog, User, Role, Media | Both old and new values |
| DELETE | Project, Blog, User, Role, Media | Old values only |
| RESTORE | Project, Blog, User | Old values |
| STATUS_CHANGE | User | Old and new status |
| BULK_ACTION | Project, Blog, User | Summary of changes |

### How to Add Audit Logging

Audit logging is handled automatically by `EventService` event handlers. When you call a service method that emits an event, audit logging happens automatically.

```javascript
// This automatically creates an audit log entry
await ProjectService.create(data, metadata);
// EventService emits 'project.created' → AuditService creates log
```

### Metadata

The `metadata` object passed to service methods contains:

```javascript
const metadata = extractRequestMetadata(req, user.id);
// { actorId: 'user-uuid', ipAddress: '1.2.3.4', userAgent: 'Mozilla/...' }
```

---

## 9. Event-Driven Architecture

### When to Emit Events

Every service method that changes state should emit an event. This is already implemented for all services.

### Event Naming

```
{module}.{action}
```

Examples:
- `project.created`
- `blog.updated`
- `media.deleted`
- `user.status_changed`
- `role.cloned`

### Adding a New Event

1. Define the event name in your service method
2. Call `EventService.emit(eventName, eventData)`
3. The event is automatically processed by registered handlers

```javascript
static async create(data, metadata) {
  const project = await prisma.project.create({ data: { ... } });

  EventService.emit('project.created', {
    entityType: 'Project',
    entityId: project.id,
    entityName: project.title,
    userId: metadata.actorId,
    metadata,
  });

  return project;
}
```

### Error Handling

Event handler errors are caught by `EventService.logError()` and never affect the caller.

---

## 10. Security Rules

### Authentication

- JWT stored in HTTP-only cookies only
- No tokens in localStorage or sessionStorage
- No `Authorization` headers
- Cookie `maxAge` dynamically derived from `JWT_EXPIRES_IN`

### CSRF

- Double Submit Cookie pattern
- Every state-changing request (POST/PUT/DELETE/PATCH) includes `x-csrf-token` header
- Global `window.fetch` patch in `_app.jsx` handles header injection

### Passwords

- Hashed with bcryptjs (cost factor 10)
- Never logged or returned in API responses
- Minimum 8 characters, uppercase, lowercase, number

### Input

- All API inputs validated with Zod
- Parameterized queries via Prisma (no SQL injection)
- No `eval()`, no `dangerouslySetInnerHTML` with user content

### Headers

8 security headers configured in `next.config.js`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Resource-Policy: same-origin
- X-DNS-Prefetch-Control: off
- Strict-Transport-Security (production only)

### RBAC

- 62 permissions across 12 modules
- 4 predefined roles (ADMIN, EDITOR, AUTHOR, VIEWER)
- Permission checks on every protected API route
- `PermissionGuard` component for frontend conditional rendering

---

## 11. When to Create Shared Hooks

Create a shared hook in `hooks/` when:

- The same logic is used in 3+ components
- The logic involves state management, effects, or side effects
- The logic is independent of any specific component

**Example:**
```javascript
// hooks/useDebounce.js — used by projects, blogs, media, MediaPicker
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
```

**Do NOT create a hook for:**
- Simple conditional rendering (use a component)
- One-off logic specific to a single component

---

## 12. When to Create Shared Utils

Create a shared utility in `lib/utils.js` when:

- The same function is used in 3+ files
- The function is pure (no side effects, no React dependencies)
- The function does not depend on application state

**Example:**
```javascript
// lib/utils.js — used by 8+ files
export function getRelativeTime(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}
```

**Do NOT create a shared util for:**
- Functions that depend on React hooks
- Functions that access the database
- Functions used in only 1-2 files (inline them)

---

## 13. Modal Conventions

All modals follow the same pattern:

### Structure

```jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useModalAnimation } from '@/hooks/useModalAnimation';

export default function MyModal({ isOpen, onClose, data }) {
  const { isClosing, handleClose, shouldRender } = useModalAnimation(isOpen, {
    delay: 300,
    onClose,
  });

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${
          isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white z-[101] transform transition-all duration-300 ${
        isClosing ? 'animate-slideOutRight' : 'animate-slideInRight'
      }`}>
        {/* Header */}
        <div className="sticky top-0 ...">
          <h2>Title</h2>
          <button onClick={handleClose}><X /></button>
        </div>

        {/* Content */}
        <div className="p-6">...</div>
      </div>
    </>
  );
}
```

### Rules

- Always use `useModalAnimation` hook (handles enter/exit/scroll-lock)
- Backdrop click should close the modal
- Close button in header
- `shouldRender` prevents rendering when not open
- Form modals handle validation and API calls internally
- Detail modals are read-only with action buttons

---

## 14. API Conventions

### Route Structure

Every API route file:

1. Imports services, auth, validation, and response helpers
2. Exports a default async handler function
3. Checks HTTP method
4. Authenticates the user
5. Authorizes the action
6. Validates input
7. Calls the service
8. Returns a standardized response

### HTTP Methods

| Method | Usage |
|--------|-------|
| GET | Read data (list or single) |
| POST | Create new resource |
| PUT | Update existing resource |
| DELETE | Delete or soft-delete resource |
| PATCH | Partial update |

### Query Parameters

| Parameter | Usage |
|-----------|-------|
| `page` | Page number (default: 1) |
| `perPage` | Items per page (default: 10) |
| `search` | Search query |
| `sort` | Sort field (default: createdAt) |
| `order` | Sort direction (asc/desc) |
| `status` | Filter by status |

### Bulk Actions

```json
POST /api/projects/bulk
{
  "action": "publish|unpublish|delete|restore",
  "ids": ["uuid1", "uuid2"]
}
```

---

## 15. Documentation Conventions

### When to Document

- Architecture decisions — always document WHY
- API endpoints — document request/response shapes
- Complex business logic — add inline comments
- Configuration — document all environment variables

### Documentation Locations

| Type | Location |
|------|----------|
| Project overview | `docs/01-project-overview.md` |
| Architecture | `docs/02-architecture.md` |
| Folder structure | `docs/03-folder-structure.md` |
| Tech stack | `docs/04-tech-stack.md` |
| Coding principles | `docs/05-coding-principles.md` |
| Historical reports | `docs/reports/` |

### Code Comments

- Do NOT add comments unless asked
- Do NOT add summary comments to functions
- Do NOT add inline explanations to obvious code
- DO add comments for non-obvious business rules
- DO add comments for workarounds or temporary solutions

---

## 16. Database Conventions

### Soft Delete

All major entities support soft delete:

```javascript
// Soft delete
await prisma.project.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Permanent delete
await prisma.project.delete({
  where: { id },
});
```

### Unique Constraints with Soft Delete

Categories use composite unique constraints to allow reusing names after deletion:

```prisma
@@unique([name, deletedAt])
@@unique([slug, deletedAt])
```

### Indexing Strategy

| Index | Purpose |
|-------|---------|
| `@@index([deletedAt])` | Filter active vs trashed records |
| `@@index([deletedAt, status])` | Filter by status within active records |
| `@@index([userId, createdAt])` | User-scoped queries sorted by date |
| `@@index([module, createdAt])` | Audit log queries by module |

### UUID Primary Keys

All models use UUID v4 primary keys. This enables:
- Distributed ID generation
- No sequential ID guessing
- Safe client-generated IDs

---

## 17. Frontend Conventions

### Component Structure

```jsx
// 1. Imports
import { useState, useEffect } from 'react';
import { useAppearance } from '@/contexts/AppearanceContext';

// 2. Component definition
export default function MyComponent({ data }) {
  // 3. Hooks
  const { accentColor } = useAppearance();

  // 4. State
  const [loading, setLoading] = useState(false);

  // 5. Effects
  useEffect(() => { ... }, []);

  // 6. Handlers
  const handleClick = () => { ... };

  // 7. Render
  return (
    <div>...</div>
  );
}
```

### State Management

- Local state: `useState` for UI state (loading, open/closed, form values)
- Global state: Context providers for auth, toasts, appearance
- URL state: Query parameters for filters, search, pagination
- No Redux, no Zustand, no external state libraries

### Styling

- Tailwind utility classes only
- No inline styles (except dynamic values like `accentColor`)
- Dark mode via `dark:` prefix
- Responsive via `sm:`, `md:`, `lg:` prefixes

### Empty States

Every list view must handle empty state:

```jsx
{items.length === 0 ? (
  <div className="text-center py-8">
    <Icon size={32} className="mx-auto text-gray-300 mb-2" />
    <p className="text-gray-500 text-sm">No items yet</p>
  </div>
) : (
  // render items
)}
```

---

## Summary

| Principle | Rule |
|-----------|------|
| Service layer | All business logic in `lib/services/` |
| Response format | Always use `lib/api.js` helpers |
| Error handling | Try/catch all routes, log errors, return human messages |
| Validation | Zod schemas for all write endpoints |
| Naming | PascalCase components, camelCase functions, UPPER_SNAKE constants |
| Permissions | `{module}.{action}` pattern, 62 permissions, 4 roles |
| Audit | Automatic via EventService events |
| Events | Emit on every state change |
| Security | HTTP-only cookies, CSRF, RBAC, validation, headers |
| Shared code | Hooks for 3+ consumers, utils for 3+ files |
| Modals | Always use `useModalAnimation` hook |
| API routes | Auth → RBAC → Validate → Service → Response |
