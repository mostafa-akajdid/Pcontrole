import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { stringifySetCookie, parseCookie } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

let JWT_SECRET_KEY = null;

function parseExpiresInSeconds(str) {
  const num = parseInt(str, 10);
  if (str.endsWith('d')) return num * 86400;
  if (str.endsWith('h')) return num * 3600;
  if (str.endsWith('m')) return num * 60;
  return num;
}

function getJwtSecretKey() {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  if (!JWT_SECRET_KEY) {
    JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET);
  }
  return JWT_SECRET_KEY;
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getJwtSecretKey());
}

export function verifyToken(token) {
  try {
    return decodeJwt(token);
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
    maxAge: parseExpiresInSeconds(JWT_EXPIRES_IN),
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
