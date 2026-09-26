/**
 * seed_payroll_data.js
 * Seeds demo Branches + Drivers + Timesheets + PayPeriods for the Payroll page.
 * Run: node seed_payroll_data.js
 */
const prisma = require('./src/utils/prismaClient');
const crypto = require('crypto');

async function main() {
  console.log('🌱 Starting payroll demo seed...');

  // ── 1. Get or create company ────────────────────────────────────────────────
  let company = await prisma.company.findFirst({ select: { id: true, name: true } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Hero Logistics Pty Ltd',
        abn: '12 345 678 901',
        status: 'ACTIVE',
        industry: 'Logistics & Transport',
        country: 'Australia',
        phone: '+61 2 8000 1234',
        email: 'admin@herologistics.com.au',
      }
    });
    console.log('✅ Created company:', company.name);
  } else {
    console.log('ℹ️  Using existing company:', company.name);
  }

  // ── 2. Get or create branches (Branch has only: name, location, companyId) ──
  const branchDefs = [
    { name: 'Sydney Head Office',  location: 'Sydney, NSW'    },
    { name: 'Melbourne Branch',    location: 'Melbourne, VIC' },
    { name: 'Brisbane Depot',      location: 'Brisbane, QLD'  },
  ];

  const branches = [];
  for (const b of branchDefs) {
    let branch = await prisma.branch.findFirst({ where: { name: b.name, companyId: company.id } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          id: crypto.randomUUID(),
          name: b.name,
          location: b.location,
          companyId: company.id,
        }
      });
      console.log('✅ Created branch:', branch.name);
    } else {
      console.log('ℹ️  Using existing branch:', branch.name);
    }
    branches.push(branch);
  }

  // ── 3. Create demo drivers ──────────────────────────────────────────────────
  const driverDefs = [
    { code: 'DRV-001', first: 'Noah',    last: 'Williams', email: 'noah.w@herologistics.com.au',  branchIdx: 0, payRate: 35.00 },
    { code: 'DRV-002', first: 'Liam',    last: 'Smith',    email: 'liam.s@herologistics.com.au',   branchIdx: 0, payRate: 30.00 },
    { code: 'DRV-003', first: 'Ethan',   last: 'Jones',    email: 'ethan.j@herologistics.com.au',  branchIdx: 0, payRate: 38.50 },
    { code: 'DRV-004', first: 'Mason',   last: 'Brown',    email: 'mason.b@herologistics.com.au',  branchIdx: 0, payRate: 28.00 },
    { code: 'DRV-005', first: 'Oliver',  last: 'Taylor',   email: 'oliver.t@herologistics.com.au', branchIdx: 1, payRate: 36.00 },
    { code: 'DRV-006', first: 'James',   last: 'Patel',    email: 'james.p@herologistics.com.au',  branchIdx: 1, payRate: 32.00 },
    { code: 'DRV-007', first: 'Lucas',   last: 'Chen',     email: 'lucas.c@herologistics.com.au',  branchIdx: 2, payRate: 27.50 },
    { code: 'DRV-008', first: 'Sophie',  last: 'Mitchell', email: 'sophie.m@herologistics.com.au', branchIdx: 2, payRate: 40.00 },
  ];

  const createdDrivers = [];
  for (const d of driverDefs) {
    // Check by driverCode (unique) or email (unique)
    let driver = await prisma.driver.findFirst({ where: { driverCode: d.code } });
    if (!driver) {
      driver = await prisma.driver.create({
        data: {
          id: crypto.randomUUID(),
          driverCode: d.code,
          firstName: d.first,
          lastName: d.last,
          email: d.email,
          status: 'AVAILABLE',
          employmentType: 'FULL_TIME',
          role: 'Driver',
          licenseClass: 'HC',
          licenseType: 'Heavy Combination',
          payType: 'Hourly',
          payRate: d.payRate,
          branchId: branches[d.branchIdx].id,
          companyId: company.id,
        }
      });
      console.log(`✅ Created driver: ${driver.firstName} ${driver.lastName} (${driver.driverCode})`);
    } else {
      console.log(`ℹ️  Using existing driver: ${driver.firstName} ${driver.lastName} (${driver.driverCode})`);
    }
    createdDrivers.push(driver);
  }

  // ── 4. Create PayPeriod records (past pay runs) ─────────────────────────────
  const now = new Date();

  // Get monday of current week
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const payPeriodDefs = [
    { weekOffset: -2, status: 'PAID',       label: 'W28' },
    { weekOffset: -1, status: 'PROCESSING', label: 'W29' },
    { weekOffset:  0, status: 'DRAFT',      label: 'W30' },
  ];

  for (const pp of payPeriodDefs) {
    const periodStart = new Date(monday);
    periodStart.setDate(monday.getDate() + pp.weekOffset * 7);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6);

    for (const driver of createdDrivers) {
      const existing = await prisma.payPeriod.findFirst({
        where: {
          driverId: driver.id,
          periodStart: { gte: periodStart, lte: new Date(periodStart.getTime() + 1000) }
        }
      });
      if (existing) continue;

      const hoursWorked = 38 + Math.random() * 12;
      const basePay = parseFloat((hoursWorked * (driver.payRate || 30)).toFixed(2));
      const loadAllowance = parseFloat((50 + Math.random() * 150).toFixed(2));
      const distanceAllow = parseFloat((80 + Math.random() * 200).toFixed(2));
      const grossEarnings = parseFloat((basePay + loadAllowance + distanceAllow).toFixed(2));
      const paygTax = parseFloat((grossEarnings * 0.2).toFixed(2));
      const superAmount = parseFloat((grossEarnings * 0.11).toFixed(2));
      const totalDeductions = parseFloat((paygTax + superAmount).toFixed(2));
      const netPay = parseFloat((grossEarnings - totalDeductions).toFixed(2));

      await prisma.payPeriod.create({
        data: {
          id: crypto.randomUUID(),
          driverId: driver.id,
          periodStart,
          periodEnd,
          frequency: 'WEEKLY',
          status: pp.status,
          basePay,
          loadAllowance,
          distanceAllow,
          grossEarnings,
          paygTax,
          superAmount,
          totalDeductions,
          netPay,
          companyId: company.id,
        }
      });
    }
    console.log(`✅ Created PayPeriods for ${pp.label} (${pp.status}) — ${createdDrivers.length} drivers`);
  }

  // ── 5. Create Timesheet records ─────────────────────────────────────────────
  for (const driver of createdDrivers.slice(0, 5)) {
    for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
      const date = new Date(now);
      date.setDate(now.getDate() + dayOffset);
      date.setHours(0, 0, 0, 0);

      const existing = await prisma.timesheet.findFirst({ where: { driverId: driver.id, date } });
      if (existing) continue;

      const clockIn = new Date(date);
      clockIn.setHours(6, 30, 0, 0);
      const clockOut = new Date(date);
      clockOut.setHours(15 + Math.floor(Math.random() * 3), 30, 0, 0);
      const workMinutes = Math.round((clockOut - clockIn) / 60000) - 30;
      const overtimeMin = Math.max(0, workMinutes - 480);

      await prisma.timesheet.create({
        data: {
          id: crypto.randomUUID(),
          driverId: driver.id,
          date,
          status: dayOffset < -1 ? 'APPROVED' : 'SUBMITTED',
          clockInAt: clockIn,
          clockOutAt: clockOut,
          workMinutes,
          breakMinutes: 30,
          totalMinutes: workMinutes + 30,
          overtimeMin,
          companyId: company.id,
        }
      });
    }
    console.log(`✅ Timesheets created for ${driver.firstName} ${driver.lastName}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log(`   Company: ${company.name} (${company.id})`);
  console.log(`   Branches: ${branches.length}`);
  console.log(`   Drivers: ${createdDrivers.length}`);
}

main()
  .catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
