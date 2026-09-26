const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// GET /performance-logs?driverId=xxx
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

    if (req.query.driverId) {
      where.driverId = req.query.driverId;
    }

    const [data, total] = await Promise.all([
      prisma.performanceLog.findMany({
        where, skip, take,
        orderBy: orderBy || { createdAt: 'desc' },
        include: { driver: { select: { id: true, firstName: true, lastName: true } } }
      }),
      prisma.performanceLog.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// GET /performance-logs/:id
exports.getById = async (req, res, next) => {
  try {
    const data = await prisma.performanceLog.findFirst({
      where: { id: req.params.id },
      include: { driver: { select: { id: true, firstName: true, lastName: true } } }
    });

    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Performance log not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// POST /performance-logs
exports.create = async (req, res, next) => {
  try {
    const { driverId, date, assignment, route, score, status, remarks, evaluator } = req.body;

    if (!driverId) {
      return sendError(res, {
        code: ERROR_CODES.VALIDATION_ERROR || 'VALIDATION_ERROR',
        message: 'driverId is required'
      }, HTTP_STATUS.BAD_REQUEST || 400);
    }

    const data = await prisma.performanceLog.create({
      data: {
        driverId,
        date: date || new Date().toISOString().split('T')[0],
        assignment: assignment || '',
        route: route || '',
        score: score || '0/100',
        status: status || 'EXCELLENT',
        remarks: remarks || null,
        evaluator: evaluator || null
      }
    });

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// PUT /performance-logs/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, assignment, route, score, status, remarks, evaluator } = req.body;

    try {
      const data = await prisma.performanceLog.update({
        where: { id },
        data: {
          ...(date !== undefined && { date }),
          ...(assignment !== undefined && { assignment }),
          ...(route !== undefined && { route }),
          ...(score !== undefined && { score }),
          ...(status !== undefined && { status }),
          ...(remarks !== undefined && { remarks }),
          ...(evaluator !== undefined && { evaluator })
        }
      });
      return sendSuccess(res, data);
    } catch (e) {
      if (e.code === 'P2025') {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Performance log not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
};

// DELETE /performance-logs/:id
exports.delete = async (req, res, next) => {
  try {
    
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };
    if (companyId) {
      where.driver = { companyId };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      where.driver = { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
    }
    await prisma.performanceLog.delete({ where });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Performance log not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
