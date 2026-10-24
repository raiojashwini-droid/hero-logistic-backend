const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Role hierarchy — lower rank = higher authority.
// Company Admin can only edit roles with rank > their own.
const ROLE_HIERARCHY = {
  SUPER_ADMIN: 0,
  COMPANY_ADMIN: 1,
  SALES: 2,
  DISPATCHER: 3,
  DRIVER: 4,
  WAREHOUSE_MANAGER: 5,
  YARD_ATTENDANT: 6,
  ACCOUNTS: 7,
  CUSTOMER: 8,
};

// Helper to format role permissions for frontend
const formatRolePermissions = (role) => {
  if (!role) return role;
  const permObj = {};
  if (Array.isArray(role.permissions)) {
    role.permissions.forEach(p => {
      try {
        permObj[p.module] = JSON.parse(p.actionString);
      } catch (e) {
        permObj[p.module] = p.actionString;
      }
    });
  }
  return { ...role, permissions: permObj };
};

const SYSTEM_ROLE_SEEDS = [
  { name: 'Super Admin', slug: 'SUPER_ADMIN', isSystem: true, companyId: null },
  { name: 'Company Admin', slug: 'COMPANY_ADMIN', isSystem: true, companyId: null },
  { name: 'Sales', slug: 'SALES', isSystem: true, companyId: null },
  { name: 'Dispatcher', slug: 'DISPATCHER', isSystem: true, companyId: null },
  { name: 'Driver', slug: 'DRIVER', isSystem: true, companyId: null },
  { name: 'Warehouse Manager', slug: 'WAREHOUSE_MANAGER', isSystem: true, companyId: null },
  { name: 'Yard Attendant', slug: 'YARD_ATTENDANT', isSystem: true, companyId: null },
  { name: 'Accounts', slug: 'ACCOUNTS', isSystem: true, companyId: null },
  { name: 'Customer', slug: 'CUSTOMER', isSystem: true, companyId: null }
];

// Get all CustomRoles — always return the 9 system roles as source of truth.
// Company Admin sees same roles with parentPermissions and company overrides merged.
exports.getAll = async (req, res, next) => {
  try {
    // 1. Always ensure the 9 global system roles exist in DB
    let systemRoles = await prisma.customRole.findMany({
      where: { isSystem: true, companyId: null },
      include: { permissions: true },
      orderBy: { createdAt: 'asc' }
    });

    if (!systemRoles || systemRoles.length === 0) {
      for (const seed of SYSTEM_ROLE_SEEDS) {
        try {
          const existing = await prisma.customRole.findFirst({
            where: { slug: seed.slug, companyId: null }
          });
          if (!existing) {
            await prisma.customRole.create({
              data: {
                name: seed.name,
                slug: seed.slug,
                isSystem: true,
                companyId: null
              }
            });
          }
        } catch (seedErr) {
          console.warn('Seed role error:', seedErr?.message);
        }
      }
      systemRoles = await prisma.customRole.findMany({
        where: { isSystem: true, companyId: null },
        include: { permissions: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []);
    }

    // 2. Fetch company-specific roles (both system overrides and new custom roles)
    const companyId = req.tenantId || req.user?.companyId;
    let companyRoles = [];
    if (companyId) {
      companyRoles = await prisma.customRole.findMany({
        where: { companyId },
        include: { permissions: true }
      }).catch(() => []);
    }

    // Map system role overrides
    const companyOverrides = {};
    const customRolesList = [];

    companyRoles.forEach(r => {
      if (SYSTEM_ROLE_SEEDS.some(s => s.slug === r.slug)) {
        companyOverrides[r.slug] = r;
      } else {
        customRolesList.push({
          ...formatRolePermissions(r),
          isSystem: false,
          parentPermissions: {}
        });
      }
    });

    // 3. Merge system roles with company overrides
    const merged = systemRoles.map(sysRole => {
      const formattedSystem = formatRolePermissions(sysRole);
      const parentPerms = formattedSystem.permissions;
      const override = companyOverrides[sysRole.slug];

      let effectivePerms = parentPerms;
      if (override) {
        const formattedOverride = formatRolePermissions(override);
        const childPerms = formattedOverride.permissions;
        effectivePerms = {};
        Object.entries(parentPerms).forEach(([mod, pActions]) => {
          effectivePerms[mod] = {};
          if (typeof pActions === 'object' && pActions !== null) {
            Object.entries(pActions).forEach(([action, pVal]) => {
              if (pVal === false) {
                effectivePerms[mod][action] = false;
              } else {
                effectivePerms[mod][action] = childPerms[mod]?.[action] !== undefined
                  ? Boolean(childPerms[mod][action])
                  : Boolean(pVal);
              }
            });
          }
        });
      }

      return {
        ...formattedSystem,
        permissions: effectivePerms,
        parentPermissions: parentPerms
      };
    });

    if (req.query.customOnly === 'true' || req.query.type === 'custom') {
      const meta = buildPaginationMeta(customRolesList.length, 1, customRolesList.length, req.query.sort);
      return sendList(res, customRolesList, meta);
    }

    // Super Admin and Sales are platform-level SaaS roles managed exclusively by Super Admin
    let finalRoles = merged;
    if (companyId && req.user?.role !== 'SUPER_ADMIN') {
      finalRoles = merged.filter(r => r.slug !== 'SUPER_ADMIN' && r.slug !== 'SALES');
    }
    finalRoles = [...finalRoles, ...customRolesList];

    const meta = buildPaginationMeta(finalRoles.length, 1, finalRoles.length, req.query.sort);
    return sendList(res, finalRoles, meta);
  } catch (error) {
    console.warn('CustomRoleController.getAll fallback triggered:', error?.message);
    const fallbackList = SYSTEM_ROLE_SEEDS
      .filter(s => req.user?.role === 'SUPER_ADMIN' || (s.slug !== 'SUPER_ADMIN' && s.slug !== 'SALES'))
      .map(s => ({
        id: `seed_${s.slug.toLowerCase()}`,
        name: s.name,
        slug: s.slug,
        isSystem: true,
        permissions: {},
        parentPermissions: {}
      }));
    return sendList(res, fallbackList, buildPaginationMeta(fallbackList.length, 1, fallbackList.length));
  }
};

// Get single CustomRole by ID
exports.getById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const data = await prisma.customRole.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { slug: req.params.id },
          { slug: req.params.id.toUpperCase() }
        ]
      },
      include: { permissions: true }
    });
    if (!data) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Role not found' }, HTTP_STATUS.NOT_FOUND);
    }

    // Security: Non-SuperAdmin cannot query or inspect Super Admin or Sales role details
    if (!isSuperAdmin && (data.slug === 'SUPER_ADMIN' || data.slug === 'SALES')) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Role not found' }, HTTP_STATUS.NOT_FOUND);
    }

    return sendSuccess(res, formatRolePermissions(data));
  } catch (error) {
    next(error);
  }
};

// CREATE: Allows Company Admin or Super Admin to create a custom company role
exports.create = async (req, res, next) => {
  try {
    const { name, desc } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Role name is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const companyId = req.tenantId || req.user?.companyId;
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required to create role' }, HTTP_STATUS.FORBIDDEN);
    }

    const baseSlug = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const cleanSlug = `ROLE_${baseSlug}_${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const newRole = await prisma.customRole.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        isSystem: false,
        companyId: companyId || null
      },
      include: { permissions: true }
    });

    return sendSuccess(res, formatRolePermissions(newRole), HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('CustomRoleController.create error:', error);
    next(error);
  }
};

// Update permissions only — role name is always protected and cannot be changed.
// SuperAdmin: can edit any system role globally (updates companyId = null record).
// Company Admin: can only edit roles below Company Admin; cannot grant permissions Super Admin disabled.
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions, name: _ignored, slug: _ignoredSlug, isSystem: _ignoredSystem, ...rest } = req.body;

    let existing = await prisma.customRole.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
          { slug: id.toUpperCase() },
          { slug: id.replace(/^role-/, '').replace(/-/g, '_').toUpperCase() },
          { name: id }
        ]
      },
      include: { permissions: true }
    });
    if (!existing) {
      const matchSeed = SYSTEM_ROLE_SEEDS.find(s => 
        s.slug === id.toUpperCase() || 
        s.slug === id.replace(/^role-/, '').replace(/-/g, '_').toUpperCase() || 
        s.name.toLowerCase() === id.toLowerCase() ||
        `role-${s.slug.toLowerCase().replace(/_/g, '-')}` === id.toLowerCase()
      );
      if (matchSeed) {
        existing = await prisma.customRole.upsert({
          where: { slug: matchSeed.slug },
          update: {},
          create: matchSeed,
          include: { permissions: true }
        }).catch(() => null);
      }
    }
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Role not found' }, HTTP_STATUS.NOT_FOUND);
    }
    const targetRealId = existing.id;

    // Strict Backend Security & Hierarchy Check
    const callerRole = req.user?.role;
    const isSuperAdmin = callerRole === 'SUPER_ADMIN';

    // If caller is NOT Super Admin, enforce ironclad protections:
    if (!isSuperAdmin) {
      // 1. Absolutely prevent touching Super Admin
      if (existing.slug === 'SUPER_ADMIN') {
        return sendError(res, {
          code: 'FORBIDDEN',
          message: 'Security Violation: Super Admin platform permissions are strictly protected and cannot be modified by any tenant or Company Admin user.'
        }, 403);
      }

      // 2. Absolutely prevent touching Sales (Platform SaaS role)
      if (existing.slug === 'SALES') {
        return sendError(res, {
          code: 'FORBIDDEN',
          message: 'Security Violation: Sales is a platform-level SaaS role managed exclusively by Platform Super Admin.'
        }, 403);
      }

      // 3. Prevent modifying Company Admin master permissions
      if (existing.slug === 'COMPANY_ADMIN') {
        return sendError(res, {
          code: 'FORBIDDEN',
          message: 'Security Violation: Company Admin master permissions are locked and cannot be modified.'
        }, 403);
      }

      // 4. Role Hierarchy rank validation
      const callerRank = ROLE_HIERARCHY[callerRole] ?? 1;
      const targetRank = ROLE_HIERARCHY[existing.slug] ?? 99;
      if (targetRank <= callerRank) {
        return sendError(res, {
          code: 'FORBIDDEN',
          message: `Security Violation: You can only edit roles below your own level. "${existing.name}" has equal or higher authority.`
        }, 403);
      }
    }

    // Fetch the master system role to enforce parent constraints
    const masterRole = await prisma.customRole.findFirst({
      where: { slug: existing.slug, companyId: null, isSystem: true },
      include: { permissions: true }
    });
    const masterFormatted = formatRolePermissions(masterRole);
    const parentPerms = masterFormatted?.permissions || {};

    // Sanitize permissions for Company Admin (cannot enable what Super Admin disabled)
    let sanitizedPerms = permissions;
    if (!isSuperAdmin && permissions && typeof permissions === 'object') {
      sanitizedPerms = {};
      Object.entries(permissions).forEach(([mod, actions]) => {
        sanitizedPerms[mod] = {};
        if (typeof actions === 'object' && actions !== null) {
          Object.entries(actions).forEach(([action, val]) => {
            const isParentEnabled = parentPerms[mod]?.[action] !== false;
            // If parent disabled, force child to false; else respect child setting
            sanitizedPerms[mod][action] = isParentEnabled ? Boolean(val) : false;
          });
        }
      });
    }

    // Determine target record
    let targetId = targetRealId;
    if (existing.isSystem && req.tenantId && !isSuperAdmin) {
      let override = await prisma.customRole.findFirst({
        where: { slug: existing.slug, companyId: req.tenantId }
      });
      if (!override) {
        override = await prisma.customRole.create({
          data: {
            name: existing.name,
            slug: existing.slug,
            isSystem: false,
            companyId: req.tenantId
          }
        });
      }
      targetId = override.id;
    }

    // Save permissions
    if (sanitizedPerms && typeof sanitizedPerms === 'object') {
      await prisma.customPermission.deleteMany({ where: { roleId: targetId } });
      const permInserts = Object.entries(sanitizedPerms).map(([module, actions]) =>
        prisma.customPermission.create({
          data: { roleId: targetId, module, actionString: JSON.stringify(actions) }
        })
      );
      await Promise.all(permInserts);
    }

    const updated = await prisma.customRole.findFirst({
      where: { id: targetId },
      include: { permissions: true }
    });
    return sendSuccess(res, {
      ...formatRolePermissions(updated),
      parentPermissions: parentPerms
    });
  } catch (error) {
    next(error);
  }
};


// DELETE — blocked for system roles; allowed for company-level custom roles and overrides
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.tenantId || req.user?.companyId;
    const existing = await prisma.customRole.findFirst({
      where: {
        id,
        ...(companyId && req.user?.role !== 'SUPER_ADMIN' ? { companyId } : {})
      }
    });
    if (!existing) return res.status(HTTP_STATUS.NO_CONTENT).send();

    if (existing.isSystem) {
      return sendError(res, {
        code: 'FORBIDDEN',
        message: 'System roles cannot be deleted. They are fixed platform roles.'
      }, 403);
    }

    await prisma.customPermission.deleteMany({ where: { roleId: id } });
    await prisma.customRole.delete({ where: { id } });
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    if (error.code === 'P2025') return res.status(HTTP_STATUS.NO_CONTENT).send();
    next(error);
  }
};

