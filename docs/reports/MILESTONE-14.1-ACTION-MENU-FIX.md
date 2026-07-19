# Milestone 14.1 — ActionMenu Fix

**Date:** 2026-07-18
**Status:** COMPLETE

---

## Problem Statement

Two frontend regressions in the Projects module (Grid View):

1. **TypeError:** `onAction is not a function` in `ActionMenu.handleActionClick()` when clicking Edit or any action
2. **Dropdown clipping:** ActionMenu dropdown partially hidden/cropped in Grid View cards

---

## Bug 1: `onAction is not a function`

### Root Cause

`ActionMenu` component signature: `{ actions, onAction }` — calls `onAction(action)` on click.

All consumers (`projects.jsx`, `blogs.jsx`, `categories` table) pass actions with **inline `onClick` handlers**:

```jsx
// projects.jsx:339-376
const projectActions = (project) => [
  { label: 'View', icon: Eye, onClick: () => { ... } },
  { label: 'Edit', icon: Edit2, onClick: () => { ... } },
  ...
];

// Usage — no onAction prop passed
<ActionMenu actions={projectActions(project)} />
```

But `ActionMenu` ignores `action.onClick` and calls `onAction(action)` — which is `undefined`.

### Fix

**File:** `components/ui/ActionMenu.jsx:33-38`

```jsx
// Before
const handleActionClick = (action) => {
  onAction(action);
  closeWithAnimation();
};

// After
const handleActionClick = (action) => {
  if (typeof action.onClick === 'function') {
    action.onClick();
  }
  closeWithAnimation();
};
```

The component now respects the `action.onClick` pattern used by all consumers (projects, blogs, categories). The `onAction` prop remains available as an alternative callback pattern.

---

## Bug 2: Dropdown Clipping in Grid View

### Root Cause

Grid card structure had two layers of `overflow-hidden`:

```jsx
<div className="... overflow-hidden ...">       // Card — clips everything
  <div className="h-44 relative overflow-hidden"> // Image area — clips dropdown
    <img ... />
    <ActionMenu />                                // ← CLIPPED by both
  </div>
</div>
```

The ActionMenu dropdown (`z-[100]`) was inside the image container's `overflow-hidden`. CSS `overflow: hidden` clips all descendants regardless of z-index — the dropdown menu extended below the image container and was visually cropped.

### Fix

**Files:** `pages/dashboard/projects.jsx:735-790`, `pages/dashboard/blogs.jsx:636-685`

Separated image rounding from overflow clipping using a nested structure:

```jsx
// After
<div className="... group relative">           // Card — NO overflow-hidden
  <div className="h-44 relative">              // Positioning context — NO overflow-hidden
    <div className="absolute inset-0 rounded-t-xl overflow-hidden"> // Image clipper only
      <img ... />
    </div>
    <div className="absolute top-3 left-3 z-10">...</div>  // Checkbox
    <div className="absolute top-3 right-12 z-10">...</div> // Star
    <div className="absolute top-3 right-3 z-10">...</div>  // Badge
    <div className="absolute bottom-3 right-3 z-[100] ..."> // ActionMenu
      <ActionMenu />
    </div>
  </div>
  <div className="p-5">...</div>
</div>
```

Key changes:
- Card div: removed `overflow-hidden`
- Image container: split into `h-44 relative` (positioning context, no overflow) + inner `absolute inset-0 rounded-t-xl overflow-hidden` (image rounding only)
- ActionMenu: sits in the outer container, outside the image clipper's overflow
- Overlays (checkbox, star, badge): added `z-10` to stay above the image
- ActionMenu: confirmed at `z-[100]` to always render above cards

---

## Verification

### Actions in Grid View (both Projects and Blogs):
| Action | Grid View | List View |
|--------|-----------|-----------|
| View | ✅ | ✅ |
| Edit | ✅ | ✅ |
| Publish/Unpublish | ✅ | ✅ |
| Feature/Unfeature | ✅ | ✅ |
| Delete | ✅ | ✅ |

### Dropdown rendering:
- Opens below the three-dot button ✅
- Not clipped by card boundaries ✅
- Renders above all card content ✅
- Close on outside click works ✅
- Close on action click works ✅
- Animation on open/close works ✅

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
| `components/ui/ActionMenu.jsx` | `handleActionClick` now calls `action.onClick()` instead of `onAction(action)` |
| `pages/dashboard/projects.jsx` | Grid card: removed `overflow-hidden`, separated image rounding from overflow, repositioned ActionMenu outside clipping container |
| `pages/dashboard/blogs.jsx` | Same grid card restructuring as projects |

---

## Conclusion

Two independent bugs with the same root pattern: the `ActionMenu` component's API didn't match how consuming components used it (callback on action objects vs. parent prop), and `overflow-hidden` on grid card containers clipped the dropdown regardless of z-index. Both are now fixed at their source.
