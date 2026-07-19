# Dashboard API

Endpoints for retrieving dashboard overview data and aggregate statistics.

---

## Table of Contents

- [Dashboard Overview](#dashboard-overview)
- [Dashboard Statistics](#dashboard-statistics)

---

## Dashboard Overview

Returns high-level overview data for the admin dashboard.

```
GET /api/dashboard/overview
```

### Authorization

| Permission    | Scope    |
| ------------- | -------- |
| `dashboard.read` | Required |

### Response

**`200 OK`**

```json
{
  "overview": {
    "totalProjects": 24,
    "activeProjects": 8,
    "totalBlogs": 142,
    "publishedBlogs": 98,
    "totalUsers": 312,
    "activeUsers": 87,
    "totalPages": 56,
    "recentSignups": 14
  }
}
```

### Error Responses

| Status | Code                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token             |
| `403`  | `FORBIDDEN`             | Missing `dashboard.read` permission  |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error              |

---

## Dashboard Statistics

Returns detailed statistics including recent projects, blog posts, and activity feed.

```
GET /api/dashboard/stats
```

### Authorization

| Permission    | Scope    |
| ------------- | -------- |
| `dashboard.read` | Required |

### Response

**`200 OK`**

```json
{
  "stats": {
    "projects": {
      "total": 24,
      "active": 8,
      "completed": 12,
      "onHold": 4
    },
    "blogs": {
      "total": 142,
      "published": 98,
      "drafts": 32,
      "archived": 12
    },
    "users": {
      "total": 312,
      "active": 87,
      "suspended": 5
    }
  },
  "recentProjects": [
    {
      "id": "proj_x1y2z3",
      "name": "Website Redesign",
      "status": "active",
      "updatedAt": "2025-05-28T10:30:00.000Z"
    }
  ],
  "recentBlogs": [
    {
      "id": "blog_a1b2c3",
      "title": "Getting Started with Taskily",
      "status": "published",
      "createdAt": "2025-05-27T14:00:00.000Z"
    }
  ],
  "recentActivity": [
    {
      "id": "act_m1n2o3",
      "action": "project.created",
      "description": "New project \"Website Redesign\" was created",
      "userId": "usr_p1q2r3",
      "userName": "Jane Doe",
      "createdAt": "2025-05-28T10:30:00.000Z"
    },
    {
      "id": "act_s1t2u3",
      "action": "blog.published",
      "description": "Blog post \"Getting Started with Taskily\" was published",
      "userId": "usr_v1w2x3",
      "userName": "John Smith",
      "createdAt": "2025-05-27T14:00:00.000Z"
    }
  ]
}
```

### Response Fields

| Field                                    | Type     | Description                            |
| ---------------------------------------- | -------- | -------------------------------------- |
| `stats.projects`                         | `object` | Aggregate project counts by status     |
| `stats.blogs`                            | `object` | Aggregate blog counts by status        |
| `stats.users`                            | `object` | Aggregate user counts by status        |
| `recentProjects`                         | `array`  | Most recently updated projects         |
| `recentBlogs`                            | `array`  | Most recently created blog posts       |
| `recentActivity`                         | `array`  | Latest audit log entries               |

### Error Responses

| Status | Code                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token             |
| `403`  | `FORBIDDEN`             | Missing `dashboard.read` permission  |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error              |
