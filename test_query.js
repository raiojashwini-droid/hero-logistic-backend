const prisma = require('./src/utils/prismaClient');

async function testQuery() {
  try {
    const stops = await prisma.routeStop.findMany({
      select: { id: true, loadId: true, type: true, sequenceIndex: true, address: true, contactName: true }
    });
    console.log('All RouteStops in DB:', JSON.stringify(stops, null, 2));
  } catch (e) {
    console.error('Query failed error:', e);
  }
  await prisma.$disconnect();
}

testQuery();
