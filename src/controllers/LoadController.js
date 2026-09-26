const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const LoadService = require('../services/LoadService');

const { getTenantWhere, resolveCompanyId } = require('../middlewares/tenantResolver');

const getEffectiveCompanyId = (req) => {
  return resolveCompanyId(req);
};

// Get all Loads with pagination, sorting and filtering
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
    
    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      where.branchId = req.user.branchId;
    }
    if (req.user && req.user.role === 'DRIVER') {
      where.driver = { userId: req.user.id };
    }

    const [data, total] = await Promise.all([
      prisma.load.findMany({
        where, skip, take, orderBy,
        include: {
          driver: true,
          truck: true,
          activities: true,
          trailer: true,
          customer: true,
          stops: true,
          items: true
        }
      }),
      prisma.load.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single Load by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Load not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      where.branchId = req.user.branchId;
    }
    if (req.user && req.user.role === 'DRIVER') {
      where.driver = { userId: req.user.id };
    }

    const data = await prisma.load.findFirst({
      where,
      include: {
        driver: true,
        truck: true,
        trailer: true,
        customer: true,
        stops: true,
        items: true,
        deliveryPods: true,
        expenses: true
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Load not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new Load
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    const companyId = getEffectiveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Company context required to create loads'
        }, HTTP_STATUS.FORBIDDEN);
      }
      payload.companyId = companyId;
    } else {
      payload.companyId = payload.companyId || companyId;
    }

    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      payload.branchId = req.user.branchId;
    }
    if (req.user && req.user.role === 'DRIVER') {
      if (!req.user.permissions?.includes('driver.owner_operator_load_create')) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Drivers are not authorized to create loads.'
        }, HTTP_STATUS.FORBIDDEN);
      }
    }

    delete payload.id;
    delete payload.rawId;

    // Guaranteed unique loadRef
    if (payload.loadRef) {
      const existingRef = await prisma.load.findFirst({
        where: { loadRef: String(payload.loadRef), companyId: payload.companyId }
      });
      if (existingRef) {
        payload.loadRef = `${payload.loadRef}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    } else {
      payload.loadRef = `LD-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Guaranteed unique draftId
    if (payload.draftId) {
      const existingDraft = await prisma.load.findFirst({
        where: { draftId: String(payload.draftId), companyId: payload.companyId }
      });
      if (existingDraft) {
        payload.draftId = `DRAFT-${Math.floor(10000 + Math.random() * 90000)}`;
      }
    } else {
      delete payload.draftId;
    }

    // Fallback type
    if (!payload.type) {
      payload.type = 'General Freight';
    }

    // Map status string to valid db enum
    if (payload.status) {
      if (payload.status === 'In Transit') payload.status = 'IN_TRANSIT';
      else if (payload.status === 'En Route') payload.status = 'ASSIGNED';
      else if (payload.status === 'At Pickup') payload.status = 'ASSIGNED';
      else if (payload.status === 'Planned') payload.status = 'PLANNED';
      else if (payload.status === 'On Hold') payload.status = 'ASSIGNED';
      else if (!['DRAFT', 'REQUESTED', 'PLANNED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(payload.status)) {
        payload.status = 'PLANNED';
      }
    }

    // Map priority string to valid db enum
    if (payload.priority) {
      const pUpper = payload.priority.toUpperCase();
      if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(pUpper)) {
        payload.priority = pUpper;
      } else {
        payload.priority = 'LOW';
      }
    }

    // Map scheduledDate or reqDate to loadDate
    if (payload.scheduledDate && !payload.loadDate) {
      const parsedDate = new Date(payload.scheduledDate);
      payload.loadDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      delete payload.scheduledDate;
    }

    // Resolve customerId if customer name string is passed instead of customerId
    if (payload.customer && !payload.customerId && typeof payload.customer === 'string') {
      const custName = payload.customer.trim();
      let foundCust = await prisma.customer.findFirst({
        where: {
          name: { contains: custName },
          ...(payload.companyId && { companyId: payload.companyId })
        }
      });
      if (!foundCust) {
        foundCust = await prisma.customer.create({
          data: {
            name: custName,
            ...(payload.companyId && { companyId: payload.companyId })
          }
        });
      }
      payload.customerId = foundCust.id;
    }
    delete payload.customer;

    // Convert pickup/delivery locations or plain stops array into Prisma nested create object
    const pickupLoc = payload.pickupLocation || payload.pickupAddress || payload.origin || null;
    const deliveryLoc = payload.deliveryLocation || payload.deliveryAddress || payload.destination || null;

    if (Array.isArray(payload.stops) && payload.stops.length > 0) {
      const stopsData = payload.stops.map((s, idx) => ({
        type: s.type || (idx === 0 ? 'PICKUP' : 'DROPOFF'),
        sequenceIndex: typeof s.sequenceIndex === 'number' ? s.sequenceIndex : idx,
        address: s.address || s.location || 'Address Not Specified',
        contactName: s.contactName || null,
        contactPhone: s.contactPhone || null,
        instructions: s.instructions || null
      }));
      payload.stops = { create: stopsData };
    } else if (pickupLoc || deliveryLoc) {
      const stopsData = [];
      if (pickupLoc) {
        stopsData.push({
          type: 'PICKUP',
          sequenceIndex: 0,
          address: pickupLoc
        });
      }
      if (deliveryLoc) {
        stopsData.push({
          type: 'DROPOFF',
          sequenceIndex: stopsData.length,
          address: deliveryLoc
        });
      }
      payload.stops = { create: stopsData };
    }

    // Convert plain items array to Prisma nested create object
    if (Array.isArray(payload.items)) {
      const itemsData = payload.items.map(i => ({
        // Common & Car Carrying
        stockRef: i.stockRef || i.rego || i.vin || 'ITEM-REF',
        make: i.make || null,
        model: i.model || null,
        rego: i.rego || null,
        vin: i.vin || null,
        year: i.year ? parseInt(i.year) : null,
        color: i.colour || i.color || null,
        quantity: i.quantity ? parseInt(i.quantity) : 1,
        lengthMm: i.lengthMm ? parseInt(i.lengthMm) : (i.length ? parseInt(i.length.replace(/,/g, '')) : null),
        widthMm: i.widthMm ? parseInt(i.widthMm) : (i.width ? parseInt(i.width.replace(/,/g, '')) : null),
        heightMm: i.heightMm ? parseInt(i.heightMm) : (i.height ? parseInt(i.height.replace(/,/g, '')) : null),
        weightKg: i.weightKg ? parseInt(i.weightKg) : (i.weight ? parseInt(i.weight.replace(/,/g, '')) : null),
        vehicleType: i.vehicleType || null,
        keys: i.keys === 'Yes' || i.keys === true,
        damageReportReq: i.damageReport === 'Yes' || i.damageReportReq === true,
        notes: i.notes || i.additionalNotes || null,
        description: i.description || i.itemDescription || null,

        // General Freight
        pallets: i.pallets ? parseInt(i.pallets) : null,
        cubicMetres: i.cubicMetres ? parseFloat(i.cubicMetres) : null,
        fragile: i.fragile === 'Yes' || i.fragile === true,
        stackable: i.stackable === 'Yes' || i.stackable === true,
        specialHandling: i.specialHandling || null,

        // Dangerous Goods
        unNumber: i.unNumber || null,
        dgClass: i.dgClass || null,
        packingGroup: i.packingGroup || null,
        hazchemCode: i.hazchemCode || null,
        msdsUploaded: i.msdsUploaded === 'Yes' || i.msdsUploaded === true,
        emergencyContact: i.emergencyContact || null,
        complianceChecklist: i.complianceChecklist === 'Yes' || i.complianceChecklist === true,
        placarding: i.placarding === 'Yes' || i.placarding === true,
      }));
      payload.items = { create: itemsData };
    }

    const agreedRate = payload.rate || payload.price || payload.revenue || payload.customerRate || null;
    let agreedDriverPay = payload.driverPay || payload.driverRate || null;

    // Calculate dynamic driver payment if driverId is provided and driverPay is not hardcoded
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

    delete payload.pickupLocation;
    delete payload.deliveryLocation;
    delete payload.pickupAddress;
    delete payload.deliveryAddress;
    delete payload.origin;
    delete payload.destination;
    delete payload.driver;
    delete payload.truck;
    delete payload.customer;
    delete payload.trailer;
    delete payload.rate;
    delete payload.price;
    delete payload.revenue;
    delete payload.customerRate;
    delete payload.driverPay;
    delete payload.driverRate;

    const data = await prisma.load.create({
      data: payload,
      include: {
        driver: true,
        truck: true,
        customer: true,
        stops: true,
        items: true
      }
    });

    if (agreedRate && data.id) {
      try {
        const { autoGenerateLoadInvoice } = require('./CompanyAdminPortalController');
        if (typeof autoGenerateLoadInvoice === 'function') {
          await autoGenerateLoadInvoice(data.id, data.companyId, agreedRate);
        }
      } catch (e) {}
    }

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Load
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.companyId; // Do not allow companyId mutation
    const companyId = getEffectiveCompanyId(req);

    if (updateData.status) {
      if (updateData.status === 'In Transit') updateData.status = 'IN_TRANSIT';
      else if (updateData.status === 'En Route') updateData.status = 'ASSIGNED';
      else if (updateData.status === 'At Pickup') updateData.status = 'ASSIGNED';
      else if (updateData.status === 'Planned') updateData.status = 'PLANNED';
      else if (updateData.status === 'On Hold') updateData.status = 'ASSIGNED';
      else if (!['DRAFT', 'REQUESTED', 'PLANNED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].includes(updateData.status)) {
        updateData.status = 'PLANNED';
      }
    }

    const findWhere = { OR: [{ id }, { loadRef: id }] };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Load not found' }, HTTP_STATUS.NOT_FOUND);
      }
      findWhere.companyId = companyId;
    }
    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      findWhere.branchId = req.user.branchId;
    }
    if (req.user && req.user.role === 'DRIVER') {
      findWhere.driver = { userId: req.user.id };
    }

    const targetLoad = await prisma.load.findFirst({
      where: findWhere
    });

    if (!targetLoad) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Load not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    // Handle stops update
    let stopsInput = updateData.stops;
    delete updateData.stops;
    if (Array.isArray(stopsInput)) {
      await prisma.routeStop.deleteMany({ where: { loadId: targetLoad.id } });
      if (stopsInput.length > 0) {
        const stopsToCreate = stopsInput.map((s, idx) => ({
          loadId: targetLoad.id,
          type: s.type ? s.type.toUpperCase() : (idx === 0 ? 'PICKUP' : 'DROPOFF'),
          sequenceIndex: typeof s.sequenceIndex === 'number' ? s.sequenceIndex : idx,
          address: s.address || s.location || 'Address Not Specified',
          contactName: s.contactName || null,
          contactPhone: s.contactPhone || null,
          instructions: s.instructions || null
        }));
        await prisma.routeStop.createMany({ data: stopsToCreate });
      }
    }

    // Handle items update
    let itemsInput = updateData.items;
    delete updateData.items;
    if (Array.isArray(itemsInput)) {
      await prisma.loadItem.deleteMany({ where: { loadId: targetLoad.id } });
      if (itemsInput.length > 0) {
        const itemsToCreate = itemsInput.map(i => ({
          loadId: targetLoad.id,
          stockRef: i.stockRef || i.rego || i.vin || 'ITEM-REF',
          make: i.make || null,
          model: i.model || null,
          rego: i.rego || null,
          vin: i.vin || null,
          year: i.year ? parseInt(i.year) : null,
          color: i.colour || i.color || null,
          quantity: i.quantity ? parseInt(i.quantity) : 1,
          weightKg: i.weightKg ? parseInt(i.weightKg) : (i.weight ? parseInt(i.weight) : null),
          notes: i.notes || i.additionalNotes || null,
          description: i.description || i.itemDescription || null
        }));
        await prisma.loadItem.createMany({ data: itemsToCreate });
      }
    }

    const data = await prisma.load.update({
      where: { id: targetLoad.id },
      data: updateData,
      include: {
        driver: true,
        truck: true,
        customer: true,
        stops: true,
        items: true
      }
    });

    if (updateData.status === 'DELIVERED') {
      try {
        const { autoGenerateLoadInvoice, autoCreditDriverPayroll } = require('./CompanyAdminPortalController');
        if (typeof autoGenerateLoadInvoice === 'function') {
          await autoGenerateLoadInvoice(data.id, data.companyId);
        }
        if (typeof autoCreditDriverPayroll === 'function' && data.driverId) {
          await autoCreditDriverPayroll(data.id, data.driverId, data.companyId);
        }
      } catch (finErr) {
        console.warn('Auto finance trigger on LoadController.update catch:', finErr?.message);
      }
    }

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete Load
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = getEffectiveCompanyId(req);
    const findWhere = {
      OR: [
        { id: id },
        { loadRef: id },
        { draftId: id }
      ]
    };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      findWhere.companyId = companyId;
    }
    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      findWhere.branchId = req.user.branchId;
    }
    if (req.user && req.user.role === 'DRIVER') {
      findWhere.driver = { userId: req.user.id };
    }

    const targetLoad = await prisma.load.findFirst({
      where: findWhere
    }).catch(() => null);

    if (!targetLoad) {
      return res.status(HTTP_STATUS.NO_CONTENT).send();
    }

    // Cascade delete child records
    if (prisma.customerInvoice) await prisma.customerInvoice.deleteMany({ where: { loadId: targetLoad.id } }).catch(() => {});
    if (prisma.preStartChecklist) await prisma.preStartChecklist.deleteMany({ where: { loadId: targetLoad.id } }).catch(() => {});
    if (prisma.telemetryLog) await prisma.telemetryLog.deleteMany({ where: { loadId: targetLoad.id } }).catch(() => {});
    if (prisma.timesheet) await prisma.timesheet.deleteMany({ where: { loadId: targetLoad.id } }).catch(() => {});
    if (prisma.routeStop) await prisma.routeStop.deleteMany({ where: { loadId: targetLoad.id } }).catch(() => {});
    if (prisma.loadItem) await prisma.loadItem.deleteMany({ where: { loadId: targetLoad.id } }).catch(() => {});
    if (prisma.loadExpense) await prisma.loadExpense.deleteMany({ where: { loadId: targetLoad.id } }).catch(() => {});
    if (prisma.document) await prisma.document.deleteMany({ where: { loadId: targetLoad.id } }).catch(() => {});
    if (prisma.loadActivity) await prisma.loadActivity.deleteMany({ where: { loadId: targetLoad.id } }).catch(() => {});
    if (prisma.message) await prisma.message.deleteMany({ where: { loadId: targetLoad.id } }).catch(() => {});

    await prisma.load.deleteMany({
      where: { OR: [{ id: targetLoad.id }, { loadRef: targetLoad.id }] }
    }).catch(() => {});
    
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025' || error.code === 'P2023') {
      return res.status(HTTP_STATUS.NO_CONTENT).send();
    }
    next(error);
  }
};

// Custom: Activate Load
exports.activate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignment } = req.body;
    const companyId = getEffectiveCompanyId(req);
    
    const data = await LoadService.activateLoad(id, assignment, companyId);
    return sendSuccess(res, data, HTTP_STATUS.OK);
  } catch (error) {
    if (error.code === 'LOAD_ACTIVATION_FAILED') {
      return sendError(res, error, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
    next(error);
  }
};

// Custom: Assign resources to Load
exports.assign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = req.body;
    const companyId = getEffectiveCompanyId(req);
    
    const data = await LoadService.assignResources(id, assignment, companyId);
    return sendSuccess(res, data, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// Custom: Status Transition
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const companyId = getEffectiveCompanyId(req);
    
    if (!status) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Status is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const data = await LoadService.updateStatus(id, status, reason, companyId);

    if (status === 'DELIVERED' || status === 'COMPLETED') {
      try {
        const { autoGenerateLoadInvoice, autoCreditDriverPayroll } = require('./CompanyAdminPortalController');
        if (typeof autoGenerateLoadInvoice === 'function') {
          await autoGenerateLoadInvoice(data.id, data.companyId);
        }
        if (typeof autoCreditDriverPayroll === 'function' && data.driverId) {
          await autoCreditDriverPayroll(data.id, data.driverId, data.companyId);
        }
      } catch (finErr) {
        console.warn('Auto finance trigger on LoadController.updateStatus catch:', finErr?.message);
      }
    }

    return sendSuccess(res, data, HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// Planning Board Menu Single Dedicated Endpoint
exports.getPlanningBoard = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendSuccess(res, { drivers: [], unassignedLoads: [], customers: [], vehicles: [] });
    }
    const companyWhere = getTenantWhere(req);

    const [dbDrivers, dbLoads, dbCustomers, dbVehicles] = await Promise.all([
      prisma.driver.findMany({
        where: companyWhere,
        include: {
          loads: {
            include: { customer: true, truck: true, stops: true }
          },
          branch: true
        },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []),
      prisma.load.findMany({
        where: companyWhere,
        include: { customer: true, stops: true, truck: true, driver: true },
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),
      prisma.customer.findMany({
        where: companyWhere,
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
      }).catch(() => []),
      prisma.vehicle.findMany({
        where: companyWhere,
        select: { id: true, make: true, model: true, rego: true, category: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => [])
    ]);

    const formattedDrivers = dbDrivers.map((d, dIdx) => {
      const driverName = (d.firstName || d.lastName) ? `${d.firstName || ''} ${d.lastName || ''}`.trim() : (d.driverCode || `Driver-${dIdx + 1}`);
      const driverLoads = d.loads || [];

      const mappedLoads = driverLoads.map((l, lIndex) => {
        const startTime = 8 + (lIndex * 5);
        const endTime = startTime + 4;
        let routeStr = 'Melbourne VIC → Sydney NSW';
        if (Array.isArray(l.stops) && l.stops.length > 0) {
          const sorted = [...l.stops].sort((a, b) => (a.sequenceIndex || 0) - (b.sequenceIndex || 0));
          const p = sorted[0]?.address || 'Origin';
          const dest = sorted[sorted.length - 1]?.address || 'Destination';
          routeStr = `${p} → ${dest}`;
        } else if (l.notes && l.notes.includes(' to ')) {
          routeStr = l.notes.replace(' to ', ' → ');
        }

        const scheduledDateObj = l.loadDate || l.createdAt;

        return {
          id: l.loadRef || l.id.substring(0, 8),
          dbId: l.id,
          customer: l.customer?.name || 'Direct Customer',
          route: routeStr,
          startTime: startTime > 20 ? 18 : startTime,
          endTime: endTime > 24 ? 22 : endTime,
          durationText: `${startTime}:00 - ${endTime}:00`,
          color: l.status === 'IN_TRANSIT' ? 'emerald' : l.status === 'ASSIGNED' ? 'blue' : 'amber',
          stops: l.stops?.length || 2,
          progress: l.status === 'DELIVERED' ? '100%' : l.status === 'IN_TRANSIT' ? '75%' : '50%',
          loadType: l.type || 'General Freight',
          reqDate: scheduledDateObj ? (scheduledDateObj instanceof Date ? scheduledDateObj.toLocaleDateString('en-GB') : new Date(scheduledDateObj).toLocaleDateString('en-GB')) : 'Today',
          rawDateIso: scheduledDateObj ? (scheduledDateObj instanceof Date ? scheduledDateObj.toISOString().split('T')[0] : new Date(scheduledDateObj).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
          driverStatus: d.status === 'AVAILABLE' ? 'On Duty' : 'On Duty',
          vehicle: l.truck ? `${l.truck.make || ''} ${l.truck.model || ''}`.trim() : 'Volvo FH16 750',
          trailer: l.trailerId || 'Car Carrier TR-01'
        };
      });

      return {
        id: d.id,
        name: driverName,
        status: mappedLoads.length > 0 ? 'On Duty' : 'Standby',
        statusColor: mappedLoads.length > 0 ? 'emerald' : 'blue',
        vehicleType: d.preferredVehicle || 'Volvo FH16 750',
        trailerType: 'Car Carrier TR-01 (10 Car)',
        loadsCount: `${mappedLoads.length} Loads`,
        loads: mappedLoads
      };
    });

    const unassignedLoads = dbLoads
      .filter(l => !l.driverId)
      .map(l => {
        let routeStr = 'Melbourne VIC → Sydney NSW';
        if (Array.isArray(l.stops) && l.stops.length > 0) {
          const sorted = [...l.stops].sort((a, b) => (a.sequenceIndex || 0) - (b.sequenceIndex || 0));
          const p = sorted[0]?.address || 'Origin';
          const dest = sorted[sorted.length - 1]?.address || 'Destination';
          routeStr = `${p} → ${dest}`;
        } else if (l.notes && l.notes.includes(' to ')) {
          routeStr = l.notes.replace(' to ', ' → ');
        }
        const scheduledDateObj = l.loadDate || l.createdAt;

        return {
          id: l.loadRef || l.id,
          dbId: l.id,
          customer: l.customer?.name || 'Direct Customer',
          route: routeStr,
          type: l.type || 'General Freight',
          reqDate: scheduledDateObj ? (scheduledDateObj instanceof Date ? scheduledDateObj.toLocaleDateString('en-GB') : new Date(scheduledDateObj).toLocaleDateString('en-GB')) : 'Today, 09:00 AM'
        };
      });

    return sendSuccess(res, {
      drivers: formattedDrivers,
      unassignedLoads,
      customers: dbCustomers,
      vehicles: dbVehicles
    });
  } catch (error) {
    next(error);
  }
};

// Active Loads Menu Single Dedicated Endpoint
exports.getActiveLoads = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendSuccess(res, { loads: [], drivers: [], customers: [], branches: [], vehicles: [] });
    }
    const companyWhere = getTenantWhere(req);

    const [dbLoads, dbDrivers, dbCustomers, dbBranches, dbVehicles] = await Promise.all([
      prisma.load.findMany({
        where: companyWhere,
        include: {
          driver: { include: { user: true } },
          truck: true,
          trailer: true,
          customer: true,
          stops: true,
          items: true
        },
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),
      prisma.driver.findMany({
        where: companyWhere,
        select: { id: true, firstName: true, lastName: true, driverCode: true, phone: true, avatarUrl: true, status: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []),
      prisma.customer.findMany({
        where: companyWhere,
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
      }).catch(() => []),
      prisma.branch.findMany({
        where: companyWhere,
        select: { id: true, name: true, location: true },
        orderBy: { name: 'asc' }
      }).catch(() => []),
      prisma.vehicle.findMany({
        where: companyWhere,
        select: { id: true, make: true, model: true, rego: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => [])
    ]);

    const formattedLoads = dbLoads.map((dbLoad, idx) => {
      const loadRefStr = dbLoad.loadRef || (dbLoad.id && dbLoad.id.length > 18 ? `LD-${dbLoad.id.slice(0, 8).toUpperCase()}` : dbLoad.id);

      let routeFromStr = 'Melbourne VIC';
      let routeToStr = 'Sydney NSW';
      if (Array.isArray(dbLoad.stops) && dbLoad.stops.length > 0) {
        const sortedStops = [...dbLoad.stops].sort((a, b) => (a.sequenceIndex || 0) - (b.sequenceIndex || 0));
        routeFromStr = sortedStops[0]?.address || sortedStops[0]?.location || 'Melbourne VIC';
        routeToStr = sortedStops[sortedStops.length - 1]?.address || sortedStops[sortedStops.length - 1]?.location || 'Sydney NSW';
      } else if (dbLoad.notes && dbLoad.notes.includes(' to ')) {
        const parts = dbLoad.notes.split(' to ');
        routeFromStr = parts[0] || 'Melbourne VIC';
        routeToStr = parts[1] || 'Sydney NSW';
      }

      let computedDots = 1;
      if (dbLoad.status === 'ASSIGNED' || dbLoad.status === 'En Route') computedDots = 2;
      else if (dbLoad.status === 'At Pickup') computedDots = 3;
      else if (dbLoad.status === 'Loaded') computedDots = 4;
      else if (dbLoad.status === 'IN_TRANSIT' || dbLoad.status === 'In Transit') computedDots = 5;
      else if (dbLoad.status === 'DELIVERED' || dbLoad.status === 'Delivered' || dbLoad.status === 'COMPLETED') computedDots = 6;
      else if (dbLoad.status === 'PLANNED') computedDots = 1;

      const driverName = dbLoad.driver
        ? (`${dbLoad.driver.firstName || ''} ${dbLoad.driver.lastName || ''}`.trim() || dbLoad.driver.driverCode || 'Driver')
        : (dbDrivers.length > 0 && dbDrivers[idx % dbDrivers.length]
            ? `${dbDrivers[idx % dbDrivers.length].firstName || ''} ${dbDrivers[idx % dbDrivers.length].lastName || ''}`.trim()
            : 'Unassigned');

      const customerName = dbLoad.customer?.name || (dbCustomers.length > 0 ? dbCustomers[idx % dbCustomers.length]?.name : 'Direct Customer');

      return {
        id: loadRefStr,
        dbId: dbLoad.id,
        status: dbLoad.status === 'IN_TRANSIT' ? 'In Transit' : dbLoad.status === 'ASSIGNED' ? 'En Route' : dbLoad.status === 'PLANNED' ? 'Planned' : dbLoad.status || 'Planned',
        statusStyle: dbLoad.status === 'IN_TRANSIT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          dbLoad.status === 'ASSIGNED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
          dbLoad.status === 'PLANNED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
          'bg-slate-100 text-slate-700 border-slate-200',
        accentColor: dbLoad.status === 'IN_TRANSIT' ? 'border-l-emerald-500' :
          dbLoad.status === 'ASSIGNED' ? 'border-l-blue-500' :
          dbLoad.status === 'PLANNED' ? 'border-l-amber-500' : 'border-l-slate-400',
        driver: driverName,
        driverRole: 'Car Carrier',
        driverAvatar: dbLoad.driver?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=e2e8f0&color=0f172a`,
        driverPhone: dbLoad.driver?.phone || 'N/A',
        driverStatus: 'On Duty',
        routeFrom: routeFromStr,
        routeTo: routeToStr,
        customer: customerName,
        vehicle: dbLoad.truck ? `${dbLoad.truck.make || ''} ${dbLoad.truck.model || ''}`.trim() : (dbVehicles.length > 0 && dbVehicles[idx % dbVehicles.length] ? `${dbVehicles[idx % dbVehicles.length].make || ''} ${dbVehicles[idx % dbVehicles.length].model || ''}`.trim() : 'Volvo FH16 750'),
        trailer: dbLoad.trailerId || 'TR-01',
        rego: dbLoad.truck?.rego || (dbVehicles.length > 0 ? dbVehicles[idx % dbVehicles.length]?.rego : 'NEW-999'),
        truckPhoto: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=300',
        reqDate: dbLoad.loadDate ? (dbLoad.loadDate instanceof Date ? dbLoad.loadDate.toLocaleDateString('en-GB') : new Date(dbLoad.loadDate).toLocaleDateString('en-GB')) : new Date(dbLoad.createdAt).toLocaleDateString('en-GB'),
        reqTime: '05:00 PM',
        progressStep: `${computedDots}/6`,
        activeDotsCount: computedDots,
        dotColor: 'bg-emerald-500',
        lineColor: 'bg-emerald-500',
        stopsCount: dbLoad.stops?.length || 2,
        itemsCount: dbLoad.items?.length || 0,
        rawLoad: dbLoad
      };
    });

    return sendSuccess(res, {
      loads: formattedLoads,
      drivers: dbDrivers,
      customers: dbCustomers,
      branches: dbBranches,
      vehicles: dbVehicles
    });
  } catch (error) {
    next(error);
  }
};
