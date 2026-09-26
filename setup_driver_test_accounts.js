/**
 * Phase 1 Test Setup Script
 *
 * Current DB state found:
 *   - User: driver@hero.com (role=DRIVER, status=PENDING, companyId=null) — exists, NO driver record linked
 *   - Driver records: 7 drivers exist (all userId=null) — NOT linked to any user
 *   - Zero drivers have userId set — DRIVERS LINKED TO A USER = []
 *
 * This script does the minimum necessary:
 *   1. Updates the existing driver@hero.com user: status → ACTIVE, companyId set
 *   2. Links it to the existing "Noah Williams" driver record (the one used in mock UI)
 *   3. Creates a second driver user (driver2@hero.com) linked to "Liam Smith"
 *      so we can verify Driver A ≠ Driver B isolation
 *   4. Sets a known bcrypt password ("Driver@1234") for both test accounts
 *
 * Nothing is invented. All driver records already exist in the DB.
 * We are only setting driver.userId on two records that currently have userId=null.
 */

const bcrypt = require('bcryptjs');
const prisma = require('./src/utils/prismaClient');

const COMPANY_ID = '1c058eaa-4e42-4713-a26c-08d35ad626fb';
const PASSWORD = 'Driver@1234';

// Existing IDs from DB inspection
const NOAH_DRIVER_ID  = 'f4f27981-cc10-4878-8e0b-5360a403d609'; // Noah Williams
const LIAM_DRIVER_ID  = '7972eac7-f45b-4cbf-9599-6ab9eb132f64'; // Liam Smith
const EXISTING_USER_ID = '02e7e216-0f7a-48b6-b6d2-1b07fb570ba6'; // driver@hero.com

async function setup() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  console.log('\n[1/4] Activating existing driver@hero.com user and setting companyId...');
  const user1 = await prisma.user.update({
    where: { id: EXISTING_USER_ID },
    data: {
      status: 'ACTIVE',
      companyId: COMPANY_ID,
      password: hash,         // ensure password is set correctly
      name: 'Noah Williams',
    },
    select: { id: true, email: true, status: true, companyId: true, role: true }
  });
  console.log('  User 1 updated:', JSON.stringify(user1));

  console.log('\n[2/4] Linking Noah Williams driver record → user1...');
  const driver1 = await prisma.driver.update({
    where: { id: NOAH_DRIVER_ID },
    data: { userId: user1.id },
    select: { id: true, firstName: true, lastName: true, userId: true, status: true }
  });
  console.log('  Driver 1 linked:', JSON.stringify(driver1));

  console.log('\n[3/4] Creating second driver user driver2@hero.com...');
  const user2 = await prisma.user.upsert({
    where: { email: 'driver2@hero.com' },
    create: {
      email: 'driver2@hero.com',
      password: hash,
      name: 'Liam Smith',
      role: 'DRIVER',
      status: 'ACTIVE',
      companyId: COMPANY_ID,
    },
    update: {
      password: hash,
      name: 'Liam Smith',
      status: 'ACTIVE',
      companyId: COMPANY_ID,
    },
    select: { id: true, email: true, status: true, role: true }
  });
  console.log('  User 2:', JSON.stringify(user2));

  console.log('\n[4/4] Linking Liam Smith driver record → user2...');
  const driver2 = await prisma.driver.update({
    where: { id: LIAM_DRIVER_ID },
    data: { userId: user2.id },
    select: { id: true, firstName: true, lastName: true, userId: true, status: true }
  });
  console.log('  Driver 2 linked:', JSON.stringify(driver2));

  console.log('\n✅ Setup complete!');
  console.log('   Test account 1: driver@hero.com  / Driver@1234  → Noah Williams');
  console.log('   Test account 2: driver2@hero.com / Driver@1234  → Liam Smith');

  await prisma.$disconnect();
}

setup().catch(e => {
  console.error('\n❌ Setup failed:', e.message);
  process.exit(1);
});
