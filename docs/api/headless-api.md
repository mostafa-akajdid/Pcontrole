# Headless API Key Management

Admin endpoints for creating, managing, and revoking API keys used by external consumers of the public API.

**Base URL:** `/api/settings/headless-api`

---

## Permissions

All endpoints require an authenticated user session (JWT cookie). The following RBAC permissions control access:

| Permission | Scope |
| --- | --- |
| `headless.view` | List and retrieve API keys |
| `headless.create` | Create new API keys |
| `headless.update` | Update key metadata and toggle enabled/disabled |
| `headless.regenerate` | Regenerate the API key value |
| `headless.delete` | Permanently delete an API key |

In the dashboard UI, the Headless API Keys tab is hidden unless the user has `headless.view`. Individual action buttons (Create, Edit, Toggle, Regenerate, Delete) are conditionally rendered based on the corresponding permission.

---

## List API Keys

```
GET /api/settings/headless-api
```

Returns all API keys, ordered by creation date (newest first). API key values are masked in the response.

### Permission

`headless.view`

### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` (UUID) | No | If provided, returns a single key instead of the full list |

### Response `200 OK` — List

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "siteName": "Client Website",
      "domain": "https://client-website.com",
      "apiKey": "tk_a1b2...e1f2",
      "enabled": true,
      "allowedModules": ["projects", "blogs"],
      "createdAt": "2024-06-15T10:30:00.000Z",
      "updatedAt": "2024-06-15T10:30:00.000Z"
    }
  ],
  "message": "Success"
}
```

### Response `200 OK` — Single key (when `?id=` is provided)

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "siteName": "Client Website",
    "domain": "https://client-website.com",
    "apiKey": "tk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
    "enabled": true,
    "allowedModules": ["projects", "blogs"],
    "createdAt": "2024-06-15T10:30:00.000Z",
    "updatedAt": "2024-06-15T10:30:00.000Z"
  },
  "message": "Success"
}
```

> **Note:** The list endpoint returns the API key masked as `tk_a1b2...e1f2` (first 8 + last 4 characters). The full key is only available in the creation response and the single-key GET response.

### Response Fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Key UUID |
| `siteName` | `string` | Display name for the consuming site |
| `domain` | `string` | Allowed origin domain |
| `apiKey` | `string` | API key (masked in list, full in single-key response) |
| `enabled` | `boolean` | Whether the key is active |
| `allowedModules` | `string[]` | Modules this key can access |
| `createdAt` | `string` | ISO 8601 timestamp |
| `updatedAt` | `string` | ISO 8601 timestamp |

### Valid Modules

| Module | Description |
| --- | --- |
| `projects` | Public projects listing and detail |
| `blogs` | Public blog posts |
| `categories` | Category data |
| `media` | Media assets |
| `settings` | Public site settings |

---

## Create API Key

```
POST /api/settings/headless-api
```

Creates a new API key. The key value is generated server-side and returned **once** in the response.

### Permission

`headless.create`

### Request Body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `siteName` | `string` | Yes | Display name (1–100 characters) |
| `domain` | `string` | Yes | Origin domain (1–200 characters) |
| `enabled` | `boolean` | No | Enable the key immediately (default: `true`) |
| `allowedModules` | `string[]` | No | Modules to grant access to (default: `[]`) |

### Request Example

```json
{
  "siteName": "Client Portfolio",
  "domain": "https://portfolio.example.com",
  "enabled": true,
  "allowedModules": ["projects"]
}
```

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "d4e5f6a7-b8c9-0123-def4-567890123456",
    "siteName": "Client Portfolio",
    "domain": "https://portfolio.example.com",
    "apiKey": "tk_f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
    "enabled": true,
    "allowedModules": ["projects"],
    "createdAt": "2024-07-20T08:00:00.000Z",
    "updatedAt": "2024-07-20T08:00:00.000Z"
  },
  "message": "API key created successfully"
}
```

> **Important:** Store the `apiKey` value securely. It is masked in all subsequent list responses.

### Validation Errors

```json
{
  "success": false,
  "error": "Validation failed",
  "data": {
    "siteName": "Site name is required"
  }
}
```

---

## Update API Key

```
PUT /api/settings/headless-api
```

Updates an existing API key's metadata, toggles its enabled state, or regenerates the key value. The behavior is controlled by the `action` field.

### Permission

| Action | Required Permission |
| --- | --- |
| Update metadata (default) | `headless.update` |
| `toggle` | `headless.update` |
| `regenerate` | `headless.regenerate` |

---

### Update Metadata

Modify the site name, domain, enabled state, or allowed modules.

**Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Yes | Key UUID |
| `siteName` | `string` | No | New display name (1–100 characters) |
| `domain` | `string` | No | New domain (1–200 characters) |
| `enabled` | `boolean` | No | Enable/disable the key |
| `allowedModules` | `string[]` | No | Replace the allowed modules list |

**Request:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "siteName": "Updated Site Name",
  "allowedModules": ["projects", "blogs", "categories"]
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "siteName": "Updated Site Name",
    "domain": "https://client-website.com",
    "apiKey": "tk_a1b2...e1f2",
    "enabled": true,
    "allowedModules": ["projects", "blogs", "categories"],
    "createdAt": "2024-06-15T10:30:00.000Z",
    "updatedAt": "2024-07-20T09:15:00.000Z"
  },
  "message": "API key updated successfully"
}
```

---

### Toggle Enabled/Disabled

Flips the `enabled` state of the key.

**Body:**

```json
{
  "action": "toggle",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "siteName": "Client Website",
    "domain": "https://client-website.com",
    "apiKey": "tk_a1b2...e1f2",
    "enabled": false,
    "allowedModules": ["projects"],
    "createdAt": "2024-06-15T10:30:00.000Z",
    "updatedAt": "2024-07-20T09:20:00.000Z"
  },
  "message": "API key disabled successfully"
}
```

---

### Regenerate API Key

Generates a new key value. The old key is immediately invalidated.

**Body:**

```json
{
  "action": "regenerate",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "siteName": "Client Website",
    "domain": "https://client-website.com",
    "apiKey": "tk_9f8e7d6c5b4a3210fedcba9876543210abcdef0123456789abcdef0123456789",
    "enabled": true,
    "allowedModules": ["projects"],
    "createdAt": "2024-06-15T10:30:00.000Z",
    "updatedAt": "2024-07-20T09:25:00.000Z"
  },
  "message": "API key regenerated successfully"
}
```

> **Important:** The full new API key is returned in this response. Update all consumers immediately — the previous key is no longer valid.

---

## Delete API Key

```
DELETE /api/settings/headless-api?id=<uuid>
```

Permanently deletes an API key. This action cannot be undone.

### Permission

`headless.delete`

### Query Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` (UUID) | Yes | Key UUID to delete |

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "API key deleted successfully",
    "siteName": "Client Website"
  },
  "message": "API key deleted successfully"
}
```

### Error `400 Bad Request` — Missing ID

```json
{
  "success": false,
  "error": "API key ID is required"
}
```

### Error `500` — Key not found

```json
{
  "success": false,
  "error": "API key not found"
}
```

---

## Audit Logging

Every mutation is logged via the `EventService` to the `AuditService` with `module: "headless"` and `entityType: "HeadlessApiKey"`.

| Event | Audit Action | Trigger |
| --- | --- | --- |
| `headless_api_key.created` | `CREATE` | New key created |
| `headless_api_key.updated` | `UPDATE` | Metadata changed |
| `headless_api_key.enabled` | `ENABLE` | Key re-enabled via toggle |
| `headless_api_key.disabled` | `DISABLE` | Key disabled via toggle |
| `headless_api_key.regenerated` | `REGENERATE` | Key value regenerated |
| `headless_api_key.deleted` | `DELETE` | Key permanently removed |

Each audit log entry includes:

| Field | Description |
| --- | ---|
| `userId` | ID of the admin who performed the action |
| `action` | `CREATE`, `UPDATE`, `DELETE`, `ENABLE`, `DISABLE`, `REGENERATE` |
| `module` | `headless` |
| `entityType` | `HeadlessApiKey` |
| `entityId` | UUID of the affected key |
| `oldValues` | Previous state (for updates, toggles, deletes) |
| `newValues` | New state (for creates, updates, toggles, regenerates) |
| `ipAddress` | Requesting client IP |
| `userAgent` | Requesting client user agent |

---

## Error Responses

All endpoints share the following error format:

| Status | Meaning |
| --- | --- |
| `401` | No valid user session (JWT cookie missing or expired) |
| `403` | Authenticated user lacks the required permission |
| `400` | Validation error or missing required field |
| `405` | HTTP method not allowed |
| `500` | Internal server error |

```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

```json
{
  "success": false,
  "error": "Validation failed",
  "data": {
    "siteName": "Site name is required",
    "domain": "Domain is required"
  }
}
```
