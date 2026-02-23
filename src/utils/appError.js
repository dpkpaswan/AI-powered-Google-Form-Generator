export class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', cause = null } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    if (cause) this.cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }
}
