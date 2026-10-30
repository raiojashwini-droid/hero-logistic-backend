const bcrypt = require('bcryptjs');
const prisma = require('./prismaClient');

const demoUsers = [
  { email: 'super-admin@hero.com', role: 'SUPER_ADMIN', name: 'Super Admin', isSuper: true },
  { email: 'company-admin@hero.com', role: 'COMPANY_ADMIN', name: 'Company Admin' },
  { email: 'sales@hero.com', role: 'SALES', name: 'Sales Representative' },
  { email: 'dispatcher@hero.com', role: 'DISPATCHER', name: 'Operations Dispatcher' },
  { email: 'driver@hero.com', role: 'DRIVER', name: 'Alex Vance (Driver)' },
  { email: 'warehouse@hero.com', role: 'WAREHOUSE', name: 'Warehouse Manager' },
  { email: 'yard@hero.com', role: 'YARD', name: 'Yard Attendant' },
  { email: 'accounts@hero.com', role: 'ACCOUNTS', name: 'Accounts Manager' },
  { email: 'customer@hero.com', role: 'CUSTOMER', name: 'Enterprise Client' }
];

async function ensureDemoUsers() {
  try {
    if (!prisma || !prisma.user) return;

    // 1. Find or create default active company
    let primaryCompany = await prisma.company.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' }
    }).catch(() => null);

    if (!primaryCompany) {
      primaryCompany = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' }
      }).catch(() => null);
    }

    if (!primaryCompany) {
      primaryCompany = await prisma.company.create({
        data: {
          name: 'Hero Logistics Enterprise',
          status: 'ACTIVE',
          defaultNiche: 'General Freight'
        }
      }).catch(() => null);
    }

    const hashedPassword = await bcrypt.hash('123456', 10);

    for (const item of demoUsers) {
      try {
        const existing = await prisma.user.findFirst({
          where: { email: item.email }
        });

        const targetCompanyId = item.isSuper ? null : primaryCompany?.id;

        if (existing) {
          const isMatch = await bcrypt.compare('123456', existing.password).catch(() => false);
          if (!isMatch || existing.status !== 'ACTIVE' || (!item.isSuper && !existing.companyId)) {
            await prisma.user.update({
              where: { id: existing.id },
              data: {
                password: hashedPassword,
                role: item.role,
                status: 'ACTIVE',
                name: existing.name || item.name,
                companyId: existing.companyId || targetCompanyId
              }
            });
          }
        } else {
          const created = await prisma.user.create({
            data: {
              email: item.email,
              password: hashedPassword,
              role: item.role,
              name: item.name,
              status: 'ACTIVE',
              companyId: targetCompanyId
            }
          });

          if (item.role === 'DRIVER' && primaryCompany) {
            await prisma.driver.create({
              data: {
                userId: created.id,
                companyId: primaryCompany.id,
                driverCode: 'DRV-HERO-01',
                status: 'AVAILABLE',
                licenseType: 'HC',
                licenseNumber: 'LIC-HERO-01',
                payType: 'Hourly',
                payRate: 35.00
              }
            }).catch(() => null);
          }
        }

        // Ensure Driver record exists for driver role
        if (item.role === 'DRIVER' && primaryCompany) {
          const u = await prisma.user.findFirst({ where: { email: item.email } });
          if (u) {
            const d = await prisma.driver.findFirst({ where: { userId: u.id } });
            if (!d) {
              await prisma.driver.create({
                data: {
                  userId: u.id,
                  companyId: primaryCompany.id,
                  driverCode: 'DRV-HERO-01',
                  status: 'AVAILABLE',
                  licenseType: 'HC',
                  licenseNumber: 'LIC-HERO-01',
                  payType: 'Hourly',
                  payRate: 35.00
                }
              }).catch(() => null);
            }
          }
        }
      } catch (err) {
        console.warn(`[ensureDemoUsers] error processing ${item.email}:`, err.message);
      }
    }
    console.log('✓ [ensureDemoUsers] All 9 portal demo users synchronized successfully.');
  } catch (globalErr) {
    console.warn('[ensureDemoUsers] General error:', globalErr.message);
  }
}

module.exports = ensureDemoUsers;
