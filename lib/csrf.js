import { stringifySetCookie, parseCookie } from 'cookie';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

export function generateCsrfToken() {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function setCsrfCookie(res, token) {
  const cookie = stringifySetCookie({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  }, {});
  res.setHeader('Set-Cookie', cookie);
}

export function clearCsrfCookie(res) {
  const existing = res.getHeader('Set-Cookie') || '';
  const cookies = Array.isArray(existing) ? existing : existing ? [existing] : [];
  cookies.push(stringifySetCookie({
    name: CSRF_COOKIE_NAME,
    value: '',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  }, {}));
  res.setHeader('Set-Cookie', cookies);
}

export function getCsrfTokenFromRequest(req) {
  const cookieHeader = req.headers?.cookie || '';
  const cookies = parseCookie(cookieHeader);
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers?.[CSRF_HEADER_NAME];
  return { cookieToken, headerToken };
}

export function validateCsrfToken(req) {
  const { cookieToken, headerToken } = getCsrfTokenFromRequest(req);
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

export function getCsrfTokenFromCookies(cookieHeader) {
  const cookies = parseCookie(cookieHeader || '');
  return cookies[CSRF_COOKIE_NAME] || null;
}
