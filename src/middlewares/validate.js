export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          message: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          details: result.error.flatten()
        }
      });
    }

    req.validatedBody = result.data;
    next();
  };
}
