const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { sendError } = require('../utils/apiResponse');

// In memory store for demonstration. In production, use Redis!
const idempotencyStore = new Map();

/**
 * Ensures critical POST requests contain an Idempotency-Key header 
 * and prevents duplicate execution.
 */
exports.requireIdempotency = (req, res, next) => {
  const key = req.headers['idempotency-key'];

  if (!key) {
    return sendError(res, {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Idempotency-Key header is required for this operation.'
    }, HTTP_STATUS.BAD_REQUEST);
  }

  // Check if we already processed this request
  if (idempotencyStore.has(key)) {
    const previousResponse = idempotencyStore.get(key);
    // Return the cached response
    return res.status(previousResponse.statusCode).json(previousResponse.body);
  }

  // Intercept the response to save it once completed
  const originalJson = res.json;
  res.json = function(body) {
    // Save to store (ideally with a TTL in Redis, e.g. 24 hours)
    idempotencyStore.set(key, {
      statusCode: res.statusCode,
      body
    });
    return originalJson.call(this, body);
  };

  next();
};
