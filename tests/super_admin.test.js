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
  console.log('--- STARTING SUPER ADMIN FLOW & COMPLIANCE TESTS ---');
  let failures = 0;

  // Setup test data
  const companyName = `Test Isolation Co ${Date.now()}`;
  let testCompany;
  let testUser;
  let anotherCompany;

  try {
    // Test 1: Company Provisioning Transaction (Phase 3)
    console.log('Test 1: Provision Company Transaction...');
    const CompanyController = require('../src/controllers/CompanyController');
    const req = {
      body: {
        name: companyName,
        adminEmail: `admin@${Date.now()}.com`,
        adminPassword: 'TestPassword123',
        planTier: 'Hero Pro',
        tenantId: `T-${Date.now()}`
      }
    };
    const res = mockRes();
    await CompanyController.create(req, res, (err) => { if (err) throw err; });
    
    assert.strictEqual(res.statusCode, 201);
    assert.ok(res.body.success);
    testCompany = res.body.data;
    console.log(`  ✓ Company provisioned successfully: ${testCompany.name} (ID: ${testCompany.id})`);

    // Verify Company admin user was created in transaction
    const adminUser = await prisma.user.findFirst({
      where: { email: req.body.adminEmail }
    });
    assert.ok(adminUser);
    assert.strictEqual(adminUser.companyId, testCompany.id);
    assert.strictEqual(adminUser.role, 'COMPANY_ADMIN');
    console.log(`  ✓ Company Admin user verified inside company.`);
  } catch (err) {
    console.error('  ✗ Test 1 failed:', err.message);
    failures++;
  }

  try {
    // Test 2: User Role Company Ownership Constraints (Phase 2)
    console.log('Test 2: Enforcing Platform roles companyId constraint...');
    const UserController = require('../src/controllers/UserController');
    
    // Creating platform user should force companyId to null
    const req = {
      body: {
        name: 'Technical Support Staff',
        email: `support@${Date.now()}.com`,
        password: 'StaffPass123',
        role: 'TECHNICAL_SUPPORT',
        companyId: testCompany.id // should be overridden to null
      }
    };
    const res = mockRes();
    await UserController.create(req, res, (err) => { if (err) throw err; });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.data.companyId, null);
    console.log(`  ✓ Platform user (TECHNICAL_SUPPORT) companyId correctly set to NULL.`);

    // Creating tenant user should require or bind companyId
    const req2 = {
      body: {
        name: 'Dispatcher User',
        email: `dispatcher@${Date.now()}.com`,
        password: 'StaffPass123',
        role: 'DISPATCHER',
        companyId: testCompany.id
      }
    };
    const res2 = mockRes();
    await UserController.create(req2, res2, (err) => { if (err) throw err; });
    assert.strictEqual(res2.statusCode, 201);
    assert.strictEqual(res2.body.data.companyId, testCompany.id);
    console.log(`  ✓ Tenant user (DISPATCHER) companyId correctly set to ${testCompany.id}.`);
  } catch (err) {
    console.error('  ✗ Test 2 failed:', err.message);
    failures++;
  }

  try {
    // Create another company for isolation testing
    anotherCompany = await prisma.company.create({
      data: { name: `Another Co ${Date.now()}`, tenantId: `T-ALT-${Date.now()}` }
    });

    // Create a driver in testCompany
    const driver = await prisma.driver.create({
      data: { firstName: 'John', lastName: 'Doe', companyId: testCompany.id }
    });

    // Test 3: Tenant Isolation Security (Phase 7)
    console.log('Test 3: Enforcing Tenant Isolation on Driver updates...');
    const DriverController = require('../src/controllers/DriverController');
    
    // Attempting to update the driver under another company's tenant scope should fail
    const req = {
      params: { id: driver.id },
      tenantId: anotherCompany.id,
      body: { name: 'Hacked Driver' }
    };
    const res = mockRes();
    await DriverController.update(req, res, (err) => { if (err) throw err; });
    
    assert.strictEqual(res.statusCode, 404);
    assert.ok(res.body.error.message.includes('company context') || res.body.error.message.includes('not found'));
    console.log(`  ✓ Isolated update request blocked and returned 404/403 as expected.`);

    // Attempting to delete the driver under another company's tenant scope should fail
    const req2 = {
      params: { id: driver.id },
      tenantId: anotherCompany.id
    };
    const res2 = mockRes();
    await DriverController.delete(req2, res2, (err) => { if (err) throw err; });
    assert.strictEqual(res2.statusCode, 404);
    console.log(`  ✓ Isolated delete request blocked and returned 404/403 as expected.`);
  } catch (err) {
    console.error('  ✗ Test 3 failed:', err.message);
    failures++;
  }

  try {
    // Test 4: Impersonation Endpoint and Audit Session Logging (Phase 4)
    console.log('Test 4: Simulating Super Admin Impersonation Session...');
    const AuthController = require('../src/controllers/AuthController');

    // Create a target tenant user to impersonate
    const targetUser = await prisma.user.create({
      data: {
        name: 'Target Driver User',
        email: `target@${Date.now()}.com`,
        password: 'targetPass123',
        role: 'DRIVER',
        companyId: testCompany.id
      }
    });

    const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    const realSuperAdminId = superAdmin ? superAdmin.id : 'superadmin-actor-id';

    // Request impersonation as a Super Admin
    const req = {
      user: { id: realSuperAdminId, role: 'SUPER_ADMIN' },
      body: {
        targetUserId: targetUser.id,
        reason: 'Investigating load assignment error'
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Platform-Verification-Test' }
    };
    const res = mockRes();
    await AuthController.impersonate(req, res, (err) => { if (err) throw err; });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers.accessToken);
    
    // Decode token to verify impersonation context is present
    const decoded = jwt.decode(res.headers.accessToken);
    assert.strictEqual(decoded.userId, targetUser.id);
    assert.strictEqual(decoded.impersonatedTenantId, testCompany.id);
    assert.strictEqual(decoded.actorId, req.user.id);
    assert.strictEqual(decoded.isImpersonating, true);
    console.log(`  ✓ Impersonation JWT claims verified.`);

    // Verify audit log record exists in DB
    const session = await prisma.impersonationSession.findFirst({
      where: { actorId: req.user.id, targetUserId: targetUser.id }
    });
    assert.ok(session);
    assert.strictEqual(session.targetCompanyId, testCompany.id);
    assert.strictEqual(session.reason, req.body.reason);
    console.log(`  ✓ Impersonation session successfully audited to DB.`);

    // Test Exit Impersonation
    const reqExit = {
      user: decoded
    };
    const resExit = mockRes();
    await AuthController.exitImpersonate(reqExit, resExit, (err) => { if (err) throw err; });
    assert.strictEqual(resExit.statusCode, 200);
    
    const decodedOriginal = jwt.decode(resExit.headers.accessToken);
    assert.strictEqual(decodedOriginal.userId, req.user.id);
    assert.strictEqual(decodedOriginal.role, req.user.role);
    assert.ok(!decodedOriginal.isImpersonating);
    console.log(`  ✓ Exit impersonation session restores original Super Admin identity token.`);
  } catch (err) {
    console.error('  ✗ Test 4 failed:', err.message);
    failures++;
  }

  // Cleanup test data
  try {
    if (testCompany) {
      await prisma.user.deleteMany({ where: { companyId: testCompany.id } });
      await prisma.tenantSubscription.deleteMany({ where: { companyId: testCompany.id } });
      await prisma.billingRecord.deleteMany({ where: { companyId: testCompany.id } });
      await prisma.driver.deleteMany({ where: { companyId: testCompany.id } });
      await prisma.company.delete({ where: { id: testCompany.id } });
    }
    if (anotherCompany) {
      await prisma.company.delete({ where: { id: anotherCompany.id } });
    }
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  }

  console.log('----------------------------------------------------');
  if (failures > 0) {
    console.error(`✗ TEST SUITE FAILED with ${failures} assertion failures.`);
    process.exit(1);
  } else {
    console.log('✔ ALL SUPER ADMIN SPECIFICATION COMPLIANCE TESTS PASSED.');
    process.exit(0);
  }
}

runTests();
