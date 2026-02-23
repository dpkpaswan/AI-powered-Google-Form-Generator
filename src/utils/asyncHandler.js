// Lightweight async handler to wrap Express route handlers and forward errors to the centralized error handler
export function asyncHandler(fn) {
  return function asyncUtilWrap(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
