const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get all TimesheetEvents with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    
    if (req.tenantId) where.timesheet = { companyId: req.tenantId };
    if (req.user && req.user.role === 'DRIVER') {
      where.timesheet = { driver: { userId: req.user.id } };
    }

    const [data, total] = await Promise.all([
      prisma.timesheetEvent.findMany({
        where, skip, take, orderBy
      }),
      prisma.timesheetEvent.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single TimesheetEvent by ID
exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.tenantId) where.timesheet = { companyId: req.tenantId };
    if (req.user && req.user.role === 'DRIVER') {
      where.timesheet = { driver: { userId: req.user.id } };
    }

    const data = await prisma.timesheetEvent.findFirst({ where });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'TimesheetEvent not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new TimesheetEvent
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.user && req.user.role === 'DRIVER') {
      const timesheet = await prisma.timesheet.findFirst({
        where: { id: payload.timesheetId, driver: { userId: req.user.id } }
      });
      if (!timesheet) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Invalid timesheet context for this driver.'
        }, HTTP_STATUS.FORBIDDEN);
      }
    }

    const data = await prisma.timesheetEvent.create({
      data: payload
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update TimesheetEvent with Optimistic Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const where = { id };
    if (req.tenantId) where.timesheet = { companyId: req.tenantId };
    if (req.user && req.user.role === 'DRIVER') {
      where.timesheet = { driver: { userId: req.user.id } };
    }

    // Check version if optimistic concurrency is required
    const ifMatch = req.headers['if-match'];
    if (ifMatch) {
      where.version = parseInt(ifMatch.replace(/"/g, ''), 10);
    }

    try {
      const data = await prisma.timesheetEvent.update({
        where,
        data: updateData
      });
      return sendSuccess(res, data);
    } catch (e) {
      if (e.code === 'P2025') {
        if (ifMatch) {
          return sendError(res, {
            code: ERROR_CODES.RESOURCE_CONFLICT,
            message: 'Resource was updated by another user or does not exist.'
          }, HTTP_STATUS.CONFLICT);
        }
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'TimesheetEvent not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
};

// Delete TimesheetEvent
exports.delete = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.tenantId) where.timesheet = { companyId: req.tenantId };
    if (req.user && req.user.role === 'DRIVER') {
      where.timesheet = { driver: { userId: req.user.id } };
    }

    await prisma.timesheetEvent.delete({ where });
    
    // 204 No Content for successful delete
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'TimesheetEvent not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
