const assert = require('assert');
const tenantResolver = require('./src/middlewares/tenantResolver');
const CompanyAdminPortalController = require('./src/controllers/CompanyAdminPortalController');
const CompanyAdminDashboardController = require('./src/controllers/CompanyAdminDashboardController');
const LoadController = require('./src/controllers/LoadController');
const AuthController = require('./src/controllers/AuthController');
const VehicleController = require('./src/controllers/VehicleController');
const DriverController = require('./src/controllers/DriverController');

console.log('================================================================');
console.log('  TENANT ISOLATION & ZERO-DATA BLEED VERIFICATION SUITE       ');
console.log('================================================================\n');

let pass = 0;
let fail = 0;

function runTest(name, fn) {
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res.then(() => {
        console.log(`[PASS] ${name}`);
        pass++;
      }).catch(err => {
        console.error(`[FAIL] ${name}`);
        console.error(`       Error: ${err.message}`);
        fail++;
      });
    } else {
      console.log(`[PASS] ${name}`);
      pass++;
    }
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    fail++;
  }
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    cookie() { return this; },
    clearCookie() { return this; },
    send(data) { this.body = data; return this; }
  };
  return res;
}

async function run() {
  // Test 1: getTenantWhere with company-admin baseUrl returns IMPOSSIBLE_TENANT_ID_NO_ACCESS if no companyId
  runTest('1. getTenantWhere on /company-admin returns impossible tenant when companyId is missing', () => {
    const req = { baseUrl: '/api/v1/company-admin', user: { role: 'SUPER_ADMIN' } };
    const where = tenantResolver.getTenantWhere(req);
    assert.deepStrictEqual(where, { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' });
  });

  // Test 2: getTenantWhere returns scoped companyId when impersonating
  runTest('2. getTenantWhere resolves impersonated company correctly', () => {
    const req = { 
      baseUrl: '/api/v1/company-admin',
      user: { role: 'SUPER_ADMIN', impersonatedTenantId: 'new-co-uuid-999' }
    };
    req.tenantId = 'new-co-uuid-999';
    const where = tenantResolver.getTenantWhere(req);
    assert.deepStrictEqual(where, { companyId: 'new-co-uuid-999' });
  });

  // Test 3: resolveCompanyId extracts x-company-id header
  runTest('3. resolveCompanyId recognizes x-company-id header fallback', () => {
    const req = {
      headers: { 'x-company-id': 'header-company-123' },
      user: { role: 'SUPER_ADMIN' }
    };
    assert.strictEqual(tenantResolver.resolveCompanyId(req), 'header-company-123');
  });

  // Test 4: Dashboard Metrics returns strictly zero KPIs when companyId is missing
  await runTest('4. CompanyAdminDashboardController.getDashboardMetrics returns strictly 0 KPIs for unassigned context', async () => {
    const req = { user: { role: 'SUPER_ADMIN' } };
    const res = mockRes();
    await CompanyAdminDashboardController.getDashboardMetrics(req, res, () => {});
    assert(res.body?.success, 'Should return success response');
    const kpis = res.body.data.kpis;
    assert.strictEqual(kpis.totalLoads, 0);
    assert.strictEqual(kpis.activeLoads, 0);
    assert.strictEqual(kpis.totalDrivers, 0);
    assert.strictEqual(kpis.activeFleet, 0);
    assert.strictEqual(kpis.totalCustomers, 0);
    assert.strictEqual(kpis.totalBranches, 0);
  });

  // Test 5: LoadController.getAll returns empty list when companyId is missing
  await runTest('5. LoadController.getAll returns empty list when company context is missing', async () => {
    const req = { query: {}, user: { role: 'SUPER_ADMIN' } };
    const res = mockRes();
    await LoadController.getAll(req, res, () => {});
    assert(res.body?.success, 'Should return success response');
    assert.strictEqual(res.body.data.length, 0);
    assert.strictEqual(res.body.meta.total, 0);
  });

  // Test 6: CompanyAdminPortalController.getWarehouses returns empty list when company context is missing
  await runTest('6. CompanyAdminPortalController.getWarehouses returns empty list when companyId is missing', async () => {
    const req = { query: {}, user: { role: 'SUPER_ADMIN' } };
    const res = mockRes();
    let errCaught = null;
    await CompanyAdminPortalController.getWarehouses(req, res, (err) => { errCaught = err; });
    if (errCaught) throw new Error('getWarehouses next called with: ' + (errCaught?.message || errCaught));
    assert(res.body?.success, 'Should return success response');
    assert.strictEqual(res.body.data.warehouses.length, 0);
    assert.strictEqual(res.body.data.stats.totalWarehouses, 0);
  });

  // Test 7: CompanyAdminPortalController.getBranches returns empty list when companyId is missing
  await runTest('7. CompanyAdminPortalController.getBranches returns empty list when companyId is missing', async () => {
    const req = { query: {}, user: { role: 'SUPER_ADMIN' } };
    const res = mockRes();
    await CompanyAdminPortalController.getBranches(req, res, () => {});
    assert(res.body?.success, 'Should return success response');
    assert.strictEqual(res.body.data.length, 0);
  });

  // Test 8: CompanyAdminPortalController.getAssets returns empty stats when companyId is missing
  await runTest('8. CompanyAdminPortalController.getAssets returns empty assets and zero counts when companyId is missing', async () => {
    const req = { query: {}, user: { role: 'SUPER_ADMIN' } };
    const res = mockRes();
    await CompanyAdminPortalController.getAssets(req, res, () => {});
    assert(res.body?.success, 'Should return success response');
    assert.strictEqual(res.body.data.assets.length, 0);
    assert.strictEqual(res.body.data.stats.totalAssets, 0);
  });

  // Test 9: VehicleController.getAll returns empty list when company context is missing
  await runTest('9. VehicleController.getAll returns empty list when company context is missing', async () => {
    const req = { query: {}, user: { role: 'SUPER_ADMIN' } };
    const res = mockRes();
    await VehicleController.getAll(req, res, () => {});
    assert(res.body?.success, 'Should return success response');
    assert.strictEqual(res.body.data.length, 0);
  });

  // Test 10: DriverController.getAll returns empty list when company context is missing
  await runTest('10. DriverController.getAll returns empty list when company context is missing', async () => {
    const req = { query: {}, user: { role: 'SUPER_ADMIN' } };
    const res = mockRes();
    await DriverController.getAll(req, res, () => {});
    assert(res.body?.success, 'Should return success response');
    assert.strictEqual(res.body.data.length, 0);
  });

  // Test 11: requireTenant denies unassigned non-super-admin
  runTest('11. requireTenant blocks access when tenant context is missing for non-super-admin', () => {
    const req = { user: { role: 'COMPANY_ADMIN' } };
    const res = mockRes();
    let nextCalled = false;
    tenantResolver.requireTenant(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, 'Next should not be called');
    assert.strictEqual(res.statusCode, 403, 'Should return 403 Forbidden');
  });

  console.log('\n================================================================');
  console.log(`VERIFICATION RESULTS: ${pass} PASSED, ${fail} FAILED.`);
  console.log('================================================================\n');

  if (fail > 0) process.exit(1);
}

run();
