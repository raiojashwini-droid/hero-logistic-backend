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
      prisma.driverPayRate.findMany({ where, skip, take, orderBy: orderBy || { createdAt: 'desc' } }),
      prisma.driverPayRate.count({ where })
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
    const data = await prisma.DriverPayRate.findFirst({ where });
    if (!data) return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Pay rate not found' }, HTTP_STATUS.NOT_FOUND);
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { driverId, category, type, rate, rule, status } = req.body;
    if (!driverId) return sendError(res, { code: 'VALIDATION_ERROR', message: 'driverId is required' }, 400);
    const data = await prisma.driverPayRate.create({
      data: {
        driverId,
        category: category || 'Base Rate',
        type: type || 'Daily',
        rate: rate || '$0.00 / day',
        rule: rule || 'Standard',
        status: status || 'Active'
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
    const data = await prisma.driverPayRate.update({ where, data: req.body });
      return sendSuccess(res, data);
    } catch (e) {
      if (e.code === 'P2025') return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Pay rate not found' }, HTTP_STATUS.NOT_FOUND);
      throw e;
    }
  } catch (error) { next(error); }
};

// Bulk upsert — save all pay rates for a driver at once
exports.bulkUpsert = async (req, res, next) => {
  try {
    const { driverId, rates } = req.body;
    if (!driverId || !Array.isArray(rates)) return sendError(res, { code: 'VALIDATION_ERROR', message: 'driverId and rates[] required' }, 400);
    // Delete old rates for this driver and recreate
    await prisma.driverPayRate.deleteMany({ where: { driverId } });
    const created = await prisma.driverPayRate.createMany({
      data: rates.map(r => ({ driverId, category: r.category, type: r.type, rate: r.rate, rule: r.rule || 'Standard', status: r.status || 'Active' }))
    });
    return sendSuccess(res, { count: created.count, message: 'Pay rates saved successfully' });
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
    await prisma.driverPayRate.delete({ where });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Pay rate not found' }, HTTP_STATUS.NOT_FOUND);
    next(error);
  }
};
