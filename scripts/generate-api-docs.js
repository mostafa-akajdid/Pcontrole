#!/usr/bin/env node

/**
 * generate-api-docs.js
 *
 * Scans all API route files under `pages/api/`, extracts route information
 * (methods, parameters, permissions, validation schemas), and outputs a
 * summary to `docs/api/API_ROUTES.md` — a quick-reference index of all
 * endpoints.
 *
 * Usage:  node scripts/generate-api-docs.js
 * Output: docs/api/API_ROUTES.md
 *
 * Uses only Node.js built-in modules (fs, path). No external dependencies.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '..');
const API_DIR = path.join(PROJECT_ROOT, 'pages', 'api');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'docs', 'api');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'API_ROUTES.md');

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

const MODULE_LABELS = {
  auth: 'Auth',
  projects: 'Projects',
  blogs: 'Blogs',
  media: 'Media',
  users: 'Users',
  roles: 'Roles',
  settings: 'Settings',
  dashboard: 'Dashboard',
  audit: 'Audit',
  notifications: 'Notifications',
  search: 'Global Search',
  public: 'Public / Headless API',
  'project-categories': 'Project Categories',
  'blog-categories': 'Blog Categories',
};

const MODULE_ORDER = [
  'auth',
  'projects',
  'blogs',
  'media',
  'users',
  'roles',
  'settings',
  'dashboard',
  'audit',
  'notifications',
  'search',
  'public',
  'project-categories',
  'blog-categories',
];

// Middleware public routes (from middleware.js)
const MIDDLEWARE_API_PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

// All routes under /api/public/ are also public (bypass middleware JWT check)
const PUBLIC_ROUTE_PREFIX = '/api/public/';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively find all .js files under a directory.
 */
function findJsFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Convert a file path relative to pages/api/ into an API route path.
 *
 * Examples:
 *   pages/api/auth/login.js              -> /api/auth/login
 *   pages/api/projects/[id].js           -> /api/projects/[id]
 *   pages/api/projects/[id]/images.js    -> /api/projects/[id]/images
 *   pages/api/search.js                  -> /api/search
 *   pages/api/public/projects/[slug].js  -> /api/public/projects/[slug]
 */
function filePathToRoutePath(filePath) {
  let rel = path.relative(API_DIR, filePath);
  // Normalize separators
  rel = rel.replace(/\\/g, '/');
  // Remove .js extension
  rel = rel.replace(/\.js$/, '');
  // Replace /index with parent directory (index.js -> base path)
  if (rel.endsWith('/index')) {
    rel = rel.replace(/\/index$/, '');
  }
  return '/api/' + rel;
}

/**
 * Derive the module name from the route path.
 *
 * Modules: auth, projects, blogs, media, users, roles, settings,
 *          dashboard, audit, notifications, public, project-categories,
 *          blog-categories
 * Standalone: search -> 'search'
 */
function getModuleFromRoutePath(routePath) {
  const parts = routePath.replace('/api/', '').split('/');
  const first = parts[0];
  if (first === 'search') return 'search';
  return first || 'root';
}

/**
 * Determine if a route is in the public whitelist (from middleware.js).
 */
function isMiddlewarePublicRoute(routePath) {
  if (routePath.startsWith(PUBLIC_ROUTE_PREFIX)) return true;
  return MIDDLEWARE_API_PUBLIC_ROUTES.includes(routePath);
}

// ---------------------------------------------------------------------------
// Source code parsing (regex-based, no AST dependency)
// ---------------------------------------------------------------------------

/**
 * Extract HTTP methods from a handler file's source code.
 *
 * Detects:
 *   - switch/case patterns:  case 'GET':  case 'POST':
 *   - equality checks:       req.method !== 'GET'  /  req.method === 'POST'
 *   - inequality checks:     req.method !== 'POST'
 *   - combined conditions:   case 'PUT':\n case 'PATCH':
 */
function extractMethods(source) {
  const methods = new Set();

  // Pattern 1: switch (req.method) { case 'METHOD': ... }
  const switchCases = source.matchAll(/case\s+['"](\w+)['"]\s*:/g);
  for (const m of switchCases) {
    if (HTTP_METHODS.includes(m[1])) {
      methods.add(m[1]);
    }
  }

  // Pattern 2: req.method !== 'METHOD'  or  req.method !== 'METHOD'
  const notEqual = source.matchAll(/req\.method\s*!==?\s*['"](\w+)['"]/g);
  for (const m of notEqual) {
    if (HTTP_METHODS.includes(m[1])) {
      methods.add(m[1]);
    }
  }

  // Pattern 3: if (req.method === 'METHOD')
  const isEqual = source.matchAll(/req\.method\s*===?\s*['"](\w+)['"]/g);
  for (const m of isEqual) {
    if (HTTP_METHODS.includes(m[1])) {
      methods.add(m[1]);
    }
  }

  // If the handler checks `req.method !== 'X'` at the top level (early return)
  // it typically only allows that single method. But if there's a switch, we
  // already captured all cases. The !== pattern combined with a switch is
  // redundant — the switch is the authoritative source.

  // If we found nothing, assume unknown
  return methods.size > 0 ? [...methods].sort() : [];
}

/**
 * Extract permission strings from the source code.
 *
 * Looks for patterns like:
 *   user.permissions?.includes('projects.create')
 *   admin.permissions?.includes('roles.read')
 *   requiredPerm = 'media.delete'
 */
function extractPermissions(source) {
  const perms = new Set();

  // Pattern: .permissions?.includes('...')
  const permMatches = source.matchAll(/\.permissions\?\.\s*includes\s*\(\s*['"]([^'"]+)['"]/g);
  for (const m of permMatches) {
    perms.add(m[1]);
  }

  // Pattern: requiredPerm = 'module.action'
  const requiredPermMatches = source.matchAll(/requiredPerm\s*=\s*['"]([^'"]+)['"]/g);
  for (const m of requiredPermMatches) {
    perms.add(m[1]);
  }

  // Pattern: requiredPerm = variable — detect the conditional logic
  // e.g., const requiredPerm = ['delete', 'restore'].includes(req.body.action)
  //         ? 'projects.delete'
  //         : 'projects.update';
  // We already catch the string literals in the ternary above.

  return [...perms].sort();
}

/**
 * Determine the authentication type for a route.
 *
 * 1. If the file does NOT call getUserFromRequest — no auth (but check API key).
 * 2. If it uses req.headers['x-api-key'] — API Key auth.
 * 3. Otherwise — JWT (cookie-based).
 */
function extractAuthType(source) {
  // Check for API key pattern
  if (source.includes('x-api-key') || source.includes("req.headers['x-api-key']")) {
    return 'API Key';
  }

  // Check for getUserFromRequest (JWT auth pattern used in this project)
  if (source.includes('getUserFromRequest')) {
    return 'JWT';
  }

  // No auth detected (public route handled by middleware or route itself)
  return 'None';
}

/**
 * Check if CSRF protection applies to this route.
 *
 * CSRF is enforced by middleware for state-changing methods (POST, PUT, DELETE,
 * PATCH) on all authenticated API routes EXCEPT the public whitelist.
 *
 * Public API routes (/api/public/*) and the API_PUBLIC_ROUTES bypass CSRF
 * because they bypass JWT auth entirely (middleware returns next() early).
 */
function hasCsrfProtection(source, routePath) {
  if (isMiddlewarePublicRoute(routePath)) return false;

  // If the route has no auth, it's either public or uses API key — CSRF doesn't
  // apply the same way. But technically middleware still runs CSRF for non-public
  // routes. We flag it as "Yes" for authenticated state-changing routes.
  const authType = extractAuthType(source);
  if (authType === 'None') return false;

  // CSRF is relevant for state-changing methods. We flag per-method in the table.
  // Return true if the file handles any state-changing method.
  const methods = extractMethods(source);
  return methods.some((m) => STATE_CHANGING_METHODS.includes(m));
}

/**
 * Extract validation schema names from the source code.
 *
 * Patterns:
 *   - validateRequest(schemaName, ...)  (imported schema)
 *   - validateRequest(z.object({ ... }), ...)  (inline Zod schema — we note "inline")
 */
function extractValidationSchemas(source) {
  const schemas = new Set();

  // Pattern 1: validateRequest(identifier, ...) where identifier is a named schema
  const namedSchemas = source.matchAll(/validateRequest\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,/g);
  for (const m of namedSchemas) {
    const name = m[1];
    // Skip inline z.* calls and the second argument
    if (name !== 'req' && name !== 'z' && !name.startsWith('z.')) {
      schemas.add(name);
    }
  }

  // Pattern 2: Inline z.object — note it as "inline"
  if (source.match(/validateRequest\s*\(\s*z\.object\s*\(/)) {
    schemas.add('inline zod schema');
  }

  return [...schemas];
}

// ---------------------------------------------------------------------------
// Parse a single route file
// ---------------------------------------------------------------------------

function parseRouteFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const routePath = filePathToRoutePath(filePath);
  const methods = extractMethods(source);
  const permissions = extractPermissions(source);
  const authType = extractAuthType(source);
  const csrfApplies = hasCsrfProtection(source, routePath);
  const schemas = extractValidationSchemas(source);
  const module = getModuleFromRoutePath(routePath);
  const isPublic = isMiddlewarePublicRoute(routePath);

  return {
    filePath,
    routePath,
    methods,
    permissions,
    authType,
    csrfApplies,
    schemas,
    module,
    isPublic,
  };
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------

function formatCsrf(method, csrfApplies) {
  if (!STATE_CHANGING_METHODS.includes(method)) return '—';
  return csrfApplies ? 'Yes' : 'No';
}

function formatPermission(perms) {
  if (!perms || perms.length === 0) return '—';
  // Show all permissions, joined by comma
  return perms.map((p) => `\`${p}\``).join(' ');
}

function formatSchemas(schemas) {
  if (!schemas || schemas.length === 0) return '—';
  return schemas.map((s) => `\`${s}\``).join(' ');
}

function formatAuth(authType, routePath) {
  if (isMiddlewarePublicRoute(routePath)) {
    if (routePath.startsWith(PUBLIC_ROUTE_PREFIX)) return 'API Key';
    return 'None';
  }
  return authType;
}

/**
 * For a given route, generate one table row per method.
 */
function routeToTableRows(route) {
  const rows = [];
  const auth = formatAuth(route.authType, route.routePath);

  for (const method of route.methods) {
    // Determine the most specific permission for this method
    // (permissions are extracted per-file, not per-method, so we show all)
    const methodPerm = route.permissions;

    // Determine the validation schema for this method
    // (schemas are extracted per-file, so we show all)
    const methodSchema = route.schemas;

    // For CSRF column, we indicate per method
    const csrf = formatCsrf(method, route.csrfApplies);

    rows.push({
      method,
      path: route.routePath,
      auth,
      permission: formatPermission(methodPerm),
      validation: formatSchemas(methodSchema),
      csrf,
    });
  }

  return rows;
}

/**
 * Group routes by module and build the full markdown document.
 */
function generateMarkdown(routes) {
  const now = new Date().toISOString().split('T')[0];

  // --- Compute summary stats ---
  const totalRoutes = routes.reduce((sum, r) => sum + Math.max(r.methods.length, 1), 0);
  const authenticatedRoutes = routes.filter((r) => r.authType === 'JWT' || r.authType === 'API Key');
  const publicRoutes = routes.filter((r) => r.authType === 'None' || isMiddlewarePublicRoute(r.routePath));
  const adminRoutes = routes.filter((r) => r.permissions.length > 0);

  const totalAuthenticatedCount = authenticatedRoutes.reduce(
    (sum, r) => sum + Math.max(r.methods.length, 1),
    0
  );
  const totalPublicCount = publicRoutes.reduce(
    (sum, r) => sum + Math.max(r.methods.length, 1),
    0
  );
  const totalAdminCount = adminRoutes.reduce(
    (sum, r) => sum + Math.max(r.methods.length, 1),
    0
  );

  // --- Group routes by module ---
  const grouped = {};
  for (const route of routes) {
    const mod = route.module;
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod].push(route);
  }

  // Sort modules by predefined order
  const sortedModules = Object.keys(grouped).sort((a, b) => {
    const ai = MODULE_ORDER.indexOf(a);
    const bi = MODULE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  // --- Build markdown ---
  const lines = [];

  lines.push('# API Routes Reference (Auto-Generated)');
  lines.push('');
  lines.push(
    `> Generated on ${now}. This file is auto-generated by \`scripts/generate-api-docs.js\`.`
  );
  lines.push(
    '> Run `node scripts/generate-api-docs.js` to regenerate.'
  );
  lines.push('');

  // --- Summary table ---
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| Total API Routes | ${totalRoutes} |`);
  lines.push(`| Authenticated Routes | ${totalAuthenticatedCount} |`);
  lines.push(`| Public Routes | ${totalPublicCount} |`);
  lines.push(`| Admin Routes (permission-gated) | ${totalAdminCount} |`);
  lines.push('');

  // --- Middleware public routes note ---
  lines.push('## Notes');
  lines.push('');
  lines.push('- **Auth**: `JWT` = cookie-based JWT (middleware-protected); `API Key` = `x-api-key` header; `None` = no auth required.');
  lines.push('- **CSRF**: Applies to state-changing methods (POST/PUT/PATCH/DELETE) on authenticated routes. Bypassed for public API routes.');
  lines.push('- **Permission**: The required permission string checked via `user.permissions?.includes(...)`.');
  lines.push('- **Validation**: The Zod schema name used in `validateRequest(schema, body)`.');
  lines.push('- Routes under `/api/public/*` bypass JWT middleware and use API key authentication.');
  lines.push(`- Middleware public routes (no JWT required): ${MIDDLEWARE_API_PUBLIC_ROUTES.map((r) => '`' + r + '`').join(', ')}.`);
  lines.push('');

  // --- Routes by module ---
  lines.push('## Routes by Module');
  lines.push('');

  for (const mod of sortedModules) {
    const modRoutes = grouped[mod];
    const label = MODULE_LABELS[mod] || mod;
    // Determine the base path for the module
    const basePath = mod === 'search' ? '/api/search' : `/api/${mod}`;

    lines.push(`### ${label} (\`${basePath}\`)`);
    lines.push('');
    lines.push('| Method | Path | Auth | CSRF | Permission | Validation |');
    lines.push('|--------|------|------|------|------------|------------|');

    // Sort routes by method then path
    const allRows = [];
    for (const route of modRoutes) {
      allRows.push(...routeToTableRows(route));
    }
    allRows.sort((a, b) => {
      // Sort by method priority, then path
      const methodOrder = { GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4 };
      const aOrd = methodOrder[a.method] ?? 5;
      const bOrd = methodOrder[b.method] ?? 5;
      if (aOrd !== bOrd) return aOrd - bOrd;
      return a.path.localeCompare(b.path);
    });

    for (const row of allRows) {
      lines.push(
        `| ${row.method} | \`${row.path}\` | ${row.auth} | ${row.csrf} | ${row.permission} | ${row.validation} |`
      );
    }

    lines.push('');
  }

  // --- Endpoint count by module ---
  lines.push('## Endpoint Count by Module');
  lines.push('');
  lines.push('| Module | Endpoints |');
  lines.push('|--------|-----------|');

  for (const mod of sortedModules) {
    const modRoutes = grouped[mod];
    const count = modRoutes.reduce((sum, r) => sum + Math.max(r.methods.length, 1), 0);
    const label = MODULE_LABELS[mod] || mod;
    lines.push(`| ${label} | ${count} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(
    '*This document is auto-generated. Do not edit manually. Run `node scripts/generate-api-docs.js` to update.*'
  );
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('Scanning API routes...');

  if (!fs.existsSync(API_DIR)) {
    console.error(`API directory not found: ${API_DIR}`);
    process.exit(1);
  }

  const files = findJsFiles(API_DIR);
  console.log(`Found ${files.length} API route files.`);

  const routes = [];
  for (const file of files) {
    try {
      routes.push(parseRouteFile(file));
    } catch (err) {
      console.error(`  [WARN] Failed to parse ${path.relative(PROJECT_ROOT, file)}: ${err.message}`);
    }
  }

  console.log(`Parsed ${routes.length} routes.`);

  const markdown = generateMarkdown(routes);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');
  console.log(`\nGenerated: ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`);

  // Print a brief summary
  const totalEndpoints = routes.reduce((sum, r) => sum + Math.max(r.methods.length, 1), 0);
  const modules = [...new Set(routes.map((r) => r.module))];
  console.log(`  ${totalEndpoints} endpoints across ${modules.length} modules.`);
}

main();
