const assert = require('assert');
const prisma = require('../src/utils/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  console.log('--- STARTING COMPANY ADMIN FLOW & COMPLIANCE TESTS ---');
  let failures = 0;

  // Setup test data
  let companyA;
  let companyB;
  let branchA;
  let branchB;
  let driverA;
  let vehicleA;
  let loadA;

  try {
    // 1. Setup companies
    console.log('Setup: Creating test companies and branches...');
    companyA = await prisma.company.create({
      data: {
        name: `Company A ${Date.now()}`,
        status: 'ACTIVE'
      }
    });

    companyB = await prisma.company.create({
      data: {
        name: `Company B ${Date.now()}`,
        status: 'ACTIVE'
      }
    });

    branchA = await prisma.branch.create({
      data: {
        name: 'Branch A',
        location: 'Sydney',
        companyId: companyA.id
      }
    });

    branchB = await prisma.branch.create({
      data: {
        name: 'Branch B',
        location: 'Melbourne',
        companyId: companyB.id
      }
    });

    console.log('  ✓ Setup completed successfully.');
  } catch (err) {
    console.error('  ✗ Setup failed:', err.message);
    failures++;
    return process.exit(1);
  }

  // Test 1: Tenant A creating a driver, Tenant B should not see or edit it
  try {
    console.log('Test 1: Tenant isolation on Driver operations...');
    const DriverController = require('../src/controllers/DriverController');

    // Create under Company A
    const reqCreate = {
      tenantId: companyA.id,
      body: {
        firstName: 'John',
        lastName: 'Doe',
        driverCode: `DRV-${Date.now().toString().slice(-5)}`,
        branchId: branchA.id
      }
    };
    const resCreate = mockRes();
    await DriverController.create(reqCreate, resCreate, (err) => { if (err) throw err; });
    assert.strictEqual(resCreate.statusCode, 201);
    driverA = resCreate.body.data;
    assert.strictEqual(driverA.companyId, companyA.id);
    console.log('  ✓ Driver created successfully under Company A.');

    // Query under Company B - should not list Driver A
    const reqListB = {
      tenantId: companyB.id,
      query: {}
    };
    const resListB = mockRes();
    await DriverController.getAll(reqListB, resListB, (err) => { if (err) throw err; });
    const driversInB = resListB.body.data || [];
    const foundDriverAInB = driversInB.some(d => d.id === driverA.id);
    assert.strictEqual(foundDriverAInB, false);
    console.log('  ✓ Driver A not returned in Company B listings.');

    // Attempt to update Driver A under Company B context - should fail with 404
    const reqUpdateB = {
      tenantId: companyB.id,
      params: { id: driverA.id },
      body: { firstName: 'HackedName' },
      headers: {}
    };
    const resUpdateB = mockRes();
    await DriverController.update(reqUpdateB, resUpdateB, (err) => { if (err) throw err; });
    assert.strictEqual(resUpdateB.statusCode, 404);
    console.log('  ✓ Update rejected with 404 under unauthorized Company B context.');
  } catch (err) {
    console.error('  ✗ Test 1 failed:', err.message);
    failures++;
  }

  // Test 2: Tenant isolation on Vehicle operations
  try {
    console.log('Test 2: Tenant isolation on Vehicle operations...');
    const VehicleController = require('../src/controllers/VehicleController');

    // Create under Company A
    const reqCreate = {
      tenantId: companyA.id,
      body: {
        rego: `REG-${Date.now().toString().slice(-4)}`,
        category: 'TRUCK',
        make: 'Volvo'
      }
    };
    const resCreate = mockRes();
    await VehicleController.create(reqCreate, resCreate, (err) => { if (err) throw err; });
    assert.strictEqual(resCreate.statusCode, 201);
    vehicleA = resCreate.body.data;
    assert.strictEqual(vehicleA.companyId, companyA.id);
    console.log('  ✓ Vehicle created successfully under Company A.');

    // Query under Company B - should not list Vehicle A
    const reqListB = {
      tenantId: companyB.id,
      query: {}
    };
    const resListB = mockRes();
    await VehicleController.getAll(reqListB, resListB, (err) => { if (err) throw err; });
    const vehiclesInB = resListB.body.data || [];
    const foundVehicleAInB = vehiclesInB.some(v => v.id === vehicleA.id);
    assert.strictEqual(foundVehicleAInB, false);
    console.log('  ✓ Vehicle A not returned in Company B listings.');
  } catch (err) {
    console.error('  ✗ Test 2 failed:', err.message);
    failures++;
  }

  // Test 3: Branch scoping on Warehouse and Asset creation
  try {
    console.log('Test 3: Enforcing branch boundary constraints on Warehouse/Asset creation...');
    const CompanyAdminPortalController = require('../src/controllers/CompanyAdminPortalController');

    // Create warehouse in Company A, referencing Branch B (belongs to Company B) - should fail
    const reqCreateWH = {
      tenantId: companyA.id,
      body: {
        name: 'Malicious Warehouse',
        branchId: branchB.id
      }
    };
    const resCreateWH = mockRes();
    await CompanyAdminPortalController.createWarehouse(reqCreateWH, resCreateWH, (err) => { if (err) throw err; });
    assert.strictEqual(resCreateWH.statusCode, 404);
    console.log('  ✓ Warehouse creation rejected when branch belongs to different company.');

    // Create asset in Company A, referencing Branch B - should fail
    const reqCreateAsset = {
      tenantId: companyA.id,
      body: {
        assetId: `AST-${Date.now().toString().slice(-4)}`,
        name: 'Forklift',
        category: 'Machinery',
        type: 'Diesel',
        branchId: branchB.id
      }
    };
    const resCreateAsset = mockRes();
    await CompanyAdminPortalController.createAsset(reqCreateAsset, resCreateAsset, (err) => { if (err) throw err; });
    assert.strictEqual(resCreateAsset.statusCode, 404);
    console.log('  ✓ Asset creation rejected when branch belongs to different company.');
  } catch (err) {
    console.error('  ✗ Test 3 failed:', err.message);
    failures++;
  }

  // Test 4: UserController tenant scoping and role restrictions
  let createdUserInA;
  try {
    console.log('Test 4: UserController tenant boundaries & role enforcement...');
    const UserController = require('../src/controllers/UserController');

    // Company Admin attempting to create a Platform user (like PLATFORM_ADMIN) - should be blocked with 403
    const reqCreatePlatform = {
      tenantId: companyA.id,
      body: {
        name: 'Technical Support',
        email: `support-${Date.now()}@platform.com`,
        role: 'PLATFORM_ADMIN'
      }
    };
    const resCreatePlatform = mockRes();
    await UserController.create(reqCreatePlatform, resCreatePlatform, (err) => { if (err) throw err; });
    assert.strictEqual(resCreatePlatform.statusCode, 403);
    console.log('  ✓ Creation of Platform user by Tenant Admin rejected with 403.');

    // Company Admin creating a valid Dispatcher user - should succeed and assign companyId A
    const reqCreateValid = {
      tenantId: companyA.id,
      body: {
        name: 'Dispatcher Joe',
        email: `joe-${Date.now()}@comp-a.com`,
        role: 'Dispatcher'
      }
    };
    const resCreateValid = mockRes();
    await UserController.create(reqCreateValid, resCreateValid, (err) => { if (err) throw err; });
    if (resCreateValid.statusCode !== 201) {
      console.log('DEBUG resCreateValid body:', resCreateValid.body);
    }
    assert.strictEqual(resCreateValid.statusCode, 201);
    createdUserInA = resCreateValid.body.data;
    assert.strictEqual(createdUserInA.companyId, companyA.id);
    assert.strictEqual(createdUserInA.role, 'DISPATCHER');
    console.log('  ✓ Tenant user (DISPATCHER) successfully created under Company A context.');

    // Query under Company B - should not list user created under Company A
    const reqListUsersB = {
      tenantId: companyB.id,
      query: {}
    };
    const resListUsersB = mockRes();
    await UserController.getAll(reqListUsersB, resListUsersB, (err) => { if (err) throw err; });
    const usersInB = resListUsersB.body.data || [];
    const foundUserInB = usersInB.some(u => u.id === createdUserInA.id);
    assert.strictEqual(foundUserInB, false);
    console.log('  ✓ User created in Company A is not visible in Company B listings.');
  } catch (err) {
    console.error('  ✗ Test 4 failed:', err.message);
    failures++;
  }

  // Cleanup test data
  try {
    console.log('Cleanup: Cleaning up database records...');
    if (createdUserInA) await prisma.user.delete({ where: { id: createdUserInA.id } }).catch(() => {});
    if (driverA) await prisma.driver.delete({ where: { id: driverA.id } }).catch(() => {});
    if (vehicleA) await prisma.vehicle.delete({ where: { id: vehicleA.id } }).catch(() => {});
    if (branchA) await prisma.branch.delete({ where: { id: branchA.id } }).catch(() => {});
    if (branchB) await prisma.branch.delete({ where: { id: branchB.id } }).catch(() => {});
    if (companyA) await prisma.company.delete({ where: { id: companyA.id } }).catch(() => {});
    if (companyB) await prisma.company.delete({ where: { id: companyB.id } }).catch(() => {});
    console.log('  ✓ Cleanup finished.');
  } catch (err) {
    console.warn('  ⚠ Cleanup failed to complete cleanly:', err.message);
  }

  if (failures > 0) {
    console.error(`--- FLOW COMPLIANCE TESTS FAILED WITH ${failures} FAILURE(S) ---`);
    process.exit(1);
  } else {
    console.log('--- ALL COMPANY ADMIN COMPLIANCE TESTS PASSED SUCCESSFULLY ---');
    process.exit(0);
  }
}

runTests();
