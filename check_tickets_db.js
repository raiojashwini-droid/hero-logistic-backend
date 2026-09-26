const prisma = require('./src/utils/prismaClient');

async function check() {
  const count = await prisma.supportTicket.count();
  console.log(`Current Support Tickets in DB: ${count}`);
}

check().finally(() => prisma.$disconnect());
