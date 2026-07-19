# Milestone 14.5.1 — Category Delete UX

**Date:** 2026-07-18
**Status:** COMPLETE

---

## Root Cause

The `ConfirmDialog` component's `handleConfirm` function started the close animation **before** the async operation completed:

```js
// BEFORE (broken)
const handleConfirm = () => {
    setIsAnimating(false);              // dialog goes invisible immediately
    setTimeout(() => onConfirm(), 300); // API call starts 300ms later
};
```

When the user clicked "Delete" on a category assigned to projects:

1. `setIsAnimating(false)` fired — dialog faded out (opacity-0, scale-95)
2. 300ms later, `onConfirm()` fired — fetch started
3. Backend returned 409
4. `toast.error(json.message)` fired — **but the dialog was already invisible**

The toast did fire, but the user saw the dialog vanish and perceived "nothing happened." The dialog was technically still mounted (`isOpen` was still `true`) but invisible due to `opacity-0`.

---

## Fixes

### 1. ConfirmDialog — Do Not Animate Close on Confirm

**File:** `components/modals/ConfirmDialog.jsx`

Removed `setIsAnimating(false)` from `handleConfirm`. The dialog now stays fully visible until the parent explicitly closes it via `isOpen=false`:

```js
// AFTER (fixed)
const handleConfirm = () => {
    setTimeout(() => onConfirm(), 100);
};
```

When the parent sets `isOpen=false` (on success), the useEffect triggers the close animation. On error, the dialog stays visible and the toast appears while the user can still see the dialog.

### 2. Backend — Include Category Name in 409 Message

**File:** `lib/services/ProjectCategoryService.js`

Changed the error message from generic to specific:

```
BEFORE: "This category is assigned to 3 projects and cannot be deleted. Remove the category from all projects first."
AFTER:  "Category 'Architecture' is assigned to 3 projects and cannot be deleted."
```

### 3. Frontend — Loading State for Category Delete

**File:** `pages/dashboard/projects.jsx`

Added `categoryDeleteLoading` state, wired into the handler and ConfirmDialog:

- Buttons disabled during request (`loading` prop)
- Confirm button shows "Please wait..." while loading
- Cancel button also disabled to prevent close-during-request
- `finally` block always resets loading state

---

## Complete Request/Response Flow

### Delete unused category

1. User clicks Delete in ConfirmDialog
2. Dialog stays visible, buttons show "Please wait..."
3. `DELETE /api/project-categories/:id` sent
4. Backend: `projectCount === 0`, soft-deletes category
5. Response: `200 { success: true, message: "Category deleted successfully" }`
6. Frontend: `toast.success('Category deleted')`, dialog closes, list refreshes

### Delete used category

1. User clicks Delete in ConfirmDialog
2. Dialog stays visible, buttons show "Please wait..."
3. `DELETE /api/project-categories/:id` sent
4. Backend: `projectCount === 5`, throws error
5. Response: `409 { success: false, message: "Category 'Architecture' is assigned to 5 projects and cannot be deleted." }`
6. Frontend: `toast.error("Category 'Architecture' is assigned to 5 projects and cannot be deleted.")`
7. Dialog **stays open** (user can cancel or retry)
8. Buttons re-enabled

---

## Files Modified

| File | Change |
|------|--------|
| `components/modals/ConfirmDialog.jsx` | Removed `setIsAnimating(false)` from `handleConfirm` — dialog stays visible until parent closes it |
| `lib/services/ProjectCategoryService.js` | Error message now includes category name: `Category 'X' is assigned to N projects...` |
| `pages/dashboard/projects.jsx` | Added `categoryDeleteLoading` state, wired into handler and ConfirmDialog |

---

## Build

```
Compiled successfully
21 static pages generated
```
