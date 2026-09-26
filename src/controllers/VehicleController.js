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
  'rego', 'plate', 'make', 'model', 'category', 'color', 'vin', 
  'engineNumber', 'odometerKm', 'maintenanceDueKm', 'fuelType', 'regType', 
  'regState', 'regIssueDate', 'regExpiryDate', 'maxDistPerTripKm', 
  'primaryMechanic', 'preferredRoutes', 'preferredRegions', 'dgCertified', 
  'hvCertified', 'status', 'companyId', 'currentLocation', 
  'currentSpeed', 'fuelLevel', 'engineTemp', 'lastPing', 'currentDriverId', 'branchId', 'photoUrl'
]);

const sanitizePayload = (rawPayload) => {
  const clean = {};

  if (rawPayload.rego) clean.rego = String(rawPayload.rego).trim();
  if (rawPayload.plate) clean.plate = String(rawPayload.plate).trim();
  if (rawPayload.vin) clean.vin = String(rawPayload.vin).trim();

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
    const customType = String(rawPayload.regType || rawPayload.type || rawPayload.category || rawPayload.vehicleType || '').trim();
    const c = customType.toUpperCase();
    if (['TRUCK', 'TRAILER'].includes(c)) {
      clean.category = c;
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
    'currentDriverId', 'branchId'
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

    // Check pre-existing registration or VIN safely
    try {
      const existingReg = await prisma.vehicle.findFirst({ where: { rego: regoVal } });
      if (existingReg) {
        regoVal = `${regoVal}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const existingVin = await prisma.vehicle.findFirst({ where: { vin: vinVal } });
      if (existingVin) {
        vinVal = `${vinVal}-${Math.floor(100 + Math.random() * 900)}`;
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

    if (req.tenantId) {
      const findWhere = { id, companyId: req.tenantId };
      if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
        findWhere.branchId = req.user.branchId;
      }
      const existing = await prisma.vehicle.findFirst({
        where: findWhere
      });
      if (!existing) {
        const vehicleExists = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicleExists) {
          return sendError(res, {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Vehicle not found'
          }, HTTP_STATUS.NOT_FOUND);
        }
      }
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

    await prisma.vehicle.delete({
      where: { id: existing.id }
    });
    return sendSuccess(res, { id, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};
