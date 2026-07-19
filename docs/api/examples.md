# API Integration Examples

Working code examples for consuming the TASKILY CMS API across languages and frameworks.

---

## cURL

### List published projects

```bash
curl -s -X GET \
  "https://your-domain.com/api/public/projects?page=1&limit=12&sort=publishedAt&order=desc" \
  -H "x-api-key: tk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" \
  -H "Accept: application/json"
```

### Get single project by slug

```bash
curl -s -X GET \
  "https://your-domain.com/api/public/projects/corporate-website-redesign" \
  -H "x-api-key: tk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" \
  -H "Accept: application/json"
```

### Conditional request (ETag caching)

```bash
curl -s -X GET \
  "https://your-domain.com/api/public/projects" \
  -H "x-api-key: tk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" \
  -H 'If-None-Match: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"'
# Returns 304 Not Modified with empty body if unchanged
```

### Admin: List API keys

```bash
curl -s -X GET \
  "https://your-domain.com/api/settings/headless-api" \
  -H "Cookie: taskily_token=eyJhbGciOi..."
```

### Admin: Create API key

```bash
curl -s -X POST \
  "https://your-domain.com/api/settings/headless-api" \
  -H "Content-Type: application/json" \
  -H "Cookie: taskily_token=eyJhbGciOi..." \
  -d '{
    "siteName": "Client Portfolio",
    "domain": "https://portfolio.example.com",
    "enabled": true,
    "allowedModules": ["projects"]
  }'
```

---

## JavaScript (Fetch)

### Public API — List projects

```javascript
const API_KEY = "tk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0";
const BASE_URL = "https://your-domain.com/api/public";

async function getProjects({ page = 1, limit = 12, category, year, search } = {}) {
  const params = new URLSearchParams({ page, limit });

  if (category) params.set("category", category);
  if (year) params.set("year", year);
  if (search) params.set("search", search);

  const response = await fetch(`${BASE_URL}/projects?${params}`, {
    headers: { "x-api-key": API_KEY },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.data; // { items, pagination }
}

// Usage
const { items, pagination } = await getProjects({ page: 1, limit: 12 });
console.log(`Showing ${items.length} of ${pagination.total} projects`);
```

### Public API — Get single project

```javascript
async function getProject(slug) {
  const response = await fetch(`${BASE_URL}/projects/${slug}`, {
    headers: { "x-api-key": API_KEY },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const result = await response.json();
  return result.data;
}

const project = await getProject("corporate-website-redesign");
```

### Public API — With ETag caching

```javascript
const cache = new Map();

async function getProjectsCached(params = {}) {
  const url = `${BASE_URL}/projects?${new URLSearchParams(params)}`;
  const cached = cache.get(url);

  const headers = { "x-api-key": API_KEY };
  if (cached?.etag) {
    headers["If-None-Match"] = cached.etag;
  }

  const response = await fetch(url, { headers });

  if (response.status === 304) {
    return cached.data;
  }

  const etag = response.headers.get("ETag");
  const result = await response.json();

  cache.set(url, { data: result.data, etag });
  return result.data;
}
```

### Admin API — With credentials

```javascript
async function listApiKeys() {
  const response = await fetch("/api/settings/headless-api", {
    credentials: "include", // sends the JWT cookie
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const result = await response.json();
  return result.data;
}

async function createApiKey({ siteName, domain, allowedModules }) {
  const response = await fetch("/api/settings/headless-api", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteName, domain, allowedModules }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create API key");
  }

  const result = await response.json();
  return result.data;
}
```

---

## JavaScript (Axios)

### Public API — List projects

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "https://your-domain.com/api/public",
  headers: { "x-api-key": "tk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0" },
});

async function getProjects(params = {}) {
  try {
    const { data } = await api.get("/projects", { params });
    return data.data;
  } catch (error) {
    if (error.response?.status === 304) return null;
    const message = error.response?.data?.error || error.message;
    throw new Error(message);
  }
}

const { items, pagination } = await getProjects({ page: 1, limit: 20 });
```

### Public API — Get single project

```javascript
async function getProject(slug) {
  try {
    const { data } = await api.get(`/projects/${slug}`);
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}
```

### Admin API — CRUD operations

```javascript
import axios from "axios";

const adminApi = axios.create({
  baseURL: "/api/settings",
  withCredentials: true, // send JWT cookie
});

// List keys
const { data: listResult } = await adminApi.get("/headless-api");

// Create key
const { data: createResult } = await adminApi.post("/headless-api", {
  siteName: "New Site",
  domain: "https://newsite.com",
  allowedModules: ["projects"],
});

// Toggle enabled/disabled
const { data: toggleResult } = await adminApi.put("/headless-api", {
  action: "toggle",
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
});

// Regenerate key
const { data: regenResult } = await adminApi.put("/headless-api", {
  action: "regenerate",
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
});

// Delete key
const { data: deleteResult } = await adminApi.delete("/headless-api", {
  params: { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
});
```

---

## Node.js

```javascript
const API_KEY = "tk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0";
const BASE_URL = "https://your-domain.com/api/public";

// Node 18+ has built-in fetch. For older versions, use: npm install node-fetch
async function fetchProjects({ page = 1, limit = 12, category, year } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (category) params.set("category", category);
  if (year) params.set("year", year);

  const response = await fetch(`${BASE_URL}/projects?${params}`, {
    headers: {
      "x-api-key": API_KEY,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(`API error ${response.status}: ${body.error}`);
  }

  const result = await response.json();
  return result.data;
}

async function main() {
  try {
    const { items, pagination } = await fetchProjects({ page: 1, limit: 10 });

    for (const project of items) {
      console.log(`${project.title} — ${project.client} (${project.year})`);
      console.log(`  ${project.description.join(" ").slice(0, 100)}...`);
      console.log(`  Gallery: ${project.gallery.length} images`);
      console.log();
    }

    console.log(`Page ${pagination.page}/${pagination.totalPages} (${pagination.total} total)`);
  } catch (error) {
    console.error("Failed to fetch projects:", error.message);
    process.exit(1);
  }
}

main();
```

---

## PHP

```php
<?php

$apiKey = 'tk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';
$baseUrl = 'https://your-domain.com/api/public';

/**
 * List published projects.
 */
function getProjects(array $params = []): array
{
    global $apiKey, $baseUrl;

    $query = http_build_query(array_merge(
        ['page' => 1, 'limit' => 12],
        $params
    ));

    $ch = curl_init("{$baseUrl}/projects?{$query}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "x-api-key: {$apiKey}",
            'Accept: application/json',
        ],
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        $error = json_decode($response, true);
        throw new Exception($error['error'] ?? "HTTP {$httpCode}");
    }

    return json_decode($response, true)['data'];
}

/**
 * Get a single project by slug.
 */
function getProject(string $slug): ?array
{
    global $apiKey, $baseUrl;

    $ch = curl_init("{$baseUrl}/projects/{$slug}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "x-api-key: {$apiKey}",
            'Accept: application/json',
        ],
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 404) return null;
    if ($httpCode !== 200) {
        $error = json_decode($response, true);
        throw new Exception($error['error'] ?? "HTTP {$httpCode}");
    }

    return json_decode($response, true)['data'];
}

// Usage
try {
    $result = getProjects(['category' => 'web-design', 'year' => 2024]);

    foreach ($result['items'] as $project) {
        echo "{$project['title']} — {$project['client']}\n";
    }

    echo "Total: {$result['pagination']['total']} projects\n";
} catch (Exception $e) {
    echo "Error: {$e->getMessage()}\n";
}
```

---

## Laravel

```php
<?php

use Illuminate\Support\Facades\Http;

class TaskilyApi
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.taskily.base_url');
        $this->apiKey = config('services.taskily.api_key');
    }

    private function publicGet(string $path, array $params = []): array
    {
        $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
            ])
            ->get("{$this->baseUrl}/api/public/{$path}", $params);

        $response->throw();

        return $response->json('data');
    }

    public function getProjects(array $params = []): array
    {
        return $this->publicGet('projects', $params);
    }

    public function getProject(string $slug): ?array
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->get("{$this->baseUrl}/api/public/projects/{$slug}");

        if ($response->status() === 404) {
            return null;
        }

        $response->throw();

        return $response->json('data');
    }

    public function adminGet(string $path): array
    {
        $response = Http::cookie('taskily_token', session('token'))
            ->get("{$this->baseUrl}/api/settings/{$path}");

        $response->throw();

        return $response->json('data');
    }
}

// Usage
$api = new TaskilyApi();

$projects = $api->getProjects([
    'page' => 1,
    'limit' => 20,
    'sort' => 'year',
    'order' => 'desc',
]);

foreach ($projects['items'] as $project) {
    echo "{$project['title']}\n";
}

$project = $api->getProject('corporate-website-redesign');
```

---

## Python

```python
import requests

API_KEY = "tk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
BASE_URL = "https://your-domain.com/api/public"


def get_projects(page=1, limit=12, category=None, year=None, search=None):
    """List published projects with optional filters."""
    params = {"page": page, "limit": limit}
    if category:
        params["category"] = category
    if year:
        params["year"] = year
    if search:
        params["search"] = search

    response = requests.get(
        f"{BASE_URL}/projects",
        params=params,
        headers={"x-api-key": API_KEY},
        timeout=30,
    )

    if not response.ok:
        error = response.json()
        raise Exception(error.get("error", f"HTTP {response.status_code}"))

    return response.json()["data"]


def get_project(slug):
    """Get a single project by slug. Returns None if not found."""
    response = requests.get(
        f"{BASE_URL}/projects/{slug}",
        headers={"x-api-key": API_KEY},
        timeout=30,
    )

    if response.status_code == 404:
        return None

    if not response.ok:
        error = response.json()
        raise Exception(error.get("error", f"HTTP {response.status_code}"))

    return response.json()["data"]


# Usage
if __name__ == "__main__":
    try:
        result = get_projects(category="web-design", year=2024)

        for project in result["items"]:
            print(f"{project['title']} — {project['client']}")
            desc = project["description"]
            if desc and desc.get("type") == "list":
                description = " ".join(desc["items"])[:100]
            elif desc and desc.get("type") == "paragraph":
                description = desc["content"][:100]
            else:
                description = "No description"
            print(f"  {description}...")
            print(f"  {len(project['gallery'])} images")
            print()

        total = result["pagination"]["total"]
        pages = result["pagination"]["totalPages"]
        print(f"Total: {total} projects across {pages} pages")

    except Exception as e:
        print(f"Error: {e}")
```

---

## Next.js

### Server-side fetching (API Route or Server Component)

```javascript
// app/projects/page.js — Server Component
async function getProjects() {
  const response = await fetch(
    "https://your-domain.com/api/public/projects?page=1&limit=12",
    {
      headers: { "x-api-key": process.env.TASKILY_API_KEY },
      next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
    }
  );

  if (!response.ok) throw new Error("Failed to fetch projects");

  return response.json();
}

export default async function ProjectsPage() {
  const { data } = await getProjects();

  return (
    <section>
      <h1>Projects</h1>
      <div className="grid">
        {data.items.map((project) => (
          <article key={project.id}>
            <h2>{project.title}</h2>
            <p>{project.shortDescription}</p>
            <span>{project.client} — {project.year}</span>
          </article>
        ))}
      </div>
      <p>Page {data.pagination.page} of {data.pagination.totalPages}</p>
    </section>
  );
}
```

### Client-side fetching (App Router)

```javascript
"use client";

import { useState, useEffect } from "react";

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/public/projects?page=1&limit=12", {
          headers: { "x-api-key": process.env.NEXT_PUBLIC_TASKILY_API_KEY },
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error);
        }

        const result = await response.json();
        setProjects(result.data.items);
        setPagination(result.data.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (loading) return <p>Loading projects...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {projects.map((project) => (
        <div key={project.id}>
          <h2>{project.title}</h2>
          <p>{project.shortDescription}</p>
        </div>
      ))}
    </div>
  );
}
```

### API Route proxy (hide API key from client)

```javascript
// app/api/projects/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const response = await fetch(
    `https://your-domain.com/api/public/projects?${searchParams}`,
    {
      headers: { "x-api-key": process.env.TASKILY_API_KEY },
    }
  );

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
```

```javascript
// Client code — no API key exposed
const response = await fetch("/api/projects?page=1&limit=12");
const { data } = await response.json();
```

---

## React

### useEffect + fetch pattern

```jsx
import { useState, useEffect } from "react";

const API_KEY = process.env.REACT_APP_TASKILY_API_KEY;
const BASE_URL = process.env.REACT_APP_TASKILY_BASE_URL;

export default function ProjectGallery() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${BASE_URL}/api/public/projects?page=${page}&limit=12`,
          { headers: { "x-api-key": API_KEY } }
        );

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error);
        }

        const result = await response.json();

        if (!cancelled) {
          setProjects(result.data.items);
          setTotalPages(result.data.pagination.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProjects();

    return () => { cancelled = true; };
  }, [page]);

  if (loading) return <div className="skeleton" />;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <div className="grid">
        {projects.map((project) => (
          <div key={project.id} className="card">
            {project.gallery[0] && (
              <img src={project.gallery[0].url} alt={project.gallery[0].alt} />
            )}
            <h3>{project.title}</h3>
            <p>{project.shortDescription}</p>
            <small>{project.client} · {project.year}</small>
          </div>
        ))}
      </div>

      <nav>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </nav>
    </div>
  );
}
```

### Admin API — React hook

```jsx
import { useState, useCallback } from "react";

export function useHeadlessApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/settings/headless-api", {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to load API keys");

      const result = await response.json();
      setKeys(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createKey = useCallback(async (payload) => {
    const response = await fetch("/api/settings/headless-api", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.error);
    }

    const result = await response.json();
    setKeys((prev) => [result.data, ...prev]);
    return result.data;
  }, []);

  const toggleKey = useCallback(async (id) => {
    const response = await fetch("/api/settings/headless-api", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", id }),
    });

    if (!response.ok) throw new Error("Failed to toggle key");

    const result = await response.json();
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? result.data : k))
    );
    return result.data;
  }, []);

  const deleteKey = useCallback(async (id) => {
    const response = await fetch(`/api/settings/headless-api?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to delete key");

    setKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  return { keys, loading, error, fetchKeys, createKey, toggleKey, deleteKey };
}
```
