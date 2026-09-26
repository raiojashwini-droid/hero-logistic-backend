const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const { resolveCompanyId, getTenantWhere } = require('../middlewares/tenantResolver');

// Get all Assets with pagination, sorting and filtering
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

    const [data, total] = await Promise.all([
      prisma.asset.findMany({
        where, skip, take, orderBy,
        include: {
          branch: true,
          assignments: { take: 5, orderBy: { startDate: 'desc' } },
          maintenance: { take: 5, orderBy: { createdAt: 'desc' } }
        }
      }),
      prisma.asset.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single Asset by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Asset not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    const data = await prisma.asset.findFirst({
      where,
      include: {
        branch: true,
        assignments: true,
        maintenance: true
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Asset not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new Asset
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const companyId = resolveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Company context is required to create an asset.'
        }, HTTP_STATUS.FORBIDDEN);
      }
      payload.companyId = companyId;
    } else {
      payload.companyId = payload.companyId || companyId;
    }

    const data = await prisma.asset.create({
      data: payload,
      include: {
        branch: true
      }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Asset with tenant ownership check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.companyId; // Prevent mutation of companyId
    const companyId = resolveCompanyId(req);

    const findWhere = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Asset not found' }, HTTP_STATUS.NOT_FOUND);
      }
      findWhere.companyId = companyId;
    }

    const existing = await prisma.asset.findFirst({ where: findWhere });
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Asset not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const data = await prisma.asset.update({
      where: { id: existing.id },
      data: updateData
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete Asset with tenant ownership check
exports.delete = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    const findWhere = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      findWhere.companyId = companyId;
    }

    const existing = await prisma.asset.findFirst({ where: findWhere });
    if (!existing) {
      return res.status(HTTP_STATUS.NO_CONTENT).send();
    }

    await prisma.asset.delete({ where: { id: existing.id } });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Asset not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
