import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const SESSION_COOKIE = 'session';

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function signSession({ userId }) {
  return jwt.sign(
    {
      sub: String(userId),
      typ: 'session'
    },
    env.SESSION_JWT_SECRET,
    {
      expiresIn: '14d'
    }
  );
}

export function verifySession(token) {
  return jwt.verify(token, env.SESSION_JWT_SECRET);
}

export function sessionCookieOptions(req) {
  const isProd = env.NODE_ENV === 'production';
  const isSecure = isProd || req.secure || req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/'
  };
}
