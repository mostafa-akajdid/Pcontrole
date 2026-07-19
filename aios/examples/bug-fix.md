# Example: Bug Fix

## Scenario

The Product Owner reports: "When I try to delete a user who has projects, I get a 500 error."

## AI Response (Following AIOS)

### Objective

Investigate and fix the 500 error that occurs when deleting a user who has associated projects.

### Analysis

This is a database constraint issue. When a user has projects, and the projects table has a foreign key to the users table with `onDelete: Restrict`, deleting the user violates the constraint.

Let me investigate the current implementation:

1. **User deletion flow:** `DELETE /api/users/[id]` → `UserService.delete(id)` → `prisma.user.delete()`
2. **Foreign key constraint:** `Project.authorId` references `User.id` with `onDelete: Restrict`
3. **The error:** Prisma throws a foreign key constraint violation, which surfaces as a 500

### Root Cause

The `UserService.delete()` method calls `prisma.user.delete()` directly without checking for dependent records. The database has `onDelete: Restrict` on the projects table, which prevents deletion when references exist.

### Plan

1. Investigate the exact error path (S)
2. Modify `UserService.delete()` to handle the constraint violation (S)
3. Return a meaningful error message instead of 500 (S)
4. Verify the fix (S)

### Implementation

**File: `lib/services/UserService.js`**

The delete method needs to:
1. Check if the user has any dependent records (projects, blogs, etc.)
2. If dependent records exist, return a clear error message
3. If no dependent records, proceed with deletion

```
// Before (broken)
async delete(id) {
  return await prisma.user.delete({ where: { id } });
}

// After (fixed)
async delete(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: { projects: true, blogs: true }
      }
    }
  });

  if (!user) throw new Error('User not found');

  if (user._count.projects > 0 || user._count.blogs > 0) {
    throw new Error(
      `Cannot delete user with ${user._count.projects} projects and ${user._count.blogs} blogs. Reassign or delete them first.`
    );
  }

  return await prisma.user.delete({ where: { id } });
}
```

**File: `pages/api/users/[id].js`**

The API route needs to catch this specific error and return 409 Conflict instead of 500.

### Verification

- Build: PASSED
- Delete user with projects: Returns 409 with message "Cannot delete user with 3 projects and 1 blogs"
- Delete user without projects: Returns 200, user deleted
- Delete non-existent user: Returns 404
- Existing user operations: No regressions

### Risks

- Users with existing projects cannot be deleted — this is intentional behavior, not a bug
- The error message exposes dependent record counts — acceptable for admin users

### Next Step

Fix is complete and verified. Awaiting human review.

## Key Patterns Demonstrated

1. **Investigation before coding** — Root cause identified before any code was written
2. **Minimal fix** — Only the necessary code was changed
3. **Meaningful error** — User gets a clear message, not a 500
4. **Edge case coverage** — All deletion scenarios verified
5. **No refactoring** — Only the bug was fixed, nothing else changed
