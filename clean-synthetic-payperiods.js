require('dotenv').config();
const prisma = require('./src/utils/prismaClient');

async function cleanSyntheticPayPeriods() {
  console.log('🧹 Cleaning synthetic DRAFT payperiod records...');
  try {
    const deleted = await prisma.payPeriod.deleteMany({
      where: {
        status: 'DRAFT',
        paygTax: 0,
        superAmount: 0,
        totalDeductions: 0
      }
    });
    console.log(`✅ Cleaned ${deleted.count} synthetic DRAFT payperiod records from DB.`);
  } catch (err) {
    console.error('Error cleaning pay periods:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanSyntheticPayPeriods();
