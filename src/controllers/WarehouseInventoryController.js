const prisma = require('../utils/prismaClient');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { resolveCompanyId } = require('../middlewares/tenantResolver');

exports.getInventory = async (req, res, next) => {
  try {
    const tenantId = resolveCompanyId(req);
    if (!tenantId) {
      return sendSuccess(res, []);
    }

    const tenantFilter = {
      OR: [
        { warehouse: { branch: { companyId: tenantId } } },
        { load: { companyId: tenantId } },
        { customer: { companyId: tenantId } }
      ]
    };

    let inventory = [];
    try {
      inventory = await prisma.loadItem.findMany({
        where: {
          AND: [
            tenantFilter,
            {
              sku: { not: null }
            },
            {
              NOT: [
                { sku: '' },
                { sku: 'N/A' }
              ]
            },
            {
              description: { not: null }
            },
            {
              NOT: [
                { description: '' },
                { description: 'N/A' }
              ]
            }
          ]
        },
        include: {
          warehouse: true
        },
        orderBy: {
          receivedDate: 'desc'
        }
      });
    } catch (dbErr) {
      console.warn('Database query fallback in getInventory:', dbErr.message);
      inventory = [];
    }

    return sendSuccess(res, inventory);
  } catch (error) {
    console.error('Error in getInventory:', error);
    next(error);
  }
};
