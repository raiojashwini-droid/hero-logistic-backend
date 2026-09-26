import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  try { await p.$executeRawUnsafe("ALTER TABLE custom_role ADD COLUMN slug VARCHAR(100) NULL"); console.log("slug added"); } catch(e) { console.log("slug:", e.message); }
  try { await p.$executeRawUnsafe("ALTER TABLE custom_role ADD COLUMN is_system TINYINT(1) NOT NULL DEFAULT 0"); console.log("is_system added"); } catch(e) { console.log("is_system:", e.message); }
}
main().finally(() => p.$disconnect());
