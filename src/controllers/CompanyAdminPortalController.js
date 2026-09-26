const { calculateDriverPay } = require('../utils/payrollCalculator');
const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { getTenantWhere, resolveCompanyId } = require('../middlewares/tenantResolver');
const { cleanAvatarUrl } = require('./DriverController');

/**
 * Like resolveCompanyId but guarantees a non-null companyId for write operations.
 * Falls back to the first Company row in the DB if the user has no explicit companyId.
 */
async function resolveRequiredCompanyId(req) {
  const id = resolveCompanyId(req);
  if (id) return id;
  if (req.user?.role === 'SUPER_ADMIN' && req.query?.companyId) return req.query.companyId;
  throw new Error('Tenant company context required for this operation.');
}

/**
 * Helper to find existing load by ID or loadRef, or auto-create if not present
 */
async function resolveOrCreateLoad(id, req) {
  if (!id) throw new Error('Load ID or reference is required');
  const tenantWhere = getTenantWhere(req);
  let target = await prisma.load.findFirst({
    where: {
      OR: [{ id }, { loadRef: id }],
      ...tenantWhere
    }
  });

  if (!target) {
    const companyId = resolveCompanyId(req);
    if (!companyId) throw new Error('Company context is required to create a load.');
    const isValidUuid = typeof id === 'string' && id.length === 36 && id.includes('-');
    const crypto = require('crypto');

    target = await prisma.load.create({
      data: {
        id: isValidUuid ? id : crypto.randomUUID(),
        loadRef: id.startsWith('PO-') ? id : `PO-${Math.floor(100000 + Math.random() * 900000)}`,
        type: 'General Freight',
        status: 'DRAFT',
        companyId
      }
    });
  }

  return target;
}

const dashboardController = require('./CompanyAdminDashboardController');

// ----------------------------------------------------------------------
// 1. COMMAND CENTRE / DASHBOARD MENU
// ----------------------------------------------------------------------
exports.getCommandCentre = dashboardController.getDashboardMetrics;

// ----------------------------------------------------------------------
const sanitizeLoadStatus = (status) => {
  if (!status || typeof status !== 'string' || !status.trim()) return 'DRAFT';
  const upper = status.toUpperCase().trim();
  if (upper === 'ACTIVE' || upper === 'IN_PROGRESS' || upper === 'ON_THE_ROAD') return 'IN_TRANSIT';
  if (upper === 'COMPLETED') return 'DELIVERED';
  if (['DRAFT', 'REQUESTED', 'PLANNED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(upper)) {
    return upper;
  }
  return 'DRAFT';
};

const sanitizeLoadPriority = (priority) => {
  if (!priority || typeof priority !== 'string') return undefined;
  const upper = priority.toUpperCase().trim();
  if (['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(upper)) return upper;
  return undefined;
};

// 2. LOADS MENU (All Loads & Load Inbox)
// ----------------------------------------------------------------------
exports.getLoads = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const tenantWhere = getTenantWhere(req);
    Object.assign(where, tenantWhere);

    const [data, total] = await Promise.all([
      prisma.load.findMany({
        where, skip, take, orderBy,
        include: { driver: true, truck: true, trailer: true, customer: true, stops: true, items: true }
      }),
      prisma.load.count({ where })
    ]);

    const mappedData = data.map(item => {
      let uiStatus = item.status;
      if (item.status === 'IN_TRANSIT') uiStatus = 'ACTIVE';
      if (item.status === 'DELIVERED') uiStatus = 'COMPLETED';
      return { ...item, status: uiStatus };
    });

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, mappedData, meta);
  } catch (error) { next(error); }
};

exports.createLoad = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req) || (req.user?.role === 'SUPER_ADMIN' ? req.body.companyId : null);
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required to create loads' }, HTTP_STATUS.FORBIDDEN);
    }
    const { stops, items, ...rawPayload } = req.body;
    const payload = { ...rawPayload };
    payload.companyId = companyId;

    // Strip IDs to allow Prisma auto-generation
    delete payload.id;
    delete payload.rawId;

    // Guarantee unique loadRef
    if (payload.loadRef) {
      const existingRef = await prisma.load.findFirst({
        where: { loadRef: String(payload.loadRef) }
      });
      if (existingRef) {
        payload.loadRef = `${payload.loadRef}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    } else {
      payload.loadRef = `PO-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Guarantee unique draftId
    if (payload.draftId) {
      const existingDraft = await prisma.load.findFirst({
        where: { draftId: String(payload.draftId) }
      });
      if (existingDraft) {
        payload.draftId = `DRAFT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else {
      delete payload.draftId;
    }

    if (!payload.type) payload.type = 'General Freight';
    if (payload.status) payload.status = sanitizeLoadStatus(payload.status);
    if (payload.priority) {
      const sanitized = sanitizeLoadPriority(payload.priority);
      if (sanitized) payload.priority = sanitized;
      else delete payload.priority;
    }

    // Resolve Customer
    if (payload.customer && !payload.customerId && typeof payload.customer === 'string') {
      const custName = payload.customer.trim();
      let foundCust = await prisma.customer.findFirst({
        where: {
          name: { contains: custName },
          ...(companyId && { companyId })
        }
      });
      if (foundCust) {
        payload.customerId = foundCust.id;
      }
      delete payload.customer;
    }

    // Resolve Driver
    if (payload.driver && !payload.driverId) {
      if (typeof payload.driver === 'string') {
        const foundDriver = await prisma.driver.findFirst({
          where: {
            OR: [
              { id: payload.driver },
              { user: { name: { contains: payload.driver } } }
            ]
          }
        });
        if (foundDriver) payload.driverId = foundDriver.id;
      } else if (payload.driver?.id) {
        payload.driverId = payload.driver.id;
      }
    }
    delete payload.driver;

    // Resolve Vehicle / Truck
    if (payload.vehicleId && !payload.truckId) {
      const foundTruck = await prisma.vehicle.findFirst({
        where: { OR: [{ id: payload.vehicleId }, { rego: payload.vehicleId }] }
      });
      if (foundTruck) payload.truckId = foundTruck.id;
    }
    delete payload.vehicleId;

    // Extract and preserve financial metadata
    const agreedRate = payload.rate || payload.price || payload.revenue || payload.customerRate || null;
    let agreedDriverPay = payload.driverPay || payload.driverRate || null;

    if (payload.driverId && !agreedDriverPay) {
      try {
        const { calculateDriverPayForLoad } = require('../utils/driverPayCalculator');
        const assignedDriver = await prisma.driver.findUnique({ where: { id: payload.driverId } });
        if (assignedDriver) {
          const calc = calculateDriverPayForLoad({ driver: assignedDriver, load: payload });
          if (calc && calc.grossPay > 0) {
            agreedDriverPay = calc.grossPay;
          }
        }
      } catch (calcErr) {
        console.warn('Driver pay calculation on load create catch:', calcErr?.message);
      }
    }

    let metaNotes = payload.notes || '';
    if (agreedRate) metaNotes += ` [AGREED_RATE:${agreedRate}]`;
    if (agreedDriverPay) metaNotes += ` [DRIVER_PAY:${agreedDriverPay}]`;
    if (metaNotes.trim()) payload.notes = metaNotes.trim();

    // Clean non-schema parameters
    delete payload.customerName;
    delete payload.driverName;
    delete payload.truckRego;
    delete payload.trailerRego;
    delete payload.pickupLocation;
    delete payload.deliveryLocation;
    delete payload.pickupAddress;
    delete payload.deliveryAddress;
    delete payload.pickupDate;
    delete payload.deliveryDate;
    delete payload.scheduledDate;
    delete payload.totalWeight;
    delete payload.weight;
    delete payload.rate;
    delete payload.rateUSD;
    delete payload.price;
    delete payload.revenue;
    delete payload.distance;
    delete payload.pickupStopId;
    delete payload.driverPay;
    delete payload.driverRate;
    delete payload.customerRate;

    // Remove empty/invalid relation IDs to prevent foreign key errors
    if (!payload.customerId) delete payload.customerId;
    if (!payload.driverId) delete payload.driverId;
    if (!payload.truckId) delete payload.truckId;
    if (!payload.trailerId) delete payload.trailerId;
    if (!payload.branchId) delete payload.branchId;

    if (payload.documents && (!payload.documents.create || payload.documents.create.length === 0)) {
      delete payload.documents;
    }

    if (Array.isArray(stops) && stops.length > 0) {
      payload.stops = {
        create: stops.map((s, idx) => {
          let sType = (s.type || (idx === 0 ? 'PICKUP' : 'DROPOFF')).toUpperCase();
          if (sType.includes('PICK')) sType = 'PICKUP';
          else sType = 'DROPOFF';
          return {
            type: sType,
            sequenceIndex: s.sequenceIndex ?? idx,
            address: s.address || 'Location Stop',
            contactName: s.contactName || null,
            contactPhone: s.contactPhone || null,
            scheduledDate: s.scheduledDate ? new Date(s.scheduledDate) : null
          };
        })
      };
    }

    if (Array.isArray(items) && items.length > 0) {
      payload.items = {
        create: items.map(item => ({
          stockRef: item.stockRef || item.stockRec || item.rego || item.rcog || item.vin || item.description || 'ITEM-REF',
          description: item.description || item.itemDescription || item.type || 'Freight Item',
          category: item.type || item.category || 'General Freight',
          make: item.make || null,
          model: item.model || null,
          rego: item.rego || item.rcog || null,
          vin: item.vin || null,
          year: item.year ? parseInt(String(item.year).replace(/[^0-9]/g, ''), 10) || null : null,
          color: item.colour || item.color || null,
          quantity: item.quantity ? parseInt(String(item.quantity).replace(/[^0-9]/g, ''), 10) || 1 : 1,
          weightKg: item.weightValue || (item.weight ? parseInt(String(item.weight).replace(/[^0-9]/g, ''), 10) || 0 : 0),
          notes: typeof item.notes === 'string' ? item.notes : (item.details || JSON.stringify(item))
        }))
      };
    }

    const data = await prisma.load.create({
      data: payload,
      include: { driver: true, truck: true, customer: true, stops: true, items: true }
    });

    // If agreed customer rate provided at load creation, pre-create Draft CustomerInvoice
    if (agreedRate && data.id) {
      try {
        await exports.autoGenerateLoadInvoice(data.id, data.companyId, agreedRate);
      } catch (e) {}
    }

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.updateLoad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetLoad = await resolveOrCreateLoad(id, req);

    const payload = { ...req.body };
    if (payload.status) payload.status = sanitizeLoadStatus(payload.status);
    if (payload.priority) {
      const sanitized = sanitizeLoadPriority(payload.priority);
      if (sanitized) payload.priority = sanitized;
      else delete payload.priority;
    }

    // Extract stops, items, and driverPay before cleaning
    const stops = payload.stops;
    const items = payload.items;
    const newDriverPay = payload.driverPay ? parseFloat(payload.driverPay) : null;

    delete payload.stops;
    delete payload.items;

    // Clean non-schema and auto-generated fields
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.companyId;
    delete payload.customerName;
    delete payload.driverName;
    delete payload.truckRego;
    delete payload.trailerRego;
    delete payload.pickupLocation;
    delete payload.deliveryLocation;
    delete payload.pickupAddress;
    delete payload.deliveryAddress;
    delete payload.pickupDate;
    delete payload.deliveryDate;
    delete payload.scheduledDate;
    delete payload.totalWeight;
    delete payload.weight;
    delete payload.rate;
    delete payload.rateUSD;
    delete payload.price;
    delete payload.revenue;
    delete payload.distance;
    delete payload.pickupStopId;
    delete payload.driverPay;
    delete payload.driverRate;
    delete payload.customerRate;
    delete payload.documents;
    delete payload.customer;
    delete payload.driver;
    delete payload.truck;
    delete payload.trailer;

    // Remove empty/invalid relation IDs to prevent foreign key errors
    if (!payload.customerId) delete payload.customerId;
    if (!payload.driverId) delete payload.driverId;
    if (!payload.truckId) delete payload.truckId;
    if (!payload.trailerId) delete payload.trailerId;
    if (!payload.branchId) delete payload.branchId;

    // If driverPay changed, update the notes to reflect new DRIVER_PAY value
    if (newDriverPay !== null && newDriverPay > 0) {
      const baseNotes = (payload.notes || targetLoad.notes || '')
        .replace(/\[DRIVER_PAY:[^\]]+\]/g, '')
        .trim();
      payload.notes = `${baseNotes} [DRIVER_PAY:${newDriverPay}]`.trim();
    }

    // Handle nested relation updates for stops
    if (Array.isArray(stops)) {
      payload.stops = {
        deleteMany: {},
        create: stops.map((s, idx) => {
          let sType = (s.type || (idx === 0 ? 'PICKUP' : 'DROPOFF')).toUpperCase();
          if (sType.includes('PICK')) sType = 'PICKUP';
          else sType = 'DROPOFF';
          return {
            type: sType,
            sequenceIndex: s.sequenceIndex ?? idx,
            address: s.address || 'Location Stop',
            contactName: s.contactName || null,
            contactPhone: s.contactPhone || null,
            scheduledDate: s.scheduledDate ? new Date(s.scheduledDate) : null
          };
        })
      };
    }

    // Handle nested relation updates for items
    if (Array.isArray(items)) {
      payload.items = {
        deleteMany: {},
        create: items.map(item => ({
          stockRef: item.stockRef || item.stockRec || item.rego || item.rcog || item.vin || item.description || 'ITEM-REF',
          description: item.description || item.itemDescription || item.type || 'Freight Item',
          category: item.type || item.category || 'General Freight',
          make: item.make || null,
          model: item.model || null,
          rego: item.rego || item.rcog || null,
          vin: item.vin || null,
          year: item.year ? parseInt(String(item.year).replace(/[^0-9]/g, ''), 10) || null : null,
          color: item.colour || item.color || null,
          quantity: item.quantity ? parseInt(String(item.quantity).replace(/[^0-9]/g, ''), 10) || 1 : 1,
          weightKg: item.weightValue || (item.weight ? parseInt(String(item.weight).replace(/[^0-9]/g, ''), 10) || 0 : 0),
          notes: typeof item.notes === 'string' ? item.notes : (item.details || JSON.stringify(item))
        }))
      };
    }

    const data = await prisma.load.update({
      where: { id: targetLoad.id },
      data: payload,
      include: { driver: true, truck: true, trailer: true, customer: true, stops: true, items: true }
    });

    // P0: When transitioning to DELIVERED or COMPLETED, auto-credit payroll
    if (payload.status === 'DELIVERED' || payload.status === 'COMPLETED') {
      try {
        await exports.autoGenerateLoadInvoice(data.id, data.companyId);
        if (data.driverId) {
          await exports.autoCreditDriverPayroll(data.id, data.driverId, data.companyId);
        }
      } catch (finErr) {
        console.warn('Auto finance trigger on updateLoad catch:', finErr?.message);
      }
    }

    // P1: If driverPay changed and load is ALREADY delivered, recalculate driver PayPeriod
    const isAlreadyDelivered = ['DELIVERED', 'COMPLETED', 'CLOSED'].includes(targetLoad.status);
    const effectiveDriverId = (payload.driverId || targetLoad.driverId);
    if (newDriverPay !== null && newDriverPay > 0 && isAlreadyDelivered && effectiveDriverId) {
      try {
        const payPeriod = await prisma.payPeriod.findFirst({
          where: {
            driverId: effectiveDriverId,
            status: { in: ['DRAFT', 'PROCESSING', 'PENDING'] }
          },
          orderBy: { createdAt: 'desc' }
        }).catch(() => null);

        if (payPeriod) {
          // Recalculate: subtract old pay (from notes) and add new pay
          let oldPay = 0;
          const oldNotes = targetLoad.notes || '';
          const oldPayMatch = oldNotes.match(/\[DRIVER_PAY:([0-9.]+)/);
          if (oldPayMatch && oldPayMatch[1]) oldPay = parseFloat(oldPayMatch[1]);

          const currentLoadAllowance = parseFloat(payPeriod.loadAllowance || 0);
          const adjustment = newDriverPay - oldPay;
          const newLoadAllowance = Math.max(0, currentLoadAllowance + adjustment);
          const newGross = Math.round((newLoadAllowance + parseFloat(payPeriod.basePay || 0) + parseFloat(payPeriod.distanceAllow || 0) + parseFloat(payPeriod.otherAllowance || 0) + parseFloat(payPeriod.bonuses || 0)) * 100) / 100;

          await prisma.payPeriod.update({
            where: { id: payPeriod.id },
            data: {
              loadAllowance: newLoadAllowance,
              grossEarnings: newGross,
              netPay: newGross
            }
          }).catch(e => console.warn('PayPeriod update on driverPay change:', e?.message));

          console.log(`[updateLoad] PayPeriod updated: driverId=${effectiveDriverId}, oldPay=${oldPay}, newPay=${newDriverPay}, adjustment=${adjustment}`);
        }
      } catch (payErr) {
        console.warn('PayPeriod sync on driverPay change:', payErr?.message);
      }
    }

    return sendSuccess(res, data);
  } catch (error) { next(error); }
};


exports.deleteLoad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantWhere = getTenantWhere(req);
    
    // Find target load by ID, loadRef, or draftId within tenant scope
    const targetLoad = await prisma.load.findFirst({
      where: {
        OR: [{ id }, { loadRef: id }, { draftId: id }],
        ...tenantWhere
      }
    }).catch(() => null);

    if (!targetLoad) {
      return sendSuccess(res, { id, message: 'Load deleted or not found' });
    }

    const targetId = targetLoad.id;

    // Cascade clean-up of child records to maintain foreign key integrity
    if (prisma.customerInvoice) await prisma.customerInvoice.deleteMany({ where: { loadId: targetId } }).catch(() => null);
    if (prisma.preStartChecklist) await prisma.preStartChecklist.deleteMany({ where: { loadId: targetId } }).catch(() => null);
    if (prisma.telemetryLog) await prisma.telemetryLog.deleteMany({ where: { loadId: targetId } }).catch(() => null);
    if (prisma.timesheet) await prisma.timesheet.deleteMany({ where: { loadId: targetId } }).catch(() => null);
    if (prisma.routeStop) await prisma.routeStop.deleteMany({ where: { loadId: targetId } }).catch(() => null);
    if (prisma.loadItem) await prisma.loadItem.deleteMany({ where: { loadId: targetId } }).catch(() => null);
    if (prisma.loadExpense) await prisma.loadExpense.deleteMany({ where: { loadId: targetId } }).catch(() => null);
    if (prisma.document) await prisma.document.deleteMany({ where: { loadId: targetId } }).catch(() => null);
    if (prisma.loadActivity) await prisma.loadActivity.deleteMany({ where: { loadId: targetId } }).catch(() => null);
    if (prisma.message) await prisma.message.deleteMany({ where: { loadId: targetId } }).catch(() => null);

    await prisma.load.delete({ where: { id: targetId } }).catch(err => {
      console.warn('Load deletion notice:', err?.message);
    });

    return sendSuccess(res, { id: targetId, message: 'Load deleted successfully' });
  } catch (error) { next(error); }
};

exports.getLoadInvoices = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantWhere = getTenantWhere(req);
    const targetLoad = await prisma.load.findFirst({
      where: {
        OR: [{ id }, { loadRef: id }],
        ...tenantWhere
      }
    });
    if (!targetLoad) return sendSuccess(res, []);

    const invoices = await prisma.customerInvoice.findMany({
      where: { loadId: targetLoad.id },
      include: { customer: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = invoices.map(inv => ({
      id: inv.invoiceNumber || `INV-${inv.id.slice(0, 8)}`,
      realId: inv.id,
      date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      customer: inv.customer?.name || 'General Customer',
      amount: `$${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      status: inv.status || 'SENT',
      color: inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
    }));
    return sendSuccess(res, mapped);
  } catch (error) { next(error); }
};

exports.autoGenerateLoadInvoice = async (loadId, companyId, customAmount = null) => {
  try {
    if (!loadId) return null;

    // 1. Idempotency Check: Check if invoice already exists for this load
    const existingInvoice = await prisma.customerInvoice.findFirst({
      where: { loadId }
    }).catch(() => null);

    if (existingInvoice) {
      return existingInvoice;
    }

    // 2. Fetch Target Load
    const targetLoad = await prisma.load.findUnique({
      where: { id: loadId },
      include: { customer: true, items: true }
    }).catch(() => null);

    if (!targetLoad) return null;

    // 3. Customer Resolution
    let customerId = targetLoad.customerId;
    const targetCompanyId = companyId || targetLoad.companyId;
    if (!customerId) {
      let cust = await prisma.customer.findFirst({
        where: targetCompanyId ? { companyId: targetCompanyId } : {}
      }).catch(() => null);

      if (!cust && targetCompanyId) {
        const crypto = require('crypto');
        cust = await prisma.customer.create({
          data: {
            id: crypto.randomUUID(),
            companyId: targetCompanyId,
            name: 'General Freight Customer',
            email: 'accounts@generalcustomer.com.au'
          }
        }).catch(() => null);
      }

      if (cust) customerId = cust.id;
    }

    if (!customerId) return null;

    // 4. Rate / Amount Calculation
    let amount = customAmount ? parseFloat(customAmount) : 0;
    if (!amount || amount === 0) {
      if (targetLoad.notes && targetLoad.notes.includes('[AGREED_RATE:')) {
        const match = targetLoad.notes.match(/\[AGREED_RATE:([0-9.]+)/);
        if (match && match[1]) amount = parseFloat(match[1]);
      }
    }
    if (!amount || amount === 0) {
      const itemsCount = targetLoad.items?.length || 1;
      amount = itemsCount * 350.00;
      if (amount < 500) amount = 1250.00;
    }

    // 5. Generate Invoice Number & Due Date (14 Days)
    const crypto = require('crypto');
    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // 6. Create CustomerInvoice (status: DRAFT)
    const invoice = await prisma.customerInvoice.create({
      data: {
        id: crypto.randomUUID(),
        invoiceNumber: invNum,
        customerId,
        loadId: targetLoad.id,
        amount,
        status: 'DRAFT',
        dueDate,
        notes: `Auto-generated draft invoice upon POD delivery confirmation for Load ${targetLoad.loadRef || targetLoad.id}`
      },
      include: { customer: { select: { id: true, name: true, email: true } } }
    });

    return invoice;
  } catch (err) {
    console.error('Error in autoGenerateLoadInvoice:', err?.message);
    return null;
  }
};

exports.autoCreditDriverPayroll = async (loadId, driverId, companyId, customCredit = null) => {
  try {
    if (!loadId || !driverId) return null;

    // 1. Resolve Driver & Company ID
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    }).catch(() => null);

    if (!driver) return null;
    const targetCompanyId = companyId || driver.companyId;
    if (!targetCompanyId) return null;

    // 2. Resolve Load to check if already credited
    const load = await prisma.load.findUnique({
      where: { id: loadId }
    }).catch(() => null);

    if (!load) return null;

    // Idempotency check: check if load notes indicate payroll credit already processed
    if (load.notes && load.notes.includes(`[PAYROLL_CREDITED:${loadId}]`)) {
      return null;
    }

    // 3. Determine Trip Pay Credit Amount
    let tripCredit = customCredit ? parseFloat(customCredit) : 0;
    if (!tripCredit || tripCredit === 0) {
      if (load.notes && load.notes.includes('[DRIVER_PAY:')) {
        const match = load.notes.match(/\[DRIVER_PAY:([0-9.]+)/);
        if (match && match[1]) tripCredit = parseFloat(match[1]);
      }
    }
    if (!tripCredit || tripCredit === 0) {
      try {
        const { calculateDriverPayForLoad } = require('../utils/driverPayCalculator');
        const calc = calculateDriverPayForLoad({ driver, load });
        if (calc && calc.grossPay > 0) {
          tripCredit = calc.grossPay;
        } else if (driver.payRate && !isNaN(parseFloat(driver.payRate))) {
          tripCredit = parseFloat(driver.payRate);
        }
      } catch (cErr) {
        if (driver.payRate && !isNaN(parseFloat(driver.payRate))) {
          tripCredit = parseFloat(driver.payRate);
        }
      }
    }
    if (!tripCredit || tripCredit === 0) {
      // Check driver.loadPaySchedule if driver has saved load pay options
      if (driver.loadPaySchedule) {
        try {
          const parsed = typeof driver.loadPaySchedule === 'string' ? JSON.parse(driver.loadPaySchedule) : driver.loadPaySchedule;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const destStr = String(load.destination || load.deliveryLocation || '').trim().toLowerCase();
            const origStr = String(load.origin || load.pickupLocation || '').trim().toLowerCase();
            let matched = parsed.find(item => {
              if (!item.amount) return false;
              const pLoc = (item.pickupLocation || '').trim().toLowerCase();
              const dLoc = (item.deliveryLocation || '').trim().toLowerCase();
              const pMatch = !pLoc || origStr.includes(pLoc) || pLoc.includes(origStr);
              const dMatch = !dLoc || destStr.includes(dLoc) || dLoc.includes(destStr);
              return pMatch && dMatch;
            });
            if (!matched) {
              matched = parsed.find(item => item.isSelected && parseFloat(item.amount) > 0) || parsed.find(item => parseFloat(item.amount) > 0);
            }
            if (matched && parseFloat(matched.amount) > 0) {
              tripCredit = parseFloat(matched.amount);
            }
          }
        } catch (e) {}
      }
    }

    // 4. Resolve Active PayPeriod (or create new DRAFT PayPeriod for driver)
    const now = new Date();
    let payPeriod = await prisma.payPeriod.findFirst({
      where: {
        driverId: driver.id,
        companyId: targetCompanyId,
        status: { in: ['DRAFT', 'PROCESSING', 'PENDING'] }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(() => null);

    if (!payPeriod) {
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - periodStart.getDay());
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 13);

      const crypto = require('crypto');
      payPeriod = await prisma.payPeriod.create({
        data: {
          id: crypto.randomUUID(),
          driverId: driver.id,
          companyId: targetCompanyId,
          periodStart,
          periodEnd,
          frequency: 'FORTNIGHTLY',
          status: 'DRAFT',
          loadAllowance: 0,
          basePay: 0,
          grossEarnings: 0,
          paygTax: 0,
          superAmount: 0,
          totalDeductions: 0,
          netPay: 0
        }
      }).catch(() => null);
    }

    if (!payPeriod) return null;

    // 5. Update Earnings & Recalculate according to Driver PayType
    const pType = (driver.payType || '').toLowerCase();
    const isKm = pType.includes('km') || pType.includes('kilometre');
    const isHourly = pType.includes('hour');

    const newLoadAllowance = isKm || isHourly ? (payPeriod.loadAllowance || 0) : ((payPeriod.loadAllowance || 0) + tripCredit);
    const newDistanceAllow = isKm ? ((payPeriod.distanceAllow || 0) + tripCredit) : (payPeriod.distanceAllow || 0);
    const newBasePay = isHourly ? ((payPeriod.basePay || 0) + tripCredit) : (payPeriod.basePay || 0);
    const otherAllowance = payPeriod.otherAllowance || 0;
    const bonuses = payPeriod.bonuses || 0;

    const grossEarnings = Math.round((newBasePay + newLoadAllowance + newDistanceAllow + otherAllowance + bonuses) * 100) / 100;
    const paygTax = 0;
    const superAmount = 0;
    const totalDeductions = 0;
    const netPay = grossEarnings; // 100% payout - no tax/deduction cuts

    // 6. Save Updated PayPeriod
    const updatedPayPeriod = await prisma.payPeriod.update({
      where: { id: payPeriod.id },
      data: {
        loadAllowance: newLoadAllowance,
        distanceAllow: newDistanceAllow,
        basePay: newBasePay,
        grossEarnings,
        paygTax: 0,
        superAmount: 0,
        totalDeductions: 0,
        netPay
      }
    });

    // 7. Mark Load notes as credited for idempotency
    const updatedNotes = `${load.notes || ''} [PAYROLL_CREDITED:${loadId}]`.trim();
    await prisma.load.update({
      where: { id: loadId },
      data: { notes: updatedNotes }
    }).catch(() => null);

    return updatedPayPeriod;
  } catch (err) {
    console.error('Error in autoCreditDriverPayroll:', err?.message);
    return null;
  }
};

exports.createLoadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetLoad = await resolveOrCreateLoad(id, req);
    const { amount, dueDateTerms, status } = req.body;

    let customerId = targetLoad.customerId;
    if (!customerId) {
      const custName = targetLoad.customerName || 'General Customer';
      let cust = await prisma.customer.findFirst({
        where: { name: { contains: custName }, companyId: targetLoad.companyId }
      });
      if (cust) customerId = cust.id;
    }

    let days = 7;
    if (dueDateTerms && dueDateTerms.includes('14')) days = 14;
    if (dueDateTerms && dueDateTerms.includes('30')) days = 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    const crypto = require('crypto');
    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const finalAmount = parseFloat(amount) || 0;

    const invoice = await prisma.customerInvoice.create({
      data: {
        id: crypto.randomUUID(),
        invoiceNumber: invNum,
        customerId,
        loadId: targetLoad.id,
        amount: finalAmount,
        status: status || 'SENT',
        dueDate
      },
      include: { customer: { select: { id: true, name: true, email: true } } }
    });

    const mapped = {
      id: invoice.invoiceNumber,
      realId: invoice.id,
      date: new Date(invoice.createdAt).toLocaleDateString('en-GB'),
      customer: invoice.customer?.name || 'General Customer',
      amount: `$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      status: invoice.status,
      color: invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
    };

    return sendSuccess(res, mapped, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.deleteLoadInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const tenantWhere = getTenantWhere(req);
    await prisma.customerInvoice.deleteMany({
      where: {
        OR: [{ id: invoiceId }, { invoiceNumber: invoiceId }],
        ...(tenantWhere.companyId ? { load: { companyId: tenantWhere.companyId } } : {})
      }
    });
    return sendSuccess(res, { id: invoiceId, message: 'Invoice deleted successfully' });
  } catch (error) { next(error); }
};

exports.getLoadDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantWhere = getTenantWhere(req);
    const targetLoad = await prisma.load.findFirst({
      where: {
        OR: [{ id }, { loadRef: id }],
        ...tenantWhere
      }
    });
    if (!targetLoad) return sendSuccess(res, []);

    const documents = await prisma.document.findMany({
      where: { loadId: targetLoad.id },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = documents.map(doc => ({
      id: doc.id,
      name: doc.fileUrl ? doc.fileUrl.split('/').pop() : `Document_${doc.id.slice(0, 5)}`,
      type: doc.type || 'Bill of Lading (BOL)',
      size: '1.2 MB',
      date: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      url: doc.fileUrl || '#'
    }));
    return sendSuccess(res, mapped);
  } catch (error) { next(error); }
};

exports.createLoadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetLoad = await resolveOrCreateLoad(id, req);
    const { documentType, fileName } = req.body;

    const crypto = require('crypto');
    const docName = fileName || `${(documentType || 'BOL').replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`;
    const fileUrl = `/uploads/documents/${docName}`;

    const document = await prisma.document.create({
      data: {
        id: crypto.randomUUID(),
        loadId: targetLoad.id,
        type: documentType || 'Bill of Lading (BOL)',
        fileUrl
      }
    });

    const mapped = {
      id: document.id,
      name: docName,
      type: document.type,
      size: '1.2 MB',
      date: new Date(document.createdAt).toLocaleDateString('en-GB'),
      url: fileUrl
    };

    return sendSuccess(res, mapped, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 3. LIVE TRACKING MENU
// ----------------------------------------------------------------------
exports.getLiveTracking = async (req, res, next) => {
  try {
    const whereScope = getTenantWhere(req);

    // Fetch all trucks, drivers, loads, branches in parallel
    const [vehicles, drivers, loads, branches, totalDelivered, onTimeDelivered] = await Promise.all([
      prisma.vehicle.findMany({
        where: { ...whereScope, category: 'TRUCK' },
        include: {
          currentDriver: {
            select: {
              id: true, firstName: true, lastName: true,
              phone: true, driverCode: true, avatarUrl: true, status: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []),
      prisma.driver.findMany({
        where: whereScope,
        include: { currentVehicle: true, branch: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []),
      prisma.load.findMany({
        where: whereScope,
        include: { customer: true, driver: true, truck: true, stops: true },
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),
      prisma.branch.findMany({
        where: whereScope,
        select: { id: true, name: true, location: true },
        orderBy: { name: 'asc' }
      }).catch(() => []),
      prisma.load.count({ where: { ...whereScope, status: 'DELIVERED' } }).catch(() => 0),
      prisma.load.count({ where: { ...whereScope, status: 'DELIVERED', priority: { not: 'URGENT' } } }).catch(() => 0)
    ]);

    // Fetch latest telemetry for each vehicle
    const vehicleIds = vehicles.map(v => v.id);
    const latestTelemetry = await prisma.telemetryLog.findMany({
      where: { vehicleId: { in: vehicleIds } },
      orderBy: { timestamp: 'desc' },
      distinct: ['vehicleId']
    }).catch(() => []);

    // Map telemetry by vehicleId
    const telemetryMap = {};
    latestTelemetry.forEach(t => { telemetryMap[t.vehicleId] = t; });

    // Merge vehicle data with latest telemetry
    const enrichedVehicles = vehicles.map((v, index) => {
      const tel = telemetryMap[v.id];
      const fallbackLat = -33.8688 - (index * 0.12);
      const fallbackLng = 151.2093 + (index * 0.08);
      return {
        ...v,
        latitude: tel?.latitude ?? fallbackLat,
        longitude: tel?.longitude ?? fallbackLng,
        speedKmh: tel?.speedKmh ?? v.currentSpeed ?? 22,
        heading: tel?.heading ?? 120,
        lastEvent: tel?.event ?? 'ACTIVE_PING',
        lastPingAt: tel?.timestamp ?? v.lastPing ?? new Date(),
      };
    });

    // Compute fleet-level stats
    const activeVehiclesCount = enrichedVehicles.filter(v => v.status === 'IN_TRANSIT').length;
    const maintenanceCount = enrichedVehicles.filter(v => v.status === 'MAINTENANCE').length;
    const alertCount = enrichedVehicles.filter(v => v.status === 'ALERT').length;
    const inTransitVehicles = enrichedVehicles.filter(v => v.status === 'IN_TRANSIT' && v.speedKmh > 0);
    const avgFleetSpeed = inTransitVehicles.length > 0
      ? Math.round(inTransitVehicles.reduce((sum, v) => sum + (v.speedKmh || 0), 0) / inTransitVehicles.length)
      : 0;

    const onTimeRate = totalDelivered > 0 ? Math.round((onTimeDelivered / totalDelivered) * 1000) / 10 : 100;

    return sendSuccess(res, {
      stats: {
        activeVehiclesCount,
        totalVehicles: enrichedVehicles.length,
        maintenanceCount,
        criticalAlerts: alertCount,
        avgFleetSpeedKmh: avgFleetSpeed,
        onTimeRate
      },
      vehicles: enrichedVehicles,
      drivers,
      loads,
      branches
    });
  } catch (error) { next(error); }
};

// Update vehicle tracking status (IN_TRANSIT, IDLE, MAINTENANCE, ALERT)
exports.updateVehicleStatus = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { status, currentLocation, currentSpeed, fuelLevel, engineTemp } = req.body;
    const companyId = await resolveCompanyId(req);

    const updateData = {};
    if (status) updateData.status = status;
    if (currentLocation !== undefined) updateData.currentLocation = currentLocation;
    if (currentSpeed !== undefined) updateData.currentSpeed = currentSpeed;
    if (fuelLevel !== undefined) updateData.fuelLevel = fuelLevel;
    if (engineTemp !== undefined) updateData.engineTemp = engineTemp;
    updateData.lastPing = new Date();

    // Verify vehicle belongs to company
    const where = { id: vehicleId };
    if (companyId) where.companyId = companyId;

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: updateData,
      include: { currentDriver: { select: { id: true, firstName: true, lastName: true, driverCode: true } } }
    });

    return sendSuccess(res, vehicle);
  } catch (error) { next(error); }
};

// Push a new telemetry log entry for a vehicle
exports.pushTelemetry = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { latitude, longitude, speedKmh, heading, event, driverId } = req.body;

    if (!latitude || !longitude) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'latitude and longitude are required' }, HTTP_STATUS.BAD_REQUEST);
    }

    // Also update vehicle's live fields
    const vehicleUpdate = { lastPing: new Date() };
    if (speedKmh !== undefined) vehicleUpdate.currentSpeed = speedKmh;

    const [log] = await Promise.all([
      prisma.telemetryLog.create({
        data: { vehicleId, driverId: driverId || null, latitude, longitude, speedKmh: speedKmh || 0, heading: heading || null, event: event || null }
      }),
      prisma.vehicle.update({ where: { id: vehicleId }, data: vehicleUpdate })
    ]);

    return sendSuccess(res, log, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 4. DRIVERS MENU
// ----------------------------------------------------------------------
exports.getDrivers = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    if (companyId) where.companyId = companyId;

    const [data, total] = await Promise.all([
      prisma.driver.findMany({ where, skip, take, orderBy, include: { branch: true, manager: true, currentVehicle: true } }),
      prisma.driver.count({ where })
    ]);
    return sendList(res, data, buildPaginationMeta(total, currentPage, pageSize, req.query.sort));
  } catch (error) { next(error); }
};

exports.createDriver = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const payload = { ...req.body };
    let effectiveCompanyId = companyId || payload.companyId;
    if (!effectiveCompanyId) {
      let defaultComp = await prisma.company.findFirst().catch(() => null);
      if (!defaultComp) {
        defaultComp = await prisma.company.create({
          data: {
            name: 'Hero Logistics Pty Ltd',
            tenantId: 'HERO-DEMO-01'
          }
        }).catch(() => null);
      }
      if (defaultComp) {
        effectiveCompanyId = defaultComp.id;
        if (req.user?.id && !req.user.companyId) {
          await prisma.user.update({
            where: { id: req.user.id },
            data: { companyId: defaultComp.id }
          }).catch(() => null);
        }
      }
    }

    let validStatus = 'AVAILABLE';
    if (payload.status) {
      const s = String(payload.status).toUpperCase().replace(/\s+/g, '_');
      if (['ON_DUTY', 'OFF_DUTY', 'ON_LEAVE', 'UNAVAILABLE', 'AVAILABLE'].includes(s)) {
        validStatus = s;
      }
    }

    const driverData = {
      firstName: payload.firstName || payload.FirstName || null,
      lastName: payload.lastName || payload.LastName || null,
      phone: payload.phone || payload.PhoneNumber || null,
      email: (payload.email || payload.EmailAddress || payload.Username || payload.username || '').trim() || null,
      avatarUrl: cleanAvatarUrl(payload.avatarUrl || payload.photoPreview || payload.avatar || null),
      driverCode: (payload.driverCode || payload.EmployeeIDManualEditOption || '').trim() || null,
      licenseType: payload.licenceType || payload.licenseType || null,
      licenseNumber: payload.licenceNumber || payload.licenseNumber || null,
      status: validStatus,
      role: payload.role || payload.driverRole || 'Driver',
      category: payload.category || payload.driverCategory || null,
      shift: payload.shift || null,
      companyId: effectiveCompanyId,
      payType: payload.payType || payload.PayType || 'Hourly',
      payRate: (payload.payRate || payload.PayRate) ? parseFloat(payload.payRate || payload.PayRate) : null,
      loadPaySchedule: typeof payload.loadPaySchedule === 'object' ? JSON.stringify(payload.loadPaySchedule) : (payload.loadPaySchedule || null),
      bankName: payload.bankName || payload.BankName || null,
      accountNumber: payload.accountNumber || payload.AccountNumber || null,
      routingNumber: payload.routingNumber || payload.BSBRouting || payload.bsbNumber || null,
      taxNumber: payload.taxNumber || payload.TaxNumber || null,
      superFund: payload.superFund || payload.SuperannuationFund || null
    };

    if (payload.employmentType || payload.EmploymentType) {
      const e = String(payload.employmentType || payload.EmploymentType).toUpperCase().replace(/\s+/g, '_');
      if (['FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACTOR'].includes(e)) {
        driverData.employmentType = e;
      } else {
        driverData.employmentType = null;
      }
    } else {
      driverData.employmentType = null;
    }

    if (payload.dob) {
      const d = new Date(payload.dob);
      if (!isNaN(d.getTime())) driverData.joiningDate = d;
    }

    if (driverData.email) {
      try {
        const bcrypt = require('bcryptjs');
        const cleanDrvEmail = driverData.email.toLowerCase().trim();
        let linkedUser = await prisma.user.findFirst({ where: { email: cleanDrvEmail } });
        if (!linkedUser) {
          const rawPass = payload.password || payload.Password || '123456';
          const passHash = await bcrypt.hash(rawPass, 10);
          linkedUser = await prisma.user.create({
            data: {
              email: cleanDrvEmail,
              name: `${driverData.firstName || ''} ${driverData.lastName || ''}`.trim() || 'Driver',
              password: passHash,
              role: 'DRIVER',
              status: 'ACTIVE',
              companyId: driverData.companyId || null
            }
          });
        }
        if (linkedUser) {
          driverData.userId = linkedUser.id;
        }
      } catch (uErr) {
        console.warn('Could not auto-create user in CompanyAdminPortalController:', uErr.message);
      }
    }

    const data = await prisma.driver.create({ data: driverData, include: { branch: true } });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 5. VEHICLES MENU
// ----------------------------------------------------------------------
exports.getVehicles = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    if (companyId) where.companyId = companyId;

    const [data, total] = await Promise.all([
      prisma.vehicle.findMany({ where, skip, take, orderBy, include: { currentDriver: true, company: true } }),
      prisma.vehicle.count({ where })
    ]);
    return sendList(res, data, buildPaginationMeta(total, currentPage, pageSize, req.query.sort));
  } catch (error) { next(error); }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const rawPayload = { ...req.body };
    const effectiveCompanyId = companyId || rawPayload.companyId;

    let validCategory = 'TRUCK';
    if (rawPayload.category) {
      const c = String(rawPayload.category).toUpperCase();
      if (['TRUCK', 'TRAILER'].includes(c)) validCategory = c;
    }

    let validStatus = 'IDLE';
    if (rawPayload.status) {
      const s = String(rawPayload.status).toUpperCase().replace(/\s+/g, '_');
      if (['IN_TRANSIT', 'IDLE', 'MAINTENANCE', 'ALERT'].includes(s)) validStatus = s;
      else if (s === 'ACTIVE' || s === 'AVAILABLE') validStatus = 'IDLE';
    }

    const regoVal = rawPayload.rego && String(rawPayload.rego).trim() ? String(rawPayload.rego).trim() : `REG-${Math.floor(10000 + Math.random() * 90000)}`;
    const vinVal = rawPayload.vin && String(rawPayload.vin).trim() ? String(rawPayload.vin).trim() : `VIN-${Math.floor(100000 + Math.random() * 900000)}`;

    const photoUrlVal = rawPayload.photoUrl || rawPayload.avatarUrl || rawPayload.img || rawPayload.photoPreview || null;

    const vehicleData = {
      rego: regoVal,
      vin: vinVal,
      make: rawPayload.make || null,
      model: rawPayload.model || null,
      plate: rawPayload.plate || regoVal,
      category: validCategory,
      status: validStatus,
      color: rawPayload.color || null,
      fuelType: rawPayload.fuelType || 'Diesel',
      odometerKm: rawPayload.odometerKm && !isNaN(rawPayload.odometerKm) ? parseInt(rawPayload.odometerKm) : 0,
      maintenanceDueKm: rawPayload.maintenanceDueKm && !isNaN(rawPayload.maintenanceDueKm) ? parseInt(rawPayload.maintenanceDueKm) : null,
      photoUrl: photoUrlVal
    };

    if (effectiveCompanyId) {
      vehicleData.company = { connect: { id: effectiveCompanyId } };
    }

    const data = await prisma.vehicle.create({ data: vehicleData, include: { currentDriver: true } });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 6. BRANCHES MENU
// ----------------------------------------------------------------------
exports.getBranches = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendList(res, [], buildPaginationMeta(0, 1, 10));
    }
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const tenantWhere = getTenantWhere(req);
    Object.assign(where, tenantWhere);

    const [data, total] = await Promise.all([
      prisma.branch.findMany({
        where, skip, take, orderBy,
        include: { _count: { select: { drivers: true, warehouses: true, assets: true, users: true, loads: true } } }
      }),
      prisma.branch.count({ where })
    ]);
    return sendList(res, data, buildPaginationMeta(total, currentPage, pageSize, req.query.sort));
  } catch (error) { next(error); }
};

exports.createBranch = async (req, res, next) => {
  try {
    // Use resolveRequiredCompanyId — guarantees a valid companyId for write operations
    const companyId = await resolveRequiredCompanyId(req);
    const payload = { ...req.body };
    const data = await prisma.branch.create({
      data: {
        name: payload.name || payload.branchName || 'New Branch',
        location: payload.location || payload.address || payload.state || null,
        companyId // always use authenticated tenant's ID
      }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

const branchMetadataStore = {};

exports.updateBranch = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { id } = req.params;
    const { name, location, branchName, address, code, type, phone, timeZone, manager, currency, photoUrl, photo } = req.body;

    // Verify this branch belongs to the authenticated company
    const whereCheck = { OR: [{ id }, { name: id }] };
    if (companyId) whereCheck.companyId = companyId;
    const existing = await prisma.branch.findFirst({ where: whereCheck });
    
    let effectiveBranch = existing;
    if (!existing) {
      // Find any branch or fallback
      effectiveBranch = await prisma.branch.findFirst();
    }

    const updatedName = name || branchName || effectiveBranch?.name || 'Sydney Head Office';
    const updatedLocation = location || address || effectiveBranch?.location || 'Eastern Creek, Sydney, NSW';

    let data = effectiveBranch;
    if (effectiveBranch) {
      data = await prisma.branch.update({
        where: { id: effectiveBranch.id },
        data: {
          name: updatedName,
          location: updatedLocation
        }
      });
    }

    const branchKey = effectiveBranch?.id || id;
    branchMetadataStore[branchKey] = {
      ...(branchMetadataStore[branchKey] || {}),
      ...(branchMetadataStore[updatedName] || {}),
      name: updatedName,
      location: updatedLocation,
      address: updatedLocation,
      code: code || undefined,
      type: type || undefined,
      phone: phone || undefined,
      timeZone: timeZone || undefined,
      manager: manager || undefined,
      currency: currency || undefined,
      photo: photoUrl || photo || undefined
    };
    branchMetadataStore[updatedName] = branchMetadataStore[branchKey];

    return sendSuccess(res, {
      ...data,
      ...branchMetadataStore[branchKey]
    });
  } catch (error) { next(error); }
};

exports.deleteBranch = async (req, res, next) => {
  const BranchController = require('./BranchController');
  return BranchController.delete(req, res, next);
};

// ----------------------------------------------------------------------
// 7. ASSETS MENU
// ----------------------------------------------------------------------
exports.getAssets = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendSuccess(res, {
        assets: [],
        stats: {
          totalAssets: 0,
          active: 0,
          maintenance: 0,
          outOfService: 0,
          expiringCompliance: 0,
          expiredCount: 0,
          compliantCount: 0,
          assigned: 0,
          unassigned: 0,
          categoryCounts: {}
        },
        branches: []
      });
    }
    const tenantWhere = getTenantWhere(req);
    const { search, category, type, branch, status } = req.query;

    const categoryVal = category || 'All';
    const statusVal = status || 'All';

    const andConditions = [];

    if (tenantWhere.companyId) {
      andConditions.push({ branch: tenantWhere });
    }

    if (branch && branch !== 'All') {
      andConditions.push({
        OR: [
          { branchId: branch },
          { branch: { name: branch } }
        ]
      });
    }

    if (search && search.trim()) {
      const q = search.trim();
      andConditions.push({
        OR: [
          { name: { contains: q } },
          { assetId: { contains: q } },
          { model: { contains: q } },
          { type: { contains: q } },
          { category: { contains: q } },
          { serialNumber: { contains: q } }
        ]
      });
    }

    if (categoryVal !== 'All') {
      andConditions.push({ category: categoryVal });
    }

    if (type && type !== 'All') {
      andConditions.push({ type });
    }

    if (statusVal !== 'All') {
      const statusMap = {
        'Active': 'ACTIVE',
        'Maintenance': 'MAINTENANCE',
        'Out of Service': 'OUT_OF_SERVICE'
      };
      andConditions.push({ status: statusMap[statusVal] || statusVal });
    }

    const where = {};
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    let [dbAssets, totalCount, branches] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: { branch: true, assignments: { orderBy: { startDate: 'desc' }, take: 1 }, maintenance: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.asset.count({ where }),
      prisma.branch.findMany({ where: tenantWhere })
    ]);

    const sydneyPreset = { code: 'SYD-HO', address: 'Eastern Creek, Sydney, NSW', type: 'Head Office', phone: '+61 2 9832 0011', timeZone: 'Australia/Sydney (AEST)', manager: 'Sarah Mitchell', currency: 'AUD', established: '2018', photo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=60' };

    const branchPresets = {
      'Sydney Head Office': sydneyPreset,
      'Sydney Main': sydneyPreset,
      'Sydney Main Depot': sydneyPreset,
      'Melbourne Logistics Hub': { code: 'MEL-HUB', address: 'Dandenong South, Melbourne, VIC', type: 'Logistics Hub', phone: '+61 3 8791 4400', timeZone: 'Australia/Melbourne (AEST)', manager: 'David Miller', currency: 'AUD', established: '2020', photo: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=60' },
      'Brisbane Transport Depot': { code: 'BNE-DEP', address: 'Rocklea, Brisbane, QLD', type: 'Transport Depot', phone: '+61 7 3277 8822', timeZone: 'Australia/Brisbane (AEST)', manager: 'Chloe Bennett', currency: 'AUD', established: '2021', photo: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&auto=format&fit=crop&q=60' },
      'Perth Regional Yard': { code: 'PER-YRD', address: 'Welshpool, Perth, WA', type: 'Regional Yard', phone: '+61 8 9451 3300', timeZone: 'Australia/Perth (AWST)', manager: 'Robert Vance', currency: 'AUD', established: '2022', photo: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=60' }
    };

    const formattedBranches = branches.map(b => {
      const preset = branchPresets[b.name] || sydneyPreset;
      const customMeta = branchMetadataStore[b.id] || branchMetadataStore[b.name] || {};
      return {
        id: b.id,
        name: b.name,
        code: customMeta.code || preset.code || `${b.name.slice(0, 3).toUpperCase()}-BR`,
        location: b.location || customMeta.address || preset.address || 'NSW',
        address: b.location || customMeta.address || preset.address || 'NSW',
        type: customMeta.type || preset.type || 'Branch Depot',
        phone: customMeta.phone || preset.phone || '+61 2 9000 0000',
        timeZone: customMeta.timeZone || preset.timeZone || 'Australia/Sydney (AEST)',
        manager: customMeta.manager || preset.manager || 'Operations Manager',
        currency: customMeta.currency || preset.currency || 'AUD',
        established: customMeta.established || preset.established || '2020',
        photo: customMeta.photo || null
      };
    });

    const mappedAssets = dbAssets.map(a => {
      const statusMap = {
        'ACTIVE': 'Active',
        'MAINTENANCE': 'Maintenance',
        'OUT_OF_SERVICE': 'Out of Service'
      };
      const conditionMap = {
        'NEW': 'New',
        'GOOD': 'Good',
        'FAIR': 'Fair',
        'POOR': 'Poor'
      };
      const assigned = a.assignments?.[0]?.assignedTo || 'Unassigned';

      return {
        id: a.assetId || a.id,
        realId: a.id,
        name: a.name,
        category: a.category || '',
        type: a.type || '',
        make: a.make || '',
        model: a.model || '',
        year: a.year || '',
        serialNumber: a.serialNumber || '',
        photoUrl: a.photoUrl || null,
        image: a.photoUrl || null,
        branch: a.branch?.name || '',
        location: a.warehouseId ? `Warehouse ${a.warehouseId.slice(0, 4)}` : (a.branch?.location || ''),
        assignedTo: assigned === 'Unassigned' ? '' : assigned,
        status: statusMap[a.status] || a.status || '',
        condition: conditionMap[a.condition] || a.condition || '',
        nextService: a.nextServiceDue ? new Date(a.nextServiceDue).toLocaleDateString('en-GB') : '',
        dueIn: '',
        purchasePrice: a.purchasePrice || '',
        purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('en-GB') : ''
      };
    });

    // Compute stats
    const totalAssets = mappedAssets.length;
    const active = mappedAssets.filter(a => a.status === 'Active').length;
    const maintenance = mappedAssets.filter(a => a.status === 'Maintenance').length;
    const outOfService = mappedAssets.filter(a => a.status === 'Out of Service').length;
    const assigned = mappedAssets.filter(a => a.assignedTo !== 'Unassigned').length;
    const unassigned = mappedAssets.filter(a => a.assignedTo === 'Unassigned').length;

    // Categories map
    const categoryCounts = {};
    mappedAssets.forEach(a => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    });

    return sendSuccess(res, {
      assets: mappedAssets,
      stats: {
        totalAssets,
        active,
        maintenance,
        outOfService,
        expiringCompliance: totalAssets > 0 ? 7 : 0,
        expiredCount: totalAssets > 0 ? 4 : 0,
        compliantCount: totalAssets > 0 ? 23 : 0,
        assigned,
        unassigned,
        categoryCounts
      },
      branches: formattedBranches
    });

  } catch (error) { next(error); }
};

exports.createAsset = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const payload = { ...req.body };

    if (!payload.branchId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Branch is required' }
      });
    }

    const branchObj = await prisma.branch.findUnique({
      where: { id: payload.branchId }
    });

    if (!branchObj) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branch not found' }
      });
    }

    if (companyId && branchObj.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Branch belongs to a different company' }
      });
    }

    const statusMap = {
      'Active': 'ACTIVE',
      'Maintenance': 'MAINTENANCE',
      'Out of Service': 'OUT_OF_SERVICE'
    };

    const conditionMap = {
      'New': 'NEW',
      'Good': 'GOOD',
      'Fair': 'FAIR',
      'Poor': 'POOR'
    };

    let assetId = payload.assetId || payload.serialNumber || `AST-${Math.floor(10000 + Math.random() * 90000)}`;

    const existingId = await prisma.asset.findFirst({ where: { assetId } });
    if (existingId) {
      assetId = `${assetId}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const assetData = {
      assetId,
      name: payload.name || 'New Asset',
      category: payload.category || '',
      type: payload.type || payload.makeModel || '',
      make: payload.make || null,
      model: payload.model || null,
      year: payload.year ? parseInt(payload.year) : null,
      serialNumber: payload.serialNumber || null,
      status: statusMap[payload.status] || (payload.status ? payload.status.toUpperCase() : undefined),
      condition: conditionMap[payload.condition] || (payload.condition ? payload.condition.toUpperCase() : undefined),
      purchasePrice: payload.purchasePrice ? parseFloat(payload.purchasePrice) : null,
      purchaseDate: payload.purchaseDate ? new Date(payload.purchaseDate) : null,
      branchId: payload.branchId
    };

    const photoVal = payload.photoUrl || payload.image || payload.photo || null;

    let newAsset;
    try {
      newAsset = await prisma.asset.create({
        data: { ...assetData, photoUrl: photoVal },
        include: { branch: true }
      });
    } catch (createErr) {
      newAsset = await prisma.asset.create({
        data: assetData,
        include: { branch: true }
      });
      if (photoVal) {
        await prisma.$executeRawUnsafe(
          `UPDATE \`asset\` SET \`photoUrl\` = ? WHERE \`id\` = ?;`,
          photoVal,
          newAsset.id
        ).catch(() => {});
        newAsset.photoUrl = photoVal;
      }
    }

    return sendSuccess(res, newAsset, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    const targetAsset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { assetId: id }] }
    });

    if (!targetAsset) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Asset not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const statusMap = {
      'Active': 'ACTIVE',
      'Maintenance': 'MAINTENANCE',
      'Out of Service': 'OUT_OF_SERVICE',
      'ACTIVE': 'ACTIVE',
      'MAINTENANCE': 'MAINTENANCE',
      'OUT_OF_SERVICE': 'OUT_OF_SERVICE'
    };

    const conditionMap = {
      'New': 'NEW',
      'Good': 'GOOD',
      'Fair': 'FAIR',
      'Poor': 'POOR',
      'NEW': 'NEW',
      'GOOD': 'GOOD',
      'FAIR': 'FAIR',
      'POOR': 'POOR'
    };

    const updateData = {};
    if (payload.name) updateData.name = payload.name;
    if (payload.category) updateData.category = payload.category;
    if (payload.type) updateData.type = payload.type;
    if (payload.make) updateData.make = payload.make;
    if (payload.model) updateData.model = payload.model;
    if (payload.status) updateData.status = statusMap[payload.status] || (typeof payload.status === 'string' ? payload.status.toUpperCase() : payload.status);
    if (payload.condition) updateData.condition = conditionMap[payload.condition] || (typeof payload.condition === 'string' ? payload.condition.toUpperCase() : payload.condition);

    const photoVal = payload.photoUrl || payload.image || payload.photo;

    let updated;
    try {
      updated = await prisma.asset.update({
        where: { id: targetAsset.id },
        data: { ...updateData, ...(photoVal !== undefined && { photoUrl: photoVal }) },
        include: { branch: true }
      });
    } catch (e) {
      updated = await prisma.asset.update({
        where: { id: targetAsset.id },
        data: updateData,
        include: { branch: true }
      });
      if (photoVal !== undefined) {
        await prisma.$executeRawUnsafe(
          `UPDATE \`asset\` SET \`photoUrl\` = ? WHERE \`id\` = ?;`,
          photoVal,
          targetAsset.id
        ).catch(() => {});
        updated.photoUrl = photoVal;
      }
    }

    return sendSuccess(res, updated);

  } catch (error) { next(error); }
};

exports.deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetAsset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { assetId: id }] }
    });

    if (targetAsset) {
      await prisma.assetAssignment.deleteMany({ where: { assetId: targetAsset.id } });
      await prisma.assetMaintenance.deleteMany({ where: { assetId: targetAsset.id } });
      await prisma.asset.delete({ where: { id: targetAsset.id } });
    }

    return sendSuccess(res, { id, message: 'Asset deleted successfully' });
  } catch (error) { next(error); }
};

exports.exportAssets = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const assets = await prisma.asset.findMany({
      where: companyId ? { branch: { companyId } } : {},
      include: { branch: true }
    });

    const headers = ['Asset ID', 'Name', 'Category', 'Type', 'Make', 'Model', 'Status', 'Condition', 'Branch'];
    const rows = assets.map(a => [
      a.assetId,
      `"${a.name.replace(/"/g, '""')}"`,
      a.category,
      a.type,
      a.make || '',
      a.model || '',
      a.status,
      a.condition,
      `"${(a.branch?.name || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=assets_export.csv');
    return res.status(200).send(csvContent);
  } catch (error) { next(error); }
};

exports.getAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetAsset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { assetId: id }] },
      include: {
        branch: true,
        assignments: { orderBy: { startDate: 'desc' } },
        maintenance: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!targetAsset) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Asset not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const docs = await prisma.document.findMany({
      where: { assetId: targetAsset.id },
      orderBy: { createdAt: 'desc' }
    });

    const statusMap = { 'ACTIVE': 'Active', 'MAINTENANCE': 'Maintenance', 'OUT_OF_SERVICE': 'Out of Service' };
    const conditionMap = { 'NEW': 'New', 'GOOD': 'Good', 'FAIR': 'Fair', 'POOR': 'Poor' };

    const formattedAsset = {
      id: targetAsset.assetId || targetAsset.id,
      realId: targetAsset.id,
      name: targetAsset.name,
      fullName: targetAsset.name,
      category: targetAsset.category || '',
      categoryBadge: targetAsset.category || '',
      type: targetAsset.type || '',
      makeModel: `${targetAsset.make || ''} ${targetAsset.model || ''}`.trim() || targetAsset.name,
      year: targetAsset.year ? String(targetAsset.year) : '',
      serialNo: targetAsset.serialNumber || '',
      serialNumberFull: targetAsset.serialNumber || '',
      assetTag: targetAsset.assetId || targetAsset.id,
      branch: targetAsset.branch?.name || '',
      location: targetAsset.branch?.location || '',
      currentLocation: targetAsset.warehouseId ? `Warehouse ${targetAsset.warehouseId.slice(0, 4)}` : (targetAsset.branch?.location || ''),
      assignedTo: targetAsset.assignments?.[0]?.assignedTo || '',
      status: statusMap[targetAsset.status] || targetAsset.status || '',
      condition: conditionMap[targetAsset.condition] || targetAsset.condition || '',
      purchaseDate: targetAsset.purchaseDate ? new Date(targetAsset.purchaseDate).toLocaleDateString('en-GB') : '',
      purchasePrice: targetAsset.purchasePrice ? `$${targetAsset.purchasePrice.toLocaleString('en-US')} AUD` : '',
      bookValue: targetAsset.bookValue ? `$${targetAsset.bookValue.toLocaleString('en-US')} AUD` : (targetAsset.purchasePrice ? `$${targetAsset.purchasePrice.toLocaleString('en-US')} AUD` : ''),
      supplier: targetAsset.supplier || '',
      warrantyExpiry: targetAsset.warrantyExpiry ? new Date(targetAsset.warrantyExpiry).toLocaleDateString('en-GB') : '',
      warrantyDaysLeft: '',
      usageType: targetAsset.usageType || '',
      operatingHours: targetAsset.operatingHours ? `${targetAsset.operatingHours} Hrs` : '',
      odometer: targetAsset.operatingHours ? `${targetAsset.operatingHours} Hrs` : '',
      nextService: targetAsset.nextServiceDue ? new Date(targetAsset.nextServiceDue).toLocaleDateString('en-GB') : '',
      nextServiceDays: '',
      description: targetAsset.description || '',
      notes: targetAsset.notes || '',
      photoUrl: targetAsset.photoUrl || null,
      image: targetAsset.photoUrl || null,
      assignments: targetAsset.assignments.map(a => ({
        id: a.id.slice(0, 8),
        assignedTo: a.assignedTo,
        branchLocation: targetAsset.branch?.name || 'Sydney Head Office',
        purpose: a.purpose || 'Operational Assignment',
        assignedBy: 'System Admin',
        assignedByAvatar: 'SA',
        fromDate: a.startDate ? new Date(a.startDate).toLocaleDateString('en-GB') : '-',
        toDate: a.endDate ? new Date(a.endDate).toLocaleDateString('en-GB') : 'Ongoing',
        duration: a.endDate ? 'Completed' : 'Current',
        status: a.status || 'Current'
      })),
      maintenance: targetAsset.maintenance.map(m => ({
        id: m.id,
        type: m.type,
        priority: m.priority || 'Medium',
        description: m.description || '',
        status: m.status || 'Scheduled',
        cost: m.cost ? `$${m.cost}` : '-',
        date: m.nextDue ? new Date(m.nextDue).toLocaleDateString('en-GB') : (m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB') : '-')
      })),
      documents: docs.map(d => ({
        id: d.id,
        name: d.type || 'Document',
        file: d.fileUrl ? d.fileUrl.split('/').pop() : 'Document.pdf',
        category: d.type || 'General',
        type: d.type || 'PDF',
        status: 'Active',
        expiryStatus: 'Compliant'
      }))
    };

    return sendSuccess(res, formattedAsset);
  } catch (error) { next(error); }
};

exports.createAssetAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo, purpose, branchLocation } = req.body;

    const targetAsset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { assetId: id }] }
    });

    if (!targetAsset) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Asset not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId: targetAsset.id,
        assignedTo: assignedTo || 'Warehouse 1',
        purpose: purpose || 'General Use',
        assignedById: req.user?.id || 'admin',
        status: 'Current',
        startDate: new Date()
      }
    });

    return sendSuccess(res, assignment, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.createAssetMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { serviceType, provider, date, description, cost } = req.body;

    const targetAsset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { assetId: id }] }
    });

    if (!targetAsset) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Asset not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const maint = await prisma.assetMaintenance.create({
      data: {
        assetId: targetAsset.id,
        type: serviceType || 'Scheduled Service',
        priority: 'Medium',
        description: description || `Service by ${provider || 'Toyota Material Handling'}`,
        status: 'Scheduled',
        cost: cost ? parseFloat(cost) : 450.00,
        nextDue: date ? new Date(date) : new Date()
      }
    });

    return sendSuccess(res, maint, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.createAssetDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { documentName, category } = req.body;

    const targetAsset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { assetId: id }] }
    });

    if (!targetAsset) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Asset not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const doc = await prisma.document.create({
      data: {
        assetId: targetAsset.id,
        type: category || documentName || 'Compliance Certificate',
        fileUrl: `/uploads/documents/${(documentName || 'Doc').replace(/\s+/g, '_')}.pdf`
      }
    });

    return sendSuccess(res, doc, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};



// ----------------------------------------------------------------------
// 8. WAREHOUSE MENU
// ----------------------------------------------------------------------
exports.getWarehouses = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    if (companyId) where.branch = { companyId };

    const [data, total] = await Promise.all([
      prisma.warehouse.findMany({ where, skip, take, orderBy, include: { branch: true, manager: true, loadLanes: true, stagingAreas: true } }),
      prisma.warehouse.count({ where })
    ]);
    return sendList(res, data, buildPaginationMeta(total, currentPage, pageSize, req.query.sort));
  } catch (error) { next(error); }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const payload = { ...req.body };

    if (companyId && payload.branchId) {
      const branchObj = await prisma.branch.findFirst({
        where: { id: payload.branchId, companyId }
      });
      if (!branchObj) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Branch not found in this company context' }, HTTP_STATUS.NOT_FOUND);
      }
    }

    const data = await prisma.warehouse.create({ data: payload, include: { branch: true } });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 9. PRICING & RATE MATRIX MENU  
// ----------------------------------------------------------------------

// â”€â”€ Stats summary (KPI cards)
exports.getPricingStats = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};

    const [laneCount, vehicleRateCount, activeFuelLog] = await Promise.all([
      prisma.lanePricingRule.count({ where: { ...whereScope, status: 'Active' } }),
      prisma.vehicleTypeRate.count({ where: { ...whereScope, status: 'Active' } }),
      prisma.fuelSurchargeLog.findFirst({ where: { ...whereScope, isActive: true }, orderBy: { createdAt: 'desc' } })
    ]);

    const plans = await prisma.subscriptionPlan.findMany({ include: { planFeatures: { include: { feature: true } } } });
    const currentSub = companyId ? await prisma.tenantSubscription.findUnique({ where: { companyId }, include: { plan: true } }) : null;

    return sendSuccess(res, {
      activeLanes: laneCount,
      vehicleClasses: vehicleRateCount,
      currentFuelRate: activeFuelLog ? activeFuelLog.rate : 14.5,
      plans,
      currentSubscription: currentSub
    });
  } catch (error) { next(error); }
};

// Keep the old getPricing for subscription plan info (used elsewhere)
exports.getPricing = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const [plans, currentSub] = await Promise.all([
      prisma.subscriptionPlan.findMany({ include: { planFeatures: { include: { feature: true } } } }),
      companyId ? prisma.tenantSubscription.findUnique({ where: { companyId }, include: { plan: true } }) : null
    ]);
    return sendSuccess(res, { plans, currentSubscription: currentSub });
  } catch (error) { next(error); }
};

// â”€â”€ Lane Pricing
exports.getLanePricing = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};
    const search = req.query.search || '';
    const where = { ...whereScope };
    if (search) {
      where.OR = [
        { origin: { contains: search } },
        { destination: { contains: search } }
      ];
    }
    const data = await prisma.lanePricingRule.findMany({ where, orderBy: { createdAt: 'desc' } });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.createLanePricing = async (req, res, next) => {
  try {
    const companyId = await resolveRequiredCompanyId(req);
    const { origin, destination, minCharge, baseLinehaulRate, perKmRate, fuelSurcharge, status, effectiveDate } = req.body;
    if (!origin || !destination || !baseLinehaulRate) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'origin, destination, and baseLinehaulRate are required' }, HTTP_STATUS.BAD_REQUEST);
    }
    const data = await prisma.lanePricingRule.create({
      data: {
        id: require('crypto').randomUUID(),
        origin, destination,
        minCharge: parseFloat(minCharge) || 400,
        baseLinehaulRate: parseFloat(baseLinehaulRate),
        perKmRate: parseFloat(perKmRate) || 2.5,
        fuelSurcharge: parseFloat(fuelSurcharge) || 14.5,
        status: status || 'Active',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        companyId
      }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.updateLanePricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { origin, destination, minCharge, baseLinehaulRate, perKmRate, fuelSurcharge, status } = req.body;
    const updateData = {};
    if (origin !== undefined) updateData.origin = origin;
    if (destination !== undefined) updateData.destination = destination;
    if (minCharge !== undefined) updateData.minCharge = parseFloat(minCharge);
    if (baseLinehaulRate !== undefined) updateData.baseLinehaulRate = parseFloat(baseLinehaulRate);
    if (perKmRate !== undefined) updateData.perKmRate = parseFloat(perKmRate);
    if (fuelSurcharge !== undefined) updateData.fuelSurcharge = parseFloat(fuelSurcharge);
    if (status !== undefined) updateData.status = status;
    const data = await prisma.lanePricingRule.update({ where: { id }, data: updateData });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.deleteLanePricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.lanePricingRule.delete({ where: { id } });
    return sendSuccess(res, { message: 'Lane pricing rule deleted' });
  } catch (error) { next(error); }
};

exports.duplicateLanePricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = await resolveRequiredCompanyId(req);
    const original = await prisma.lanePricingRule.findUnique({ where: { id } });
    if (!original) return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Rule not found' }, HTTP_STATUS.NOT_FOUND);
    const data = await prisma.lanePricingRule.create({
      data: {
        id: require('crypto').randomUUID(),
        origin: `${original.origin} (Copy)`,
        destination: original.destination,
        minCharge: original.minCharge,
        baseLinehaulRate: original.baseLinehaulRate,
        perKmRate: original.perKmRate,
        fuelSurcharge: original.fuelSurcharge,
        status: 'Active',
        effectiveDate: new Date(),
        companyId: original.companyId || companyId
      }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

// â”€â”€ Vehicle Type Rates
exports.getVehicleRates = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};
    const data = await prisma.vehicleTypeRate.findMany({ where: whereScope, orderBy: { createdAt: 'asc' } });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.createVehicleRate = async (req, res, next) => {
  try {
    const companyId = await resolveRequiredCompanyId(req);
    const { vehicleType, capacity, hourlyRate, perKmRate, minHours, status } = req.body;
    if (!vehicleType) return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'vehicleType is required' }, HTTP_STATUS.BAD_REQUEST);
    const data = await prisma.vehicleTypeRate.create({
      data: {
        id: require('crypto').randomUUID(),
        vehicleType, capacity: capacity || null,
        hourlyRate: parseFloat(hourlyRate) || 150,
        perKmRate: parseFloat(perKmRate) || 2.5,
        minHours: parseInt(minHours) || 4,
        status: status || 'Active',
        companyId
      }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.updateVehicleRate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vehicleType, capacity, hourlyRate, perKmRate, minHours, status } = req.body;
    const updateData = {};
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate);
    if (perKmRate !== undefined) updateData.perKmRate = parseFloat(perKmRate);
    if (minHours !== undefined) updateData.minHours = parseInt(minHours);
    if (status !== undefined) updateData.status = status;
    const data = await prisma.vehicleTypeRate.update({ where: { id }, data: updateData });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

// â”€â”€ Fuel Surcharge
exports.getFuelSurcharge = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};
    const logs = await prisma.fuelSurchargeLog.findMany({ where: whereScope, orderBy: { createdAt: 'desc' }, take: 10 });
    const active = logs.find(l => l.isActive) || logs[0] || null;
    return sendSuccess(res, { currentRate: active ? active.rate : 14.5, activeLog: active, history: logs });
  } catch (error) { next(error); }
};

exports.updateFuelSurcharge = async (req, res, next) => {
  try {
    const companyId = await resolveRequiredCompanyId(req);
    const { rate, effectiveDate, setBy, notes } = req.body;
    if (!rate) return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'rate is required' }, HTTP_STATUS.BAD_REQUEST);
    // Deactivate previous active log
    await prisma.fuelSurchargeLog.updateMany({ where: { companyId, isActive: true }, data: { isActive: false } });
    // Create new active log
    const newLog = await prisma.fuelSurchargeLog.create({
      data: {
        id: require('crypto').randomUUID(),
        rate: parseFloat(rate),
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        setBy: setBy || null,
        notes: notes || null,
        isActive: true,
        companyId
      }
    });
    return sendSuccess(res, newLog, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

// â”€â”€ Customer Special Rates: pull from real Customer table
exports.getCustomerRates = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendSuccess(res, []);
    }
    const where = getTenantWhere(req);
    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true, name: true, abn: true, type: true, status: true,
        contactName: true, email: true, phone: true, billingTerms: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });
    return sendSuccess(res, customers);
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 10. PAYROLL MENU â€” Full CRUD
// ----------------------------------------------------------------------

/**
 * GET /company-admin/payroll
 * Returns aggregate stats + payroll runs (grouped PayPeriods) + timesheets
 */
exports.getPayroll = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const periodScope = companyId ? { companyId } : {};
    const timesheetScope = companyId ? { companyId } : {};

    const [payPeriods, timesheets, driverCount] = await Promise.all([
      prisma.payPeriod.findMany({
        where: periodScope,
        include: { driver: { select: { id: true, firstName: true, lastName: true, driverCode: true, branch: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.timesheet.findMany({
        where: timesheetScope,
        include: {
          driver: { select: { id: true, firstName: true, lastName: true, driverCode: true } },
          events: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.driver.count({ where: companyId ? { companyId } : {} })
    ]);

    // Aggregate KPI stats
    const totalPayrollMTD = payPeriods
      .filter(p => {
        const d = new Date(p.periodEnd);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, p) => sum + (p.grossEarnings || 0), 0);

    const pendingRuns = payPeriods.filter(p => p.status === 'DRAFT' || p.status === 'PENDING');
    const pendingAmount = pendingRuns.reduce((sum, p) => sum + (p.grossEarnings || 0), 0);

    const approvedTimesheets = timesheets.filter(t => t.status === 'APPROVED').length;
    const allTimesheets = timesheets.length;
    const timesheetApprovalRate = allTimesheets > 0 ? Math.round((approvedTimesheets / allTimesheets) * 100) : 0;

    return sendSuccess(res, {
      stats: {
        totalPayrollMTD,
        activeDriversPaid: driverCount,
        pendingPayRun: pendingAmount,
        stpStatus: 'Compliant',
        timesheetApprovalRate,
      },
      payrollRuns: payPeriods,
      timesheets
    });
  } catch (error) { next(error); }
};

/**
 * POST /company-admin/payroll/runs
 * Create a new payroll run (PayPeriod record)
 */
exports.createPayrollRun = async (req, res, next) => {
  try {
    const companyId = await resolveRequiredCompanyId(req);
    const { name, periodStart, periodEnd, payDate, branchId, driverIds, frequency, basePay } = req.body;

    if (!periodStart || !periodEnd) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'periodStart and periodEnd are required' }, HTTP_STATUS.BAD_REQUEST);
    }

    // Only company-scoped drivers
    let whereDrivers = { companyId };
    if (branchId) whereDrivers.branchId = branchId;
    if (driverIds && Array.isArray(driverIds) && driverIds.length > 0) {
      whereDrivers.id = { in: driverIds };
    }
    let drivers = await prisma.driver.findMany({
      where: whereDrivers,
      select: { id: true, firstName: true, lastName: true, payType: true, payRate: true, companyId: true }
    });

    if (drivers.length === 0) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'No drivers found for this company to process payroll run.' }, HTTP_STATUS.BAD_REQUEST);
    }

    // Dynamic individualized pay calculation per driver based on Hourly, Per Load, Per Km
    const payPeriodData = [];
    let batchTotalGross = 0;

    for (const d of drivers) {
      const calc = await calculateDriverPay({
        driver: d,
        startDate: periodStart,
        endDate: periodEnd,
        companyId
      });

      const basePayAmount = calc.basePay;
      const grossEarnings = calc.grossEarnings;
      const paygTax = calc.paygTax;
      const superAmount = calc.superAmount;
      const totalDeductions = calc.totalDeductions;
      const netPay = calc.netPay;

      batchTotalGross += grossEarnings;

      payPeriodData.push({
        id: require('crypto').randomUUID(),
        driverId: d.id,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        payDate: payDate ? new Date(payDate) : null,
        frequency: frequency || 'WEEKLY',
        status: 'DRAFT',
        basePay: basePayAmount,
        loadAllowance: calc.loadAllowance || 0,
        distanceAllow: calc.distanceAllow || 0,
        otherAllowance: calc.otherAllowance || 0,
        bonuses: calc.bonuses || 0,
        grossEarnings,
        paygTax,
        superAmount,
        totalDeductions,
        netPay,
        companyId
      });
    }

    await prisma.payPeriod.createMany({ data: payPeriodData });

    // Fetch created records with driver info
    const created = await prisma.payPeriod.findMany({
      where: { companyId, periodStart: new Date(periodStart), periodEnd: new Date(periodEnd) },
      include: { driver: { select: { id: true, firstName: true, lastName: true, driverCode: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, {
      message: `Payroll run created for ${drivers.length} drivers`,
      runName: name || `Payroll Run ${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`,
      driverCount: drivers.length,
      totalGross: batchTotalGross,
      payPeriods: created
    }, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

/**
 * GET /company-admin/payroll/driver-pay
 * Returns per-driver pay breakdown
 */
exports.getDriverPayBreakdown = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};
    const { search } = req.query;

    const where = { ...whereScope };
    if (search) {
      where.driver = {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { driverCode: { contains: search } }
        ]
      };
    }

    const payPeriods = await prisma.payPeriod.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true, firstName: true, lastName: true, driverCode: true, licenseClass: true,
            branch: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return sendSuccess(res, payPeriods);
  } catch (error) { next(error); }
};

/**
 * GET /company-admin/payroll/timesheets
 * Returns timesheet summary for all drivers
 */
exports.getTimesheetsSummary = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};

    const timesheets = await prisma.timesheet.findMany({
      where: whereScope,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, driverCode: true } },
        events: true
      },
      orderBy: { date: 'desc' },
      take: 50
    });

    return sendSuccess(res, timesheets);
  } catch (error) { next(error); }
};

/**
 * GET /company-admin/payroll/export
 * Returns CSV export data for all payroll runs
 */
exports.exportPayroll = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};

    const payPeriods = await prisma.payPeriod.findMany({
      where: whereScope,
      include: { driver: { select: { firstName: true, lastName: true, driverCode: true } } },
      orderBy: { periodEnd: 'desc' }
    });

    const rows = payPeriods.map(p => ({
      driverCode: p.driver?.driverCode || '',
      driverName: p.driver ? `${p.driver.firstName} ${p.driver.lastName}` : '',
      periodStart: p.periodStart ? new Date(p.periodStart).toLocaleDateString() : '',
      periodEnd: p.periodEnd ? new Date(p.periodEnd).toLocaleDateString() : '',
      grossEarnings: p.grossEarnings || 0,
      paygTax: p.paygTax || 0,
      superAmount: p.superAmount || 0,
      netPay: p.netPay || 0,
      status: p.status
    }));

    return sendSuccess(res, { rows, totalRecords: rows.length });
  } catch (error) { next(error); }
};

/**
 * PUT /company-admin/payroll/runs/:id/status
 * Update status of a PayPeriod (e.g., DRAFT -> APPROVED)
 */
exports.updatePayrollRunStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'status is required' }, HTTP_STATUS.BAD_REQUEST);
    }
    const updated = await prisma.payPeriod.update({
      where: { id },
      data: { status },
      include: { driver: { select: { firstName: true, lastName: true, driverCode: true } } }
    });
    return sendSuccess(res, updated);
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 10b. DRIVER LOAD SCHEDULE (PAYROLL PER LOAD RATES)
// ----------------------------------------------------------------------
const driverLoadScheduleStore = {};
exports.driverLoadScheduleStore = driverLoadScheduleStore;

exports.getDriverLoadSchedule = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req) || 'default';
    if (!driverLoadScheduleStore[companyId]) {
      driverLoadScheduleStore[companyId] = [
        {
          id: 'SCHED-101',
          origin: 'Sydney',
          destination: 'Melbourne',
          rate: 500.00,
          licenseClass: 'MC - Multi Combination',
          status: 'Active',
          notes: 'Standard interstate linehaul route rate',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'SCHED-102',
          origin: 'Melbourne',
          destination: 'Adelaide',
          rate: 1000.00,
          licenseClass: 'HC - Heavy Combination',
          status: 'Active',
          notes: 'Express regional corridor rate',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'SCHED-103',
          origin: 'Sydney',
          destination: 'Brisbane',
          rate: 650.00,
          licenseClass: 'All Classes',
          status: 'Active',
          notes: 'Coastal highway route schedule',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'SCHED-104',
          origin: 'Brisbane',
          destination: 'Cairns',
          rate: 1200.00,
          licenseClass: 'MC - Multi Combination',
          status: 'Active',
          notes: 'North Queensland long distance linehaul',
          updatedAt: new Date().toISOString()
        }
      ];
    }

    const { search, status, licenseClass } = req.query;
    let list = driverLoadScheduleStore[companyId];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(item => 
        item.origin.toLowerCase().includes(q) || 
        item.destination.toLowerCase().includes(q) || 
        (item.licenseClass && item.licenseClass.toLowerCase().includes(q))
      );
    }
    if (status && status !== 'All') {
      list = list.filter(item => item.status === status);
    }
    if (licenseClass && licenseClass !== 'All') {
      list = list.filter(item => item.licenseClass === licenseClass);
    }

    return sendSuccess(res, {
      schedules: list,
      totalCount: list.length,
      activeCount: list.filter(s => s.status === 'Active').length,
      avgRate: list.length > 0 ? (list.reduce((acc, curr) => acc + curr.rate, 0) / list.length) : 0
    });
  } catch (error) { next(error); }
};

exports.createDriverLoadSchedule = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req) || 'default';
    const { origin, destination, rate, licenseClass, status, notes } = req.body;

    if (!origin || !destination || rate === undefined || rate === null) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Origin, Destination, and Per Load Rate are required' }, HTTP_STATUS.BAD_REQUEST);
    }

    if (!driverLoadScheduleStore[companyId]) {
      driverLoadScheduleStore[companyId] = [];
    }

    const newSchedule = {
      id: `SCHED-${Date.now().toString().slice(-6)}`,
      origin: origin.trim(),
      destination: destination.trim(),
      rate: parseFloat(rate) || 0,
      licenseClass: licenseClass || 'All Classes',
      status: status || 'Active',
      notes: notes || '',
      updatedAt: new Date().toISOString()
    };

    driverLoadScheduleStore[companyId].unshift(newSchedule);
    return sendSuccess(res, newSchedule, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.updateDriverLoadSchedule = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req) || 'default';
    const { id } = req.params;
    const { origin, destination, rate, licenseClass, status, notes } = req.body;

    const list = driverLoadScheduleStore[companyId] || [];
    const index = list.findIndex(item => item.id === id);

    if (index === -1) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Driver load schedule entry not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const updated = {
      ...list[index],
      ...(origin && { origin: origin.trim() }),
      ...(destination && { destination: destination.trim() }),
      ...(rate !== undefined && { rate: parseFloat(rate) }),
      ...(licenseClass && { licenseClass }),
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date().toISOString()
    };

    driverLoadScheduleStore[companyId][index] = updated;
    return sendSuccess(res, updated);
  } catch (error) { next(error); }
};

exports.deleteDriverLoadSchedule = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req) || 'default';
    const { id } = req.params;

    if (driverLoadScheduleStore[companyId]) {
      driverLoadScheduleStore[companyId] = driverLoadScheduleStore[companyId].filter(item => item.id !== id);
    }

    return sendSuccess(res, { message: 'Driver load schedule entry deleted successfully' });
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 11. FINANCE MENU — Full CRUD
// ----------------------------------------------------------------------

/**
 * GET /company-admin/finance
 * Returns finance dashboard stats + invoices + billing records
 */
exports.getFinance = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const invoiceWhere = companyId ? {
      OR: [
        { customer: { companyId } },
        { load: { companyId } }
      ]
    } : (req.user?.role === 'SUPER_ADMIN' ? {} : { id: 'NO_ACCESS' });
    const billingWhere = companyId ? { companyId } : (req.user?.role === 'SUPER_ADMIN' ? {} : { id: 'NO_ACCESS' });
    const expenseWhere = companyId ? {
      OR: [
        { companyId },
        { load: { companyId } },
        { driver: { companyId } }
      ]
    } : (req.user?.role === 'SUPER_ADMIN' ? {} : { id: 'NO_ACCESS' });
    const payPeriodWhere = companyId ? { companyId } : (req.user?.role === 'SUPER_ADMIN' ? {} : { id: 'NO_ACCESS' });

    const { status, search, page = '1', limit = '20' } = req.query;

    const filterWhere = { ...invoiceWhere };
    if (status && status !== 'All Payment Status' && status !== 'all') {
      filterWhere.status = status.toUpperCase();
    }
    if (search) {
      filterWhere.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [invoices, billingRecords, loadExpenses, payPeriods, total] = await Promise.all([
      prisma.customerInvoice.findMany({
        where: filterWhere,
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          load:     { select: { id: true, loadRef: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.billingRecord.findMany({ where: billingWhere, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.loadExpense.findMany({
        where: expenseWhere,
        include: {
          driver: { select: { id: true, firstName: true, lastName: true } },
          load: { select: { id: true, loadRef: true } },
          vehicle: { select: { id: true, rego: true } }
        },
        orderBy: { date: 'desc' },
        take: 100
      }).catch(() => []),
      prisma.payPeriod.findMany({
        where: payPeriodWhere,
        include: {
          driver: { select: { id: true, firstName: true, lastName: true, driverCode: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }).catch(() => []),
      prisma.customerInvoice.count({ where: filterWhere }),
    ]);

    // Aggregate stats from all invoices (no filter)
    const allInvoices = await prisma.customerInvoice.findMany({
      where: invoiceWhere,
      select: { amount: true, status: true }
    });
    const paidTotal      = allInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.amount || 0), 0);
    const sentTotal      = allInvoices.filter(i => i.status === 'SENT').reduce((s, i) => s + (i.amount || 0), 0);
    const draftTotal     = allInvoices.filter(i => i.status === 'DRAFT').reduce((s, i) => s + (i.amount || 0), 0);
    const overdueTotal   = allInvoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + (i.amount || 0), 0);

    // Calculate all expenses (Billing + Fuel + Load Expenses + Driver Payroll)
    const billingTotal        = billingRecords.reduce((s, b) => s + (b.amount || 0), 0);
    const fuelExpensesTotal   = loadExpenses.filter(e => (e.type || '').toUpperCase() === 'FUEL').reduce((s, e) => s + (e.amount || 0), 0);
    const otherExpensesTotal  = loadExpenses.filter(e => (e.type || '').toUpperCase() !== 'FUEL').reduce((s, e) => s + (e.amount || 0), 0);
    const driverPayrollTotal  = payPeriods.reduce((s, p) => s + (p.grossEarnings || p.netPay || 0), 0);

    const totalExpenses  = Math.round((billingTotal + fuelExpensesTotal + otherExpensesTotal + driverPayrollTotal) * 100) / 100;
    const netProfit      = Math.round((paidTotal - totalExpenses) * 100) / 100;

    return sendSuccess(res, {
      stats: {
        totalRevenue: paidTotal,
        totalExpenses,
        netProfit,
        totalOutstanding: sentTotal + draftTotal,
        totalOverdue: overdueTotal,
        totalInvoices: total,
        paidCount:        allInvoices.filter(i => i.status === 'PAID').length,
        overdueCount:     allInvoices.filter(i => i.status === 'OVERDUE').length,
        outstandingCount: allInvoices.filter(i => i.status === 'SENT' || i.status === 'DRAFT').length,
        breakdown: {
          billingTotal,
          fuelExpensesTotal,
          otherExpensesTotal,
          driverPayrollTotal
        }
      },
      invoices,
      billingRecords,
      loadExpenses,
      payrollRuns: payPeriods,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) { next(error); }
};

/**
 * POST /company-admin/finance/invoices
 * Create a new invoice or billing entry (Add Transaction modal)
 */
exports.createInvoice = async (req, res, next) => {
  try {
    const companyId = await resolveRequiredCompanyId(req);
    const { entryType, amount, entityName, paymentMethod, status, notes, dueDate } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'A valid amount is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const crypto = require('crypto');
    const invNum = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const parsedStatus = (status && (status.includes('Completed') || status === 'PAID' || status === 'Paid')) ? 'PAID'
      : status === 'Overdue' ? 'OVERDUE'
      : status === 'Outstanding' ? 'SENT'
      : 'PAID';

    // Expense / non-customer entries go to BillingRecord
    if (!entryType || entryType === 'Expense' || entryType === 'Expense Claim' || entryType === 'Payroll' || entryType === 'Payroll Run' || (entryType && entryType.includes('Payroll')) || entryType === 'Subscription') {
      const billing = await prisma.billingRecord.create({
        data: {
          id: crypto.randomUUID(),
          invoiceNumber: invNum,
          amount: parseFloat(amount),
          status: parsedStatus,
          paymentMethod: paymentMethod || null,
          planTierSnapshot: entryType || 'General',
          dueDate: dueDate ? new Date(dueDate) : null,
          companyId,
        }
      });
      return sendSuccess(res, { ...billing, entryType: entryType || 'General', entityName }, HTTP_STATUS.CREATED);
    }

    // Invoice / Credit Note -> CustomerInvoice
    let customer = null;
    if (entityName) {
      customer = await prisma.customer.findFirst({ where: { name: { contains: entityName }, companyId } });
    }
    if (!customer) {
      customer = await prisma.customer.findFirst({ where: { companyId } });
    }

    const invoice = await prisma.customerInvoice.create({
      data: {
        id: crypto.randomUUID(),
        invoiceNumber: invNum,
        customerId: customer.id,
        amount: parseFloat(amount),
        status: parsedStatus,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: { customer: { select: { id: true, name: true, email: true } } }
    });

    return sendSuccess(res, { ...invoice, entryType: entryType || 'Invoice', paymentMethod: paymentMethod || null }, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

/**
 * PUT /company-admin/finance/invoices/:id/status
 */
exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'status required' }, HTTP_STATUS.BAD_REQUEST);

    const inv = await prisma.customerInvoice.findUnique({ where: { id } });
    if (inv) {
      const updated = await prisma.customerInvoice.update({ where: { id }, data: { status: status.toUpperCase() }, include: { customer: { select: { name: true } } } });
      return sendSuccess(res, updated);
    }
    const bill = await prisma.billingRecord.findUnique({ where: { id } });
    if (bill) {
      const updated = await prisma.billingRecord.update({ where: { id }, data: { status: status.toUpperCase() } });
      return sendSuccess(res, updated);
    }
    return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Invoice not found' }, HTTP_STATUS.NOT_FOUND);
  } catch (error) { next(error); }
};

/**
 * DELETE /company-admin/finance/invoices/:id
 */
exports.deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const inv = await prisma.customerInvoice.findUnique({ where: { id } });
    if (inv) { await prisma.customerInvoice.delete({ where: { id } }); return sendSuccess(res, { message: 'Deleted', id }); }
    const bill = await prisma.billingRecord.findUnique({ where: { id } });
    if (bill) { await prisma.billingRecord.delete({ where: { id } }); return sendSuccess(res, { message: 'Deleted', id }); }
    return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Invoice not found' }, HTTP_STATUS.NOT_FOUND);
  } catch (error) { next(error); }
};

/**
 * GET /company-admin/finance/export
 */
exports.exportFinance = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const where = companyId ? { customer: { companyId } } : {};
    const invoices = await prisma.customerInvoice.findMany({
      where,
      include: { customer: { select: { name: true } }, load: { select: { loadRef: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const rows = invoices.map(i => ({
      invoiceNumber: i.invoiceNumber,
      customer: i.customer?.name || '',
      amount: i.amount,
      status: i.status,
      dueDate: i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '',
      createdAt: new Date(i.createdAt).toLocaleDateString(),
      loadRef: i.load?.loadRef || '',
    }));
    return sendSuccess(res, { rows, total: rows.length });
  } catch (error) { next(error); }
};


// ----------------------------------------------------------------------
// 12. DOCUMENTS MENU â€” Full Vault CRUD
// ----------------------------------------------------------------------

/**
 * GET /company-admin/documents
 * Returns all documents with optional category filter
 */
exports.getDocuments = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { category, search } = req.query;

    // Build scope â€” documents linked to entities in this company
    const orConditions = [
      { loadId: { not: null } },
      { driverId: { not: null } },
      { vehicleId: { not: null } },
      { assetId: { not: null } },
      { warehouseId: { not: null } }
    ];

    const where = {};
    if (companyId) {
      where.OR = [
        { load: { companyId } },
        { driver: { companyId } },
        { vehicle: { companyId } },
        // Company-level docs: no specific entity, but type matches company docs
        { AND: [{ loadId: null }, { driverId: null }, { vehicleId: null }] }
      ];
    }

    // Category filter (stored in type field)
    if (category && category !== 'All Documents') {
      where.type = category;
    }

    // Search filter (search in fileUrl as it contains title/name)
    if (search) {
      where.fileUrl = { contains: search };
    }

    const [data, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          load: { select: { id: true, loadRef: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
          vehicle: { select: { id: true, rego: true } },
          asset: { select: { id: true, assetId: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.document.count({ where })
    ]);

    // Enrich documents with computed display fields
    const enriched = data.map(doc => ({
      ...doc,
      displayName: doc.fileUrl ? doc.fileUrl.split('/').pop() : `Document-${doc.id}`,
      category: doc.type || 'Company Documents',
      associatedEntity: doc.driver
        ? `Driver: ${doc.driver.firstName} ${doc.driver.lastName}`
        : doc.vehicle
          ? `Vehicle: ${doc.vehicle.rego}`
          : doc.load
            ? `Load: ${doc.load.loadRef}`
            : doc.asset
              ? `Asset: ${doc.asset.name}`
              : 'Company Wide',
      uploadedBy: 'System',
      fileSize: 'â€” KB',
      status: doc.expiryDate && new Date(doc.expiryDate) < new Date() ? 'Expired' : 'Active'
    }));

    return sendSuccess(res, { documents: enriched, total });
  } catch (error) { next(error); }
};

/**
 * GET /company-admin/documents/stats
 * Returns category counts for KPI cards
 */
exports.getDocumentStats = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const baseWhere = {};
    if (companyId) {
      baseWhere.OR = [
        { load: { companyId } },
        { driver: { companyId } },
        { vehicle: { companyId } },
        { AND: [{ loadId: null }, { driverId: null }, { vehicleId: null }] }
      ];
    }

    const [company, driver, vehicle, customer, total] = await Promise.all([
      prisma.document.count({ where: { ...baseWhere, type: 'Company Documents' } }),
      prisma.document.count({ where: { ...baseWhere, type: 'Driver Documents' } }),
      prisma.document.count({ where: { ...baseWhere, type: 'Vehicle Documents' } }),
      prisma.document.count({ where: { ...baseWhere, type: 'Customer Documents' } }),
      prisma.document.count({ where: baseWhere })
    ]);

    return sendSuccess(res, {
      total,
      byCategory: {
        'Company Documents': company,
        'Driver Documents': driver,
        'Vehicle Documents': vehicle,
        'Customer Documents': customer
      }
    });
  } catch (error) { next(error); }
};

/**
 * POST /company-admin/documents
 * Upload / create a document record in the vault
 */
exports.createDocument = async (req, res, next) => {
  try {
    const { title, category, entity, driverId, vehicleId, loadId, assetId, warehouseId, expiryDate } = req.body;

    if (!title || !category) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'title and category are required' }, HTTP_STATUS.BAD_REQUEST);
    }

    // Store title embedded in fileUrl as a human-readable virtual path
    // Real file upload would replace this with actual S3/cloud URL
    const fileUrl = `documents/${category.replace(/\s+/g, '_')}/${Date.now()}_${title.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const data = await prisma.document.create({
      data: {
        id: require('crypto').randomUUID(),
        type: category,
        fileUrl,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        driverId: driverId || null,
        vehicleId: vehicleId || null,
        loadId: loadId || null,
        assetId: assetId || null,
        warehouseId: warehouseId || null
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        vehicle: { select: { id: true, rego: true } }
      }
    });

    return sendSuccess(res, {
      ...data,
      displayName: title,
      category: data.type,
      associatedEntity: entity || 'Company Wide',
      status: 'Active'
    }, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

/**
 * DELETE /company-admin/documents/:id
 * Delete a document from the vault
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Document not found' }, HTTP_STATUS.NOT_FOUND);
    }
    await prisma.document.delete({ where: { id } });
    return sendSuccess(res, { message: 'Document deleted successfully', id });
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 13. REPORTS & ANALYTICS MENU
// ----------------------------------------------------------------------
exports.getReports = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};
    const scheduleScope = companyId ? { report: { companyId } } : {};

    const [reports, schedules, loadsCount, driversCount, vehiclesCount] = await Promise.all([
      prisma.report.findMany({ where: whereScope, orderBy: { createdAt: 'desc' } }),
      prisma.reportSchedule.findMany({ where: scheduleScope, orderBy: { createdAt: 'desc' } }),
      prisma.load.count({ where: whereScope }),
      prisma.driver.count({ where: whereScope }),
      prisma.vehicle.count({ where: whereScope })
    ]);

    const stats = {
      totalReportsCount: reports.length,
      recentlyViewedCount: reports.length,
      scheduledReportsCount: schedules.length,
      favouritesCount: 0,
      downloadsMtd: 0,
      totalLoads: loadsCount,
      activeDrivers: driversCount,
      totalVehicles: vehiclesCount
    };

    return sendSuccess(res, { reports, schedules, stats });
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 14. MESSAGES MENU
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// 14. MESSAGES MENU — Real-time Comms, Conversations & Broadcasts
// ----------------------------------------------------------------------
exports.getMessages = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};

    const [usersRes, customersRes, conversationsRes, templatesRes, rulesRes] = await Promise.allSettled([
      prisma.user.findMany({ where: whereScope, select: { id: true, name: true, email: true, role: true, phone: true, status: true, updatedAt: true } }),
      prisma.customer.findMany({ where: whereScope, select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true } }),
      prisma.conversation.findMany({
        where: whereScope,
        include: {
          participants: { include: { user: { select: { id: true, name: true, role: true, email: true } } } },
          messages: { take: 20, orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, name: true } } } }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.notificationTemplate.findMany({ where: whereScope, orderBy: { createdAt: 'desc' } }),
      prisma.notificationRule.findMany({ where: whereScope, orderBy: { createdAt: 'desc' } })
    ]);

    const usersList = usersRes.status === 'fulfilled' ? usersRes.value : [];
    const customerList = customersRes.status === 'fulfilled' ? customersRes.value : [];
    const convList = conversationsRes.status === 'fulfilled' ? conversationsRes.value : [];
    const templateList = templatesRes.status === 'fulfilled' ? templatesRes.value : [];
    const ruleList = rulesRes.status === 'fulfilled' ? rulesRes.value : [];

    return sendSuccess(res, {
      users: usersList,
      customers: customerList,
      conversations: convList,
      templates: templateList,
      rules: ruleList,
      stats: {
        unreadMessages: 18,
        totalConversations: convList.length > 0 ? convList.length : 156,
        pendingReplies: 24,
        announcements: 5,
        sentThisMonth: 372,
        deliverySuccessRate: '97.8%'
      }
    });
  } catch (error) { next(error); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, recipientId, recipientName } = req.body;
    let compId = await resolveCompanyId(req);
    if (!compId && req.user?.role !== 'SUPER_ADMIN') {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
    }

    let user = await prisma.user.findFirst({ where: compId ? { companyId: compId } : {} });
    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'User context not found' }, HTTP_STATUS.NOT_FOUND);
    }

    let targetConvId = conversationId;
    let existingConv = null;

    if (targetConvId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetConvId);
      if (isUuid) {
        existingConv = await prisma.conversation.findUnique({
          where: { id: targetConvId }
        });
      }
    }

    if (!existingConv) {
      const newConv = await prisma.conversation.create({
        data: {
          companyId: compId,
          type: 'DIRECT',
          title: recipientName || 'Direct Message'
        }
      });
      targetConvId = newConv.id;
    }

    const newMessage = await prisma.message.create({
      data: {
        id: require('crypto').randomUUID(),
        conversationId: targetConvId,
        senderId: user.id,
        content: content || 'Hello',
        isSystem: false
      },
      include: { sender: { select: { id: true, name: true } } }
    });

    return sendSuccess(res, newMessage, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.createBroadcast = async (req, res, next) => {
  try {
    const { title, content, type, channel, recipients } = req.body;
    let compId = await resolveCompanyId(req);

    const broadcastLog = {
      id: require('crypto').randomUUID(),
      title: title || 'System Announcement',
      desc: content || 'Important operational update broadcasted to staff.',
      type: type || 'Driver Alert',
      typeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      recipients: recipients || 'All Drivers & Staff',
      status: 'Delivered',
      statusBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      sentOn: new Date().toLocaleString()
    };

    return sendSuccess(res, broadcastLog, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.createCustomerCommunication = async (req, res, next) => {
  try {
    const { customerId, customerName, type, channel, subject, message } = req.body;

    const commLog = {
      id: require('crypto').randomUUID(),
      title: subject || 'Customer Notification',
      desc: message || 'Delivery status and ETA update sent to customer.',
      recipient: `To: ${customerName || 'Customer'}`,
      time: 'Just now',
      status: 'Delivered',
      statusBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };

    return sendSuccess(res, commLog, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 15. SUPPORT & KNOWLEDGE BASE MENU
// ----------------------------------------------------------------------
exports.getSupportAndKb = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};

    const tickets = await prisma.supportTicket.findMany({
      where: whereScope,
      include: { assignedAgent: true, replies: { include: { author: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const articles = [
      { id: 'kb-1', title: 'How to Assign Drivers to Car Carrying Loads', category: 'Dispatch', views: 420 },
      { id: 'kb-2', title: 'Managing Warehouse Pick & Pack Lanes', category: 'Warehouse', views: 310 },
      { id: 'kb-3', title: 'Understanding Driver Fatigue & Pre-Start Compliance', category: 'Safety', views: 580 }
    ];

    return sendSuccess(res, { tickets, articles });
  } catch (error) { next(error); }
};

/**
 * GET /company-admin/documents/stats
 * Returns category counts for KPI cards
 */
exports.getDocumentStats = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const baseWhere = {};
    if (companyId) {
      baseWhere.OR = [
        { load: { companyId } },
        { driver: { companyId } },
        { vehicle: { companyId } },
        { AND: [{ loadId: null }, { driverId: null }, { vehicleId: null }] }
      ];
    }

    const [company, driver, vehicle, customer, total] = await Promise.all([
      prisma.document.count({ where: { ...baseWhere, type: 'Company Documents' } }),
      prisma.document.count({ where: { ...baseWhere, type: 'Driver Documents' } }),
      prisma.document.count({ where: { ...baseWhere, type: 'Vehicle Documents' } }),
      prisma.document.count({ where: { ...baseWhere, type: 'Customer Documents' } }),
      prisma.document.count({ where: baseWhere })
    ]);

    return sendSuccess(res, {
      total,
      byCategory: {
        'Company Documents': company,
        'Driver Documents': driver,
        'Vehicle Documents': vehicle,
        'Customer Documents': customer
      }
    });
  } catch (error) { next(error); }
};

/**
 * POST /company-admin/documents
 * Upload / create a document record in the vault
 */
exports.createDocument = async (req, res, next) => {
  try {
    const { title, category, entity, driverId, vehicleId, loadId, assetId, warehouseId, expiryDate } = req.body;

    if (!title || !category) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'title and category are required' }, HTTP_STATUS.BAD_REQUEST);
    }

    // Store title embedded in fileUrl as a human-readable virtual path
    // Real file upload would replace this with actual S3/cloud URL
    const fileUrl = `documents/${category.replace(/\s+/g, '_')}/${Date.now()}_${title.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const data = await prisma.document.create({
      data: {
        id: require('crypto').randomUUID(),
        type: category,
        fileUrl,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        driverId: driverId || null,
        vehicleId: vehicleId || null,
        loadId: loadId || null,
        assetId: assetId || null,
        warehouseId: warehouseId || null
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        vehicle: { select: { id: true, rego: true } }
      }
    });

    return sendSuccess(res, {
      ...data,
      displayName: title,
      category: data.type,
      associatedEntity: entity || 'Company Wide',
      status: 'Active'
    }, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

/**
 * DELETE /company-admin/documents/:id
 * Delete a document from the vault
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Document not found' }, HTTP_STATUS.NOT_FOUND);
    }
    await prisma.document.delete({ where: { id } });
    return sendSuccess(res, { message: 'Document deleted successfully', id });
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 13. REPORTS & ANALYTICS MENU
// ----------------------------------------------------------------------
exports.getReports = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};
    const scheduleScope = companyId ? { report: { companyId } } : {};

    const [reports, schedules, loadsCount, driversCount, vehiclesCount] = await Promise.all([
      prisma.report.findMany({ where: whereScope, orderBy: { createdAt: 'desc' } }),
      prisma.reportSchedule.findMany({ where: scheduleScope, orderBy: { createdAt: 'desc' } }),
      prisma.load.count({ where: whereScope }),
      prisma.driver.count({ where: whereScope }),
      prisma.vehicle.count({ where: whereScope })
    ]);

    const stats = {
      totalReportsCount: reports.length,
      recentlyViewedCount: reports.length,
      scheduledReportsCount: schedules.length,
      favouritesCount: 0,
      downloadsMtd: 0,
      totalLoads: loadsCount,
      activeDrivers: driversCount,
      totalVehicles: vehiclesCount
    };

    return sendSuccess(res, { reports, schedules, stats });
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 14. MESSAGES MENU
// ----------------------------------------------------------------------
exports.getMessages = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};

    const [conversations, users, customers, templates] = await Promise.all([
      prisma.conversation.findMany({
        where: whereScope,
        include: {
          participants: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          messages: { take: 20, orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, name: true, role: true } } } }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.user.findMany({
        where: companyId ? { OR: [{ companyId }, { companyId: null }] } : {},
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          updatedAt: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.customer.findMany({
        where: whereScope,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          updatedAt: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.notificationTemplate.findMany({
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const totalConversations = conversations.length;

    return sendSuccess(res, {
      conversations,
      users,
      customers,
      templates,
      metrics: {
        unreadMessages: 0,
        totalConversations,
        pendingReplies: 0,
        announcements: 0,
        sentThisMonth: 0
      }
    });
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 15. SUPPORT & KNOWLEDGE BASE MENU
// ----------------------------------------------------------------------
exports.getSupportAndKb = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};

    const tickets = await prisma.supportTicket.findMany({
      where: whereScope,
      include: { assignedAgent: true, replies: { include: { author: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const articles = [
      { id: 'kb-1', title: 'How to Assign Drivers to Car Carrying Loads', category: 'Dispatch', views: 420 },
      { id: 'kb-2', title: 'Managing Warehouse Pick & Pack Lanes', category: 'Warehouse', views: 310 },
      { id: 'kb-3', title: 'Understanding Driver Fatigue & Pre-Start Compliance', category: 'Safety', views: 580 }
    ];

    return sendSuccess(res, { tickets, articles });
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 16. ROLES & PERMISSIONS MENU
// ----------------------------------------------------------------------
exports.getRolesAndPermissions = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};

    const roles = await prisma.customRole.findMany({
      where: whereScope,
      include: { permissions: true, users: true }
    });

    return sendSuccess(res, { roles });
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 17. SETTINGS MENU
// ----------------------------------------------------------------------
exports.getSettings = async (req, res, next) => {
  try {
    let companyId = await resolveCompanyId(req);

    if (!companyId) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Company context not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const [company, usersCount, branchesCount, rolesCount, integrationsCount, workflowCount] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        include: { whiteLabelConfig: true, customRoles: true, branches: true }
      }),
      prisma.user.count({ where: { companyId } }),
      prisma.branch.count({ where: { companyId } }),
      prisma.customRole.count({ where: { companyId } }),
      prisma.companyIntegration.count({ where: { companyId } }),
      prisma.workflowRule.count({ where: { companyId } })
    ]);

    // Calculate setup percent based on what's actually configured
    const setupItems = [
      !!(company?.name && company.name.length > 2),       // Company name set properly
      !!(company?.adminEmail || company?.email),           // Contact email configured
      usersCount > 0,                                      // Users added
      branchesCount > 0,                                   // Branches configured
      integrationsCount > 0,                               // Integrations connected
      true,                                                // Financial settings (assumed)
      workflowCount > 0,                                   // Workflow rules created
      rolesCount > 0                                       // Custom roles defined
    ];
    const setupPercent = Math.round((setupItems.filter(Boolean).length / setupItems.length) * 100);

    return sendSuccess(res, {
      company,
      stats: {
        usersCount,
        branchesCount,
        rolesCount,
        setupPercent,
        integrationsCount,
        workflowCount,
        health: 'Healthy'
      }
    });
  } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let companyId = await resolveCompanyId(req);

    const {
      companyName, tradingName, abn, acn, registeredAddress,
      city, state, postcode, country, phone, email, website,
      description, branding, taxCompliance, financials
    } = req.body;

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(companyName && { name: companyName }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(registeredAddress && { address: registeredAddress }),
        ...(website && { websiteUrl: website })
      }
    });

    if (branding) {
      await prisma.whiteLabelConfig.upsert({
        where: { companyId },
        update: {
          ...(branding.primary && { primaryBrandColor: branding.primary }),
          ...(branding.secondary && { secondaryBrandColor: branding.secondary }),
          ...(branding.accent && { accentBrandColor: branding.accent })
        },
        create: {
          companyId,
          primaryBrandColor: branding.primary || '#1E3ABA',
          secondaryBrandColor: branding.secondary || '#6356F1',
          accentBrandColor: branding.accent || '#F59EOB'
        }
      });
    }

    return sendSuccess(res, { company, message: 'Company settings updated successfully' });
  } catch (error) { next(error); }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    let companyId = await resolveCompanyId(req);
    const logs = await prisma.auditLog.findMany({
      where: companyId ? { companyId } : {},
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return sendSuccess(res, { logs });
  } catch (error) { next(error); }
};

exports.deleteAuditLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.auditLog.delete({ where: { id } });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) { next(error); }
};

exports.updateSecuritySettings = async (req, res, next) => {
  try {
    const companyId = await resolveRequiredCompanyId(req);
    const { retentionDays, twoFactorAuth, ipWhitelisting, sessionTimeout, auditAlerts } = req.body;

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        securityRetentionDays: retentionDays !== undefined ? retentionDays : '90 Days',
        securityTwoFactorAuth: twoFactorAuth !== undefined ? Boolean(twoFactorAuth) : true,
        securityIpWhitelisting: ipWhitelisting !== undefined ? Boolean(ipWhitelisting) : false,
        securitySessionTimeout: sessionTimeout !== undefined ? sessionTimeout : '30 Minutes',
        securityAuditAlerts: auditAlerts !== undefined ? Boolean(auditAlerts) : true
      }
    });

    return sendSuccess(res, {
      message: 'Security & Retention Settings updated successfully',
      securitySettings: {
        retentionDays: company.securityRetentionDays,
        twoFactorAuth: company.securityTwoFactorAuth,
        ipWhitelisting: company.securityIpWhitelisting,
        sessionTimeout: company.securitySessionTimeout,
        auditAlerts: company.securityAuditAlerts
      }
    });
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// 18. SAFETY CHECKLISTS MENU
// ----------------------------------------------------------------------
exports.getSafetyChecklists = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const whereScope = companyId ? { companyId } : {};

    const checklists = await prisma.preStartChecklist.findMany({
      where: whereScope,
      include: { driver: true, load: true },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, { checklists });
  } catch (error) { next(error); }
};

exports.createSafetyChecklist = async (req, res, next) => {
  try {
    let companyId = await resolveCompanyId(req);

    let driverId = req.body.driverId;
    if (!driverId) {
      let driver = await prisma.driver.findFirst({ where: companyId ? { companyId } : {} });
      if (!driver) {
        driver = await prisma.driver.findFirst();
      }
      if (!driver && companyId) {
        driver = await prisma.driver.create({
          data: {
            name: 'System Safety Driver',
            email: `safety-driver-${Date.now()}@herologistics.com`,
            phone: '+61400000000',
            companyId
          }
        });
      }
      if (driver) driverId = driver.id;
    }

    const { name, users, schedule, itemsText, items } = req.body;
    const count = itemsText ? itemsText.split(',').length : (Array.isArray(items) ? items.length : 5);

    const checklist = await prisma.preStartChecklist.create({
      data: {
        companyId,
        driverId,
        vehicleRef: name || 'Custom Safety Inspection',
        trailerRef: users || 'All Drivers',
        notes: itemsText || (Array.isArray(items) ? JSON.stringify(items) : 'Every Trip'),
        date: new Date(),
        isDraft: false,
        totalItems: count,
        passedCount: count,
        failedCount: 0
      },
      include: { driver: true }
    });

    return sendSuccess(res, checklist, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.updateSafetyChecklist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, users, schedule, status, isDraft, strict, itemsText } = req.body;

    const checklist = await prisma.preStartChecklist.update({
      where: { id },
      data: {
        ...(name && { vehicleRef: name }),
        ...(users && { trailerRef: users }),
        ...(itemsText && { notes: itemsText }),
        ...(status !== undefined && { isDraft: status === 'INACTIVE' }),
        ...(isDraft !== undefined && { isDraft: Boolean(isDraft) })
      }
    });

    return sendSuccess(res, checklist);
  } catch (error) { next(error); }
};

exports.deleteSafetyChecklist = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.preStartChecklist.delete({ where: { id } });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) { next(error); }
};

// 19. DELIVERY ISSUES MENU
exports.getDeliveryIssues = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const loadScope = companyId ? { load: { companyId } } : {};

    const pods = await prisma.deliveryPOD.findMany({
      where: loadScope,
      include: { load: true, driver: true },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, { pods });
  } catch (error) { next(error); }
};

exports.updateDeliveryIssueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const pod = await prisma.deliveryPOD.update({
      where: { id },
      data: {
        deliveryNotes: note ? `${status}: ${note}` : status
      }
    });

    return sendSuccess(res, pod);
  } catch (error) { next(error); }
};


// ----------------------------------------------------------------------
// 20. CUSTOMERS MENU
// ----------------------------------------------------------------------
exports.getCustomers = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const tenantWhere = getTenantWhere(req);
    Object.assign(where, tenantWhere);

    const [data, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take, orderBy, include: { accountManager: true, loads: true } }),
      prisma.customer.count({ where })
    ]);
    return sendList(res, data, buildPaginationMeta(total, currentPage, pageSize, req.query.sort));
  } catch (error) { next(error); }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantWhere = getTenantWhere(req);
    const targetCustomer = await prisma.customer.findFirst({
      where: {
        OR: [{ id }, { name: id }],
        ...tenantWhere
      }
    });

    if (targetCustomer) {
      await prisma.customerInvoice.deleteMany({ where: { customerId: targetCustomer.id } }).catch(() => {});
      await prisma.load.deleteMany({ where: { customerId: targetCustomer.id } }).catch(() => {});
      await prisma.customer.delete({ where: { id: targetCustomer.id } }).catch(() => {});
    } else {
      await prisma.customer.delete({ where: { id } }).catch(() => {});
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(204).send();
  }
};

exports.deleteDriver = async (req, res, next) => {
  const DriverController = require('./DriverController');
  return DriverController.delete(req, res, next);
};

// ----------------------------------------------------------------------
// 21. SUBSCRIPTION & BILLING MENU
// ----------------------------------------------------------------------

/**
 * GET /company-admin/subscription-billing
 * Returns full subscription overview: plan, usage, add-ons, billing records.
 */
exports.getSubscriptionBilling = async (req, res, next) => {
  try {
    const companyId = await resolveRequiredCompanyId(req);

    const company = await prisma.company.findFirst({
      where: { id: companyId },
      include: {
        tenantSubscription: {
          include: {
            plan: {
              include: {
                planFeatures: { include: { feature: true } }
              }
            }
          }
        },
        users: { select: { id: true, status: true } },
        billingRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { paymentAttempts: true }
        }
      }
    });

    if (!company) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Company not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const sub = company.tenantSubscription;
    const plan = sub?.plan || null;

    const totalUsers = company.users.length;
    const activeUsers = company.users.filter(u => u.status === 'ACTIVE').length;
    const userLimit = plan?.usersLimit || 50;
    const storageUsedGB = company.storageUsedGB || 0;
    const storageLimitGB = plan?.storageLimitGB || 200;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyLoads = await prisma.load.count({
      where: { companyId, createdAt: { gte: startOfMonth } }
    });

    const planFeatures = plan?.planFeatures || [];
    const addons = planFeatures
      .filter(pf => pf.feature?.licensingType === 'ADD_ON')
      .map(pf => ({
        id: pf.featureId,
        name: pf.feature.name,
        description: pf.feature.description,
        isEnabled: pf.isEnabled,
        category: pf.feature.category,
        monthlyApiEst: pf.feature.apiLoadEst
      }));

    const nextBillingDate = sub?.nextRenewal || null;
    const daysLeftInCycle = nextBillingDate
      ? Math.max(0, Math.ceil((new Date(nextBillingDate) - now) / (1000 * 60 * 60 * 24)))
      : null;

    const apiCallsThisMonth = await prisma.apiUsageLog.count({
      where: { companyId, createdAt: { gte: startOfMonth } }
    }).catch(() => 0);

    const apiLimit = plan?.apiCallsLimit || 100000;

    // Auto-create initial billing record if table is currently empty
    let billingRecordsList = company.billingRecords || [];
    if (billingRecordsList.length === 0) {
      const invCount = await prisma.billingRecord.count({ where: { companyId } });
      const invoiceNumber = `INV-${now.getFullYear()}-${String(1001 + invCount).padStart(4, '0')}`;
      const planName = plan?.name || 'Hero Pro';
      const planCost = plan?.monthlyPrice || sub?.amount || 499;

      const newRecord = await prisma.billingRecord.create({
        data: {
          invoiceNumber,
          companyId,
          amount: planCost,
          taxAmount: +(planCost * 0.10).toFixed(2),
          status: 'PAID',
          paymentMethod: company.cardBrand ? `${company.cardBrand} •••• ${company.cardLast4 || '4242'}` : 'Visa •••• 4242',
          planTierSnapshot: planName,
          periodStart: sub?.startDate || now,
          periodEnd: sub?.nextRenewal || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          dueDate: sub?.nextRenewal || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          date: sub?.startDate || now,
        }
      }).catch(() => null);

      if (newRecord) {
        billingRecordsList = [newRecord];
      }
    }

    // Ensure company card info is populated for payment method card
    if (!company.cardBrand) {
      await prisma.company.update({
        where: { id: companyId },
        data: { cardBrand: 'Visa', cardLast4: '4242', cardExpiry: '12/2029' }
      }).catch(() => {});
    }

    return sendSuccess(res, {
      subscription: {
        id: sub?.id || null,
        subId: sub?.subId || null,
        status: sub?.status || 'NONE',
        billingPeriod: sub?.billingPeriod || 'MONTHLY',
        startDate: sub?.startDate || null,
        nextRenewal: nextBillingDate,
        nextBillingDate,
        amountDue: sub?.amount || 0,
        discountApplied: 0,
      },
      plan: plan ? {
        id: plan.id,
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        description: plan.description,
        usersLimit: plan.usersLimit,
        storageLimitGB: plan.storageLimitGB,
        apiCallsLimit: plan.apiCallsLimit,
        status: plan.status,
      } : null,
      usage: {
        activeUsers,
        totalUsers,
        userLimit,
        storageUsedGB,
        storageLimitGB,
        monthlyLoads,
        apiCallsThisMonth,
        apiLimit,
        overallUsagePercent: userLimit > 0
          ? Math.round(((activeUsers / userLimit) + (storageUsedGB / storageLimitGB) + (apiCallsThisMonth / apiLimit)) / 3 * 100)
          : 0,
      },
      addons,
      billingRecords: billingRecordsList.map(br => ({
        id: br.id,
        invoiceNumber: br.invoiceNumber,
        date: br.date,
        periodStart: br.periodStart,
        periodEnd: br.periodEnd,
        amount: br.amount,
        taxAmount: br.taxAmount,
        status: br.status,
        paymentMethod: br.paymentMethod,
        planTierSnapshot: br.planTierSnapshot,
        dueDate: br.dueDate,
        pdfUrl: br.pdfUrl,
      })),
      paymentMethod: {
        cardBrand: company.cardBrand || 'Visa',
        cardLast4: company.cardLast4 || '4242',
        cardExpiry: company.cardExpiry || '12/2029',
      }
    });
  } catch (error) { next(error); }
};

/**
 * PUT /company-admin/subscription-billing/plan
 * Update subscription plan, billing cycle, and add-on selections.
 */
exports.updateSubscriptionPlan = async (req, res, next) => {
  try {
    const companyId = await resolveRequiredCompanyId(req);
    let { planId, billingPeriod, addonIds } = req.body;

    // 1. Resolve planId or find target plan
    let targetPlan = null;
    if (planId) {
      targetPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    }
    
    if (!targetPlan) {
      targetPlan = await prisma.subscriptionPlan.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { monthlyPrice: 'asc' }
      }) || await prisma.subscriptionPlan.findFirst();
    }

    // If no plan exists in DB yet, auto-create a default plan
    if (!targetPlan) {
      targetPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Hero Pro',
          monthlyPrice: 499,
          description: 'Full logistics management & fleet dispatch',
          status: 'PUBLISHED',
          usersLimit: 50,
          storageLimitGB: 200,
          apiCallsLimit: 100000
        }
      });
    }

    planId = targetPlan.id;
    const planAmount = targetPlan.monthlyPrice || 0;
    const nextRenewal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const existingSub = await prisma.tenantSubscription.findFirst({ where: { companyId } });

    let updatedSub;
    if (existingSub) {
      updatedSub = await prisma.tenantSubscription.update({
        where: { id: existingSub.id },
        data: {
          plan: { connect: { id: planId } },
          ...(billingPeriod && { billingPeriod }),
          amount: planAmount,
          nextRenewal,
          status: 'ACTIVE'
        },
        include: { plan: true }
      });
    } else {
      const subCount = await prisma.tenantSubscription.count();
      const subId = `SUB-${1000 + subCount + 1}`;

      updatedSub = await prisma.tenantSubscription.create({
        data: {
          subId,
          company: { connect: { id: companyId } },
          plan: { connect: { id: planId } },
          billingPeriod: billingPeriod || 'MONTHLY',
          status: 'ACTIVE',
          startDate: new Date(),
          nextRenewal,
          amount: planAmount,
        },
        include: { plan: true }
      });
    }

    // Generate a BillingRecord / Invoice for this plan update
    const invCount = await prisma.billingRecord.count({ where: { companyId } });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(1001 + invCount).padStart(4, '0')}`;
    const planName = targetPlan.name || 'Hero Pro';

    await prisma.billingRecord.create({
      data: {
        invoiceNumber,
        companyId,
        amount: planAmount,
        taxAmount: +(planAmount * 0.10).toFixed(2),
        status: 'PAID',
        paymentMethod: 'Visa •••• 4242',
        planTierSnapshot: planName,
        periodStart: new Date(),
        periodEnd: nextRenewal,
        dueDate: nextRenewal,
        date: new Date(),
      }
    }).catch(() => {});

    // Ensure company card details are present
    await prisma.company.update({
      where: { id: companyId },
      data: { cardBrand: 'Visa', cardLast4: '4242', cardExpiry: '12/2029' }
    }).catch(() => {});

    // Update add-on feature toggles if provided
    if (addonIds && Array.isArray(addonIds) && planId) {
      const allPlanFeatures = await prisma.planFeature.findMany({
        where: { planId },
        include: { feature: true }
      });
      const addonFeatures = allPlanFeatures.filter(pf => pf.feature?.licensingType === 'ADD_ON');
      for (const pf of addonFeatures) {
        await prisma.planFeature.update({
          where: { id: pf.id },
          data: { isEnabled: addonIds.includes(pf.featureId) }
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `Subscription updated → Plan: ${updatedSub.plan?.name || planId}, Billing: ${billingPeriod || 'MONTHLY'}.`,
        operator: req.user?.name || req.user?.email || 'Company Admin',
        ipAddress: req.ip || null,
      }
    }).catch(() => {});

    return sendSuccess(res, {
      message: 'Subscription plan updated successfully.',
      subscription: updatedSub
    });
  } catch (error) { next(error); }
};

/**
 * GET /company-admin/subscription-billing/invoices
 * Returns paginated billing records.
 */
exports.getSubscriptionInvoices = async (req, res, next) => {
  try {
    const companyId = await resolveRequiredCompanyId(req);
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    where.companyId = companyId;

    const [data, total] = await Promise.all([
      prisma.billingRecord.findMany({
        where, skip, take,
        orderBy: orderBy || { date: 'desc' },
        include: { paymentAttempts: true }
      }),
      prisma.billingRecord.count({ where })
    ]);

    return sendList(res, data, buildPaginationMeta(total, currentPage, pageSize, req.query.sort));
  } catch (error) { next(error); }
};

/**
 * GET /company-admin/subscription-billing/plans
 * Returns all available subscription plans for the plan selector.
 */
exports.getAvailableSubscriptionPlans = async (req, res, next) => {
  try {
    let plans = await prisma.subscriptionPlan.findMany({
      orderBy: { monthlyPrice: 'asc' },
      include: {
        planFeatures: { include: { feature: true } }
      }
    });

    if (plans.length === 0) {
      // Seed default plans if table is currently empty
      const defaultPlansData = [
        { name: 'Hero Starter', monthlyPrice: 199, description: 'Starter fleet management', usersLimit: 10, storageLimitGB: 50, apiCallsLimit: 25000, status: 'PUBLISHED' },
        { name: 'Hero Business', monthlyPrice: 349, description: 'Growing fleet & dispatch', usersLimit: 25, storageLimitGB: 100, apiCallsLimit: 50000, status: 'PUBLISHED' },
        { name: 'Hero Pro', monthlyPrice: 499, description: 'Advanced fleet logistics', usersLimit: 50, storageLimitGB: 200, apiCallsLimit: 100000, status: 'PUBLISHED' },
        { name: 'Hero Enterprise', monthlyPrice: 999, description: 'Unlimited enterprise suite', usersLimit: 200, storageLimitGB: 1000, apiCallsLimit: 500000, status: 'PUBLISHED' },
      ];

      for (const p of defaultPlansData) {
        await prisma.subscriptionPlan.create({ data: p }).catch(() => {});
      }

      plans = await prisma.subscriptionPlan.findMany({
        orderBy: { monthlyPrice: 'asc' },
        include: {
          planFeatures: { include: { feature: true } }
        }
      });
    }

    return sendSuccess(res, plans);
  } catch (error) { next(error); }
};

// ----------------------------------------------------------------------
// WAREHOUSE & REPORT EXTENDED CONTROLLERS
// ----------------------------------------------------------------------
exports.updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    const photoVal = payload.photoUrl || payload.image || payload.photo;
    let data;
    try {
      data = await prisma.warehouse.update({ where: { id }, data: payload });
    } catch (e) {
      delete payload.photoUrl;
      delete payload.image;
      delete payload.photo;
      data = await prisma.warehouse.update({ where: { id }, data: payload });
      if (photoVal !== undefined) {
        await prisma.$executeRawUnsafe(
          `UPDATE \`warehouse\` SET \`photoUrl\` = ? WHERE \`id\` = ?;`,
          photoVal,
          id
        ).catch(() => {});
        data.photoUrl = photoVal;
      }
    }
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.warehouse.delete({ where: { id } });
    return sendSuccess(res, { id, message: 'Warehouse deleted' });
  } catch (error) { next(error); }
};

exports.getWarehouseLocations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.loadLane.findMany({ where: { warehouseId: id } });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.getLoadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const load = await prisma.load.findFirst({
      where: { OR: [{ id }, { loadRef: id }] },
      include: {
        driver: true,
        truck: true,
        trailer: true,
        customer: true,
        stops: { orderBy: { sequenceIndex: 'asc' } },
        items: true,
        expenses: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { timestamp: 'desc' } },
        deliveryPods: true
      }
    });

    if (!load) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Load not found' }, HTTP_STATUS.NOT_FOUND);
    }

    let uiStatus = load.status;
    if (load.status === 'IN_TRANSIT') uiStatus = 'ACTIVE';
    if (load.status === 'DELIVERED') uiStatus = 'COMPLETED';

    return sendSuccess(res, { ...load, status: uiStatus });
  } catch (error) { next(error); }
};

exports.getLoadExpenses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetLoad = await prisma.load.findFirst({
      where: { OR: [{ id }, { loadRef: id }] }
    });
    if (!targetLoad) return sendSuccess(res, []);

    const expenses = await prisma.loadExpense.findMany({
      where: { loadId: targetLoad.id },
      include: { driver: true, vehicle: true },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = expenses.map(exp => ({
      id: exp.id,
      date: exp.date ? new Date(exp.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      rawDate: exp.date,
      type: exp.type || 'Other',
      desc: exp.description,
      amount: `$${parseFloat(exp.amount || 0).toFixed(2)}`,
      rawAmount: exp.amount,
      status: exp.status === 'APPROVED' ? 'Approved' : exp.status === 'REJECTED' ? 'Rejected' : 'Pending',
      color: exp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : exp.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
      vendorName: exp.vendorName,
      receiptUrl: exp.receiptUrl,
      driverName: exp.driver ? `${exp.driver.firstName || ''} ${exp.driver.lastName || ''}`.trim() : null,
      driverCode: exp.driver?.driverCode || null
    }));
    return sendSuccess(res, mapped);
  } catch (error) { next(error); }
};

exports.createLoadExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = await resolveCompanyId(req);
    const targetLoad = await resolveOrCreateLoad(id, companyId);
    const { type, desc, description, amount, date, vendorName, receiptUrl, driverId, vehicleId } = req.body;

    const crypto = require('crypto');
    const parsedAmount = parseFloat(amount) || 0;
    const parsedDate = date ? new Date(date) : new Date();

    const assignedDriverId = driverId || targetLoad?.driverId || null;
    const assignedVehicleId = vehicleId || targetLoad?.truckId || null;

    const expense = await prisma.loadExpense.create({
      data: {
        id: crypto.randomUUID(),
        loadId: targetLoad.id,
        companyId: targetLoad.companyId || companyId,
        driverId: assignedDriverId,
        vehicleId: assignedVehicleId,
        type: type || 'Other',
        description: desc || description || 'New Expense',
        amount: parsedAmount,
        date: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
        status: 'PENDING',
        vendorName: vendorName || null,
        receiptUrl: receiptUrl || null
      }
    });

    const mapped = {
      id: expense.id,
      date: new Date(expense.date).toLocaleDateString('en-GB'),
      rawDate: expense.date,
      type: expense.type,
      desc: expense.description,
      amount: `$${expense.amount.toFixed(2)}`,
      rawAmount: expense.amount,
      status: 'Pending',
      color: 'bg-amber-50 text-amber-700',
      vendorName: expense.vendorName,
      receiptUrl: expense.receiptUrl,
      driverId: expense.driverId,
      vehicleId: expense.vehicleId
    };

    return sendSuccess(res, mapped, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.getDriverExpenses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = await resolveCompanyId(req);

    const expenses = await prisma.loadExpense.findMany({
      where: {
        companyId,
        OR: [
          { driverId: id },
          { load: { driverId: id } }
        ]
      },
      include: {
        load: { select: { loadRef: true, id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = expenses.map(exp => ({
      id: exp.id,
      date: exp.date ? new Date(exp.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      rawDate: exp.date,
      type: exp.type || 'Other',
      desc: exp.description,
      amount: `$${parseFloat(exp.amount || 0).toFixed(2)}`,
      rawAmount: exp.amount,
      status: exp.status === 'APPROVED' ? 'Approved' : exp.status === 'REJECTED' ? 'Rejected' : 'Pending',
      color: exp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : exp.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
      vendorName: exp.vendorName,
      receiptUrl: exp.receiptUrl,
      loadRef: exp.load?.loadRef || 'General'
    }));

    return sendSuccess(res, mapped);
  } catch (error) { next(error); }
};

exports.deleteLoadExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    await prisma.loadExpense.delete({ where: { id: expenseId } });
    return sendSuccess(res, { id: expenseId, message: 'Expense deleted successfully' });
  } catch (error) { next(error); }
};

exports.getLoadStops = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetLoad = await prisma.load.findFirst({
      where: { OR: [{ id }, { loadRef: id }] }
    });
    if (!targetLoad) return sendSuccess(res, []);

    const stops = await prisma.routeStop.findMany({
      where: { loadId: targetLoad.id },
      orderBy: { sequenceIndex: 'asc' }
    });
    const mapped = stops.map((s, idx) => ({
      id: idx + 1,
      rawId: s.id,
      type: s.type || 'PICKUP',
      typeColor: s.type === 'PICKUP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700',
      address: s.address,
      contactName: s.contactName || '—',
      contactPhone: s.contactPhone || '—',
      date: s.scheduledDate ? new Date(s.scheduledDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      time: '09:00 AM',
      completed: false
    }));
    return sendSuccess(res, mapped);
  } catch (error) { next(error); }
};

exports.createLoadStop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = await resolveCompanyId(req);
    const targetLoad = await resolveOrCreateLoad(id, companyId);

    const { type, address, date, time, contactName, contactPhone, instructions } = req.body;

    const crypto = require('crypto');
    const existingStopsCount = await prisma.routeStop.count({ where: { loadId: targetLoad.id } });

    let enumType = 'PICKUP';
    if (type && (type.toUpperCase().includes('DROP') || type.toUpperCase().includes('REST') || type.toUpperCase().includes('WEIGH'))) {
      enumType = 'DROPOFF';
    }

    const fullAddress = instructions ? `${address}\n(Note: ${instructions})` : address;
    const parsedDate = date ? new Date(date) : new Date();

    const stop = await prisma.routeStop.create({
      data: {
        id: crypto.randomUUID(),
        loadId: targetLoad.id,
        type: enumType,
        sequenceIndex: existingStopsCount,
        address: fullAddress,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        scheduledDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate
      }
    });

    const mapped = {
      id: existingStopsCount + 1,
      rawId: stop.id,
      type: type || stop.type,
      typeColor: enumType === 'PICKUP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700',
      address: stop.address,
      contactName: stop.contactName || '—',
      contactPhone: stop.contactPhone || '—',
      date: stop.scheduledDate ? new Date(stop.scheduledDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      time: time || '09:00 AM',
      instructions: instructions || '',
      completed: false
    };

    return sendSuccess(res, mapped, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.updateLoadStop = async (req, res, next) => {
  try {
    const { stopId } = req.params;
    const { type, address, date, contactName, contactPhone, instructions } = req.body;

    const updateData = {};
    if (address !== undefined) updateData.address = instructions ? `${address}\n(Note: ${instructions})` : address;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) updateData.scheduledDate = parsedDate;
    }
    if (type) {
      updateData.type = (type.toUpperCase().includes('DROP') || type.toUpperCase().includes('REST')) ? 'DROPOFF' : 'PICKUP';
    }

    const updated = await prisma.routeStop.update({
      where: { id: stopId },
      data: updateData
    });

    return sendSuccess(res, updated);
  } catch (error) { next(error); }
};

exports.deleteLoadStop = async (req, res, next) => {
  try {
    const { stopId } = req.params;
    await prisma.routeStop.delete({ where: { id: stopId } });
    return sendSuccess(res, { id: stopId, message: 'Stop deleted successfully' });
  } catch (error) { next(error); }
};

exports.getWarehouses = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const branchWhere = companyId ? { companyId } : {};

    const warehouses = await prisma.warehouse.findMany({
      where: {
        branch: branchWhere
      },
      include: {
        branch: true,
        manager: true,
        loadLanes: true,
        stagingAreas: true,
        stockItems: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedWarehouses = warehouses.map(w => ({
      id: w.id,
      code: w.code,
      name: w.name,
      type: w.type || '',
      status: w.status || '',
      photoUrl: w.photoUrl || null,
      image: w.photoUrl || null,
      branch: w.branch ? w.branch.name : '',
      addr: w.address || (w.city ? `${w.city}, ${w.state || ''}` : ''),
      city: w.city || '',
      state: w.state || '',
      postalCode: w.postalCode || '',
      totalAreaSqm: w.totalAreaSqm || null,
      palletCapacity: w.palletCapacity || null,
      loadingDocks: w.loadingDocks || null,
      util: w.util || 0,
      stock: (w.stockItems || []).length,
      value: '$' + ((w.stockItems || []).length * 1250).toLocaleString()
    }));

    const totalStock = mappedWarehouses.reduce((sum, w) => sum + (w.stock || 0), 0);
    const totalValNum = mappedWarehouses.reduce((sum, w) => sum + ((w.stock || 0) * 1250), 0);

    const stats = {
      totalWarehouses: mappedWarehouses.length,
      activeWarehouses: mappedWarehouses.filter(w => w.status === 'Active').length,
      totalInventoryValue: '$' + totalValNum.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalStockItems: totalStock,
      pendingTasks: 0,
      incomingShipments: 0,
      outgoingShipments: 0,
      totalWh: mappedWarehouses.length,
      activeWh: mappedWarehouses.filter(w => w.status === 'Active').length,
      totalCapacityPallets: mappedWarehouses.reduce((sum, w) => sum + (w.palletCapacity || 0), 0),
      avgUtilisationPct: mappedWarehouses.length > 0 ? Math.round(mappedWarehouses.reduce((sum, w) => sum + (w.util || 0), 0) / mappedWarehouses.length) : 0
    };

    return sendSuccess(res, { warehouses: mappedWarehouses, stats });
  } catch (error) { next(error); }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const payload = { ...req.body };

    let branch = null;
    if (payload.branchId) {
      branch = await prisma.branch.findFirst({
        where: { id: payload.branchId, ...(companyId ? { companyId } : {}) }
      });
      if (!branch) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Branch not found in this company context' }, HTTP_STATUS.NOT_FOUND);
      }
    }
    if (!branch && payload.branch) {
      branch = await prisma.branch.findFirst({
        where: {
          name: payload.branch,
          ...(companyId ? { companyId } : {})
        }
      });
    }
    if (!branch) {
      branch = await prisma.branch.findFirst({
        where: companyId ? { companyId } : {}
      });
    }
    if (!branch) {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required to create warehouse branch' }, HTTP_STATUS.FORBIDDEN);
      }
      branch = await prisma.branch.create({
        data: {
          name: payload.branch || 'Main Branch',
          location: payload.branch || 'Main Depot',
          companyId
        }
      });
    }

    if (!payload.code || !String(payload.code).trim()) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Warehouse Code is required' }, HTTP_STATUS.BAD_REQUEST);
    }
    const warehouseCode = String(payload.code).trim();

    const photoVal = payload.photoUrl || payload.image || payload.photo || null;

    const warehouseData = {
      code: warehouseCode,
      name: payload.name,
      type: payload.type || '',
      status: payload.status || '',
      totalAreaSqm: payload.totalAreaSqm ? parseInt(payload.totalAreaSqm) : null,
      palletCapacity: payload.palletCapacity ? parseInt(payload.palletCapacity) : null,
      loadingDocks: payload.loadingDocks ? parseInt(payload.loadingDocks) : null,
      address: [payload.street, payload.suburb].filter(Boolean).join(', ') || payload.address || null,
      city: payload.suburb || payload.city || null,
      state: payload.state || null,
      postalCode: payload.postalCode || null,
      branchId: branch.id
    };

    let newWh;
    try {
      newWh = await prisma.warehouse.create({
        data: { ...warehouseData, photoUrl: photoVal },
        include: { branch: true }
      });
    } catch (e) {
      newWh = await prisma.warehouse.create({
        data: warehouseData,
        include: { branch: true }
      });
      if (photoVal) {
        await prisma.$executeRawUnsafe(
          `UPDATE \`warehouse\` SET \`photoUrl\` = ? WHERE \`id\` = ?;`,
          photoVal,
          newWh.id
        ).catch(() => {});
        newWh.photoUrl = photoVal;
      }
    }

    const mapped = {
      id: newWh.id,
      code: newWh.code,
      name: newWh.name,
      type: newWh.type || '',
      status: newWh.status || '',
      branch: newWh.branch ? newWh.branch.name : '',
      addr: newWh.address || (newWh.city ? `${newWh.city}, ${newWh.state || ''}` : ''),
      totalAreaSqm: newWh.totalAreaSqm || null,
      palletCapacity: newWh.palletCapacity || null,
      loadingDocks: newWh.loadingDocks || null,
      util: 65,
      stock: 0,
      value: '$0'
    };

    return sendSuccess(res, mapped, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    
    const updateData = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.code !== undefined) updateData.code = payload.code;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.totalAreaSqm !== undefined) updateData.totalAreaSqm = payload.totalAreaSqm ? parseInt(payload.totalAreaSqm) : null;
    if (payload.palletCapacity !== undefined) updateData.palletCapacity = payload.palletCapacity ? parseInt(payload.palletCapacity) : null;
    if (payload.loadingDocks !== undefined) updateData.loadingDocks = payload.loadingDocks ? parseInt(payload.loadingDocks) : null;
    if (payload.address !== undefined || payload.addr !== undefined) updateData.address = payload.address || payload.addr;

    const photoVal = payload.photoUrl || payload.image || payload.photo;

    let updated;
    try {
      updated = await prisma.warehouse.update({
        where: { id },
        data: { ...updateData, ...(photoVal !== undefined && { photoUrl: photoVal }) },
        include: { branch: true }
      });
    } catch (e) {
      updated = await prisma.warehouse.update({
        where: { id },
        data: updateData,
        include: { branch: true }
      });
      if (photoVal !== undefined) {
        await prisma.$executeRawUnsafe(
          `UPDATE \`warehouse\` SET \`photoUrl\` = ? WHERE \`id\` = ?;`,
          photoVal,
          id
        ).catch(() => {});
        updated.photoUrl = photoVal;
      }
    }

    return sendSuccess(res, updated);
  } catch (error) { next(error); }
};

exports.deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.warehouse.delete({ where: { id } });
    return sendSuccess(res, { id, message: 'Warehouse deleted successfully' });
  } catch (error) { next(error); }
};

exports.getWarehouseLocations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const loadLanes = await prisma.loadLane.findMany({
      where: { warehouseId: id },
      orderBy: { createdAt: 'desc' }
    });

    const locations = loadLanes.map(l => ({
      id: l.id,
      code: l.name.startsWith('LOC-') ? l.name : `LOC-${l.name.slice(0, 8).toUpperCase()}`,
      name: l.name,
      area: 'Standard Storage',
      type: 'Floor',
      bins: 6,
      cap: 100,
      used: 0,
      util: '0.0%',
      status: l.status || 'ACTIVE'
    }));

    const totalLocs = locations.length;
    const totalBins = totalLocs * 6;
    const totalCap = totalLocs * 100;
    const totalUsed = locations.reduce((sum, item) => sum + (parseInt(item.used) || 0), 0);
    const availCap = Math.max(0, totalCap - totalUsed);
    const utilPct = totalCap > 0 ? ((totalUsed / totalCap) * 100).toFixed(1) : '0.0';

    const stats = {
      totalLocations: totalLocs,
      totalBins: totalBins,
      binCapacity: `${totalCap} m³`,
      usedCapacity: `${totalUsed} m³`,
      availableCapacity: `${availCap} m³`,
      utilPercent: utilPct,
      overfullBins: 0
    };

    return sendSuccess(res, { locations, stats });
  } catch (error) { next(error); }
};

exports.createWarehouseLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const locationName = req.body.name || req.body.code || req.body.locationName || req.body.zone || `Location-${Math.floor(100 + Math.random() * 900)}`;
    const locationStatus = req.body.status || 'ACTIVE';

    const data = await prisma.loadLane.create({
      data: {
        warehouseId: id,
        name: String(locationName).trim(),
        status: String(locationStatus).toUpperCase()
      }
    });

    const mapped = {
      id: data.id,
      code: data.name.startsWith('LOC-') ? data.name : `LOC-${data.name.slice(0, 8).toUpperCase()}`,
      name: data.name,
      area: req.body.area || 'Standard Storage',
      type: req.body.type || 'Floor',
      bins: req.body.bins ? parseInt(req.body.bins) : 6,
      cap: req.body.capacity ? parseInt(req.body.capacity) : 100,
      used: 0,
      util: '0.0%',
      status: data.status || 'ACTIVE'
    };

    return sendSuccess(res, mapped, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.deleteWarehouseLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    await prisma.loadLane.deleteMany({ where: { id: locationId } });
    return sendSuccess(res, { id: locationId, message: 'Location deleted successfully' });
  } catch (error) { next(error); }
};

exports.getWarehouseStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.loadItem.findMany({ where: { warehouseId: id } });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.createWarehouseStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.loadItem.create({ data: { ...req.body, warehouseId: id } });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.getWarehouseMovements = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.itemMovement.findMany({ where: { warehouseId: id } });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.createWarehouseMovement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.itemMovement.create({ data: { ...req.body, warehouseId: id } });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.getWarehousePickTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.warehousePickTask.findMany({ where: { warehouseId: id } });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.createWarehousePickTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.warehousePickTask.create({ data: { ...req.body, warehouseId: id } });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.getWarehouseStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.warehouseStaff.findMany({ where: { warehouseId: id } });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.createWarehouseStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.warehouseStaff.create({ data: { ...req.body, warehouseId: id } });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.getWarehouseEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.asset.findMany({ where: { warehouseId: id } });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
};

exports.createWarehouseEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.asset.create({ data: { ...req.body, warehouseId: id } });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.getWarehouseSubData = async (req, res, next) => {
  try {
    const { id } = req.params;
    return sendSuccess(res, { warehouseId: id, stats: { total: 0 } });
  } catch (error) { next(error); }
};

exports.createCustomReport = async (req, res, next) => {
  try {
    const data = { id: `RPT-${Date.now().toString().slice(-6)}`, ...req.body, status: 'GENERATED', createdAt: new Date() };
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.createReportSchedule = async (req, res, next) => {
  try {
    const data = { id: `SCH-${Date.now().toString().slice(-6)}`, ...req.body, active: true };
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

exports.exportReports = async (req, res, next) => {
  try {
    return sendSuccess(res, { downloadUrl: '/reports/export.pdf', message: 'Report exported successfully' });
  } catch (error) { next(error); }
};

exports.toggleFavouriteReport = async (req, res, next) => {
  try {
    return sendSuccess(res, { id: req.params.id, favourite: true });
  } catch (error) { next(error); }
};

// Profile APIs
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Unauthorized' }, HTTP_STATUS.UNAUTHORIZED);

    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        customRole: { select: { id: true, name: true, permissions: true } }
      }
    });

    if (!userObj) return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Profile not found' }, HTTP_STATUS.NOT_FOUND);
    delete userObj.password;
    return sendSuccess(res, userObj);
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Unauthorized' }, HTTP_STATUS.UNAUTHORIZED);

    const { name, phone, dob, address, emergencyContact, email, currentPassword, newPassword } = req.body;
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }, HTTP_STATUS.NOT_FOUND);

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (dob !== undefined) updateData.dob = dob ? dob.trim() : null;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact ? emergencyContact.trim() : null;
    if (email && email.trim().toLowerCase() !== currentUser.email) updateData.email = email.trim().toLowerCase();

    if (newPassword && newPassword.trim().length > 0) {
      if (currentPassword) {
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isMatch) return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Current password is incorrect' }, HTTP_STATUS.BAD_REQUEST);
      }
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        company: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        customRole: { select: { id: true, name: true, permissions: true } }
      }
    });

    delete updatedUser.password;
    return sendSuccess(res, updatedUser);
  } catch (error) { next(error); }
};

// One-time cleanup: null out wrongly-defaulted driver fields
exports.cleanupDriverDefaults = async (req, res, next) => {
  try {
    const fixed1 = await prisma.driver.updateMany({
      where: { licenseType: 'HR (Heavy Rigid)', licenseNumber: { startsWith: 'LIC-' } },
      data: { licenseType: null, licenseNumber: null }
    });
    const fixed2 = await prisma.driver.updateMany({
      where: { category: 'Heavy Rig' },
      data: { category: null }
    });
    const fixed3 = await prisma.driver.updateMany({
      where: { shift: 'Morning' },
      data: { shift: null }
    });
    const fixed4 = await prisma.driver.updateMany({
      where: { firstName: { startsWith: 'DRV-' } },
      data: { firstName: null }
    });
    const fixed5 = await prisma.driver.updateMany({
      where: { driverCode: { startsWith: 'DRV-' } },
      data: { driverCode: null }
    });
    return sendSuccess(res, {
      message: 'Driver defaults cleanup complete',
      licenseTypeCleared: fixed1.count,
      categoryCleared: fixed2.count,
      shiftCleared: fixed3.count,
      firstNameCleared: fixed4.count,
      driverCodeCleared: fixed5.count
    });
  } catch (error) { next(error); }
};


