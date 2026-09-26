const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const getEffectiveCompanyId = (req) => {
  return req.tenantId || req.user?.companyId || req.user?.tenantId || null;
};

// Get all InboundReceipts with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const companyId = getEffectiveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendList(res, [], buildPaginationMeta(0, currentPage, pageSize, req.query.sort));
      }
      where.warehouse = { branch: { companyId } };
    } else if (req.query.companyId) {
      where.warehouse = { branch: { companyId: req.query.companyId } };
    }

    const [data, total] = await Promise.all([
      prisma.inboundReceipt.findMany({
        where, skip, take, orderBy,
        include: { warehouse: true }
      }),
      prisma.inboundReceipt.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single InboundReceipt by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'InboundReceipt not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.warehouse = { branch: { companyId } };
    }

    const data = await prisma.inboundReceipt.findFirst({ where, include: { warehouse: true } });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'InboundReceipt not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new InboundReceipt
exports.create = async (req, res, next) => {
  try {
    const {
      receiptNumber, receiptNo,
      supplierName, supplier,
      referenceNote,
      transportType,
      driverName,
      vehicleDetails, vehicleRef,
      receivingDepot,
      items = [],
      status = 'Completed',
      warehouseId
    } = req.body;

    const companyId = getEffectiveCompanyId(req);
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
    }

    const targetReceiptNo = receiptNumber || receiptNo || `GR-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetSupplier = supplierName || supplier || 'Supplier';
    const targetVehicle = vehicleDetails || vehicleRef || 'N/A';

    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const wh = await prisma.warehouse.findFirst({
        where: companyId ? { branch: { companyId } } : {}
      });
      if (wh) {
        targetWarehouseId = wh.id;
      } else if (companyId) {
        let br = await prisma.branch.findFirst({ where: { companyId } });
        if (!br) {
          br = await prisma.branch.create({ data: { name: 'Main Depot', companyId } });
        }
        const createdWh = await prisma.warehouse.create({
          data: { code: `WH-${Date.now().toString().slice(-4)}`, name: receivingDepot || 'Main Depot', branchId: br.id }
        });
        targetWarehouseId = createdWh.id;
      }
    }

    if (!targetWarehouseId) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Warehouse context required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const data = await prisma.inboundReceipt.create({
      data: {
        receiptNo: targetReceiptNo,
        supplier: targetSupplier,
        referenceNote: referenceNote || 'N/A',
        transportType: transportType || 'Truck',
        driverName: driverName || 'Staff',
        vehicleRef: targetVehicle,
        status,
        warehouseId: targetWarehouseId,
        receivingDate: new Date()
      }
    });

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update InboundReceipt with Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const companyId = getEffectiveCompanyId(req);
    const where = { id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'InboundReceipt not found' }, HTTP_STATUS.NOT_FOUND);
      where.warehouse = { branch: { companyId } };
    }

    const existing = await prisma.inboundReceipt.findFirst({ where });
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'InboundReceipt not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const data = await prisma.inboundReceipt.update({
      where: { id: existing.id },
      data: updateData
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete InboundReceipt
exports.delete = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      where.warehouse = { branch: { companyId } };
    }

    const existing = await prisma.inboundReceipt.findFirst({ where });
    if (existing) {
      await prisma.inboundReceipt.delete({ where: { id: existing.id } });
    }
    
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
};
