const prisma = require('./src/utils/prismaClient');

async function inspectLoads() {
  const loads = await prisma.load.findMany({
    select: {
      id: true,
      loadRef: true,
      type: true,
      status: true,
      driverId: true,
      companyId: true,
      driver: {
        select: { firstName: true, lastName: true }
      },
      stops: {
        select: { id: true, type: true, sequenceIndex: true, address: true, contactName: true }
      }
    }
  });

  console.log('\n=== DB LOADS ===');
  console.log(JSON.stringify(loads, null, 2));

  await prisma.$disconnect();
}

inspectLoads().catch(console.error);
