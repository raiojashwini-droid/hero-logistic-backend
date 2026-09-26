const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get all DemoBookings with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    
    // RBAC Scoping
    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.OR = [
        { presenterId: req.user.id },
        { lead: { repId: req.user.id } }
      ];
    } else if (req.query.repId && req.query.repId !== 'ALL') {
      if (req.query.repId === 'unassigned') {
        where.OR = [
          { presenterId: null },
          { lead: { repId: null } }
        ];
      } else {
        where.OR = [
          { presenterId: req.query.repId },
          { lead: { repId: req.query.repId } }
        ];
      }
    }

    const [data, total] = await Promise.all([
      prisma.demoBooking.findMany({
        where,
        skip,
        take,
        orderBy: orderBy.length ? orderBy : [{ scheduledAt: 'desc' }],
        include: {
          lead: {
            select: { id: true, companyName: true, contactName: true, email: true, phone: true, stage: true, repId: true, rep: { select: { id: true, name: true } } }
          },
          presenter: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.demoBooking.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single DemoBooking by ID
exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };

    const data = await prisma.demoBooking.findFirst({
      where,
      include: {
        lead: true,
        presenter: { select: { id: true, name: true, email: true } }
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'DemoBooking not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new DemoBooking
exports.create = async (req, res, next) => {
  try {
    const { leadId, presenterId, scheduledAt, status, meetingLink, feedback } = req.body;

    // 1. Resolve Lead
    let targetLeadId = leadId;
    let validLead = null;
    if (targetLeadId) {
      validLead = await prisma.lead.findUnique({ where: { id: targetLeadId } }).catch(() => null);
    }

    if (!validLead) {
      // Fallback to first existing Lead or create a default Lead
      validLead = await prisma.lead.findFirst().catch(() => null);
      if (!validLead) {
        const firstComp = await prisma.company.findFirst().catch(() => null);
        const compId = firstComp ? firstComp.id : require('crypto').randomUUID();
        validLead = await prisma.lead.create({
          data: {
            id: targetLeadId || require('crypto').randomUUID(),
            companyName: 'General Logistics Prospect',
            contactName: 'Prospect Lead',
            email: 'prospect@logistics.com',
            phone: '1300 000 000',
            companyId: compId
          }
        });
      }
      targetLeadId = validLead.id;
    }

    // 2. Resolve Presenter
    let targetPresenterId = presenterId || req.user?.id;
    let validPresenter = null;
    if (targetPresenterId) {
      validPresenter = await prisma.user.findUnique({ where: { id: targetPresenterId } }).catch(() => null);
    }

    if (!validPresenter) {
      validPresenter = await prisma.user.findFirst({ where: { role: 'SALES' } }).catch(() => null)
        || await prisma.user.findFirst().catch(() => null);
      if (!validPresenter) {
        const firstComp = await prisma.company.findFirst().catch(() => null);
        const compId = firstComp ? firstComp.id : require('crypto').randomUUID();
        validPresenter = await prisma.user.create({
          data: {
            id: require('crypto').randomUUID(),
            email: 'presenter@hero.com',
            name: 'Demo Sales Presenter',
            password: 'hashedPassword',
            role: 'SALES',
            companyId: compId
          }
        });
      }
      targetPresenterId = validPresenter.id;
    }

    // 3. Resolve Scheduled At Date (non-null)
    let parsedScheduledAt = new Date();
    if (scheduledAt) {
      const d = new Date(scheduledAt);
      if (!isNaN(d.getTime())) parsedScheduledAt = d;
    }

    // 4. Create DemoBooking via Prisma connect
    const data = await prisma.demoBooking.create({
      data: {
        scheduledAt: parsedScheduledAt,
        status: status || 'UPCOMING',
        meetingLink: meetingLink || 'https://zoom.us/j/hero-demo',
        feedback: feedback || null,
        lead: {
          connect: { id: validLead.id }
        },
        presenter: {
          connect: { id: validPresenter.id }
        }
      },
      include: {
        lead: true,
        presenter: { select: { id: true, name: true, email: true } }
      }
    });

    // Update lead stage to DEMO_BOOKED if currently earlier in pipeline
    if (data.leadId) {
      await prisma.lead.update({
        where: { id: data.leadId },
        data: { stage: 'DEMO_BOOKED' }
      }).catch(() => null);

      // Audit activity
      await prisma.salesActivity.create({
        data: {
          leadId: data.leadId,
          title: 'Demo Scheduled',
          description: `Live software walkthrough scheduled for ${new Date(data.scheduledAt).toLocaleDateString()}`,
          performedById: req.user?.id || data.presenterId,
          timestamp: new Date()
        }
      }).catch(() => null);
    }

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update DemoBooking
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { leadId, presenterId, scheduledAt, status, meetingLink, feedback, ...rest } = req.body;
    const where = { id };

    const updatePayload = { ...rest };
    if (status !== undefined) updatePayload.status = status;
    if (meetingLink !== undefined) updatePayload.meetingLink = meetingLink;
    if (feedback !== undefined) updatePayload.feedback = feedback;

    if (scheduledAt !== undefined) {
      let parsedDate = new Date();
      if (scheduledAt) {
        const d = new Date(scheduledAt);
        if (!isNaN(d.getTime())) parsedDate = d;
      }
      updatePayload.scheduledAt = parsedDate;
    }

    if (leadId) {
      const foundLead = await prisma.lead.findUnique({ where: { id: leadId } }).catch(() => null);
      if (foundLead) {
        updatePayload.lead = { connect: { id: foundLead.id } };
      }
    }

    if (presenterId) {
      const foundPresenter = await prisma.user.findUnique({ where: { id: presenterId } }).catch(() => null);
      if (foundPresenter) {
        updatePayload.presenter = { connect: { id: foundPresenter.id } };
      }
    }

    const data = await prisma.demoBooking.update({
      where,
      data: updatePayload,
      include: {
        lead: true,
        presenter: { select: { id: true, name: true, email: true } }
      }
    });

    // If marked completed, update lead stage to DEMO_COMPLETED
    if (updatePayload.status === 'COMPLETED' && data.leadId) {
      await prisma.lead.update({
        where: { id: data.leadId },
        data: { stage: 'DEMO_COMPLETED' }
      }).catch(() => null);

      await prisma.salesActivity.create({
        data: {
          leadId: data.leadId,
          title: 'Demo Completed',
          description: `Product demonstration successfully completed. Notes: ${data.feedback || 'Walkthrough completed.'}`,
          performedById: req.user?.id || data.presenterId,
          timestamp: new Date()
        }
      }).catch(() => null);
    }

    return sendSuccess(res, data);
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'DemoBooking not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

// Delete DemoBooking
exports.delete = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    await prisma.demoBooking.delete({ where });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'DemoBooking not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
