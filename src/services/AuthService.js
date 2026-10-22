const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');

const SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const REFRESH_EXPIRES_IN = '7d';

class AuthService {
  async login(email, password, ipAddress, userAgent) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      throw {
        code: 'INVALID_CREDENTIALS',
        message: 'Email and password are required',
        statusCode: 400
      };
    }

    // 1. Strict Database Lookup - user must exist in the database
    let user = null;
    try {
      if (prisma && prisma.user) {
        user = await prisma.user.findFirst({
          where: { email: cleanEmail },
          include: {
            company: true,
            customRole: true,
            driverProfile: {
              include: { currentVehicle: true }
            }
          }
        });
      }
    } catch (dbErr) {
      console.warn('DB lookup error during login:', dbErr.message);
      throw {
        code: 'DATABASE_ERROR',
        message: 'Authentication service temporarily unavailable. Please try again.',
        statusCode: 500
      };
    }

    // If user is NOT registered in database -> Reject immediately (No auto-create, no heuristic fallback!)
    if (!user) {
      throw {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: 401
      };
    }

    // 2. Check account status
    if (user.status && user.status !== 'ACTIVE') {
      throw {
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account is suspended or inactive. Please contact your administrator.',
        statusCode: 403
      };
    }

    // 3. Strict Password Verification (bcrypt.compare only - no overwriting, no bypass)
    if (!user.password) {
      throw {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: 401
      };
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password).catch(() => false);
    if (!isMatch) {
      throw {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: 401
      };
    }

    // 4. Role is taken strictly from database record (user.role)
    let customRole = user.customRole;
    let driverProfile = user.driverProfile;

    try {
      if (!customRole && user.customRoleId && prisma.customRole) {
        customRole = await prisma.customRole.findUnique({ where: { id: user.customRoleId } }).catch(() => null);
      }
      if (user.role === 'DRIVER' && !driverProfile && prisma.driver) {
        driverProfile = await prisma.driver.findFirst({
          where: { OR: [{ userId: user.id }, { email: cleanEmail }] },
          include: { currentVehicle: true }
        }).catch(() => null);
      }
    } catch (e) {}

    user.customRole = customRole;
    user.driverProfile = driverProfile;

    // 5. Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.companyId, companyId: user.companyId },
      SECRET,
      { expiresIn: EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, version: 1 },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN }
    );

    // 6. Track Session & Last Login safely
    try {
      if (prisma.userSession && user.id && typeof user.id === 'string' && !user.id.startsWith('usr-')) {
        await prisma.userSession.create({
          data: {
            userId: user.id,
            tokenHash: refreshToken,
            ipAddress,
            userAgent,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }).catch(() => {});
      }
      if (user.companyId && prisma.company && typeof user.companyId === 'string' && !user.companyId.startsWith('demo-')) {
        await prisma.company.update({
          where: { id: user.companyId },
          data: { lastLogin: new Date() }
        }).catch(() => {});
      }
    } catch (e) {}

    // 7. Resolve permissions safely
    const roleSlug = user.customRole?.slug || user.role;
    let masterPerms = {};
    if (roleSlug) {
      try {
        const masterRole = await prisma.customRole.findFirst({
          where: { OR: [{ slug: roleSlug }, { name: roleSlug }], companyId: null, isSystem: true },
          include: { permissions: true }
        }).catch(() => null);
        if (masterRole?.permissions) {
          masterRole.permissions.forEach(p => {
            try { masterPerms[p.module] = JSON.parse(p.actionString); }
            catch (e) { masterPerms[p.module] = p.actionString; }
          });
        }
      } catch (err) {}
    }

    user.permissions = masterPerms;

    return { user, accessToken, refreshToken };
  }

  async logout(refreshToken) {
    if (!refreshToken || !prisma.userSession) return;
    await prisma.userSession.deleteMany({
      where: { tokenHash: refreshToken }
    }).catch(() => {});
  }
}

module.exports = new AuthService();
