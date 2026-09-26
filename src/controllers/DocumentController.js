const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { resolveCompanyId } = require('../middlewares/tenantResolver');

// Get all Documents with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const companyId = resolveCompanyId(req);

    // Remove direct companyId scalar filter because Document table does not have companyId column directly
    delete where.companyId;

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendList(res, [], buildPaginationMeta(0, currentPage, pageSize, req.query.sort));
      }
      
      const tenantCondition = {
        OR: [
          { driver: { companyId } },
          { vehicle: { companyId } },
          { asset: { companyId } },
          { load: { companyId } },
          { warehouse: { companyId } }
        ]
      };

      if (!where.AND) {
        where.AND = [tenantCondition];
      } else if (Array.isArray(where.AND)) {
        where.AND.push(tenantCondition);
      } else {
        where.AND = [where.AND, tenantCondition];
      }
    }

    if (req.query.driverId) {
      where.driverId = req.query.driverId;
    }
    if (req.query.vehicleId) {
      where.vehicleId = req.query.vehicleId;
    }
    if (req.query.assetId) {
      where.assetId = req.query.assetId;
    }
    if (req.query.loadId) {
      where.loadId = req.query.loadId;
    }
    if (req.query.warehouseId) {
      where.warehouseId = req.query.warehouseId;
    }

    if (req.user && req.user.role === 'DRIVER') {
      where.driver = { userId: req.user.id };
    }

    const [data, total] = await Promise.all([
      prisma.document.findMany({
        where, skip, take, orderBy,
        include: { driver: true, vehicle: true, asset: true, load: true, warehouse: true }
      }),
      prisma.document.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single Document by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Document not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.AND = [
        {
          OR: [
            { driver: { companyId } },
            { vehicle: { companyId } },
            { asset: { companyId } },
            { load: { companyId } },
            { warehouse: { companyId } }
          ]
        }
      ];
    }

    if (req.user && req.user.role === 'DRIVER') {
      where.driver = { userId: req.user.id };
    }

    const data = await prisma.document.findFirst({
      where,
      include: { driver: true, vehicle: true, asset: true, load: true, warehouse: true }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Document not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new Document
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    delete payload.companyId; // Remove companyId scalar property not present in Document schema

    const data = await prisma.document.create({
      data: payload,
      include: { driver: true, vehicle: true, asset: true, load: true, warehouse: true }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Document with tenant ownership check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.companyId;
    const companyId = resolveCompanyId(req);

    const findWhere = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Document not found' }, HTTP_STATUS.NOT_FOUND);
      }
      findWhere.AND = [
        {
          OR: [
            { driver: { companyId } },
            { vehicle: { companyId } },
            { asset: { companyId } },
            { load: { companyId } },
            { warehouse: { companyId } }
          ]
        }
      ];
    }

    const existing = await prisma.document.findFirst({ where: findWhere });
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Document not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const data = await prisma.document.update({
      where: { id: existing.id },
      data: updateData,
      include: { driver: true, vehicle: true, asset: true, load: true, warehouse: true }
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete Document with tenant ownership check
exports.delete = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    const findWhere = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      findWhere.AND = [
        {
          OR: [
            { driver: { companyId } },
            { vehicle: { companyId } },
            { asset: { companyId } },
            { load: { companyId } },
            { warehouse: { companyId } }
          ]
        }
      ];
    }

    const existing = await prisma.document.findFirst({ where: findWhere });
    if (!existing) {
      return res.status(HTTP_STATUS.NO_CONTENT).send();
    }

    await prisma.document.delete({ where: { id: existing.id } });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Document not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
