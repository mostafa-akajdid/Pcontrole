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

  const JWT_SECRET = process.env.JWT_SECRET;
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
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, secret);
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
