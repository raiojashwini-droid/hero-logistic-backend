/**
 * Phase 9 Trailer Test Setup Script
 * Ensures Driver A (Noah Williams) and Driver B (Liam Smith) have valid trailers assigned and available replacement trailers.
 */

const prisma = require('./src/utils/prismaClient');

async function setupTrailers() {
  console.log('Setting up test trailers for Phase 9...');

  const d1User = await prisma.user.findUnique({ where: { email: 'driver@hero.com' } });
  const d2User = await prisma.user.findUnique({ where: { email: 'driver2@hero.com' } });

  if (!d1User || !d2User) {
    console.error('Driver A or Driver B user not found.');
    return;
  }

  const d1 = await prisma.driver.findUnique({ where: { userId: d1User.id } });
  const d2 = await prisma.driver.findUnique({ where: { userId: d2User.id } });

  // Ensure Driver A company has Trailer A1 and Trailer A2
  let trailerA1 = await prisma.vehicle.findFirst({
    where: { companyId: d1.companyId, category: 'TRAILER', rego: 'XT-78FC' }
  });
  if (!trailerA1) {
    trailerA1 = await prisma.vehicle.create({
      data: {
        category: 'TRAILER',
        make: 'Vawdrey',
        model: 'Car Carrier (4 Level)',
        rego: 'XT-78FC',
        plate: 'XT-78FC',
        vin: '9TRT2AA1000000030',
        status: 'IDLE',
        companyId: d1.companyId
      }
    });
  }

  let trailerA2 = await prisma.vehicle.findFirst({
    where: { companyId: d1.companyId, category: 'TRAILER', rego: 'XT-58HJ' }
  });
  if (!trailerA2) {
    trailerA2 = await prisma.vehicle.create({
      data: {
        category: 'TRAILER',
        make: 'Vawdrey',
        model: 'Car Carrier (4 Level)',
        rego: 'XT-58HJ',
        plate: 'XT-58HJ',
        vin: '9TRT2AA1000000039',
        status: 'IDLE',
        companyId: d1.companyId
      }
    });
  }

  // Ensure Driver A active load is assigned to trailerA1
  const loadA = await prisma.load.findFirst({ where: { driverId: d1.id } });
  if (loadA) {
    await prisma.load.update({
      where: { id: loadA.id },
      data: { trailerId: trailerA1.id, status: 'IN_TRANSIT' }
    });
  }

  // Ensure Driver B active load is assigned to trailerB1
  let trailerB1 = await prisma.vehicle.findFirst({
    where: { companyId: d2.companyId, category: 'TRAILER', rego: 'XT-99B1' }
  });
  if (!trailerB1) {
    trailerB1 = await prisma.vehicle.create({
      data: {
        category: 'TRAILER',
        make: 'Krueger',
        model: 'Drop Deck Trailer',
        rego: 'XT-99B1',
        plate: 'XT-99B1',
        vin: '9TRT2BB1000000099',
        status: 'IDLE',
        companyId: d2.companyId
      }
    });
  }

  const loadB = await prisma.load.findFirst({ where: { driverId: d2.id } });
  if (loadB) {
    await prisma.load.update({
      where: { id: loadB.id },
      data: { trailerId: trailerB1.id, status: 'IN_TRANSIT' }
    });
  }

  // Ensure a Cross-Company Trailer exists (belonging to a different company ID)
  let companyOther = await prisma.company.findFirst({
    where: { id: { not: d1.companyId } }
  });
  if (!companyOther) {
    companyOther = await prisma.company.create({
      data: {
        name: 'Other Logistics Corp'
      }
    });
  }

  let trailerCrossCompany = await prisma.vehicle.findFirst({
    where: { companyId: companyOther.id, category: 'TRAILER', rego: 'XT-CROSS-99' }
  });
  if (!trailerCrossCompany) {
    trailerCrossCompany = await prisma.vehicle.create({
      data: {
        category: 'TRAILER',
        make: 'Freighter',
        model: 'Flatbed Trailer',
        rego: 'XT-CROSS-99',
        plate: 'XT-CROSS-99',
        vin: '9TRT2CC9999999999',
        status: 'IDLE',
        companyId: companyOther.id
      }
    });
  }

  console.log('✅ Phase 9 test trailers set up successfully!');
  await prisma.$disconnect();
}

setupTrailers().catch(console.error);
