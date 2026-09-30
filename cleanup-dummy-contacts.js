/**
 * One-time cleanup script: Remove dummy contactName/email from customers
 * Run with: node cleanup-dummy-contacts.js
 */
const prisma = require('./src/utils/prismaClient');

async function cleanDummyContacts() {
  console.log('🧹 Cleaning dummy contact data from customers...');

  try {
    // Clear customers that have 'Primary Contact' as contactName
    const result1 = await prisma.customer.updateMany({
      where: {
        contactName: { in: ['Primary Contact', 'Primary', 'Contact', 'N/A'] }
      },
      data: {
        contactName: null
      }
    }).catch(() => ({ count: 0 }));
    console.log(`✅ Cleared dummy contactName from ${result1.count} customers`);

    // Clear customers that have 'contact@example.com' as email
    const result2 = await prisma.customer.updateMany({
      where: {
        email: { in: ['contact@example.com', 'N/A', 'n/a'] }
      },
      data: {
        email: null
      }
    }).catch(() => ({ count: 0 }));
    console.log(`✅ Cleared dummy email from ${result2.count} customers`);

    // Clear customers with 'N/A' phone
    const result3 = await prisma.customer.updateMany({
      where: {
        phone: { in: ['N/A', 'n/a'] }
      },
      data: {
        phone: null
      }
    }).catch(() => ({ count: 0 }));
    console.log(`✅ Cleared dummy phone from ${result3.count} customers`);

    console.log('\n🎉 Cleanup complete! Refresh your browser to see the changes.');
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDummyContacts();
