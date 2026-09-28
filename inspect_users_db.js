const prisma = require('./src/utils/prismaClient');

async function inspectAll() {
  await prisma.$connect();
  const convs = await prisma.conversation.findMany({
    include: {
      messages: true,
      participants: { include: { user: true } }
    }
  });
  console.log('--- ALL CONVERSATIONS IN DB ---');
  console.log(JSON.stringify(convs, null, 2));

  const users = await prisma.user.findMany();
  console.log('--- ALL USERS IN DB ---');
  console.log(JSON.stringify(users, null, 2));

  await prisma.$disconnect();
}

inspectAll();
