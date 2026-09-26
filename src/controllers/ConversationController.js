const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const { resolveCompanyId } = require('../middlewares/tenantResolver');

// Get all Conversations with pagination, sorting and filtering
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
      prisma.conversation.findMany({
        where, skip, take, orderBy,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' }
          },
          participants: {
            include: { user: true }
          }
        }
      }),
      prisma.conversation.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Single dedicated endpoint for Communication Depot / Messages menu
exports.getDepotComms = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    // No fallback to first company — that would be a cross-tenant data breach
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendSuccess(res, { conversations: [], drivers: [], users: [], customers: [] });
    }

    const companyWhere = companyId ? { companyId } : {};

    let dbConvs = await prisma.conversation.findMany({
      where: companyWhere,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        participants: {
          include: { user: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    }).catch(() => []);

    // Seed initial DB conversations if DB has 0 records
    if (dbConvs.length === 0 && companyId) {
      let defaultUser = await prisma.user.findFirst({ where: { companyId } });
      // NOTE: No cross-tenant fallback — if no user found for this company, skip seeding
      if (!defaultUser) {
        // Do not fall back to a user from another company
        defaultUser = null;
      }

      if (defaultUser) {
        const c1 = await prisma.conversation.create({
          data: {
            title: 'customer@hero.com',
            type: 'DIRECT',
            companyId,
            messages: {
              create: [
                {
                  senderId: defaultUser.id,
                  content: '[ASDF] aqwsedrf 📍 Attached Location: Melbourne Depot Hub (Lat: -37.8136, Lng: 144.9631) 📎 Attachment: VID20260726121045.mp4'
                }
              ]
            }
          }
        }).catch(() => null);

        const c2 = await prisma.conversation.create({
          data: {
            title: 'Shavneel Prasad (Driver - ANSH 2)',
            type: 'DIRECT',
            companyId,
            messages: {
              create: [
                {
                  senderId: defaultUser.id,
                  content: 'asdfghj'
                }
              ]
            }
          }
        }).catch(() => null);

        const c3 = await prisma.conversation.create({
          data: {
            title: 'David Miller',
            type: 'DIRECT',
            companyId,
            messages: {
              create: [
                {
                  senderId: defaultUser.id,
                  content: 'waiting'
                },
                {
                  senderId: defaultUser.id,
                  content: 'hyyy'
                }
              ]
            }
          }
        }).catch(() => null);

        const c4 = await prisma.conversation.create({
          data: {
            title: 'Melbourne Yard Operations',
            type: 'GROUP',
            companyId,
            messages: {
              create: [
                {
                  senderId: defaultUser.id,
                  content: 'Shift handover complete for Bay 4.'
                }
              ]
            }
          }
        }).catch(() => null);

        dbConvs = await prisma.conversation.findMany({
          where: companyWhere,
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
            participants: { include: { user: true } }
          },
          orderBy: { updatedAt: 'desc' }
        }).catch(() => []);
      }
    }

    const [dbDrivers, dbUsers, dbCustomers] = await Promise.all([
      prisma.driver.findMany({
        where: companyWhere,
        select: { id: true, firstName: true, lastName: true, driverCode: true, phone: true, email: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []),
      prisma.user.findMany({
        where: companyWhere,
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []),
      prisma.customer.findMany({
        where: companyWhere,
        select: { id: true, name: true, contactName: true, email: true, phone: true },
        orderBy: { name: 'asc' }
      }).catch(() => [])
    ]);

    const formattedConvs = dbConvs.map((conv, idx) => {
      const convName = conv.title || (conv.participants?.[0]?.user?.name) || `Conversation-${idx + 1}`;
      const lastMsg = conv.messages[conv.messages.length - 1];

      return {
        id: conv.id,
        name: convName,
        type: conv.type === 'GROUP' ? 'group' : 'individual',
        status: 'Active',
        statusColor: 'emerald',
        loadId: conv.loadId || 'N/A',
        time: conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        unreadCount: 0,
        messages: (conv.messages || []).map(m => ({
          id: m.id,
          senderId: m.senderId,
          text: m.content,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: m.senderId === req.user?.id ? 'outgoing' : 'incoming',
          dateGroup: new Date(m.createdAt).toLocaleDateString()
        })),
        driverInfo: {
          mobile: conv.participants?.[0]?.user?.phone || null,
          email: conv.participants?.[0]?.user?.email || null,
          empId: conv.participants?.[0]?.user?.id || null,
          license: null
        }
      };
    });

    return sendSuccess(res, {
      conversations: formattedConvs,
      drivers: dbDrivers,
      users: dbUsers,
      customers: dbCustomers
    });
  } catch (error) {
    next(error);
  }
};

// Get single Conversation by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    const data = await prisma.conversation.findFirst({ where });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Conversation not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new Conversation
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const companyId = resolveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required.' }, HTTP_STATUS.FORBIDDEN);
      }
      payload.companyId = companyId;
    } else {
      payload.companyId = payload.companyId || companyId;
    }

    const data = await prisma.conversation.create({
      data: payload
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Conversation with Optimistic Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.companyId; // Prevent companyId mutation
    const companyId = resolveCompanyId(req);

    // Verify ownership before updating
    const findWhere = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' }, HTTP_STATUS.NOT_FOUND);
      }
      findWhere.companyId = companyId;
    }

    const existing = await prisma.conversation.findFirst({ where: findWhere });
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const data = await prisma.conversation.update({
      where: { id: existing.id },
      data: updateData
    });
    return sendSuccess(res, data);
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Conversation not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

// Delete Conversation
exports.delete = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    const findWhere = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      findWhere.companyId = companyId;
    }

    const existing = await prisma.conversation.findFirst({ where: findWhere });
    if (!existing) return res.status(HTTP_STATUS.NO_CONTENT).send();

    await prisma.conversation.delete({ where: { id: existing.id } });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Conversation not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
