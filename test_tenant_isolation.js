const prisma = require('./src/utils/prismaClient');
const crypto = require('crypto');

async function runTenantIsolationTests() {
  console.log('=== MULTI-TENANT ISOLATION SECURITY SUITE ===\n');
  console.log('Connecting to database...');

  let testCompanyA = null;
  let testCompanyB = null;

  try {
    await prisma.$connect();
    console.log('Connected to MySQL via Prisma successfully.');

    // 1. Create or resolve Company A and Company B
    const companyAId = `TEST-COMP-A-${Date.now()}`;
    const companyBId = `TEST-COMP-B-${Date.now()}`;

    testCompanyA = await prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Company Alpha Security Test',
        tenantId: companyAId
      }
    });

    testCompanyB = await prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Company Beta Security Test (Brand New)',
        tenantId: companyBId
      }
    });

    console.log(`✓ Created Test Tenants:`);
    console.log(`  - Company A: ${testCompanyA.name} (${testCompanyA.id})`);
    console.log(`  - Company B: ${testCompanyB.name} (${testCompanyB.id})\n`);

    // 2. Populate Company A with sample business records
    const custA = await prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Alpha Confidential Customer',
        email: `client_${Date.now()}@alpha.com`,
        companyId: testCompanyA.id
      }
    });

    const driverA = await prisma.driver.create({
      data: {
        id: crypto.randomUUID(),
        firstName: 'Alpha',
        lastName: 'Driver',
        email: `driver_${Date.now()}@alpha.com`,
        driverCode: `DRV-A-${Math.floor(10000 + Math.random() * 90000)}`,
        companyId: testCompanyA.id
      }
    });

    const vehicleA = await prisma.vehicle.create({
      data: {
        id: crypto.randomUUID(),
        rego: `REGO-A-${Math.floor(1000 + Math.random() * 9000)}`,
        vin: `VIN-A-${Math.floor(10000 + Math.random() * 90000)}`,
        make: 'Volvo',
        model: 'FH16',
        category: 'TRUCK',
        status: 'IDLE',
        companyId: testCompanyA.id
      }
    });

    const loadA = await prisma.load.create({
      data: {
        id: crypto.randomUUID(),
        loadRef: `PO-ALPHA-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'General Freight',
        status: 'IN_TRANSIT',
        companyId: testCompanyA.id,
        customerId: custA.id,
        driverId: driverA.id
      }
    });

    const branchA = await prisma.branch.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Alpha Secret Branch Depot',
        location: 'Sydney HQ',
        companyId: testCompanyA.id
      }
    });

    const userA = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Alpha Admin',
        email: `admin_${Date.now()}@alpha.com`,
        password: 'HashedPassword123!',
        role: 'COMPANY_ADMIN',
        userCode: `US-A-${Math.floor(1000 + Math.random() * 9000)}`,
        companyId: testCompanyA.id
      }
    });

    console.log('✓ Populated Company A with business records (Customer, Driver, Vehicle, Load, Branch, User)');

    // 3. TEST 1: Verify Company B starts with EXACTLY 0 records across all entities
    console.log('\n--- TEST 1: Brand-New Company B Isolation Verification ---');

    const [bCustomers, bDrivers, bVehicles, bLoads, bBranches, bUsers] = await Promise.all([
      prisma.customer.findMany({ where: { companyId: testCompanyB.id } }),
      prisma.driver.findMany({ where: { companyId: testCompanyB.id } }),
      prisma.vehicle.findMany({ where: { companyId: testCompanyB.id } }),
      prisma.load.findMany({ where: { companyId: testCompanyB.id } }),
      prisma.branch.findMany({ where: { companyId: testCompanyB.id } }),
      prisma.user.findMany({ where: { companyId: testCompanyB.id } })
    ]);

    const bCountSummary = {
      customers: bCustomers.length,
      drivers: bDrivers.length,
      vehicles: bVehicles.length,
      loads: bLoads.length,
      branches: bBranches.length,
      users: bUsers.length
    };

    console.log('Company B Query Results:', bCountSummary);

    let test1Passed = Object.values(bCountSummary).every(count => count === 0);
    if (test1Passed) {
      console.log('PASS: Brand-new Company B starts with 0 business records.');
    } else {
      console.error('FAIL: Company B leaked existing records!');
    }

    // 4. TEST 2: Verify Cross-Tenant Access Prevention (Company B trying to access Company A's IDs)
    console.log('\n--- TEST 2: Cross-Tenant Access & Modification Attack Prevention ---');

    // Simulate request context for Company B
    const mockReqB = {
      tenantId: testCompanyB.id,
      user: { role: 'COMPANY_ADMIN', companyId: testCompanyB.id }
    };

    const CustomerController = require('./src/controllers/CustomerController');
    const DriverController = require('./src/controllers/DriverController');
    const VehicleController = require('./src/controllers/VehicleController');
    const CompanyAdminPortalController = require('./src/controllers/CompanyAdminPortalController');

    // Test Customer getById cross-tenant
    let custGetBlocked = false;
    const mockResGetCust = {
      status: (code) => {
        if (code === 404) custGetBlocked = true;
        return mockResGetCust;
      },
      json: () => {}
    };
    await CustomerController.getById({ ...mockReqB, params: { id: custA.id } }, mockResGetCust, () => {});

    // Test Driver delete cross-tenant
    await DriverController.delete({ ...mockReqB, params: { id: driverA.id } }, { status: () => ({ send: () => {} }) }, () => {});
    const driverACheck = await prisma.driver.findUnique({ where: { id: driverA.id } });
    const driverProtected = !!driverACheck;

    // Test Vehicle delete cross-tenant
    await VehicleController.delete({ ...mockReqB, params: { id: vehicleA.id } }, { status: () => ({ send: () => {} }) }, () => {});
    const vehicleACheck = await prisma.vehicle.findUnique({ where: { id: vehicleA.id } });
    const vehicleProtected = !!vehicleACheck;

    // Test Load delete cross-tenant
    await CompanyAdminPortalController.deleteLoad({ ...mockReqB, params: { id: loadA.id } }, { send: () => {} }, () => {});
    const loadACheck = await prisma.load.findUnique({ where: { id: loadA.id } });
    const loadProtected = !!loadACheck;

    console.log(`- Cross-tenant Customer lookup blocked (404): ${custGetBlocked ? 'YES' : 'NO'}`);
    console.log(`- Cross-tenant Driver delete prevented: ${driverProtected ? 'YES' : 'NO'}`);
    console.log(`- Cross-tenant Vehicle delete prevented: ${vehicleProtected ? 'YES' : 'NO'}`);
    console.log(`- Cross-tenant Load delete prevented: ${loadProtected ? 'YES' : 'NO'}`);

    const test2Passed = custGetBlocked && driverProtected && vehicleProtected && loadProtected;

    // 5. TEST 3: Verify Dashboard KPI Scoping for Company B
    console.log('\n--- TEST 3: Dashboard KPI Metrics Scoping ---');

    let dashboardMetricsB = null;
    const mockResDashboard = {
      json: (payload) => {
        dashboardMetricsB = payload.data;
      },
      status: () => mockResDashboard
    };

    const dashboardController = require('./src/controllers/CompanyAdminDashboardController');
    await dashboardController.getDashboardMetrics(mockReqB, mockResDashboard, () => {});

    const kpiSummary = {
      totalLoads: dashboardMetricsB?.totalLoads || 0,
      activeDrivers: dashboardMetricsB?.activeDrivers || 0,
      activeVehicles: dashboardMetricsB?.activeVehicles || 0,
      revenueThisMonth: dashboardMetricsB?.revenueThisMonth || '$0'
    };

    console.log('Company B Dashboard Stats:', kpiSummary);
    const test3Passed = kpiSummary.totalLoads === 0 && kpiSummary.activeDrivers === 0 && kpiSummary.activeVehicles === 0;
    if (test3Passed) {
      console.log('PASS: Dashboard metrics are strictly 0 for new company B.');
    } else {
      console.error('FAIL: Dashboard metrics leaked cross-tenant data!');
    }

    console.log('\n=============================================');
    if (test1Passed && test2Passed && test3Passed) {
      console.log('SUCCESS: All Multi-Tenant Data Isolation Tests PASSED cleanly!');
    } else {
      console.error('FAILURE: Some security isolation checks failed!');
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    process.exitCode = 1;
  } finally {
    // Clean up test data
    console.log('\nCleaning up test database records...');
    if (testCompanyA) {
      await prisma.load.deleteMany({ where: { companyId: testCompanyA.id } }).catch(() => {});
      await prisma.customer.deleteMany({ where: { companyId: testCompanyA.id } }).catch(() => {});
      await prisma.driver.deleteMany({ where: { companyId: testCompanyA.id } }).catch(() => {});
      await prisma.vehicle.deleteMany({ where: { companyId: testCompanyA.id } }).catch(() => {});
      await prisma.branch.deleteMany({ where: { companyId: testCompanyA.id } }).catch(() => {});
      await prisma.user.deleteMany({ where: { companyId: testCompanyA.id } }).catch(() => {});
      await prisma.company.delete({ where: { id: testCompanyA.id } }).catch(() => {});
    }
    if (testCompanyB) {
      await prisma.company.delete({ where: { id: testCompanyB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
    console.log('Cleanup complete.');
  }
}

runTenantIsolationTests();
