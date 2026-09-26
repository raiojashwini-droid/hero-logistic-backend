const bcrypt = require('bcryptjs');
const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const PLATFORM_ROLES = [
  'SUPER_ADMIN', 'PLATFORM_OWNER', 'PLATFORM_ADMIN', 'SALES',
  'ONBOARDING', 'SUPPORT_AGENT', 'PLATFORM_FINANCE', 'TECHNICAL_SUPPORT', 'AUDITOR'
];

const TENANT_ROLES = [
  'COMPANY_ADMIN', 'DISPATCHER', 'DRIVER', 'WAREHOUSE', 'YARD', 'ACCOUNTS', 'CUSTOMER', 'USER'
];

const getEffectiveCompanyId = (req) => {
  return req.tenantId || req.user?.companyId || req.user?.tenantId || null;
};

// Helper to map UI role string to DB Role enum
const mapRoleEnum = (roleStr) => {
  if (!roleStr) return 'COMPANY_ADMIN';
  const rUpper = String(roleStr).toUpperCase().trim().replace(/\s+/g, '_');
  const validRoles = [
    'SUPER_ADMIN', 'PLATFORM_OWNER', 'PLATFORM_ADMIN', 'SALES',
    'ONBOARDING', 'SUPPORT_AGENT', 'PLATFORM_FINANCE', 'TECHNICAL_SUPPORT', 'AUDITOR',
    'COMPANY_ADMIN', 'DISPATCHER', 'DRIVER', 'WAREHOUSE', 'YARD', 'ACCOUNTS', 'CUSTOMER', 'USER'
  ];
  if (validRoles.includes(rUpper)) return rUpper;
  if (rUpper === 'ADMIN') return 'COMPANY_ADMIN';
  if (rUpper === 'DISPATCH_MANAGER') return 'DISPATCHER';
  if (rUpper === 'WAREHOUSE_MANAGER') return 'WAREHOUSE';
  if (rUpper === 'CUSTOMER_USER') return 'CUSTOMER';
  return 'COMPANY_ADMIN';
};

// Helper to map UI status string to DB UserStatus enum
const mapStatusEnum = (statusStr) => {
  if (!statusStr) return 'ACTIVE';
  const sUpper = String(statusStr).toUpperCase().trim();
  if (sUpper === 'ACTIVE') return 'ACTIVE';
  if (sUpper === 'INACTIVE' || sUpper === 'SUSPENDED') return 'SUSPENDED';
  if (sUpper === 'PENDING') return 'PENDING';
  return 'ACTIVE';
};

// Get all Users with pagination, sorting and filtering
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

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take, orderBy,
        include: {
          company: { select: { id: true, name: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single User by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    const data = await prisma.user.findFirst({ where });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'User not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new User
exports.create = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, status, passwordSetupType } = req.body;
    const effectiveCompanyId = getEffectiveCompanyId(req);

    if (!email) {
      return sendError(res, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Email address is required'
      }, HTTP_STATUS.BAD_REQUEST);
    }

    const roleEnum = mapRoleEnum(role);
    const statusEnum = mapStatusEnum(status);
    const rawPassword = (passwordSetupType === 'EMAIL_LINK' || !password)
      ? `HeroSetup_${Date.now().toString(36)}!${Math.floor(Math.random() * 1000)}`
      : password;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    let companyId = req.body.companyId;

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (PLATFORM_ROLES.includes(roleEnum)) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'You cannot create platform staff users.'
        }, HTTP_STATUS.FORBIDDEN);
      }
      if (!effectiveCompanyId) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Company context is required to create tenant users.'
        }, HTTP_STATUS.FORBIDDEN);
      }
      companyId = effectiveCompanyId;
    } else {
      if (PLATFORM_ROLES.includes(roleEnum)) {
        companyId = null;
      } else {
        companyId = req.body.companyId || effectiveCompanyId;
      }
    }

    const userCode = `US-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const data = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name ? name.trim() : 'New System User',
        password: hashedPassword,
        role: roleEnum,
        phone: phone ? phone.trim() : null,
        status: statusEnum,
        userCode,
        companyId: companyId || null
      },
      include: {
        company: { select: { id: true, name: true } }
      }
    });

    if (data && data.password) {
      delete data.password;
    }

    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    if (error.code === 'P2002') {
      return sendError(res, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'A user with this email address already exists.'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    next(error);
  }
};

// Update User
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, phone, status, companyId, dob, address, emergencyContact } = req.body;
    const effectiveCompanyId = getEffectiveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!effectiveCompanyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }, HTTP_STATUS.NOT_FOUND);
      }
      const existingUser = await prisma.user.findFirst({
        where: { id, companyId: effectiveCompanyId }
      });
      if (!existingUser) {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found in this company context'
        }, HTTP_STATUS.NOT_FOUND);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (status !== undefined) updateData.status = mapStatusEnum(status);
    
    let roleEnum = undefined;
    if (role !== undefined) {
      roleEnum = mapRoleEnum(role);
      if (req.user?.role !== 'SUPER_ADMIN' && PLATFORM_ROLES.includes(roleEnum)) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'You cannot assign platform staff roles.'
        }, HTTP_STATUS.FORBIDDEN);
      }
      updateData.role = roleEnum;
    }

    if (roleEnum !== undefined || companyId !== undefined) {
      let currentRole = roleEnum;
      if (!currentRole) {
        const userRec = await prisma.user.findUnique({ where: { id } });
        currentRole = userRec?.role;
      }
      
      if (PLATFORM_ROLES.includes(currentRole)) {
        updateData.companyId = null;
      } else {
        if (req.user?.role !== 'SUPER_ADMIN') {
          updateData.companyId = effectiveCompanyId;
        } else if (companyId !== undefined) {
          updateData.companyId = companyId || null;
        }
      }
    }

    if (dob !== undefined) updateData.dob = dob ? dob.trim() : null;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact ? emergencyContact.trim() : null;

    if (password && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    try {
      const data = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          company: { select: { id: true, name: true } }
        }
      });
      return sendSuccess(res, data);
    } catch (e) {
      if (e.code === 'P2025') {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      if (e.code === 'P2002') {
        return sendError(res, {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'A user with this email address already exists.'
        }, HTTP_STATUS.BAD_REQUEST);
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
};

// Get Profile of logged-in user
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Unauthorized' }, HTTP_STATUS.UNAUTHORIZED);
    }
    const data = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        customRole: { select: { id: true, name: true, permissions: true } }
      }
    });
    if (!data) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Profile not found' }, HTTP_STATUS.NOT_FOUND);
    }
    delete data.password;
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Update Profile of logged-in user
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Unauthorized' }, HTTP_STATUS.UNAUTHORIZED);
    }
    const { name, phone, dob, address, emergencyContact, email, currentPassword, newPassword } = req.body;

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'User profile not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (dob !== undefined) updateData.dob = dob ? dob.trim() : null;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact ? emergencyContact.trim() : null;
    if (email && email.trim().toLowerCase() !== currentUser.email) {
      updateData.email = email.trim().toLowerCase();
    }

    if (newPassword && newPassword.trim().length > 0) {
      if (currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isMatch) {
          return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Current password is incorrect' }, HTTP_STATUS.BAD_REQUEST);
        }
      }
      updateData.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        company: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        customRole: { select: { id: true, name: true, permissions: true } }
      }
    });

    delete updatedUser.password;
    return sendSuccess(res, updatedUser);
  } catch (error) {
    if (error.code === 'P2002') {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Email address is already in use.' }, HTTP_STATUS.BAD_REQUEST);
    }
    next(error);
  }
};

// Delete User
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const effectiveCompanyId = getEffectiveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!effectiveCompanyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      const existingUser = await prisma.user.findFirst({
        where: { id, companyId: effectiveCompanyId }
      });
      if (!existingUser) {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found in this company context'
        }, HTTP_STATUS.NOT_FOUND);
      }
    }

    await prisma.userSession.deleteMany({ where: { userId: id } });
    await prisma.shift.deleteMany({ where: { userId: id } });
    await prisma.driver.updateMany({ where: { userId: id }, data: { userId: null } });

    await prisma.user.delete({ where: { id } });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2003') {
      return sendError(res, {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Cannot delete user because they have associated records. Please suspend the user instead.'
      }, HTTP_STATUS.BAD_REQUEST);
    }
    if (error.code === 'P2025') {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'User not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    next(error);
  }
};
