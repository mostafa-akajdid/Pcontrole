# Error Reference

> Complete reference for every error type returned by the TASKILY CMS API.

---

## Error Response Format

All errors follow the standard response envelope:

```typescript
{
  success: false;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
```

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Always `false` for errors |
| `message` | `string` | Human-readable error description |
| `details` | `array?` | Optional. Field-level validation errors (present on `400`) |

---

## HTTP Status Codes

### `400` Bad Request

The request body or query parameters failed validation.

**When this occurs:**
- Required fields are missing
- Field values are invalid (wrong type, out of range, bad format)
- Request body is malformed JSON

**Response:**

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

**Other `400` variations:**

```json
{
  "success": false,
  "message": "API key ID is required"
}
```

```json
{
  "success": false,
  "message": "Email already registered"
}
```

```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

---

### `401` Unauthorized

The request lacks valid authentication credentials.

**When this occurs:**
- No `auth_token` cookie present (Admin API)
- No `x-api-key` header present (Public API)
- JWT is expired or malformed
- API key does not exist in the database

**Missing Auth Token (Admin):**

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Invalid/Expired JWT (Admin):**

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**Missing API Key (Public):**

```json
{
  "success": false,
  "message": "API key is required"
}
```

**Invalid API Key (Public):**

```json
{
  "success": false,
  "message": "Invalid API key"
}
```

**Login Failure:**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

> **Note:** Login failures always return the same generic message regardless of whether the email exists, to prevent user enumeration.

---

### `403` Forbidden

The request is authenticated but the user/key lacks the required permissions.

**When this occurs:**
- User does not have the required permission for the endpoint
- CSRF token mismatch (cookie vs header)
- API key is disabled
- API key does not have the requested module in `allowedModules`

**Insufficient Permissions (Admin):**

```json
{
  "success": false,
  "message": "Insufficient permissions to create projects"
}
```

**CSRF Token Mismatch:**

```json
{
  "success": false,
  "message": "Invalid CSRF token"
}
```

**API Key Disabled (Public):**

```json
{
  "success": false,
  "message": "API access is disabled for this key"
}
```

**Module Not Allowed (Public):**

```json
{
  "success": false,
  "message": "Projects module is not enabled for this API key"
}
```

---

### `404` Not Found

The requested resource does not exist.

**When this occurs:**
- Resource ID or slug does not match any record
- Resource was soft-deleted

**Response:**

```json
{
  "success": false,
  "message": "Not found"
}
```

```json
{
  "success": false,
  "message": "Project not found"
}
```

```json
{
  "success": false,
  "message": "API key not found"
}
```

---

### `405` Method Not Allowed

The HTTP method is not supported by the endpoint.

**When this occurs:**
- Sending `DELETE` to a read-only endpoint
- Sending `POST` to a GET-only endpoint
- Using the wrong method for the operation

**Response:**

```json
{
  "success": false,
  "message": "Method not allowed"
}
```

---

### `409` Conflict

The request conflicts with the current state of the resource.

**When this occurs:**
- Attempting to create a duplicate resource (e.g., duplicate email, duplicate category name)
- Attempting to delete a category that has linked content
- Unique constraint violations

**Response:**

```json
{
  "success": false,
  "message": "Category name already exists"
}
```

```json
{
  "success": false,
  "message": "Cannot delete category with linked content"
}
```

---

### `500` Internal Server Error

An unexpected error occurred on the server.

**When this occurs:**
- Database connection failure
- Unhandled exception in route handler
- External service failure (Cloudinary, SMTP)
- Missing server configuration (`JWT_SECRET` not set)

**Generic Response:**

```json
{
  "success": false,
  "message": "Internal server error"
}
```

**Configuration Error:**

```json
{
  "success": false,
  "message": "Server configuration error"
}
```

> **Note:** In development, error details may be logged to the server console. In production, stack traces are never returned to the client.

---

## Validation Error Format

Validation errors are returned as a `400` with a `details` array containing field-level errors:

```typescript
{
  success: false;
  message: "Validation failed";
  details: Array<{
    field: string;   // Dot-notation path (e.g., "categoryIds.0")
    message: string; // Human-readable error message
  }>;
}
```

### Complete Validation Examples

#### Login Validation

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email address" },
    { "field": "password", "message": "Password is required" }
  ]
}
```

#### Register Validation

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    { "field": "name", "message": "Name must be at least 2 characters" },
    { "field": "email", "message": "Invalid email address" },
    { "field": "password", "message": "Password must be at least 8 characters" },
    { "field": "password", "message": "Password must contain at least one uppercase letter" },
    { "field": "confirmPassword", "message": "Passwords do not match" }
  ]
}
```

#### Project Validation

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    { "field": "title", "message": "Title is required" },
    { "field": "title", "message": "Title must be less than 200 characters" },
    { "field": "coverImage", "message": "Invalid URL" },
    { "field": "year", "message": "Expected number, received string" },
    { "field": "categoryIds.0", "message": "Invalid UUID" }
  ]
}
```

#### Role Validation

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    { "field": "name", "message": "Role name must be at least 2 characters" },
    { "field": "permissionIds.2", "message": "Invalid UUID" }
  ]
}
```

#### Password Policy

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    { "field": "password", "message": "Password must be at least 8 characters" },
    { "field": "password", "message": "Password must contain at least one uppercase letter" },
    { "field": "password", "message": "Password must contain at least one lowercase letter" },
    { "field": "password", "message": "Password must contain at least one number" }
  ]
}
```

### Password Requirements

The `passwordSchema` enforces the following rules:

| Rule | Regex | Message |
|---|---|---|
| Minimum length | `.{8,}` | "Password must be at least 8 characters" |
| Uppercase letter | `[A-Z]` | "Password must contain at least one uppercase letter" |
| Lowercase letter | `[a-z]` | "Password must contain at least one lowercase letter" |
| Numeric digit | `[0-9]` | "Password must contain at least one number" |

---

## Common Error Messages

| Message | Status | Cause |
|---|---|---|
| `"Unauthorized"` | 401 | No `auth_token` cookie present |
| `"Invalid or expired token"` | 401 | JWT verification failed (expired, tampered, or malformed) |
| `"Server configuration error"` | 500 | `JWT_SECRET` environment variable is not set |
| `"Invalid CSRF token"` | 403 | `X-CSRF-Token` header does not match `csrf_token` cookie |
| `"Validation failed"` | 400 | Request body failed Zod schema validation |
| `"Invalid email or password"` | 401 | Login credentials do not match (generic, prevents enumeration) |
| `"Email already registered"` | 400 | Registration attempted with existing email |
| `"User not found"` | 404 | User ID does not exist in database |
| `"Default role not found"` | 500 | Database not seeded (VIEWER role missing) |
| `"Invalid or expired reset token"` | 400 | Password reset token is invalid or has expired |
| `"Invalid verification token"` | 400 | Email verification token is invalid |
| `"Method not allowed"` | 405 | Wrong HTTP method for the endpoint |
| `"Failed to retrieve projects"` | 500 | Database error during project listing |
| `"Failed to create project"` | 400 | Database error or constraint violation during project creation |
| `"API key is required"` | 401 | Public API request without `x-api-key` header |
| `"Invalid API key"` | 401 | `x-api-key` not found in `HeadlessApiKey` table |
| `"API access is disabled for this key"` | 403 | API key exists but `enabled` is `false` |
| `"Projects module is not enabled for this API key"` | 403 | Requested module not in key's `allowedModules` |
| `"API key not found"` | 404 | API key ID does not exist in database |
| `"Project not found"` | 404 | Project slug or ID does not exist |
| `"Not found"` | 404 | Generic resource not found |
| `"Internal server error"` | 500 | Unhandled exception in route handler |

---

## Error Handling Patterns

### Route Handler Pattern

All API route handlers follow this consistent error handling pattern:

```javascript
export default async function handler(req, res) {
  // 1. Extract user from JWT
  const tokenPayload = getUserFromRequest(req);
  if (!tokenPayload) {
    return unauthorizedResponse(res); // 401
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res, tokenPayload);
    default:
      return methodNotAllowed(res); // 405
  }
}

async function handlePost(req, res, tokenPayload) {
  try {
    // 2. Check permissions
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('projects.create')) {
      return forbiddenResponse(res, 'Insufficient permissions'); // 403
    }

    // 3. Validate input
    const validation = validateRequest(createProjectSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors); // 400
    }

    // 4. Execute operation
    const project = await ProjectService.create(validation.data);

    // 5. Return success
    return successResponse(res, project, 'Created successfully', 201); // 201
  } catch (error) {
    // 6. Catch unexpected errors
    return errorResponse(res, error.message || 'Failed', 500); // 500
  }
}
```

### Helper Functions

All error responses are generated through helper functions in `lib/api.js`:

| Function | Status Code | Usage |
|---|---|---|
| `errorResponse(res, message, status, details)` | Any | Generic error with optional details |
| `unauthorizedResponse(res)` | 401 | Missing/invalid auth |
| `forbiddenResponse(res, message)` | 403 | Insufficient permissions |
| `notFoundResponse(res, message)` | 404 | Resource not found |
| `methodNotAllowed(res)` | 405 | Wrong HTTP method |
| `validationErrorResponse(res, errors)` | 400 | Validation failure with field errors |
| `successResponse(res, data, message, status)` | 200/201 | Success responses |
| `paginatedResponse(res, data, pagination)` | 200 | Paginated list responses |

---

## HTTP Status Code Summary

| Code | Name | Category | When to Expect |
|---|---|---|---|
| `200` | OK | Success | Standard GET, PUT, PATCH |
| `201` | Created | Success | POST creating a new resource |
| `204` | No Content | Success | DELETE with no response body |
| `304` | Not Modified | Cache | ETag match on public API |
| `400` | Bad Request | Client Error | Validation failure, bad request body |
| `401` | Unauthorized | Client Error | No credentials or invalid credentials |
| `403` | Forbidden | Client Error | Authenticated but not authorized |
| `404` | Not Found | Client Error | Resource does not exist |
| `405` | Method Not Allowed | Client Error | Wrong HTTP method |
| `409` | Conflict | Client Error | Duplicate resource or constraint violation |
| `422` | Unprocessable Entity | Client Error | Semantically invalid request |
| `500` | Internal Server Error | Server Error | Unexpected failure |
