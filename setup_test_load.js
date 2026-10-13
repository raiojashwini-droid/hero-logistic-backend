const prisma = require('./src/utils/prismaClient');

async function main() {
  // Find driver record for driver@hero.com
  const user = await prisma.user.findFirst({ 
    where: { email: 'driver@hero.com' }, 
    include: { driverProfile: true } 
  });
  console.log('User:', user?.name, '| Driver ID:', user?.driverProfile?.id, '| CompanyId:', user?.companyId);

  // Find any load for this company
  const load = await prisma.load.findFirst({
    where: { companyId: user?.companyId },
    include: { items: { take: 3 }, billedCustomers: { take: 3 } },
    orderBy: { createdAt: 'desc' }
  });

  if (!load) {
    console.log('NO LOADS FOUND for this company');
    await prisma.$disconnect();
    return;
  }

  console.log('Latest load:', load.id, '| ref:', load.loadRef || load.loadNumber, '| status:', load.status, '| driverId:', load.driverId);
  console.log('Items count:', load.items.length, '| billedCustomers:', load.billedCustomers.length);
  load.items.slice(0, 3).forEach((item, i) => {
    console.log(`  Item ${i+1}: id=${item.id} | vin=${item.vin} | status=${item.status} | customerId=${item.customerId}`);
  });

  // Assign this load to the driver if not already assigned
  const driverId = user?.driverProfile?.id;
  if (load.driverId !== driverId) {
    const updated = await prisma.load.update({ 
      where: { id: load.id }, 
      data: { driverId, status: 'ASSIGNED' } 
    });
    console.log('\nASSIGNED load', load.id, 'to driver', driverId, '-> status:', updated.status);
  } else {
    console.log('\nLoad already assigned to this driver');
  }

  console.log('\nRun test again now!');
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
