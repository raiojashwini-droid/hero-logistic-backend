const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const { resolveCompanyId, getTenantWhere } = require('../middlewares/tenantResolver');

const getEffectiveCompanyId = (req) => {
  return resolveCompanyId(req);
};

// Get all Branches with pagination, sorting and filtering — scoped by tenant
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const companyId = getEffectiveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendList(res, [], buildPaginationMeta(0, currentPage, pageSize, req.query.sort));
      }
      where.companyId = companyId;
    } else if (req.query.companyId) {
      where.companyId = req.query.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    } else {
      return sendList(res, [], buildPaginationMeta(0, currentPage, pageSize, req.query.sort));
    }

    const [data, total] = await Promise.all([
      prisma.branch.findMany({
        where, skip, take, orderBy,
        include: {
          _count: {
            select: { drivers: true, warehouses: true, assets: true, users: true, loads: true }
          }
        }
      }),
      prisma.branch.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single Branch by ID — scoped by tenant
exports.getById = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Branch not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    const data = await prisma.branch.findFirst({
      where,
      include: {
        drivers: true,
        warehouses: true,
        assets: true,
        users: { select: { id: true, name: true, email: true, role: true, status: true } },
        _count: { select: { loads: true, vehicles: true } }
      }
    });

    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Branch not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new Branch — always scoped to tenant
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const companyId = getEffectiveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Company context is required to create a branch.'
        }, HTTP_STATUS.FORBIDDEN);
      }
      payload.companyId = companyId;
    } else {
      payload.companyId = payload.companyId || companyId;
    }

    const data = await prisma.branch.create({
      data: {
        name: payload.name || payload.branchName || 'New Branch',
        location: payload.location || payload.address || payload.state || null,
        companyId: payload.companyId
      }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Branch — with tenant ownership check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location, branchName, address, state } = req.body;
    const companyId = getEffectiveCompanyId(req);

    const whereCheck = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Branch not found' }, HTTP_STATUS.NOT_FOUND);
      }
      whereCheck.companyId = companyId;
    }

    const existing = await prisma.branch.findFirst({ where: whereCheck });
    if (!existing) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Branch not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    const data = await prisma.branch.update({
      where: { id: existing.id },
      data: {
        name: name || branchName || undefined,
        location: location || address || state || undefined
      }
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete Branch — with safe cleanup of all linked resources and permanent deletion
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = getEffectiveCompanyId(req);
    const whereCheck = { id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      whereCheck.companyId = companyId;
    }

    const existing = await prisma.branch.findFirst({ where: whereCheck });
    if (!existing) {
      return res.status(HTTP_STATUS.NO_CONTENT).send();
    }

    try {
      await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=0;`).catch(() => {});
      const warehouses = await prisma.warehouse.findMany({ where: { branchId: existing.id }, select: { id: true } });
      const wIds = warehouses.map(w => w.id);

      if (wIds.length > 0) {
        await prisma.warehouse.deleteMany({ where: { id: { in: wIds } } });
      }
      await prisma.asset.deleteMany({ where: { branchId: existing.id } });
      await prisma.driver.updateMany({ where: { branchId: existing.id }, data: { branchId: null } });
      await prisma.user.updateMany({ where: { branchId: existing.id }, data: { branchId: null } });
      await prisma.vehicle.updateMany({ where: { branchId: existing.id }, data: { branchId: null } });
      await prisma.customer.updateMany({ where: { branchId: existing.id }, data: { branchId: null } });
      await prisma.load.updateMany({ where: { branchId: existing.id }, data: { branchId: null } });

      await prisma.branch.deleteMany({ where: { id: existing.id } });
    } finally {
      await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=1;`).catch(() => {});
    }

    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=1;`).catch(() => {});
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
};
