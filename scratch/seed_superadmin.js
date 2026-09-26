const prisma = require('../src/utils/prismaClient');
const bcrypt = require('bcryptjs');

async function main() {
  const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (superAdmin) {
    console.log('Super Admin found:', superAdmin.email);
  } else {
    const hash = await bcrypt.hash('123456', 10);
    const created = await prisma.user.create({
      data: {
        email: 'superadmin@hero.com',
        password: hash,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    });
    console.log('Created Super Admin:', created.email, '(password: 123456)');
  }
}

main().finally(() => prisma.$disconnect());
