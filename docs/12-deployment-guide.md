# 12 — Deployment Guide

> Step-by-step guide for deploying TASKILY CMS to production,
> including prerequisites, environment setup, database configuration,
> and platform-specific instructions.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Cloudinary Setup](#cloudinary-setup)
- [Build and Start](#build-and-start)
- [Production Deployment](#production-deployment)
  - [Vercel Deployment](#vercel-deployment)
  - [Self-Hosted Deployment](#self-hosted-deployment)
- [Migration Strategy](#migration-strategy)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

---

## Prerequisites

| Requirement | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18.17.0 | Runtime |
| npm | ≥ 9.0.0 | Package manager |
| PostgreSQL | 15+ | Database (Neon recommended) |
| Cloudinary account | Free tier or higher | File storage |

### Verify Prerequisites

```bash
node --version    # Should be v18.17.0 or higher
npm --version     # Should be 9.0.0 or higher
```

---

## Development Setup

### 1. Clone the Repository

```bash
git clone git@github.com:mostafa-akajdid/Pcontrole.git
cd Pcontrole
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all required values (see [Environment Configuration](#environment-configuration)).

### 4. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with initial data
npx prisma db seed
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 6. Default Admin Credentials

| Field | Value |
|---|---|
| Email | `admin@taskily.com` |
| Password | `Admin123!` |

> **Important:** Change the admin password after first login in production.

---

## Environment Configuration

All environment variables are defined in `.env.local` (never committed to Git).

### Required Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | Secret key for JWT signing (≥ 32 chars) | `your-super-secret-jwt-key-min-32-chars` |
| `JWT_EXPIRES_IN` | JWT token lifetime | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your-api-key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-api-secret` |

### Optional Variables

| Variable | Default | Description |
|---|---|---|
| `NEXTAUTH_URL` | `http://localhost:3000` | Base URL for authentication redirects |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public-facing application URL |
| `NEXT_PUBLIC_APP_NAME` | `TASKILY` | Application display name |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |

> **Full reference:** See [13 — Environment Reference](./13-environment-reference.md) for detailed documentation of every variable.

---

## Database Setup

### Option A: Neon (Recommended)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. Paste into `DATABASE_URL` in `.env.local`

**Connection string format:**

```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### Option B: Local PostgreSQL

```bash
# Create database
createdb taskily_cms

# Set DATABASE_URL in .env.local
DATABASE_URL="postgresql://localhost:5432/taskily_cms"
```

### Option C: Docker PostgreSQL

```bash
docker run -d \
  --name taskily-postgres \
  -e POSTGRES_USER=taskily \
  -e POSTGRES_PASSWORD=taskily_secret \
  -e POSTGRES_DB=taskily_cms \
  -p 5432:5432 \
  postgres:15-alpine

# Set DATABASE_URL in .env.local
DATABASE_URL="postgresql://taskily:taskily_secret@localhost:5432/taskily_cms"
```

### Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed with initial data (permissions, roles, admin user, settings)
npx prisma db seed
```

### Verify Database

```bash
# Open Prisma Studio to inspect data
npx prisma studio
```

---

## Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. From the dashboard, copy:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`
3. Add the values to `.env.local`

**Upload folder:** All files are uploaded to the `taskily/` folder in Cloudinary by default.

**Allowed image domains** (configured in `next.config.js`):

- `res.cloudinary.com`
- `images.unsplash.com`

---

## Build and Start

### Development

```bash
npm run dev
```

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

### Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Start development server with hot reload |
| `build` | `next build` | Create production build |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | Run ESLint |
| `db:push` | `npx prisma db push` | Push schema to database |
| `db:migrate` | `npx prisma migrate dev` | Create and apply migration |
| `db:seed` | `node prisma/seed.js` | Seed database |
| `db:studio` | `npx prisma studio` | Open Prisma Studio |
| `db:reset` | `npx prisma migrate reset` | Reset database (dev only) |

---

## Production Deployment

### Vercel Deployment

#### 1. Push to GitHub

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

#### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

#### 3. Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

| Variable | Value | Environment |
|---|---|---|
| `DATABASE_URL` | Your Neon connection string | Production, Preview |
| `JWT_SECRET` | Random 32+ char string | Production, Preview |
| `JWT_EXPIRES_IN` | `7d` | Production, Preview |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | Production, Preview |
| `CLOUDINARY_API_KEY` | Your API key | Production, Preview |
| `CLOUDINARY_API_SECRET` | Your API secret | Production, Preview |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `NEXT_PUBLIC_APP_NAME` | `TASKILY` | Production |

#### 4. Configure Build Settings

In Vercel dashboard → Settings → General:

- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

#### 5. Deploy

Vercel will automatically deploy on every push to `main`.

#### 6. Post-Deploy Tasks

```bash
# Run seed on production database (if first deploy)
# Use Vercel's terminal or run locally with production DATABASE_URL
npx prisma db seed
```

### Self-Hosted Deployment

#### 1. Build on Server

```bash
# Clone repository
git clone git@github.com:mostafa-akajdid/Pcontrole.git
cd Pcontrole

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with production values

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npx prisma db seed

# Build
npm run build
```

#### 2. Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "taskily" -- start

# Save PM2 configuration
pm2 save

# Auto-start on system boot
pm2 startup
```

#### 3. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com
```

---

## Migration Strategy

### Current Approach: `db push`

The project currently uses `prisma db push` for schema synchronization:

```bash
npx prisma db push
```

**Characteristics:**
- No migration files created
- Faster iteration
- Less safe for production
- No rollback support

### Recommended: `prisma migrate dev`

For production deployments, migrate to Prisma Migrate:

```bash
# Create a migration
npx prisma migrate dev --name describe_your_change

# Apply pending migrations in production
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Migration Workflow

```mermaid
flowchart TD
    A[Schema Change] --> B{Environment?}
    B -->|Development| C[npx prisma migrate dev]
    B -->|Production| D[npx prisma migrate deploy]
    C --> E[Migration file created]
    E --> F[Database updated]
    F --> G[Prisma Client generated]
    D --> H[Pending migrations applied]
    H --> I[Database updated]
    I --> J[Prisma Client generated]
    G --> K[Run tests]
    J --> L[Verify deployment]
```

---

## Security Checklist

### Pre-Deployment

- [ ] `JWT_SECRET` is ≥ 32 characters and cryptographically random
- [ ] `JWT_SECRET` is NOT committed to Git
- [ ] `.env.local` is in `.gitignore`
- [ ] `NODE_ENV` is set to `production`
- [ ] Admin password is changed from default (`Admin123!`)
- [ ] `NEXTAUTH_URL` matches production domain
- [ ] `NEXT_PUBLIC_APP_URL` matches production domain

### Database

- [ ] `DATABASE_URL` uses SSL (`sslmode=require`)
- [ ] Database user has minimal required permissions
- [ ] Database is not publicly accessible (use IP whitelist)
- [ ] Regular backups are configured (Neon handles this automatically)

### Cloudinary

- [ ] API secret is NOT committed to Git
- [ ] Upload presets are configured if using client-side uploads
- [ ] Allowed formats are restricted to needed types

### Application

- [ ] Security headers are enabled (verified in `next.config.js`)
- [ ] CSRF protection is active (Double Submit Cookie pattern)
- [ ] HTTP-only cookies are used for JWT storage
- [ ] HTTPS is enforced in production (HSTS header)
- [ ] `poweredByHeader: false` is set

### Infrastructure

- [ ] HTTPS is configured (SSL certificate)
- [ ] Firewall rules restrict unnecessary ports
- [ ] Process manager (PM2) is configured for auto-restart
- [ ] Log rotation is configured

---

## Troubleshooting

### Common Issues

#### "JWT_SECRET environment variable is not set"

**Cause:** `JWT_SECRET` is not configured in `.env.local`.

**Fix:**
```bash
# Add to .env.local
JWT_SECRET="your-random-32-char-string-here"
```

#### "Cannot connect to database"

**Cause:** `DATABASE_URL` is incorrect or database is unreachable.

**Fix:**
```bash
# Test connection
npx prisma db push --preview-feature

# Verify DATABASE_URL format
# postgresql://user:password@host:5432/dbname?sslmode=require
```

#### "Prisma Client not generated"

**Cause:** Prisma Client was not generated after schema changes.

**Fix:**
```bash
npx prisma generate
```

#### "Seed failed: Unique constraint violation"

**Cause:** Seed data already exists (idempotent — this is expected on re-runs).

**Fix:** The seed script uses `upsert`, so re-running is safe. If you see this error, it may indicate a different issue — check the error details.

#### Build fails with "Module not found"

**Cause:** Dependencies not installed or node_modules is corrupted.

**Fix:**
```bash
rm -rf node_modules
npm install
npx prisma generate
npm run build
```

#### Cloudinary upload fails

**Cause:** Invalid Cloudinary credentials.

**Fix:**
```bash
# Verify credentials in .env.local
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

#### "Invalid CSRF token" on API requests

**Cause:** CSRF cookie not set or header not sent.

**Fix:** Ensure `patchFetchCsrf.js` is imported in `_app.jsx` and all API calls use the global `fetch` (not `axios` or custom instances).

---

## Performance Optimization

### Production Recommendations

| Area | Recommendation |
|---|---|
| **Database** | Use connection pooling (Neon provides this by default) |
| **Images** | Cloudinary auto-optimization is enabled via `resourceType: 'auto'` |
| **Caching** | Next.js ISR for static pages, React cache for data |
| **Bundle** | Next.js automatic code splitting and tree shaking |
| **Compression** | Enable gzip/brotli at reverse proxy level |
| **CDN** | Vercel Edge Network or Cloudflare for static assets |

### Monitoring

| Tool | Purpose |
|---|---|
| Vercel Analytics | Performance metrics, Web Vitals |
| Neon Dashboard | Database queries, connections, storage |
| Cloudinary Dashboard | Bandwidth, storage, transformations |

---

## See Also

- [11 — Database Reference](./11-database-reference.md) — Schema details and migration strategy
- [13 — Environment Reference](./13-environment-reference.md) — All environment variables
- [02 — Architecture](./02-architecture.md) — System architecture overview
- [07 — Authentication](./07-authentication.md) — JWT and cookie security details
