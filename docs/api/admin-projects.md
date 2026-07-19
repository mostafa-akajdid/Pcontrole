# Project Management API

> Manage portfolio projects: create, update, soft-delete, restore, and bulk-organize projects with images, categories, and metadata.

---

## Authentication

All project endpoints require a valid **JWT session cookie** (`token`) set during login.

State-changing methods (`POST`, `PUT`, `DELETE`) additionally require a **CSRF header** (`x-csrf-token`) that must match the token embedded in the JWT. The CSRF token is included in the login response and in `GET /api/auth/csrf`.

```
Cookie: token=<jwt>
Header: x-csrf-token <csrf_token>      # required for POST/PUT/DELETE
```

---

## Endpoints

---

### List Projects

```
GET /api/projects
```

Returns a paginated list of projects for the authenticated user.

#### Permissions

| Scope | Access |
|-------|--------|
| Any authenticated user | ✅ |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `int` | `1` | Page number (≥ 1) |
| `perPage` | `int` | `10` | Items per page (1–100) |
| `search` | `string` | — | Fuzzy search across `title`, `shortDescription`, `fullDescription`, `client`, `location` |
| `status` | `string` | — | Filter by `DRAFT` or `PUBLISHED` |
| `featured` | `boolean` | — | Filter by featured status |
| `categoryId` | `UUID` | — | Filter by category |
| `year` | `int` | — | Filter by project year |
| `sort` | `string` | `createdAt` | Sort field: `createdAt`, `updatedAt`, `title`, `year`, `publishedAt` |
| `order` | `string` | `desc` | Sort order: `asc` or `desc` |

#### Response `200 OK`

```jsonc
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Brand Redesign for Acme Corp",
      "slug": "brand-redesign-for-acme-corp",
      "shortDescription": "Complete brand identity overhaul",
      "fullDescription": { "type": "paragraph", "content": "A comprehensive rebrand including logo, typography, and color system..." },
      "coverImage": "https://cdn.taskily.com/projects/acme-cover.webp",
      "featured": true,
      "status": "PUBLISHED",
      "client": "Acme Corporation",
      "location": "New York, NY",
      "year": 2025,
      "metaTitle": "Acme Corp Brand Redesign | TASKILY",
      "metaDescription": "See how we reimagined Acme Corp's brand identity...",
      "publishedAt": "2025-03-15T10:00:00.000Z",
      "createdAt": "2025-02-01T08:30:00.000Z",
      "updatedAt": "2025-03-15T10:00:00.000Z",
      "authorId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "author": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Jane Smith",
        "avatar": "https://cdn.taskily.com/avatars/jane.webp"
      },
      "categories": [
        {
          "id": "cat-001",
          "name": "Web Design",
          "description": "Full-stack web projects"
        }
      ],
      "images": [
        {
          "id": "img-001",
          "url": "https://cdn.taskily.com/projects/acme-01.webp",
          "publicId": "projects/acme-01",
          "altText": "Acme logo on white background",
          "caption": "Primary logo lockup",
          "sortOrder": 0
        }
      ],
      "_count": {
        "images": 12
      }
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

---

### Create Project

```
POST /api/projects
```

Create a new project.

#### Permissions

| Scope | Access |
|-------|--------|
| `projects.create` | ✅ |

#### Request Body

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `title` | `string` | ✅ | Max 200 chars | Project title |
| `shortDescription` | `string` | | Max 500 chars | Brief summary |
| `fullDescription` | `object` | | `{ type, items/content }` | Structured description (see below) |
| `coverImage` | `string` | | Valid URL | Cover image URL |
| `featured` | `boolean` | | | Mark as featured |
| `status` | `string` | | `DRAFT` \| `PUBLISHED` | Defaults to `DRAFT` |
| `client` | `string` | | Max 200 chars | Client name |
| `location` | `string` | | Max 200 chars | Project location |
| `year` | `int` | | 1900–2100 | Project year |
| `metaTitle` | `string` | | Max 200 chars | SEO title |
| `metaDescription` | `string` | | Max 500 chars | SEO description |
| `categoryIds` | `UUID[]` | | | Category IDs to attach |
| `images` | `object[]` | | | Inline images (see below) |

##### Image Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | ✅ | Image URL |
| `publicId` | `string` | | Cloudinary/storage public ID |
| `altText` | `string` | | Accessibility text |
| `caption` | `string` | | Display caption |
| `sortOrder` | `int` | | Display order (0-indexed) |

##### Full Description Object

Two formats are supported:

**List format** (default):
```json
{
  "type": "list",
  "items": ["Item 1", "Item 2", "Item 3"]
}
```

**Paragraph format**:
```json
{
  "type": "paragraph",
  "content": "Long paragraph text..."
}
```

Validation rules:
- List: minimum 1 item, no empty strings
- Paragraph: non-empty, trimmed

#### Example Request

```bash
curl -X POST https://api.taskily.com/api/projects \
  -H "Content-Type: application/json" \
  -H "x-csrf-token <csrf_token>" \
  -b "token=<jwt>" \
  -d '{
    "title": "E-Commerce Platform",
    "shortDescription": "Modern e-commerce solution",
    "fullDescription": { "type": "list", "items": ["Full-stack e-commerce platform", "Payment integration", "Admin dashboard"] },
    "status": "DRAFT",
    "client": "ShopCo",
    "year": 2025,
    "categoryIds": ["cat-001", "cat-002"],
    "images": [
      {
        "url": "https://cdn.taskily.com/projects/shopco-01.webp",
        "altText": "ShopCo homepage mockup",
        "sortOrder": 0
      }
    ]
  }'
```

#### Response `201 Created`

Returns the full project object (same shape as the list item above).

---

### Get Project

```
GET /api/projects/[id]
```

Retrieve a single project by ID.

#### Permissions

| Scope | Access |
|-------|--------|
| Any authenticated user | ✅ |

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `UUID` | Project ID |

#### Response `200 OK`

Returns the full project object with all relations.

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| `404` | `NOT_FOUND` | Project does not exist |

---

### Update Project

```
PUT /api/projects/[id]
```

Update an existing project. All fields are optional — only provided fields are modified.

#### Permissions

| Scope | Access |
|-------|--------|
| `projects.update` | ✅ |

#### Request Body

All fields from the [Create](#create-project) body are accepted and optional.

#### Special Behaviors

| Behavior | Detail |
|----------|--------|
| Status → `PUBLISHED` | `publishedAt` is set to the current timestamp |
| Status → `DRAFT` | `publishedAt` is cleared (`null`) |
| `categoryIds` provided | **Replaces** all existing categories (not additive) |

#### Response `200 OK`

Returns the updated project object.

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| `404` | `NOT_FOUND` | Project does not exist |
| `403` | `FORBIDDEN` | Insufficient permissions |

---

### Delete Project

```
DELETE /api/projects/[id]
```

Soft-delete a project. The project is moved to trash and can be restored.

#### Permissions

| Scope | Access |
|-------|--------|
| `projects.delete` | ✅ |

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `UUID` | Project ID |

#### Response `200 OK`

```json
{
  "message": "Project moved to trash successfully"
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| `404` | `NOT_FOUND` | Project does not exist |

---

### Project Statistics

```
GET /api/projects/stats
```

Returns aggregate counts for the user's projects.

#### Permissions

| Scope | Access |
|-------|--------|
| `projects.read` | ✅ |

#### Response `200 OK`

```json
{
  "total": 42,
  "published": 28,
  "draft": 12,
  "featured": 8,
  "trashed": 2
}
```

---

### Trashed Projects

```
GET /api/projects/trash
```

List soft-deleted projects available for restore or permanent deletion.

#### Permissions

| Scope | Access |
|-------|--------|
| `projects.read` | ✅ |

#### Query Parameters

Same as [List Projects](#list-projects) — `page`, `perPage`, `search`, `sort`, `order`.

#### Response `200 OK`

Same shape as the list response, containing trashed project objects.

---

### Bulk Actions

```
POST /api/projects/bulk
```

Perform a single action across multiple projects.

#### Permissions

| Action | Required Scope |
|--------|----------------|
| `publish` | `projects.update` |
| `unpublish` | `projects.update` |
| `feature` | `projects.update` |
| `unfeature` | `projects.update` |
| `delete` | `projects.delete` |
| `restore` | `projects.delete` |
| `permanentDelete` | `projects.delete` |

#### Request Body

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `ids` | `UUID[]` | ✅ | 1–100 items | Project IDs to target |
| `action` | `string` | ✅ | See table below | Action to perform |

#### Actions

| Action | Description |
|--------|-------------|
| `publish` | Set status to `PUBLISHED` and set `publishedAt` |
| `unpublish` | Set status to `DRAFT` and clear `publishedAt` |
| `delete` | Soft-delete (move to trash) |
| `restore` | Restore from trash |
| `permanentDelete` | **Irreversible** — permanently delete from database |
| `feature` | Set `featured` to `true` |
| `unfeature` | Set `featured` to `false` |

#### Example Request

```bash
curl -X POST https://api.taskily.com/api/projects/bulk \
  -H "Content-Type: application/json" \
  -H "x-csrf-token <csrf_token>" \
  -b "token=<jwt>" \
  -d '{
    "ids": [
      "550e8400-e29b-41d4-a716-446655440000",
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
    ],
    "action": "publish"
  }'
```

#### Response `200 OK`

```json
{
  "message": "Bulk action completed successfully",
  "affected": 2
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| `400` | `VALIDATION_ERROR` | Invalid IDs or action |
| `403` | `FORBIDDEN` | Insufficient permissions for the requested action |

---

## Error Format

All errors follow a consistent shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

#### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | `401` | Missing or invalid JWT |
| `FORBIDDEN` | `403` | Authenticated but lacks required permission |
| `NOT_FOUND` | `404` | Resource does not exist |
| `VALIDATION_ERROR` | `400` | Invalid request body or query parameters |
| `CSRF_INVALID` | `403` | CSRF token missing or mismatched |
