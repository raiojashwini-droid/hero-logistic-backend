const bcrypt = require('bcryptjs');
const prisma = require('./src/utils/prismaClient');

async function main() {
  const password = await bcrypt.hash('123456', 10);
  
  const roles = [
    { email: 'kiandemo@gmail.com', role: 'SUPER_ADMIN' },
    { email: 'super-admin@hero.com', role: 'SUPER_ADMIN' },
    { email: 'superadmin@hero.com', role: 'SUPER_ADMIN' },
    { email: 'admin@hero.com', role: 'SUPER_ADMIN' },
    { email: 'company-admin@hero.com', role: 'COMPANY_ADMIN' },
    { email: 'sales@hero.com', role: 'SALES' },
    { email: 'dispatcher@hero.com', role: 'DISPATCHER' },
    { email: 'driver@hero.com', role: 'DRIVER' },
    { email: 'warehouse@hero.com', role: 'WAREHOUSE' },
    { email: 'demodrive11@gmail.com', role: 'DRIVER', name: 'Demo Drive11' },
    { email: 'accounts@hero.com', role: 'ACCOUNTS' },
    { email: 'customer@hero.com', role: 'CUSTOMER' }
  ];

  for (const r of roles) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: { password, role: r.role, status: 'ACTIVE' },
      create: {
        email: r.email,
        password,
        role: r.role,
        name: r.role + ' Demo',
        status: 'ACTIVE'
      }
    });
    console.log('Upserted user:', r.email);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
