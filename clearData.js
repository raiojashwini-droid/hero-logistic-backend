const prisma = require('./src/utils/prismaClient');

async function main() {
  console.log('Clearing transactional data...');
  try {
    await prisma.loadActivity.deleteMany();
    await prisma.loadExpense.deleteMany();
    await prisma.proofPhoto.deleteMany();
    await prisma.loadItem.deleteMany();
    await prisma.routeStop.deleteMany();
    await prisma.load.deleteMany();
    await prisma.timesheetEvent.deleteMany();
    await prisma.timesheet.deleteMany();
    await prisma.checklistItemResponse.deleteMany();
    await prisma.preStartChecklist.deleteMany();
    await prisma.message.deleteMany();
    console.log('Successfully deleted all transactional data from DB.');
  } catch (err) {
    console.error('Error clearing data:', err);
  }
}

main().finally(() => prisma.$disconnect());
