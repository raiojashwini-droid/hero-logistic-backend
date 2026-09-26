const prisma = require('./src/utils/prismaClient');

async function main() {
  const customers = await prisma.customer.findMany();
  console.log('Current customers count in DB:', customers.length);
  customers.forEach(c => {
    console.log(`ID: ${c.id} | Name: ${c.name} | ABN: ${c.abn}`);
  });

  // Detach or delete relations first
  await prisma.load.updateMany({ data: { customerId: null } }).catch(e => console.error('Load update err:', e.message));
  await prisma.customerInvoice.deleteMany({}).catch(e => console.error('Invoice delete err:', e.message));
  await prisma.proposal.deleteMany({}).catch(e => console.error('Proposal delete err:', e.message));

  const result = await prisma.customer.deleteMany({});
  console.log('Successfully cleaned all sample/test customers from database! Deleted count:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
