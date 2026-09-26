const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Upload image handler.
 * 
 * WHY base64 in DB instead of disk:
 * Railway (and most PaaS) use ephemeral filesystems — any file saved to disk
 * is permanently deleted on every redeploy. To avoid 404s on uploaded images,
 * we store the base64 data URL directly in the database.
 * The frontend can render data: URLs natively without any extra serving layer.
 */
exports.uploadBase64Image = async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return sendError(res, {
        code: ERROR_CODES.BAD_REQUEST,
        message: 'No image data provided'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    // Validate it's a proper base64 data URL
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return sendError(res, {
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Invalid base64 image string. Must start with data:image/...;base64,...'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    // Return the base64 data URL directly as the "url".
    // This is stored in avatarUrl / photoUrl fields in the DB and
    // renders fine in <img src="data:image/..." /> — no file system needed.
    return sendSuccess(res, { url: image }, HTTP_STATUS.OK);

  } catch (error) {
    next(error);
  }
};
