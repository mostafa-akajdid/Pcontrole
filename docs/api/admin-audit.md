# Audit Log API

Endpoints for querying and analyzing the system audit trail.

---

## Table of Contents

- [List Audit Logs](#list-audit-logs)
- [Get Audit Log](#get-audit-log)
- [Audit Statistics](#audit-statistics)

---

## List Audit Logs

Returns a paginated list of audit log entries with optional filtering.

```
GET /api/audit
```

### Authorization

| Permission   | Scope    |
| ------------ | -------- |
| `audit.view` | Required |

### Query Parameters

| Parameter  | Type     | Required | Description                                                                 |
| ---------- | -------- | -------- | --------------------------------------------------------------------------- |
| `page`     | `number` | No       | Page number (1-indexed). Default: `1`                                       |
| `perPage`  | `number` | No       | Results per page. Default: `20`, Max: `100`                                |
| `search`   | `string` | No       | Full-text search across action descriptions and entity names                |
| `module`   | `string` | No       | Filter by module (e.g., `projects`, `blogs`, `users`, `settings`, `auth`)  |
| `action`   | `string` | No       | Filter by action (e.g., `create`, `update`, `delete`, `login`)            |
| `entityType`| `string`| No       | Filter by entity type (e.g., `project`, `blog`, `user`, `page`)           |
| `userId`   | `string` | No       | Filter by the user who performed the action                                |
| `startDate`| `string` | No       | ISO 8601 date string. Return logs after this date                          |
| `endDate`  | `string` | No       | ISO 8601 date string. Return logs before this date                         |

### Response

**`200 OK`**

```json
{
  "logs": [
    {
      "id": "aud_r1s2t3",
      "action": "create",
      "module": "projects",
      "entityType": "project",
      "entityId": "proj_x1y2z3",
      "description": "Created project \"Website Redesign\"",
      "userId": "usr_a1b2c3d4",
      "userName": "Jane Doe",
      "userEmail": "jane@example.com",
      "metadata": {
        "projectName": "Website Redesign"
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-05-28T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 1542,
    "totalPages": 78
  }
}
```

### Response Fields

| Field           | Type      | Description                                |
| --------------- | --------- | ------------------------------------------ |
| `logs`          | `array`   | Array of audit log entries                 |
| `logs[].id`     | `string`  | Unique audit log identifier                |
| `logs[].action` | `string`  | Action performed (`create`, `update`, `delete`, `login`, etc.) |
| `logs[].module` | `string`  | System module affected                     |
| `logs[].entityType` | `string` | Entity type of the target                 |
| `logs[].entityId` | `string` | ID of the affected entity                  |
| `logs[].description` | `string` | Human-readable description               |
| `logs[].userId` | `string`  | ID of the user who performed the action    |
| `logs[].userName` | `string` | Name of the user                          |
| `logs[].metadata` | `object` | Additional context data                   |
| `logs[].ipAddress` | `string` | IP address of the request                 |
| `logs[].createdAt` | `string` | ISO 8601 timestamp                        |
| `pagination`     | `object`  | Pagination metadata                        |

### Error Responses

| Status | Code                    | Description                      |
| ------ | ----------------------- | -------------------------------- |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token         |
| `403`  | `FORBIDDEN`             | Missing `audit.view` permission  |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error          |

---

## Get Audit Log

Returns a single audit log entry by its ID.

```
GET /api/audit/[id]
```

### Authorization

| Permission   | Scope    |
| ------------ | -------- |
| `audit.view` | Required |

### Path Parameters

| Parameter | Type     | Description          |
| --------- | -------- | -------------------- |
| `id`      | `string` | The audit log ID     |

### Response

**`200 OK`**

```json
{
  "log": {
    "id": "aud_r1s2t3",
    "action": "update",
    "module": "settings",
    "entityType": "setting",
    "entityId": "site_name",
    "description": "Updated setting \"site_name\" from \"Old Name\" to \"New Name\"",
    "userId": "usr_a1b2c3d4",
    "userName": "Jane Doe",
    "userEmail": "jane@example.com",
    "metadata": {
      "key": "site_name",
      "oldValue": "Old Name",
      "newValue": "New Name"
    },
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2025-05-28T10:30:00.000Z"
  }
}
```

### Error Responses

| Status | Code                    | Description                      |
| ------ | ----------------------- | -------------------------------- |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token         |
| `403`  | `FORBIDDEN`             | Missing `audit.view` permission  |
| `404`  | `NOT_FOUND`             | Audit log not found              |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error          |

---

## Audit Statistics

Returns aggregate statistics and module-level breakdowns for the audit log.

```
GET /api/audit/stats
```

### Authorization

| Permission   | Scope    |
| ------------ | -------- |
| `audit.view` | Required |

### Response

**`200 OK`**

```json
{
  "stats": {
    "totalLogs": 1542,
    "todayLogs": 34,
    "weekLogs": 218,
    "monthLogs": 891,
    "uniqueUsers": 42,
    "actionsBreakdown": {
      "create": 512,
      "update": 687,
      "delete": 198,
      "login": 145
    }
  },
  "moduleCounts": {
    "projects": 423,
    "blogs": 312,
    "users": 187,
    "settings": 95,
    "pages": 214,
    "auth": 311
  }
}
```

### Response Fields

| Field                            | Type     | Description                           |
| -------------------------------- | -------- | ------------------------------------- |
| `stats.totalLogs`                | `number` | Total audit log entries               |
| `stats.todayLogs`                | `number` | Logs created today                    |
| `stats.weekLogs`                 | `number` | Logs created in the last 7 days       |
| `stats.monthLogs`                | `number` | Logs created in the last 30 days      |
| `stats.uniqueUsers`              | `number` | Unique users in audit trail           |
| `stats.actionsBreakdown`         | `object` | Count of entries per action type      |
| `moduleCounts`                   | `object` | Count of entries per module           |

### Error Responses

| Status | Code                    | Description                      |
| ------ | ----------------------- | -------------------------------- |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token         |
| `403`  | `FORBIDDEN`             | Missing `audit.view` permission  |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error          |
