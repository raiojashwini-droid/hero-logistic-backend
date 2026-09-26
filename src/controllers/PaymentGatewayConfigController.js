const prisma = require('../utils/prismaClient');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get the gateway config (there should be only one global config)
exports.getConfig = async (req, res, next) => {
  try {
    let config = await prisma.paymentGatewayConfig.findFirst();
    if (!config) {
      config = await prisma.paymentGatewayConfig.create({ data: {} });
    }
    return sendSuccess(res, config);
  } catch (error) {
    next(error);
  }
};

// Update or create the gateway config
exports.updateConfig = async (req, res, next) => {
  try {
    let config = await prisma.paymentGatewayConfig.findFirst();
    
    if (config) {
      config = await prisma.paymentGatewayConfig.update({
        where: { id: config.id },
        data: req.body
      });
    } else {
      config = await prisma.paymentGatewayConfig.create({
        data: req.body
      });
    }

    return sendSuccess(res, config, 'Payment Gateway configuration updated successfully');
  } catch (error) {
    next(error);
  }
};
