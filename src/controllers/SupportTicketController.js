const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const getEffectiveCompanyId = (req) => {
  return req.tenantId || req.user?.companyId || req.user?.tenantId || null;
};

// Get all SupportTickets with pagination, sorting and filtering
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
      prisma.supportTicket.findMany({
        where, skip, take, orderBy,
        include: {
          assignedAgent: true,
          company: true,
          replies: { take: 5, orderBy: { createdAt: 'asc' } }
        }
      }),
      prisma.supportTicket.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single SupportTicket by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'SupportTicket not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    const data = await prisma.supportTicket.findFirst({
      where,
      include: {
        assignedAgent: true,
        company: true,
        replies: { include: { author: true }, orderBy: { createdAt: 'asc' } }
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'SupportTicket not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new SupportTicket
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const companyId = getEffectiveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
      }
      payload.companyId = companyId;
    } else {
      payload.companyId = payload.companyId || companyId;
    }

    if (payload.description) {
      payload.message = payload.description;
      delete payload.description;
    }

    const data = await prisma.supportTicket.create({
      data: payload,
      include: {
        assignedAgent: true,
        company: true
      }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update SupportTicket
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const companyId = getEffectiveCompanyId(req);
    const where = { id };
    
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'SupportTicket not found' }, HTTP_STATUS.NOT_FOUND);
      where.companyId = companyId;
    }

    const existing = await prisma.supportTicket.findFirst({ where });
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'SupportTicket not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const data = await prisma.supportTicket.update({
      where: { id: existing.id },
      data: updateData
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete SupportTicket
exports.delete = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      where.companyId = companyId;
    }

    const existing = await prisma.supportTicket.findFirst({ where });
    if (existing) {
      await prisma.supportTicket.delete({ where: { id: existing.id } });
    }
    
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
};

// Add reply to SupportTicket
exports.addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, text } = req.body;
    const replyText = message || text;
    const companyId = getEffectiveCompanyId(req);

    if (!replyText) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Message text is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const where = { id };
    if (req.user?.role !== 'SUPER_ADMIN' && companyId) {
      where.companyId = companyId;
    }

    const ticket = await prisma.supportTicket.findFirst({ where });
    if (!ticket) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'SupportTicket not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'User context required to reply' }, HTTP_STATUS.UNAUTHORIZED);
    }

    const reply = await prisma.ticketReply.create({
      data: {
        message: replyText,
        ticketId: ticket.id,
        authorId: userId
      },
      include: { author: { select: { id: true, name: true, email: true, role: true } } }
    });

    return sendSuccess(res, reply, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};
