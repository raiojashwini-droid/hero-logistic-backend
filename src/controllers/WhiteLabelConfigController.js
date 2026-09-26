const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Get all WhiteLabelConfigs with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    
    // Optional: Inject tenant scope here if applicable
    // if (req.tenantId) where.tenantId = req.tenantId;

    const [data, total] = await Promise.all([
      prisma.whiteLabelConfig.findMany({
        where, skip, take, orderBy
      }),
      prisma.whiteLabelConfig.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single WhiteLabelConfig by ID
exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    const data = await prisma.whiteLabelConfig.findFirst({ where });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'WhiteLabelConfig not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new WhiteLabelConfig
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    
    // Map frontend keys to match schema fields
    if ('loaderGif' in payload) { payload.loaderGifUrl = payload.loaderGif; delete payload.loaderGif; }
    if ('lightLogo' in payload) { payload.logoLightUrl = payload.lightLogo; delete payload.lightLogo; }
    if ('darkLogo' in payload) { payload.logoDarkUrl = payload.darkLogo; delete payload.darkLogo; }
    if ('favicon' in payload) { payload.faviconUrl = payload.favicon; delete payload.favicon; }
    if ('loginBg' in payload) { payload.loginBgUrl = payload.loginBg; delete payload.loginBg; }
    if ('dashboardBg' in payload) { payload.dashboardBgUrl = payload.dashboardBg; delete payload.dashboardBg; }
    if ('emailLogo' in payload) { payload.emailLogoUrl = payload.emailLogo; delete payload.emailLogo; }
    if ('invoiceLogo' in payload) { payload.invoiceLogoUrl = payload.invoiceLogo; delete payload.invoiceLogo; }
    if ('manifestLogo' in payload) { payload.manifestLogoUrl = payload.manifestLogo; delete payload.manifestLogo; }

    // Resolve companyId if missing
    let companyId = payload.companyId;
    if (!companyId) {
      const company = await prisma.company.findFirst();
      if (company) {
        companyId = company.id;
      }
    }

    if (!companyId) {
      return sendError(res, {
        code: ERROR_CODES.BAD_REQUEST,
        message: 'A company relation is required to register branding options.'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    // Check if configuration already exists for this company
    const existing = await prisma.whiteLabelConfig.findUnique({
      where: { companyId: companyId }
    });

    // For Prisma update, we remove companyId scalar and use relation if needed,
    // but since it's 1:1 and already belongs to the company, we just delete it from update payload.
    delete payload.companyId;

    let data;
    if (existing) {
      data = await prisma.whiteLabelConfig.update({
        where: { id: existing.id },
        data: payload
      });
    } else {
      payload.company = { connect: { id: companyId } };
      data = await prisma.whiteLabelConfig.create({
        data: payload
      });
    }
    return sendSuccess(res, data, existing ? HTTP_STATUS.OK : HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update WhiteLabelConfig with Optimistic Concurrency check
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
      const data = await prisma.whiteLabelConfig.update({
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
          message: 'WhiteLabelConfig not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
};

// Delete WhiteLabelConfig
exports.delete = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    // if (req.tenantId) where.tenantId = req.tenantId;

    await prisma.whiteLabelConfig.delete({ where });
    
    // 204 No Content for successful delete
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'WhiteLabelConfig not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
