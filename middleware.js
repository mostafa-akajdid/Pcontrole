import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = [
  '/',
  '/register',
  '/forgot-password',
  '/verification',
];

const API_PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_KEY = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.some((route) => pathname === route);
}

function isApiPublicRoute(pathname) {
  return API_PUBLIC_ROUTES.includes(pathname);
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const [key, ...rest] = pair.split('=');
    cookies[key.trim()] = rest.join('=').trim();
  });
  return cookies;
}

function validateCsrf(req, cookies) {
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers.get(CSRF_HEADER_NAME);
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/') && isApiPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.\w+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies.auth_token;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (!JWT_SECRET) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, JWT_SECRET_KEY);
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith('/api/') &&
    STATE_CHANGING_METHODS.includes(req.method)
  ) {
    if (!validateCsrf(req, cookies)) {
      return NextResponse.json(
        { success: false, message: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
