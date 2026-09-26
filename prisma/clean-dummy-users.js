require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const dbUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/hero-logistic";
const urlObj = new URL(dbUrl);
const host = (urlObj.hostname === "localhost" || !urlObj.hostname) ? "127.0.0.1" : urlObj.hostname;
const adapter = new PrismaMariaDb({ host, port: Number(urlObj.port)||3306, user: urlObj.username||"root", password: urlObj.password||"", database: urlObj.pathname.replace(/^\//,""), connectionLimit: 5, allowPublicKeyRetrieval: true });
const p = new PrismaClient({ adapter });

(async () => {
  const del = await p.user.deleteMany({
    where: {
      email: { startsWith: "support@17866" }
    }
  });
  console.log("Deleted old dummy test users:", del.count);
})().finally(() => p.$disconnect());
