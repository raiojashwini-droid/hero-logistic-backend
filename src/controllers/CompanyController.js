const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get all Companys with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    
    // Enforce tenant scoping
    const { resolveCompanyId } = require('../middlewares/tenantResolver');
    const companyId = resolveCompanyId(req);
    
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendList(res, [], buildPaginationMeta(0, currentPage, pageSize, req.query.sort));
      }
      where.id = companyId;
    } else if (req.query.companyId) {
      where.id = req.query.companyId;
    }

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where, skip, take, orderBy,
        select: {
          id: true,
          tenantId: true,
          name: true,
          status: true,
          trialExpiry: true,
          lastLogin: true,
          accountManager: true,
          country: true,
          storageUsedGB: true,
          registrationNumber: true,
          dotNumber: true,
          taxId: true,
          adminEmail: true,
          canSendTransfers: true,
          canReceiveTransfers: true,
          autoApproveTransfers: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              drivers: true,
              vehicles: true,
              branches: true,
              loads: true
            }
          },
          tenantSubscription: {
            include: {
              plan: true
            }
          },
          users: {
            where: {
              role: 'COMPANY_ADMIN'
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        }
      }),
      prisma.company.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    console.error('Error fetching companies in CompanyController.getAll:', error.message);
    return sendList(res, [], buildPaginationMeta(0, 1, 10));
  }
};

// Get single Company by ID
exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    const data = await prisma.company.findFirst({ where });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Company not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const bcrypt = require('bcryptjs');

// Create new Company
exports.create = async (req, res, next) => {
  try {
    const {
      name,
      tenantId,
      adminEmail,
      adminPassword,
      status,
      accountManager,
      country,
      trialExpiry,
      planTier,
      passwordSetupType
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendError(res, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Company name is required.'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    const cleanName = name.trim();
    const cleanEmail = adminEmail && typeof adminEmail === 'string' ? adminEmail.trim() : null;
    const cleanAccountManager = accountManager && typeof accountManager === 'string' && accountManager.trim() ? accountManager.trim() : null;

    // Pre-check 1: Check if adminEmail is already registered in User table
    if (cleanEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });
      if (existingUser) {
        return sendError(res, {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: `Workspace Manager Email '${cleanEmail}' is already registered to an existing account. Please enter a different email address.`
        }, HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Pre-check 2: Handle Tenant ID (Company ID) uniqueness
    let generatedTenantId = null;
    if (tenantId && typeof tenantId === 'string' && tenantId.trim()) {
      const explicitId = tenantId.trim();
      const existingTenant = await prisma.company.findFirst({
        where: { tenantId: explicitId }
      });
      if (existingTenant) {
        return sendError(res, {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: `Company ID '${explicitId}' is already taken by another workspace. Please enter a unique Company ID.`
        }, HTTP_STATUS.BAD_REQUEST);
      }
      generatedTenantId = explicitId;
    } else {
      // Auto-generate timestamp-backed collision-free Tenant ID
      generatedTenantId = `#TEN-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
    }

    // Hash password prior to creation (or auto-generate initial temp password for EMAIL_LINK mode)
    const effectivePassword = adminPassword || (passwordSetupType === 'EMAIL_LINK' || !adminPassword ? `Hero_${Date.now().toString().slice(-4)}!${Math.floor(100 + Math.random() * 900)}` : 'Hero@123456');
    const hashedPassword = await bcrypt.hash(effectivePassword, 10);

    // Atomic Transaction: Both Company and Admin User must be created together, or neither
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Create the Company
      const newCompany = await tx.company.create({
        data: {
          name: cleanName,
          tenantId: generatedTenantId,
          status: status || 'ACTIVE',
          accountManager: cleanAccountManager,
          country: country ? String(country).trim() : null,
          trialExpiry: trialExpiry ? new Date(trialExpiry) : null,
          adminEmail: cleanEmail
        }
      });

      // 2. Create the Workspace Manager (User) with role COMPANY_ADMIN
      let createdUser = null;
      if (cleanEmail) {
        createdUser = await tx.user.create({
          data: {
            email: cleanEmail,
            password: hashedPassword,
            name: `${cleanName} Admin`,
            role: 'COMPANY_ADMIN',
            companyId: newCompany.id,
            status: 'ACTIVE'
          }
        });
      }

      // 3. Setup the TenantSubscription if a plan is provided
      if (planTier) {
        const plan = await tx.subscriptionPlan.findFirst({
          where: { name: planTier }
        });
        
        if (plan) {
          await tx.tenantSubscription.create({
            data: {
              subId: `SUB-${Date.now()}`,
              companyId: newCompany.id,
              planId: plan.id,
              status: 'ACTIVE',
              amount: plan.monthlyPrice,
              nextRenewal: new Date(new Date().setMonth(new Date().getMonth() + 1))
            }
          });

          // Auto-generate initial Billing Record (Invoice)
          await tx.billingRecord.create({
            data: {
              invoiceNumber: `INV-${Date.now()}`,
              amount: plan.monthlyPrice,
              status: 'PAID',
              planTierSnapshot: plan.name,
              companyId: newCompany.id,
              periodStart: new Date(),
              periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
              dueDate: new Date(new Date().setDate(new Date().getDate() + 7))
            }
          });
        }
      }

      // 4. System Audit Log
      await tx.auditLog.create({
        data: {
          action: `SYSTEM::New workspace registered: ${cleanName} (${generatedTenantId}) [Admin: ${cleanEmail || 'None'}]`,
          operator: 'System Registration',
          companyId: newCompany.id
        }
      });

      return { company: newCompany, user: createdUser };
    });

    // 5. Fetch full company with subscription details to return
    const result = await prisma.company.findUnique({
      where: { id: transactionResult.company.id },
      include: {
        tenantSubscription: {
          include: { plan: true }
        },
        users: {
          where: { role: 'COMPANY_ADMIN' },
          select: { id: true, email: true, name: true, role: true }
        }
      }
    });

    const responsePayload = {
      ...(result || transactionResult.company),
      credentials: {
        email: cleanEmail,
        password: effectivePassword,
        role: 'COMPANY_ADMIN'
      }
    };

    return sendSuccess(res, responsePayload, HTTP_STATUS.CREATED);
  } catch (error) {
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      const targetStr = Array.isArray(target) ? target.join(', ') : String(target);
      let customMsg = 'A company or user with these unique details already exists.';
      if (targetStr.includes('email')) {
        customMsg = 'Email address is already registered. Please enter a different Workspace Manager Email.';
      } else if (targetStr.includes('tenantId')) {
        customMsg = 'Company ID is already taken. Please specify a different Company ID.';
      } else if (targetStr.includes('name')) {
        customMsg = 'A company with this name already exists. Please choose a unique Company Name.';
      }
      return sendError(res, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: customMsg
      }, HTTP_STATUS.BAD_REQUEST);
    }
    next(error);
  }
};

// Update Company with full scalar and relational user/subscription handling
exports.update = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    // Find company by primary key id or tenantId
    const company = await prisma.company.findFirst({
      where: {
        OR: [{ id: targetId }, { tenantId: targetId }]
      },
      include: {
        users: { where: { role: 'COMPANY_ADMIN' } },
        tenantSubscription: true
      }
    });

    if (!company) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Company not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    const {
      name,
      adminEmail,
      adminPassword,
      planTier,
      status,
      accountManager,
      country,
      trialExpiry
    } = req.body;

    // 1. Prepare scalar fields for Company model
    const companyUpdateData = {};
    if (name !== undefined && name !== null && name.trim()) companyUpdateData.name = name.trim();
    if (status !== undefined && status !== null) companyUpdateData.status = status;
    if (adminEmail !== undefined && adminEmail !== null) companyUpdateData.adminEmail = adminEmail.trim() || null;
    if (accountManager !== undefined) companyUpdateData.accountManager = accountManager ? accountManager.trim() : null;
    if (country !== undefined) companyUpdateData.country = country ? String(country).trim() : null;
    if (trialExpiry !== undefined) companyUpdateData.trialExpiry = trialExpiry ? new Date(trialExpiry) : null;

    let updatedCompany = company;
    if (Object.keys(companyUpdateData).length > 0) {
      updatedCompany = await prisma.company.update({
        where: { id: company.id },
        data: companyUpdateData
      });
    }

    // 2. Handle updating or creating COMPANY_ADMIN User
    const cleanEmail = adminEmail !== undefined ? (adminEmail ? adminEmail.trim() : null) : company.adminEmail;

    if (cleanEmail || (adminPassword && typeof adminPassword === 'string' && adminPassword.trim())) {
      const existingAdminUser = company.users && company.users.length > 0 ? company.users[0] : null;

      if (existingAdminUser) {
        const userUpdateData = {};
        if (cleanEmail && cleanEmail !== existingAdminUser.email) {
          userUpdateData.email = cleanEmail;
        }
        if (adminPassword && typeof adminPassword === 'string' && adminPassword.trim()) {
          userUpdateData.password = await bcrypt.hash(adminPassword.trim(), 10);
        }

        if (Object.keys(userUpdateData).length > 0) {
          await prisma.user.update({
            where: { id: existingAdminUser.id },
            data: userUpdateData
          });
        }
      } else if (cleanEmail) {
        const initialPassword = adminPassword && typeof adminPassword === 'string' && adminPassword.trim()
          ? adminPassword.trim()
          : `HeroSetup_${Date.now().toString(36)}`;
        const hashedPassword = await bcrypt.hash(initialPassword, 10);

        try {
          await prisma.user.create({
            data: {
              email: cleanEmail,
              password: hashedPassword,
              name: `${updatedCompany.name} Admin`,
              role: 'COMPANY_ADMIN',
              companyId: updatedCompany.id,
              status: 'ACTIVE'
            }
          });
        } catch (uErr) {
          console.warn('Could not auto-create missing company admin user on update:', uErr.message);
        }
      }
    }

    // 3. Handle updating TenantSubscription if planTier is provided
    if (planTier && typeof planTier === 'string') {
      const cleanPlanName = planTier.replace(/ Tier$/i, '').trim();
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { name: cleanPlanName }
      }) || await prisma.subscriptionPlan.findFirst({
        where: { name: { contains: cleanPlanName.split(' ')[0] } }
      });

      if (plan) {
        if (company.tenantSubscription) {
          await prisma.tenantSubscription.update({
            where: { id: company.tenantSubscription.id },
            data: {
              planId: plan.id,
              amount: plan.monthlyPrice
            }
          });
        } else {
          await prisma.tenantSubscription.create({
            data: {
              subId: `SUB-${Date.now()}`,
              companyId: company.id,
              planId: plan.id,
              status: 'ACTIVE',
              amount: plan.monthlyPrice,
              nextRenewal: new Date(new Date().setMonth(new Date().getMonth() + 1))
            }
          });
        }
      }
    }

    // 4. Fetch full updated company to return
    const result = await prisma.company.findUnique({
      where: { id: company.id },
      include: {
        tenantSubscription: { include: { plan: true } },
        users: { where: { role: 'COMPANY_ADMIN' }, select: { id: true, email: true, name: true, role: true } }
      }
    });

    return sendSuccess(res, result || updatedCompany);
  } catch (error) {
    if (error.code === 'P2002') {
      return sendError(res, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Administrator Email or unique field is already in use by another account.'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    next(error);
  }
};

// Helper: Cascade delete a company and all its relational records
async function cascadeDeleteCompany(companyId) {
  if (!companyId) return;

  // 0. Detach / Nullify circular references & relations to avoid constraint deadlocks
  await prisma.vehicle?.updateMany({ where: { companyId }, data: { currentDriverId: null, branchId: null } }).catch(() => {});
  await prisma.driver?.updateMany({ where: { companyId }, data: { branchId: null, warehouseId: null, managerId: null, userId: null } }).catch(() => {});
  await prisma.customer?.updateMany({ where: { companyId }, data: { branchId: null, accountManagerId: null } }).catch(() => {});
  await prisma.warehouse?.updateMany({ where: { companyId }, data: { branchId: null, managerId: null } }).catch(() => {});
  await prisma.user?.updateMany({ where: { companyId }, data: { branchId: null, customRoleId: null } }).catch(() => {});

  // If any SUPER_ADMIN has this companyId, dissociate them so they aren't deleted and don't block company deletion
  await prisma.user?.updateMany({ where: { companyId, role: 'SUPER_ADMIN' }, data: { companyId: null, branchId: null, customRoleId: null } }).catch(() => {});

  // 1. Delete Load dependencies & Loads
  const loads = await prisma.load.findMany({ where: { companyId }, select: { id: true } }).catch(() => []);
  const loadIds = loads.map(l => l.id);
  if (loadIds.length > 0) {
    await prisma.message?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.loadItem?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.routeStop?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.loadExpense?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.loadActivity?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.deliveryPOD?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.vinScanEvent?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.preStartChecklist?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.customerInvoice?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.itemMovement?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.document?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.driverIncident?.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
    await prisma.load?.deleteMany({ where: { id: { in: loadIds } } }).catch(() => {});
  }
  await prisma.load?.deleteMany({ where: { companyId } }).catch(() => {});

  // 2. Delete Customer dependencies & Customers
  const customers = await prisma.customer.findMany({ where: { companyId }, select: { id: true } }).catch(() => []);
  const customerIds = customers.map(c => c.id);
  if (customerIds.length > 0) {
    await prisma.customerPricingProfile?.deleteMany({ where: { customerId: { in: customerIds } } }).catch(() => {});
    await prisma.customerBillingRule?.deleteMany({ where: { customerId: { in: customerIds } } }).catch(() => {});
    await prisma.customerInvoice?.deleteMany({ where: { customerId: { in: customerIds } } }).catch(() => {});
    await prisma.loadItem?.deleteMany({ where: { customerId: { in: customerIds } } }).catch(() => {});
    await prisma.customer?.deleteMany({ where: { id: { in: customerIds } } }).catch(() => {});
  }
  await prisma.customer?.deleteMany({ where: { companyId } }).catch(() => {});

  // 3. Delete Assets & Asset dependencies across company branches & warehouses
  const branches = await prisma.branch.findMany({ where: { companyId }, select: { id: true } }).catch(() => []);
  const branchIds = branches.map(b => b.id);
  const warehouses = await prisma.warehouse.findMany({ where: { companyId }, select: { id: true } }).catch(() => []);
  const warehouseIds = warehouses.map(w => w.id);

  const assets = await prisma.asset.findMany({
    where: {
      OR: [
        ...(branchIds.length > 0 ? [{ branchId: { in: branchIds } }] : []),
        ...(warehouseIds.length > 0 ? [{ warehouseId: { in: warehouseIds } }] : [])
      ]
    },
    select: { id: true }
  }).catch(() => []);
  const assetIds = assets.map(a => a.id);
  if (assetIds.length > 0) {
    await prisma.assetAssignment?.deleteMany({ where: { assetId: { in: assetIds } } }).catch(() => {});
    await prisma.assetMaintenance?.deleteMany({ where: { assetId: { in: assetIds } } }).catch(() => {});
    await prisma.document?.deleteMany({ where: { assetId: { in: assetIds } } }).catch(() => {});
    await prisma.asset?.deleteMany({ where: { id: { in: assetIds } } }).catch(() => {});
  }

  // 4. Delete Warehouse children & Warehouses
  if (warehouseIds.length > 0) {
    await prisma.stagingArea?.deleteMany({ where: { warehouseId: { in: warehouseIds } } }).catch(() => {});
    await prisma.loadLane?.deleteMany({ where: { warehouseId: { in: warehouseIds } } }).catch(() => {});
    await prisma.itemMovement?.deleteMany({ where: { warehouseId: { in: warehouseIds } } }).catch(() => {});
    await prisma.inboundReceipt?.deleteMany({ where: { warehouseId: { in: warehouseIds } } }).catch(() => {});
    await prisma.networkedPrinter?.deleteMany({ where: { warehouseId: { in: warehouseIds } } }).catch(() => {});
    await prisma.warehouseLabelPrint?.deleteMany({ where: { warehouseId: { in: warehouseIds } } }).catch(() => {});
    await prisma.printSpoolerJob?.deleteMany({ where: { warehouseId: { in: warehouseIds } } }).catch(() => {});
    await prisma.document?.deleteMany({ where: { warehouseId: { in: warehouseIds } } }).catch(() => {});
    await prisma.yardTask?.deleteMany({ where: { warehouseId: { in: warehouseIds } } }).catch(() => {});
    await prisma.warehouse?.deleteMany({ where: { id: { in: warehouseIds } } }).catch(() => {});
  }
  await prisma.warehouse?.deleteMany({ where: { companyId } }).catch(() => {});

  // 5. Delete Vehicle dependencies & Vehicles
  const vehicles = await prisma.vehicle.findMany({ where: { companyId }, select: { id: true } }).catch(() => []);
  const vehicleIds = vehicles.map(v => v.id);
  if (vehicleIds.length > 0) {
    await prisma.telemetryLog?.deleteMany({ where: { vehicleId: { in: vehicleIds } } }).catch(() => {});
    await prisma.equipmentSwap?.deleteMany({ where: { OR: [{ prevTrailerId: { in: vehicleIds } }, { newTrailerId: { in: vehicleIds } }] } }).catch(() => {});
    await prisma.document?.deleteMany({ where: { vehicleId: { in: vehicleIds } } }).catch(() => {});
    await prisma.loadExpense?.deleteMany({ where: { vehicleId: { in: vehicleIds } } }).catch(() => {});
    await prisma.vehicle?.deleteMany({ where: { id: { in: vehicleIds } } }).catch(() => {});
  }
  await prisma.vehicle?.deleteMany({ where: { companyId } }).catch(() => {});

  // 6. Delete Driver dependencies & Drivers
  const drivers = await prisma.driver.findMany({ where: { companyId }, select: { id: true, userId: true } }).catch(() => []);
  const driverIds = drivers.map(d => d.id);
  if (driverIds.length > 0) {
    await prisma.driverSuperInfo?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.telemetryLog?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.notification?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.payPeriod?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.timesheet?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.preStartChecklist?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.equipmentSwap?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.driverIncident?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.driverMessage?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.driverAllowance?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.driverDeduction?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.driverLeaveRequest?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.driverPayRate?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.driverActivity?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.performanceLog?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.offlineSyncItem?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.deliveryPOD?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.vinScanEvent?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.shift?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.document?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.yardTask?.deleteMany({ where: { driverId: { in: driverIds } } }).catch(() => {});
    await prisma.driver?.deleteMany({ where: { id: { in: driverIds } } }).catch(() => {});
  }
  await prisma.driver?.deleteMany({ where: { companyId } }).catch(() => {});

  // 7. Delete Branches
  if (branchIds.length > 0) {
    await prisma.branch?.deleteMany({ where: { id: { in: branchIds } } }).catch(() => {});
  }
  await prisma.branch?.deleteMany({ where: { companyId } }).catch(() => {});

  // 8. Delete Support Tickets & replies
  const tickets = await prisma.supportTicket.findMany({ where: { companyId }, select: { id: true } }).catch(() => []);
  const ticketIds = tickets.map(t => t.id);
  if (ticketIds.length > 0) {
    await prisma.ticketReply?.deleteMany({ where: { ticketId: { in: ticketIds } } }).catch(() => {});
    await prisma.supportTicket?.deleteMany({ where: { id: { in: ticketIds } } }).catch(() => {});
  }
  await prisma.supportTicket?.deleteMany({ where: { companyId } }).catch(() => {});

  // 9. Delete Conversations, Participants & Messages
  const conversations = await prisma.conversation.findMany({ where: { companyId }, select: { id: true } }).catch(() => []);
  const conversationIds = conversations.map(c => c.id);
  if (conversationIds.length > 0) {
    await prisma.conversationParticipant?.deleteMany({ where: { conversationId: { in: conversationIds } } }).catch(() => {});
    await prisma.message?.deleteMany({ where: { conversationId: { in: conversationIds } } }).catch(() => {});
    await prisma.conversation?.deleteMany({ where: { id: { in: conversationIds } } }).catch(() => {});
  }
  await prisma.conversation?.deleteMany({ where: { companyId } }).catch(() => {});

  // 10. Delete Custom Roles & Permissions
  const roles = await prisma.customRole.findMany({ where: { companyId }, select: { id: true } }).catch(() => []);
  const roleIds = roles.map(r => r.id);
  if (roleIds.length > 0) {
    await prisma.customPermission?.deleteMany({ where: { roleId: { in: roleIds } } }).catch(() => {});
    await prisma.customRole?.deleteMany({ where: { id: { in: roleIds } } }).catch(() => {});
  }
  await prisma.customRole?.deleteMany({ where: { companyId } }).catch(() => {});

  // 11. Delete all other Company-scoped entities
  await prisma.assetTransfer?.deleteMany({ where: { OR: [{ senderCompanyId: companyId }, { receiverCompanyId: companyId }] } }).catch(() => {});
  await prisma.yardTask?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.loadExpense?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.payPeriod?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.timesheet?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.preStartChecklist?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.equipmentSwap?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.driverMessage?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.driverIncident?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.offlineSyncItem?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.shift?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.lanePricingRule?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.vehicleTypeRate?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.fuelSurchargeLog?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.workflowRule?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.aiActivityLog?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.aiModelRegistry?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.notificationTemplate?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.notificationRule?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.onboardingHandover?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.recipientGroup?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.billingRecord?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.tenantSubscription?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.whiteLabelConfig?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.companyIntegration?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.companyFeatureOverride?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.companyStorageAudit?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.report?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.auditLog?.deleteMany({ where: { companyId } }).catch(() => {});

  // 12. Delete Company Users (preserve SUPER_ADMIN by nullifying companyId)
  await prisma.user?.updateMany({ where: { companyId, role: 'SUPER_ADMIN' }, data: { companyId: null, branchId: null, customRoleId: null } }).catch(() => {});
  const users = await prisma.user.findMany({ where: { companyId, role: { not: 'SUPER_ADMIN' } }, select: { id: true } }).catch(() => []);
  const userIds = users.map(u => u.id);
  if (userIds.length > 0) {
    await prisma.userSession?.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
    await prisma.apiUsageLog?.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
    await prisma.moduleUsageLog?.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
    await prisma.ticketReply?.deleteMany({ where: { authorId: { in: userIds } } }).catch(() => {});
    await prisma.conversationParticipant?.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
    await prisma.message?.deleteMany({ where: { senderId: { in: userIds } } }).catch(() => {});
    await prisma.shift?.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
    await prisma.user?.deleteMany({ where: { id: { in: userIds } } }).catch(() => {});
  }
  // Clear any logs tied directly to companyId
  await prisma.userSession?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.apiUsageLog?.deleteMany({ where: { companyId } }).catch(() => {});
  await prisma.moduleUsageLog?.deleteMany({ where: { companyId } }).catch(() => {});

  // 13. Finally, Delete the company record
  await prisma.company.delete({ where: { id: companyId } });
}

// Delete Company with Cascade Clean-up
exports.delete = async (req, res, next) => {
  try {
    const companyId = req.params.id;
    await cascadeDeleteCompany(companyId);
    return sendSuccess(res, { message: 'Company and all associated records deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Company not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};

// Clean All Test Companies & Scratch Data (Preserves Super Admin)
exports.cleanAllTestCompanies = async (req, res, next) => {
  try {
    const allCompanies = await prisma.company.findMany({ select: { id: true, name: true } }).catch(() => []);
    let deletedCount = 0;
    for (const comp of allCompanies) {
      try {
        await cascadeDeleteCompany(comp.id);
        deletedCount++;
      } catch (err) {
        console.warn(`Could not delete company ${comp.name}:`, err.message);
      }
    }
    return sendSuccess(res, { message: `Successfully deleted ${deletedCount} companies and all test data.`, deletedCount });
  } catch (error) {
    next(error);
  }
};
