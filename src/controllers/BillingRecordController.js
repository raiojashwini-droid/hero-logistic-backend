const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const { getTenantWhere, resolveCompanyId } = require('../middlewares/tenantResolver');

// Get all BillingRecords with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const tenantWhere = getTenantWhere(req);
    const finalWhere = { ...where, ...tenantWhere };

    const [data, total] = await Promise.all([
      prisma.billingRecord.findMany({
        where: finalWhere, skip, take, orderBy,
        include: { company: true }
      }),
      prisma.billingRecord.count({ where: finalWhere })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single BillingRecord by ID
exports.getById = async (req, res, next) => {
  try {
    const tenantWhere = getTenantWhere(req);
    const where = { id: req.params.id, ...tenantWhere };

    const data = await prisma.billingRecord.findFirst({
      where,
      include: { company: true }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'BillingRecord not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new BillingRecord
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

    const data = await prisma.billingRecord.create({
      data: payload,
      include: { company: true }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update BillingRecord
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.companyId;

    const tenantWhere = getTenantWhere(req);
    const existing = await prisma.billingRecord.findFirst({
      where: { id, ...tenantWhere }
    });

    if (!existing) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'BillingRecord not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    const data = await prisma.billingRecord.update({
      where: { id: existing.id },
      data: updateData,
      include: { company: true }
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete BillingRecord
exports.delete = async (req, res, next) => {
  try {
    const tenantWhere = getTenantWhere(req);
    const existing = await prisma.billingRecord.findFirst({
      where: { id: req.params.id, ...tenantWhere }
    });

    if (!existing) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'BillingRecord not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    await prisma.billingRecord.delete({ where: { id: existing.id } });
    
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
