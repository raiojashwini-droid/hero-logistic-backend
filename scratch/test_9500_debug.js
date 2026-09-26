const prisma = require('../src/utils/prismaClient');
const { calculateDriverPay } = require('../src/utils/payrollCalculator');

async function testDebug() {
  try {
    const drivers = await prisma.driver.findMany({
      include: { branch: true }
    });
    console.log(`Found ${drivers.length} drivers:`);
    for (const d of drivers) {
      console.log(`Driver ID: ${d.id}, Name: ${d.firstName} ${d.lastName}, payRate: ${d.payRate}, payType: ${d.payType}`);
      const calc = await calculateDriverPay({ driver: d });
      console.log(`calculateDriverPay result:`, JSON.stringify(calc, null, 2));
    }

    const payPeriods = await prisma.payPeriod.findMany({
      include: { driver: true }
    });
    console.log(`\nFound ${payPeriods.length} PayPeriod records in DB:`);
    for (const p of payPeriods) {
      console.log(`PayPeriod ID: ${p.id}, driverId: ${p.driverId}, status: ${p.status}, grossEarnings: ${p.grossEarnings}, netPay: ${p.netPay}, basePay: ${p.basePay}, loadAllowance: ${p.loadAllowance}`);
    }

    const loads = await prisma.load.findMany();
    console.log(`\nFound ${loads.length} Loads in DB:`);
    for (const l of loads) {
      console.log(`Load ID: ${l.id}, loadRef: ${l.loadRef}, status: ${l.status}, notes: ${l.notes}, driverId: ${l.driverId}`);
    }
  } catch (err) {
    console.error('Debug error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testDebug();
