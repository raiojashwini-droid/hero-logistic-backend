const prisma = require('./src/utils/prismaClient');

async function inspectDb() {
  // 1. All users with DRIVER role
  const driverUsers = await prisma.user.findMany({
    where: { role: 'DRIVER' },
    select: { id: true, email: true, name: true, role: true, status: true, companyId: true },
    take: 10
  });
  console.log('\n=== USERS WITH ROLE=DRIVER ===');
  console.log(JSON.stringify(driverUsers, null, 2));

  // 2. All Driver records and whether they have a userId set
  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      userId: true,
      companyId: true
    },
    take: 10
  });
  console.log('\n=== DRIVER RECORDS ===');
  console.log(JSON.stringify(drivers, null, 2));

  // 3. Driver records that DO have userId set (linked to a user)
  const linkedDrivers = await prisma.driver.findMany({
    where: { userId: { not: null } },
    select: { id: true, firstName: true, lastName: true, userId: true }
  });
  console.log('\n=== DRIVERS LINKED TO A USER (userId != null) ===');
  console.log(JSON.stringify(linkedDrivers, null, 2));

  // 4. Companies
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    take: 5
  });
  console.log('\n=== COMPANIES ===');
  console.log(JSON.stringify(companies, null, 2));

  await prisma.$disconnect();
}

inspectDb().catch(e => {
  console.error('DB inspect failed:', e.message);
  process.exit(1);
});
