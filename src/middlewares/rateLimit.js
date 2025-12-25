import rateLimit from 'express-rate-limit';

export const generateFormLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many requests', code: 'RATE_LIMITED' } }
});
