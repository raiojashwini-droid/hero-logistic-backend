const prisma = require('./src/utils/prismaClient');

async function main() {
  const users = await prisma.user.findMany({
    include: {
      company: true
    }
  });
  console.log('--- USERS ---');
  users.forEach(u => {
    console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Company: ${u.company ? u.company.name : 'NULL'} (ID: ${u.companyId})`);
  });

  const companies = await prisma.company.findMany();
  console.log('\n--- COMPANIES ---');
  companies.forEach(c => {
    console.log(`ID: ${c.id}, Name: ${c.name}, Status: ${c.status}`);
  });

  const subs = await prisma.tenantSubscription.findMany({
    include: {
      plan: true
    }
  });
  console.log('\n--- SUBSCRIPTIONS ---');
  subs.forEach(s => {
    console.log(`Company ID: ${s.companyId}, Plan: ${s.plan.name}, Status: ${s.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
