const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prismaClient');
const syncMissingVehicleColumns = require('../utils/syncDbColumns');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { resolveCompanyId } = require('../middlewares/tenantResolver');

// Get all Vehicles with pagination, sorting and filtering
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
    } else if (companyId) {
      where.companyId = companyId;
    } else {
      return sendList(res, [], buildPaginationMeta(0, currentPage, pageSize, req.query.sort));
    }

    await syncMissingVehicleColumns().catch(() => {});

    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      where.branchId = req.user.branchId;
    }

    const [data, total] = await Promise.all([
      prisma.vehicle.findMany({
        where, skip, take, orderBy,
        include: {
          currentDriver: true,
          company: true,
          truckLoads: { take: 5, orderBy: { createdAt: 'desc' } }
        }
      }),
      prisma.vehicle.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single Vehicle by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Vehicle not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }
    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      where.branchId = req.user.branchId;
    }

    const data = await prisma.vehicle.findFirst({
      where,
      include: {
        currentDriver: true,
        company: true,
        truckLoads: true,
        telemetryHistory: { take: 10, orderBy: { timestamp: 'desc' } }
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Vehicle not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    if (data.assignedTrailerId) {
      data.assignedTrailer = await prisma.vehicle.findUnique({
        where: { id: data.assignedTrailerId },
        include: { currentDriver: true }
      }).catch(() => null);
    }
    if (data.assignedTruckId) {
      data.assignedTruck = await prisma.vehicle.findUnique({
        where: { id: data.assignedTruckId },
        include: { currentDriver: true }
      }).catch(() => null);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Save Base64 Photo to public/uploads directory
const saveBase64Photo = (photoData) => {
  if (!photoData || typeof photoData !== 'string') return null;
  if (!photoData.startsWith('data:image')) {
    return photoData;
  }
  try {
    const matches = photoData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    const type = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    
    const publicDir = path.join(__dirname, '../../public');
    const uploadsDir = path.join(publicDir, 'uploads');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const ext = type.split('/')[1] || 'png';
    const uniqueFilename = `vehicle-${Date.now()}-${Math.round(Math.random() * 1E6)}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, data);
    return `/uploads/${uniqueFilename}`;
  } catch (err) {
    console.error('Failed to save base64 vehicle image:', err);
    return null;
  }
};

const ALLOWED_VEHICLE_FIELDS = new Set([
  'rego', 'plate', 'make', 'model', 'year', 'category', 'color', 'vin', 
  'engineNumber', 'odometerKm', 'maintenanceDueKm', 'fuelType', 'regType', 
  'regState', 'regIssueDate', 'regExpiryDate', 'maxDistPerTripKm', 
  'primaryMechanic', 'preferredRoutes', 'preferredRegions', 'dgCertified', 
  'hvCertified', 'status', 'companyId', 'currentLocation', 
  'currentSpeed', 'fuelLevel', 'engineTemp', 'lastPing', 'currentDriverId', 'branchId', 'photoUrl',
  'assignedTrailerId', 'assignedTruckId'
]);

const sanitizePayload = (rawPayload) => {
  const clean = {};

  const incomingRego = rawPayload.rego || rawPayload.reg || rawPayload.registrationNumber || rawPayload.plate;
  if (incomingRego) {
    clean.rego = String(incomingRego).trim().toUpperCase();
    clean.plate = String(incomingRego).trim().toUpperCase();
  }
  if (rawPayload.vin) clean.vin = String(rawPayload.vin).trim();
  if (rawPayload.year !== undefined && rawPayload.year !== null) {
    const parsedYear = parseInt(String(rawPayload.year).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsedYear)) clean.year = parsedYear;
  }

  if (rawPayload.make !== undefined) {
    const makeStr = String(rawPayload.make || '').trim();
    if (makeStr.includes(' ') && !rawPayload.model) {
      const parts = makeStr.split(' ');
      clean.make = parts[0];
      clean.model = parts.slice(1).join(' ');
    } else {
      clean.make = makeStr;
    }
  }

  if (rawPayload.model !== undefined && !clean.model) {
    clean.model = String(rawPayload.model || '').trim();
  }

  if (rawPayload.status) {
    const s = String(rawPayload.status).toUpperCase().replace(/\s+/g, '_');
    if (['IN_TRANSIT', 'IDLE', 'MAINTENANCE', 'ALERT'].includes(s)) {
      clean.status = s;
    } else if (s === 'ACTIVE' || s === 'AVAILABLE') {
      clean.status = 'IDLE';
    } else if (s === 'OUT_OF_SERVICE') {
      clean.status = 'ALERT';
    }
  }

  if (rawPayload.category || rawPayload.type || rawPayload.vehicleType || rawPayload.regType) {
    const explicitCat = String(rawPayload.category || '').toUpperCase().trim();
    const customType = String(rawPayload.regType || rawPayload.type || rawPayload.vehicleType || '').trim();
    const c = (customType + ' ' + explicitCat).toUpperCase();
    
    if (explicitCat === 'TRAILER' || explicitCat === 'TRUCK') {
      clean.category = explicitCat;
    } else if (c.includes('TRAILER')) {
      clean.category = 'TRAILER';
    } else if (c.includes('TRUCK')) {
      clean.category = 'TRUCK';
    } else {
      clean.category = 'TRUCK';
    }
    if (customType) {
      clean.regType = customType;
    }
  }

  if (rawPayload.odometerKm !== undefined && rawPayload.odometerKm !== null) {
    const parsedNum = parseInt(String(rawPayload.odometerKm).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsedNum)) {
      clean.odometerKm = Math.min(Math.max(0, parsedNum), 2147483647);
    }
  }

  if (rawPayload.maintenanceDueKm !== undefined && rawPayload.maintenanceDueKm !== null) {
    const num = parseInt(String(rawPayload.maintenanceDueKm).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) clean.maintenanceDueKm = num;
  }

  if (rawPayload.maxDistPerTripKm !== undefined && rawPayload.maxDistPerTripKm !== null) {
    const num = parseInt(String(rawPayload.maxDistPerTripKm).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) clean.maxDistPerTripKm = num;
  }

  if (rawPayload.dgCertified !== undefined) clean.dgCertified = Boolean(rawPayload.dgCertified);
  if (rawPayload.hvCertified !== undefined) clean.hvCertified = Boolean(rawPayload.hvCertified);

  const rawPhoto = rawPayload.photoUrl ?? rawPayload.avatarUrl ?? rawPayload.img ?? rawPayload.photoPreview ?? rawPayload.photo;
  if (rawPhoto !== undefined && rawPhoto !== null) {
    clean.photoUrl = saveBase64Photo(rawPhoto);
  }

  [
    'regType', 'regState', 'fuelType', 'color', 'engineNumber',
    'primaryMechanic', 'preferredRoutes', 'preferredRegions', 'currentLocation',
    'currentDriverId', 'branchId', 'assignedTrailerId', 'assignedTruckId'
  ].forEach(field => {
    if (rawPayload[field] !== undefined) {
      clean[field] = rawPayload[field] ? String(rawPayload[field]).trim() : null;
    }
  });

  if (rawPayload.dgCertified !== undefined) clean.dgCertified = Boolean(rawPayload.dgCertified);
  if (rawPayload.hvCertified !== undefined) clean.hvCertified = Boolean(rawPayload.hvCertified);

  // Filter only allowed vehicle fields
  const filteredClean = {};
  for (const [key, val] of Object.entries(clean)) {
    if (ALLOWED_VEHICLE_FIELDS.has(key)) {
      filteredClean[key] = val;
    }
  }

  return filteredClean;
};

const cleanVehiclePhotoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.includes('...') || trimmed.endsWith('..')) return null;
  
  if (trimmed.startsWith('data:image/')) {
    try {
      const matches = trimmed.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = Buffer.from(matches[2], 'base64');
        const ext = mimeType.split('/')[1] || 'png';
        const filename = `vehicle-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        const publicDir = path.join(__dirname, '../../public');
        const uploadsDir = path.join(publicDir, 'uploads');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, base64Data);
        return `/uploads/${filename}`;
      }
    } catch (err) {
      console.error('Error saving vehicle photo base64:', err);
      return null;
    }
  }
  return trimmed;
};

// Create new Vehicle
exports.create = async (req, res, next) => {
  try {
    await syncMissingVehicleColumns();
    const rawPayload = { ...req.body };
    const companyId = req.tenantId || req.user?.companyId;

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
      }
      rawPayload.companyId = companyId;
    } else {
      rawPayload.companyId = rawPayload.companyId || companyId;
    }
    const effectiveCompanyId = rawPayload.companyId;

    if (!effectiveCompanyId) {
      try {
        const fallbackComp = await prisma.company.create({
          data: {
            name: 'Hero Logistics Default',
            tenantId: `TEN-FALLBACK-${Date.now()}`
          }
        });
        effectiveCompanyId = fallbackComp.id;
      } catch (e) {
        console.error('Critical fallback company creation error:', e.message);
      }
    }

    let branchIdVal = rawPayload.branchId || rawPayload.branch || null;
    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      branchIdVal = req.user.branchId;
    }

    let validBranchId = null;
    let customDepotText = null;

    if (branchIdVal && typeof branchIdVal === 'string') {
      try {
        const branchObj = await prisma.branch.findFirst({
          where: { OR: [{ id: branchIdVal }, { name: branchIdVal }] }
        });
        if (branchObj) {
          validBranchId = branchObj.id;
        } else {
          customDepotText = branchIdVal;
        }
      } catch (bErr) {
        customDepotText = branchIdVal;
      }
    }
    if (rawPayload.primaryDepot && !validBranchId) {
      customDepotText = rawPayload.primaryDepot;
    }

    let regoVal = (rawPayload.rego || rawPayload.reg || rawPayload.registrationNo || rawPayload.registrationNumber || rawPayload.id || '').trim().toUpperCase();
    let vinVal = (rawPayload.vin || rawPayload.vinNumber || '').trim();

    if (!regoVal) {
      regoVal = `VEH-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (!vinVal) {
      vinVal = `VIN-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    // Check pre-existing registration or VIN safely without altering user input
    try {
      if (regoVal) {
        const existingReg = await prisma.vehicle.findFirst({ where: { rego: regoVal } });
        if (existingReg && existingReg.companyId === effectiveCompanyId) {
          return sendError(res, {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `A vehicle with registration "${regoVal}" already exists in your fleet.`
          }, HTTP_STATUS.BAD_REQUEST);
        }
      }

      if (vinVal) {
        const existingVin = await prisma.vehicle.findFirst({ where: { vin: vinVal } });
        if (existingVin && existingVin.companyId === effectiveCompanyId) {
          return sendError(res, {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `A vehicle with VIN "${vinVal}" already exists in your fleet.`
          }, HTTP_STATUS.BAD_REQUEST);
        }
      }
    } catch (checkErr) {
      console.warn('Vehicle duplicate check warning:', checkErr.message);
    }

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

    let odo = 0;
    if (rawPayload.odometerKm !== undefined && rawPayload.odometerKm !== null) {
      const parsedNum = parseInt(String(rawPayload.odometerKm).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedNum)) {
        odo = Math.min(Math.max(0, parsedNum), 2147483647);
      }
    }

    const vehicleData = {
      rego: regoVal,
      vin: vinVal,
      make: rawPayload.make || null,
      model: rawPayload.model || null,
      plate: rawPayload.plate || regoVal,
      year: rawPayload.year ? parseInt(String(rawPayload.year).replace(/[^0-9]/g, ''), 10) || null : null,
      category: validCategory,
      status: validStatus,
      fuelType: rawPayload.fuelType || null,
      odometerKm: odo
    };

    if (effectiveCompanyId) {
      vehicleData.company = { connect: { id: effectiveCompanyId } };
    }

    if (rawPayload.color) vehicleData.color = rawPayload.color;
    if (rawPayload.engineNumber) vehicleData.engineNumber = String(rawPayload.engineNumber);
    if (rawPayload.regState) vehicleData.regState = String(rawPayload.regState);
    if (rawPayload.regType) vehicleData.regType = String(rawPayload.regType);
    if (customDepotText || rawPayload.primaryMechanic) {
      vehicleData.primaryMechanic = String(customDepotText || rawPayload.primaryMechanic);
    }
    if (validBranchId) {
      vehicleData.branch = { connect: { id: validBranchId } };
    }
    if (rawPayload.preferredRoutes) vehicleData.preferredRoutes = String(rawPayload.preferredRoutes);
    if (rawPayload.preferredRegions) vehicleData.preferredRegions = String(rawPayload.preferredRegions);
    if (rawPayload.maxDistPerTripKm) vehicleData.maxDistPerTripKm = parseInt(rawPayload.maxDistPerTripKm) || undefined;
    if (rawPayload.dgCertified !== undefined) vehicleData.dgCertified = Boolean(rawPayload.dgCertified);
    if (rawPayload.hvCertified !== undefined) vehicleData.hvCertified = Boolean(rawPayload.hvCertified);

    const rawPhoto = rawPayload.photoUrl || rawPayload.photo || rawPayload.img;
    let cleanPhoto = null;
    if (rawPhoto) {
      cleanPhoto = cleanVehiclePhotoUrl(rawPhoto);
      if (cleanPhoto) vehicleData.photoUrl = cleanPhoto;
    }

    try {
      let data;
      try {
        data = await prisma.vehicle.create({
          data: vehicleData,
          include: {
            currentDriver: true
          }
        });
      } catch (firstErr) {
        console.warn('First prisma.vehicle.create attempt warning:', firstErr.message);
        const fallbackData = {
          rego: regoVal,
          vin: vinVal,
          make: rawPayload.make || null,
          model: rawPayload.model || null,
          year: rawPayload.year ? parseInt(String(rawPayload.year).replace(/[^0-9]/g, ''), 10) || null : null,
          category: validCategory,
          status: validStatus,
          odometerKm: odo
        };
        if (effectiveCompanyId) {
          fallbackData.company = { connect: { id: effectiveCompanyId } };
        }
        if (cleanPhoto) {
          fallbackData.primaryMechanic = `Photo:${cleanPhoto}`;
        }
        data = await prisma.vehicle.create({
          data: fallbackData
        });
      }
      return sendSuccess(res, data, HTTP_STATUS.CREATED);
    } catch (createErr) {
      console.error('Error in prisma.vehicle.create:', createErr);
      if (createErr.code === 'P2002') {
        const target = Array.isArray(createErr.meta?.target) ? createErr.meta.target.join(', ') : (createErr.meta?.target || 'field');
        return sendError(res, {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: `A vehicle with this ${target} already exists.`
        }, HTTP_STATUS.BAD_REQUEST);
      }
      const conciseErr = createErr.message ? createErr.message.split('\n').pop() : 'Failed to save vehicle.';
      return sendError(res, {
        code: ERROR_CODES.BAD_REQUEST,
        message: `Database save error: ${conciseErr}`
      }, HTTP_STATUS.BAD_REQUEST);
    }
  } catch (error) {
    next(error);
  }
};

// Update Vehicle with Optimistic Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = sanitizePayload(req.body);

    const companyId = resolveCompanyId(req);
    const findWhere = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Vehicle not found' }, HTTP_STATUS.NOT_FOUND);
      }
      findWhere.companyId = companyId;
    }
    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      findWhere.branchId = req.user.branchId;
    }
    const existing = await prisma.vehicle.findFirst({
      where: findWhere
    });
    if (!existing) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Vehicle not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    const where = { id };

    // Check version if optimistic concurrency is required
    const ifMatch = req.headers['if-match'];
    if (ifMatch) {
      const version = parseInt(ifMatch, 10);
      if (!isNaN(version)) {
        where.version = version;
        updateData.version = { increment: 1 };
      }
    }

    try {
      let data;
      try {
        data = await prisma.vehicle.update({
          where,
          data: updateData
        });
      } catch (upErr) {
        if (upErr.message && upErr.message.includes('photoUrl')) {
          const photoToSave = updateData.photoUrl;
          delete updateData.photoUrl;
          if (photoToSave) {
            updateData.primaryMechanic = updateData.primaryMechanic 
              ? `${updateData.primaryMechanic} | Photo:${photoToSave}`
              : `Photo:${photoToSave}`;
          }
          data = await prisma.vehicle.update({
            where,
            data: updateData
          });
        } else {
          throw upErr;
        }
      }
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
          message: 'Vehicle not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
};

// Delete Vehicle
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolveCompanyId } = require('../middlewares/tenantResolver');
    const companyId = resolveCompanyId(req);
    const where = { id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Vehicle not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      where.branchId = req.user.branchId;
    }

    const existing = await prisma.vehicle.findFirst({ where });
    if (!existing) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Vehicle not found'
      }, HTTP_STATUS.NOT_FOUND);
    }

    const vehId = existing.id;
    // Clean up or unlink dependent records
    if (prisma.telemetryLog) await prisma.telemetryLog.deleteMany({ where: { vehicleId: vehId } }).catch(() => {});
    if (prisma.load) {
      await prisma.load.updateMany({ where: { truckId: vehId }, data: { truckId: null } }).catch(() => {});
      await prisma.load.updateMany({ where: { trailerId: vehId }, data: { trailerId: null } }).catch(() => {});
    }
    if (prisma.loadExpense) await prisma.loadExpense.updateMany({ where: { vehicleId: vehId }, data: { vehicleId: null } }).catch(() => {});
    if (prisma.document) await prisma.document.updateMany({ where: { vehicleId: vehId }, data: { vehicleId: null } }).catch(() => {});
    if (prisma.equipmentSwap) {
      await prisma.equipmentSwap.updateMany({ where: { prevTrailerId: vehId }, data: { prevTrailerId: null } }).catch(() => {});
      await prisma.equipmentSwap.updateMany({ where: { newTrailerId: vehId }, data: { newTrailerId: null } }).catch(() => {});
    }

    await prisma.vehicle.delete({
      where: { id: vehId }
    });
    return sendSuccess(res, { id, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Attach Trailer to Truck (or Hitch Truck to Trailer)
exports.attachTrailer = async (req, res, next) => {
  try {
    await syncMissingVehicleColumns();
    const { id } = req.params;
    const { trailerId: incomingTrailerId, truckId: incomingTruckId, notes, reason } = req.body;
    const companyId = resolveCompanyId(req);

    const where = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
      }
      where.companyId = companyId;
    }

    const currentVehicle = await prisma.vehicle.findFirst({ where });
    if (!currentVehicle) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Vehicle not found' }, HTTP_STATUS.NOT_FOUND);
    }

    let truckId;
    let trailerId;

    if (currentVehicle.category === 'TRUCK') {
      truckId = currentVehicle.id;
      trailerId = incomingTrailerId || incomingTruckId;
    } else {
      trailerId = currentVehicle.id;
      truckId = incomingTruckId || incomingTrailerId;
    }

    if (!trailerId) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Trailer ID is required' }, HTTP_STATUS.BAD_REQUEST);
    }
    if (!truckId) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Truck ID is required' }, HTTP_STATUS.BAD_REQUEST);
    }
    if (truckId === trailerId) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'A vehicle cannot be attached to itself' }, HTTP_STATUS.BAD_REQUEST);
    }

    // Verify truck
    const truck = await prisma.vehicle.findFirst({
      where: {
        id: truckId,
        ...(req.user?.role !== 'SUPER_ADMIN' ? { companyId } : {})
      }
    });
    if (!truck) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Truck not found in company fleet' }, HTTP_STATUS.NOT_FOUND);
    }

    // Verify trailer
    const trailer = await prisma.vehicle.findFirst({
      where: {
        id: trailerId,
        ...(req.user?.role !== 'SUPER_ADMIN' ? { companyId } : {})
      }
    });
    if (!trailer) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Trailer not found in company fleet' }, HTTP_STATUS.NOT_FOUND);
    }

    // Validation: prevent trailer from being attached to another truck already
    if (trailer.assignedTruckId && trailer.assignedTruckId !== truck.id) {
      const existingTruck = await prisma.vehicle.findUnique({ where: { id: trailer.assignedTruckId } }).catch(() => null);
      const truckLabel = existingTruck?.rego || existingTruck?.plate || trailer.assignedTruckId;
      return sendError(res, {
        code: ERROR_CODES.RESOURCE_CONFLICT,
        message: `Trailer ${trailer.rego || trailer.plate} is already hitched to Prime Mover ${truckLabel}. Please detach it first.`
      }, HTTP_STATUS.CONFLICT);
    }

    // Check if truck already has a different trailer attached -> Swap handling
    const prevTrailerId = truck.assignedTrailerId;
    if (prevTrailerId && prevTrailerId !== trailer.id) {
      // Unhitch previous trailer
      await prisma.vehicle.update({
        where: { id: prevTrailerId },
        data: {
          assignedTruckId: null,
          status: 'IDLE'
        }
      }).catch(err => console.error('Error detaching previous trailer:', err));
    }

    // Update truck
    const updatedTruck = await prisma.vehicle.update({
      where: { id: truck.id },
      data: {
        assignedTrailerId: trailer.id
      },
      include: {
        currentDriver: true
      }
    });

    // Update trailer
    const updatedTrailer = await prisma.vehicle.update({
      where: { id: trailer.id },
      data: {
        assignedTruckId: truck.id,
        status: truck.status === 'IN_TRANSIT' ? 'IN_TRANSIT' : 'IDLE'
      }
    });

    // Optionally log equipment swap record if driver exists
    if (truck.currentDriverId && prisma.equipmentSwap) {
      try {
        await prisma.equipmentSwap.create({
          data: {
            driverId: truck.currentDriverId,
            prevTrailerId: prevTrailerId || null,
            newTrailerId: trailer.id,
            swapType: prevTrailerId ? 'Trailer Swap' : 'Trailer Hitch',
            reason: reason || 'Operational Attachment',
            approvalStatus: 'Approved',
            notes: notes || `Attached trailer ${trailer.rego || trailer.plate} to truck ${truck.rego || truck.plate}`
          }
        });
      } catch (swapErr) {
        console.warn('Could not record EquipmentSwap:', swapErr.message);
      }
    }

    return sendSuccess(res, {
      truck: updatedTruck,
      trailer: updatedTrailer,
      message: `Trailer ${trailer.rego || trailer.plate} attached to truck ${truck.rego || truck.plate} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Detach / Unhitch Trailer
exports.detachTrailer = async (req, res, next) => {
  try {
    await syncMissingVehicleColumns();
    const { id } = req.params;
    const companyId = resolveCompanyId(req);

    const where = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
      }
      where.companyId = companyId;
    }

    const vehicle = await prisma.vehicle.findFirst({ where });
    if (!vehicle) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Vehicle not found' }, HTTP_STATUS.NOT_FOUND);
    }

    let truckToUpdate = null;
    let trailerToUpdate = null;

    if (vehicle.category === 'TRUCK') {
      truckToUpdate = vehicle;
      if (vehicle.assignedTrailerId) {
        trailerToUpdate = await prisma.vehicle.findUnique({ where: { id: vehicle.assignedTrailerId } }).catch(() => null);
      }
    } else {
      trailerToUpdate = vehicle;
      if (vehicle.assignedTruckId) {
        truckToUpdate = await prisma.vehicle.findUnique({ where: { id: vehicle.assignedTruckId } }).catch(() => null);
      }
    }

    if (truckToUpdate) {
      await prisma.vehicle.update({
        where: { id: truckToUpdate.id },
        data: { assignedTrailerId: null }
      });
    }

    if (trailerToUpdate) {
      await prisma.vehicle.update({
        where: { id: trailerToUpdate.id },
        data: {
          assignedTruckId: null,
          status: 'IDLE' // Available in Yard
        }
      });
    }

    return sendSuccess(res, {
      unhitched: true,
      message: 'Trailer unhitched successfully. Status updated to Available in Yard.'
    });
  } catch (error) {
    next(error);
  }
};

// Assign Driver to Truck (Cascades to attached trailer)
exports.assignDriver = async (req, res, next) => {
  try {
    await syncMissingVehicleColumns();
    const { id } = req.params;
    const { driverId } = req.body;
    const companyId = resolveCompanyId(req);

    const where = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
      }
      where.companyId = companyId;
    }

    const truck = await prisma.vehicle.findFirst({ where });
    if (!truck) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Vehicle not found' }, HTTP_STATUS.NOT_FOUND);
    }

    let driver = null;
    if (driverId) {
      driver = await prisma.driver.findFirst({
        where: {
          id: driverId,
          ...(req.user?.role !== 'SUPER_ADMIN' ? { companyId } : {})
        }
      });
      if (!driver) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Driver not found' }, HTTP_STATUS.NOT_FOUND);
      }
    }

    const updatedTruck = await prisma.vehicle.update({
      where: { id: truck.id },
      data: {
        currentDriverId: driverId || null
      },
      include: {
        currentDriver: true
      }
    });

    let attachedTrailer = null;
    if (updatedTruck.assignedTrailerId) {
      attachedTrailer = await prisma.vehicle.findUnique({
        where: { id: updatedTruck.assignedTrailerId }
      }).catch(() => null);
    }

    return sendSuccess(res, {
      truck: updatedTruck,
      attachedTrailer,
      driver,
      message: driverId 
        ? `Driver assigned to ${truck.rego || truck.plate}${attachedTrailer ? ` with attached trailer ${attachedTrailer.rego || attachedTrailer.plate}` : ''}`
        : 'Driver unassigned from vehicle'
    });
  } catch (error) {
    next(error);
  }
};
