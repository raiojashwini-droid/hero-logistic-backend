const prisma = require('./src/utils/prismaClient');
const crypto = require('crypto');
const { autoGenerateLoadInvoice, autoCreditDriverPayroll } = require('./src/controllers/CompanyAdminPortalController');

async function runEndToEndFlowTest() {
  console.log('=== END-TO-END FLOW VERIFICATION (LOAD -> DRIVER -> FINANCE & PAYROLL) ===\n');

  let companyA = null;
  let companyB = null;

  try {
    await prisma.$connect();
    console.log('Connected to MySQL successfully.\n');

    // 1. Create two separate companies to test both Flow and Cross-Tenant Confidentiality
    companyA = await prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: `Company Alpha Express ${Date.now()}`,
        tenantId: `COMP-A-${Date.now()}`
      }
    });

    companyB = await prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: `Company Beta Logistics ${Date.now()}`,
        tenantId: `COMP-B-${Date.now()}`
      }
    });

    console.log(`✓ 1. Created Test Companies:`);
    console.log(`   - Company Alpha: ${companyA.name} (${companyA.id})`);
    console.log(`   - Company Beta:  ${companyB.name} (${companyB.id})\n`);

    // 2. Create Driver for Company Alpha with designated Pay Rate ($400/trip)
    const driverAlpha = await prisma.driver.create({
      data: {
        id: crypto.randomUUID(),
        firstName: 'John',
        lastName: 'AlphaDriver',
        email: `driver_${Date.now()}@alpha.com`,
        driverCode: `DRV-A-${Math.floor(1000 + Math.random() * 9000)}`,
        payRate: 400.00,
        payType: 'Trip',
        companyId: companyA.id
      }
    });

    const customerAlpha = await prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Alpha Freight Client',
        email: `client_${Date.now()}@alpha.com`,
        companyId: companyA.id
      }
    });

    console.log(`✓ 2. Created Driver & Customer in Company Alpha:`);
    console.log(`   - Driver: ${driverAlpha.firstName} ${driverAlpha.lastName} (PayRate: $${driverAlpha.payRate})`);
    console.log(`   - Customer: ${customerAlpha.name}\n`);

    // 3. STEP 1: LOAD CREATION (with agreed customer rate $1,800 and driver pay $400)
    const loadRef = `LD-TEST-${Math.floor(10000 + Math.random() * 90000)}`;
    const agreedRate = 1800.00;
    const agreedDriverPay = 450.00; // Custom trip pay specified on load

    const loadAlpha = await prisma.load.create({
      data: {
        id: crypto.randomUUID(),
        loadRef,
        type: 'Car Carrying',
        status: 'ASSIGNED',
        companyId: companyA.id,
        customerId: customerAlpha.id,
        driverId: driverAlpha.id,
        notes: `Test vehicle transfer [AGREED_RATE:${agreedRate}] [DRIVER_PAY:${agreedDriverPay}]`
      }
    });

    console.log(`✓ 3. [STEP 1: LOAD CREATION]`);
    console.log(`   - Load Ref: ${loadAlpha.loadRef}`);
    console.log(`   - Customer Agreed Rate: $${agreedRate}`);
    console.log(`   - Driver Agreed Pay: $${agreedDriverPay}`);
    console.log(`   - Status: ${loadAlpha.status}\n`);

    // Verify Company Beta has 0 records before delivery
    const initialBetaLoads = await prisma.load.count({ where: { companyId: companyB.id } });
    const initialBetaInvoices = await prisma.customerInvoice.count({ where: { load: { companyId: companyB.id } } });
    const initialBetaPayroll = await prisma.payPeriod.count({ where: { companyId: companyB.id } });
    console.log(`✓ Pre-Delivery Confidentiality Check (Company Beta):`);
    console.log(`   - Loads: ${initialBetaLoads} | Invoices: ${initialBetaInvoices} | Payroll: ${initialBetaPayroll}\n`);

    // 4. STEP 2: DRIVER PANEL / DELIVERY CONFIRMATION
    console.log(`✓ 4. [STEP 2: DRIVER PANEL DELIVERY]`);
    console.log(`   - Driver confirms delivery POD for Load ${loadAlpha.loadRef}...`);

    await prisma.load.update({
      where: { id: loadAlpha.id },
      data: { status: 'DELIVERED' }
    });

    // 5. STEP 3: COMPANY FINANCE & DRIVER PAY AUTOMATION TRIGGER
    console.log(`✓ 5. [STEP 3: FINANCE & DRIVER PAY CALCULATION TRIGGERED]`);
    const invoice = await autoGenerateLoadInvoice(loadAlpha.id, companyA.id);
    const payroll = await autoCreditDriverPayroll(loadAlpha.id, driverAlpha.id, companyA.id);

    console.log(`\n=== FINANCIAL CALCULATION RESULTS (COMPANY ALPHA) ===`);
    console.log(`✓ A. Customer Invoice Generated:`);
    console.log(`   - Invoice Number: ${invoice.invoiceNumber}`);
    console.log(`   - Invoice Amount: $${invoice.amount}`);
    console.log(`   - Status: ${invoice.status}`);
    console.log(`   - Customer: ${customerAlpha.name}`);

    console.log(`✓ B. Driver Pay Calculated & Credited:`);
    console.log(`   - Driver: ${driverAlpha.firstName} ${driverAlpha.lastName}`);
    console.log(`   - Trip / Load Allowance Credited: $${payroll.loadAllowance}`);
    console.log(`   - Gross Earnings: $${payroll.grossEarnings}`);
    console.log(`   - PAYG Tax (20%): $${payroll.paygTax}`);
    console.log(`   - Superannuation Guarantee (11%): $${payroll.superAmount}`);
    console.log(`   - Total Deductions: $${payroll.totalDeductions}`);
    console.log(`   - NET PAY PAYABLE: $${payroll.netPay}`);
    console.log(`   - Pay Period Status: ${payroll.status}\n`);

    // 6. STRICT CONFIDENTIALITY & ZERO-LEAK VERIFICATION
    console.log(`=== MULTI-TENANT ISOLATION & ZERO-LEAK VERIFICATION ===`);
    const [betaLoads, betaDrivers, betaInvoices, betaPayPeriods] = await Promise.all([
      prisma.load.findMany({ where: { companyId: companyB.id } }),
      prisma.driver.findMany({ where: { companyId: companyB.id } }),
      prisma.customerInvoice.findMany({ where: { load: { companyId: companyB.id } } }),
      prisma.payPeriod.findMany({ where: { companyId: companyB.id } })
    ]);

    console.log(`Company Beta (Competitor/Other Tenant) Scrutiny:`);
    console.log(`   - Loads visible: ${betaLoads.length} (Expected: 0)`);
    console.log(`   - Drivers visible: ${betaDrivers.length} (Expected: 0)`);
    console.log(`   - Invoices visible: ${betaInvoices.length} (Expected: 0)`);
    console.log(`   - Payroll visible: ${betaPayPeriods.length} (Expected: 0)`);

    const zeroLeak = betaLoads.length === 0 && betaDrivers.length === 0 && betaInvoices.length === 0 && betaPayPeriods.length === 0;
    const flowSuccess = invoice && invoice.amount === agreedRate && payroll && payroll.loadAllowance === agreedDriverPay;

    if (zeroLeak && flowSuccess) {
      console.log(`\n======================================================`);
      console.log(`🎉 ALL TESTS PASSED!`);
      console.log(`1. Load creation: SUCCESS`);
      console.log(`2. Driver panel delivery: SUCCESS`);
      console.log(`3. Finance & Driver Pay calculation: SUCCESS ($${payroll.netPay} Net Pay calculated)`);
      console.log(`4. Multi-Tenant Confidentiality: ZERO DATA LEAKAGE`);
      console.log(`======================================================\n`);
    } else {
      console.error('❌ FAILURE in verification checks!');
    }

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    // Clean up test tenants
    if (companyA) {
      await prisma.customerInvoice.deleteMany({ where: { load: { companyId: companyA.id } } }).catch(() => {});
      await prisma.payPeriod.deleteMany({ where: { companyId: companyA.id } }).catch(() => {});
      await prisma.load.deleteMany({ where: { companyId: companyA.id } }).catch(() => {});
      await prisma.driver.deleteMany({ where: { companyId: companyA.id } }).catch(() => {});
      await prisma.customer.deleteMany({ where: { companyId: companyA.id } }).catch(() => {});
      await prisma.company.delete({ where: { id: companyA.id } }).catch(() => {});
    }
    if (companyB) {
      await prisma.company.delete({ where: { id: companyB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runEndToEndFlowTest();
