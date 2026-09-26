const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Valid Stage Definitions
const VALID_STAGES = [
  'NEW_LEAD',
  'CONTACTED',
  'DEMO_BOOKED',
  'DEMO_COMPLETED',
  'TRIAL_STARTED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'WON',
  'LOST'
];

// Dedicated API endpoint for Pipeline Kanban Board
exports.getPipelineBoard = async (req, res, next) => {
  try {
    const where = {};
    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.repId = req.user.id;
    } else if (req.query.repId && req.query.repId !== 'ALL') {
      if (req.query.repId === 'unassigned') {
        where.repId = null;
      } else {
        where.repId = req.query.repId;
      }
    }

    const [leads, salesReps] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          rep: {
            select: { id: true, name: true, email: true, role: true }
          },
          demos: { orderBy: { scheduledAt: 'desc' }, take: 3 },
          proposals: { orderBy: { createdAt: 'desc' }, take: 3 },
          tasks: { orderBy: { dueDate: 'asc' }, take: 5 }
        }
      }),
      prisma.user.findMany({
        where: {
          role: 'SALES',
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: { name: 'asc' }
      })
    ]);

    const stageStats = VALID_STAGES.reduce((acc, stage) => {
      const stageLeads = leads.filter(l => l.stage === stage);
      acc[stage] = {
        count: stageLeads.length,
        totalValue: stageLeads.reduce((sum, l) => sum + (Number(l.estimatedValue) || 0), 0)
      };
      return acc;
    }, {});

    const totalPipelineValue = leads
      .filter(l => !['WON', 'LOST'].includes(l.stage))
      .reduce((sum, l) => sum + (Number(l.estimatedValue) || 0), 0);

    return sendSuccess(res, {
      leads,
      stageStats,
      salesReps,
      totalPipelineValue
    });
  } catch (error) {
    next(error);
  }
};

// Dedicated API endpoint for Trial Companies Management
exports.getTrialCompanies = async (req, res, next) => {
  try {
    const where = {
      stage: 'TRIAL_STARTED'
    };

    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.repId = req.user.id;
    } else if (req.query.repId && req.query.repId !== 'ALL') {
      if (req.query.repId === 'unassigned') {
        where.repId = null;
      } else {
        where.repId = req.query.repId;
      }
    }

    const [trialLeads, totalLeadsCount, wonLeadsCount, salesReps] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          rep: {
            select: { id: true, name: true, email: true, role: true }
          },
          demos: { orderBy: { scheduledAt: 'desc' }, take: 1 },
          proposals: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      }),
      prisma.lead.count(),
      prisma.lead.count({ where: { stage: 'WON' } }),
      prisma.user.findMany({
        where: { role: 'SALES', status: 'ACTIVE' },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' }
      })
    ]);

    const trials = trialLeads.map(l => {
      const createdDate = l.createdAt ? new Date(l.createdAt) : new Date();
      const expiryDateObj = new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const daysLeft = Math.max(0, Math.ceil((expiryDateObj - new Date()) / (1000 * 60 * 60 * 24)));

      return {
        id: `T-${l.id}`,
        leadId: l.id,
        company: l.companyName || 'Trial Sandbox Tenant',
        admin: l.contactName || 'Admin User',
        email: l.email || '',
        phone: l.phone || '',
        status: daysLeft <= 0 ? 'Expired' : 'Active',
        daysRemaining: daysLeft > 0 ? daysLeft : 0,
        startDate: createdDate.toISOString().split('T')[0],
        expiryDate: expiryDateObj.toISOString().split('T')[0],
        mostUsedModule: l.transportNiche ? `${l.transportNiche} Tracking` : 'Live GPS Tracking',
        activeUsers: Math.min(15, Math.max(2, Math.floor((parseInt(l.fleetSize) || 6) / 2))),
        storage: `${((parseInt(l.fleetSize) || 5) * 0.15).toFixed(1)} GB`,
        currentPlan: 'Enterprise Sandbox',
        rep: l.rep ? l.rep.name : 'Unassigned',
        repId: l.repId
      };
    });

    const activeTrialsCount = trials.filter(t => t.status === 'Active').length;
    const expiredCount = trials.filter(t => t.status === 'Expired').length;
    const conversionRate = totalLeadsCount > 0 ? Math.round((wonLeadsCount / totalLeadsCount) * 100) : 0;

    return sendSuccess(res, {
      trials,
      metrics: {
        trialsActive: activeTrialsCount,
        conversion: conversionRate,
        expiredPortals: expiredCount
      },
      salesReps
    });
  } catch (error) {
    next(error);
  }
};

// Extend Trial evaluation period
exports.extendTrial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Trial Lead not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const currentCreated = lead.createdAt ? new Date(lead.createdAt) : new Date();
    const extendedCreated = new Date(currentCreated.getTime() + days * 24 * 60 * 60 * 1000);

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        createdAt: extendedCreated,
        painPoints: `Trial extended by ${days} days on ${new Date().toISOString().split('T')[0]}`
      }
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

// Get all Leads with pagination, sorting, filtering and RBAC scoping
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    
    // RBAC Data Scoping
    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.repId = req.user.id;
    } else if (req.query.repId) {
      if (req.query.repId === 'unassigned') {
        where.repId = null;
      } else {
        where.repId = req.query.repId;
      }
    }

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          rep: {
            select: { id: true, name: true, email: true, role: true }
          },
          demos: {
            orderBy: { scheduledAt: 'desc' }
          },
          proposals: {
            orderBy: { createdAt: 'desc' }
          },
          tasks: {
            orderBy: { dueDate: 'asc' }
          },
          activities: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      }),
      prisma.lead.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Dedicated API endpoint for Onboarding Handovers Management
exports.getOnboardingHandovers = async (req, res, next) => {
  try {
    const where = {
      stage: 'WON'
    };

    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.repId = req.user.id;
    } else if (req.query.repId && req.query.repId !== 'ALL') {
      if (req.query.repId === 'unassigned') {
        where.repId = null;
      } else {
        where.repId = req.query.repId;
      }
    }

    const [wonLeads, salesReps] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          rep: {
            select: { id: true, name: true, email: true, role: true }
          },
          proposals: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      }),
      prisma.user.findMany({
        where: { role: 'SALES', status: 'ACTIVE' },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' }
      })
    ]);

    const defaultChecklist = [
      { name: 'Company Workspace Provisioned', completed: true },
      { name: 'SaaS Subscription Plan Activated', completed: true },
      { name: 'Company Admin User Registered', completed: true },
      { name: 'Role Permission Policies Assigned', completed: false },
      { name: 'Mock Customer Inbound Data Importer', completed: false },
      { name: 'Roster & ELD System Training Complete', completed: false },
      { name: 'Sandbox Production Go-Live Scheduled', completed: false }
    ];

    const handovers = wonLeads.map(l => {
      const createdDate = l.createdAt ? new Date(l.createdAt) : new Date();
      const targetDateObj = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      let savedChecklist = defaultChecklist;
      let legalDocs = { slaSigned: true, w9TaxFiled: true };

      if (l.painPoints) {
        try {
          const parsed = JSON.parse(l.painPoints);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.checklist)) savedChecklist = parsed.checklist;
            if (parsed.legalDocs) legalDocs = parsed.legalDocs;
          }
        } catch (e) {}
      }

      const completedCount = savedChecklist.filter(c => c.completed).length;
      const isAllDone = savedChecklist.length > 0 && completedCount === savedChecklist.length;

      return {
        id: `H-${l.id}`,
        leadId: l.id,
        company: l.companyName || 'Carrier Workspace',
        contact: l.contactName || 'Admin User',
        email: l.email || '',
        phone: l.phone || '',
        owner: l.rep ? l.rep.name : 'Sales Team',
        repId: l.repId,
        targetDate: targetDateObj.toISOString().split('T')[0],
        dueDate: targetDateObj.toISOString().split('T')[0],
        checklist: savedChecklist,
        legalDocs,
        status: isAllDone ? 'Completed' : 'In Progress'
      };
    });

    return sendSuccess(res, {
      handovers,
      salesReps,
      count: handovers.length
    });
  } catch (error) {
    next(error);
  }
};

// Dedicated API endpoint for Sales Reports & Analytics
exports.getSalesReports = async (req, res, next) => {
  try {
    const where = {};
    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.repId = req.user.id;
    } else if (req.query.repId && req.query.repId !== 'ALL') {
      if (req.query.repId === 'unassigned') {
        where.repId = null;
      } else {
        where.repId = req.query.repId;
      }
    }

    const [leads, demos, proposals, salesReps] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          rep: { select: { id: true, name: true, email: true, role: true } },
          demos: { orderBy: { scheduledAt: 'desc' }, take: 2 },
          proposals: { orderBy: { createdAt: 'desc' }, take: 2 }
        }
      }),
      prisma.demoBooking.findMany({
        orderBy: { scheduledAt: 'desc' },
        include: {
          lead: { select: { id: true, companyName: true, repId: true } },
          presenter: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.proposal.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          lead: { select: { id: true, companyName: true, repId: true } }
        }
      }),
      prisma.user.findMany({
        where: { role: 'SALES', status: 'ACTIVE' },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' }
      })
    ]);

    // Map Leads to frontend format
    const mappedLeads = leads.map(l => ({
      id: l.id,
      company: l.companyName || 'Prospect Client',
      name: l.contactName || 'Contact',
      email: l.email || '',
      phone: l.phone || '',
      fleetSize: parseInt(l.fleetSize) || 0,
      niche: l.transportNiche || 'General Freight',
      revenue: Number(l.estimatedValue) || 2500,
      stage: l.stage === 'NEW_LEAD' ? 'New Lead'
             : l.stage === 'CONTACTED' ? 'Contacted'
             : l.stage === 'DEMO_BOOKED' ? 'Demo Booked'
             : l.stage === 'DEMO_COMPLETED' ? 'Demo Completed'
             : l.stage === 'TRIAL_STARTED' ? 'Trial Started'
             : l.stage === 'PROPOSAL_SENT' ? 'Proposal Sent'
             : l.stage === 'NEGOTIATING' ? 'Negotiation'
             : l.stage === 'WON' ? 'Won'
             : l.stage === 'LOST' ? 'Lost' : (l.stage || 'New Lead'),
      score: l.score || 60,
      repId: l.repId,
      rep: l.rep ? l.rep.name : 'Unassigned',
      createdAt: l.createdAt
    }));

    // Map Trials from TRIAL_STARTED leads
    const trialLeads = leads.filter(l => l.stage === 'TRIAL_STARTED');
    const mappedTrials = trialLeads.map(l => {
      const createdDate = l.createdAt ? new Date(l.createdAt) : new Date();
      const expiryDateObj = new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const daysLeft = Math.max(0, Math.ceil((expiryDateObj - new Date()) / (1000 * 60 * 60 * 24)));
      return {
        id: `T-${l.id}`,
        leadId: l.id,
        company: l.companyName || 'Trial Sandbox Tenant',
        admin: l.contactName || 'Admin User',
        status: daysLeft <= 0 ? 'Expired' : 'Active',
        daysRemaining: daysLeft > 0 ? daysLeft : 0
      };
    });

    // Map Demos
    const mappedDemos = demos.map(d => ({
      id: d.id,
      leadId: d.leadId,
      company: d.lead?.companyName || 'Lead Ref',
      presenter: d.presenter?.name || 'Sales Rep',
      date: d.scheduledAt ? (d.scheduledAt instanceof Date ? d.scheduledAt.toISOString().split('T')[0] : String(d.scheduledAt).split('T')[0]) : '',
      time: '12:00 PM',
      status: d.status === 'COMPLETED' ? 'Completed' : d.status === 'CANCELLED' ? 'Cancelled' : 'Upcoming'
    }));

    // Map Proposals
    const mappedProposals = proposals.map(p => ({
      id: p.id,
      leadId: p.leadId,
      company: p.lead?.companyName || 'Client',
      value: p.baseValue,
      total: p.finalValue,
      validity: p.validityDays ? `${p.validityDays} Days` : '30 Days',
      status: p.status === 'SENT' ? 'Sent' : p.status === 'ACCEPTED' ? 'Accepted' : p.status === 'REJECTED' ? 'Rejected' : 'Draft'
    }));

    return sendSuccess(res, {
      leads: mappedLeads,
      demos: mappedDemos,
      trials: mappedTrials,
      proposals: mappedProposals,
      salesReps
    });
  } catch (error) {
    next(error);
  }
};

// Get single Lead by ID with relations
exports.getById = async (req, res, next) => {
  try {
    if (req.params.id === 'pipeline') {
      return exports.getPipelineBoard(req, res, next);
    }
    if (req.params.id === 'trials') {
      return exports.getTrialCompanies(req, res, next);
    }
    if (req.params.id === 'handovers') {
      return exports.getOnboardingHandovers(req, res, next);
    }
    if (req.params.id === 'reports') {
      return exports.getSalesReports(req, res, next);
    }

    const where = { id: req.params.id };

    // Scoping check for SALES_REP
    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.repId = req.user.id;
    }

    const data = await prisma.lead.findFirst({
      where,
      include: {
        rep: {
          select: { id: true, name: true, email: true, role: true }
        },
        demos: {
          orderBy: { scheduledAt: 'desc' }
        },
        proposals: {
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
          orderBy: { dueDate: 'asc' }
        },
        activities: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Lead not found or access denied.'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Helper to safely check if a user ID is a valid foreign key in the database
const resolveValidUserId = async (id) => {
  if (!id || typeof id !== 'string' || id.length !== 36) return null;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? user.id : null;
  } catch {
    return null;
  }
};

// Create new Lead
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    // Format & sanitize values for DB persistence
    if (payload.fleetSize !== undefined && payload.fleetSize !== null && payload.fleetSize !== '') {
      payload.fleetSize = String(payload.fleetSize).includes('Trucks') 
        ? String(payload.fleetSize) 
        : `${payload.fleetSize} Trucks`;
    } else {
      payload.fleetSize = '15 Trucks';
    }

    if (payload.estimatedValue !== undefined && payload.estimatedValue !== null && payload.estimatedValue !== '') {
      payload.estimatedValue = parseFloat(payload.estimatedValue) || 2500;
    } else {
      payload.estimatedValue = 2500;
    }

    if (payload.score !== undefined && payload.score !== null && payload.score !== '') {
      payload.score = parseInt(payload.score) || 60;
    } else {
      payload.score = 60;
    }

    // Auto-assign rep if valid
    if (payload.repId) {
      payload.repId = await resolveValidUserId(payload.repId);
    } else if (req.user && req.user.role === 'SALES') {
      payload.repId = await resolveValidUserId(req.user.id);
    }

    const data = await prisma.lead.create({
      data: payload,
      include: {
        rep: { select: { id: true, name: true, email: true } }
      }
    });

    const actorId = await resolveValidUserId(req.user?.id);

    // Create initial Sales Activity audit record
    await prisma.salesActivity.create({
      data: {
        leadId: data.id,
        title: 'Lead Created',
        description: `Lead intake registered for ${data.companyName} (${data.transportNiche || 'General Freight'})`,
        performedById: actorId,
        timestamp: new Date()
      }
    });

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Lead details
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const where = { id };

    // Scope protection
    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.repId = req.user.id;
    }

    // Don't allow direct rep reassignment via general update if not authorized
    if (updateData.repId && req.salesScope === 'OWN') {
      delete updateData.repId;
    }

    const data = await prisma.lead.update({
      where,
      data: updateData,
      include: {
        rep: { select: { id: true, name: true, email: true } }
      }
    });

    // Log update activity
    const updateActorId = await resolveValidUserId(req.user?.id);
    await prisma.salesActivity.create({
      data: {
        leadId: data.id,
        title: 'Lead Profile Updated',
        description: `Lead details modified for ${data.companyName}`,
        performedById: updateActorId,
        timestamp: new Date()
      }
    });

    return sendSuccess(res, data);
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Lead not found or unauthorized.'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

// Update Pipeline Stage with Transition Validation
exports.updateStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, reason, notes } = req.body;

    if (!stage || !VALID_STAGES.includes(stage)) {
      return sendError(res, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`
      }, HTTP_STATUS.BAD_REQUEST);
    }

    const where = { id };
    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.repId = req.user.id;
    }

    const lead = await prisma.lead.findFirst({ where });
    if (!lead) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Lead not found or access denied.'
      }, HTTP_STATUS.NOT_FOUND);
    }

    const oldStage = lead.stage;
    const updatePayload = { stage };
    if (notes) {
      updatePayload.painPoints = notes;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updatePayload,
      include: {
        rep: { select: { id: true, name: true, email: true } }
      }
    });

    const stageActorId = await resolveValidUserId(req.user?.id);

    // Log stage transition in SalesActivity
    await prisma.salesActivity.create({
      data: {
        leadId: id,
        title: `Stage Changed: ${oldStage} -> ${stage}`,
        description: reason || `Pipeline stage transitioned to ${stage}`,
        performedById: stageActorId,
        timestamp: new Date()
      }
    });

    return sendSuccess(res, updatedLead);
  } catch (error) {
    next(error);
  }
};

// Assign / Reassign Sales Rep (Authorized Full Access / Super Admin only)
exports.assignRep = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { repId } = req.body;

    // Check authorization: SALES_REP cannot reassign leads
    if (req.salesScope === 'OWN') {
      return sendError(res, {
        code: ERROR_CODES.UNAUTHORIZED_ACCESS,
        message: 'Only Sales Full Access or Super Admin can assign/reassign Sales Reps.'
      }, HTTP_STATUS.FORBIDDEN);
    }

    let repName = 'Unassigned';
    let validRepId = null;
    if (repId) {
      const repUser = await prisma.user.findUnique({
        where: { id: repId }
      });
      if (!repUser) {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Selected Sales Representative user was not found.'
        }, HTTP_STATUS.NOT_FOUND);
      }
      repName = repUser.name || repUser.email;
      validRepId = repUser.id;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { repId: validRepId },
      include: {
        rep: { select: { id: true, name: true, email: true } }
      }
    });

    const assignActorId = await resolveValidUserId(req.user?.id);

    // Audit assignment
    await prisma.salesActivity.create({
      data: {
        leadId: id,
        title: 'Sales Rep Assigned',
        description: `Lead assigned to ${repName}`,
        performedById: assignActorId,
        timestamp: new Date()
      }
    });

    return sendSuccess(res, updatedLead);
  } catch (error) {
    next(error);
  }
};

// Delete Lead
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return sendSuccess(res, { message: 'Lead already deleted or not found.' });
    }

    // Delete/unlink related records first to avoid foreign key constraint errors
    await prisma.$transaction([
      prisma.demoBooking.deleteMany({ where: { leadId: id } }),
      prisma.proposal.deleteMany({ where: { leadId: id } }),
      prisma.followUpTask.deleteMany({ where: { leadId: id } }),
      prisma.salesActivity.deleteMany({ where: { leadId: id } }),
      prisma.company.updateMany({ where: { leadId: id }, data: { leadId: null } }),
      prisma.lead.delete({ where: { id } })
    ]);
    
    return sendSuccess(res, { message: 'Lead deleted successfully.' });
  } catch (error) {
    if (error.code === 'P2025' || error.code === 'P2023') {
      return sendSuccess(res, { message: 'Lead already deleted or not found.' });
    }
    next(error);
  }
};

// Convert Lead to Company tenant (Provisioning)
exports.convertToCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { selectedPlan = 'Professional', companyName, adminName, adminEmail } = req.body;

    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Lead not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    // Default password for newly provisioned company admin
    const passwordHash = await bcrypt.hash('123456', 10);

    // Find the subscription plan
    let plan = await prisma.subscriptionPlan.findFirst({
      where: { name: selectedPlan }
    });

    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst();
    }

    const finalCompanyName = companyName || lead.companyName;
    const finalAdminEmail = adminEmail || lead.email;
    const finalAdminName = adminName || lead.contactName;

    // 1. Create Company Tenant
    const company = await prisma.company.create({
      data: {
        name: finalCompanyName,
        status: 'ACTIVE',
        leadId: lead.id,
        nicheCarCarrying: lead.transportNiche?.includes('Car Carrying') || false,
        nicheGeneralFreight: !lead.transportNiche?.includes('Car Carrying'),
        defaultNiche: lead.transportNiche || 'General Freight',
        adminEmail: finalAdminEmail,
        tenantId: `#TEN-${Math.floor(100 + Math.random() * 900)}`
      }
    });

    // 2. Create User (COMPANY_ADMIN)
    const adminUser = await prisma.user.create({
      data: {
        email: finalAdminEmail,
        password: passwordHash,
        name: finalAdminName,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        companyId: company.id,
        phone: lead.phone
      }
    });

    // 3. Create TenantSubscription
    if (plan) {
      await prisma.tenantSubscription.create({
        data: {
          subId: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
          companyId: company.id,
          planId: plan.id,
          status: 'ACTIVE',
          amount: plan.monthlyPrice,
          nextRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }

    // 4. Update Lead to WON and log company reference
    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        stage: 'WON',
        painPoints: `Converted to Company: ${company.name} (Admin ID: ${adminUser.id}, Tenant: ${company.tenantId})`
      }
    });

    const convertActorId = await resolveValidUserId(req.user?.id || lead.repId);

    // 5. Create a Sales Activity
    await prisma.salesActivity.create({
      data: {
        leadId: lead.id,
        title: 'Lead Converted to Company',
        description: `Successfully created Company: ${company.name} (${company.tenantId}) and Admin User: ${adminUser.email}`,
        performedById: convertActorId,
        timestamp: new Date()
      }
    });

    return sendSuccess(res, {
      lead: updatedLead,
      company,
      adminUser
    });

  } catch (error) {
    next(error);
  }
};
