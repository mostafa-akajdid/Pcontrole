# Milestone 14.4 — Category Data Integrity

**Date:** 2026-07-18
**Status:** COMPLETE

---

## Problem Statement

A project category could be soft-deleted even when actively assigned to one or more projects. The deletion succeeded silently, and the category-project relationships were orphaned — the category's `deletedAt` was set, but the many-to-many join table remained intact, leaving projects with a reference to a "deleted" category.

---

## Root Cause

`ProjectCategoryService.delete()` performed no referential integrity check before soft-deleting. It only verified the category existed, then set `deletedAt`. The method never counted active projects referencing the category.

---

## Fix

### `lib/services/ProjectCategoryService.js` — `delete()` method

Added a project count check before soft-deletion:

```js
static async delete(id) {
  const category = await prisma.projectCategory.findFirst({
    where: { id, deletedAt: null },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  const projectCount = await prisma.project.count({
    where: {
      categories: { some: { id } },
      deletedAt: null,
    },
  });

  if (projectCount > 0) {
    throw new Error(
      `This category is assigned to ${projectCount} project${projectCount !== 1 ? 's' : ''} and cannot be deleted. Remove the category from all projects first.`
    );
  }

  await prisma.projectCategory.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return { message: 'Category deleted successfully' };
}
```

The check queries active projects (`deletedAt: null`) that reference this category via the implicit many-to-many relation. If any exist, deletion is blocked with a descriptive error including the exact count.

### `pages/api/project-categories/[id].js` — `handleDelete()` 

Two improvements:

1. **Proper HTTP status**: Business validation errors (category in use) now return `409 Conflict` instead of `500 Internal Server Error`:
   ```js
   if (error.message.includes('cannot be deleted')) {
     return errorResponse(res, error.message, 409);
   }
   ```

2. **Fixed activity log**: The hardcoded `details: { name: 'Category' }` was replaced with the actual category name fetched before deletion:
   ```js
   const existingCategory = await ProjectCategoryService.findById(id);
   // ... after delete ...
   details: { name: existingCategory.name },
   ```

---

## Verification

### Delete unused category
- `DELETE /api/project-categories/:id` where no projects reference it
- Result: `200 OK`, `{ success: true, message: 'Category deleted successfully' }`
- Category soft-deleted (`deletedAt` set)

### Delete used category
- `DELETE /api/project-categories/:id` where 12 active projects reference it
- Result: `409 Conflict`, `{ success: false, message: 'This category is assigned to 12 projects and cannot be deleted. Remove the category from all projects first.' }`
- Category remains intact

### Frontend error display
- `handleDeleteCategory()` in `projects.jsx:336-350` checks `json.success`
- On failure: `toast.error(json.message)` shows the full descriptive message
- Delete confirmation dialog remains open until user cancels

### Active query integrity
- All `findAll`, `findById`, `search` queries already filter projects by `deletedAt: null`
- The new count check also filters by `deletedAt: null` — only active projects block deletion

---

## Files Modified

| File | Change |
|------|--------|
| `lib/services/ProjectCategoryService.js` | Added project count check in `delete()` — blocks deletion when active projects reference the category |
| `pages/api/project-categories/[id].js` | Returns 409 for in-use errors; fetches actual category name for activity log |

---

## Build

```
✓ Compiled successfully
✓ 21 static pages generated
✓ Middleware: 32.5 kB
```

---

## Conclusion

Category deletion now enforces referential integrity at the service layer. The check counts only active (non-deleted) projects, uses a single efficient `prisma.project.count()` query with the implicit many-to-many relation, and returns a descriptive error with the exact project count. The API returns proper HTTP 409 status, and the frontend displays the error message via toast.
