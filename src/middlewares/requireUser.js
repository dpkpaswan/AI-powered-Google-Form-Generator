import { getSessionCookieName, verifySession } from '../services/sessionService.js';

export function requireUser(req, res, next) {
  const cookieName = getSessionCookieName();
  const token = req.cookies?.[cookieName];

  if (!token) {
    return res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
  }

  try {
    const payload = verifySession(token);
    const userId = payload?.sub;
    if (!userId) {
      return res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
    }

    req.user = { id: userId };
    return next();
  } catch {
    return res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
  }
}
