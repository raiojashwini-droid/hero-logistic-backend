require('dotenv').config();
const p = require('../src/utils/prismaClient');

async function run() {
  // Clear licenseType that was auto-defaulted to 'HR (Heavy Rigid)' with a random LIC- number
  const fixed1 = await p.driver.updateMany({
    where: {
      licenseType: 'HR (Heavy Rigid)',
      licenseNumber: { startsWith: 'LIC-' }
    },
    data: { licenseType: null, licenseNumber: null }
  });
  console.log('Cleared wrongly-defaulted licenseType/licenseNumber:', fixed1.count, 'drivers');

  // Clear category auto-defaulted to 'Heavy Rig'
  const fixed2 = await p.driver.updateMany({
    where: { category: 'Heavy Rig' },
    data: { category: null }
  });
  console.log('Cleared wrongly-defaulted category:', fixed2.count, 'drivers');

  // Clear shift auto-defaulted to 'Morning'
  const fixed3 = await p.driver.updateMany({
    where: { shift: 'Morning' },
    data: { shift: null }
  });
  console.log('Cleared wrongly-defaulted shift:', fixed3.count, 'drivers');

  // Report remaining drivers with HR (Heavy Rigid) - these may have been manually entered
  const remaining = await p.driver.count({ where: { licenseType: 'HR (Heavy Rigid)' } });
  console.log('Drivers with "HR (Heavy Rigid)" kept (manually entered):', remaining);

  await p.$disconnect();
  console.log('Done!');
}

run().catch(e => {
  console.error('Cleanup failed:', e.message);
  process.exit(1);
});
