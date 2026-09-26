const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

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

function formatProposal(p) {
  if (!p) return p;
  let notes = p.notes || '';
  let modules = ['Real-Time GPS Telematics', 'AI Route Optimizer', 'Driver Mobile App', 'Dispatch Board Pro', 'Factoring & Billing API', 'Live Customer Portal'];

  if (p.includedModules) {
    try {
      const parsed = typeof p.includedModules === 'string' ? JSON.parse(p.includedModules) : p.includedModules;
      if (Array.isArray(parsed)) {
        modules = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.modules)) modules = parsed.modules;
        if (parsed.notes) notes = parsed.notes;
      }
    } catch (e) {}
  }

  return {
    ...p,
    notes: notes || p.notes || '',
    includedModules: JSON.stringify(modules)
  };
}

// Get all Proposals with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const queryCopy = { ...req.query };
    delete queryCopy.repId;
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(queryCopy);
    
    // RBAC Scoping
    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      where.lead = { repId: req.user.id };
    } else if (req.query.repId && req.query.repId !== 'ALL') {
      if (req.query.repId === 'unassigned') {
        where.lead = { repId: null };
      } else {
        where.lead = { repId: req.query.repId };
      }
    }

    const [data, total, leads, salesReps, subscriptionPlans, terminals] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip,
        take,
        orderBy: orderBy.length ? orderBy : [{ createdAt: 'desc' }],
        include: {
          lead: {
            select: { id: true, companyName: true, contactName: true, email: true, phone: true, stage: true, repId: true, rep: { select: { id: true, name: true } } }
          }
        }
      }),
      prisma.proposal.count({ where }),
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        include: { rep: { select: { id: true, name: true } } }
      }),
      prisma.user.findMany({
        where: { role: 'SALES', status: 'ACTIVE' },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' }
      }),
      prisma.subscriptionPlan ? prisma.subscriptionPlan.findMany().catch(() => []) : [],
      prisma.branch ? prisma.branch.findMany({ where: (req.user?.role !== 'SUPER_ADMIN' && req.user?.companyId) ? { companyId: req.user.companyId } : {}, select: { id: true, name: true, location: true } }).catch(() => []) : []
    ]);

    const formattedData = data.map(formatProposal);
    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);

    return sendSuccess(res, {
      proposals: formattedData,
      leads,
      salesReps,
      subscriptionPlans: subscriptionPlans || [],
      terminals: terminals || [],
      meta
    });
  } catch (error) {
    next(error);
  }
};

// Get single Proposal by ID
exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };

    const data = await prisma.proposal.findFirst({
      where,
      include: {
        lead: {
          include: { rep: { select: { id: true, name: true } } }
        }
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Proposal not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, formatProposal(data));
  } catch (error) {
    next(error);
  }
};

// Create new Proposal
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    const notesText = payload.notes !== undefined ? String(payload.notes || '') : '';
    delete payload.notes;

    if (!payload.proposalRef) {
      payload.proposalRef = `PROP-${Math.floor(100 + Math.random() * 900)}`;
    }

    if (payload.baseValue !== undefined) payload.baseValue = Number(payload.baseValue) || 0;
    if (payload.discountAmount !== undefined) payload.discountAmount = Number(payload.discountAmount) || 0;
    if (payload.validityDays !== undefined) {
      payload.validityDays = typeof payload.validityDays === 'string' ? parseInt(payload.validityDays) || 30 : Number(payload.validityDays) || 30;
    } else if (payload.validity !== undefined) {
      payload.validityDays = parseInt(payload.validity) || 30;
      delete payload.validity;
    }

    if (payload.finalValue === undefined) {
      const baseVal = Number(payload.baseValue) || 0;
      const discPercent = Number(payload.discountAmount) || 0;
      payload.finalValue = Math.round(baseVal * (1 - discPercent / 100));
    }

    let modulesList = ['Real-Time GPS Telematics', 'AI Route Optimizer', 'Driver Mobile App', 'Dispatch Board Pro', 'Factoring & Billing API', 'Live Customer Portal'];
    if (payload.includedModules) {
      try {
        const parsed = typeof payload.includedModules === 'string' ? JSON.parse(payload.includedModules) : payload.includedModules;
        if (Array.isArray(parsed)) modulesList = parsed;
        else if (parsed && Array.isArray(parsed.modules)) modulesList = parsed.modules;
      } catch (e) {}
    }

    payload.includedModules = JSON.stringify({
      modules: modulesList,
      notes: notesText
    });

    // Resolve Lead ID
    let targetLeadId = payload.leadId;
    let validLead = null;
    if (targetLeadId) {
      validLead = await prisma.lead.findUnique({ where: { id: targetLeadId } }).catch(() => null);
    }

    if (!validLead) {
      validLead = await prisma.lead.findFirst().catch(() => null);
      if (!validLead) {
        const firstComp = await prisma.company.findFirst().catch(() => null);
        const compId = firstComp ? firstComp.id : require('crypto').randomUUID();
        validLead = await prisma.lead.create({
          data: {
            id: targetLeadId || require('crypto').randomUUID(),
            companyName: 'General Logistics Client',
            contactName: 'Client Contact',
            email: 'client@logistics.com',
            phone: '1300 000 000',
            companyId: compId
          }
        });
      }
      targetLeadId = validLead.id;
    }
    payload.leadId = targetLeadId;

    const data = await prisma.proposal.create({
      data: payload,
      include: { lead: true }
    });

    // If created in SENT status, transition lead
    if (data.status === 'SENT' && data.leadId) {
      await prisma.lead.update({
        where: { id: data.leadId },
        data: { stage: 'PROPOSAL_SENT' }
      }).catch(() => null);
    }

    // Log sales activity
    if (data.leadId) {
      await prisma.salesActivity.create({
        data: {
          leadId: data.leadId,
          title: `Proposal Created (${data.proposalRef})`,
          description: `Quote for $${data.finalValue}/mo created with validity of ${data.validityDays} days`,
          performedById: await resolveValidUserId(req.user?.id),
          timestamp: new Date()
        }
      }).catch(() => null);
    }

    return sendSuccess(res, formatProposal(data), HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Proposal
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const notesText = updateData.notes;
    delete updateData.notes;

    if (updateData.baseValue !== undefined) updateData.baseValue = Number(updateData.baseValue) || 0;
    if (updateData.discountAmount !== undefined) updateData.discountAmount = Number(updateData.discountAmount) || 0;
    if (updateData.validityDays !== undefined) {
      updateData.validityDays = typeof updateData.validityDays === 'string' ? parseInt(updateData.validityDays) || 30 : Number(updateData.validityDays) || 30;
    } else if (updateData.validity !== undefined) {
      updateData.validityDays = parseInt(updateData.validity) || 30;
      delete updateData.validity;
    }

    if (updateData.baseValue !== undefined || updateData.discountAmount !== undefined) {
      if (updateData.finalValue === undefined) {
        const existing = await prisma.proposal.findUnique({ where: { id } }).catch(() => null);
        const baseVal = updateData.baseValue !== undefined ? updateData.baseValue : (existing?.baseValue || 0);
        const discPercent = updateData.discountAmount !== undefined ? updateData.discountAmount : (existing?.discountAmount || 0);
        updateData.finalValue = Math.round(baseVal * (1 - discPercent / 100));
      }
    }

    if (notesText !== undefined || updateData.includedModules !== undefined) {
      const existing = await prisma.proposal.findUnique({ where: { id } }).catch(() => null);
      let existingNotes = '';
      let modulesList = ['Real-Time GPS Telematics', 'AI Route Optimizer', 'Driver Mobile App', 'Dispatch Board Pro', 'Factoring & Billing API', 'Live Customer Portal'];
      if (existing && existing.includedModules) {
        try {
          const parsed = typeof existing.includedModules === 'string' ? JSON.parse(existing.includedModules) : existing.includedModules;
          if (Array.isArray(parsed)) modulesList = parsed;
          else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.modules)) modulesList = parsed.modules;
            if (parsed.notes) existingNotes = parsed.notes;
          }
        } catch (e) {}
      }
      if (updateData.includedModules) {
        try {
          const parsed = typeof updateData.includedModules === 'string' ? JSON.parse(updateData.includedModules) : updateData.includedModules;
          if (Array.isArray(parsed)) modulesList = parsed;
          else if (parsed && Array.isArray(parsed.modules)) modulesList = parsed.modules;
        } catch (e) {}
      }
      updateData.includedModules = JSON.stringify({
        modules: modulesList,
        notes: notesText !== undefined ? notesText : existingNotes
      });
    }

    const where = { id };

    const data = await prisma.proposal.update({
      where,
      data: updateData,
      include: { lead: true }
    });

    // Synchronize Lead Stage based on proposal outcome
    if (data.leadId) {
      if (updateData.status === 'SENT') {
        await prisma.lead.update({
          where: { id: data.leadId },
          data: { stage: 'PROPOSAL_SENT' }
        });
        await prisma.salesActivity.create({
          data: {
            leadId: data.leadId,
            title: 'Proposal Dispatched',
            description: `Proposal ${data.proposalRef} sent to prospect ($${data.finalValue}/mo)`,
            performedById: await resolveValidUserId(req.user?.id),
            timestamp: new Date()
          }
        });
      } else if (updateData.status === 'ACCEPTED') {
        await prisma.lead.update({
          where: { id: data.leadId },
          data: { stage: 'WON' }
        });

        // 1. Resolve or create Customer record for Lead's company
        const leadRecord = await prisma.lead.findUnique({ where: { id: data.leadId } }).catch(() => null);
        let targetCompanyId = leadRecord?.companyId;
        if (!targetCompanyId) {
          const firstComp = await prisma.company.findFirst().catch(() => null);
          targetCompanyId = firstComp?.id;
        }

        let customer = null;
        if (targetCompanyId) {
          customer = await prisma.customer.findFirst({
            where: {
              companyId: targetCompanyId,
              name: leadRecord?.companyName || 'Lead Company'
            }
          }).catch(() => null);

          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                companyId: targetCompanyId,
                name: leadRecord?.companyName || 'Lead Customer Company',
                contactName: leadRecord?.contactName || 'Lead Contact',
                email: leadRecord?.email || 'contact@lead.com',
                phone: leadRecord?.phone || '1300000000',
                status: 'ACTIVE'
              }
            }).catch(() => null);
          }
        }

        // 2. Prevent duplicate Load creation if load already exists for this proposalRef
        const loadRef = `LD-${data.proposalRef}`;
        let existingLoad = await prisma.load.findFirst({
          where: {
            OR: [
              { draftId: data.proposalRef },
              { loadRef: loadRef }
            ]
          }
        }).catch(() => null);

        if (!existingLoad && targetCompanyId) {
          // Create draft Load carrying forward details
          existingLoad = await prisma.load.create({
            data: {
              loadRef,
              draftId: data.proposalRef,
              type: leadRecord?.transportNiche || 'Car Carrying',
              status: 'PLANNED',
              priority: 'NORMAL',
              notes: `Generated from Accepted Proposal ${data.proposalRef}. Value: $${data.finalValue}/mo`,
              customerId: customer ? customer.id : null,
              companyId: targetCompanyId,
              sourceType: 'PROPOSAL',
              aiExtracted: false
            }
          }).catch(() => null);

          if (existingLoad) {
            // Create default Pickup & Dropoff RouteStops
            await prisma.routeStop.createMany({
              data: [
                { loadId: existingLoad.id, type: 'PICKUP', sequenceIndex: 0, address: 'Origin Hub / Depot' },
                { loadId: existingLoad.id, type: 'DROPOFF', sequenceIndex: 1, address: 'Destination Customer Yard' }
              ]
            }).catch(() => null);
          }
        }

        await prisma.salesActivity.create({
          data: {
            leadId: data.leadId,
            title: 'Proposal Accepted (Deal WON)',
            description: `Client agreed to terms for ${data.proposalRef} ($${data.finalValue}/mo). ${existingLoad ? 'Linked Load: ' + existingLoad.loadRef : ''}`,
            performedById: await resolveValidUserId(req.user?.id),
            timestamp: new Date()
          }
        }).catch(() => null);
      } else if (updateData.status === 'REJECTED') {
        await prisma.lead.update({
          where: { id: data.leadId },
          data: { stage: 'LOST' }
        });
      }
    }

    return sendSuccess(res, formatProposal(data));
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Proposal not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

// Delete Proposal
exports.delete = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    await prisma.proposal.delete({ where });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Proposal not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

// Provision a Workspace from a Proposal
exports.provision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tier, companyName, dotNumber, taxId, adminName, adminEmail, depotLocation } = req.body;

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!proposal) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Proposal not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const resolvedCompanyName = companyName || proposal.lead?.companyName || 'New Freight Logistics';
    const resolvedAdminEmail = adminEmail || proposal.lead?.email || `admin@${resolvedCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`;
    const resolvedAdminName = adminName || proposal.lead?.contactName || 'Company Administrator';

    // 1. Update proposal status
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: { status: 'ACCEPTED' }
    });

    // 2. Update Lead if linked
    if (proposal.leadId) {
      await prisma.lead.update({
        where: { id: proposal.leadId },
        data: { stage: 'WON' }
      }).catch(e => console.warn('Could not update lead stage:', e.message));

      await prisma.salesActivity.create({
        data: {
          leadId: proposal.leadId,
          title: 'Workspace Provisioned',
          description: `Provisioned workspace for ${resolvedCompanyName} (${tier || 'Professional'} tier)`,
          performedById: await resolveValidUserId(req.user?.id),
          timestamp: new Date()
        }
      }).catch(e => console.warn('Could not log sales activity:', e.message));
    }

    // 3. Find or create company
    let targetCompany = null;
    if (proposal.leadId) {
      targetCompany = await prisma.company.findUnique({ where: { leadId: proposal.leadId } });
    }

    if (targetCompany) {
      targetCompany = await prisma.company.update({
        where: { id: targetCompany.id },
        data: {
          name: resolvedCompanyName,
          status: 'ACTIVE',
          dotNumber: dotNumber || targetCompany.dotNumber,
          taxId: taxId || targetCompany.taxId,
          adminEmail: resolvedAdminEmail
        }
      });
    } else {
      const generatedTenantCode = `#TEN-${Math.floor(1000 + Math.random() * 9000)}`;
      targetCompany = await prisma.company.create({
        data: {
          name: resolvedCompanyName,
          tenantId: generatedTenantCode,
          leadId: proposal.leadId || null,
          status: 'ACTIVE',
          dotNumber: dotNumber || null,
          taxId: taxId || null,
          adminEmail: resolvedAdminEmail,
          nicheGeneralFreight: true
        }
      });
    }

    // 4. Create or update Admin User
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash('Welcome123!', 10);

    let adminUser = await prisma.user.findUnique({ where: { email: resolvedAdminEmail } });
    if (adminUser) {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          name: resolvedAdminName,
          role: 'COMPANY_ADMIN',
          status: 'ACTIVE',
          companyId: targetCompany.id
        }
      });
    } else {
      adminUser = await prisma.user.create({
        data: {
          email: resolvedAdminEmail,
          name: resolvedAdminName,
          password: defaultPasswordHash,
          role: 'COMPANY_ADMIN',
          status: 'ACTIVE',
          companyId: targetCompany.id
        }
      });
    }

    // 5. Create or update Branch (Depot)
    const branchName = depotLocation || 'Chicago HQ Terminal';
    let branch = await prisma.branch.findFirst({
      where: { companyId: targetCompany.id, name: branchName }
    });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          companyId: targetCompany.id,
          name: branchName,
          location: branchName
        }
      });
    }

    return sendSuccess(res, {
      proposal: formatProposal(updatedProposal),
      company: targetCompany,
      admin: { id: adminUser.id, name: adminUser.name, email: adminUser.email },
      branch
    }, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Provision error:', error);
    next(error);
  }
};
