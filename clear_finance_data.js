const prisma = require('./src/utils/prismaClient');

async function main() {
  console.log('🧹 Clearing all Finance DB data (CustomerInvoices & BillingRecords)...');

  const invDeleted = await prisma.customerInvoice.deleteMany({});
  console.log(`✅ Deleted ${invDeleted.count} customer invoices`);

  const billDeleted = await prisma.billingRecord.deleteMany({});
  console.log(`✅ Deleted ${billDeleted.count} billing records`);

  console.log('\n🎉 Finance DB tables cleared cleanly! Everything is set to $0.00 / 0.');
}

main()
  .catch(e => {
    console.error('❌ Error clearing finance data:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
