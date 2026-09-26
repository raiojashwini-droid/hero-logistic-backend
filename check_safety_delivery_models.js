const prisma = require('./src/utils/prismaClient');

async function test() {
  console.log('Testing prisma models...');
  try {
    const checklistCount = await prisma.preStartChecklist.count();
    console.log('preStartChecklist count:', checklistCount);
  } catch (e) {
    console.error('preStartChecklist error:', e.message);
  }

  try {
    const podCount = await prisma.deliveryPOD.count();
    console.log('deliveryPOD count:', podCount);
  } catch (e) {
    console.error('deliveryPOD error:', e.message);
  }

  try {
    const vinCount = await prisma.vinScanEvent.count();
    console.log('vinScanEvent count:', vinCount);
  } catch (e) {
    console.error('vinScanEvent error:', e.message);
  }
}

test().finally(() => prisma.$disconnect());
