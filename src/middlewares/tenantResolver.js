const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { sendError } = require('../utils/apiResponse');

/**
 * Resolves the Tenant Context based on API Specification 3.3
 */
exports.resolveTenant = async (req, res, next) => {
  try {
    let tenantId = null;

    if (req.user) {
      if (req.user.role !== 'SUPER_ADMIN') {
        // Authenticated non-super-admin users are strictly bound to their assigned company/tenant
        tenantId = req.user.companyId || req.user.tenantId || null;
      } else {
        // Super Admin can impersonate, scope via query string or headers, or use their own tenant
        tenantId = req.user.impersonatedTenantId ||
          req.query?.companyId ||
          (req.headers ? (req.headers['x-company-id'] || req.headers['x-tenant-id']) : null) ||
          req.user.companyId ||
          null;
      }
    } else if (req.headers && (req.headers['x-company-id'] || req.headers['x-tenant-id'])) {
      // Unauthenticated fallback (e.g., public tenant-scoped webhook or pre-auth check)
      tenantId = req.headers['x-company-id'] || req.headers['x-tenant-id'];
    }

    req.tenantId = tenantId || null;
    next();
  } catch (error) {
    next(error);
  }
};

exports.resolveCompanyId = (req) => {
  // 1. Authenticated non-super-admin: strictly return the user's bound company/tenant
  if (req.user && req.user.role !== 'SUPER_ADMIN') {
    return req.user.companyId || req.user.tenantId || req.tenantId || null;
  }

  // 2. Authenticated Super Admin: allow impersonation, query override, header override, or user company
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    return req.user.impersonatedTenantId ||
      req.query?.companyId ||
      (req.headers ? (req.headers['x-company-id'] || req.headers['x-tenant-id']) : null) ||
      req.tenantId ||
      req.user.companyId ||
      null;
  }

  // 3. Fallback for unauthenticated / webhook requests
  return req.tenantId ||
    (req.headers ? (req.headers['x-company-id'] || req.headers['x-tenant-id']) : null) ||
    null;
};

exports.getTenantWhere = (req, strictTenant = false) => {
  const companyId = exports.resolveCompanyId(req);
  if (companyId) {
    return { companyId };
  }
  // Enforce zero-data isolation on all company-admin portal routes or when strictTenant is true
  if (strictTenant || (req.baseUrl && req.baseUrl.includes('company-admin'))) {
    return { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
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
  const companyId = exports.resolveCompanyId(req);
  if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
    return sendError(res, {
      code: ERROR_CODES.UNAUTHORIZED_ACCESS,
      message: 'Tenant context is missing. You must operate within a tenant scope.'
    }, HTTP_STATUS.FORBIDDEN);
  }
  if (companyId) {
    req.tenantId = companyId;
  }
  next();
};

