const prisma = require('./src/utils/prismaClient');

async function main() {
  console.log('PreStartChecklist fields:', Object.keys(prisma.preStartChecklist.fields || {}));
  console.log('DeliveryPOD fields:', Object.keys(prisma.deliveryPOD.fields || {}));
}

main().finally(() => prisma.$disconnect());
