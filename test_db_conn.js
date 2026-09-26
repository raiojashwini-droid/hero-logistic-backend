const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

async function testConn(dbName) {
  console.log(`Testing connection to database: ${dbName}`);
  const adapter = new PrismaMariaDb({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: dbName,
    connectionLimit: 5,
    allowPublicKeyRetrieval: true
  });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    const count = await prisma.company.count();
    console.log(`✓ SUCCESS connected to ${dbName}. Company count: ${count}`);
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.error(`✕ FAILED connection to ${dbName}:`, err.message);
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}

async function run() {
  const res1 = await testConn('hero-logistic');
  if (!res1) {
    await testConn('hero_logistics');
  }
}

run();
