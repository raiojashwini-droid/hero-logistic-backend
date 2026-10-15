const assert = require('assert');
const prisma = require('./src/utils/prismaClient');
const CompanyController = require('./src/controllers/CompanyController');
const CompanyAdminPortalController = require('./src/controllers/CompanyAdminPortalController');
const CompanyAdminDashboardController = require('./src/controllers/CompanyAdminDashboardController');
const CustomerController = require('./src/controllers/CustomerController');
const LoadController = require('./src/controllers/LoadController');
const AuthController = require('./src/controllers/AuthController');
const tenantResolver = require('./src/middlewares/tenantResolver');

console.log('================================================================');
console.log('  AUTOMATED VERIFICATION: NEW COMPANY TENANT ISOLATION AUDIT   ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    failCount++;
  }
}

// Mock Express Response Helper
function mockResponse() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie() { return this; },
    clearCookie() { return this; },
    send(data) { this.body = data; return this; }
  };
  return res;
}

async function runAudit() {
  let createdCompany = null;
  let adminUser = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: Provision a Brand-New Tenant Company
    // -------------------------------------------------------------
    await test('1. Create brand new company workspace via CompanyController.create', async () => {
      const testEmail = `audit_admin_${Date.now()}@isolatetest.com`;
      const testName = `Isolation Audit Logistics ${Date.now()}`;
      
      const req = {
        body: {
          name: testName,
          adminEmail: testEmail,
          adminPassword: 'Password@123',
          passwordSetupType: 'MANUAL',
          status: 'ACTIVE'
        }
      };
      const res = mockResponse();

      await CompanyController.create(req, res, (err) => { if (err) throw err; });
      assert(res.body?.success, 'Company creation must succeed');
      createdCompany = res.body.data;
      assert(createdCompany?.id, 'Company ID must be present');

      // Verify user was created
      adminUser = await prisma.user.findFirst({
        where: { email: testEmail }
      });
      assert(adminUser, 'Workspace manager user must exist in DB');
      assert.strictEqual(adminUser.companyId, createdCompany.id);
    });

    const newCompanyReq = {
      baseUrl: '/api/v1/company-admin',
      user: {
        id: adminUser.id,
        role: 'COMPANY_ADMIN',
        companyId: createdCompany.id,
        tenantId: createdCompany.id
      },
      query: {}
    };

    // -------------------------------------------------------------
    // TEST 2: Verify Loads isolation (Must be 0)
    // -------------------------------------------------------------
    await test('2. Brand new company has 0 loads (No cross-tenant bleed)', async () => {
      const res = mockResponse();
      await CompanyAdminPortalController.getLoads(newCompanyReq, res, (err) => { if (err) throw err; });
      assert(res.body?.success, 'getLoads response must succeed');
      assert.strictEqual(res.body.data.length, 0, 'New company must have exactly 0 loads');
      assert.strictEqual(res.body.meta?.total, 0, 'Total load count must be 0');
    });

    // -------------------------------------------------------------
    // TEST 3: Verify Customers isolation (Must be 0)
    // -------------------------------------------------------------
    await test('3. Brand new company has 0 customers (No cross-tenant bleed)', async () => {
      const res = mockResponse();
      await CustomerController.getPortalData(newCompanyReq, res, (err) => { if (err) throw err; });
      assert(res.body?.success, 'getPortalData response must succeed');
      assert.strictEqual(res.body.data.customers.length, 0, 'New company must have 0 customers');
      assert.strictEqual(res.body.data.stats.totalCustomers, 0, 'Total customer count must be 0');
    });

    // -------------------------------------------------------------
    // TEST 4: Verify Drivers isolation (Must be 0)
    // -------------------------------------------------------------
    await test('4. Brand new company has 0 drivers (No cross-tenant bleed)', async () => {
      const res = mockResponse();
      await CompanyAdminPortalController.getDrivers(newCompanyReq, res, (err) => { if (err) throw err; });
      assert(res.body?.success, 'getDrivers response must succeed');
      assert.strictEqual(res.body.data.length, 0, 'New company must have 0 drivers');
      assert.strictEqual(res.body.meta?.total, 0, 'Total driver count must be 0');
    });

    // -------------------------------------------------------------
    // TEST 5: Verify Vehicles isolation (Must be 0)
    // -------------------------------------------------------------
    await test('5. Brand new company has 0 fleet vehicles (No cross-tenant bleed)', async () => {
      const res = mockResponse();
      await CompanyAdminPortalController.getVehicles(newCompanyReq, res, (err) => { if (err) throw err; });
      assert(res.body?.success, 'getVehicles response must succeed');
      assert.strictEqual(res.body.data.length, 0, 'New company must have 0 vehicles');
      assert.strictEqual(res.body.meta?.total, 0, 'Total vehicle count must be 0');
    });

    // -------------------------------------------------------------
    // TEST 6: Verify Lane Pricing Matrix isolation (Must be 0)
    // -------------------------------------------------------------
    await test('6. Brand new company has 0 lane pricing rules (No competitor rates visible)', async () => {
      const res = mockResponse();
      await CompanyAdminPortalController.getLanePricing(newCompanyReq, res, (err) => { if (err) throw err; });
      assert(res.body?.success, 'getLanePricing response must succeed');
      assert.strictEqual(res.body.data.length, 0, 'New company must have 0 lane pricing rules');
    });

    // -------------------------------------------------------------
    // TEST 7: Verify Vehicle Type Rates isolation (Must be 0)
    // -------------------------------------------------------------
    await test('7. Brand new company has 0 vehicle type rate cards (No cross-tenant bleed)', async () => {
      const res = mockResponse();
      await CompanyAdminPortalController.getVehicleRates(newCompanyReq, res, (err) => { if (err) throw err; });
      assert(res.body?.success, 'getVehicleRates response must succeed');
      assert.strictEqual(res.body.data.length, 0, 'New company must have 0 vehicle rate cards');
    });

    // -------------------------------------------------------------
    // TEST 8: Verify Dashboard KPIs (All strictly 0)
    // -------------------------------------------------------------
    await test('8. Brand new company dashboard KPIs are all strictly 0', async () => {
      const res = mockResponse();
      await CompanyAdminDashboardController.getDashboardMetrics(newCompanyReq, res, (err) => { if (err) throw err; });
      assert(res.body?.success, 'getDashboardMetrics response must succeed');
      const kpis = res.body.data.kpis;
      assert.strictEqual(kpis.totalLoads, 0, 'totalLoads must be 0');
      assert.strictEqual(kpis.activeLoads, 0, 'activeLoads must be 0');
      assert.strictEqual(kpis.totalDrivers, 0, 'totalDrivers must be 0');
      assert.strictEqual(kpis.activeFleet, 0, 'activeFleet must be 0');
      assert.strictEqual(kpis.totalCustomers, 0, 'totalCustomers must be 0');
      assert.strictEqual(kpis.totalBranches, 0, 'totalBranches must be 0');
    });

    // -------------------------------------------------------------
    // TEST 9: Super Admin Impersonation for New Company
    // -------------------------------------------------------------
    await test('9. Super Admin can simulate login into new company and receives isolated tenant token', async () => {
      const superAdminReq = {
        user: { id: 'super-admin-root', role: 'SUPER_ADMIN' },
        body: { companyId: createdCompany.id, reason: 'Tenant Isolation Audit' }
      };
      const res = mockResponse();
      await AuthController.impersonate(superAdminReq, res, (err) => { if (err) throw err; });
      assert(res.body?.success, 'impersonate call must succeed');
      assert(res.body.data?.accessToken, 'impersonatedToken must be returned');

      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(res.body.data.accessToken);
      assert.strictEqual(decoded.impersonatedTenantId, createdCompany.id);
      assert.strictEqual(decoded.isImpersonating, true);

      // Now query loads with this impersonated token context
      const impersonatedReq = {
        baseUrl: '/api/v1/company-admin',
        user: decoded,
        query: {}
      };
      const loadsRes = mockResponse();
      await CompanyAdminPortalController.getLoads(impersonatedReq, loadsRes, (err) => { if (err) throw err; });
      assert.strictEqual(loadsRes.body.data.length, 0, 'Impersonated session into new company must see exactly 0 loads');
    });

    // -------------------------------------------------------------
    // TEST 10: Unscoped Super Admin access to /company-admin returns 0 data
    // -------------------------------------------------------------
    await test('10. Super Admin visiting /company-admin without companyId sees 0 data (No accidental leak)', async () => {
      const unscopedReq = {
        baseUrl: '/api/v1/company-admin',
        user: { role: 'SUPER_ADMIN' },
        query: {}
      };
      const res = mockResponse();
      await CompanyAdminPortalController.getLoads(unscopedReq, res, (err) => { if (err) throw err; });
      assert.strictEqual(res.body.data.length, 0, 'Unscoped /company-admin request must return 0 records');
    });

  } finally {
    // Cleanup
    if (createdCompany?.id) {
      try {
        await prisma.billingRecord.deleteMany({ where: { companyId: createdCompany.id } });
        await prisma.tenantSubscription.deleteMany({ where: { companyId: createdCompany.id } });
        await prisma.auditLog.deleteMany({ where: { companyId: createdCompany.id } });
        await prisma.user.deleteMany({ where: { companyId: createdCompany.id } });
        await prisma.company.delete({ where: { id: createdCompany.id } });
      } catch (cleanupErr) {
        console.warn('Cleanup warning:', cleanupErr.message);
      }
    }
  }

  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED.`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAudit();
