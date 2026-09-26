const { HTTP_STATUS } = require('../config/constants');

/**
 * Sends a successful response for a single resource.
 */
exports.sendSuccess = (res, data, statusCode = HTTP_STATUS.OK) => {
  const meta = {
    correlationId: res.locals?.correlationId || 'cor_unknown'
  };

  return res.status(statusCode).json({
    success: true,
    data,
    meta
  });
};

/**
 * Sends a successful response for a list of resources with pagination.
 */
exports.sendList = (res, data, paginationMeta = {}, statusCode = HTTP_STATUS.OK) => {
  const meta = {
    ...paginationMeta,
    correlationId: res.locals?.correlationId || 'cor_unknown'
  };

  return res.status(statusCode).json({
    success: true,
    data,
    meta
  });
};

/**
 * Sends a standardized error response.
 */
exports.sendError = (res, errorPayload, statusCode = HTTP_STATUS.BAD_REQUEST) => {
  const meta = {
    correlationId: res.locals?.correlationId || 'cor_unknown'
  };

  // errorPayload should be an object containing { code, message, fieldErrors, details }
  return res.status(statusCode).json({
    success: false,
    error: errorPayload,
    meta
  });
};
