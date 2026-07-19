# Milestone 11.5 — Event-Driven Architecture Integration

## Summary

Integrated `EventService.emit()` into every business service to complete the event-driven architecture. Business services now publish events through `EventService`, which dispatches to `NotificationService` and `AuditService`. No business service calls `NotificationService` or `AuditService` directly.

## Architecture Flow

```
Business Service
  └─ EventService.emit(eventType, payload)
       ├─ NotificationService.create(...)  → DB notifications
       └─ AuditService.log(...)            → DB audit_logs
```

## Services Updated

| Service | Events Added | Methods Modified |
|---------|-------------|-----------------|
| `ProjectService` | `project.created`, `project.updated`, `project.published`, `project.deleted`, `project.restored`, `project.bulk_action` | `create`, `update`, `delete`, `restore`, `bulkAction` |
| `BlogService` | `blog.created`, `blog.updated`, `blog.published`, `blog.deleted`, `blog.restored`, `blog.bulk_action` | `create`, `update`, `delete`, `restore`, `bulkAction` |
| `MediaService` | `media.uploaded`, `media.updated`, `media.deleted`, `media.bulk_action` | `create`, `update`, `delete`, `bulkAction` |
| `UserService` | `user.created`, `user.updated`, `user.deleted`, `user.restored`, `user.status_changed` | `create`, `update`, `delete`, `restore`, `updateStatus` |
| `RoleService` | `role.created`, `role.updated`, `role.deleted`, `role.cloned` | `create`, `update`, `delete`, `clone` |
| `SettingsService` | `settings.updated` | `update` (replaced direct `prisma.activityLog.create`) |

## Event Types Registered in EventService

### Content Events
- `project.created` → Notification (author) + Audit
- `project.updated` → Notification (actor) + Audit
- `project.published` → Notification (actor) + Audit
- `project.deleted` → Audit only
- `project.restored` → Audit only
- `project.bulk_action` → Audit only
- `blog.created` → Notification (author) + Audit
- `blog.updated` → Audit only
- `blog.published` → Notification (actor) + Audit
- `blog.deleted` → Audit only
- `blog.restored` → Audit only
- `blog.bulk_action` → Audit only
- `media.uploaded` → Notification (actor) + Audit
- `media.updated` → Audit only
- `media.deleted` → Audit only
- `media.bulk_action` → Audit only

### User Events
- `user.created` → Notification (actor) + Audit
- `user.updated` → Audit only
- `user.deleted` → Audit only
- `user.restored` → Audit only
- `user.status_changed` → Notification (actor) + Audit

### System Events
- `role.created` → Notification (actor) + Audit
- `role.updated` → Audit only
- `role.deleted` → Audit only
- `role.cloned` → Audit only
- `settings.updated` → Notification (actor) + Audit

## API Routes Updated

All write-operation API routes now extract request metadata and pass it to services:

### Metadata Extraction
```js
import { extractRequestMetadata } from '@/lib/api';
const metadata = extractRequestMetadata(req, tokenPayload.userId);
// Returns: { actorId, ipAddress, userAgent }
```

### Routes Updated
- `pages/api/projects/index.js` — POST (create)
- `pages/api/projects/[id].js` — PUT/PATCH (update), DELETE
- `pages/api/projects/bulk.js` — POST (bulk actions)
- `pages/api/blogs/index.js` — POST (create)
- `pages/api/blogs/[id].js` — PUT/PATCH (update), DELETE
- `pages/api/blogs/bulk.js` — POST (bulk actions)
- `pages/api/media/index.js` — POST (upload)
- `pages/api/media/[id].js` — PUT (update), DELETE
- `pages/api/media/bulk.js` — POST (bulk actions)
- `pages/api/users/index.js` — POST (create)
- `pages/api/users/[id].js` — PUT (update), DELETE
- `pages/api/users/[id]/status.js` — PUT (status change)
- `pages/api/roles/index.js` — POST (create)
- `pages/api/roles/[id].js` — PUT (update), DELETE
- `pages/api/roles/[id]/clone.js` — POST (clone)
- `pages/api/settings/index.js` — PUT (update)

## Utility Added

`extractRequestMetadata(req, actorId)` in `lib/api.js`:
- Extracts `ipAddress` from `x-forwarded-for` or `socket.remoteAddress`
- Extracts `userAgent` from `user-agent` header
- Returns `{ actorId, ipAddress, userAgent }`

## Design Decisions

1. **Optional metadata parameter**: All service methods accept an optional `metadata = {}` parameter at the end of their signature. This ensures backward compatibility — services called from seed scripts or internal code work without metadata.

2. **Fire-and-forget events**: All `EventService.emit()` calls are wrapped with `.catch(() => {})` to prevent notification/audit failures from blocking the main request.

3. **Actor ID fallback**: Where `actorId` is not provided, services fall back to the entity's owner (e.g., `authorId` for projects/blogs, `uploadedById` for media).

4. **No direct service coupling**: Business services only import `EventService`. They never import `NotificationService` or `AuditService`.

5. **SettingsService cleanup**: Removed direct `prisma.activityLog.create` call, replaced with `EventService.emit('settings.updated')`.

## Quality Checks

- ✅ Build passes clean (zero errors)
- ✅ No direct `NotificationService` calls from business services
- ✅ No direct `AuditService` calls from business services
- ✅ All 28 `EventService.emit()` calls verified
- ✅ All 26 `AuditService.log()` calls only in `EventService.js`
- ✅ All 10 `NotificationService.create()` calls only in `EventService.js`
- ✅ All 16 API routes updated with metadata extraction
- ✅ No duplicated logic

## Remaining Items

1. `prisma db push` must be run to apply Notification/AuditLog schema
2. Seed must be re-run to add new permissions
3. `ActivityService` still exists for legacy activity logs but is no longer called from write routes (only read by DashboardService/GlobalSearchService)
