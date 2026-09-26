const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { sendError } = require('../utils/apiResponse');

/**
 * Resolves the Tenant Context based on API Specification 3.3
 */
exports.resolveTenant = async (req, res, next) => {
  try {
    let tenantId = null;

    // 1. If impersonation session exists in user token
    if (req.user && req.user.impersonatedTenantId) {
      tenantId = req.user.impersonatedTenantId;
    } 
    // 2. Access token claim (tenantId or companyId)
    else if (req.user && (req.user.tenantId || req.user.companyId)) {
      tenantId = req.user.tenantId || req.user.companyId;
    }
    // 3. Query string fallback for Super Admin testing
    else if (req.user && req.user.role === 'SUPER_ADMIN' && req.query.companyId) {
      tenantId = req.query.companyId;
    }

    req.tenantId = tenantId || null;
    next();
  } catch (error) {
    next(error);
  }
};

exports.resolveCompanyId = (req) => {
  return req.tenantId || req.user?.companyId || req.user?.tenantId || (req.user?.role === 'SUPER_ADMIN' && req.query?.companyId ? req.query.companyId : null);
};

exports.getTenantWhere = (req) => {
  const companyId = exports.resolveCompanyId(req);
  if (companyId) {
    return { companyId };
  }
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    return {};
  }
  return { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
};

/**
 * Middleware to enforce tenant isolation strictly
 */
exports.requireTenant = (req, res, next) => {
  if (!req.tenantId && req.user?.role !== 'SUPER_ADMIN') {
    return sendError(res, {
      code: ERROR_CODES.UNAUTHORIZED_ACCESS,
      message: 'Tenant context is missing. You must operate within a tenant scope.'
    }, HTTP_STATUS.FORBIDDEN);
  }
  next();
};
