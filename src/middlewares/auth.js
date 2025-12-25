import { env } from '../config/env.js';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';

  if (!token || token !== env.API_KEY) {
    return res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
  }

  // Simple identity for auditing. You can swap to Supabase JWT verification later.
  req.user = { id: 'api-key' };
  next();
}
