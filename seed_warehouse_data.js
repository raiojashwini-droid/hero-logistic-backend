const prisma = require('./src/utils/prismaClient');

async function seedWarehouseData() {
  console.log('🌱 Starting Warehouse Portal database seed...');

  // 1. Get or Create Company & Branch
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Falcon Logistics LLC',
        tenantId: '#TEN-1',
        status: 'ACTIVE'
      }
    });
  }

  let branch = await prisma.branch.findFirst({ where: { companyId: company.id } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Sydney Depot Hub',
        location: 'Eastern Creek NSW',
        companyId: company.id
      }
    });
  }

  // 2. Get or Create Warehouse Manager User
  let whManager = await prisma.user.findFirst({ where: { email: 'warehouse@hero.com' } });

  // 3. Create or Update Main Warehouse
  let warehouse = await prisma.warehouse.findFirst({ where: { code: 'WH-001' } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        code: 'WH-001',
        name: 'Sydney Depot Main Yard',
        type: 'General & Yard',
        status: 'Active',
        totalAreaSqm: 15000,
        palletCapacity: 200,
        loadingDocks: 8,
        address: '12 Logistics Way, Eastern Creek NSW',
        city: 'Sydney',
        state: 'NSW',
        postalCode: '2766',
        branchId: branch.id,
        managerId: whManager?.id || null
      }
    });
  }

  // 4. Create Load Lanes 1-8
  const laneNames = ['Lane 1', 'Lane 2', 'Lane 3', 'Lane 4', 'Lane 5', 'Lane 6', 'Lane 7', 'Lane 8'];
  const createdLanes = [];
  for (const name of laneNames) {
    let lane = await prisma.loadLane.findFirst({ where: { name, warehouseId: warehouse.id } });
    if (!lane) {
      lane = await prisma.loadLane.create({
        data: {
          name,
          status: name === 'Lane 7' || name === 'Lane 8' ? 'Empty' : 'ACTIVE',
          warehouseId: warehouse.id
        }
      });
    }
    createdLanes.push(lane);
  }

  // 5. Create Staging Areas SA-01 to SA-12
  const stagingAreasData = [
    { name: 'Stage Area 1', status: 'ACTIVE' },
    { name: 'Stage Area 2', status: 'ACTIVE' },
    { name: 'Stage Area 3', status: 'ACTIVE' },
    { name: 'Stage Area 4', status: 'ACTIVE' },
    { name: 'Stage Area 5', status: 'ACTIVE' },
    { name: 'Stage Area 6', status: 'ACTIVE' },
    { name: 'Stage Area 7', status: 'ACTIVE' },
    { name: 'Stage Area 8', status: 'ACTIVE' },
    { name: 'Stage Area 9', status: 'ACTIVE' },
    { name: 'Stage Area 10', status: 'ACTIVE' },
    { name: 'Stage Area 11', status: 'ACTIVE' },
    { name: 'Stage Area 12', status: 'ACTIVE' }
  ];

  const createdStagingAreas = [];
  for (const sData of stagingAreasData) {
    let area = await prisma.stagingArea.findFirst({ where: { name: sData.name, warehouseId: warehouse.id } });
    if (!area) {
      area = await prisma.stagingArea.create({
        data: {
          name: sData.name,
          status: sData.status,
          warehouseId: warehouse.id
        }
      });
    }
    createdStagingAreas.push(area);
  }

  // 6. Create Driver & Truck/Trailer for Load simulation
  let driver = await prisma.driver.findFirst();
  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        driverCode: 'DRV-101',
        licenseNumber: 'John Smith',
        phone: '0411 111 111',
        companyId: company.id
      }
    });
  }

  let truck = await prisma.vehicle.findFirst({ where: { rego: 'TRK-101' } });
  if (!truck) {
    truck = await prisma.vehicle.create({
      data: {
        rego: 'TRK-101',
        vin: 'VIN-TRK-101-9988',
        make: 'MAN',
        model: 'TGX 26.580',
        companyId: company.id
      }
    });
  }

  let trailer = await prisma.vehicle.findFirst({ where: { rego: 'TRL-309' } });
  if (!trailer) {
    trailer = await prisma.vehicle.create({
      data: {
        rego: 'TRL-309',
        vin: 'VIN-TRL-309-1122',
        make: 'Car Carrier',
        model: '4 Level',
        companyId: company.id
      }
    });
  }

  // 7. Create Customer
  let customer = await prisma.customer.findFirst({ where: { name: 'ABC Motors' } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: 'ABC Motors',
        contactName: 'Arthur Dent',
        email: 'arthur@abcmotors.com',
        phone: '0411 222 333',
        companyId: company.id
      }
    });
  }

  // 8. Create Loads (LD-3985, LD-3986, LD-3987, LD-3984)
  const loadsData = [
    { loadRef: 'LD-3985', status: 'ASSIGNED', laneIdx: 0 },
    { loadRef: 'LD-3986', status: 'PLANNED', laneIdx: 1 },
    { loadRef: 'LD-3984', status: 'ASSIGNED', laneIdx: 2 },
    { loadRef: 'LD-3987', status: 'PLANNED', laneIdx: 3 }
  ];

  const createdLoads = [];
  for (const ld of loadsData) {
    let load = await prisma.load.findUnique({ where: { loadRef: ld.loadRef } });
    if (!load) {
      load = await prisma.load.create({
        data: {
          loadRef: ld.loadRef,
          type: 'Car Carrying',
          status: ld.status,
          customerId: customer.id,
          driverId: driver.id,
          truckId: truck.id,
          trailerId: trailer.id,
          companyId: company.id
        }
      });
    }
    createdLoads.push(load);
  }

  // 9. Create Inbound Receipts (GR-1023 to GR-1026, GR-1038)
  const receiptsData = [
    { receiptNo: 'GR-1038', supplier: 'ABC Motors', referenceNote: 'DEL-887654', date: new Date('2026-07-21T10:20:00') },
    { receiptNo: 'GR-1023', supplier: 'ABC Motors', referenceNote: 'DEL-887601', date: new Date('2026-07-21T10:30:00') },
    { receiptNo: 'GR-1024', supplier: 'National Fleet', referenceNote: 'DEL-887602', date: new Date('2026-07-21T11:15:00') },
    { receiptNo: 'GR-1025', supplier: 'EasyAuto', referenceNote: 'DEL-887603', date: new Date('2026-07-21T13:00:00') },
    { receiptNo: 'GR-1026', supplier: 'Premium Cars', referenceNote: 'DEL-887604', date: new Date('2026-07-21T14:45:00') }
  ];

  const createdReceipts = [];
  for (const rc of receiptsData) {
    let receipt = await prisma.inboundReceipt.findUnique({ where: { receiptNo: rc.receiptNo } });
    if (!receipt) {
      receipt = await prisma.inboundReceipt.create({
        data: {
          receiptNo: rc.receiptNo,
          supplier: rc.supplier,
          referenceNote: rc.referenceNote,
          transportType: 'Truck',
          driverName: 'John Smith',
          vehicleRef: 'TRK-101 / TRL-309',
          inboundType: 'Purchase / Supplier Delivery',
          status: 'Completed',
          receivingDate: rc.date,
          warehouseId: warehouse.id,
          stagingAreaId: createdStagingAreas[0]?.id
        }
      });
    }
    createdReceipts.push(receipt);
  }

  // 10. Route Stops for Items
  let stop1 = await prisma.routeStop.findFirst({ where: { loadId: createdLoads[0].id } });
  if (!stop1) {
    stop1 = await prisma.routeStop.create({
      data: {
        loadId: createdLoads[0].id,
        type: 'PICKUP',
        sequenceIndex: 0,
        address: 'Sydney Terminal'
      }
    });
  }

  let stop2 = await prisma.routeStop.findFirst({ where: { loadId: createdLoads[0].id, sequenceIndex: 1 } });
  if (!stop2) {
    stop2 = await prisma.routeStop.create({
      data: {
        loadId: createdLoads[0].id,
        type: 'DROPOFF',
        sequenceIndex: 1,
        address: 'Melbourne Distribution Depot'
      }
    });
  }

  // 11. Create Stock LoadItems
  const stockItemsData = [
    {
      rego: 'ABC123',
      vin: 'JTDBE32K203456789',
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      color: 'White',
      vehicleType: 'Vehicle',
      stockStatus: 'IN_STORAGE',
      zone: 'Yard A',
      row: 'Row 4',
      bay: 'Bay 12',
      position: 'P01',
      laneIdx: 3,
      stagingIdx: 0,
      receiptIdx: 0,
      loadIdx: 3
    },
    {
      rego: 'DEF456',
      vin: 'JM0BL10F200123456',
      make: 'Mazda',
      model: '3',
      year: 2022,
      color: 'Red',
      vehicleType: 'Vehicle',
      stockStatus: 'STAGED',
      zone: 'Yard A',
      row: 'Load Lane 4',
      bay: 'Bay 12',
      position: 'P02',
      laneIdx: 3,
      stagingIdx: 0,
      receiptIdx: 0,
      loadIdx: 3
    },
    {
      rego: 'GHI789',
      vin: '1HGCM82633A123456',
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      color: 'Silver',
      vehicleType: 'Vehicle',
      stockStatus: 'STAGED',
      zone: 'Yard B',
      row: 'Row 1',
      bay: 'Bay 03',
      position: 'P02',
      laneIdx: 2,
      stagingIdx: 1,
      receiptIdx: 0,
      loadIdx: 1
    },
    {
      rego: 'EL-1001',
      vin: 'BAR-9345678901234',
      stockRef: 'SKU: EL-1001',
      make: 'Pallet',
      model: 'Electrical Parts',
      vehicleType: 'Pallet',
      stockStatus: 'IN_STORAGE',
      zone: 'Warehouse 1',
      row: 'Aisle 12',
      bay: 'Bay 5',
      position: 'P01',
      laneIdx: 4,
      stagingIdx: 2,
      receiptIdx: 0,
      loadIdx: 0
    },
    {
      rego: 'MG-2044',
      vin: 'BAR-9345578905678',
      stockRef: 'SKU: MG-2044',
      make: 'Carton',
      model: 'Mixed Goods',
      vehicleType: 'Carton',
      stockStatus: 'TO_MOVE',
      zone: 'Warehouse 1',
      row: 'Aisle 05',
      bay: 'Bay 2',
      position: 'P01',
      laneIdx: 0,
      stagingIdx: 3,
      receiptIdx: 0,
      loadIdx: 0
    },
    {
      rego: 'DG-200L',
      vin: 'BAR-9345678909999',
      stockRef: 'UN1203 - Petrol 200L Drum',
      make: 'DG Item',
      model: 'Petrol 200L Drum',
      vehicleType: 'DG Item',
      stockStatus: 'IN_STORAGE',
      zone: 'DG Store',
      row: 'Zone A',
      bay: 'Bay 03',
      position: 'P01',
      laneIdx: 4,
      stagingIdx: 4,
      receiptIdx: 0,
      loadIdx: 0
    },
    {
      rego: 'CONT-MSCU1234567',
      vin: 'MSCU1234567',
      stockRef: 'CONT-MSCU1234567',
      make: '20ft Container',
      model: 'Oceanic Container',
      vehicleType: 'Container',
      stockStatus: 'STAGED',
      zone: 'Yard C',
      row: 'Stack 2',
      bay: 'Slot 4',
      position: 'P01',
      laneIdx: 5,
      stagingIdx: 5,
      receiptIdx: 0,
      loadIdx: 0
    }
  ];

  for (const s of stockItemsData) {
    let item = await prisma.loadItem.findFirst({ where: { vin: s.vin } });
    if (!item) {
      item = await prisma.loadItem.create({
        data: {
          loadId: createdLoads[s.loadIdx].id,
          pickupStopId: stop1.id,
          dropoffStopId: stop2.id,
          rego: s.rego,
          vin: s.vin,
          stockRef: s.stockRef || s.rego,
          make: s.make,
          model: s.model,
          year: s.year || null,
          color: s.color || null,
          vehicleType: s.vehicleType,
          stockStatus: s.stockStatus,
          zone: s.zone,
          row: s.row,
          bay: s.bay,
          position: s.position,
          warehouseId: warehouse.id,
          loadLaneId: createdLanes[s.laneIdx]?.id || null,
          stagingAreaId: createdStagingAreas[s.stagingIdx]?.id || null,
          inboundReceiptId: createdReceipts[s.receiptIdx]?.id || null,
          customerId: customer.id,
          receivedDate: new Date('2026-07-21T09:15:00')
        }
      });

      // Create initial movement log
      await prisma.itemMovement.create({
        data: {
          itemId: item.id,
          type: 'RECEIVE',
          fromLocation: 'Inbound Dock',
          toLocation: `${s.zone} / ${s.row} / ${s.bay}`,
          reason: 'Initial Inbound Storage',
          result: 'COMPLETED',
          performedById: whManager?.id || null,
          loadLaneId: createdLanes[s.laneIdx]?.id || null,
          stagingAreaId: createdStagingAreas[s.stagingIdx]?.id || null
        }
      });
    }
  }

  // 12. Create Networked Printers
  const printersData = [
    { name: 'Zebra ZD421 (Office)', ipAddress: '192.168.1.25', status: 'ONLINE' },
    { name: 'Zebra ZT411 (Dock A)', ipAddress: '192.168.1.30', status: 'IDLE' },
    { name: 'HP LaserJet Pro (Billing)', ipAddress: '192.168.1.15', status: 'OFFLINE' }
  ];

  for (const pr of printersData) {
    let p = await prisma.networkedPrinter.findFirst({ where: { name: pr.name, warehouseId: warehouse.id } });
    if (!p) {
      await prisma.networkedPrinter.create({
        data: {
          name: pr.name,
          ipAddress: pr.ipAddress,
          status: pr.status,
          warehouseId: warehouse.id
        }
      });
    }
  }

  // 13. Create Print Spooler Jobs
  const spoolerJobsData = [
    { status: 'PRINTING' },
    { status: 'QUEUED' },
    { status: 'QUEUED' },
    { status: 'COMPLETED' }
  ];

  for (const job of spoolerJobsData) {
    await prisma.printSpoolerJob.create({
      data: {
        warehouseId: warehouse.id,
        status: job.status
      }
    });
  }

  console.log('✅ Warehouse Portal database seed completed successfully!');
}

seedWarehouseData()
  .catch(e => console.error('❌ Seeder error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
