# Notifications & Search API

Endpoints for managing user notifications and performing global search across the CMS.

---

## Table of Contents

- [Notifications](#notifications)
  - [List Notifications](#list-notifications)
  - [Bulk Delete Notifications](#bulk-delete-notifications)
  - [Get Notification](#get-notification)
  - [Mark Notification as Read](#mark-notification-as-read)
  - [Delete Notification](#delete-notification)
  - [Mark All as Read](#mark-all-as-read)
  - [Unread Count](#unread-count)
- [Global Search](#global-search)

---

## Notifications

### List Notifications

Returns a paginated list of notifications for the authenticated user.

```
GET /api/notifications
```

#### Authorization

Any authenticated, non-suspended user may access this endpoint.

#### Query Parameters

| Parameter   | Type      | Required | Description                                              |
| ----------- | --------- | -------- | -------------------------------------------------------- |
| `page`      | `number`  | No       | Page number (1-indexed). Default: `1`                    |
| `perPage`   | `number`  | No       | Results per page. Default: `20`, Max: `100`             |
| `search`    | `string`  | No       | Search notification titles and messages                  |
| `type`      | `string`  | No       | Filter by notification type (e.g., `info`, `warning`, `error`, `success`) |
| `priority`  | `string`  | No       | Filter by priority (`low`, `normal`, `high`, `urgent`)   |
| `unreadOnly`| `boolean` | No       | When `true`, returns only unread notifications           |

#### Response

**`200 OK`**

```json
{
  "notifications": [
    {
      "id": "ntf_a1b2c3",
      "title": "New comment on your post",
      "message": "John Smith commented on \"Getting Started with Taskily\"",
      "type": "info",
      "priority": "normal",
      "read": false,
      "link": "/blogs/blog_a1b2c3",
      "metadata": {
        "commentId": "cmt_x1y2z3",
        "blogTitle": "Getting Started with Taskily"
      },
      "createdAt": "2025-05-28T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Error Responses

| Status | Code                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token             |
| `403`  | `FORBIDDEN`             | Account is suspended                 |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error              |

---

### Bulk Delete Notifications

Deletes multiple notifications by their IDs.

```
DELETE /api/notifications
```

#### Authorization

Any authenticated, non-suspended user may delete their own notifications.

#### Request Body

| Field | Type       | Required | Description                          |
| ----- | ---------- | -------- | ------------------------------------ |
| `ids` | `string[]` | Yes      | Array of notification IDs to delete  |

#### Example Request

```json
{
  "ids": ["ntf_a1b2c3", "ntf_d4e5f6", "ntf_g7h8i9"]
}
```

#### Response

**`200 OK`**

```json
{
  "message": "3 notifications deleted",
  "deletedCount": 3
}
```

#### Error Responses

| Status | Code                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| `400`  | `VALIDATION_ERROR`      | Missing or empty `ids` array         |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token             |
| `403`  | `FORBIDDEN`             | Account is suspended                 |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error              |

---

### Get Notification

Returns a single notification, scoped to the authenticated user.

```
GET /api/notifications/[id]
```

#### Authorization

Any authenticated, non-suspended user. Users can only access their own notifications.

#### Path Parameters

| Parameter | Type     | Description           |
| --------- | -------- | --------------------- |
| `id`      | `string` | The notification ID   |

#### Response

**`200 OK`**

```json
{
  "notification": {
    "id": "ntf_a1b2c3",
    "title": "New comment on your post",
    "message": "John Smith commented on \"Getting Started with Taskily\"",
    "type": "info",
    "priority": "normal",
    "read": false,
    "link": "/blogs/blog_a1b2c3",
    "metadata": {
      "commentId": "cmt_x1y2z3"
    },
    "createdAt": "2025-05-28T14:30:00.000Z"
  }
}
```

#### Error Responses

| Status | Code                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token             |
| `403`  | `FORBIDDEN`             | Account is suspended or notification belongs to another user |
| `404`  | `NOT_FOUND`             | Notification not found               |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error              |

---

### Mark Notification as Read

Marks a single notification as read.

```
PATCH /api/notifications/[id]
```

#### Authorization

Any authenticated, non-suspended user.

#### Path Parameters

| Parameter | Type     | Description           |
| --------- | -------- | --------------------- |
| `id`      | `string` | The notification ID   |

#### Request Body

| Field    | Type     | Required | Description                         |
| -------- | -------- | -------- | ----------------------------------- |
| `action` | `string` | Yes      | Must be `"read"`                    |

#### Example Request

```json
{
  "action": "read"
}
```

#### Response

**`200 OK`**

```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": "ntf_a1b2c3",
    "read": true
  }
}
```

#### Error Responses

| Status | Code                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| `400`  | `VALIDATION_ERROR`      | Missing or invalid `action`          |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token             |
| `403`  | `FORBIDDEN`             | Account is suspended                 |
| `404`  | `NOT_FOUND`             | Notification not found               |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error              |

---

### Delete Notification

Deletes a single notification.

```
DELETE /api/notifications/[id]
```

#### Authorization

Any authenticated, non-suspended user.

#### Path Parameters

| Parameter | Type     | Description           |
| --------- | -------- | --------------------- |
| `id`      | `string` | The notification ID   |

#### Response

**`200 OK`**

```json
{
  "message": "Notification deleted"
}
```

#### Error Responses

| Status | Code                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token             |
| `403`  | `FORBIDDEN`             | Account is suspended                 |
| `404`  | `NOT_FOUND`             | Notification not found               |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error              |

---

### Mark All as Read

Marks all unread notifications for the authenticated user as read.

```
POST /api/notifications/mark-all-read
```

#### Authorization

Any authenticated, non-suspended user.

#### Response

**`200 OK`**

```json
{
  "message": "All notifications marked as read",
  "updatedCount": 12
}
```

#### Error Responses

| Status | Code                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token             |
| `403`  | `FORBIDDEN`             | Account is suspended                 |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error              |

---

### Unread Count

Returns the count of unread notifications along with summary statistics.

```
GET /api/notifications/unread-count
```

#### Authorization

Any authenticated, non-suspended user.

#### Response

**`200 OK`**

```json
{
  "unreadCount": 12,
  "stats": {
    "total": 45,
    "unread": 12,
    "highPriority": 3,
    "byType": {
      "info": 7,
      "warning": 3,
      "error": 1,
      "success": 1
    }
  }
}
```

#### Error Responses

| Status | Code                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token             |
| `403`  | `FORBIDDEN`             | Account is suspended                 |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error              |

---

## Global Search

Performs a global search across all CMS content types (projects, blogs, pages, users, media).

```
GET /api/search
```

### Authorization

Any authenticated user may access this endpoint.

### Query Parameters

| Parameter | Type     | Required | Description                                       |
| --------- | -------- | -------- | ------------------------------------------------- |
| `search`  | `string` | Yes      | Search query. Minimum **2 characters**.           |

### Response

**`200 OK`**

```json
{
  "groups": {
    "projects": {
      "results": [
        {
          "id": "proj_x1y2z3",
          "title": "Website Redesign",
          "description": "Complete overhaul of the corporate website",
          "status": "active",
          "url": "/projects/proj_x1y2z3"
        }
      ],
      "totalResults": 3
    },
    "blogs": {
      "results": [
        {
          "id": "blog_a1b2c3",
          "title": "Getting Started with Taskily",
          "excerpt": "A comprehensive guide to getting started...",
          "status": "published",
          "url": "/blogs/blog_a1b2c3"
        }
      ],
      "totalResults": 5
    },
    "pages": {
      "results": [],
      "totalResults": 0
    },
    "users": {
      "results": [
        {
          "id": "usr_d4e5f6",
          "name": "Jane Doe",
          "email": "jane@example.com",
          "role": "admin",
          "url": "/users/usr_d4e5f6"
        }
      ],
      "totalResults": 1
    },
    "media": {
      "results": [],
      "totalResults": 0
    }
  },
  "totalResults": 9,
  "query": "website"
}
```

### Response Fields

| Field                          | Type     | Description                              |
| ------------------------------ | -------- | ---------------------------------------- |
| `groups`                       | `object` | Search results grouped by content type   |
| `groups.projects`              | `object` | Project search results                   |
| `groups.blogs`                 | `object` | Blog post search results                 |
| `groups.pages`                 | `object` | Page search results                      |
| `groups.users`                 | `object` | User search results                      |
| `groups.media`                 | `object` | Media asset search results               |
| `groups.*.results`             | `array`  | Matching items for this content type     |
| `groups.*.totalResults`        | `number` | Count of matches for this content type   |
| `totalResults`                 | `number` | Total results across all content types   |
| `query`                        | `string` | The original search query                |

### Error Responses

| Status | Code                    | Description                              |
| ------ | ----------------------- | ---------------------------------------- |
| `400`  | `VALIDATION_ERROR`      | `search` parameter missing or < 2 chars  |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token                 |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error                  |
