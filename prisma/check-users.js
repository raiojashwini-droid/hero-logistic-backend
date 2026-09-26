require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const dbUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/hero-logistic";
const urlObj = new URL(dbUrl);
const host = (urlObj.hostname === "localhost" || !urlObj.hostname) ? "127.0.0.1" : urlObj.hostname;
const adapter = new PrismaMariaDb({ host, port: Number(urlObj.port)||3306, user: urlObj.username||"root", password: urlObj.password||"", database: urlObj.pathname.replace(/^\//,""), connectionLimit: 5, allowPublicKeyRetrieval: true });
const p = new PrismaClient({ adapter });

(async () => {
  const users = await p.user.findMany({
    select: { id: true, name: true, email: true, role: true, companyId: true, status: true }
  });
  console.log("All current users in DB count:", users.length);
  users.forEach(u => console.log(`- ${u.name} | ${u.email} | Role: ${u.role} | CompanyId: ${u.companyId}`));
})().finally(() => p.$disconnect());
