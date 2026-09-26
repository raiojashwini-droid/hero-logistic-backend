const prisma = require('./src/utils/prismaClient');

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: 'warehouse@hero.com' },
        { name: 'ass' },
        { email: 'aa@gmail.com' }
      ]
    }
  });

  console.log('Target users remaining:', users.length);
  for (const u of users) {
    try {
      await prisma.ticketReply.deleteMany({ where: { authorId: u.id } }).catch(() => {});
      await prisma.userSession.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.shift.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.driver.updateMany({ where: { userId: u.id }, data: { userId: null } }).catch(() => {});
      await prisma.notificationRule.updateMany({ where: { authorId: u.id }, data: { authorId: null } }).catch(() => {});
      await prisma.notificationTemplate.updateMany({ where: { authorId: u.id }, data: { authorId: null } }).catch(() => {});
      await prisma.report.updateMany({ where: { creatorId: u.id }, data: { creatorId: null } }).catch(() => {});
      await prisma.conversationParticipant.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.message.deleteMany({ where: { senderId: u.id } }).catch(() => {});
      
      await prisma.user.delete({ where: { id: u.id } });
      console.log('Successfully deleted user:', u.name, u.email);
    } catch (err) {
      console.error('Error deleting ' + u.email + ':', err.message);
    }
  }

  const remaining = await prisma.user.findMany();
  console.log('\n--- ALL REMAINING REAL USERS IN DB --- (Count: ' + remaining.length + ')');
  remaining.forEach(r => console.log(r.id, '|', r.name, '|', r.email, '|', r.role, '|', r.status));
}

main().catch(console.error).finally(() => prisma.$disconnect && prisma.$disconnect());
