const prisma = require('../utils/prismaClient');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

exports.getInventory = async (req, res, next) => {
  try {
    const tenantId = req.user?.companyId || req.user?.tenantId || req.tenantId;
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return sendSuccess(res, []);
    }

    const tenantFilter = tenantId ? {
      OR: [
        { warehouse: { branch: { companyId: tenantId } } },
        { load: { companyId: tenantId } },
        { customer: { companyId: tenantId } }
      ]
    } : {};

    let inventory = [];
    try {
      inventory = await prisma.loadItem.findMany({
        where: {
          AND: [
            tenantFilter,
            {
              OR: [
                { warehouseId: { not: null } },
                { sku: { not: null } },
                { stockRef: { not: null } }
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
