const { sendError } = require('../utils/apiResponse');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const crypto = require('crypto');

/**
 * Global Error Handler Middleware
 */
module.exports = (err, req, res, next) => {
  // Inject correlationId if not present
  if (!res.locals.correlationId) {
    res.locals.correlationId = req.headers['x-correlation-id'] || `cor_${crypto.randomUUID().replace(/-/g, '')}`;
  }

  // Handle Prisma Errors
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      return sendError(res, {
        code: ERROR_CODES.RESOURCE_CONFLICT,
        message: 'A resource with this unique field already exists.',
        details: { target: err.meta?.target }
      }, HTTP_STATUS.CONFLICT);
    }
    // Other prisma errors can be logged or mapped
  }

  // Log unexpected errors for internal debugging
  if (!err.statusCode || err.statusCode === 500) {
    console.error(`[${res.locals.correlationId}] Unexpected Error:`, err);
  }

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const errorPayload = {
    code: err.code || ERROR_CODES.SERVER_ERROR,
    message: err.message || 'An unexpected error occurred.',
    ...(err.fieldErrors && { fieldErrors: err.fieldErrors }),
    ...(err.details && { details: err.details })
  };

  // Do not expose stack traces in production
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorPayload.stack = err.stack;
  }

  return sendError(res, errorPayload, statusCode);
};
