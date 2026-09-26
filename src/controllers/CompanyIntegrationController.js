const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get all CompanyIntegrations with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    
    // Optional: Inject tenant scope here if applicable
    // if (req.tenantId) where.tenantId = req.tenantId;

    const [data, total] = await Promise.all([
      prisma.companyIntegration.findMany({
        where, skip, take, orderBy
      }),
      prisma.companyIntegration.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single CompanyIntegration by ID
exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    const data = await prisma.companyIntegration.findFirst({ where });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'CompanyIntegration not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new CompanyIntegration
exports.create = async (req, res, next) => {
  try {
    const { providerName, apiKey, status, integrationType } = req.body;

    if (!providerName) {
      return sendError(res, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Integration provider name is required'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    const { resolveCompanyId } = require('../middlewares/tenantResolver');
    
      let companyId = resolveCompanyId(req);
      if (req.user?.role === 'SUPER_ADMIN' && req.body.companyId) {
        companyId = req.body.companyId;
      }
      

    let typeEnum = 'CUSTOM';
    if (integrationType) {
      typeEnum = integrationType;
    } else {
      const pLower = String(providerName).toLowerCase();
      if (pLower.includes('xero') || pLower.includes('myob') || pLower.includes('quickbooks')) {
        typeEnum = 'ACCOUNTING';
      } else if (pLower.includes('samsara') || pLower.includes('nhvr') || pLower.includes('eld') || pLower.includes('gps')) {
        typeEnum = 'ELD';
      }
    }

    let statusEnum = 'CONNECTED';
    if (status) {
      const sUpper = String(status).toUpperCase();
      if (['CONNECTED', 'VERIFIED', 'OPERATIONAL', 'ACTIVE', 'NOT_CONNECTED'].includes(sUpper)) {
        statusEnum = sUpper;
      }
    }

    let data;
    if (companyId) {
      data = await prisma.companyIntegration.upsert({
        where: {
          companyId_providerName: {
            companyId,
            providerName: providerName.trim()
          }
        },
        update: {
          apiKey: apiKey ? apiKey.trim() : null,
          status: statusEnum,
          integrationType: typeEnum,
          lastSync: new Date()
        },
        create: {
          companyId,
          providerName: providerName.trim(),
          apiKey: apiKey ? apiKey.trim() : null,
          status: statusEnum,
          integrationType: typeEnum,
          lastSync: new Date()
        }
      });
    } else {
      data = await prisma.companyIntegration.create({
        data: {
          providerName: providerName.trim(),
          apiKey: apiKey ? apiKey.trim() : null,
          status: statusEnum,
          integrationType: typeEnum,
          lastSync: new Date()
        }
      });
    }

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update CompanyIntegration with Optimistic Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    const where = { id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    // Check version if optimistic concurrency is required
    const ifMatch = req.headers['if-match'];
    if (ifMatch) {
      where.version = parseInt(ifMatch.replace(/"/g, ''), 10);
    }

    try {
      const data = await prisma.companyIntegration.update({
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
          message: 'CompanyIntegration not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
};

// Delete CompanyIntegration
exports.delete = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    await prisma.companyIntegration.delete({ where });
    
    // 204 No Content for successful delete
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'CompanyIntegration not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
