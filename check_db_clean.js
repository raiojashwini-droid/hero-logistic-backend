const prisma = require('./src/utils/prismaClient');

async function check() {
  const inv = await prisma.customerInvoice.count();
  const bill = await prisma.billingRecord.count();
  console.log(`DB Status -> Invoices: ${inv}, BillingRecords: ${bill}`);
}

check().finally(() => prisma.$disconnect());
