const prisma = require('./src/utils/prismaClient');

async function main() {
  const reports = await prisma.report.findMany();
  console.log('--- ALL REPORTS IN DB --- (Count: ' + reports.length + ')');
  reports.forEach(r => console.log(r.id, '|', r.name, '|', r.category));

  // Find dummy reports
  const dummyNames = ['qasa', 'ggg', 'asd', 'asdfgg', 'w', 'aws', 'aaqw2222', 'ss', 's', 'dd', 'df', 'test', 'test report', 'test kpi report', 'admin'];
  
  const toDelete = reports.filter(r => {
    const nameLower = r.name.toLowerCase().trim();
    return dummyNames.includes(nameLower) || nameLower.length <= 3 || nameLower.startsWith('test');
  });

  console.log('\n--- DUMMY REPORTS TO PURGE --- (Count: ' + toDelete.length + ')');
  toDelete.forEach(r => console.log('Deleting:', r.id, r.name));

  if (toDelete.length > 0) {
    const ids = toDelete.map(r => r.id);
    await prisma.report.deleteMany({
      where: { id: { in: ids } }
    });
    console.log('\nSUCCESS! Purged ' + ids.length + ' dummy reports from database!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect && prisma.$disconnect());
