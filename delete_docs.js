require('dotenv').config();
const prisma = require('./src/utils/prismaClient');

async function run() {
  try {
    const res = await prisma.document.deleteMany({});
    console.log('Deleted docs:', res.count);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
