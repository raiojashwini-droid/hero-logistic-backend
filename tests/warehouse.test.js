const assert = require('assert');
const prisma = require('../src/utils/prismaClient');

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    cookie(name, value, options) {
      this.headers[name] = value;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('--- STARTING WAREHOUSE & YARD PORTAL COMPLIANCE TESTS ---');
  let failures = 0;

  // Setup test data
  let companyA;
  let companyB;
  let branchA;
  let branchB;
  let warehouseA;
  let warehouseB;
  let userA;
  let userB;
  let itemA;
  let itemB;

  try {
    console.log('Setup: Creating test companies, branches, warehouses, items and users...');
    companyA = await prisma.company.create({
      data: { name: `WH Test Co A ${Date.now()}`, status: 'ACTIVE' }
    });
    companyB = await prisma.company.create({
      data: { name: `WH Test Co B ${Date.now()}`, status: 'ACTIVE' }
    });

    branchA = await prisma.branch.create({
      data: { name: 'Branch A', companyId: companyA.id }
    });
    branchB = await prisma.branch.create({
      data: { name: 'Branch B', companyId: companyB.id }
    });

    warehouseA = await prisma.warehouse.create({
      data: { name: 'Warehouse A', branchId: branchA.id, capacity: 100 }
    });
    warehouseB = await prisma.warehouse.create({
      data: { name: 'Warehouse B', branchId: branchB.id, capacity: 100 }
    });

    userA = await prisma.user.create({
      data: {
        email: `workerA-${Date.now()}@test.com`,
        password: 'hash',
        name: 'Worker A',
        role: 'WAREHOUSE_STAFF',
        companyId: companyA.id
      }
    });

    userB = await prisma.user.create({
      data: {
        email: `workerB-${Date.now()}@test.com`,
        password: 'hash',
        name: 'Worker B',
        role: 'WAREHOUSE_STAFF',
        companyId: companyB.id
      }
    });

    itemA = await prisma.loadItem.create({
      data: {
        stockRef: `STK-A-${Date.now()}`,
        vin: `VIN-A-${Date.now()}`,
        rego: 'REG-A',
        vehicleType: 'Vehicle',
        stockStatus: 'IN_STORAGE',
        warehouseId: warehouseA.id
      }
    });

    itemB = await prisma.loadItem.create({
      data: {
        stockRef: `STK-B-${Date.now()}`,
        vin: `VIN-B-${Date.now()}`,
        rego: 'REG-B',
        vehicleType: 'Vehicle',
        stockStatus: 'IN_STORAGE',
        warehouseId: warehouseB.id
      }
    });

    console.log('  ✓ Setup completed successfully.');
  } catch (err) {
    console.error('  ✗ Setup failed:', err.stack);
    process.exit(1);
  }

  // Test 1: Stock Scoping for Warehouse Worker A
  try {
    console.log('Test 1: Enforcing tenant boundaries on Stock inventory...');
    const ctrl = require('../src/controllers/WarehousePortalController');

    // 1. Worker A retrieves stock - should only return item A
    const reqGet = {
      tenantId: companyA.id,
      user: {
        id: userA.id,
        role: 'WAREHOUSE_STAFF'
      },
      query: {}
    };
    const resGet = mockRes();
    await ctrl.getStock(reqGet, resGet, (err) => { if (err) throw err; });

    const loadedData = resGet.body.data || resGet.body;
    assert(Array.isArray(loadedData), 'Response must be an array');
    
    const hasItemA = loadedData.some(item => item.id === itemA.id);
    const hasItemB = loadedData.some(item => item.id === itemB.id);

    assert.strictEqual(hasItemA, true, 'Worker A must see Item A');
    assert.strictEqual(hasItemB, false, 'Worker A must NOT see Item B');
    console.log('  ✓ Warehouse worker can only retrieve stock items belonging to their company/tenant.');

  } catch (err) {
    console.error('  ✗ Test 1 failed:', err.stack);
    failures++;
  }

  // Test 2: Staff Profile Dynamic Identity Sync
  try {
    console.log('Test 2: Verifying staff profile resolves dynamically...');
    const ctrl = require('../src/controllers/WarehousePortalController');

    const reqProfile = {
      user: userA
    };
    const resProfile = mockRes();
    await ctrl.getStaffProfile(reqProfile, resProfile, (err) => { if (err) throw err; });

    const profileData = resProfile.body.data?.profile || resProfile.body.profile;
    assert.strictEqual(profileData.name, 'Worker A', 'Profile name must match authenticated user name');
    assert.strictEqual(profileData.role, 'Warehouse Staff', 'Profile role must match mapping');
    console.log('  ✓ Staff profile loads user credentials dynamically.');

  } catch (err) {
    console.error('  ✗ Test 2 failed:', err.stack);
    failures++;
  }

  // Cleanup test data
  try {
    console.log('Cleanup: Cleaning up database records...');
    await prisma.loadItem.deleteMany({ where: { warehouseId: { in: [warehouseA.id, warehouseB.id] } } });
    await prisma.warehouse.deleteMany({ where: { id: { in: [warehouseA.id, warehouseB.id] } } });
    await prisma.branch.deleteMany({ where: { id: { in: [branchA.id, branchB.id] } } });
    await prisma.user.deleteMany({ where: { companyId: { in: [companyA.id, companyB.id] } } });
    await prisma.company.deleteMany({ where: { id: { in: [companyA.id, companyB.id] } } });
    console.log('  ✓ Cleanup finished.');
  } catch (err) {
    console.error('  Cleanup warning:', err.message);
  }

  if (failures > 0) {
    console.log(`--- FLOW COMPLIANCE TESTS FAILED WITH ${failures} FAILURE(S) ---`);
    process.exit(1);
  } else {
    console.log('--- ALL WAREHOUSE COMPLIANCE TESTS PASSED SUCCESSFULLY ---');
    process.exit(0);
  }
}

runTests();
