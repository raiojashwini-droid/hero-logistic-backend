const prisma = require('./src/utils/prismaClient');

async function setupPhase5Items() {
  console.log('Setting up Phase 5 test items for Driver A and Driver B...');

  const company = await prisma.company.findFirst();
  const companyId = company.id;

  // 1. Driver A (Noah Williams) load PO-65432 (d7eddea8-51d8-4bd7-b7b4-343033f08301)
  const driverALoad = await prisma.load.findFirst({
    where: { loadRef: 'PO-65432' }
  });

  if (driverALoad) {
    const existingCount = await prisma.loadItem.count({ where: { loadId: driverALoad.id } });
    if (existingCount === 0) {
      await prisma.loadItem.createMany({
        data: [
          {
            loadId: driverALoad.id,
            vin: '1HGCM82633A004352',
            make: 'Toyota',
            model: 'Camry',
            year: 2023,
            color: 'White',
            rego: 'ABC123',
            status: null
          },
          {
            loadId: driverALoad.id,
            vin: 'JM1BM1W77XG1301234',
            make: 'Mazda',
            model: 'Mazda 3',
            year: 2022,
            color: 'Blue',
            rego: 'CDE789',
            status: null
          },
          {
            loadId: driverALoad.id,
            vin: '5YJ3E1EB1KF123456',
            make: 'Tesla',
            model: 'Model 3',
            year: 2024,
            color: 'Grey',
            rego: 'DEF012',
            status: null
          }
        ]
      });
      console.log('✅ Added 3 test items to Driver A Load PO-65432');
    } else {
      console.log(`ℹ️ Driver A Load PO-65432 already has ${existingCount} items.`);
    }
  }

  // 2. Driver B (Liam Smith) load PO-99100 (d57d231e-62bc-4b2e-8148-934d14dfb22a)
  const driverBLoad = await prisma.load.findFirst({
    where: { loadRef: 'PO-99100' }
  });

  if (driverBLoad) {
    const existingCount = await prisma.loadItem.count({ where: { loadId: driverBLoad.id } });
    if (existingCount === 0) {
      await prisma.loadItem.createMany({
        data: [
          {
            loadId: driverBLoad.id,
            vin: 'JH4KAB260MC000145',
            make: 'Honda',
            model: 'Accord',
            year: 2023,
            color: 'Silver',
            rego: 'BCD456',
            status: null
          },
          {
            loadId: driverBLoad.id,
            vin: 'WAUZZZ4G5HN123456',
            make: 'Audi',
            model: 'A6',
            year: 2023,
            color: 'Black',
            rego: 'FEG345',
            status: null
          }
        ]
      });
      console.log('✅ Added 2 test items to Driver B Load PO-99100');
    } else {
      console.log(`ℹ️ Driver B Load PO-99100 already has ${existingCount} items.`);
    }
  }

  await prisma.$disconnect();
}

setupPhase5Items().catch(e => {
  console.error('Setup failed:', e);
  process.exit(1);
});
