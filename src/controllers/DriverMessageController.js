const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const { resolveCompanyId } = require('../middlewares/tenantResolver');
    const companyId = resolveCompanyId(req);
    if (companyId) {
      where.driver = { companyId };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      where.driver = { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
    }
    if (req.query.driverId) where.driverId = req.query.driverId;
    const [data, total] = await Promise.all([
      prisma.driverMessage.findMany({ where, skip, take, orderBy: orderBy || { createdAt: 'desc' } }),
      prisma.driverMessage.count({ where })
    ]);
    return sendList(res, data, buildPaginationMeta(total, currentPage, pageSize));
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    
    const { resolveCompanyId } = require('../middlewares/tenantResolver');
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };
    if (companyId) {
      where.driver = { companyId };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      where.driver = { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
    }
    const data = await prisma.DriverMessage.findFirst({ where });
    if (!data) return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Message not found' }, HTTP_STATUS.NOT_FOUND);
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { driverId, subject, message, sender, status } = req.body;
    if (!driverId || !message) return sendError(res, { code: 'VALIDATION_ERROR', message: 'driverId and message are required' }, 400);
    const data = await prisma.driverMessage.create({
      data: {
        driverId,
        subject: subject || 'Direct Message',
        message,
        sender: sender || 'Fleet Admin User',
        status: status || 'Sent'
      }
    });

    // Automatically log this direct message to DriverActivity audit trail!
    try {
      await prisma.driverActivity.create({
        data: {
          driverId,
          title: `Direct Message Sent: "${subject || 'Notification'}"`,
          category: 'Compliance',
          status: 'Verified',
          description: `Message: "${message}" sent by ${sender || 'Fleet Admin User'}`,
          performedBy: sender || 'Fleet Admin User',
          time: 'Just Now',
          date: new Date().toISOString().split('T')[0]
        }
      });
    } catch (e) {
      console.error('Failed to log message in driver activity:', e);
    }

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };
    if (companyId) {
      where.driver = { companyId };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      where.driver = { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
    }
    await prisma.driverMessage.delete({ where });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Message not found' }, HTTP_STATUS.NOT_FOUND);
    next(error);
  }
};
