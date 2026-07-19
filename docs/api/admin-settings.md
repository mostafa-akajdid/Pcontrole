# Settings API

Administrative endpoints for managing system settings, user profiles, maintenance mode, SMTP configuration, and system information.

---

## Table of Contents

- [Get Settings](#get-settings)
- [Update Settings](#update-settings)
- [Get User Profile](#get-user-profile)
- [Update Profile / Change Password](#update-profile--change-password)
- [Get Maintenance Info](#get-maintenance-info)
- [Test SMTP](#test-smtp)
- [System Information](#system-information)

---

## Get Settings

Retrieves system settings, optionally filtered by group.

```
GET /api/settings
```

### Authorization

| Permission     | Scope    |
| -------------- | -------- |
| `settings.read` | Required |

### Query Parameters

| Parameter | Type      | Required | Description                                                                                                       |
| --------- | --------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `group`   | `string`  | No       | Filter by setting group. One of: `general`, `branding`, `seo`, `contact`, `social`, `email`, `localization`, `security`, `maintenance`, `display` |
| `meta`    | `boolean` | No       | When `true`, includes metadata for each setting (description, type, group, constraints).                          |

### Response

**`200 OK`**

Returns a settings object or grouped settings object depending on whether a `group` filter was applied.

```json
{
  "settings": {
    "site_name": "Taskily",
    "site_description": "Modern project management",
    "site_url": "https://taskily.com"
  }
}
```

**With `meta=true`:**

```json
{
  "settings": {
    "site_name": {
      "value": "Taskily",
      "description": "The name of the site",
      "type": "string",
      "group": "general"
    }
  }
}
```

**Grouped response (no `group` filter):**

```json
{
  "settings": {
    "general": {
      "site_name": "Taskily"
    },
    "branding": {
      "logo_url": "https://..."
    },
    "seo": {
      "meta_title": "Taskily"
    }
  }
}
```

### Error Responses

| Status | Code                  | Description                  |
| ------ | --------------------- | ---------------------------- |
| `401`  | `UNAUTHORIZED`        | Missing or invalid token     |
| `403`  | `FORBIDDEN`           | Missing `settings.read` permission |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error    |

---

## Update Settings

Updates one or more system settings.

```
PUT /api/settings
```

### Authorization

| Permission      | Scope    |
| --------------- | -------- |
| `settings.update` | Required |

### Request Body

| Field                 | Type     | Required | Description                                                                 |
| --------------------- | -------- | -------- | --------------------------------------------------------------------------- |
| `settings`            | `array`  | Yes      | Array of setting updates. Each entry contains `key` and `value`.            |
| `settings[].key`      | `string` | Yes      | The setting key. Max **100 characters**.                                    |
| `settings[].value`    | `string` | Yes      | The setting value. Max **10,000 characters**.                               |
| `group`               | `string` | No       | Optional group to associate with all settings in the request.               |

### Constraints

- **Maximum settings per request:** `100`
- **Key length:** max `100` characters
- **Value length:** max `10,000` characters

### Example Request

```json
{
  "settings": [
    { "key": "site_name", "value": "Taskily" },
    { "key": "site_description", "value": "Modern project management" },
    { "key": "site_url", "value": "https://taskily.com" }
  ],
  "group": "general"
}
```

### Response

**`200 OK`**

```json
{
  "message": "Settings updated successfully",
  "updated": ["site_name", "site_description", "site_url"]
}
```

### Error Responses

| Status | Code                    | Description                              |
| ------ | ----------------------- | ---------------------------------------- |
| `400`  | `VALIDATION_ERROR`      | Invalid key/value length or missing fields |
| `400`  | `TOO_MANY_SETTINGS`     | Exceeds 100 settings per request         |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token                 |
| `403`  | `FORBIDDEN`             | Missing `settings.update` permission     |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error                  |

---

## Get User Profile

Retrieves the authenticated user's profile.

```
GET /api/settings/profile
```

### Authorization

Any authenticated user may access their own profile.

### Response

**`200 OK`**

```json
{
  "user": {
    "id": "usr_a1b2c3d4",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1-555-0123",
    "bio": "Product manager",
    "avatar": "https://cdn.taskily.com/avatars/jane.jpg",
    "role": "admin",
    "createdAt": "2025-01-15T09:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code                    | Description                  |
| ------ | ----------------------- | ---------------------------- |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token     |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error      |

---

## Update Profile / Change Password

Updates the authenticated user's profile or changes their password.

```
PUT /api/settings/profile
```

### Authorization

Any authenticated user may update their own profile.

### Query Parameters

| Parameter | Type     | Required | Description                                  |
| --------- | -------- | -------- | -------------------------------------------- |
| `type`    | `string` | No       | Set to `password` to perform a password change instead of a profile update. |

### Profile Update (default)

**Request Body:**

| Field   | Type     | Required | Description              |
| ------- | -------- | -------- | ------------------------ |
| `name`  | `string` | No       | Display name             |
| `email` | `string` | No       | Email address            |
| `phone` | `string` | No       | Phone number             |
| `bio`   | `string` | No       | Short biography          |
| `avatar`| `string` | No       | Avatar URL               |

**Example:**

```json
{
  "name": "Jane Doe",
  "email": "jane@newdomain.com",
  "bio": "Updated bio"
}
```

**`200 OK` Response:**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "usr_a1b2c3d4",
    "name": "Jane Doe",
    "email": "jane@newdomain.com"
  }
}
```

### Password Change

Append `?type=password` to the request URL.

**Request Body:**

| Field             | Type     | Required | Description              |
| ----------------- | -------- | -------- | ------------------------ |
| `currentPassword` | `string` | Yes      | Current password         |
| `newPassword`     | `string` | Yes      | New password             |
| `confirmPassword` | `string` | Yes      | Must match `newPassword` |

**Example:**

```json
{
  "currentPassword": "old-pass-123",
  "newPassword": "new-pass-456",
  "confirmPassword": "new-pass-456"
}
```

**`200 OK` Response:**

```json
{
  "message": "Password changed successfully"
}
```

### Error Responses

| Status | Code                    | Description                              |
| ------ | ----------------------- | ---------------------------------------- |
| `400`  | `VALIDATION_ERROR`      | Missing required fields or invalid input |
| `400`  | `PASSWORD_MISMATCH`     | `confirmPassword` does not match         |
| `400`  | `INVALID_PASSWORD`      | `currentPassword` is incorrect           |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token                 |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error                  |

---

## Get Maintenance Info

Retrieves current maintenance mode status and information.

```
GET /api/settings/maintenance
```

### Authorization

| Permission            | Scope    |
| --------------------- | -------- |
| `settings.maintenance` | Required |

### Response

**`200 OK`**

```json
{
  "maintenance": {
    "enabled": false,
    "message": "We are currently performing scheduled maintenance.",
    "estimatedCompletion": "2025-06-01T04:00:00.000Z",
    "allowedIPs": [],
    "allowedRoles": ["admin"]
  }
}
```

### Error Responses

| Status | Code                    | Description                                  |
| ------ | ----------------------- | -------------------------------------------- |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token                     |
| `403`  | `FORBIDDEN`             | Missing `settings.maintenance` permission    |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error                      |

---

## Test SMTP

Sends a test email to verify SMTP configuration.

```
POST /api/settings/smtp-test
```

### Authorization

| Permission      | Scope    |
| --------------- | -------- |
| `settings.update` | Required |

### Request Body

| Field           | Type     | Required | Description                    |
| --------------- | -------- | -------- | ------------------------------ |
| `recipientEmail`| `string` | Yes      | Email address to send test to  |

### Example Request

```json
{
  "recipientEmail": "admin@example.com"
}
```

### Response

**`200 OK`**

```json
{
  "message": "Test email sent successfully",
  "recipient": "admin@example.com"
}
```

### Error Responses

| Status | Code                    | Description                              |
| ------ | ----------------------- | ---------------------------------------- |
| `400`  | `VALIDATION_ERROR`      | Missing or invalid `recipientEmail`      |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token                 |
| `403`  | `FORBIDDEN`             | Missing `settings.update` permission     |
| `500`  | `SMTP_ERROR`            | Failed to send test email                |

---

## System Information

Returns system-level metadata about the application environment.

```
GET /api/settings/system-info
```

### Authorization

| Permission            | Scope    |
| --------------------- | -------- |
| `settings.system-info` | Required |

### Response

**`200 OK`**

```json
{
  "system": {
    "version": "1.2.0",
    "environment": "production",
    "nodeVersion": "20.11.0",
    "database": {
      "provider": "postgresql",
      "version": "16.2"
    },
    "storage": {
      "provider": "s3",
      "usedBytes": 1073741824,
      "totalBytes": 10737418240
    },
    "uptime": 259200,
    "lastDeployment": "2025-05-28T14:30:00.000Z"
  }
}
```

### Error Responses

| Status | Code                    | Description                                  |
| ------ | ----------------------- | -------------------------------------------- |
| `401`  | `UNAUTHORIZED`          | Missing or invalid token                     |
| `403`  | `FORBIDDEN`             | Missing `settings.system-info` permission    |
| `500`  | `INTERNAL_SERVER_ERROR` | Unexpected server error                      |
