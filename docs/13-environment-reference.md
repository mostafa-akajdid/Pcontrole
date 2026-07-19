# 13 — Environment Reference

> Complete reference for every environment variable used by TASKILY CMS,
> including required/optional status, defaults, usage, and security notes.

---

## Table of Contents

- [Overview](#overview)
- [Environment Files](#environment-files)
- [Database Variables](#database-variables)
- [Authentication Variables](#authentication-variables)
- [Cloudinary Variables](#cloudinary-variables)
- [Application Variables](#application-variables)
- [Runtime Variables](#runtime-variables)
- [Variable Summary Table](#variable-summary-table)
- [Security Guidelines](#security-guidelines)
- [Troubleshooting](#troubleshooting)

---

## Overview

TASKILY CMS uses environment variables for all configuration. Variables are loaded from `.env.local` in development and from the hosting platform's environment configuration in production.

### Variable Loading Order

```mermaid
flowchart LR
    A[".env.local"] --> B["Next.js Runtime"]
    C["Platform env vars"] --> B
    B --> D["process.env.*"]
    D --> E["Application code"]
```

Next.js loads variables in this order (later overrides earlier):

1. `.env` — Default values (committed to Git)
2. `.env.local` — Local overrides (NOT committed)
3. `.env.development` — Development-only
4. `.env.production` — Production-only
5. Platform environment variables (Vercel, etc.)

> **Rule:** Always use `.env.local` for secrets. Never commit secrets to Git.

---

## Environment Files

### `.env.example` (Committed to Git)

Template file with placeholder values. Safe to commit.

```bash
# Copy to .env.local and fill in values
cp .env.example .env.local
```

### `.env.local` (NOT Committed)

Your actual configuration. Listed in `.gitignore`.

```bash
# This file should NEVER be committed
.env.local
```

---

## Database Variables

### `DATABASE_URL`

| Property | Value |
|---|---|
| **Required** | Yes |
| **Type** | PostgreSQL connection string |
| **Default** | None |
| **Used in** | `prisma/schema.prisma`, `lib/prisma.js` |

**Description:** PostgreSQL connection string used by Prisma to connect to the database.

**Format:**

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

**Components:**

| Part | Description | Example |
|---|---|---|
| `USER` | Database username | `neondb_owner` |
| `PASSWORD` | Database password | `abc123...` |
| `HOST` | Database host | `ep-xxx-xxx.us-east-2.aws.neon.tech` |
| `PORT` | Database port | `5432` |
| `DATABASE` | Database name | `taskily_cms` |
| `sslmode` | SSL mode | `require` (recommended) |

**Examples:**

```bash
# Neon (recommended)
DATABASE_URL="postgresql://neondb_owner:abc123@ep-cool-rain-123456.us-east-2.aws.neon.tech/taskily_cms?sslmode=require"

# Local PostgreSQL
DATABASE_URL="postgresql://localhost:5432/taskily_cms"

# Docker PostgreSQL
DATABASE_URL="postgresql://taskily:secret@localhost:5432/taskily_cms"
```

**Security notes:**
- Use `sslmode=require` in production
- Never expose this value in client-side code
- Neon automatically handles connection pooling

---

## Authentication Variables

### `JWT_SECRET`

| Property | Value |
|---|---|
| **Required** | Yes |
| **Type** | String (≥ 32 characters) |
| **Default** | None (application throws error if missing) |
| **Used in** | `middleware.js`, `lib/auth.js` |

**Description:** Secret key used to sign and verify JWT tokens. Must be cryptographically random and at least 32 characters.

**Usage:**
- `middleware.js`: Encodes the secret with `new TextEncoder().encode(JWT_SECRET)` for Edge Runtime JWT verification
- `lib/auth.js`: Signs JWT tokens with `SignJWT` (HS256 algorithm) and decodes them with `decodeJwt`

**Generate a secure secret:**

```bash
# macOS/Linux
openssl rand -base64 48

# Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Quick (less secure, for development only)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example:**

```bash
JWT_SECRET="k8J3mN2pL5qR7tW9yB4xC6vF8hD1gA0sE3uI2oP5lK8jM4nQ7rT0wX"
```

**Security notes:**
- NEVER use a short or predictable string
- NEVER commit this to Git
- Rotate the secret periodically (invalidates all existing tokens)
- Changing this value forces all users to re-authenticate

### `JWT_EXPIRES_IN`

| Property | Value |
|---|---|
| **Required** | No |
| **Type** | String (time format) |
| **Default** | `7d` |
| **Used in** | `lib/auth.js` |

**Description:** Determines how long JWT tokens remain valid after login.

**Format options:**

| Format | Example | Meaning |
|---|---|---|
| Days | `7d` | 7 days |
| Hours | `24h` | 24 hours |
| Minutes | `60m` | 60 minutes |
| Seconds | `3600s` | 3600 seconds |

**Examples:**

```bash
JWT_EXPIRES_IN="7d"    # 7 days (default, recommended)
JWT_EXPIRES_IN="24h"   # 24 hours (more secure)
JWT_EXPIRES_IN="60m"   # 60 minutes (very secure, frequent re-login)
```

**Security notes:**
- Shorter expiry = more secure but more frequent re-login
- The auth cookie `maxAge` is set to the same value
- Token is verified on every request via middleware

### `NEXTAUTH_URL`

| Property | Value |
|---|---|
| **Required** | No (has default) |
| **Type** | URL string |
| **Default** | `http://localhost:3000` |
| **Used in** | Authentication redirect URLs |

**Description:** The base URL of the application. Used for constructing authentication-related redirect URLs.

**Examples:**

```bash
NEXTAUTH_URL="http://localhost:3000"        # Development
NEXTAUTH_URL="https://your-app.vercel.app"  # Production
NEXTAUTH_URL="https://taskily.yourdomain.com"  # Custom domain
```

**Security notes:**
- Must match the actual application URL
- In production, must use HTTPS
- Incorrect value may cause redirect loops

---

## Cloudinary Variables

### `CLOUDINARY_CLOUD_NAME`

| Property | Value |
|---|---|
| **Required** | Yes |
| **Type** | String |
| **Default** | None |
| **Used in** | `lib/services/CloudinaryService.js` |

**Description:** Your Cloudinary cloud name, found in the Cloudinary dashboard.

**Example:**

```bash
CLOUDINARY_CLOUD_NAME="dxyz12345"
```

### `CLOUDINARY_API_KEY`

| Property | Value |
|---|---|
| **Required** | Yes |
| **Type** | String (numeric) |
| **Default** | None |
| **Used in** | `lib/services/CloudinaryService.js` |

**Description:** Your Cloudinary API key, found in the Cloudinary dashboard.

**Example:**

```bash
CLOUDINARY_API_KEY="123456789012345"
```

### `CLOUDINARY_API_SECRET`

| Property | Value |
|---|---|
| **Required** | Yes |
| **Type** | String |
| **Default** | None |
| **Used in** | `lib/services/CloudinaryService.js` |

**Description:** Your Cloudinary API secret, found in the Cloudinary dashboard. Used to sign API requests.

**Example:**

```bash
CLOUDINARY_API_SECRET="abc123xyz789..."
```

**Security notes:**
- NEVER expose this in client-side code
- NEVER commit to Git
- Rotate if compromised

**Cloudinary setup:**

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Dashboard → Account Details → Copy values
3. All files upload to `taskily/` folder by default

---

## Application Variables

### `NEXT_PUBLIC_APP_URL`

| Property | Value |
|---|---|
| **Required** | No (has default) |
| **Type** | URL string |
| **Default** | `http://localhost:3000` |
| **Used in** | Client-side code, redirects, links |
| **Client-accessible** | Yes (prefixed with `NEXT_PUBLIC_`) |

**Description:** The public-facing URL of the application. Used in client-side components for generating links, redirects, and display purposes.

**Examples:**

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"        # Development
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"  # Production
NEXT_PUBLIC_APP_URL="https://taskily.yourdomain.com"  # Custom domain
```

**Security notes:**
- Visible to the client (bundled into JavaScript)
- Must not contain secrets
- Should match `NEXTAUTH_URL`

### `NEXT_PUBLIC_APP_NAME`

| Property | Value |
|---|---|
| **Required** | No (has default) |
| **Type** | String |
| **Default** | `TASKILY` |
| **Used in** | Client-side display |
| **Client-accessible** | Yes (prefixed with `NEXT_PUBLIC_`) |

**Description:** Application display name shown in the UI, browser tab, and emails.

**Examples:**

```bash
NEXT_PUBLIC_APP_NAME="TASKILY"
NEXT_PUBLIC_APP_NAME="My CMS Dashboard"
```

---

## Runtime Variables

### `NODE_ENV`

| Property | Value |
|---|---|
| **Required** | No (set by platform) |
| **Type** | Enum |
| **Default** | `development` |
| **Used in** | Throughout the application |

**Description:** Controls runtime behavior including logging, security headers, and cookie settings.

**Values:**

| Value | Behavior |
|---|---|
| `development` | Debug logging enabled, insecure cookies, no HSTS |
| `production` | Minimal logging, secure cookies, HSTS enabled, `poweredByHeader: false` |
| `test` | Testing mode |

**Usage in code:**

| File | Behavior |
|---|---|
| `next.config.js` | Adds HSTS header in production only |
| `lib/prisma.js` | Enables query logging in development only |
| `lib/auth.js` | Sets `secure: true` on cookies in production |
| `middleware.js` | (Inherits from `next.config.js`) |

**Examples:**

```bash
NODE_ENV="development"  # Local development
NODE_ENV="production"   # Production deployment
```

**Security notes:**
- Set to `production` for all live deployments
- Controls cookie `secure` flag (HTTPS-only in production)
- Controls HSTS header (added in production only)
- Controls Prisma logging level

---

## Variable Summary Table

| Variable | Required | Default | Client | Description |
|---|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | No | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | — | No | JWT signing secret (≥ 32 chars) |
| `JWT_EXPIRES_IN` | No | `7d` | No | JWT token lifetime |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | — | No | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | — | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | — | No | Cloudinary API secret |
| `NEXTAUTH_URL` | No | `http://localhost:3000` | No | Auth redirect base URL |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | **Yes** | Public application URL |
| `NEXT_PUBLIC_APP_NAME` | No | `TASKILY` | **Yes** | Application display name |
| `NODE_ENV` | No | `development` | No | Runtime environment |

**Legend:**
- **Required**: Application will not start or will throw errors if missing
- **Client**: Whether the variable is exposed to the browser (via `NEXT_PUBLIC_` prefix)
- Variables prefixed with `NEXT_PUBLIC_` are bundled into client-side JavaScript

---

## Security Guidelines

### Do's

- [x] Use `.env.local` for all secrets
- [x] Generate `JWT_SECRET` with `openssl rand -base64 48`
- [x] Use different values for development and production
- [x] Use `sslmode=require` in `DATABASE_URL`
- [x] Rotate `JWT_SECRET` periodically
- [x] Use platform environment variables in production (Vercel, etc.)

### Don'ts

- [ ] Never commit `.env.local` to Git
- [ ] Never use `NEXT_PUBLIC_` prefix for secrets
- [ ] Never use short or predictable `JWT_SECRET` values
- [ ] Never hardcode credentials in source code
- [ ] Never use development credentials in production
- [ ] Never log environment variables in production

### Generating Secure Values

```bash
# JWT_SECRET (48 bytes, base64)
openssl rand -base64 48

# Alternative (32 bytes, hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Troubleshooting

### "JWT_SECRET environment variable is not set"

**Cause:** `JWT_SECRET` is not configured.

**Fix:** Add to `.env.local`:
```bash
JWT_SECRET="$(openssl rand -base64 48)"
```

### Database connection fails

**Cause:** `DATABASE_URL` is incorrect or unreachable.

**Debug:**
```bash
# Test Prisma connection
npx prisma db push

# Verify format
# postgresql://USER:PASS@HOST:PORT/DB?sslmode=require
```

### Cloudinary uploads fail

**Cause:** Invalid Cloudinary credentials.

**Debug:** Verify all three Cloudinary variables are set correctly in `.env.local`.

### Redirect loop after login

**Cause:** `NEXTAUTH_URL` doesn't match the actual application URL.

**Fix:** Ensure `NEXTAUTH_URL` matches your domain exactly (including protocol).

### "NEXT_PUBLIC_" variables not updating

**Cause:** Client-side variables are baked into the JavaScript bundle at build time.

**Fix:** Rebuild the application after changing `NEXT_PUBLIC_*` variables:
```bash
npm run build
```

---

## See Also

- [12 — Deployment Guide](./12-deployment-guide.md) — Step-by-step deployment instructions
- [11 — Database Reference](./11-database-reference.md) — DATABASE_URL usage in schema
- [07 — Authentication](./07-authentication.md) — JWT and cookie details
- [04 — Tech Stack](./04-tech-stack.md) — Technology choices
