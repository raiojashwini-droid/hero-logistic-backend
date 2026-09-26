const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const getEffectiveCompanyId = (req) => {
  return req.tenantId || req.user?.companyId || req.user?.tenantId || null;
};

// Get all Workflow Rules
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
    }

    const [data, total] = await Promise.all([
      prisma.workflowRule.findMany({
        where, skip, take, orderBy: orderBy.length ? orderBy : [{ createdAt: 'desc' }],
        include: {
          company: { select: { name: true } }
        }
      }),
      prisma.workflowRule.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single Workflow Rule by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Workflow rule not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    const data = await prisma.workflowRule.findFirst({ where });

    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Workflow rule not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new Workflow Rule
exports.create = async (req, res, next) => {
  try {
    const { name, desc, description, category, trigger, action, status, createdBy } = req.body;
    const companyId = getEffectiveCompanyId(req);

    if (!name) {
      return sendError(res, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Rule name is required'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
    }

    const targetCompanyId = companyId || req.body.companyId;

    const data = await prisma.workflowRule.create({
      data: {
        name: name.trim(),
        description: desc || description || 'Automated workflow rule',
        category: category || 'Invoice Automation',
        trigger: trigger || 'Load Status: Delivered',
        action: action || 'Create Invoice & Notify Accounts',
        status: status || 'Active',
        createdBy: createdBy || req.user?.name || 'Staff',
        ...(targetCompanyId && { companyId: targetCompanyId })
      }
    });

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Workflow Rule
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, desc, description, category, trigger, action, status } = req.body;
    const companyId = getEffectiveCompanyId(req);
    const where = { id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Workflow rule not found' }, HTTP_STATUS.NOT_FOUND);
      where.companyId = companyId;
    }

    const existing = await prisma.workflowRule.findFirst({ where });
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Workflow rule not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (desc !== undefined || description !== undefined) {
      updateData.description = desc || description;
    }
    if (category !== undefined) updateData.category = category;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (action !== undefined) updateData.action = action;
    if (status !== undefined) updateData.status = status;

    const data = await prisma.workflowRule.update({
      where: { id: existing.id },
      data: updateData
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete Workflow Rule
exports.delete = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      where.companyId = companyId;
    }

    const existing = await prisma.workflowRule.findFirst({ where });
    if (existing) {
      await prisma.workflowRule.delete({ where: { id: existing.id } });
    }

    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
};
