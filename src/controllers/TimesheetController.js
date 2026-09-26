const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const { resolveCompanyId, getTenantWhere } = require('../middlewares/tenantResolver');

// Get all Timesheets with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const companyId = resolveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendList(res, [], buildPaginationMeta(0, currentPage, pageSize, req.query.sort));
      }
      where.companyId = companyId;
    } else if (req.query.companyId) {
      where.companyId = req.query.companyId;
    }

    if (req.user && req.user.role === 'DRIVER') {
      where.driver = { userId: req.user.id };
    }

    const [data, total] = await Promise.all([
      prisma.timesheet.findMany({
        where, skip, take, orderBy
      }),
      prisma.timesheet.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single Timesheet by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Timesheet not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    if (req.user && req.user.role === 'DRIVER') {
      where.driver = { userId: req.user.id };
    }

    const data = await prisma.timesheet.findFirst({ where });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Timesheet not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new Timesheet
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const companyId = resolveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Company context required to create a timesheet.'
        }, HTTP_STATUS.FORBIDDEN);
      }
      payload.companyId = companyId;
    } else {
      payload.companyId = payload.companyId || companyId;
    }

    if (req.user && req.user.role === 'DRIVER') {
      const driver = await prisma.driver.findFirst({
        where: { userId: req.user.id }
      });
      if (!driver) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Driver profile not found'
        }, HTTP_STATUS.FORBIDDEN);
      }
      payload.driverId = driver.id;
    }

    const data = await prisma.timesheet.create({
      data: payload
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Timesheet with tenant ownership check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.companyId;
    const companyId = resolveCompanyId(req);

    const findWhere = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Timesheet not found' }, HTTP_STATUS.NOT_FOUND);
      }
      findWhere.companyId = companyId;
    }
    if (req.user && req.user.role === 'DRIVER') {
      findWhere.driver = { userId: req.user.id };
    }

    const existing = await prisma.timesheet.findFirst({ where: findWhere });
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Timesheet not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const data = await prisma.timesheet.update({
      where: { id: existing.id },
      data: updateData
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete Timesheet with tenant ownership check
exports.delete = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    const findWhere = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      findWhere.companyId = companyId;
    }
    if (req.user && req.user.role === 'DRIVER') {
      findWhere.driver = { userId: req.user.id };
    }

    const existing = await prisma.timesheet.findFirst({ where: findWhere });
    if (!existing) {
      return res.status(HTTP_STATUS.NO_CONTENT).send();
    }

    await prisma.timesheet.delete({ where: { id: existing.id } });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Timesheet not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
