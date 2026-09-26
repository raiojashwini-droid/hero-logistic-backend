const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const { resolveCompanyId } = require('../middlewares/tenantResolver');

const getExpenseTenantWhere = (req) => {
  const companyId = resolveCompanyId(req);
  if (companyId) {
    return {
      OR: [
        { companyId },
        { load: { companyId } }
      ]
    };
  }
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    return {};
  }
  return { id: 'IMPOSSIBLE_EXPENSE_ID_NO_ACCESS' };
};

// Get all LoadExpenses with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const tenantWhere = getExpenseTenantWhere(req);
    const finalWhere = { ...where, ...tenantWhere };

    if (req.user && req.user.role === 'DRIVER') {
      finalWhere.load = { driver: { userId: req.user.id } };
    }

    const [data, total] = await Promise.all([
      prisma.loadExpense.findMany({
        where: finalWhere, skip, take, orderBy
      }),
      prisma.loadExpense.count({ where: finalWhere })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single LoadExpense by ID
exports.getById = async (req, res, next) => {
  try {
    const tenantWhere = getExpenseTenantWhere(req);
    const where = { id: req.params.id, ...tenantWhere };

    if (req.user && req.user.role === 'DRIVER') {
      where.load = { driver: { userId: req.user.id } };
    }

    const data = await prisma.loadExpense.findFirst({ where });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'LoadExpense not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new LoadExpense
exports.create = async (req, res, next) => {
  try {
    const { loadId, date, type, description, amount, status, vendorName, litres, pricePerLitre, odometer, receiptUrl, vehicleId, driverId } = req.body;

    let companyId = req.tenantId || req.user?.companyId;
    if (!companyId && req.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { companyId: true }
      });
      companyId = user?.companyId;
    }

    if (!companyId) {
      return sendError(res, {
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Company context is required to create an expense.'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    if (loadId && req.user && req.user.role === 'DRIVER') {
      const assignedLoad = await prisma.load.findFirst({
        where: { id: loadId, driver: { userId: req.user.id } }
      });
      if (!assignedLoad) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'You are not assigned to this load.'
        }, HTTP_STATUS.FORBIDDEN);
      }
    }

    const data = await prisma.loadExpense.create({
      data: {
        companyId,
        loadId: loadId || null,
        date: date ? new Date(date) : new Date(),
        type: type || 'Fuel',
        description: description || '',
        amount: parseFloat(amount || 0),
        status: (req.user && req.user.role === 'DRIVER') ? 'PENDING' : (status || 'PENDING'),
        vendorName: vendorName || null,
        litres: litres ? parseFloat(litres) : null,
        pricePerLitre: pricePerLitre ? parseFloat(pricePerLitre) : null,
        odometer: odometer ? parseInt(odometer, 10) : null,
        receiptUrl: receiptUrl || null,
        vehicleId: vehicleId || null,
        driverId: driverId || null
      }
    });

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update LoadExpense with Optimistic Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const where = { id };
    if (req.tenantId) {
      where.OR = [
        { companyId: req.tenantId },
        { load: { companyId: req.tenantId } }
      ];
    }
    if (req.user && req.user.role === 'DRIVER') {
      const existing = await prisma.loadExpense.findFirst({
        where: { id, load: { driver: { userId: req.user.id } } }
      });
      if (!existing) {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'LoadExpense not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      if (existing.status !== 'PENDING') {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Approved or rejected expenses cannot be modified.'
        }, HTTP_STATUS.FORBIDDEN);
      }
      where.load = { driver: { userId: req.user.id } };
      delete updateData.status; // Prevent modifying status
    }

    // Check version if optimistic concurrency is required
    const ifMatch = req.headers['if-match'];
    if (ifMatch) {
      where.version = parseInt(ifMatch.replace(/"/g, ''), 10);
    }

    try {
      const data = await prisma.loadExpense.update({
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
          message: 'LoadExpense not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
};

// Delete LoadExpense
exports.delete = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.tenantId) {
      where.OR = [
        { companyId: req.tenantId },
        { load: { companyId: req.tenantId } }
      ];
    }
    if (req.user && req.user.role === 'DRIVER') {
      const existing = await prisma.loadExpense.findFirst({
        where: { id: req.params.id, load: { driver: { userId: req.user.id } } }
      });
      if (!existing) {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'LoadExpense not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      if (existing.status !== 'PENDING') {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Approved or rejected expenses cannot be deleted.'
        }, HTTP_STATUS.FORBIDDEN);
      }
      where.load = { driver: { userId: req.user.id } };
    }

    await prisma.loadExpense.delete({ where });
    
    // 204 No Content for successful delete
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'LoadExpense not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
