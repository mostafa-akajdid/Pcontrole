import jwt from 'jsonwebtoken';
import { stringifySetCookie, parseCookie } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function getJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return JWT_SECRET;
}

export function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

export function setTokenCookie(res, token) {
  const cookie = stringifySetCookie({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  }, {});
  res.setHeader('Set-Cookie', cookie);
}

export function removeTokenCookie(res) {
  const cookie = stringifySetCookie({
    name: 'auth_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  }, {});
  res.setHeader('Set-Cookie', cookie);
}

export function getTokenFromRequest(req) {
  const cookies = parseCookie(req.headers.cookie || '');
  return cookies.auth_token || null;
}

export function getUserFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
