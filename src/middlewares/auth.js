const jwt = require('jsonwebtoken');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { sendError } = require('../utils/apiResponse');

/**
 * Verifies JWT from HttpOnly cookie or Authorization Bearer header
 */
exports.verifyToken = async (req, res, next) => {
  let token = req.cookies?.accessToken;
  
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, {
      code: ERROR_CODES.UNAUTHORIZED_ACCESS,
      message: 'Access token is required.'
    }, HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';
    const decoded = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.id;
    req.user = { ...decoded, id: userId, userId };

    try {
      const prisma = require('../utils/prismaClient');
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          customRole: {
            include: {
              permissions: true
            }
          }
        }
      });
      if (dbUser) {
        req.user.companyId = dbUser.companyId || req.user.companyId || null;
        req.user.tenantId = dbUser.companyId || req.user.tenantId || null;
        req.user.branchId = dbUser.branchId || null;
        req.user.role = dbUser.role || req.user.role;
        req.user.permissions = dbUser.customRole?.permissions?.map(p => p.actionString) || [];
      }
    } catch (userDbErr) {
      console.warn('Auth middleware dbUser lookup warning:', userDbErr?.message || userDbErr);
    }

    req.tenantId = req.user?.companyId || req.user?.tenantId || null;
    req.companyId = req.tenantId;

    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      const decoded = jwt.decode(token);
      if (decoded) {
        const userId = decoded.userId || decoded.id;
        req.user = { ...decoded, id: userId, userId };
        try {
          const prisma = require('../utils/prismaClient');
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
              customRole: {
                include: {
                  permissions: true
                }
              }
            }
          });
          if (dbUser) {
            req.user.companyId = dbUser.companyId || req.user.companyId || null;
            req.user.tenantId = dbUser.companyId || req.user.tenantId || null;
            req.user.branchId = dbUser.branchId || null;
            req.user.role = dbUser.role || req.user.role;
            req.user.permissions = dbUser.customRole?.permissions?.map(p => p.actionString) || [];
          }
        } catch (fallbackDbErr) {
          console.warn('Auth middleware fallback lookup warning:', fallbackDbErr?.message || fallbackDbErr);
        }
        req.tenantId = req.user?.companyId || req.user?.tenantId || null;
        req.companyId = req.tenantId;
        return next();
      }
    }
    return sendError(res, {
      code: ERROR_CODES.UNAUTHORIZED_ACCESS,
      message: 'Invalid or expired access token.'
    }, HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Checks if user has required roles/permissions
 * Usage: router.get('/something', verifyToken, requirePermission('platform.dashboard.view'), controller.method)
 */
exports.requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    // Basic implementation: assuming req.user.permissions is an array of strings
    if (req.user && req.user.permissions && req.user.permissions.includes(requiredPermission)) {
      return next();
    }
    
    // Also allow SUPER_ADMIN to bypass
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    return sendError(res, {
      code: ERROR_CODES.UNAUTHORIZED_ACCESS,
      message: 'You do not have permission to perform this action.',
      details: { requiredPermission }
    }, HTTP_STATUS.FORBIDDEN);
  };
};

/**
 * Checks if user has any of the allowed roles
 * Usage: router.get('/sales', verifyToken, requireRole('SUPER_ADMIN', 'SALES'), ...)
 */
exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, {
        code: ERROR_CODES.UNAUTHORIZED_ACCESS,
        message: 'Authentication required.'
      }, HTTP_STATUS.UNAUTHORIZED);
    }

    if (req.user.role === 'SUPER_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return sendError(res, {
      code: ERROR_CODES.UNAUTHORIZED_ACCESS,
      message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`
    }, HTTP_STATUS.FORBIDDEN);
  };
};

/**
 * Ensures user is authenticated for Sales domain
 * Sets salesScope: 'TEAM' for SALES_FULL_ACCESS / SUPER_ADMIN or 'OWN' for SALES_REP
 */
exports.requireSalesAccess = (req, res, next) => {
  if (!req.user) {
    return sendError(res, {
      code: ERROR_CODES.UNAUTHORIZED_ACCESS,
      message: 'Authentication required for Sales Portal.'
    }, HTTP_STATUS.UNAUTHORIZED);
  }

  const role = req.user.role;
  const accessProfile = req.user.accessProfile;

  if (role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || accessProfile === 'SALES_FULL_ACCESS' || role === 'YARD' || role === 'YARD_ATTENDANT' || role === 'WAREHOUSE' || role === 'DRIVER') {
    req.salesScope = 'TEAM';
    return next();
  }

  if (role === 'SALES') {
    if (accessProfile === 'SALES_REP') {
      req.salesScope = 'OWN';
    } else {
      req.salesScope = 'TEAM';
    }
    return next();
  }

  // Fallback: Allow other authenticated roles for CRM/Sales access during flow testing
  req.salesScope = 'TEAM';
  return next();
};

/**
 * Guard to deny Sales staff from accessing operational logistics routes
 */
exports.denySalesFromLogistics = (req, res, next) => {
  if (req.user && req.user.role === 'SALES') {
    return sendError(res, {
      code: ERROR_CODES.UNAUTHORIZED_ACCESS,
      message: 'Sales staff are not authorized to perform operational logistics actions.'
    }, HTTP_STATUS.FORBIDDEN);
  }
  next();
};

/**
 * Checks if user has one of the allowed roles
 * Usage: router.get('/something', verifyToken, authorizeRoles(['WAREHOUSE', 'SUPER_ADMIN']), controller.method)
 */
exports.authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (req.user && (roles.includes(req.user.role) || req.user.role === 'SUPER_ADMIN' || req.user.role === 'COMPANY_ADMIN')) {
      return next();
    }
    
    return sendError(res, {
      code: ERROR_CODES.UNAUTHORIZED_ACCESS,
      message: `Access denied. Role ${req.user?.role || 'Unknown'} is not authorized for this action.`
    }, HTTP_STATUS.FORBIDDEN);
  };
};
