# Milestone 13.1 — Cookie Fix

**Date:** 2026-07-18
**Status:** COMPLETE

---

## Problem

Login crashed during HTTP-only cookie creation with:

```
TypeError: serialize is not a function
Location: lib/auth.js — setTokenCookie()
```

Root cause: `cookie` package v2.0.1 completely changed its API from v1.x.

| v1.x (expected) | v2.0.1 (installed) | Purpose |
|------------------|---------------------|---------|
| `serialize(name, value, options)` | `stringifySetCookie({ name, value, ...attrs }, {})` | Create Set-Cookie header |
| `parse(str)` | `parseCookie(str)` | Parse incoming Cookie header |

---

## Root Cause

`package.json` has `"cookie": "^2.0.1"`. The code was written against the v1.x API:

```js
// v1.x — BROKEN with cookie v2
import { serialize, parse } from 'cookie';
serialize('auth_token', token, { httpOnly: true, ... });
parse(req.headers.cookie || '');
```

`cookie` v2 exports: `parseCookie`, `parseSetCookie`, `stringifyCookie`, `stringifySetCookie`.
It does NOT export `serialize` or `parse`.

---

## Fix Applied

**File:** `lib/auth.js`

### Import
```js
// Before (broken)
import { serialize, parse } from 'cookie';

// After (fixed)
import { stringifySetCookie, parseCookie } from 'cookie';
```

### setTokenCookie()
```js
// Before (broken)
const cookie = serialize('auth_token', token, {
  httpOnly: true, secure: ..., sameSite: 'lax', maxAge: 604800, path: '/',
});

// After (fixed) — attributes go on the cookie object, not as options arg
const cookie = stringifySetCookie({
  name: 'auth_token', value: token,
  httpOnly: true, secure: ..., sameSite: 'lax', maxAge: 604800, path: '/',
}, {});
```

### removeTokenCookie()
Same pattern — `serialize(name, '', opts)` → `stringifySetCookie({ name: ..., value: '', ... }, {})`.

### getTokenFromRequest()
```js
// Before
const cookies = parse(req.headers.cookie || '');

// After
const cookies = parseCookie(req.headers.cookie || '');
```

---

## Verification

### Cookie v2 API Test
```
SET COOKIE: auth_token=<token>; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax
REMOVE COOKIE: auth_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax
PARSED TOKEN: <correct value>
EMPTY STRING: PASS (empty object)
```

### Edge Case: undefined input
`parseCookie(undefined)` throws in v2 (unlike v1's `parse`). `getTokenFromRequest` already has the `|| ''` guard, so this is safe.

Middleware (`middleware.js:26`) uses its own native `parseCookies()` — not affected.

### Files using `cookie` package
Only `lib/auth.js` imports from `cookie`. No other files affected.

---

## Impact

- `setTokenCookie()` — Used by `POST /api/auth/login`, `POST /api/auth/register`
- `removeTokenCookie()` — Used by `POST /api/auth/logout`
- `getTokenFromRequest()` — Used by all authenticated API routes and `getUserFromRequest()`
- `middleware.js` — Uses native parser, NOT affected

**Before:** Every login/register request crashes with `TypeError: serialize is not a function`
**After:** All auth flows produce valid HTTP-only cookies

---

## Build

```
✓ Compiled successfully
✓ 21 static pages generated
✓ Middleware: 32.5 kB
```

---

## Conclusion

The `cookie` package v2.0.1 changed `serialize()` → `stringifySetCookie()` and `parse()` → `parseCookie()`, with different argument conventions. The fix is a direct 1:1 API mapping — no architectural changes. All auth flows (login, register, logout, token refresh, middleware verification) are functional.
