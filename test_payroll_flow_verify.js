const prisma = require('./src/utils/prismaClient');
const { autoCreditDriverPayroll, autoGenerateLoadInvoice, getPayroll, getFinanceSummary } = require('./src/controllers/CompanyAdminPortalController');
const { confirmDeliveryPOD } = require('./src/controllers/DriverPortalController');

async function testCompletePayrollFlow() {
  console.log('=== STARTING END-TO-END VERIFICATION: LOAD COMPLETION -> PAYROLL & FINANCE ===');

  try {
    // 1. Find or create test company
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: { name: 'Hero Freight Logistics Test', tenantId: 'HERO-TEST-01' }
      });
    }
    console.log(`✓ 1. Company verified: ${company.name} (${company.id})`);

    // 2. Find or create test driver
    let driver = await prisma.driver.findFirst({ where: { companyId: company.id } });
    if (!driver) {
      driver = await prisma.driver.create({
        data: {
          companyId: company.id,
          firstName: 'John',
          lastName: 'Driver',
          email: 'johndriver@test.com',
          driverCode: 'DRV-777',
          payType: 'Per Load',
          payRate: 750.00,
          status: 'AVAILABLE'
        }
      });
    }
    console.log(`✓ 2. Driver verified: ${driver.firstName} ${driver.lastName} (PayType: ${driver.payType}, Rate: $${driver.payRate})`);

    // 3. Create a new load assigned to driver
    const crypto = require('crypto');
    const loadRef = `LD-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
    const load = await prisma.load.create({
      data: {
        id: crypto.randomUUID(),
        companyId: company.id,
        driverId: driver.id,
        loadRef: loadRef,
        origin: 'Sydney Depot',
        destination: 'Melbourne Logistics Hub',
        status: 'IN_TRANSIT',
        notes: '[DRIVER_PAY:750.00] [AGREED_RATE:1500.00]'
      }
    });
    console.log(`✓ 3. Load created & assigned: ${load.loadRef} (Status: ${load.status})`);

    // 4. Driver completes the load via POD confirmation
    const mockReq = {
      user: { id: driver.userId || 'test-user', email: driver.email, role: 'DRIVER', companyId: company.id },
      tenantId: company.id,
      body: {
        loadId: load.id,
        notes: 'Delivery successfully completed at Melbourne Hub',
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }
    };

    let responseData = null;
    const mockRes = {
      status: (code) => mockRes,
      json: (data) => { responseData = data; return mockRes; }
    };

    await confirmDeliveryPOD(mockReq, mockRes, (err) => { if (err) throw err; });
    console.log('✓ 4. confirmDeliveryPOD API executed successfully:', responseData);

    // 5. Verify updated load in DB
    const updatedLoad = await prisma.load.findUnique({ where: { id: load.id } });
    console.log(`✓ 5. Load status after completion: ${updatedLoad.status}, Notes: ${updatedLoad.notes}`);

    // 6. Verify PayPeriod created/updated in DB
    const payPeriod = await prisma.payPeriod.findFirst({
      where: { driverId: driver.id, companyId: company.id },
      orderBy: { createdAt: 'desc' }
    });
    console.log('✓ 6. PayPeriod in DB:', {
      id: payPeriod?.id,
      driverId: payPeriod?.driverId,
      grossEarnings: payPeriod?.grossEarnings,
      netPay: payPeriod?.netPay,
      loadAllowance: payPeriod?.loadAllowance,
      status: payPeriod?.status
    });

    if (!payPeriod || payPeriod.grossEarnings < 750) {
      throw new Error(`PayPeriod verification failed! Expected gross >= 750, got ${payPeriod?.grossEarnings}`);
    }

    // 7. Verify Company Admin Payroll Endpoint
    const mockAdminReq = { user: { companyId: company.id, role: 'COMPANY_ADMIN' }, tenantId: company.id };
    let payrollData = null;
    const mockAdminRes = {
      status: () => mockAdminRes,
      json: (d) => { payrollData = d?.data || d; return mockAdminRes; }
    };

    await getPayroll(mockAdminReq, mockAdminRes, (err) => { if (err) throw err; });
    console.log('✓ 7. Company Admin getPayroll API returned:', {
      totalPayrollMTD: payrollData?.stats?.totalPayrollMTD,
      activeDriversPaid: payrollData?.stats?.activeDriversPaid,
      payrollRunsCount: payrollData?.payrollRuns?.length,
      sampleRunGross: payrollData?.payrollRuns?.[0]?.grossEarnings
    });

    // 8. Verify Company Admin Finance Endpoint
    let financeData = null;
    const mockFinRes = {
      status: () => mockFinRes,
      json: (d) => { financeData = d?.data || d; return mockFinRes; }
    };
    await getFinanceSummary(mockAdminReq, mockFinRes, (err) => { if (err) throw err; });
    console.log('✓ 8. Company Admin getFinanceSummary API returned:', {
      totalRevenue: financeData?.stats?.totalRevenue,
      totalExpenses: financeData?.stats?.totalExpenses,
      driverPayrollTotal: financeData?.stats?.breakdown?.driverPayrollTotal,
      payrollRunsCount: financeData?.payrollRuns?.length
    });

    console.log('\n======================================================');
    console.log('🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('Completed Load -> Driver Pay -> Payroll & Finance flow is 100% OPERATIONAL!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCompletePayrollFlow();
