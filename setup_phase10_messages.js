/**
 * Phase 10 — Messages Test Data Setup Script
 *
 * Sets up controlled test messages for Driver A (driver@hero.com)
 * and Driver B (driver2@hero.com).
 * Idempotent and safe to run multiple times.
 */

const prisma = require('./src/utils/prismaClient');

async function setupPhase10Messages() {
  console.log('Setting up test messages for Phase 10...');

  // 1. Find Driver 1 (driver@hero.com)
  const d1User = await prisma.user.findUnique({ where: { email: 'driver@hero.com' } });
  if (!d1User) throw new Error('Driver 1 user (driver@hero.com) not found');

  const driverA = await prisma.driver.findUnique({ where: { userId: d1User.id } });
  if (!driverA) throw new Error('Driver 1 profile not found');

  // 2. Find Driver 2 (driver2@hero.com)
  const d2User = await prisma.user.findUnique({ where: { email: 'driver2@hero.com' } });
  if (!d2User) throw new Error('Driver 2 user (driver2@hero.com) not found');

  const driverB = await prisma.driver.findUnique({ where: { userId: d2User.id } });
  if (!driverB) throw new Error('Driver 2 profile not found');

  // 3. Clean existing Phase 10 test messages
  await prisma.driverMessage.deleteMany({
    where: {
      driverId: { in: [driverA.id, driverB.id] }
    }
  });

  // 4. Create Driver A Messages
  const d1Message1 = await prisma.driverMessage.create({
    data: {
      driverId: driverA.id,
      companyId: driverA.companyId,
      senderName: 'Dispatch Support',
      senderRole: 'DISPATCH',
      recipient: 'Noah Williams',
      subject: 'Morning Load Departure',
      body: 'Good morning Noah, your load LD-3987 is confirmed for 08:00 AM departure.',
      category: 'Dispatch',
      isFromDriver: false,
      isRead: true,
      important: true,
      meta: 'LD-3987 • Melbourne VIC ➔ Sydney NSW'
    }
  });

  const d1Message2 = await prisma.driverMessage.create({
    data: {
      driverId: driverA.id,
      companyId: driverA.companyId,
      senderName: 'Noah (Me)',
      senderRole: 'DRIVER',
      recipient: 'Dispatch Support',
      subject: 'Pre-trip status',
      body: 'Thanks! I am currently completing pre-trip safety checklist.',
      category: 'Dispatch',
      isFromDriver: true,
      isRead: true,
      meta: 'LD-3987'
    }
  });

  const d1Message3 = await prisma.driverMessage.create({
    data: {
      driverId: driverA.id,
      companyId: driverA.companyId,
      senderName: 'Dispatch Support',
      senderRole: 'DISPATCH',
      recipient: 'Noah Williams',
      subject: 'Yard Arrival',
      body: 'Please arrive 15 mins early at the yard.',
      category: 'Dispatch',
      isFromDriver: false,
      isRead: false,
      important: false,
      meta: 'LD-3987'
    }
  });

  const d1Message4 = await prisma.driverMessage.create({
    data: {
      driverId: driverA.id,
      companyId: driverA.companyId,
      senderName: 'ABC Car Yard',
      senderRole: 'YARD',
      recipient: 'Noah Williams',
      subject: 'Gate Hours',
      body: 'Gate will close at 4:30 PM today.',
      category: 'Yard',
      isFromDriver: false,
      isRead: false,
      important: true,
      meta: 'LD-3987 • Pickup'
    }
  });

  // 5. Create Driver B Messages
  const d2Message1 = await prisma.driverMessage.create({
    data: {
      driverId: driverB.id,
      companyId: driverB.companyId,
      senderName: 'Dispatch Support',
      senderRole: 'DISPATCH',
      recipient: 'Liam Smith',
      subject: 'Sydney Route Update',
      body: 'Liam, please note heavy traffic on M4 motorway near Parramatta.',
      category: 'Dispatch',
      isFromDriver: false,
      isRead: false,
      important: false,
      meta: 'PO-99100'
    }
  });

  const d2Message2 = await prisma.driverMessage.create({
    data: {
      driverId: driverB.id,
      companyId: driverB.companyId,
      senderName: 'Safety Officer',
      senderRole: 'SAFETY',
      recipient: 'Liam Smith',
      subject: 'Toolbox Talk',
      body: 'Reminder to check tie-down straps before departure.',
      category: 'Safety',
      isFromDriver: false,
      isRead: true,
      meta: 'General'
    }
  });

  console.log('✅ Phase 10 test messages created successfully!');
  console.log(`- Driver A (${driverA.id}): 4 messages created`);
  console.log(`- Driver B (${driverB.id}): 2 messages created`);

  return { d1Message1, d1Message3, d2Message1 };
}

if (require.main === module) {
  setupPhase10Messages()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Setup failed:', err);
      process.exit(1);
    });
}

module.exports = setupPhase10Messages;
