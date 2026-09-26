const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const { getTenantWhere, resolveCompanyId } = require('../middlewares/tenantResolver');

// Get all PayPeriods with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const tenantWhere = getTenantWhere(req);
    const finalWhere = { ...where, ...tenantWhere };

    if (req.user?.role === 'DRIVER') {
      const driver = await prisma.driver.findFirst({ where: { userId: req.user.id } });
      if (driver) finalWhere.driverId = driver.id;
      else finalWhere.driverId = 'NON_EXISTENT_DRIVER';
    }

    const [data, total] = await Promise.all([
      prisma.payPeriod.findMany({
        where: finalWhere, skip, take, orderBy,
        include: {
          driver: { select: { id: true, firstName: true, lastName: true, driverCode: true } }
        }
      }),
      prisma.payPeriod.count({ where: finalWhere })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single PayPeriod by ID
exports.getById = async (req, res, next) => {
  try {
    const tenantWhere = getTenantWhere(req);
    const where = { id: req.params.id, ...tenantWhere };

    if (req.user?.role === 'DRIVER') {
      const driver = await prisma.driver.findFirst({ where: { userId: req.user.id } });
      if (driver) where.driverId = driver.id;
    }

    const data = await prisma.payPeriod.findFirst({
      where,
      include: {
        driver: true
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'PayPeriod not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new PayPeriod
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const companyId = resolveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
      }
      payload.companyId = companyId;
    }

    const data = await prisma.payPeriod.create({
      data: payload,
      include: { driver: true }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update PayPeriod
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.companyId; // Prevent mutating companyId

    const tenantWhere = getTenantWhere(req);
    const existing = await prisma.payPeriod.findFirst({
      where: { id, ...tenantWhere }
    });

    if (!existing) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'PayPeriod not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    const data = await prisma.payPeriod.update({
      where: { id: existing.id },
      data: updateData,
      include: { driver: true }
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete PayPeriod
exports.delete = async (req, res, next) => {
  try {
    const tenantWhere = getTenantWhere(req);
    const existing = await prisma.payPeriod.findFirst({
      where: { id: req.params.id, ...tenantWhere }
    });

    if (!existing) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'PayPeriod not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    await prisma.payPeriod.delete({ where: { id: existing.id } });
    
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
