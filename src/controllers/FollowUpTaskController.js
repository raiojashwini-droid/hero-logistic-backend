const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get all FollowUpTasks with pagination, sorting, filtering and RBAC scoping
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    
    // RBAC Scoping
    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.OR = [
        { repId: req.user.id },
        { lead: { repId: req.user.id } }
      ];
    } else if (req.query.repId && req.query.repId !== 'ALL') {
      if (req.query.repId === 'unassigned') {
        where.OR = [
          { repId: null },
          { lead: { repId: null } }
        ];
      } else {
        where.OR = [
          { repId: req.query.repId },
          { lead: { repId: req.query.repId } }
        ];
      }
    }

    const [data, total] = await Promise.all([
      prisma.followUpTask.findMany({
        where,
        skip,
        take,
        orderBy: orderBy.length ? orderBy : [{ dueDate: 'asc' }],
        include: {
          lead: {
            select: { id: true, companyName: true, contactName: true, email: true, phone: true, stage: true, repId: true, rep: { select: { id: true, name: true } } }
          },
          rep: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.followUpTask.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single FollowUpTask by ID
exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };

    const data = await prisma.followUpTask.findFirst({
      where,
      include: {
        lead: true,
        rep: { select: { id: true, name: true, email: true } }
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'FollowUpTask not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new FollowUpTask
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (!payload.repId) {
      payload.repId = req.user?.id;
    }

    // Fallback: If repId is not a valid UUID, find a sales user
    let validRep = false;
    if (payload.repId && payload.repId.length === 36) {
      const userExists = await prisma.user.findUnique({
        where: { id: payload.repId }
      });
      if (userExists) validRep = true;
    }

    if (!validRep) {
      const defaultRep = await prisma.user.findFirst({
        where: { role: 'SALES' }
      }) || await prisma.user.findFirst();
      
      if (defaultRep) {
        payload.repId = defaultRep.id;
      }
    }

    // Ensure dueDate is a valid Date
    if (!payload.dueDate) {
      payload.dueDate = new Date();
    } else {
      payload.dueDate = new Date(payload.dueDate);
      if (isNaN(payload.dueDate.getTime())) {
        payload.dueDate = new Date();
      }
    }

    const data = await prisma.followUpTask.create({
      data: payload,
      include: {
        lead: true,
        rep: { select: { id: true, name: true, email: true } }
      }
    });

    if (data.leadId) {
      await prisma.salesActivity.create({
        data: {
          leadId: data.leadId,
          title: `Follow-Up Scheduled (${data.type || 'Task'})`,
          description: `Follow-up task scheduled for ${new Date(data.dueDate).toLocaleDateString()}: ${data.description}`,
          performedById: req.user?.id || data.repId,
          timestamp: new Date()
        }
      });
    }

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update FollowUpTask
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const where = { id };

    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const data = await prisma.followUpTask.update({
      where,
      data: updateData,
      include: {
        lead: true,
        rep: { select: { id: true, name: true, email: true } }
      }
    });

    // If marked completed, log sales activity
    if (updateData.status === 'COMPLETED' && data.leadId) {
      await prisma.salesActivity.create({
        data: {
          leadId: data.leadId,
          title: `Follow-Up Completed (${data.type || 'Task'})`,
          description: `Follow-up action marked complete: ${data.description}`,
          performedById: req.user?.id || data.repId,
          timestamp: new Date()
        }
      });
    }

    return sendSuccess(res, data);
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'FollowUpTask not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

// Delete FollowUpTask
exports.delete = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    await prisma.followUpTask.delete({ where });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'FollowUpTask not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
