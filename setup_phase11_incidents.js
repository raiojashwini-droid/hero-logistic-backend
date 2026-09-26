const prisma = require('./src/utils/prismaClient');

async function setupPhase11Data() {
  console.log('────────────────────────────────────────────────────────────');
  console.log('SETUP PHASE 11: DRIVER INCIDENTS & EMERGENCY SOS TEST DATA');
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

    // Setup seed incident for Driver A
    const countA = await prisma.driverIncident.count({ where: { driverId: d1.id } });
    if (countA === 0) {
      await prisma.driverIncident.create({
        data: {
          driverId: d1.id,
          companyId: d1.companyId,
          incidentType: 'INCIDENT',
          category: 'Cargo Damage Exception',
          description: 'Minor strap tension scratch on rear car bumper during transit.',
          status: 'UNDER_REVIEW',
          gpsLat: -33.8688,
          gpsLng: 151.2093
        }
      });
      console.log('  ✅ Created initial test incident for Driver A');
    } else {
      console.log(`  ℹ️ Driver A already has ${countA} incident record(s).`);
    }

    // Setup seed incident for Driver B
    const countB = await prisma.driverIncident.count({ where: { driverId: d2.id } });
    if (countB === 0) {
      await prisma.driverIncident.create({
        data: {
          driverId: d2.id,
          companyId: d2.companyId,
          incidentType: 'SOS',
          category: 'HIGHWAY_ACCIDENT',
          description: 'BLOWN TYRE ON HUME HWY SOUTHBOUND. VEHICLE PULLED SAFELY ONTO HARD SHOULDER.',
          status: 'UNDER_REVIEW',
          isSos: true,
          gpsLat: -37.8136,
          gpsLng: 144.9631
        }
      });
      console.log('  ✅ Created initial test incident for Driver B');
    } else {
      console.log(`  ℹ️ Driver B already has ${countB} incident record(s).`);
    }

    console.log('\n✅ Phase 11 setup complete!\n');
  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupPhase11Data();
