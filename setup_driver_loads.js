const prisma = require('./src/utils/prismaClient');

const COMPANY_ID = '1c058eaa-4e42-4713-a26c-08d35ad626fb';
const NOAH_DRIVER_ID = 'f4f27981-cc10-4878-8e0b-5360a403d609'; // driver@hero.com
const LIAM_DRIVER_ID = '7972eac7-f45b-4cbf-9599-6ab9eb132f64'; // driver2@hero.com

async function setupLoads() {
  console.log('\nSetting up realistic loads for test drivers...');

  // 1. Assign existing PO-643280 to Noah Williams as IN_TRANSIT
  const unassigned = await prisma.load.findFirst({ where: { loadRef: 'PO-643280' } });
  if (unassigned) {
    await prisma.load.update({
      where: { id: unassigned.id },
      data: {
        driverId: NOAH_DRIVER_ID,
        status: 'IN_TRANSIT',
        type: 'Car Carrier (4 Level)',
        loadDate: new Date(),
      }
    });
    console.log('  Updated PO-643280 → Assigned to Noah Williams (IN_TRANSIT)');
  }

  // 2. Create an UPCOMING load for Noah Williams
  const load1 = await prisma.load.upsert({
    where: { loadRef: 'PO-65432' },
    create: {
      loadRef: 'PO-65432',
      type: 'Car Carrier (4 Level)',
      status: 'ASSIGNED', // UI maps ASSIGNED to UPCOMING
      priority: 'HIGH',
      loadDate: new Date(),
      companyId: COMPANY_ID,
      driverId: NOAH_DRIVER_ID,
      stops: {
        create: [
          {
            type: 'PICKUP',
            sequenceIndex: 0,
            address: '123 Sunshine Rd, Melbourne VIC 3000',
            contactName: 'ABC Car Yard',
            scheduledDate: new Date()
          },
          {
            type: 'DROPOFF',
            sequenceIndex: 1,
            address: '45 Parramatta Rd, Sydney NSW 2150',
            contactName: 'Auto World Sydney',
            scheduledDate: new Date(Date.now() + 86400000)
          }
        ]
      }
    },
    update: {
      driverId: NOAH_DRIVER_ID,
      status: 'ASSIGNED',
    }
  });
  console.log('  Created/Updated PO-65432 → Assigned to Noah Williams (ASSIGNED / UPCOMING)');

  // 3. Create a COMPLETED load for Noah Williams
  const load2 = await prisma.load.upsert({
    where: { loadRef: 'PO-65398' },
    create: {
      loadRef: 'PO-65398',
      type: 'Car Carrier (4 Level)',
      status: 'COMPLETED',
      priority: 'NORMAL',
      loadDate: new Date(Date.now() - 86400000 * 3),
      companyId: COMPANY_ID,
      driverId: NOAH_DRIVER_ID,
      stops: {
        create: [
          {
            type: 'PICKUP',
            sequenceIndex: 0,
            address: '12 Trade St, Lytton QLD 4178',
            contactName: 'Brisbane Yard',
            scheduledDate: new Date(Date.now() - 86400000 * 3)
          },
          {
            type: 'DROPOFF',
            sequenceIndex: 1,
            address: '24 Bailey Cres, Southport QLD 4215',
            contactName: 'Gold Coast Yard',
            scheduledDate: new Date(Date.now() - 86400000 * 3)
          }
        ]
      }
    },
    update: {
      driverId: NOAH_DRIVER_ID,
      status: 'COMPLETED',
    }
  });
  console.log('  Created/Updated PO-65398 → Assigned to Noah Williams (COMPLETED)');

  // 4. Create a load for Liam Smith (Driver B)
  const load3 = await prisma.load.upsert({
    where: { loadRef: 'PO-99100' },
    create: {
      loadRef: 'PO-99100',
      type: 'Heavy Freight',
      status: 'ASSIGNED',
      priority: 'NORMAL',
      loadDate: new Date(),
      companyId: COMPANY_ID,
      driverId: LIAM_DRIVER_ID,
      stops: {
        create: [
          {
            type: 'PICKUP',
            sequenceIndex: 0,
            address: 'Port Dr, Brisbane QLD 4178',
            contactName: 'Brisbane Terminal',
            scheduledDate: new Date()
          },
          {
            type: 'DROPOFF',
            sequenceIndex: 1,
            address: '12 Freight Ave, Perth WA 6100',
            contactName: 'Perth Hub',
            scheduledDate: new Date(Date.now() + 86400000 * 2)
          }
        ]
      }
    },
    update: {
      driverId: LIAM_DRIVER_ID,
      status: 'ASSIGNED',
    }
  });
  console.log('  Created/Updated PO-99100 → Assigned to Liam Smith (ASSIGNED)');

  console.log('\n✅ Load setup complete!');
  await prisma.$disconnect();
}

setupLoads().catch(e => {
  console.error('Setup loads failed:', e);
  process.exit(1);
});
