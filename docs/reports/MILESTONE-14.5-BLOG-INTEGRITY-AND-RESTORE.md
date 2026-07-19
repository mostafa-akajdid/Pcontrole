# Milestone 14.5 — Blog Category Data Integrity & Restore Endpoint

**Date:** 2026-07-18
**Status:** COMPLETE

---

## Problem Statement

The blog-categories module had the same deletion guard gap as project-categories (fixed in 14.4): a category could be soft-deleted even when actively assigned to blogs. Additionally, the blogs module lacked an individual restore endpoint — restore was only available through the bulk action endpoint.

---

## Fixes

### 1. BlogCategoryService.delete() — Usage Check

**File:** `lib/services/BlogCategoryService.js`

Added a blog count check before soft-deletion, identical to the project-categories fix:

```js
const blogCount = await prisma.blog.count({
  where: {
    categories: { some: { id } },
    deletedAt: null,
  },
});

if (blogCount > 0) {
  throw new Error(
    `This category is assigned to ${blogCount} blog${blogCount !== 1 ? 's' : ''} and cannot be deleted. Remove the category from all blogs first.`
  );
}
```

### 2. Blog-Categories API Route — 409 Status + Real Category Name

**File:** `pages/api/blog-categories/[id].js`

Two changes:

1. **409 Conflict status** for in-use errors:
   ```js
   if (error.message.includes('cannot be deleted')) {
     return errorResponse(res, error.message, 409);
   }
   ```

2. **Real category name in activity log** — fetches the category before deletion:
   ```js
   const existingCategory = await BlogCategoryService.findById(id);
   // ... after delete ...
   details: { name: existingCategory.name },
   ```

### 3. Individual Blog Restore Endpoint

**File:** `pages/api/blogs/[id].js`

Added `?restore=true` query parameter support on the DELETE route, consistent with the blog-categories and project-categories pattern:

```js
if (restore === 'true') {
  const blog = await BlogService.restore(id, extractRequestMetadata(req, tokenPayload.userId));
  await ActivityService.log({
    userId: tokenPayload.userId,
    action: 'RESTORED',
    entityType: 'Blog',
    entityId: blog.id,
    details: { title: blog.title },
  });
  return successResponse(res, blog, 'Blog restored successfully');
}
```

Requires `blogs.delete` permission (same as soft-delete). Also added `'Deleted blog not found'` to the not-found error handling.

---

## Intentionally Not Fixed

### BlogService.restore() — Slug Collision Check

The audit flagged that `BlogService.restore()` lacks a slug collision guard. This is a **false positive**: `Blog.slug` uses `@unique` (global unique, not scoped to `deletedAt`), so the slug remains reserved when the blog is soft-deleted. No new blog can claim that slug while the original is deleted, and restoring simply clears `deletedAt`. No collision is possible.

---

## Build

```
✓ Compiled successfully
✓ 21 static pages generated
✓ Middleware: 32.5 kB
```

---

## Files Modified

| File | Change |
|------|--------|
| `lib/services/BlogCategoryService.js` | Added blog count check in `delete()` — blocks deletion when active blogs reference the category |
| `pages/api/blog-categories/[id].js` | Returns 409 for in-use errors; fetches actual category name for activity log |
| `pages/api/blogs/[id].js` | Added `?restore=true` query param for individual blog restore; added `Deleted blog not found` to error handling |
