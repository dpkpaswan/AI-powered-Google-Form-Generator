import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  if (status >= 500) {
    logger.error({ err }, 'Unhandled error');
  } else {
    logger.warn({ err }, 'Request error');
  }

  res.status(status).json({
    error: {
      message: err?.message ?? 'Internal Server Error',
      code: err?.code ?? 'INTERNAL_ERROR'
    }
  });
}
