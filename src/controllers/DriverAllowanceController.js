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
      prisma.driverAllowance.findMany({ where, skip, take, orderBy: orderBy || { createdAt: 'desc' } }),
      prisma.driverAllowance.count({ where })
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
    const data = await prisma.DriverAllowance.findFirst({ where });
    if (!data) return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Allowance not found' }, HTTP_STATUS.NOT_FOUND);
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { driverId, name, category, type, amount, date, status } = req.body;
    if (!driverId) return sendError(res, { code: 'VALIDATION_ERROR', message: 'driverId is required' }, 400);
    const data = await prisma.driverAllowance.create({
      data: {
        driverId,
        name: name || '',
        category: category || 'Travel & Vehicle',
        type: type || 'Expense Claim',
        amount: amount || '$0.00',
        date: date || new Date().toLocaleDateString('en-GB'),
        status: status || 'Approved'
      }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    try {
      
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };
    if (companyId) {
      where.driver = { companyId };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      where.driver = { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
    }
    const data = await prisma.driverAllowance.update({ where, data: req.body });
      return sendSuccess(res, data);
    } catch (e) {
      if (e.code === 'P2025') return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Allowance not found' }, HTTP_STATUS.NOT_FOUND);
      throw e;
    }
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
    await prisma.driverAllowance.delete({ where });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Allowance not found' }, HTTP_STATUS.NOT_FOUND);
    next(error);
  }
};
