# Folder Structure

## Root Directory

```
TASKILY-Dashbord/
├── components/          # React components
├── contexts/            # React context providers
├── docs/                # Project documentation
├── hooks/               # Custom React hooks
├── lib/                 # Backend utilities and services
├── pages/               # Next.js pages and API routes
├── prisma/              # Database schema and seed
├── public/              # Static assets
├── styles/              # Global CSS
├── middleware.js         # Edge Runtime middleware
├── next.config.js       # Next.js configuration
├── package.json         # Dependencies and scripts
├── jsconfig.json        # Path aliases
├── tailwind.config.js   # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

---

## `pages/`

**Purpose:** Next.js file-based routing. Every file becomes a route.

**Structure:**

```
pages/
├── _app.jsx              # App wrapper (providers, global imports)
├── _document.jsx         # Custom HTML document (theme script, SSR)
├── index.jsx             # Landing page → redirects to login
├── login.jsx             # (handled by index.jsx)
├── register.jsx          # User registration
├── forgot-password.jsx   # Password reset request
├── verification.jsx      # Email verification (6-digit code)
├── dashboard/            # Authenticated dashboard pages
│   ├── index.jsx         # Dashboard overview
│   ├── projects.jsx      # Project management
│   ├── blogs.jsx         # Blog management
│   ├── media.jsx         # Media library
│   ├── users.jsx         # User management
│   ├── roles.jsx         # Role & permission management
│   ├── settings.jsx      # System configuration
│   ├── notifications.jsx # Notification center
│   ├── audit.jsx         # Audit trail
│   ├── analytics.jsx     # Analytics dashboard
│   ├── calendar.jsx      # Calendar view
│   ├── team.jsx          # Team management
│   ├── tasks.jsx         # Task management
│   ├── emails.jsx        # Email management
│   └── help.jsx          # Help center
└── api/                  # API routes (see below)
```

**Rules:**
- Dashboard pages are wrapped in `DashboardLayout`
- Public pages (register, forgot-password, verification) have no layout wrapper
- `_app.jsx` provides all context providers globally
- `_document.jsx` includes an inline script to prevent theme flash on SSR

---

## `pages/api/`

**Purpose:** Server-side API endpoints. Each file is a Next.js API route.

**Structure:**

```
pages/api/
├── auth/
│   ├── login.js           # POST /api/auth/login
│   ├── register.js        # POST /api/auth/register
│   ├── logout.js          # POST /api/auth/logout
│   ├── me.js              # GET /api/auth/me
│   ├── forgot-password.js # POST /api/auth/forgot-password
│   └── reset-password.js  # POST /api/auth/reset-password
├── projects/
│   ├── index.js           # GET (list) / POST (create)
│   ├── [id].js            # GET / PUT / DELETE single project
│   ├── stats.js           # GET project statistics
│   ├── bulk.js            # POST bulk actions
│   ├── trash.js           # GET trashed projects
│   └── [id]/
│       ├── images.js      # GET / POST / DELETE images
│       └── reorder.js     # PUT reorder images
├── blogs/                 # Same structure as projects
├── media/
│   ├── index.js           # GET / POST
│   ├── [id].js            # GET / PUT / DELETE
│   ├── upload.js          # POST file upload
│   ├── bulk.js            # POST bulk actions
│   ├── folders.js         # GET folder list
│   ├── picker.js          # GET media picker results
│   └── stats.js           # GET media statistics
├── users/                 # Same structure as projects
├── roles/                 # Same structure as projects
├── notifications/
│   ├── index.js           # GET / DELETE
│   ├── [id].js            # PUT / DELETE
│   ├── unread-count.js    # GET unread count
│   └── mark-all-read.js   # PUT mark all read
├── settings/
│   ├── index.js           # GET / PUT settings
│   ├── profile.js         # GET / PUT user profile
│   ├── smtp-test.js       # POST test SMTP
│   ├── system-info.js     # GET system information
│   └── maintenance.js     # GET maintenance status
├── dashboard/
│   ├── overview.js        # GET dashboard overview
│   └── stats.js           # GET dashboard statistics
├── audit/
│   ├── index.js           # GET audit logs
│   ├── [id].js            # GET single audit log
│   └── stats.js           # GET audit statistics
├── project-categories/    # CRUD for project categories
├── blog-categories/       # CRUD for blog categories
└── search.js              # GET global search
```

**Rules:**
- Every route handler exports `default function handler(req, res)`
- HTTP method checking: `if (req.method !== 'GET') return methodNotAllowed(res)`
- Authentication: `getUserFromRequest(req)` at the top of every protected route
- Authorization: `UserService.findById()` + `hasPermission()` check
- Validation: `validateRequest(schema, data)` before service calls
- Response: Always use helpers from `lib/api.js`

**Example route structure:**

```javascript
import { ProjectService, UserService, ActivityService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, createProjectSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed, ... } from '@/lib/api';

export default async function handler(req, res) {
  if (req.method === 'GET') { ... }
  if (req.method === 'POST') { ... }
  return methodNotAllowed(res);
}
```

---

## `components/`

**Purpose:** All React components, organized by responsibility.

### `components/layout/`

**Purpose:** Page-level layout wrappers and navigation.

| File | Responsibility |
|------|---------------|
| `DashboardLayout.jsx` | Main layout wrapper (sidebar + navbar + content area) |
| `Sidebar.jsx` | Navigation sidebar with collapsible menu |
| `Navbar.jsx` | Top bar with search, notifications, user menu |
| `NotificationDropdown.jsx` | Quick notification preview in navbar |
| `EmailDropdown.jsx` | Email notification dropdown |

**Rules:**
- `DashboardLayout` wraps all `/dashboard/*` pages
- Sidebar state (collapsed/expanded) is managed locally
- `NotificationDropdown` polls for unread count

### `components/modals/`

**Purpose:** Overlay dialogs for CRUD operations and confirmations.

| File | Purpose |
|------|---------|
| `ProjectFormModal.jsx` | Create/edit project |
| `ProjectDetailModal.jsx` | View project details |
| `BlogFormModal.jsx` | Create/edit blog post |
| `BlogDetailModal.jsx` | View blog details |
| `UserFormModal.jsx` | Create/edit user |
| `UserDetailModal.jsx` | View user details + password reset |
| `MediaPicker.jsx` | Select media from library |
| `ConfirmDialog.jsx` | Generic confirmation dialog |
| `AddEventSidebar.jsx` | Add event to calendar |
| `AddMemberModal.jsx` | Add team member |
| `AddProjectModal.jsx` | Quick add project |
| `AddTaskModal.jsx` | Add task |
| `ViewMemberModal.jsx` | View team member details |

**Rules:**
- All modals use `useModalAnimation` hook for consistent enter/exit animation
- All modals handle body scroll lock via the animation hook
- `ConfirmDialog` has a `loading` prop for async confirm actions
- Form modals handle their own validation and API calls
- Detail modals are read-only views with action buttons

### `components/sections/`

**Purpose:** Reusable content sections used on dashboard pages.

| File | Used On |
|------|---------|
| `StatsSection.jsx` | Dashboard overview — stat cards |
| `AnalyticsChart.jsx` | Analytics page — charts |
| `ActivityTimeline.jsx` | Dashboard — recent activity |
| `RecentContent.jsx` | Dashboard — latest projects/blogs |
| `RecentNotifications.jsx` | Notifications — notification list |
| `RecentAudit.jsx` | Audit — recent audit entries |
| `ProjectList.jsx` | Dashboard — recent projects |
| `ProjectProgress.jsx` | Dashboard — project progress bars |
| `RemindersCard.jsx` | Dashboard — activity reminders |
| `RoleDistributionChart.jsx` | Roles — pie chart |
| `TeamCollaboration.jsx` | Team — member list |
| `GlobalSearchWidget.jsx` | Search — results display |
| `SystemHealthCard.jsx` | Dashboard — system health |
| `QuickActions.jsx` | Dashboard — action shortcuts |
| `CalendarView.jsx` | Calendar — event display |
| `EventList.jsx` | Calendar — event list |
| `TimeTracker.jsx` | Dashboard — storage overview |

**Rules:**
- Sections receive data via props (never fetch their own data)
- Sections handle empty states gracefully
- Sections use `useAppearance` for accent color theming

### `components/ui/`

**Purpose:** Low-level reusable UI primitives.

| File | Purpose |
|------|---------|
| `Button.jsx` | Styled button with variants |
| `Input.jsx` | Text input with label, error state |
| `Textarea.jsx` | Multi-line input |
| `Select.jsx` | Dropdown select |
| `Badge.jsx` | Status/category badges |
| `Card.jsx` | Content container |
| `StatCard.jsx` | Statistics display card |
| `DataTable.jsx` | Sortable data table with pagination |
| `FilterTabs.jsx` | Tab-based filtering |
| `SearchBar.jsx` | Search input with icon |
| `ActionMenu.jsx` | Dropdown action menu (three dots) |
| `SidebarItem.jsx` | Navigation sidebar item |
| `PermissionGuard.jsx` | Conditional render based on permissions |
| `CommandPalette.jsx` | Global search command palette (Cmd+K) |

**Rules:**
- UI primitives are presentation-only (no business logic)
- `PermissionGuard` uses `usePermission` hook internally
- `CommandPalette` uses `useGlobalSearch` hook

### `components/settings/`

**Purpose:** Settings page sections, one per configuration group.

| File | Setting Group |
|------|---------------|
| `GeneralSettings.jsx` | App name, tagline, language, timezone |
| `BrandingSettings.jsx` | Logo, colors, favicon |
| `EmailSettings.jsx` | SMTP configuration |
| `SeoSettings.jsx` | Meta tags, analytics |
| `SocialSettings.jsx` | Social media links |
| `SecuritySettings.jsx` | Session, 2FA, login attempts |
| `MaintenanceSettings.jsx` | Maintenance mode |
| `ContactSettings.jsx` | Contact information |
| `PasswordSettings.jsx` | Password change |
| `ProfileSettings.jsx` | User profile edit |
| `SystemInfo.jsx` | System health information |
| `SettingsSection.jsx` | Reusable section wrapper |
| `Toggle.jsx` | Toggle switch component |

**Rules:**
- Each settings section manages its own state and API calls
- All sections use the `SettingsSection` wrapper for consistent layout
- Changes are saved individually per section (not a single save button)

### `components/notifications/`

**Purpose:** Notification UI components.

| File | Purpose |
|------|---------|
| `NotificationPanel.jsx` | Full notification list with mark read/delete |
| `NotificationBadge.jsx` | Unread count badge with polling |

---

## `contexts/`

**Purpose:** React context providers for global state.

| File | Purpose |
|------|---------|
| `AuthContext.jsx` | Current user, permissions, login/logout, `hasPermission()` |
| `ToastContext.jsx` | Toast notification system (`success`, `error`, `warning`, `info`) |
| `AppearanceContext.jsx` | Theme (light/dark/auto) and accent color |

**Rules:**
- All context providers are memoized with `useMemo`/`useCallback`
- `AuthContext` uses `useEffect` to fetch `/api/auth/me` on mount
- `AppearanceContext` applies theme class to `document.documentElement`
- `ToastContext` manages toast array with auto-dismiss timers
- All three providers wrap the app in `_app.jsx`

---

## `hooks/`

**Purpose:** Custom React hooks for shared logic.

| File | Purpose | Consumers |
|------|---------|-----------|
| `useApi.js` | Fetch wrapper with error handling, CSRF, loading state | GlobalSearchWidget, SystemInfo |
| `useDebounce.js` | Debounce value changes | projects, blogs, media, MediaPicker |
| `useGlobalSearch.js` | Global search with debounced query | CommandPalette |
| `useModalAnimation.js` | Modal enter/exit animation + body scroll lock | All 13 modals |
| `usePermission.js` | RBAC permission checks (`can`, `canAny`, `canAll`, `cannot`) | PermissionGuard, CommandPalette, QuickActions |

**Rules:**
- Hooks are defined once, imported everywhere
- `useModalAnimation` is mandatory for all modals
- `useDebounce` should be used for any search/filter input
- `usePermission` reads from `AuthContext` internally

---

## `lib/`

**Purpose:** Backend utilities, services, and shared logic.

### `lib/services/`

**Purpose:** Business logic layer. All database operations and domain logic.

Contains 16 service classes + barrel export (`index.js`). See Architecture document for full list.

**Rules:**
- Services use static methods only (no instantiation)
- Services import `prisma` from `lib/prisma.js`
- Services emit events via `EventService` for side effects
- Services never import from `pages/` or `components/`

### `lib/auth.js`

**Purpose:** JWT token management (sign, verify, cookie operations).

### `lib/api.js`

**Purpose:** Standardized API response helpers.

### `lib/csrf.js`

**Purpose:** CSRF token generation, cookie management, validation.

### `lib/patchFetchCsrf.js`

**Purpose:** Global `window.fetch` patch that injects CSRF header into every request. Imported in `_app.jsx`.

### `lib/validation.js`

**Purpose:** Zod schemas for all API input validation. 33 schemas + `validateRequest` helper.

### `lib/pagination.js`

**Purpose:** Pagination parsing and response building. Functions: `parsePagination`, `buildPagination`, `parseSort`, `parseSearch`.

### `lib/password.js`

**Purpose:** Password hashing and comparison using bcryptjs. Functions: `hashPassword`, `comparePassword`.

### `lib/prisma.js`

**Purpose:** Prisma client singleton. Prevents multiple connections in development hot-reload.

### `lib/utils.js`

**Purpose:** Shared utility functions used by both frontend and backend.

---

## `middleware.js`

**Purpose:** Edge Runtime middleware that runs before every request.

**Responsibilities:**
1. Public route bypass
2. JWT verification from HTTP-only cookie
3. CSRF validation on state-changing requests

**Location:** Root directory (required by Next.js)

**Runtime:** Edge Runtime (uses `jose` for JWT, native `Request`/`Response`)

---

## `prisma/`

**Purpose:** Database schema definition and seed data.

| File | Purpose |
|------|---------|
| `schema.prisma` | Complete database schema (models, enums, indexes, relations) |
| `seed.js` | Seed script: creates permissions, roles, admin user, default settings |

**Commands:**
- `npx prisma db push` — Push schema to database
- `npx prisma migrate dev` — Create migration
- `node prisma/seed.js` — Seed database
- `npx prisma studio` — Open Prisma Studio

**Seed creates:**
- 62 permissions across 12 modules
- 4 roles (ADMIN, EDITOR, AUTHOR, VIEWER)
- Admin user: `admin@taskily.com` / `Admin123!`
- Default system settings

---

## `public/`

**Purpose:** Static assets served at the root URL.

Contains favicon, default images, and other static files.

---

## `styles/`

**Purpose:** Global CSS (Tailwind directives, custom animations).

---

## `docs/`

**Purpose:** Project documentation.

| File | Purpose |
|------|---------|
| `README.md` | Documentation index and entry point |
| `01-project-overview.md` | Project goals, philosophy, features |
| `02-architecture.md` | System architecture and design decisions |
| `03-folder-structure.md` | This document |
| `04-tech-stack.md` | Technology choices and rationale |
| `05-coding-principles.md` | Development rules and conventions |
| `reports/` | Historical audit and implementation reports |

---

## Path Aliases

Configured in `jsconfig.json`:

| Alias | Maps To |
|-------|---------|
| `@/*` | `.` (project root) |
| `@/components/*` | `components/*` |
| `@/lib/*` | `lib/*` |
| `@/data/*` | `data/*` |
| `@/styles/*` | `styles/*` |

Used throughout the codebase:

```javascript
import { UserService } from '@/lib/services';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
```
