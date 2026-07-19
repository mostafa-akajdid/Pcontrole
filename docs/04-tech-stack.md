# Tech Stack

## Overview

TASKILY CMS is built with a focused, production-proven technology stack. Every choice was made to minimize complexity while maximizing reliability.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (Pages Router) | Full-stack React framework |
| Language | JavaScript | Application code |
| Styling | Tailwind CSS 3 | Utility-first CSS |
| Database | PostgreSQL (Neon) | Relational data storage |
| ORM | Prisma 5 | Database access and schema management |
| Auth | jose (JWT) | Token signing and verification |
| Storage | Cloudinary | File/image storage and CDN |
| Validation | Zod | Schema-based input validation |
| Icons | Lucide React | Icon library |
| Charts | Recharts | Data visualization |
| Dates | date-fns | Date formatting and manipulation |
| Rich Text | TinyMCE | Blog post content editor |
| Passwords | bcryptjs | Password hashing |

---

## Framework: Next.js 14 (Pages Router)

### Why Next.js

Next.js provides a unified full-stack framework. API routes, server-side rendering, static generation, and middleware all live in one project. This eliminates the need for a separate backend server and simplifies deployment.

### Why Pages Router (not App Router)

| Factor | Pages Router | App Router |
|--------|-------------|------------|
| Maturity | Stable, battle-tested | Newer, still evolving |
| API Routes | `pages/api/` — simple file-based | Route Handlers — different mental model |
| Data Fetching | `getStaticProps` / `getServerSideProps` | React Server Components, `async` components |
| Learning Curve | Lower for teams familiar with React | Higher (RSC, server components, streaming) |
| Middleware | Edge Runtime — well documented | Similar but different configuration |

The Pages Router was chosen because it is stable, well-documented, and sufficient for a dashboard application that does not need React Server Components or streaming.

### Alternatives Not Used

- **App Router** — Chosen over for stability reasons
- **Remix** — Excellent framework but smaller ecosystem
- **Nuxt/Quasar** — Vue-based; project uses React
- **Express + React** — Requires separate backend deployment

---

## Language: JavaScript

### Why JavaScript (not TypeScript)

| Factor | JavaScript | TypeScript |
|--------|-----------|------------|
| Setup | Zero config | Requires `tsconfig.json`, type checking |
| Iteration Speed | Faster for prototyping | Slower initially, faster long-term |
| Prisma Types | Auto-generated regardless | Better IDE integration |
| Team Size | Single developer | Better for larger teams |

For a project of this scope (~50 source files), JavaScript with Prisma's generated types provides sufficient developer experience without TypeScript's compilation overhead.

### Alternatives Not Used

- **TypeScript** — Would be recommended for teams or projects exceeding ~100 source files
- **Flow** — Deprecated

---

## Styling: Tailwind CSS 3

### Why Tailwind

Tailwind provides utility classes that map directly to CSS properties. This eliminates the need for:
- CSS文件管理
- Naming conventions (BEM, SMACSS)
- CSS-in-JS runtime overhead
- Theme variable systems (Tailwind handles this via `tailwind.config.js`)

### Configuration

Custom theme extensions in `tailwind.config.js`:
- Custom colors for accent theming
- Dark mode via `class` strategy (toggled by `AppearanceContext`)
- Custom animations for modal transitions

### Alternatives Not Used

- **CSS Modules** — More boilerplate, no utility classes
- **Styled Components** — Runtime overhead, SSR complexity
- **Chakra UI / shadcn/ui** — Component libraries that add bundle size; TASKILY builds its own UI primitives

---

## Database: PostgreSQL (Neon)

### Why PostgreSQL

PostgreSQL is the most capable open-source relational database. It supports:
- JSON columns for flexible metadata storage
- Composite indexes for complex queries
- Full-text search (available for future use)
- ACID transactions
- Robust indexing strategies

### Why Neon

| Feature | Benefit |
|---------|---------|
| Serverless | No server management, scales to zero |
| Branching | Database branches for development |
| PostgreSQL Compatible | Full PG feature set |
| Generous Free Tier | Sufficient for development and small production |
| Connection Pooling | Built-in PgBouncer |

### Alternatives Not Used

- **Supabase** — PostgreSQL-as-a-service with realtime; TASKILY doesn't need realtime DB features
- **PlanetScale** — MySQL-based; PostgreSQL was preferred
- **SQLite** — No server-side capabilities, limited concurrency
- **MongoDB** — Document database; TASKILY's data is relational

---

## ORM: Prisma 5

### Why Prisma

| Feature | Benefit |
|---------|---------|
| Schema-first | Database schema is the source of truth |
| Type safety | Auto-generated TypeScript/JS types |
| Migrations | Version-controlled schema changes |
| Query API | Intuitive, composable queries |
| Relations | First-class relation handling |
| Studio | Visual database browser |

### Schema Design Patterns

```prisma
// UUID primary keys
id String @id @default(uuid())

// Soft delete
deletedAt DateTime?

// Timestamps
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Strategic indexes
@@index([deletedAt, status])
@@index([userId, createdAt])
```

### Why Prisma 5 (not 7)

Prisma 5 is stable and well-documented. Prisma 7 introduced breaking changes and new features that were not needed for this project.

### Alternatives Not Used

- **Drizzle** — SQL-like API; Prisma's higher-level API was preferred
- **TypeORM** — Decorator-based; less intuitive schema management
- **Knex.js** — Query builder only; no schema management
- **Mongoose** — MongoDB-only

---

## Authentication: jose (JWT)

### Why jose

| Feature | Benefit |
|---------|---------|
| Edge Runtime compatible | Works in Next.js middleware |
| Universal | Works in both Node.js and Edge |
| Actively maintained | Regular updates, good community |
| Lightweight | Small bundle size |
| Standards compliant | JWT, JWK, JWE support |

### Why JWT in HTTP-only Cookies

- **XSS Protection:** JavaScript cannot access the token
- **CSRF Protection:** Combined with Double Submit Cookie pattern
- **No Token Storage:** Browser handles cookie lifecycle automatically

### Alternatives Not Used

- **jsonwebtoken** — Node-only; doesn't work in Edge Runtime (removed from project)
- **NextAuth.js** — Overhead for cookie-based JWT auth; TASKILY implements its own
- **Session-based auth** — Requires server-side session storage
- **OAuth** — External dependency; TASKILY uses email/password

---

## CSRF Protection: Double Submit Cookie Pattern

### Why This Pattern

1. Server sets a readable cookie (`csrf_token`) with a random value
2. Client JavaScript reads the cookie and sends the value in `x-csrf-token` header
3. Middleware compares cookie value to header value

This works because:
- An attacker can force the browser to send cookies (Simple Requests)
- But an attacker cannot read the cookie value (Same-Origin Policy)
- So the attacker cannot include the correct header value

### Implementation Files

| File | Role |
|------|------|
| `lib/csrf.js` | Token generation, cookie management |
| `lib/patchFetchCsrf.js` | Injects header into all `fetch` calls |
| `middleware.js` | Server-side validation |

---

## Validation: Zod

### Why Zod

| Feature | Benefit |
|---------|---------|
| Schema-first | Validation rules are declarative |
| Coercion | Automatic type coercion for query params |
| Error messages | Customizable, structured error output |
| Lightweight | Small bundle, no dependencies |
| TypeScript-ready | Excellent inference if TS is adopted later |

### Usage Pattern

```javascript
// Define schema
export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

// Validate in API route
const validation = validateRequest(createProjectSchema, req.body);
if (!validation.success) {
  return validationErrorResponse(res, validation.errors);
}
```

### Alternatives Not Used

- **Joi** — Heavier, slower, less modern API
- **Yup** — Similar to Zod but less maintained
- **express-validator** — Express-specific; Next.js API routes don't use Express
- **Ajv** — JSON Schema based; less ergonomic for JavaScript

---

## File Storage: Cloudinary

### Why Cloudinary

| Feature | Benefit |
|---------|---------|
| Image transformations | Resize, crop, format on-the-fly |
| CDN | Global content delivery |
| Video support | Handles video uploads |
| Admin dashboard | Visual media management |
| Generous free tier | 25GB storage, 25GB bandwidth |

### Integration

- Upload via `CloudinaryService.upload()`
- Transformations via URL parameters (e.g., `?w=300&h=200&crop=fill`)
- Deletion via `CloudinaryService.destroy()`
- Media metadata stored in PostgreSQL `Media` model

### Alternatives Not Used

- **AWS S3** — More complex setup, requires CloudFront for CDN
- **Uploadthing** — Newer, less proven
- **Firebase Storage** — Google ecosystem lock-in
- **Supabase Storage** — Tied to Supabase platform

---

## Icons: Lucide React

### Why Lucide

| Feature | Benefit |
|---------|---------|
| Consistent design | All icons share the same 24x24 grid |
| Tree-shakeable | Only imported icons are bundled |
| Lightweight | ~0.5KB per icon |
| Active maintenance | Regular additions |
| MIT license | Free for commercial use |

### Alternatives Not Used

- **Heroicons** — Similar but fewer icons
- **React Icons** — Aggregates multiple icon sets; larger bundle
- **Font Awesome** — Requires font files; less React-friendly

---

## Charts: Recharts

### Why Recharts

| Feature | Benefit |
|---------|---------|
| React-native | Built specifically for React |
| Declarative | Charts are composed of React components |
| Responsive | Built-in responsive containers |
| Modular | Only import the chart types you need |
| SVG-based | Clean rendering, no canvas dependency |

### Used For

- Dashboard analytics (area charts, bar charts)
- Role distribution (pie charts)
- System health visualization

### Alternatives Not Used

- **Chart.js** — Canvas-based; less React-friendly
- **D3.js** — Too low-level for standard charts
- **Victory** — Heavier dependency
- **Nivo** — Built on D3; more complex

---

## Dates: date-fns

### Why date-fns

| Feature | Benefit |
|---------|---------|
| Tree-shakeable | Only import functions you use |
| Immutable | No date mutation |
| Lightweight | ~5KB for common functions |
| Functional | Composable date operations |
| SSR-safe | Works in Edge Runtime |

### Functions Used

```javascript
import { formatDistanceToNow, format } from 'date-fns';

// "2 hours ago"
formatDistanceToNow(new Date(date), { addSuffix: true });

// "Jan 15, 2026 14:30:00"
format(new Date(date), 'MMM d, yyyy HH:mm:ss');
```

### Alternatives Not Used

- **Moment.js** — Deprecated, mutable, large bundle
- **Day.js** — Smaller but less functional API
- **Temporal API** — Not yet stable in all environments

---

## Rich Text: TinyMCE

### Why TinyMCE

- Industry-standard WYSIWYG editor
- Self-hostable (cloud or local)
- Plugin ecosystem
- Clean HTML output
- Image upload integration

### Used For

- Blog post content editing
- Project full description editing

---

## Password Hashing: bcryptjs

### Why bcryptjs

| Feature | Benefit |
|---------|---------|
| Adaptive hashing | Cost factor adjustable |
| Salt built-in | No manual salting required |
| Pure JavaScript | No native dependencies |
| Battle-tested | Industry standard |

### Configuration

Default cost factor: 10 (configurable via `BCRYPT_ROUNDS` env var).

### Alternatives Not Used

- **argon2** — Better security but requires native bindings
- **scrypt** — Available in Node.js crypto but less common
- **SHA-256** — Not suitable for password hashing (too fast)

---

## Middleware: Edge Runtime

### Why Edge Runtime

| Feature | Benefit |
|---------|---------|
| Low latency | Runs at the edge, close to users |
| Fast cold start | Sub-millisecond startup |
| Standard Web APIs | Uses `Request`, `Response`, `fetch` |
| Next.js native | Integrated with Next.js routing |

### What Middleware Does

1. Public route detection
2. JWT verification (using `jose`)
3. CSRF validation (comparing cookie to header)

### Constraints

Edge Runtime cannot:
- Access Node.js APIs (fs, crypto module)
- Use Prisma (requires Node.js runtime)
- Perform database queries

This is why authentication lives in middleware but authorization (permission checks) lives in API routes.

---

## Summary

The tech stack is deliberately conservative. Every technology was chosen because it solves a specific problem well, not because it is trendy. The result is a codebase that is:

- **Fast to develop** — Minimal boilerplate, clear patterns
- **Fast to run** — Edge middleware, static generation, tree-shaking
- **Fast to understand** — Few technologies to learn, consistent usage
- **Fast to deploy** — Single `next build` produces a production bundle
