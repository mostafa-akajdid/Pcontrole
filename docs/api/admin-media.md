# Media API

Admin endpoints for uploading, organizing, and managing media assets stored on Cloudinary.

---

## List media

```
GET /api/media
```

Returns a paginated list of media items with optional filtering and sorting.

### Permissions

| Permission |
| :--------- |
| `media.read` |

### Query parameters

| Parameter  | Type     | Default    | Description                                             |
| :--------- | :------- | :--------- | :------------------------------------------------------ |
| `page`     | `number` | `1`        | Page number                                             |
| `perPage`  | `number` | `25`       | Items per page                                          |
| `search`   | `string` | —          | Search by file name, alt text, or caption               |
| `format`   | `string` | —          | Filter by format: `image`, `video`, `document`          |
| `folder`   | `string` | —          | Filter by folder path                                   |
| `sort`     | `string` | `createdAt`| Sort field                                              |
| `order`    | `string` | `desc`     | Sort direction: `asc` or `desc`                         |

### Response `200`

```jsonc
{
  "media": [
    {
      "id": "uuid",
      "fileName": "hero-banner.jpg",
      "originalName": "hero banner (1).jpg",
      "mimeType": "image/jpeg",
      "format": "image",
      "size": 245760,
      "url": "https://res.cloudinary.com/demo/image/upload/v1234/hero-banner.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/w_200,h_200/hero-banner.jpg",
      "width": 1920,
      "height": 1080,
      "altText": "Homepage hero banner",
      "caption": "Summer campaign banner",
      "folder": "banners",
      "uploadedBy": {
        "id": "uuid",
        "name": "Jane Doe"
      },
      "createdAt": "2026-07-10T09:30:00Z",
      "updatedAt": "2026-07-10T09:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 25,
    "total": 384,
    "totalPages": 16
  }
}
```

---

## Upload media via URL

```
POST /api/media
```

Stores a remote media asset by providing its URL. The file is downloaded and uploaded to Cloudinary.

### Permissions

| Permission |
| :--------- |
| `media.create` |

### Request body

| Field      | Type     | Required | Description                     |
| :--------- | :------- | :------- | :------------------------------ |
| `url`      | `string` | Yes      | Remote URL of the media file    |
| `altText`  | `string` | No       | Alternative text for accessibility |
| `caption`  | `string` | No       | Caption or description          |
| `folder`   | `string` | No       | Destination folder              |

### Request example

```json
{
  "url": "https://example.com/photos/product-shot.jpg",
  "altText": "Wireless headphones product shot",
  "caption": "Studio photography of the flagship model",
  "folder": "products"
}
```

### Response `201`

```json
{
  "media": {
    "id": "uuid",
    "fileName": "product-shot.jpg",
    "mimeType": "image/jpeg",
    "format": "image",
    "size": 512000,
    "url": "https://res.cloudinary.com/demo/image/upload/v1234/product-shot.jpg",
    "altText": "Wireless headphones product shot",
    "caption": "Studio photography of the flagship model",
    "folder": "products",
    "createdAt": "2026-07-19T10:00:00Z"
  }
}
```

### Errors

| Status | Code               | Description                    |
| :----- | :----------------- | :----------------------------- |
| `400`  | `VALIDATION_ERROR` | Invalid URL or input           |
| `422`  | `FETCH_FAILED`     | Could not retrieve remote file |

---

## Upload file

```
POST /api/media/upload
```

Uploads a file directly as a base64 data URI or a URL. Enforces a **20 MB** size limit.

### Permissions

| Permission |
| :--------- |
| `media.create` |

### Request body

| Field      | Type     | Required | Description                                            |
| :--------- | :------- | :------- | :----------------------------------------------------- |
| `file`     | `string` | Yes      | Base64 data URI (`data:image/png;base64,...`) or URL   |
| `altText`  | `string` | No       | Alternative text for accessibility                     |
| `caption`  | `string` | No       | Caption or description                                 |
| `folder`   | `string` | No       | Destination folder                                     |

### Request example

```json
{
  "file": "data:image/png;base64,iVBORw0KGgoAAAANSU...",
  "altText": "Company logo",
  "folder": "branding"
}
```

### Response `201`

```json
{
  "media": {
    "id": "uuid",
    "fileName": "company-logo.png",
    "mimeType": "image/png",
    "format": "image",
    "size": 84500,
    "url": "https://res.cloudinary.com/demo/image/upload/v1234/company-logo.png",
    "altText": "Company logo",
    "folder": "branding",
    "createdAt": "2026-07-19T10:05:00Z"
  }
}
```

### Errors

| Status | Code               | Description                             |
| :----- | :----------------- | :-------------------------------------- |
| `400`  | `VALIDATION_ERROR` | Invalid file data                       |
| `413`  | `FILE_TOO_LARGE`   | File exceeds 20 MB limit                |
| `422`  | `UNSUPPORTED_TYPE` | File type not allowed                   |

---

## Get media

```
GET /api/media/[id]
```

Returns a single media item with usage information showing where it is referenced.

### Permissions

| Permission |
| :--------- |
| `media.read` |

### Response `200`

```json
{
  "media": {
    "id": "uuid",
    "fileName": "hero-banner.jpg",
    "originalName": "hero banner (1).jpg",
    "mimeType": "image/jpeg",
    "format": "image",
    "size": 245760,
    "url": "https://res.cloudinary.com/demo/image/upload/v1234/hero-banner.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/w_200,h_200/hero-banner.jpg",
    "width": 1920,
    "height": 1080,
    "altText": "Homepage hero banner",
    "caption": "Summer campaign banner",
    "folder": "banners",
    "uploadedBy": {
      "id": "uuid",
      "name": "Jane Doe"
    },
    "usage": {
      "posts": [
        { "id": "uuid", "title": "Summer Sale 2026" }
      ],
      "pages": [
        { "id": "uuid", "title": "Homepage" }
      ]
    },
    "createdAt": "2026-07-10T09:30:00Z",
    "updatedAt": "2026-07-10T09:30:00Z"
  }
}
```

### Errors

| Status | Code        | Description      |
| :----- | :---------- | :--------------- |
| `404`  | `NOT_FOUND` | Media not found  |

---

## Update media metadata

```
PUT /api/media/[id]
```

Updates a media item's metadata without re-uploading the file.

### Permissions

| Permission |
| :--------- |
| `media.update` |

### Request body

| Field      | Type     | Required | Description                     |
| :--------- | :------- | :------- | :------------------------------ |
| `altText`  | `string` | No       | Alternative text                |
| `caption`  | `string` | No       | Caption or description          |
| `fileName` | `string` | No       | Display file name               |
| `folder`   | `string` | No       | Move to a different folder      |

### Response `200`

```json
{
  "media": {
    "id": "uuid",
    "fileName": "updated-name.jpg",
    "altText": "Updated alt text",
    "caption": "Updated caption",
    "folder": "new-folder",
    "updatedAt": "2026-07-19T10:30:00Z"
  }
}
```

### Errors

| Status | Code               | Description      |
| :----- | :----------------- | :--------------- |
| `400`  | `VALIDATION_ERROR` | Invalid input    |
| `404`  | `NOT_FOUND`        | Media not found  |

---

## Delete media

```
DELETE /api/media/[id]
```

Permanently deletes a media item from both the database and Cloudinary.

### Permissions

| Permission |
| :--------- |
| `media.delete` |

### Response `200`

```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

### Errors

| Status | Code        | Description                |
| :----- | :---------- | :------------------------- |
| `404`  | `NOT_FOUND` | Media not found            |
| `409`  | `IN_USE`    | Media is referenced by content |

---

## List folders

```
GET /api/media/folders
```

Returns a list of all folders containing media assets.

### Permissions

| Permission |
| :--------- |
| `media.read` |

### Response `200`

```json
{
  "folders": [
    { "name": "banners", "count": 12 },
    { "name": "branding", "count": 8 },
    { "name": "products", "count": 45 },
    { "name": "team", "count": 15 }
  ]
}
```

---

## Statistics

```
GET /api/media/stats
```

Returns aggregate media statistics.

### Permissions

| Permission |
| :--------- |
| `media.read` |

### Response `200`

```json
{
  "totalFiles": 384,
  "totalSize": 157286400,
  "totalSizeFormatted": "150 MB",
  "byFormat": [
    { "format": "image", "count": 312, "size": 98566144 },
    { "format": "video", "count": 24, "size": 52428800 },
    { "format": "document", "count": 48, "size": 6291456 }
  ],
  "recentUploads": 18
}
```

---

## Media picker

```
GET /api/media/picker
```

Returns a lightweight list of media items optimized for picker UI components. Default `perPage` is **24**.

### Permissions

| Permission |
| :--------- |
| `media.read` |

### Query parameters

| Parameter  | Type     | Default | Description                        |
| :--------- | :------- | :------ | :--------------------------------- |
| `page`     | `number` | `1`     | Page number                        |
| `perPage`  | `number` | `24`    | Items per page                     |
| `search`   | `string` | —       | Search by file name or alt text    |
| `format`   | `string` | —       | Filter by format                   |
| `folder`   | `string` | —       | Filter by folder                   |

### Response `200`

```jsonc
{
  "media": [
    {
      "id": "uuid",
      "fileName": "hero-banner.jpg",
      "url": "https://res.cloudinary.com/demo/image/upload/v1234/hero-banner.jpg",
      "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/w_200,h_200/hero-banner.jpg",
      "mimeType": "image/jpeg",
      "format": "image",
      "altText": "Homepage hero banner"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 24,
    "total": 384,
    "totalPages": 16
  }
}
```

---

## Bulk actions

```
POST /api/media/bulk
```

Perform batch operations on multiple media items.

### Permissions

| Action          | Permission Required |
| :-------------- | :------------------ |
| `delete`        | `media.delete`      |
| `restore`       | `media.delete`      |
| `move`          | `media.update`      |
| `updateAltText` | `media.update`      |
| `updateCaption` | `media.update`      |

### Request body

| Field    | Type       | Required | Description                                           |
| :------- | :--------- | :------- | :---------------------------------------------------- |
| `ids`    | `string[]` | Yes      | Array of media UUIDs                                  |
| `action` | `string`   | Yes      | `delete`, `restore`, `move`, `updateAltText`, or `updateCaption` |
| `data`   | `object`   | No       | Action-specific payload (see below)                   |

### Action-specific `data` fields

| Action          | Field       | Type     | Description                    |
| :-------------- | :---------- | :------- | :----------------------------- |
| `move`          | `folder`    | `string` | Target folder                  |
| `updateAltText` | `altText`   | `string` | New alt text for all selected  |
| `updateCaption` | `caption`   | `string` | New caption for all selected   |

### Request examples

**Delete multiple files**

```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"],
  "action": "delete"
}
```

**Move files to a folder**

```json
{
  "ids": ["uuid-1", "uuid-2"],
  "action": "move",
  "data": {
    "folder": "archive/2025"
  }
}
```

**Batch update alt text**

```json
{
  "ids": ["uuid-1", "uuid-2"],
  "action": "updateAltText",
  "data": {
    "altText": "Updated alt text for all selected images"
  }
}
```

### Response `200`

```json
{
  "success": true,
  "affected": 3,
  "message": "3 files deleted successfully"
}
```
