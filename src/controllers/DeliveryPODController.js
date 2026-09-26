const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get all DeliveryPODs with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    
    if (req.tenantId) where.load = { companyId: req.tenantId };
    if (req.user && req.user.role === 'DRIVER') {
      where.driver = { userId: req.user.id };
    }

    const [data, total] = await Promise.all([
      prisma.deliveryPOD.findMany({
        where, skip, take, orderBy,
        include: {
          load: {
            include: { driver: true, customer: true }
          },
          driver: true
        }
      }),
      prisma.deliveryPOD.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single DeliveryPOD by ID
exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.tenantId) where.load = { companyId: req.tenantId };
    if (req.user && req.user.role === 'DRIVER') {
      where.driver = { userId: req.user.id };
    }

    const data = await prisma.deliveryPOD.findFirst({
      where,
      include: {
        load: {
          include: { driver: true, customer: true }
        },
        driver: true
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'DeliveryPOD not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

const { saveBase64Image } = require('../utils/fileStorage');

// Create new DeliveryPOD
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.signatureUrl) {
      payload.signatureUrl = saveBase64Image(payload.signatureUrl, 'signatures');
    }

    if (req.user && req.user.role === 'DRIVER') {
      const driver = await prisma.driver.findFirst({
        where: { userId: req.user.id }
      });
      if (!driver) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Driver profile not found'
        }, HTTP_STATUS.FORBIDDEN);
      }
      payload.driverId = driver.id;

      // Check that they are assigned to the load
      const assignedLoad = await prisma.load.findFirst({
        where: { id: payload.loadId, driverId: driver.id }
      });
      if (!assignedLoad) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'You are not assigned to this load.'
        }, HTTP_STATUS.FORBIDDEN);
      }
    }

    const data = await prisma.deliveryPOD.create({
      data: payload,
      include: {
        load: { include: { customer: true, items: true } },
        driver: true
      }
    });

    // 1. Update Load status to DELIVERED
    if (data.loadId) {
      await prisma.load.update({
        where: { id: data.loadId },
        data: { status: 'DELIVERED', deliveryEta: new Date() }
      }).catch(() => null);

      // Auto-credit Driver Payroll
      if (data.driverId || data.load?.driverId) {
        try {
          const { autoCreditDriverPayroll } = require('./CompanyAdminPortalController');
          await autoCreditDriverPayroll(data.loadId, data.driverId || data.load?.driverId, data.load?.companyId);
        } catch (payErr) {
          console.warn('POD autoCreditDriverPayroll catch:', payErr?.message);
        }
      }

      // 2. Prevent duplicate invoice creation: check if draft/invoice for load exists
      const existingInvoice = await prisma.customerInvoice.findFirst({
        where: { loadId: data.loadId }
      }).catch(() => null);

      if (!existingInvoice && data.load) {
        const companyId = data.load.companyId;
        const customerId = data.load.customerId;

        // Calculate total amount from load items rate or default
        const itemsCount = data.load.items?.length || 1;
        const totalAmount = data.load.items?.reduce((sum, it) => sum + (it.unitPrice || 450), 0) || (itemsCount * 450);
        
        const invoiceNumber = `INV-${data.load.loadRef || 'LD-' + data.loadId.slice(0, 6)}`;

        await prisma.customerInvoice.create({
          data: {
            invoiceNumber,
            loadId: data.loadId,
            customerId: customerId || (await prisma.customer.findFirst({ where: companyId ? { companyId } : {} }))?.id,
            amount: totalAmount,
            appliedTaxRate: 0.10,
            status: 'DRAFT',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            notes: `Auto-generated Draft Invoice from POD for Load ${data.load.loadRef || data.loadId}. Delivered on ${new Date().toLocaleDateString('en-GB')}`,
            type: 'Freight Linehaul',
            items: data.load.items?.map(it => ({
              desc: `${it.make || 'Vehicle'} ${it.model || 'Freight'} (${it.vin || it.rego || 'VIN'})`,
              qty: 1,
              rate: it.unitPrice || 450,
              amount: it.unitPrice || 450,
              gst: (it.unitPrice || 450) * 0.1,
              total: (it.unitPrice || 450) * 1.1
            })) || [{ desc: `Freight Transport Service - ${data.load.loadRef}`, qty: 1, rate: totalAmount, amount: totalAmount, gst: totalAmount * 0.1, total: totalAmount * 1.1 }]
          }
        }).catch(() => null);
      }
    }

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update DeliveryPOD with Optimistic Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const where = { id };
    if (req.tenantId) where.load = { companyId: req.tenantId };
    if (req.user && req.user.role === 'DRIVER') {
      where.driver = { userId: req.user.id };
    }

    // Check version if optimistic concurrency is required
    const ifMatch = req.headers['if-match'];
    if (ifMatch) {
      where.version = parseInt(ifMatch.replace(/"/g, ''), 10);
    }

    try {
      const data = await prisma.deliveryPOD.update({
        where,
        data: updateData
      });
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
          message: 'DeliveryPOD not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
};

// Delete DeliveryPOD
exports.delete = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.tenantId) where.load = { companyId: req.tenantId };
    if (req.user && req.user.role === 'DRIVER') {
      where.driver = { userId: req.user.id };
    }

    await prisma.deliveryPOD.delete({ where });
    
    // 204 No Content for successful delete
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'DeliveryPOD not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
