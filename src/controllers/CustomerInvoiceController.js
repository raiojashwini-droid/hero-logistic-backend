const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const { resolveCompanyId } = require('../middlewares/tenantResolver');

const getInvoiceTenantWhere = (req) => {
  const companyId = resolveCompanyId(req) || req.query?.companyId || req.headers?.['x-company-id'];
  if (companyId) {
    return {
      OR: [
        { customer: { companyId } },
        { load: { companyId } }
      ]
    };
  }
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    return {};
  }
  return { id: 'IMPOSSIBLE_INVOICE_ID_NO_ACCESS' };
};

// Get all CustomerInvoices with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    delete where.companyId;
    const tenantWhere = getInvoiceTenantWhere(req);
    const finalWhere = { ...where, ...tenantWhere };

    const [data, total] = await Promise.all([
      prisma.customerInvoice.findMany({
        where: finalWhere, skip, take, orderBy,
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          load: { select: { id: true, loadRef: true } }
        }
      }),
      prisma.customerInvoice.count({ where: finalWhere })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single CustomerInvoice by ID
exports.getById = async (req, res, next) => {
  try {
    const tenantWhere = getInvoiceTenantWhere(req);
    const where = { id: req.params.id, ...tenantWhere };

    const data = await prisma.customerInvoice.findFirst({
      where,
      include: {
        customer: true,
        load: true
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'CustomerInvoice not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new CustomerInvoice
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const companyId = resolveCompanyId(req);

    if (payload.customerId && companyId && req.user?.role !== 'SUPER_ADMIN') {
      const customer = await prisma.customer.findFirst({
        where: { id: payload.customerId, companyId }
      });
      if (!customer) {
        return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Invalid customer for tenant' }, HTTP_STATUS.FORBIDDEN);
      }
    }

    // Sanitize payload for Prisma schema
    if (payload.amount !== undefined) {
      payload.amount = parseFloat(payload.amount) || 0;
    }
    if (payload.dueDate) {
      const d = new Date(payload.dueDate);
      payload.dueDate = isNaN(d.getTime()) ? null : d;
    } else {
      payload.dueDate = null;
    }
    if (payload.status) {
      const s = String(payload.status).toUpperCase();
      if (s === 'PENDING') payload.status = 'SENT';
      else if (['DRAFT', 'SENT', 'PAID', 'OVERDUE'].includes(s)) payload.status = s;
      else payload.status = 'SENT';
    } else {
      payload.status = 'SENT';
    }
    if (!payload.loadId || typeof payload.loadId !== 'string' || payload.loadId.trim() === '') {
      delete payload.loadId;
    }
    delete payload.companyId;

    const data = await prisma.customerInvoice.create({
      data: payload,
      include: { customer: true, load: true }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update CustomerInvoice
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const tenantWhere = getInvoiceTenantWhere(req);
    
    const existing = await prisma.customerInvoice.findFirst({
      where: { id, ...tenantWhere }
    });

    if (!existing) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'CustomerInvoice not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    // Sanitize update data
    if (updateData.amount !== undefined) {
      updateData.amount = parseFloat(updateData.amount) || 0;
    }
    if (updateData.dueDate !== undefined) {
      if (updateData.dueDate) {
        const d = new Date(updateData.dueDate);
        updateData.dueDate = isNaN(d.getTime()) ? null : d;
      } else {
        updateData.dueDate = null;
      }
    }
    if (updateData.status) {
      const s = String(updateData.status).toUpperCase();
      if (s === 'PENDING') updateData.status = 'SENT';
      else if (['DRAFT', 'SENT', 'PAID', 'OVERDUE'].includes(s)) updateData.status = s;
      else updateData.status = 'SENT';
    }
    if (updateData.loadId !== undefined && (!updateData.loadId || updateData.loadId.trim() === '')) {
      delete updateData.loadId;
    }
    delete updateData.companyId;

    const data = await prisma.customerInvoice.update({
      where: { id: existing.id },
      data: updateData,
      include: { customer: true, load: true }
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete CustomerInvoice
exports.delete = async (req, res, next) => {
  try {
    const tenantWhere = getInvoiceTenantWhere(req);
    const existing = await prisma.customerInvoice.findFirst({
      where: { id: req.params.id, ...tenantWhere }
    });

    if (!existing) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'CustomerInvoice not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    await prisma.customerInvoice.delete({ where: { id: existing.id } });
    
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
