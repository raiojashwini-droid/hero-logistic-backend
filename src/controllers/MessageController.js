const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get all Messages with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    
    // Optional: Inject tenant scope here if applicable
    // if (req.tenantId) where.tenantId = req.tenantId;

    const [data, total] = await Promise.all([
      prisma.message.findMany({
        where, skip, take, orderBy
      }),
      prisma.message.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single Message by ID
exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    const data = await prisma.message.findFirst({ where });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Message not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new Message
exports.create = async (req, res, next) => {
  try {
    const { 
      recipient, 
      recipientName, 
      to, 
      subject, 
      content, 
      message, 
      priority, 
      conversationId, 
      senderId,
      loadId,
      attachmentUrl 
    } = req.body;

    const rawContent = content || message || (subject ? `[${subject}]` : 'No content');
    const recipientTitle = recipient || recipientName || to || 'General Communication';

    // 1. Resolve effective companyId
    let effectiveCompanyId = req.tenantId || req.user?.companyId || req.user?.tenantId;
    if (!effectiveCompanyId) {
      const firstCompany = await prisma.company.findFirst({ select: { id: true } });
      if (firstCompany) {
        effectiveCompanyId = firstCompany.id;
      }
    }

    // 2. Resolve effective conversationId
    let effectiveConvId = conversationId;
    if (!effectiveConvId) {
      let existingConv = await prisma.conversation.findFirst({
        where: { title: recipientTitle }
      });
      if (!existingConv) {
        existingConv = await prisma.conversation.create({
          data: {
            title: recipientTitle,
            type: 'DIRECT',
            companyId: effectiveCompanyId
          }
        });
      }
      effectiveConvId = existingConv.id;
    }

    // 2. Resolve effective senderId (User relation)
    let effectiveSenderId = senderId || req.user?.id;
    if (!effectiveSenderId) {
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      if (firstUser) {
        effectiveSenderId = firstUser.id;
      }
    }

    if (!effectiveSenderId) {
      const defaultUser = await prisma.user.create({
        data: {
          email: `dispatcher_${Date.now()}@herologistics.com.au`,
          passwordHash: '$2b$10$w82J...placeholder',
          firstName: 'System',
          lastName: 'Dispatcher',
          role: 'DISPATCHER'
        }
      });
      effectiveSenderId = defaultUser.id;
    }

    const messageData = {
      content: subject && !rawContent.startsWith('[') ? `[${subject.toUpperCase()}] ${rawContent}` : rawContent,
      conversationId: effectiveConvId,
      senderId: effectiveSenderId,
      ...(loadId && { loadId }),
      ...(attachmentUrl && { attachmentUrl })
    };

    const data = await prisma.message.create({
      data: messageData
    });

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Error creating message:', error);
    next(error);
  }
};

// Update Message with Optimistic Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const where = { id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    // Check version if optimistic concurrency is required
    const ifMatch = req.headers['if-match'];
    if (ifMatch) {
      where.version = parseInt(ifMatch.replace(/"/g, ''), 10);
    }

    try {
      const data = await prisma.message.update({
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
          message: 'Message not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
};

// Delete Message
exports.delete = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    await prisma.message.delete({ where });
    
    // 204 No Content for successful delete
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Message not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
