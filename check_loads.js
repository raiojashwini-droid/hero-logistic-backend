require('dotenv').config();
const prisma = require('./src/utils/prismaClient');

async function run() {
  try {
    const loads = await prisma.load.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: { driver: true }
    });
    console.log(JSON.stringify(loads.map(l => ({ id: l.id, status: l.status, ref: l.loadRef, driverId: l.driverId, driverName: l.driver?.firstName, companyId: l.companyId })), null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
