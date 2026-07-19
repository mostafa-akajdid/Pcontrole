# Roles API

Admin endpoints for managing roles and permission assignments.

---

## List roles

```
GET /api/roles
```

Returns all roles with their assigned permissions.

### Permissions

| Permission |
| :--------- |
| `roles.read` |

### Response `200`

```jsonc
{
  "roles": [
    {
      "id": "uuid",
      "name": "Admin",
      "description": "Full system access",
      "isSystem": true,
      "userCount": 4,
      "permissions": [
        {
          "id": "uuid",
          "key": "users.read",
          "label": "View Users",
          "module": "users"
        },
        {
          "id": "uuid",
          "key": "users.create",
          "label": "Create Users",
          "module": "users"
        }
      ],
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-06-15T12:00:00Z"
    }
  ]
}
```

---

## Create role

```
POST /api/roles
```

Creates a new role with optional permission assignments.

### Permissions

| Permission |
| :--------- |
| `roles.create` |

### Request body

| Field          | Type       | Required | Description                                   |
| :------------- | :--------- | :------- | :-------------------------------------------- |
| `name`         | `string`   | Yes      | Unique role name                              |
| `description`  | `string`   | No       | Role description                              |
| `permissionIds`| `string[]` | No       | Array of permission UUIDs to assign           |

### Request example

```json
{
  "name": "Content Manager",
  "description": "Can manage all content but not users",
  "permissionIds": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  ]
}
```

### Response `201`

```json
{
  "role": {
    "id": "uuid",
    "name": "Content Manager",
    "description": "Can manage all content but not users",
    "isSystem": false,
    "permissions": [
      {
        "id": "uuid",
        "key": "posts.manage",
        "label": "Manage Posts",
        "module": "posts"
      }
    ],
    "createdAt": "2026-07-19T10:00:00Z"
  }
}
```

### Errors

| Status | Code               | Description               |
| :----- | :----------------- | :------------------------ |
| `400`  | `VALIDATION_ERROR` | Invalid input             |
| `409`  | `NAME_EXISTS`      | Role name already in use  |

---

## Get role

```
GET /api/roles/[id]
```

Returns a single role with its full permission set.

### Permissions

| Permission |
| :--------- |
| `roles.read` |

### Response `200`

```json
{
  "role": {
    "id": "uuid",
    "name": "Editor",
    "description": "Can manage posts and pages",
    "isSystem": false,
    "userCount": 18,
    "permissions": [
      {
        "id": "uuid",
        "key": "posts.manage",
        "label": "Manage Posts",
        "module": "posts"
      }
    ],
    "createdAt": "2026-01-15T09:00:00Z",
    "updatedAt": "2026-06-20T14:00:00Z"
  }
}
```

### Errors

| Status | Code        | Description  |
| :----- | :---------- | :----------- |
| `404`  | `NOT_FOUND` | Role not found |

---

## Update role

```
PUT /api/roles/[id]
```

Updates a role's name, description, and permission assignments.

### Permissions

| Permission |
| :--------- |
| `roles.update` |

### Request body

| Field          | Type       | Required | Description                                   |
| :------------- | :--------- | :------- | :-------------------------------------------- |
| `name`         | `string`   | No       | Role name                                     |
| `description`  | `string`   | No       | Role description                              |
| `permissionIds`| `string[]` | No       | Full replacement of assigned permission UUIDs  |

### Response `200`

```json
{
  "role": {
    "id": "uuid",
    "name": "Editor",
    "description": "Updated description",
    "isSystem": false,
    "permissions": [],
    "updatedAt": "2026-07-19T10:30:00Z"
  }
}
```

### Errors

| Status | Code               | Description               |
| :----- | :----------------- | :------------------------ |
| `403`  | `FORBIDDEN`        | Cannot modify system role |
| `409`  | `NAME_EXISTS`      | Role name already in use  |

---

## Delete role

```
DELETE /api/roles/[id]
```

Deletes a role. Fails if the role is currently assigned to users.

### Permissions

| Permission |
| :--------- |
| `roles.delete` |

### Response `200`

```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

### Errors

| Status | Code              | Description                     |
| :----- | :---------------- | :------------------------------ |
| `403`  | `FORBIDDEN`       | Cannot delete system role       |
| `409`  | `ROLE_IN_USE`     | Role is assigned to users       |
| `404`  | `NOT_FOUND`       | Role not found                  |

---

## Clone role

```
POST /api/roles/[id]/clone
```

Creates a copy of an existing role with all its permissions.

### Permissions

| Permission |
| :--------- |
| `roles.create` |

### Request body

| Field  | Type     | Required | Description                                |
| :----- | :------- | :------- | :----------------------------------------- |
| `name` | `string` | No       | Name for the cloned role (defaults to `{original} (Copy)`) |

### Request example

```json
{
  "name": "Editor - Draft"
}
```

### Response `201`

```json
{
  "role": {
    "id": "uuid",
    "name": "Editor - Draft",
    "description": "Can manage posts and pages",
    "isSystem": false,
    "permissions": [
      {
        "id": "uuid",
        "key": "posts.manage",
        "label": "Manage Posts",
        "module": "posts"
      }
    ],
    "createdAt": "2026-07-19T11:00:00Z"
  }
}
```

---

## List all permissions

```
GET /api/roles/permissions
```

Returns a flat list of every permission available in the system.

### Response `200`

```json
{
  "permissions": [
    {
      "id": "uuid",
      "key": "users.read",
      "label": "View Users",
      "description": "Can view user list and profiles",
      "module": "users"
    },
    {
      "id": "uuid",
      "key": "posts.create",
      "label": "Create Posts",
      "description": "Can create new posts",
      "module": "posts"
    }
  ]
}
```

---

## Permissions by module

```
GET /api/roles/permissions-by-module
```

Returns all permissions grouped by their module.

### Response `200`

```jsonc
{
  "modules": [
    {
      "name": "users",
      "permissions": [
        {
          "id": "uuid",
          "key": "users.read",
          "label": "View Users"
        },
        {
          "id": "uuid",
          "key": "users.create",
          "label": "Create Users"
        },
        {
          "id": "uuid",
          "key": "users.update",
          "label": "Update Users"
        },
        {
          "id": "uuid",
          "key": "users.delete",
          "label": "Delete Users"
        },
        {
          "id": "uuid",
          "key": "users.manage",
          "label": "Manage Users"
        }
      ]
    },
    {
      "name": "roles",
      "permissions": [
        {
          "id": "uuid",
          "key": "roles.read",
          "label": "View Roles"
        },
        {
          "id": "uuid",
          "key": "roles.create",
          "label": "Create Roles"
        },
        {
          "id": "uuid",
          "key": "roles.update",
          "label": "Update Roles"
        },
        {
          "id": "uuid",
          "key": "roles.delete",
          "label": "Delete Roles"
        }
      ]
    },
    {
      "name": "posts",
      "permissions": [
        {
          "id": "uuid",
          "key": "posts.read",
          "label": "View Posts"
        },
        {
          "id": "uuid",
          "key": "posts.create",
          "label": "Create Posts"
        },
        {
          "id": "uuid",
          "key": "posts.update",
          "label": "Update Posts"
        },
        {
          "id": "uuid",
          "key": "posts.delete",
          "label": "Delete Posts"
        },
        {
          "id": "uuid",
          "key": "posts.publish",
          "label": "Publish Posts"
        },
        {
          "id": "uuid",
          "key": "posts.manage",
          "label": "Manage Posts"
        }
      ]
    },
    {
      "name": "media",
      "permissions": [
        {
          "id": "uuid",
          "key": "media.read",
          "label": "View Media"
        },
        {
          "id": "uuid",
          "key": "media.create",
          "label": "Upload Media"
        },
        {
          "id": "uuid",
          "key": "media.update",
          "label": "Update Media"
        },
        {
          "id": "uuid",
          "key": "media.delete",
          "label": "Delete Media"
        }
      ]
    },
    {
      "name": "pages",
      "permissions": [
        {
          "id": "uuid",
          "key": "pages.read",
          "label": "View Pages"
        },
        {
          "id": "uuid",
          "key": "pages.create",
          "label": "Create Pages"
        },
        {
          "id": "uuid",
          "key": "pages.update",
          "label": "Update Pages"
        },
        {
          "id": "uuid",
          "key": "pages.delete",
          "label": "Delete Pages"
        },
        {
          "id": "uuid",
          "key": "pages.publish",
          "label": "Publish Pages"
        }
      ]
    }
  ]
}
```

---

## Statistics

```
GET /api/roles/stats
```

Returns aggregate role statistics.

### Response `200`

```json
{
  "total": 6,
  "systemRoles": 3,
  "customRoles": 3,
  "totalPermissions": 24,
  "mostAssigned": {
    "roleId": "uuid",
    "name": "Viewer",
    "userCount": 120
  },
  "leastAssigned": {
    "roleId": "uuid",
    "name": "Super Admin",
    "userCount": 1
  }
}
```
