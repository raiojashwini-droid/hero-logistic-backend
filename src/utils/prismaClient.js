require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

let prisma;

try {
  const dbUrl = process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/hero_logistics';
  const urlObj = new URL(dbUrl);
  const host = (urlObj.hostname === 'localhost' || !urlObj.hostname) ? '127.0.0.1' : urlObj.hostname;
  const port = Number(urlObj.port) || 3306;
  const user = urlObj.username || 'root';
  const password = urlObj.password || '';
  const database = urlObj.pathname.replace(/^\//, '') || 'hero_logistics';

  const adapter = new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 30,
    allowPublicKeyRetrieval: true,
    connectTimeout: 3000,
    acquireTimeout: 4000,
    idleTimeout: 10000
  });
  prisma = new PrismaClient({ adapter });
} catch (err) {
  console.warn('Prisma client initialization error:', err?.message);
}

module.exports = prisma;
