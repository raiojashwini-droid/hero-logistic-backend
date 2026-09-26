const assert = require('assert');
const prisma = require('../src/utils/prismaClient');

// Mock request / response objects
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
  console.log('--- STARTING DISPATCHER PORTAL & COMPLIANCE TESTS ---');
  let failures = 0;

  // Setup test data
  let company;
  let branchA;
  let branchB;
  let userDispatcherBranchA;
  let userDispatcherCross;
  
  let driverBranchA;
  let driverBranchB;
  let vehicleBranchA;
  let vehicleBranchB;
  let loadBranchA;
  let loadBranchB;
  let customerBranchA;
  let customerBranchB;

  try {
    console.log('Setup: Creating test company, branches and users...');
    company = await prisma.company.create({
      data: {
        name: `Dispatcher Test Co ${Date.now()}`,
        status: 'ACTIVE'
      }
    });

    branchA = await prisma.branch.create({
      data: {
        name: 'Branch A (Sydney)',
        location: 'Sydney',
        companyId: company.id
      }
    });

    branchB = await prisma.branch.create({
      data: {
        name: 'Branch B (Melbourne)',
        location: 'Melbourne',
        companyId: company.id
      }
    });

    // Custom role for Dispatcher
    const customRoleDispatcher = await prisma.customRole.create({
      data: {
        name: `Test Dispatcher Role ${Date.now()}`,
        companyId: company.id,
        permissions: {
          create: [
            { actionString: 'loads.view', module: 'LOADS' },
            { actionString: 'drivers.view', module: 'DRIVERS' }
          ]
        }
      }
    });

    // Custom role with cross-branch view permission
    const customRoleCross = await prisma.customRole.create({
      data: {
        name: `Test Dispatcher Cross Role ${Date.now()}`,
        companyId: company.id,
        permissions: {
          create: [
            { actionString: 'loads.view', module: 'LOADS' },
            { actionString: 'drivers.view', module: 'DRIVERS' },
            { actionString: 'dispatch.cross_branch.view', module: 'LOADS' }
          ]
        }
      }
    });

    // Dispatcher assigned to Branch A
    userDispatcherBranchA = await prisma.user.create({
      data: {
        email: `dispA-${Date.now()}@test.com`,
        password: 'hash',
        name: 'Sydney Dispatcher',
        role: 'DISPATCHER',
        companyId: company.id,
        branchId: branchA.id,
        customRoleId: customRoleDispatcher.id
      }
    });

    // Dispatcher with cross-branch view permission
    userDispatcherCross = await prisma.user.create({
      data: {
        email: `dispCross-${Date.now()}@test.com`,
        password: 'hash',
        name: 'Cross Dispatcher',
        role: 'DISPATCHER',
        companyId: company.id,
        branchId: branchA.id,
        customRoleId: customRoleCross.id
      }
    });

    // Create branch-scoped drivers
    driverBranchA = await prisma.driver.create({
      data: {
        firstName: 'Sydney',
        lastName: 'Driver',
        driverCode: `DRV-A-${Date.now()}`,
        licenseNumber: `LIC-A-${Date.now()}`,
        companyId: company.id,
        branchId: branchA.id
      }
    });

    driverBranchB = await prisma.driver.create({
      data: {
        firstName: 'Melbourne',
        lastName: 'Driver',
        driverCode: `DRV-B-${Date.now()}`,
        licenseNumber: `LIC-B-${Date.now()}`,
        companyId: company.id,
        branchId: branchB.id
      }
    });

    // Create branch-scoped vehicles
    vehicleBranchA = await prisma.vehicle.create({
      data: {
        rego: `REG-A-${Date.now()}`,
        vin: `VIN-A-${Date.now()}`,
        companyId: company.id,
        branchId: branchA.id
      }
    });

    vehicleBranchB = await prisma.vehicle.create({
      data: {
        rego: `REG-B-${Date.now()}`,
        vin: `VIN-B-${Date.now()}`,
        companyId: company.id,
        branchId: branchB.id
      }
    });

    // Create branch-scoped loads
    loadBranchA = await prisma.load.create({
      data: {
        loadRef: `LD-A-${Date.now()}`,
        type: 'Car Carrying',
        companyId: company.id,
        branchId: branchA.id
      }
    });

    loadBranchB = await prisma.load.create({
      data: {
        loadRef: `LD-B-${Date.now()}`,
        type: 'General Freight',
        companyId: company.id,
        branchId: branchB.id
      }
    });

    // Create branch-scoped customers
    customerBranchA = await prisma.customer.create({
      data: {
        name: `Cust A ${Date.now()}`,
        companyId: company.id,
        branchId: branchA.id
      }
    });

    customerBranchB = await prisma.customer.create({
      data: {
        name: `Cust B ${Date.now()}`,
        companyId: company.id,
        branchId: branchB.id
      }
    });

    console.log('  ✓ Setup completed successfully.');
  } catch (err) {
    console.error('  ✗ Setup failed:', err.message);
    process.exit(1);
  }

  // Test 1: Branch Scoping check on Load operations
  try {
    console.log('Test 1: Enforcing Branch scoping on Load operations...');
    const LoadController = require('../src/controllers/LoadController');

    // 1. Sydney Dispatcher retrieves loads - should only return Branch A load
    const reqGetLoads = {
      tenantId: company.id,
      user: {
        id: userDispatcherBranchA.id,
        userId: userDispatcherBranchA.id,
        role: 'DISPATCHER',
        branchId: branchA.id,
        permissions: ['loads.view']
      },
      query: {}
    };
    const resGetLoads = mockRes();
    await LoadController.getAll(reqGetLoads, resGetLoads, (err) => { if (err) throw err; });
    
    const loadedData = resGetLoads.body.data || resGetLoads.body;

    assert(Array.isArray(loadedData), 'Loads response must be an array');
    
    const hasLoadA = loadedData.some(l => l.id === loadBranchA.loadRef || l.dbId === loadBranchA.id || l.id === loadBranchA.id);
    const hasLoadB = loadedData.some(l => l.id === loadBranchB.loadRef || l.dbId === loadBranchB.id || l.id === loadBranchB.id);
    
    assert.strictEqual(hasLoadA, true, 'Loads should contain Branch A load');
    assert.strictEqual(hasLoadB, false, 'Loads should NOT contain Branch B load');
    console.log('  ✓ Branch-limited dispatcher can only see loads from their branch.');

    // 2. Cross-branch dispatcher retrieves loads - should return both loads
    const reqGetLoadsCross = {
      tenantId: company.id,
      user: {
        id: userDispatcherCross.id,
        userId: userDispatcherCross.id,
        role: 'DISPATCHER',
        branchId: branchA.id,
        permissions: ['loads.view', 'dispatch.cross_branch.view']
      },
      query: {}
    };
    const resGetLoadsCross = mockRes();
    await LoadController.getAll(reqGetLoadsCross, resGetLoadsCross, (err) => { if (err) throw err; });
    
    const loadedDataCross = resGetLoadsCross.body.data || resGetLoadsCross.body;
    const hasLoadACross = loadedDataCross.some(l => l.id === loadBranchA.loadRef || l.dbId === loadBranchA.id || l.id === loadBranchA.id);
    const hasLoadBCross = loadedDataCross.some(l => l.id === loadBranchB.loadRef || l.dbId === loadBranchB.id || l.id === loadBranchB.id);
    
    assert.strictEqual(hasLoadACross, true, 'Cross-branch dispatcher should see Branch A load');
    assert.strictEqual(hasLoadBCross, true, 'Cross-branch dispatcher should see Branch B load');
    console.log('  ✓ Cross-branch dispatcher can see loads from all branches.');

  } catch (err) {
    console.error('  ✗ Test 1 failed:', err.stack);
    failures++;
  }

  // Test 2: Branch Scoping check on Driver operations
  try {
    console.log('Test 2: Enforcing Branch scoping on Driver operations...');
    const DriverController = require('../src/controllers/DriverController');

    // Sydney Dispatcher retrieves drivers - should only return Branch A driver
    const reqGetDrivers = {
      tenantId: company.id,
      user: {
        id: userDispatcherBranchA.id,
        userId: userDispatcherBranchA.id,
        role: 'DISPATCHER',
        branchId: branchA.id,
        permissions: ['drivers.view']
      },
      query: {}
    };
    const resGetDrivers = mockRes();
    await DriverController.getAll(reqGetDrivers, resGetDrivers, (err) => { if (err) throw err; });
    
    const driversList = resGetDrivers.body.data || resGetDrivers.body;
    const hasDriverA = driversList.some(d => d.id === driverBranchA.id);
    const hasDriverB = driversList.some(d => d.id === driverBranchB.id);
    
    assert.strictEqual(hasDriverA, true, 'Drivers list should contain Branch A driver');
    assert.strictEqual(hasDriverB, false, 'Drivers list should NOT contain Branch B driver');
    console.log('  ✓ Branch-limited dispatcher can only see drivers from their branch.');

  } catch (err) {
    console.error('  ✗ Test 2 failed:', err.stack);
    failures++;
  }

  // Cleanup test data
  try {
    console.log('Cleanup: Cleaning up database records...');
    // We can delete the company; cascading relationships or manual deletes
    await prisma.load.deleteMany({ where: { companyId: company.id } });
    await prisma.driver.deleteMany({ where: { companyId: company.id } });
    await prisma.vehicle.deleteMany({ where: { companyId: company.id } });
    await prisma.customer.deleteMany({ where: { companyId: company.id } });
    await prisma.user.deleteMany({ where: { companyId: company.id } });
    await prisma.customPermission.deleteMany({ where: { role: { companyId: company.id } } });
    await prisma.customRole.deleteMany({ where: { companyId: company.id } });
    await prisma.branch.deleteMany({ where: { companyId: company.id } });
    await prisma.company.delete({ where: { id: company.id } });
    console.log('  ✓ Cleanup finished.');
  } catch (err) {
    console.error('  Cleanup warning:', err.message);
  }

  if (failures > 0) {
    console.log(`--- FLOW COMPLIANCE TESTS FAILED WITH ${failures} FAILURE(S) ---`);
    process.exit(1);
  } else {
    console.log('--- ALL DISPATCHER COMPLIANCE TESTS PASSED SUCCESSFULLY ---');
    process.exit(0);
  }
}

runTests();
