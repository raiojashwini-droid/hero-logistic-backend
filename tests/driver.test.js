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
  console.log('--- STARTING DRIVER PORTAL & COMPLIANCE TESTS ---');
  let failures = 0;

  // Setup test data
  let company;
  let driverA;
  let driverB;
  let userDriverA;
  let userDriverB;
  let loadA;
  let loadB;

  try {
    console.log('Setup: Creating test company, drivers and loads...');
    company = await prisma.company.create({
      data: {
        name: `Driver Test Co ${Date.now()}`,
        status: 'ACTIVE'
      }
    });

    // Custom role for normal driver
    const customRoleDriver = await prisma.customRole.create({
      data: {
        name: `Test Driver Role ${Date.now()}`,
        companyId: company.id,
        permissions: {
          create: [
            { actionString: 'driver.dashboard.view', module: 'DRIVER' },
            { actionString: 'driver.jobs.view_own', module: 'DRIVER' }
          ]
        }
      }
    });

    userDriverA = await prisma.user.create({
      data: {
        email: `driverA-${Date.now()}@test.com`,
        password: 'hash',
        name: 'Driver A',
        role: 'DRIVER',
        companyId: company.id,
        customRoleId: customRoleDriver.id
      }
    });

    userDriverB = await prisma.user.create({
      data: {
        email: `driverB-${Date.now()}@test.com`,
        password: 'hash',
        name: 'Driver B',
        role: 'DRIVER',
        companyId: company.id,
        customRoleId: customRoleDriver.id
      }
    });

    driverA = await prisma.driver.create({
      data: {
        firstName: 'Driver',
        lastName: 'A',
        driverCode: `DRV-A-${Date.now()}`,
        email: `driverA-${Date.now()}@test.com`,
        companyId: company.id,
        userId: userDriverA.id
      }
    });

    driverB = await prisma.driver.create({
      data: {
        firstName: 'Driver',
        lastName: 'B',
        driverCode: `DRV-B-${Date.now()}`,
        email: `driverB-${Date.now()}@test.com`,
        companyId: company.id,
        userId: userDriverB.id
      }
    });

    loadA = await prisma.load.create({
      data: {
        loadRef: `LD-A-${Date.now()}`,
        type: 'General Freight',
        companyId: company.id,
        driverId: driverA.id
      }
    });

    loadB = await prisma.load.create({
      data: {
        loadRef: `LD-B-${Date.now()}`,
        type: 'General Freight',
        companyId: company.id,
        driverId: driverB.id
      }
    });

    console.log('  ✓ Setup completed successfully.');
  } catch (err) {
    console.error('  ✗ Setup failed:', err.stack);
    process.exit(1);
  }

  // Test 1: Load Scoping for Driver
  try {
    console.log('Test 1: Enforcing Driver assigned resource boundaries on Loads...');
    const LoadController = require('../src/controllers/LoadController');

    // 1. Driver A retrieves loads - should only return load A
    const reqGet = {
      tenantId: company.id,
      user: {
        id: userDriverA.id,
        userId: userDriverA.id,
        role: 'DRIVER',
        permissions: ['driver.jobs.view_own']
      },
      query: {}
    };
    const resGet = mockRes();
    await LoadController.getAll(reqGet, resGet, (err) => { if (err) throw err; });

    const loadedData = resGet.body.data || resGet.body;
    assert(Array.isArray(loadedData), 'Response must be an array');
    
    const hasLoadA = loadedData.some(l => l.id === loadA.id);
    const hasLoadB = loadedData.some(l => l.id === loadB.id);

    assert.strictEqual(hasLoadA, true, 'Driver A must see Load A');
    assert.strictEqual(hasLoadB, false, 'Driver A must NOT see Load B');
    console.log('  ✓ Driver can only retrieve their own assigned loads.');

    // 2. Driver attempts to create load - should be blocked
    const reqCreate = {
      tenantId: company.id,
      user: {
        id: userDriverA.id,
        userId: userDriverA.id,
        role: 'DRIVER',
        permissions: ['driver.jobs.view_own']
      },
      body: {
        type: 'Car Carrying'
      }
    };
    const resCreate = mockRes();
    await LoadController.create(reqCreate, resCreate, (err) => { if (err) throw err; });

    assert.strictEqual(resCreate.statusCode, 403, 'Normal driver creation must return Forbidden (403)');
    console.log('  ✓ Standard driver without owner_operator_load_create permission is blocked from creating loads.');

  } catch (err) {
    console.error('  ✗ Test 1 failed:', err.stack);
    failures++;
  }

  // Test 2: Shift Scoping for Driver
  try {
    console.log('Test 2: Enforcing Driver boundaries on Shifts...');
    const ShiftController = require('../src/controllers/ShiftController');

    // Create a shift for Driver A and Driver B
    const shiftA = await prisma.shift.create({
      data: {
        userId: userDriverA.id,
        driverId: driverA.id,
        role: 'Car Carrier Driver',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        companyId: company.id
      }
    });

    const shiftB = await prisma.shift.create({
      data: {
        userId: userDriverB.id,
        driverId: driverB.id,
        role: 'Car Carrier Driver',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        companyId: company.id
      }
    });

    // Driver A retrieves shifts - should only return shift A
    const reqGet = {
      tenantId: company.id,
      user: {
        id: userDriverA.id,
        userId: userDriverA.id,
        role: 'DRIVER'
      },
      query: {}
    };
    const resGet = mockRes();
    await ShiftController.getAll(reqGet, resGet, (err) => { if (err) throw err; });

    const shifts = resGet.body.data || resGet.body;
    const hasShiftA = shifts.some(s => s.id === shiftA.id);
    const hasShiftB = shifts.some(s => s.id === shiftB.id);

    assert.strictEqual(hasShiftA, true, 'Driver A must see Shift A');
    assert.strictEqual(hasShiftB, false, 'Driver A must NOT see Shift B');
    console.log('  ✓ Driver can only retrieve their own shifts.');

  } catch (err) {
    console.error('  ✗ Test 2 failed:', err.stack);
    failures++;
  }

  // Cleanup test data
  try {
    console.log('Cleanup: Cleaning up database records...');
    await prisma.shift.deleteMany({ where: { companyId: company.id } });
    await prisma.load.deleteMany({ where: { companyId: company.id } });
    await prisma.driver.deleteMany({ where: { companyId: company.id } });
    await prisma.user.deleteMany({ where: { companyId: company.id } });
    await prisma.customPermission.deleteMany({ where: { role: { companyId: company.id } } });
    await prisma.customRole.deleteMany({ where: { companyId: company.id } });
    await prisma.company.delete({ where: { id: company.id } });
    console.log('  ✓ Cleanup finished.');
  } catch (err) {
    console.error('  Cleanup warning:', err.message);
  }

  if (failures > 0) {
    console.log(`--- FLOW COMPLIANCE TESTS FAILED WITH ${failures} FAILURE(S) ---`);
    process.exit(1);
  } else {
    console.log('--- ALL DRIVER COMPLIANCE TESTS PASSED SUCCESSFULLY ---');
    process.exit(0);
  }
}

runTests();
