const prisma = require('./src/utils/prismaClient');

async function cleanDummyData() {
  try {
    console.log('Starting dummy data cleanup...');
    
    await prisma.itemMovement.deleteMany({});
    console.log('Deleted itemMovement');

    await prisma.loadItem.deleteMany({});
    console.log('Deleted loadItem');

    await prisma.routeStop.deleteMany({});
    await prisma.loadActivity.deleteMany({});
    await prisma.loadExpense.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.vinScanEvent.deleteMany({});
    await prisma.deliveryPOD.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.preStartChecklist.deleteMany({});
    console.log('Deleted load dependencies');

    await prisma.load.deleteMany({});
    console.log('Deleted loads');

    await prisma.loadLane.deleteMany({});
    console.log('Deleted load lanes');

    console.log('Dummy data cleaned successfully!');
  } catch (error) {
    console.error('Error cleaning dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDummyData();
