# Example: Performance Investigation

## Scenario

The Product Owner reports: "The dashboard takes 8 seconds to load. It should load in under 2 seconds."

## AI Response (Following AIOS)

### Objective

Investigate why the dashboard takes 8 seconds to load and reduce it to under 2 seconds.

### Analysis

Before making any changes, I need to measure. "Slow" is not specific enough. I need to identify:

1. Where the time is spent (network, server, database, rendering)
2. What data is being fetched
3. How many requests are made
4. What the database query patterns are

### Investigation

**Step 1: Network Analysis**

The dashboard makes 6 API calls on load:
- `GET /api/dashboard/overview` — 2,300ms
- `GET /api/dashboard/stats` — 1,800ms
- `GET /api/projects?limit=5` — 1,200ms
- `GET /api/blogs?limit=5` — 1,100ms
- `GET /api/notifications?limit=5` — 900ms
- `GET /api/audit?limit=10` — 700ms

Total serial time: ~8,000ms (matches the reported 8 seconds)

**Step 2: Database Analysis**

The `/api/dashboard/overview` endpoint runs 4 separate queries:
1. Count all users
2. Count all projects
3. Count all blogs
4. Get recent activity

Each query is fast (~50ms), but they run sequentially, and the service also does additional processing.

**Step 3: Root Causes Identified**

1. **Serial API calls:** 6 API calls run sequentially in the frontend
2. **Serial database queries:** The overview endpoint runs 4 queries sequentially
3. **Over-fetching:** Some endpoints return more data than needed
4. **No caching:** Same data is fetched on every page load

### Plan

| Fix | Impact | Effort | Priority |
|-----|--------|--------|----------|
| Parallelize frontend API calls | High (~6x improvement) | Low | P0 |
| Parallelize database queries | Medium (~4x improvement for overview) | Low | P0 |
| Add pagination limits | Low | Low | P1 |
| Add response caching | Medium | Medium | P2 |

### Implementation

**Fix 1: Parallelize Frontend API Calls**

Changed from:
```javascript
const overview = await fetch('/api/dashboard/overview');
const stats = await fetch('/api/dashboard/stats');
// ... 4 more sequential calls
```

To:
```javascript
const [overview, stats, projects, blogs, notifications, audit] = await Promise.all([
  fetch('/api/dashboard/overview'),
  fetch('/api/dashboard/stats'),
  fetch('/api/projects?limit=5'),
  fetch('/api/blogs?limit=5'),
  fetch('/api/notifications?limit=5'),
  fetch('/api/audit?limit=10'),
]);
```

**Fix 2: Parallelize Database Queries**

Changed the overview service to use `Promise.all` for database queries:
```javascript
const [userCount, projectCount, blogCount, recentActivity] = await Promise.all([
  prisma.user.count(),
  prisma.project.count(),
  prisma.blog.count(),
  prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
]);
```

### Verification

**Before:**
- Total load time: 8,200ms
- API calls: 6 serial
- Database queries: 4 serial in overview endpoint

**After:**
- Total load time: 1,400ms
- API calls: 6 parallel (longest takes 2,300ms, but all run simultaneously)
- Database queries: 4 parallel in overview endpoint (50ms total)

**Improvement:** 8,200ms → 1,400ms (83% reduction)

### Risks

- Parallel API calls increase simultaneous server load — acceptable for dashboard
- `Promise.all` fails fast if any request fails — added error handling for partial failures

### Documentation

Updated:
- Architecture docs: Noted parallel query pattern
- API docs: Noted dashboard endpoint uses parallel queries

### Key Patterns Demonstrated

1. **Measured before optimizing** — Network and database analysis identified specific bottlenecks
2. **Minimal changes** — Two targeted fixes, no rewrite
3. **Verified improvement** — Before/after measurements prove the fix works
4. **Documented the decision** — Parallel query pattern noted for future reference
5. **No over-engineering** — Did not add caching, CDN, or other infrastructure for a 1.4s load time
