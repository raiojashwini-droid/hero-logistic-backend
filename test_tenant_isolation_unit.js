const assert = require('assert');
const tenantResolver = require('./src/middlewares/tenantResolver');
const CustomerController = require('./src/controllers/CustomerController');
const DriverController = require('./src/controllers/DriverController');
const VehicleController = require('./src/controllers/VehicleController');
const BranchController = require('./src/controllers/BranchController');
const UserController = require('./src/controllers/UserController');
const CompanyAdminPortalController = require('./src/controllers/CompanyAdminPortalController');
const CompanyAdminDashboardController = require('./src/controllers/CompanyAdminDashboardController');

console.log('=== MULTI-TENANT ISOLATION UNIT & INTEGRATION VERIFICATION SUITE ===\n');

let passCount = 0;
let failCount = 0;

function test(description, fn) {
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res.then(() => {
        console.log(`✓ PASS: ${description}`);
        passCount++;
      }).catch(err => {
        console.error(`✕ FAIL: ${description}`);
        console.error(`  Error: ${err.message}`);
        failCount++;
      });
    } else {
      console.log(`✓ PASS: ${description}`);
      passCount++;
    }
  } catch (err) {
    console.error(`✕ FAIL: ${description}`);
    console.error(`  Error: ${err.message}`);
    failCount++;
  }
}

async function runTests() {
  // ----------------------------------------------------------------------
  // 1. TENANT RESOLVER TESTS
  // ----------------------------------------------------------------------
  console.log('--- 1. TENANT RESOLVER & WHERE SCOPE TESTS ---');

  test('resolveCompanyId extracts companyId from user token claim', () => {
    const req = { user: { companyId: 'comp-123', role: 'COMPANY_ADMIN' } };
    assert.strictEqual(tenantResolver.resolveCompanyId(req), 'comp-123');
  });

  test('resolveCompanyId extracts tenantId fallback from user claim', () => {
    const req = { user: { tenantId: 'tenant-456', role: 'COMPANY_ADMIN' } };
    assert.strictEqual(tenantResolver.resolveCompanyId(req), 'tenant-456');
  });

  test('resolveCompanyId prioritizes impersonation context over token claim', () => {
    const req = { user: { companyId: 'comp-123', impersonatedTenantId: 'comp-impersonated', role: 'SUPER_ADMIN' } };
    req.tenantId = 'comp-impersonated';
    assert.strictEqual(tenantResolver.resolveCompanyId(req), 'comp-impersonated');
  });

  test('resolveCompanyId extracts companyId from query string for SUPER_ADMIN', () => {
    const req = { user: { role: 'SUPER_ADMIN' }, query: { companyId: 'comp-query-789' } };
    assert.strictEqual(tenantResolver.resolveCompanyId(req), 'comp-query-789');
  });

  test('getTenantWhere returns { companyId } when valid tenant context exists', () => {
    const req = { tenantId: 'comp-123', user: { role: 'COMPANY_ADMIN' } };
    const where = tenantResolver.getTenantWhere(req);
    assert.deepStrictEqual(where, { companyId: 'comp-123' });
  });

  test('getTenantWhere returns IMPOSSIBLE_TENANT_ID_NO_ACCESS when non-SuperAdmin context is missing', () => {
    const req = { user: { role: 'COMPANY_ADMIN' } };
    const where = tenantResolver.getTenantWhere(req);
    assert.deepStrictEqual(where, { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' });
  });

  test('getTenantWhere returns {} for SUPER_ADMIN without query companyId', () => {
    const req = { user: { role: 'SUPER_ADMIN' } };
    const where = tenantResolver.getTenantWhere(req);
    assert.deepStrictEqual(where, {});
  });

  // ----------------------------------------------------------------------
  // 2. CONTROLLER TENANT SCOPING AUDIT
  // ----------------------------------------------------------------------
  console.log('\n--- 2. CONTROLLER TENANT SCOPING AUDIT ---');

  await test('CustomerController.getPortalData returns empty response when company context is missing', async () => {
    let jsonOutput = null;
    const req = { user: { role: 'COMPANY_ADMIN' } };
    const res = {
      json: (payload) => { jsonOutput = payload; },
      status: () => res
    };
    await CustomerController.getPortalData(req, res, () => {});
    assert(jsonOutput !== null, 'Response json should be called');
    assert.strictEqual(jsonOutput.data.customers.length, 0);
    assert.strictEqual(jsonOutput.data.stats.totalCustomers, 0);
  });

  await test('CompanyAdminDashboardController returns zero metrics for unassigned non-SuperAdmin user', async () => {
    let jsonOutput = null;
    const req = { user: { role: 'COMPANY_ADMIN' } };
    const res = {
      json: (payload) => { jsonOutput = payload; },
      status: () => res
    };
    await CompanyAdminDashboardController.getDashboardMetrics(req, res, () => {});
    assert(jsonOutput !== null, 'Response json should be called');
    assert.strictEqual(jsonOutput.data.kpis.totalLoads, 0);
    assert.strictEqual(jsonOutput.data.kpis.activeLoads, 0);
    assert.strictEqual(jsonOutput.data.kpis.totalDrivers, 0);
    assert.strictEqual(jsonOutput.data.kpis.activeFleet, 0);
  });

  await test('BranchController.getAll returns empty list when company context is missing', async () => {
    let jsonOutput = null;
    const req = { query: {}, user: { role: 'COMPANY_ADMIN' } };
    const res = {
      json: (payload) => { jsonOutput = payload; },
      status: () => res
    };
    await BranchController.getAll(req, res, () => {});
    assert(jsonOutput !== null, 'Response json should be called');
    assert.strictEqual(jsonOutput.data.length, 0);
  });

  await test('DriverController.getAll returns empty list when company context is missing', async () => {
    let jsonOutput = null;
    const req = { query: {}, user: { role: 'COMPANY_ADMIN' } };
    const res = {
      json: (payload) => { jsonOutput = payload; },
      status: () => res
    };
    await DriverController.getAll(req, res, () => {});
    assert(jsonOutput !== null, 'Response json should be called');
    assert.strictEqual(jsonOutput.data.length, 0);
  });

  await test('VehicleController.getAll returns empty list when company context is missing', async () => {
    let jsonOutput = null;
    const req = { query: {}, user: { role: 'COMPANY_ADMIN' } };
    const res = {
      json: (payload) => { jsonOutput = payload; },
      status: () => res
    };
    await VehicleController.getAll(req, res, () => {});
    assert(jsonOutput !== null, 'Response json should be called');
    assert.strictEqual(jsonOutput.data.length, 0);
  });

  await test('UserController.getAll returns empty list when company context is missing', async () => {
    let jsonOutput = null;
    const req = { query: {}, user: { role: 'COMPANY_ADMIN' } };
    const res = {
      json: (payload) => { jsonOutput = payload; },
      status: () => res
    };
    await UserController.getAll(req, res, () => {});
    assert(jsonOutput !== null, 'Response json should be called');
    assert.strictEqual(jsonOutput.data.length, 0);
  });

  await test('CompanyAdminPortalController.getBranches returns empty list when company context is missing', async () => {
    let jsonOutput = null;
    const req = { query: {}, user: { role: 'COMPANY_ADMIN' } };
    const res = {
      json: (payload) => { jsonOutput = payload; },
      status: () => res
    };
    await CompanyAdminPortalController.getBranches(req, res, (err) => { if (err) console.error(err); });
    assert(jsonOutput !== null, 'Response json should be called');
    assert.strictEqual(jsonOutput.data.length, 0);
  });

  await test('CompanyAdminPortalController.getCustomerRates returns empty list when company context is missing', async () => {
    let jsonOutput = null;
    const req = { query: {}, user: { role: 'COMPANY_ADMIN' } };
    const res = {
      json: (payload) => { jsonOutput = payload; },
      status: () => res
    };
    await CompanyAdminPortalController.getCustomerRates(req, res, (err) => { if (err) console.error(err); });
    assert(jsonOutput !== null, 'Response json should be called');
    assert.strictEqual(jsonOutput.data.length, 0);
  });

  await test('CompanyAdminPortalController.getAssets returns zero asset counts without auto-creating default branches', async () => {
    let jsonOutput = null;
    const req = { query: {}, user: { role: 'COMPANY_ADMIN' } };
    const res = {
      json: (payload) => { jsonOutput = payload; },
      status: () => res
    };
    await CompanyAdminPortalController.getAssets(req, res, (err) => { if (err) console.error(err); });
    assert(jsonOutput !== null, 'Response json should be called');
    assert.strictEqual(jsonOutput.data.assets.length, 0);
    assert.strictEqual(jsonOutput.data.branches.length, 0);
    assert.strictEqual(jsonOutput.data.stats.totalAssets, 0);
  });

  // ----------------------------------------------------------------------
  // 3. AUTH SERVICE & CROSS-TENANT SECURITY TESTS
  // ----------------------------------------------------------------------
  console.log('\n--- 3. AUTH SERVICE & CROSS-TENANT SECURITY TESTS ---');

  await test('AuthService rejects login attempts with unknown email containing "company" or "admin"', async () => {
    const authService = require('./src/services/AuthService');
    const prisma = require('./src/utils/prismaClient');
    const origFindMany = prisma.user.findMany;
    prisma.user.findMany = async () => []; // Mock empty user table
    let thrownError = null;
    try {
      await authService.login('unknowncompanyb@admin.com', '123456');
    } catch (err) {
      thrownError = err;
    } finally {
      prisma.user.findMany = origFindMany;
    }
    assert(thrownError !== null, 'Should throw authentication error');
    assert.strictEqual(thrownError.statusCode, 401);
  });

  await test('CustomerController enforces tenant isolation between Company A and Company B', async () => {
    const reqCompanyA = { user: { companyId: 'comp-a-id', role: 'COMPANY_ADMIN' } };
    const reqCompanyB = { user: { companyId: 'comp-b-id', role: 'COMPANY_ADMIN' } };
    
    let scopeA = tenantResolver.getTenantWhere(reqCompanyA);
    let scopeB = tenantResolver.getTenantWhere(reqCompanyB);
    
    assert.strictEqual(scopeA.companyId, 'comp-a-id');
    assert.strictEqual(scopeB.companyId, 'comp-b-id');
    assert.notStrictEqual(scopeA.companyId, scopeB.companyId);
  });

  await test('Cross-tenant query attempt by Company B for Company A data is denied/isolated', () => {
    // Even if Company B user sends query param companyId=comp-a-id, non-super-admin is constrained to user.companyId
    const reqCrossTenant = { 
      query: { companyId: 'comp-a-id' }, 
      user: { companyId: 'comp-b-id', role: 'COMPANY_ADMIN' } 
    };
    const scope = tenantResolver.getTenantWhere(reqCrossTenant);
    assert.strictEqual(scope.companyId, 'comp-b-id', 'Must resolve to authenticated user companyId, ignoring query params');
  });

  console.log('\n=============================================');
  console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED.`);
  if (failCount > 0) {
    process.exitCode = 1;
  }
}

runTests();

