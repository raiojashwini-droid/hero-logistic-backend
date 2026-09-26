const prisma = require('./src/utils/prismaClient');

async function setupPhase12Data() {
  console.log('────────────────────────────────────────────────────────────');
  console.log('SETUP PHASE 12: DRIVER PRE-START SAFETY CHECKLIST TEST DATA');
  console.log('────────────────────────────────────────────────────────────\n');

  try {
    const user1 = await prisma.user.findUnique({ where: { email: 'driver@hero.com' } });
    const user2 = await prisma.user.findUnique({ where: { email: 'driver2@hero.com' } });

    if (!user1 || !user2) {
      console.error('❌ Required test users driver@hero.com and driver2@hero.com not found.');
      process.exit(1);
    }

    const d1 = await prisma.driver.findUnique({ where: { userId: user1.id } });
    const d2 = await prisma.driver.findUnique({ where: { userId: user2.id } });

    if (!d1 || !d2) {
      console.error('❌ Required driver profiles for user accounts not found.');
      process.exit(1);
    }

    console.log(`  Driver A: ${d1.firstName} ${d1.lastName} (ID: ${d1.id}, Company: ${d1.companyId})`);
    console.log(`  Driver B: ${d2.firstName} ${d2.lastName} (ID: ${d2.id}, Company: ${d2.companyId})\n`);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Setup seed checklist for Driver A
    let chkA = await prisma.preStartChecklist.findFirst({
      where: { driverId: d1.id, date: { gte: todayStart } }
    });

    if (!chkA) {
      chkA = await prisma.preStartChecklist.create({
        data: {
          driverId: d1.id,
          companyId: d1.companyId,
          date: new Date(),
          vehicleRef: 'TRK-101 (MAN TGX 26.580)',
          trailerRef: 'TRL-205 (Car Carrier)',
          totalItems: 20,
          passedCount: 18,
          failedCount: 0,
          naCount: 1,
          isDraft: false,
          notes: 'All pre-start checks clear.',
          submittedAt: new Date(),
          items: {
            create: [
              { itemNumber: 1, itemLabel: 'Brakes (service & park brake)', status: 'PASS' },
              { itemNumber: 2, itemLabel: 'Tyres – condition & pressure', status: 'PASS' },
              { itemNumber: 19, itemLabel: 'Load secured / Straps & chains checked', status: 'NA' }
            ]
          }
        }
      });
      console.log('  ✅ Created initial pre-start checklist for Driver A');
    } else {
      console.log(`  ℹ️ Driver A already has today's checklist record (ID: ${chkA.id}).`);
    }

    // Setup seed checklist for Driver B
    let chkB = await prisma.preStartChecklist.findFirst({
      where: { driverId: d2.id, date: { gte: todayStart } }
    });

    if (!chkB) {
      chkB = await prisma.preStartChecklist.create({
        data: {
          driverId: d2.id,
          companyId: d2.companyId,
          date: new Date(),
          vehicleRef: 'TRK-202 (Kenworth K200)',
          trailerRef: 'TRL-99B (Flatbed)',
          totalItems: 20,
          passedCount: 17,
          failedCount: 1,
          naCount: 2,
          isDraft: false,
          notes: 'Low washer fluid detected & refilled.',
          submittedAt: new Date(),
          items: {
            create: [
              { itemNumber: 1, itemLabel: 'Brakes (service & park brake)', status: 'PASS' },
              { itemNumber: 7, itemLabel: 'Wipers / Washer', status: 'FAIL', notes: 'Washer fluid reservoir empty' }
            ]
          }
        }
      });
      console.log('  ✅ Created initial pre-start checklist for Driver B');
    } else {
      console.log(`  ℹ️ Driver B already has today's checklist record (ID: ${chkB.id}).`);
    }

    console.log('\n✅ Phase 12 setup complete!\n');
    return { chkA, chkB };
  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupPhase12Data();
}

module.exports = setupPhase12Data;
