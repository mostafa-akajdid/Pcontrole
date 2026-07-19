# Blog Management API

> Create, update, and manage blog posts with images, categories, and SEO metadata. Includes full trash/restore lifecycle and bulk operations.

---

## Authentication

All blog endpoints require a valid **JWT session cookie** (`token`) set during login.

State-changing methods (`POST`, `PUT`, `DELETE`) additionally require a **CSRF header** (`x-csrf-token`) that must match the token embedded in the JWT. The CSRF token is included in the login response and in `GET /api/auth/csrf`.

```
Cookie: token=<jwt>
Header: x-csrf-token <csrf_token>      # required for POST/PUT/DELETE
```

---

## Endpoints

### Blog Posts

---

### List Blogs

```
GET /api/blogs
```

Returns a paginated list of blog posts for the authenticated user.

#### Permissions

| Scope | Access |
|-------|--------|
| Any authenticated user | ✅ |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `int` | `1` | Page number (≥ 1) |
| `perPage` | `int` | `10` | Items per page (1–100) |
| `search` | `string` | — | Fuzzy search across `title`, `excerpt`, `content` |
| `status` | `string` | — | Filter by `DRAFT` or `PUBLISHED` |
| `featured` | `boolean` | — | Filter by featured status |
| `categoryId` | `UUID` | — | Filter by category |
| `sort` | `string` | `createdAt` | Sort field: `createdAt`, `updatedAt`, `title`, `publishedAt` |
| `order` | `string` | `desc` | Sort order: `asc` or `desc` |

#### Response `200 OK`

```jsonc
{
  "items": [
    {
      "id": "b1a2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Getting Started with Next.js 15",
      "slug": "getting-started-with-nextjs-15",
      "excerpt": "A hands-on guide to building modern apps...",
      "content": "Next.js 15 brings significant improvements...",
      "coverImage": "https://cdn.taskily.com/blogs/nextjs15-cover.webp",
      "featured": false,
      "status": "PUBLISHED",
      "metaTitle": "Next.js 15 Guide | TASKILY Blog",
      "metaDescription": "Learn how to build modern web apps with Next.js 15...",
      "publishedAt": "2025-04-10T14:00:00.000Z",
      "createdAt": "2025-04-01T09:00:00.000Z",
      "updatedAt": "2025-04-10T14:00:00.000Z",
      "authorId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "author": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Jane Smith",
        "avatar": "https://cdn.taskily.com/avatars/jane.webp"
      },
      "categories": [
        {
          "id": "bcat-001",
          "name": "Tutorials",
          "description": "Step-by-step guides"
        }
      ],
      "images": [
        {
          "id": "bimg-001",
          "url": "https://cdn.taskily.com/blogs/nextjs-01.webp",
          "publicId": "blogs/nextjs-01",
          "altText": "Next.js project structure",
          "caption": "File-based routing",
          "sortOrder": 0
        }
      ],
      "_count": {
        "images": 6
      }
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 87,
    "totalPages": 9
  }
}
```

---

### Create Blog

```
POST /api/blogs
```

Create a new blog post.

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.create` | ✅ |

#### Request Body

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `title` | `string` | ✅ | Max 200 chars | Blog title |
| `slug` | `string` | | Regex validated, unique | URL slug (auto-generated from title if omitted) |
| `excerpt` | `string` | | Max 500 chars | Short summary for listings |
| `content` | `string` | | | Full post content (HTML/markdown) |
| `coverImage` | `string` | | Valid URL | Cover image URL |
| `featured` | `boolean` | | | Mark as featured |
| `status` | `string` | | `DRAFT` \| `PUBLISHED` | Defaults to `DRAFT` |
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

##### Slug Validation

The `slug` field, if provided, must match the following pattern:

```
/^[a-z0-9]+(?:-[a-z0-9]+)*$/
```

- Lowercase alphanumeric characters only
- Hyphens allowed between words
- Must be unique across all blog posts

#### Example Request

```bash
curl -X POST https://api.taskily.com/api/blogs \
  -H "Content-Type: application/json" \
  -H "x-csrf-token <csrf_token>" \
  -b "token=<jwt>" \
  -d '{
    "title": "Understanding Server Components",
    "slug": "understanding-server-components",
    "excerpt": "React Server Components explained",
    "content": "<h2>What are Server Components?</h2><p>Server Components run on the server...</p>",
    "status": "DRAFT",
    "categoryIds": ["bcat-001"],
    "images": [
      {
        "url": "https://cdn.taskily.com/blogs/rsc-01.webp",
        "altText": "Server components architecture diagram",
        "sortOrder": 0
      }
    ]
  }'
```

#### Response `201 Created`

Returns the full blog object (same shape as the list item above).

---

### Get Blog

```
GET /api/blogs/[id]
```

Retrieve a single blog post by ID.

#### Permissions

| Scope | Access |
|-------|--------|
| Any authenticated user | ✅ |

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `UUID` | Blog post ID |

#### Response `200 OK`

Returns the full blog object with all relations.

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| `404` | `NOT_FOUND` | Blog post does not exist |

---

### Update Blog

```
PUT /api/blogs/[id]
```

Update an existing blog post. All fields are optional — only provided fields are modified.

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.update` | ✅ |

#### Request Body

All fields from the [Create](#create-blog) body are accepted and optional.

#### Special Behaviors

| Behavior | Detail |
|----------|--------|
| Status → `PUBLISHED` | `publishedAt` is set to the current timestamp |
| Status → `DRAFT` | `publishedAt` is cleared (`null`) |
| `categoryIds` provided | **Replaces** all existing categories (not additive) |

#### Response `200 OK`

Returns the updated blog object.

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| `404` | `NOT_FOUND` | Blog post does not exist |
| `403` | `FORBIDDEN` | Insufficient permissions |

---

### Delete Blog

```
DELETE /api/blogs/[id]
```

Delete or restore a blog post.

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.delete` | ✅ |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `restore` | `boolean` | `false` | Set to `true` to restore a trashed blog instead of deleting |

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `UUID` | Blog post ID |

#### Delete Response `200 OK`

```json
{
  "message": "Blog post moved to trash successfully"
}
```

#### Restore Response `200 OK`

```json
{
  "message": "Blog post restored successfully"
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| `404` | `NOT_FOUND` | Blog post does not exist |

---

### Blog Statistics

```
GET /api/blogs/stats
```

Returns aggregate counts for the user's blog posts.

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.read` | ✅ |

#### Response `200 OK`

```json
{
  "total": 87,
  "published": 62,
  "draft": 21,
  "featured": 14,
  "trashed": 4
}
```

---

### Trashed Blogs

```
GET /api/blogs/trash
```

List soft-deleted blog posts available for restore or permanent deletion.

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.read` | ✅ |

#### Query Parameters

Same as [List Blogs](#list-blogs) — `page`, `perPage`, `search`, `sort`, `order`.

#### Response `200 OK`

Same shape as the list response, containing trashed blog objects.

---

### Bulk Actions

```
POST /api/blogs/bulk
```

Perform a single action across multiple blog posts.

#### Permissions

| Action | Required Scope |
|--------|----------------|
| `publish` | `blogs.update` |
| `unpublish` | `blogs.update` |
| `feature` | `blogs.update` |
| `unfeature` | `blogs.update` |
| `delete` | `blogs.delete` |
| `restore` | `blogs.delete` |
| `permanentDelete` | `blogs.delete` |

#### Request Body

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `ids` | `UUID[]` | ✅ | 1–100 items | Blog IDs to target |
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
curl -X POST https://api.taskily.com/api/blogs/bulk \
  -H "Content-Type: application/json" \
  -H "x-csrf-token <csrf_token>" \
  -b "token=<jwt>" \
  -d '{
    "ids": [
      "b1a2c3d4-e5f6-7890-abcd-ef1234567890",
      "c2b3a4d5-e6f7-8901-bcde-f12345678901"
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

### Blog Images

---

### List Blog Images

```
GET /api/blogs/[id]/images
```

List all images attached to a blog post.

#### Permissions

| Scope | Access |
|-------|--------|
| Any authenticated user | ✅ |

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `UUID` | Blog post ID |

#### Response `200 OK`

```json
{
  "images": [
    {
      "id": "bimg-001",
      "url": "https://cdn.taskily.com/blogs/nextjs-01.webp",
      "publicId": "blogs/nextjs-01",
      "altText": "Next.js project structure",
      "caption": "File-based routing",
      "sortOrder": 0
    },
    {
      "id": "bimg-002",
      "url": "https://cdn.taskily.com/blogs/nextjs-02.webp",
      "publicId": "blogs/nextjs-02",
      "altText": "Server components diagram",
      "caption": "Component lifecycle",
      "sortOrder": 1
    }
  ]
}
```

---

### Add Blog Image

```
POST /api/blogs/[id]/images
```

Attach an image to a blog post.

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.update` | ✅ |

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `UUID` | Blog post ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | ✅ | Image URL |
| `publicId` | `string` | | Cloudinary/storage public ID |
| `altText` | `string` | | Accessibility text |
| `caption` | `string` | | Display caption |
| `sortOrder` | `int` | | Display order (defaults to next available) |

#### Example Request

```bash
curl -X POST https://api.taskily.com/api/blogs/b1a2c3d4-e5f6-7890-abcd-ef1234567890/images \
  -H "Content-Type: application/json" \
  -H "x-csrf-token <csrf_token>" \
  -b "token=<jwt>" \
  -d '{
    "url": "https://cdn.taskily.com/blogs/nextjs-03.webp",
    "publicId": "blogs/nextjs-03",
    "altText": "Deployment pipeline",
    "caption": "CI/CD with Vercel",
    "sortOrder": 2
  }'
```

#### Response `201 Created`

```json
{
  "image": {
    "id": "bimg-003",
    "url": "https://cdn.taskily.com/blogs/nextjs-03.webp",
    "publicId": "blogs/nextjs-03",
    "altText": "Deployment pipeline",
    "caption": "CI/CD with Vercel",
    "sortOrder": 2
  }
}
```

---

### Remove Blog Image

```
DELETE /api/blogs/[id]/images
```

Remove an image from a blog post.

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.update` | ✅ |

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `UUID` | Blog post ID |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageId` | `UUID` | ✅ | Image ID to remove |

#### Example Request

```bash
curl -X DELETE "https://api.taskily.com/api/blogs/b1a2c3d4-e5f6-7890-abcd-ef1234567890/images?imageId=bimg-003" \
  -H "x-csrf-token <csrf_token>" \
  -b "token=<jwt>"
```

#### Response `200 OK`

```json
{
  "message": "Image removed successfully"
}
```

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| `404` | `NOT_FOUND` | Image not found on this blog post |

---

### Reorder Blog Images

```
PUT /api/blogs/[id]/reorder
```

Replace the sort order of all images on a blog post. The array order defines the new `sortOrder` values (0-indexed).

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.update` | ✅ |

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `UUID` | Blog post ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageIds` | `UUID[]` | ✅ | Ordered array of image IDs |

#### Example Request

```bash
curl -X PUT https://api.taskily.com/api/blogs/b1a2c3d4-e5f6-7890-abcd-ef1234567890/reorder \
  -H "Content-Type: application/json" \
  -H "x-csrf-token <csrf_token>" \
  -b "token=<jwt>" \
  -d '{
    "imageIds": ["bimg-002", "bimg-001", "bimg-003"]
  }'
```

#### Response `200 OK`

```json
{
  "message": "Images reordered successfully",
  "images": [
    { "id": "bimg-002", "sortOrder": 0 },
    { "id": "bimg-001", "sortOrder": 1 },
    { "id": "bimg-003", "sortOrder": 2 }
  ]
}
```

---

## Category Management

Categories are shared across the blog and project collections. Each resource type has its own category endpoint.

---

### Blog Categories

```
GET    /api/blog-categories
POST   /api/blog-categories
PUT    /api/blog-categories/[id]
PATCH  /api/blog-categories/[id]
DELETE /api/blog-categories/[id]
```

---

#### List Blog Categories

```
GET /api/blog-categories
```

Returns all blog categories.

#### Permissions

| Scope | Access |
|-------|--------|
| Any authenticated user | ✅ |

#### Response `200 OK`

```json
{
  "categories": [
    {
      "id": "bcat-001",
      "name": "Tutorials",
      "description": "Step-by-step guides and walkthroughs",
      "_count": {
        "blogs": 14
      }
    },
    {
      "id": "bcat-002",
      "name": "Industry News",
      "description": "Latest developments in tech",
      "_count": {
        "blogs": 8
      }
    }
  ]
}
```

---

#### Create Blog Category

```
POST /api/blog-categories
```

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.create` | ✅ |

#### Request Body

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | `string` | ✅ | Max 100 chars, unique | Category name |
| `description` | `string` | | Max 500 chars | Category description |

#### Response `201 Created`

```json
{
  "category": {
    "id": "bcat-003",
    "name": "Case Studies",
    "description": "Deep dives into client projects"
  }
}
```

---

#### Update Blog Category

```
PUT  /api/blog-categories/[id]
PATCH /api/blog-categories/[id]
```

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.update` | ✅ |

#### Request Body

All fields optional.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `name` | `string` | Max 100 chars, unique | Category name |
| `description` | `string` | Max 500 chars | Category description |

#### Response `200 OK`

Returns the updated category object.

---

#### Delete Blog Category

```
DELETE /api/blog-categories/[id]
```

Removes the category. Existing blog posts will have this category detached.

#### Permissions

| Scope | Access |
|-------|--------|
| `blogs.delete` | ✅ |

#### Response `200 OK`

```json
{
  "message": "Category deleted successfully"
}
```

---

### Project Categories

```
GET    /api/project-categories
POST   /api/project-categories
PUT    /api/project-categories/[id]
PATCH  /api/project-categories/[id]
DELETE /api/project-categories/[id]
```

---

#### List Project Categories

```
GET /api/project-categories
```

Returns all project categories.

#### Permissions

| Scope | Access |
|-------|--------|
| Any authenticated user | ✅ |

#### Response `200 OK`

```json
{
  "categories": [
    {
      "id": "pcat-001",
      "name": "Web Design",
      "description": "Full-stack web projects",
      "_count": {
        "projects": 18
      }
    },
    {
      "id": "pcat-002",
      "name": "Brand Identity",
      "description": "Logo and visual identity systems",
      "_count": {
        "projects": 9
      }
    }
  ]
}
```

---

#### Create Project Category

```
POST /api/project-categories
```

#### Permissions

| Scope | Access |
|-------|--------|
| `projects.create` | ✅ |

#### Request Body

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | `string` | ✅ | Max 100 chars, unique | Category name |
| `description` | `string` | | Max 500 chars | Category description |

#### Response `201 Created`

```json
{
  "category": {
    "id": "pcat-003",
    "name": "Mobile Apps",
    "description": "iOS and Android development"
  }
}
```

---

#### Update Project Category

```
PUT  /api/project-categories/[id]
PATCH /api/project-categories/[id]
```

#### Permissions

| Scope | Access |
|-------|--------|
| `projects.update` | ✅ |

#### Request Body

All fields optional.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `name` | `string` | Max 100 chars, unique | Category name |
| `description` | `string` | Max 500 chars | Category description |

#### Response `200 OK`

Returns the updated category object.

---

#### Delete Project Category

```
DELETE /api/project-categories/[id]
```

Removes the category. Existing projects will have this category detached.

#### Permissions

| Scope | Access |
|-------|--------|
| `projects.delete` | ✅ |

#### Response `200 OK`

```json
{
  "message": "Category deleted successfully"
}
```

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
| `CONFLICT` | `409` | Duplicate slug or category name |
