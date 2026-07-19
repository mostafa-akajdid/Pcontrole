# Milestone 14.3 — Project Trash Workflow

**Date:** 2026-07-18
**Status:** COMPLETE

---

## Problem Statement

Projects supported soft delete (`DELETE /api/projects/:id` sets `deletedAt`), but there was no way to:
- View deleted projects
- Restore deleted projects
- Permanently delete projects
- See the count of trashed projects

The trash lifecycle was incomplete: delete worked, but recovery and cleanup were impossible.

---

## Implementation

### 1. ProjectService — New Methods

**File:** `lib/services/ProjectService.js`

#### `findDeleted()` — List soft-deleted projects
- Queries `deletedAt: { not: null }`
- Supports search (title, client, slug), pagination, sorting
- Returns `{ projects, total }` matching the same pattern as `findAll()`

#### `permanentDelete()` — Hard-delete a soft-deleted project
- Finds project where `deletedAt: { not: null }`
- Cascades: deletes associated `ProjectImage` records first
- Uses `prisma.project.delete()` for actual DB removal
- Emits `project.permanently_deleted` event

#### `bulkAction()` — Added `permanentDelete` action
- Filters by `deletedAt: { not: null }` (only trashed items)
- Cascades image deletion before project deletion
- Emits `project.bulk_action` event with `action: 'permanentDelete'`

#### `getStats()` — Added `trashed` count
- New count: `prisma.project.count({ where: { deletedAt: { not: null } } })`
- Returns `{ total, published, draft, featured, trashed }`

### 2. Validation Schema

**File:** `lib/validation.js`

Added `permanentDelete` to `projectBulkActionSchema` action enum:
```js
action: z.enum(['publish', 'unpublish', 'delete', 'restore', 'permanentDelete', 'feature', 'unfeature'])
```

### 3. API Route — `/api/projects/trash`

**File:** `pages/api/projects/trash.js` (new)

- `GET /api/projects/trash` — Lists soft-deleted projects
- Requires `projects.read` permission
- Supports `search`, `page`, `perPage`, `sort`, `order` query params
- Returns paginated response matching `/api/projects` format

### 4. Bulk Route Permission Update

**File:** `pages/api/projects/bulk.js`

Added `permanentDelete` to the actions requiring `projects.delete` permission:
```js
const requiredPerm = ['delete', 'restore', 'permanentDelete'].includes(req.body.action)
```

### 5. Frontend — Trash Tab & UI

**File:** `pages/dashboard/projects.jsx`

#### Status Tabs
Added `{ value: 'TRASH', label: 'Trash' }` to the filter tabs.

#### Trash Fetch
When `statusFilter === 'TRASH'`, fetches from `/api/projects/trash` instead of `/api/projects`. Category, year, and status filters are skipped in trash mode.

#### Trash-Specific Actions (per-item)
When viewing trashed projects, the ActionMenu shows:
- **Restore** — calls `handleBulkActionSingle(id, 'restore')`
- **Delete Permanently** — opens `permanentDeleteConfirm` dialog

#### Trash-Specific Bulk Actions
When items are selected in Trash mode, the bulk action bar shows:
- **Restore** — calls `handleBulkAction('restore')`
- **Delete Permanently** — opens `bulkPermanentDeleteConfirm` dialog

#### Trash Stats Card
Added a 5th stats card (Trash) with red icon, clickable to switch to TRASH filter.

#### Conditional UI
- "New Project" button hidden in Trash mode
- Category/Year/Sort dropdowns hidden in Trash mode
- Search bar placeholder changes to "Search trash..."
- Page title changes to "Trash" with subtitle "Manage deleted projects"
- Empty state shows "Trash is empty" message

#### Confirmation Dialogs
- `permanentDeleteConfirm` — Single project permanent delete
- `bulkPermanentDeleteConfirm` — Bulk permanent delete

---

## Complete Lifecycle Verification

| Step | Action | Result |
|------|--------|--------|
| 1 | Create project | Project appears in All/Published/Draft |
| 2 | Edit project | Changes saved, reflected in list |
| 3 | Soft Delete | Project disappears from active list, appears in Trash |
| 4 | View Trash | Click Trash tab or Trash stats card — deleted project listed |
| 5 | Search in Trash | Search bar filters trashed projects |
| 6 | Restore | Project returns to active list, removed from Trash |
| 7 | Permanent Delete | Project permanently removed from database |

---

## Permission Model

| Action | Required Permission |
|--------|-------------------|
| View Trash | `projects.read` |
| Restore (single) | `projects.delete` |
| Restore (bulk) | `projects.delete` |
| Permanent Delete (single) | `projects.delete` |
| Permanent Delete (bulk) | `projects.delete` |

---

## Active Query Integrity

All existing queries continue to exclude soft-deleted records:
- `findAll()` — `deletedAt: null`
- `findById()` — `deletedAt: null`
- `findByIdOrThrow()` — `deletedAt: null`
- `findBySlug()` — `deletedAt: null`
- `generateUniqueSlug()` — `deletedAt: null`
- `getStats()` — all counts use `deletedAt: null` (except `trashed`)
- `bulkAction()` non-trash actions — `deletedAt: null`

Trash queries exclusively use `deletedAt: { not: null }`.

---

## Files Modified

| File | Change |
|------|--------|
| `lib/services/ProjectService.js` | Added `findDeleted()`, `permanentDelete()`, `permanentDelete` bulk action, `trashed` stat |
| `lib/validation.js` | Added `permanentDelete` to bulk action enum |
| `pages/api/projects/trash.js` | **New** — GET endpoint for listing soft-deleted projects |
| `pages/api/projects/bulk.js` | Added `permanentDelete` to delete-permission actions |
| `pages/dashboard/projects.jsx` | Trash tab, trash fetch, trash actions, trash bulk actions, trash stats card, conditional UI |

---

## Build

```
✓ Compiled successfully
✓ /api/projects/trash — 82.7 kB
✓ /dashboard/projects — 250 kB
✓ 21 static pages generated
✓ Middleware: 32.5 kB
```

---

## Conclusion

The Projects module now has a complete soft delete lifecycle: create → soft delete → view in trash → restore OR permanent delete. The trash view reuses existing components (`FilterTabs`, `ActionMenu`, `ConfirmDialog`, `DataTable`) and follows the established design patterns. Active queries remain isolated from deleted records via consistent `deletedAt: null` filtering.
