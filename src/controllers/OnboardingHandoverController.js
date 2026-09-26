const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);

    const [data, total] = await Promise.all([
      prisma.onboardingHandover.findMany({
        where, skip, take, orderBy,
        include: {
          lead: true,
          company: true
        }
      }),
      prisma.onboardingHandover.count({ where })
    ]);

    return sendList(res, data, buildPaginationMeta(total, currentPage, pageSize, req.query.sort));
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { leadId, companyName, primaryContact, adminEmail, adminPhone, transportNiche, fleetSize, selectedPlan, billingFreq, agreedPrice, notes } = req.body;

    let lead = null;
    if (leadId) {
      lead = await prisma.lead.findUnique({ where: { id: leadId } });
    }

    const handover = await prisma.onboardingHandover.create({
      data: {
        leadId: leadId || undefined,
        companyName: companyName || lead?.companyName || 'New Client Company',
        primaryContact: primaryContact || lead?.contactName || 'Primary Admin',
        adminEmail: adminEmail || lead?.email || 'admin@client.com',
        adminPhone: adminPhone || lead?.phone || '',
        transportNiche: transportNiche || lead?.transportNiche || 'General Freight',
        fleetSize: fleetSize || lead?.fleetSize || '5-10 Trucks',
        selectedPlan: selectedPlan || 'Professional',
        billingFreq: billingFreq || 'Monthly',
        agreedPrice: agreedPrice ? parseFloat(agreedPrice) : (lead?.estimatedValue || 1200),
        status: 'READY_FOR_PROVISIONING',
        notes: notes || ''
      },
      include: {
        lead: true
      }
    });

    if (leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { stage: 'WON' }
      });

      await prisma.salesActivity.create({
        data: {
          leadId,
          title: 'Onboarding Handover Created',
          description: `Handover submitted for provisioning: ${companyName || lead.companyName}`,
          performedById: req.user?.id || lead.repId,
          timestamp: new Date()
        }
      });
    }

    return sendSuccess(res, handover, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

exports.submitToProvisioning = async (req, res, next) => {
  try {
    const { id } = req.params;

    const handover = await prisma.onboardingHandover.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!handover) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Handover not found' }, HTTP_STATUS.NOT_FOUND);
    }

    if (handover.companyId) {
      return sendSuccess(res, handover);
    }

    const passwordHash = await bcrypt.hash('123456', 10);

    let plan = await prisma.subscriptionPlan.findFirst({
      where: { name: handover.selectedPlan || 'Professional' }
    });

    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst();
    }

    const company = await prisma.company.create({
      data: {
        name: handover.companyName,
        status: 'ACTIVE',
        nicheCarCarrying: handover.transportNiche?.includes('Car Carrying') || false,
        nicheGeneralFreight: !handover.transportNiche?.includes('Car Carrying'),
        defaultNiche: handover.transportNiche || 'General Freight',
        adminEmail: handover.adminEmail,
        tenantId: `#TEN-${Math.floor(100 + Math.random() * 900)}`
      }
    });

    const adminUser = await prisma.user.create({
      data: {
        email: handover.adminEmail,
        password: passwordHash,
        name: handover.primaryContact,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        companyId: company.id,
        phone: handover.adminPhone
      }
    });

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

    const updatedHandover = await prisma.onboardingHandover.update({
      where: { id },
      data: {
        status: 'PROVISIONED',
        companyId: company.id
      }
    });

    if (handover.leadId) {
      await prisma.lead.update({
        where: { id: handover.leadId },
        data: { stage: 'WON' }
      });
    }

    return sendSuccess(res, { handover: updatedHandover, company, adminUser });
  } catch (error) {
    next(error);
  }
};
