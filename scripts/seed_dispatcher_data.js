const prisma = require('../src/utils/prismaClient');

async function main() {
  console.log('Seeding dispatcher data...');

  // 1. Get first company
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found in database! Please seed or create a company first.');
    return;
  }
  const companyId = company.id;

  // 2. Create Drivers
  const driversData = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@herologistics.com', phone: '0491570156', companyId },
    { firstName: 'Chris', lastName: 'Lee', email: 'chris.lee@herologistics.com', phone: '0491570157', companyId },
    { firstName: 'Michael', lastName: 'Tan', email: 'michael.tan@herologistics.com', phone: '0491570158', companyId },
    { firstName: 'David', lastName: 'Brown', email: 'david.brown@herologistics.com', phone: '0491570159', companyId },
    { firstName: 'Ben', lastName: 'Hall', email: 'ben.hall@herologistics.com', phone: '0491570160', companyId },
    { firstName: 'Sarah', lastName: 'Connor', email: 'sarah.connor@herologistics.com', phone: '0491570161', companyId }
  ];

  const drivers = [];
  for (const d of driversData) {
    const drv = await prisma.driver.upsert({
      where: { email: d.email },
      update: {},
      create: d
    });
    drivers.push(drv);
  }
  console.log(`Seeded ${drivers.length} drivers.`);

  // 3. Create Vehicles
  const vehiclesData = [
    { make: 'MAN', model: 'TGX 26.580', rego: 'MAN265', category: 'TRUCK', companyId },
    { make: 'Volvo', model: 'FH16 750', rego: 'VOL750', category: 'TRUCK', companyId },
    { make: 'Scania', model: 'R650', rego: 'SCA650', category: 'TRUCK', companyId },
    { make: 'Kenworth', model: 'T909', rego: 'KEN909', category: 'TRUCK', companyId }
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const vhc = await prisma.vehicle.upsert({
      where: { rego: v.rego },
      update: {},
      create: v
    });
    vehicles.push(vhc);
  }
  console.log(`Seeded ${vehicles.length} vehicles.`);

  // 4. Create Customers
  const customersData = [
    { name: 'BMW Australia', email: 'logistics@bmw.com.au' },
    { name: 'Pickles Auctions', email: 'transport@pickles.com.au' },
    { name: 'Toyota Finance', email: 'fleet@toyota.com.au' },
    { name: 'Hertz Australia', email: 'rentals@hertz.com.au' },
    { name: 'Copart Australia', email: 'dispatch@copart.com.au' }
  ];

  const customers = [];
  for (const c of customersData) {
    let cust = await prisma.customer.findFirst({
      where: { name: c.name, companyId }
    });
    if (!cust) {
      cust = await prisma.customer.create({
        data: {
          ...c,
          companyId
        }
      });
    }
    customers.push(cust);
  }
  console.log(`Seeded ${customers.length} customers.`);

  // 5. Create Loads
  const loadsData = [
    {
      loadRef: 'LD-10583',
      type: 'General Freight',
      status: 'IN_TRANSIT',
      priority: 'HIGH',
      notes: 'Sydney Depot to Melbourne Depot',
      driverId: drivers[0].id,
      truckId: vehicles[0].id,
      customerId: customers[0].id,
      companyId
    },
    {
      loadRef: 'LD-10582',
      type: 'Car Carrying',
      status: 'IN_TRANSIT',
      priority: 'NORMAL',
      notes: 'Brisbane to Sydney transport',
      driverId: drivers[1].id,
      truckId: vehicles[1].id,
      customerId: customers[1].id,
      companyId
    },
    {
      loadRef: 'LD-10581',
      type: 'Dangerous Goods',
      status: 'ASSIGNED',
      priority: 'URGENT',
      notes: 'Adelaide to Perth depot run',
      driverId: drivers[2].id,
      truckId: vehicles[2].id,
      customerId: customers[2].id,
      companyId
    },
    {
      loadRef: 'LD-10579',
      type: 'Refrigerated',
      status: 'IN_TRANSIT',
      priority: 'NORMAL',
      notes: 'Fresh produce cold chain',
      driverId: drivers[3].id,
      truckId: vehicles[0].id,
      customerId: customers[3].id,
      companyId
    },
    {
      loadRef: 'LD-10578',
      type: 'General Freight',
      status: 'PLANNED',
      priority: 'NORMAL',
      notes: 'Regular scheduled run',
      driverId: drivers[4].id,
      truckId: vehicles[3].id,
      customerId: customers[4].id,
      companyId
    }
  ];

  for (const l of loadsData) {
    await prisma.load.upsert({
      where: { loadRef: l.loadRef },
      update: {},
      create: l
    });
  }
  console.log('Seeded loads data successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
