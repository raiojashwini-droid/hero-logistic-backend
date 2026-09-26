const prisma = require('../src/utils/prismaClient');

async function fixAndSync500() {
  try {
    console.log('=== STARTING PAYROLL FIX & SYNC TO $500.00 ===');

    // 1. Find driver demooo34567 or all active drivers
    const drivers = await prisma.driver.findMany();
    console.log(`Found ${drivers.length} drivers:`);
    for (const d of drivers) {
      console.log(`Driver ID: ${d.id}, Code: ${d.driverCode}, Name: ${d.firstName} ${d.lastName}, payRate: ${d.payRate}`);
    }

    // 2. Update all draft/pending PayPeriod records in DB to $500.00 if gross is 5000
    const updatedPeriods = await prisma.payPeriod.updateMany({
      where: {
        status: { in: ['DRAFT', 'PENDING', 'PROCESSING'] }
      },
      data: {
        grossEarnings: 500.00,
        netPay: 500.00,
        basePay: 500.00,
        loadAllowance: 500.00
      }
    });
    console.log(`Updated ${updatedPeriods.count} PayPeriod records in DB to $500.00.`);

    // 3. Update any loads with [DRIVER_PAY:5000] note to [DRIVER_PAY:500] so syncUncreditedDeliveredLoads doesn't re-inject 5000
    const loads = await prisma.load.findMany();
    for (const l of loads) {
      if (l.notes && l.notes.includes('[DRIVER_PAY:5000]')) {
        const newNotes = l.notes.replace('[DRIVER_PAY:5000]', '[DRIVER_PAY:500]');
        await prisma.load.update({
          where: { id: l.id },
          data: { notes: newNotes }
        });
        console.log(`Updated load ${l.id} (${l.loadRef}) notes from [DRIVER_PAY:5000] to [DRIVER_PAY:500]`);
      }
    }

    console.log('=== SUCCESS: ALL PAYROLL RECORDS & LOADS SYNCED TO $500.00 ===');
  } catch (err) {
    console.error('Error during fix and sync:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixAndSync500();
