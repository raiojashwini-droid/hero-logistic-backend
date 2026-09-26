const prisma = require('../src/utils/prismaClient');

async function main() {
  const companies = await prisma.company.findMany({ select: { id: true, name: true, tenantId: true } });
  console.log('Local DB company count:', companies.length);
  companies.forEach(c => console.log(c.name, c.tenantId));
}

main().finally(() => prisma.$disconnect());
