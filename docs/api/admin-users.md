# Users API

Admin endpoints for managing user accounts, credentials, and statuses.

---

## List users

```
GET /api/users
```

Returns a paginated list of users with optional filtering and sorting.

### Permissions

| Permission |
| :--------- |
| `users.read` |

### Query parameters

| Parameter  | Type     | Default | Description                                                                 |
| :--------- | :------- | :------ | :-------------------------------------------------------------------------- |
| `page`     | `number` | `1`     | Page number                                                                 |
| `perPage`  | `number` | `25`    | Items per page                                                              |
| `search`   | `string` | —       | Search by name or email                                                     |
| `status`   | `string` | —       | Filter by status: `ACTIVE`, `INACTIVE`, `SUSPENDED`                         |
| `roleId`   | `string` | —       | Filter by role UUID                                                         |
| `sort`     | `string` | `createdAt` | Sort field                                                           |
| `order`    | `string` | `desc`  | Sort direction: `asc` or `desc`                                             |

### Response `200`

```jsonc
{
  "users": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1-555-0100",
      "bio": "Product manager",
      "avatar": "https://cdn.example.com/avatars/jane.jpg",
      "status": "ACTIVE",
      "forcePasswordChange": false,
      "role": {
        "id": "uuid",
        "name": "Admin",
        "permissions": ["users.read", "users.create"]
      },
      "createdAt": "2026-01-15T09:30:00Z",
      "updatedAt": "2026-06-20T14:12:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 25,
    "total": 142,
    "totalPages": 6
  }
}
```

---

## Create user

```
POST /api/users
```

Creates a new user account.

### Permissions

| Permission |
| :--------- |
| `users.create` |

### Request body

| Field        | Type       | Required | Description                                          |
| :----------- | :--------- | :------- | :--------------------------------------------------- |
| `name`       | `string`   | Yes      | Full name                                            |
| `email`      | `string`   | Yes      | Email address (must be unique)                       |
| `password`   | `string`   | Yes      | Password (min 8 chars, mixed case, number, symbol)   |
| `roleId`     | `string`   | Yes      | Role UUID                                            |
| `phone`      | `string`   | No       | Phone number                                         |
| `bio`        | `string`   | No       | Short biography                                      |
| `avatar`     | `string`   | No       | Avatar URL                                           |

### Request example

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "S3cure!Pass#99",
  "roleId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "phone": "+1-555-0100",
  "bio": "Product manager"
}
```

### Response `201`

```json
{
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "status": "ACTIVE",
    "role": {
      "id": "uuid",
      "name": "Editor"
    },
    "createdAt": "2026-07-19T10:00:00Z"
  }
}
```

### Errors

| Status | Code               | Description               |
| :----- | :----------------- | :------------------------ |
| `400`  | `VALIDATION_ERROR` | Invalid input             |
| `409`  | `EMAIL_EXISTS`     | Email already registered  |
| `403`  | `FORBIDDEN`        | Insufficient permissions  |

---

## Get user

```
GET /api/users/[id]
```

Returns a single user by ID.

### Permissions

| Permission |
| :--------- |
| `users.read` |

### Response `200`

```json
{
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1-555-0100",
    "bio": "Product manager",
    "avatar": "https://cdn.example.com/avatars/jane.jpg",
    "status": "ACTIVE",
    "forcePasswordChange": false,
    "role": {
      "id": "uuid",
      "name": "Admin",
      "permissions": ["users.read", "users.create", "posts.manage"]
    },
    "lastLoginAt": "2026-07-19T08:15:00Z",
    "createdAt": "2026-01-15T09:30:00Z",
    "updatedAt": "2026-06-20T14:12:00Z"
  }
}
```

### Errors

| Status | Code          | Description  |
| :----- | :------------ | :----------- |
| `404`  | `NOT_FOUND`   | User not found |

---

## Update user

```
PUT /api/users/[id]
```

Updates an existing user's profile and role assignment.

### Permissions

| Permission |
| :--------- |
| `users.update` |

> **Note:** You cannot modify your own account through this endpoint.

### Request body

| Field     | Type     | Required | Description                                          |
| :-------- | :------- | :------- | :--------------------------------------------------- |
| `name`    | `string` | No       | Full name                                            |
| `email`   | `string` | No       | Email address (must be unique)                       |
| `phone`   | `string` | No       | Phone number                                         |
| `bio`     | `string` | No       | Short biography                                      |
| `avatar`  | `string` | No       | Avatar URL                                           |
| `roleId`  | `string` | No       | Role UUID                                            |
| `status`  | `string` | No       | `ACTIVE`, `INACTIVE`, or `SUSPENDED`                  |

### Response `200`

```json
{
  "user": {
    "id": "uuid",
    "name": "Jane Doe (Updated)",
    "email": "jane@example.com",
    "status": "ACTIVE",
    "role": {
      "id": "uuid",
      "name": "Admin"
    },
    "updatedAt": "2026-07-19T10:30:00Z"
  }
}
```

### Errors

| Status | Code               | Description                    |
| :----- | :----------------- | :----------------------------- |
| `400`  | `VALIDATION_ERROR` | Invalid input                  |
| `403`  | `FORBIDDEN`        | Cannot modify own account      |
| `409`  | `EMAIL_EXISTS`     | Email already in use           |

---

## Delete user

```
DELETE /api/users/[id]
```

Permanently deletes a user account.

### Permissions

| Permission |
| :--------- |
| `users.delete` |

> **Note:** You cannot delete your own account.

### Response `200`

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Errors

| Status | Code          | Description                  |
| :----- | :------------ | :--------------------------- |
| `403`  | `FORBIDDEN`   | Cannot delete own account    |
| `404`  | `NOT_FOUND`   | User not found               |

---

## Bulk actions

```
POST /api/users/bulk
```

Perform batch operations on multiple users.

### Permissions

| Action      | Permission Required |
| :---------- | :------------------ |
| `activate`  | `users.update`      |
| `deactivate`| `users.update`      |
| `suspend`   | `users.update`      |
| `delete`    | `users.delete`      |
| `restore`   | `users.restore`     |

### Request body

| Field    | Type       | Required | Description                                       |
| :------- | :--------- | :------- | :------------------------------------------------ |
| `ids`    | `string[]` | Yes      | Array of user UUIDs                               |
| `action` | `string`   | Yes      | `activate`, `deactivate`, `suspend`, `delete`, or `restore` |

### Request example

```json
{
  "ids": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  ],
  "action": "activate"
}
```

### Response `200`

```json
{
  "success": true,
  "affected": 2,
  "message": "2 users activated successfully"
}
```

---

## Statistics

```
GET /api/users/stats
```

Returns aggregate user statistics.

### Permissions

| Permission |
| :--------- |
| `users.read` |

### Response `200`

```json
{
  "total": 142,
  "active": 118,
  "inactive": 15,
  "suspended": 9,
  "recentSignups": 12,
  "byRole": [
    { "roleId": "uuid", "roleName": "Admin", "count": 4 },
    { "roleId": "uuid", "roleName": "Editor", "count": 18 },
    { "roleId": "uuid", "roleName": "Viewer", "count": 120 }
  ]
}
```

---

## Admin reset password

```
POST /api/users/[id]/reset-password
```

Resets a user's password to a new value. The user will receive the new credentials out-of-band.

### Permissions

| Permission |
| :--------- |
| `users.manage` |

> **Note:** You cannot reset your own password through this endpoint.

### Request body

| Field        | Type     | Required | Description                              |
| :----------- | :------- | :------- | :--------------------------------------- |
| `newPassword`| `string` | Yes      | New password (min 8 chars, complexity rules apply) |

### Response `200`

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Errors

| Status | Code               | Description                    |
| :----- | :----------------- | :----------------------------- |
| `403`  | `FORBIDDEN`        | Cannot reset own password      |
| `404`  | `NOT_FOUND`        | User not found                 |

---

## Force password change

```
POST /api/users/[id]/force-password-change
```

Toggles whether a user is required to change their password on next login.

### Permissions

| Permission |
| :--------- |
| `users.manage` |

### Request body

| Field     | Type      | Required | Description                        |
| :-------- | :-------- | :------- | :--------------------------------- |
| `enabled` | `boolean` | Yes      | `true` to force change, `false` to disable |

### Response `200`

```json
{
  "success": true,
  "forcePasswordChange": true,
  "message": "Force password change enabled"
}
```

---

## Change user status

```
PUT /api/users/[id]/status
```

Updates the status of a single user.

### Permissions

| Permission |
| :--------- |
| `users.update` |

> **Note:** You cannot change your own status.

### Request body

| Field    | Type     | Required | Description                              |
| :------- | :------- | :------- | :--------------------------------------- |
| `status` | `string` | Yes      | `ACTIVE`, `INACTIVE`, or `SUSPENDED`      |

### Response `200`

```json
{
  "success": true,
  "status": "SUSPENDED",
  "message": "User status updated"
}
```

### Errors

| Status | Code          | Description                   |
| :----- | :------------ | :---------------------------- |
| `403`  | `FORBIDDEN`   | Cannot change own status      |
| `404`  | `NOT_FOUND`   | User not found                |
