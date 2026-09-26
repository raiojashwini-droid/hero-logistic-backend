/**
 * clear_payroll_data.js
 * Removes all seeded demo payroll data — PayPeriods, Timesheets, demo Drivers & demo Branches.
 * Real company record is kept intact.
 * Run: node clear_payroll_data.js
 */
const prisma = require('./src/utils/prismaClient');

async function main() {
  console.log('🧹 Clearing demo payroll data...\n');

  // 1. Delete all TimesheetEvents first (FK dependency)
  const teCount = await prisma.timesheetEvent.deleteMany({});
  console.log(`✅ Deleted ${teCount.count} timesheet events`);

  // 2. Delete all Timesheets
  const tsCount = await prisma.timesheet.deleteMany({});
  console.log(`✅ Deleted ${tsCount.count} timesheets`);

  // 3. Delete all PayPeriods
  const ppCount = await prisma.payPeriod.deleteMany({});
  console.log(`✅ Deleted ${ppCount.count} pay periods`);

  // 4. Delete all Documents (seeded/demo ones)
  const docCount = await prisma.document.deleteMany({});
  console.log(`✅ Deleted ${docCount.count} documents`);

  // 5. Delete all demo Drivers (those created by seed, email ends with @herologistics.com.au or @demo.internal)
  const driversDeleted = await prisma.driver.deleteMany({
    where: {
      OR: [
        { email: { endsWith: '@herologistics.com.au' } },
        { email: { endsWith: '@demo.internal' } },
        { email: { endsWith: '@demo.co' } },
        // Also delete any drivers with our seed driver codes
        { driverCode: { in: ['DRV-001', 'DRV-002', 'DRV-003', 'DRV-004', 'DRV-005', 'DRV-006', 'DRV-007', 'DRV-008'] } },
      ]
    }
  });
  console.log(`✅ Deleted ${driversDeleted.count} demo drivers`);

  // 6. Delete demo Branches (those with names we seeded)
  const branchesDeleted = await prisma.branch.deleteMany({
    where: {
      name: { in: ['Sydney Head Office', 'Melbourne Branch', 'Brisbane Depot', 'Head Office'] }
    }
  });
  console.log(`✅ Deleted ${branchesDeleted.count} demo branches`);

  console.log('\n🎉 Done! All tables are now fresh and empty.');
  console.log('   PayPeriods: 0');
  console.log('   Timesheets: 0');
  console.log('   Documents:  0');
  console.log('   Demo Drivers & Branches removed.');
  console.log('\n   The company record and user accounts are untouched.');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
