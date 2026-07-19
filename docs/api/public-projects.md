# Public Projects API

Headless CMS endpoint for consuming published projects from external websites, static site generators, or mobile applications.

**Base URL:** `/api/public/projects`

---

## Authentication

All requests require an `x-api-key` header. There are no session cookies or JWT tokens involved.

| Header | Type | Required | Description |
| --- | --- | --- | --- |
| `x-api-key` | `string` | Yes | API key with `projects` in its `allowedModules` |

The API key is validated against the `headless_api_keys` table. The key must be enabled and have `projects` in its allowed modules list. Keys are prefixed with `tk_`.

```http
x-api-key: tk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## List Projects

```
GET /api/public/projects
```

Returns a paginated list of published projects with filtering and sorting.

### Query Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | `integer` | `1` | Page number (min: 1) |
| `limit` | `integer` | `12` | Items per page (range: 1–100) |
| `search` | `string` | `""` | Case-insensitive search across `title`, `shortDescription`, `client`, and `location` |
| `category` | `string` | `""` | Filter by category slug |
| `year` | `integer` | `null` | Filter by project year |
| `sort` | `string` | `publishedAt` | Sort field. Allowed: `publishedAt`, `createdAt`, `title`, `year` |
| `order` | `string` | `desc` | Sort order. Allowed: `asc`, `desc` |

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "title": "Corporate Website Redesign",
        "shortDescription": "Complete redesign of a Fortune 500 company website",
        "description": {
          "type": "list",
          "items": [
            "We partnered with Acme Corp to redesign their entire digital presence.",
            "The project involved UX research, visual design, and front-end development.",
            "Results included a 40% increase in user engagement."
          ]
        },
        "client": "Acme Corp",
        "location": "New York, NY",
        "year": 2024,
        "status": "PUBLISHED",
        "categories": [
          {
            "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            "name": "Web Design",
            "slug": "web-design"
          }
        ],
        "gallery": [
          {
            "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
            "url": "https://cdn.taskily.com/images/project-hero.webp",
            "alt": "Acme Corp website homepage screenshot",
            "caption": "New homepage design"
          }
        ],
        "meta": {
          "title": "Acme Corp Website Redesign | Case Study",
          "description": "How we redesigned Acme Corp's website to increase engagement by 40%."
        },
        "publishedAt": "2024-06-15T10:30:00.000Z",
        "createdAt": "2024-03-01T14:20:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 47,
      "totalPages": 4
    }
  },
  "message": "Success"
}
```

### Response Fields

| Field | Type | Description |
| --- | --- | --- |
| `items[].id` | `string` | Project UUID |
| `items[].title` | `string` | Project title |
| `items[].shortDescription` | `string` | Brief description |
| `items[].description` | `object \| null` | Structured description (see below) |
| `items[].client` | `string` | Client name |
| `items[].location` | `string` | Project location |
| `items[].year` | `integer \| null` | Project year |
| `items[].status` | `string` | Always `PUBLISHED` for public endpoints |
| `items[].categories` | `array` | Attached categories |
| `items[].categories[].id` | `string` | Category UUID |
| `items[].categories[].name` | `string` | Category display name |
| `items[].categories[].slug` | `string` | Category URL slug |
| `items[].gallery` | `array` | Project images, ordered by `sortOrder` |
| `items[].gallery[].id` | `string` | Image UUID |
| `items[].gallery[].url` | `string` | Image URL |
| `items[].gallery[].alt` | `string` | Alt text |
| `items[].gallery[].caption` | `string` | Image caption |
| `items[].meta.title` | `string` | SEO title |
| `items[].meta.description` | `string` | SEO description |
| `items[].publishedAt` | `string \| null` | ISO 8601 publish timestamp |
| `items[].createdAt` | `string \| null` | ISO 8601 creation timestamp |

### Description Format

The `fullDescription` field from the database is returned as `description` — a JSON object with a `type` field. Consumers should render according to the `type`.

**List format:**
```json
"description": {
  "type": "list",
  "items": ["Item 1", "Item 2", "Item 3"]
}
```

**Paragraph format:**
```json
"description": {
  "type": "paragraph",
  "content": "Long paragraph text..."
}
```

If no description exists, the field is `null`.

---

## Get Single Project

```
GET /api/public/projects/[slug]
```

Returns a single published project by its URL slug.

### Path Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `slug` | `string` | Yes | Project URL slug |

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Corporate Website Redesign",
    "shortDescription": "Complete redesign of a Fortune 500 company website",
    "description": {
      "type": "paragraph",
      "content": "We partnered with Acme Corp to redesign their entire digital presence. The project involved UX research, visual design, and front-end development."
    },
    "client": "Acme Corp",
    "location": "New York, NY",
    "year": 2024,
    "status": "PUBLISHED",
    "categories": [
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "name": "Web Design",
        "slug": "web-design"
      }
    ],
    "gallery": [
      {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "url": "https://cdn.taskily.com/images/project-hero.webp",
        "alt": "Acme Corp website homepage screenshot",
        "caption": "New homepage design"
      }
    ],
    "meta": {
      "title": "Acme Corp Website Redesign | Case Study",
      "description": "How we redesigned Acme Corp's website to increase engagement by 40%."
    },
    "publishedAt": "2024-06-15T10:30:00.000Z",
    "createdAt": "2024-03-01T14:20:00.000Z"
  },
  "message": "Success"
}
```

---

## Error Responses

### `401 Unauthorized` — Missing or invalid API key

```json
{
  "success": false,
  "error": "API key is required"
}
```

```json
{
  "success": false,
  "error": "Invalid API key"
}
```

### `403 Forbidden` — Key disabled or module not allowed

```json
{
  "success": false,
  "error": "API access is disabled for this key"
}
```

```json
{
  "success": false,
  "error": "Projects module is not enabled for this API key"
}
```

### `404 Not Found` — Project slug does not match any published project

```json
{
  "success": false,
  "error": "Project not found"
}
```

### `405 Method Not Allowed` — Non-GET request

```json
{
  "success": false,
  "error": "Method not allowed"
}
```

### `500 Internal Server Error`

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Caching

Both endpoints implement ETag-based caching with `Cache-Control` headers.

| Header | Value |
| --- | --- |
| `Cache-Control` | `public, max-age=300, s-maxage=300` |
| `ETag` | `"<md5-hash>"` |

The ETag is an MD5 hash of the JSON response body. Clients should send the `If-None-Match` header on subsequent requests. If the ETag matches, the server responds with `304 Not Modified` and an empty body — no re-fetching of data occurs.

```
GET /api/public/projects?page=1&limit=12
If-None-Match: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"

→ 304 Not Modified
```

**Cache duration:** 300 seconds (5 minutes).

---

## Rate Limiting

No rate limiting is applied at the API key level. For production use, implement client-side throttling or place a CDN/cache layer in front of these endpoints.
