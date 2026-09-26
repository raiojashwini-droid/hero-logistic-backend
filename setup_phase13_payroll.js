/**
 * Phase 13 — Driver Payroll Test Data Setup Script
 * Idempotently seeds PayPeriod test records for Driver A and Driver B.
 */

const prisma = require('./src/utils/prismaClient');

async function setupPayroll() {
  console.log('────────────────────────────────────────────────────────────');
  console.log('SETUP PHASE 13: DRIVER PAYROLL TEST DATA');
  console.log('────────────────────────────────────────────────────────────\n');

  // Find Driver A (driver@hero.com)
  const userA = await prisma.user.findUnique({ where: { email: 'driver@hero.com' } });
  if (!userA) throw new Error('Driver A user not found');
  const driverA = await prisma.driver.findUnique({ where: { userId: userA.id } });
  if (!driverA) throw new Error('Driver A profile not found');

  // Find Driver B (driver2@hero.com)
  const userB = await prisma.user.findUnique({ where: { email: 'driver2@hero.com' } });
  if (!userB) throw new Error('Driver B user not found');
  const driverB = await prisma.driver.findUnique({ where: { userId: userB.id } });
  if (!driverB) throw new Error('Driver B profile not found');

  console.log(`  Driver A: ${driverA.firstName} ${driverA.lastName} (ID: ${driverA.id}, Company: ${driverA.companyId})`);
  console.log(`  Driver B: ${driverB.firstName} ${driverB.lastName} (ID: ${driverB.id}, Company: ${driverB.companyId})\n`);

  // Clean existing test pay periods for Driver A and Driver B to maintain idempotency
  await prisma.payPeriod.deleteMany({
    where: { driverId: { in: [driverA.id, driverB.id] } }
  });

  const now = new Date();
  const d14Ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const d28Ago = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  // Seed Driver A Pay Periods
  const payA1 = await prisma.payPeriod.create({
    data: {
      driverId: driverA.id,
      companyId: driverA.companyId,
      periodStart: d14Ago,
      periodEnd: now,
      payDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      frequency: 'FORTNIGHTLY',
      status: 'PROCESSING',
      basePay: 2400.00,
      loadAllowance: 600.00,
      distanceAllow: 300.00,
      otherAllowance: 200.00,
      bonuses: 0.00,
      grossEarnings: 3500.00,
      paygTax: 525.00,
      superAmount: 385.00,
      unionFees: 25.00,
      otherDeductions: 100.00,
      totalDeductions: 1035.00,
      netPay: 2465.00,
      pdfUrl: '/uploads/payslips/payslip_driverA_current.pdf'
    }
  });

  const payA2 = await prisma.payPeriod.create({
    data: {
      driverId: driverA.id,
      companyId: driverA.companyId,
      periodStart: d28Ago,
      periodEnd: d14Ago,
      payDate: d14Ago,
      frequency: 'FORTNIGHTLY',
      status: 'PAID',
      basePay: 2400.00,
      loadAllowance: 500.00,
      distanceAllow: 250.00,
      otherAllowance: 150.00,
      bonuses: 100.00,
      grossEarnings: 3400.00,
      paygTax: 510.00,
      superAmount: 374.00,
      unionFees: 25.00,
      otherDeductions: 50.00,
      totalDeductions: 959.00,
      netPay: 2441.00,
      pdfUrl: '/uploads/payslips/payslip_driverA_prev.pdf'
    }
  });

  // Seed Driver B Pay Periods
  const payB1 = await prisma.payPeriod.create({
    data: {
      driverId: driverB.id,
      companyId: driverB.companyId,
      periodStart: d28Ago,
      periodEnd: d14Ago,
      payDate: d14Ago,
      frequency: 'FORTNIGHTLY',
      status: 'PAID',
      basePay: 2200.00,
      loadAllowance: 400.00,
      distanceAllow: 200.00,
      otherAllowance: 100.00,
      bonuses: 0.00,
      grossEarnings: 2900.00,
      paygTax: 435.00,
      superAmount: 319.00,
      unionFees: 25.00,
      otherDeductions: 0.00,
      totalDeductions: 779.00,
      netPay: 2121.00,
      pdfUrl: '/uploads/payslips/payslip_driverB_prev.pdf'
    }
  });

  console.log(`  ✅ Created Pay Periods for Driver A: Current ID=${payA1.id}, Previous ID=${payA2.id}`);
  console.log(`  ✅ Created Pay Period for Driver B: Previous ID=${payB1.id}\n`);
  console.log('✅ Phase 13 setup complete!');
}

setupPayroll()
  .catch(e => {
    console.error('❌ Setup error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
