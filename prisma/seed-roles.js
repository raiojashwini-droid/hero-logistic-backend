require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const dbUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/hero-logistic";
const urlObj = new URL(dbUrl);
const host = (urlObj.hostname === "localhost" || !urlObj.hostname) ? "127.0.0.1" : urlObj.hostname;
const adapter = new PrismaMariaDb({ host, port: Number(urlObj.port) || 3306, user: urlObj.username || "root", password: urlObj.password || "", database: urlObj.pathname.replace(/^\//, ""), connectionLimit: 5, allowPublicKeyRetrieval: true });
const p = new PrismaClient({ adapter });

// 9 Fixed System Roles — companyId = null means global (SuperAdmin controls)
const SYSTEM_ROLES = [
  { slug: "SUPER_ADMIN", name: "Super Admin", rank: 0 },
  { slug: "COMPANY_ADMIN", name: "Company Admin", rank: 1 },
  { slug: "SALES", name: "Sales", rank: 2 },
  { slug: "DISPATCHER", name: "Dispatcher", rank: 3 },
  { slug: "DRIVER", name: "Driver", rank: 4 },
  { slug: "WAREHOUSE_MANAGER", name: "Warehouse Manager", rank: 5 },
  { slug: "YARD_ATTENDANT", name: "Yard Attendant", rank: 6 },
  { slug: "ACCOUNTS", name: "Accounts", rank: 7 },
  { slug: "CUSTOMER", name: "Customer", rank: 8 },
];

// Default permissions per role (module: { action: boolean })
const DEFAULT_PERMS = {
  SUPER_ADMIN: { "Platform Dashboard": { Show: true, View: true, Export: true, Manage: true }, "Companies Management": { Show: true, View: true, Create: true, Edit: true, Delete: true, Manage: true }, "Platform Users": { Show: true, View: true, Create: true, Edit: true, Delete: true, Manage: true }, "Roles & Permissions": { Show: true, View: true, Create: true, Edit: true, Delete: true, Manage: true }, "Subscriptions & Billing": { Show: true, View: true, Create: true, Edit: true, Manage: true }, "System Analytics": { Show: true, View: true, Export: true }, "System Settings": { Show: true, View: true, Edit: true, Manage: true } },
  COMPANY_ADMIN: { "Dashboard & Analytics": { Show: true, View: true, Export: true }, "User Management": { Manage: true, Create: true, Edit: true, Delete: true, View: true }, "Roles & Permissions": { Manage: true, Create: false, Edit: true, Delete: false, View: true }, "Loads & Dispatch": { Manage: true, Create: true, Edit: true, Delete: true, View: true }, "Fleet & Vehicles": { Manage: true, Create: true, Edit: true, Delete: true, View: true }, "Drivers & Roster": { Manage: true, Create: true, Edit: true, Delete: true, View: true }, "Warehouse & Stock": { Manage: true, Create: true, Edit: true, Delete: false, View: true }, "Yard Management": { Manage: true, Create: true, Edit: true, Delete: false, View: true }, "Billing & Invoices": { Manage: true, Create: true, Edit: true, Delete: false, View: true }, "Support Tickets": { Manage: true, Create: true, Edit: true, View: true }, "System Settings": { Manage: true, Edit: true, View: true } },
  SALES: { "Dashboard & Analytics": { Show: true, View: true, Export: true }, "Loads & Dispatch": { Manage: false, Create: false, Edit: false, Delete: false, View: true }, "Billing & Invoices": { Manage: false, Create: false, Edit: false, Delete: false, View: true }, "Support Tickets": { Manage: true, Create: true, Edit: true, View: true } },
  DISPATCHER: { "Dashboard & Analytics": { Show: true, View: true, Export: false }, "Loads & Dispatch": { Manage: true, Create: true, Edit: true, Delete: false, View: true }, "Fleet & Vehicles": { Manage: true, Create: false, Edit: true, Delete: false, View: true }, "Drivers & Roster": { Manage: true, Create: false, Edit: true, Delete: false, View: true }, "Yard Management": { Manage: true, Create: false, Edit: true, Delete: false, View: true }, "Support Tickets": { Manage: false, Create: true, Edit: false, View: true } },
  DRIVER: { "Dashboard & Analytics": { Show: true, View: true, Export: false }, "Loads & Dispatch": { Manage: false, Create: false, Edit: false, Delete: false, View: true }, "Fleet & Vehicles": { Manage: false, Create: false, Edit: false, Delete: false, View: true }, "Drivers & Roster": { Manage: false, Create: false, Edit: false, Delete: false, View: true }, "Support Tickets": { Manage: false, Create: true, Edit: false, View: true } },
  WAREHOUSE_MANAGER: { "Dashboard & Analytics": { Show: true, View: true, Export: true }, "Loads & Dispatch": { Manage: false, Create: false, Edit: true, Delete: false, View: true }, "Warehouse & Stock": { Manage: true, Create: true, Edit: true, Delete: true, View: true }, "Yard Management": { Manage: true, Create: true, Edit: true, Delete: false, View: true }, "Support Tickets": { Manage: false, Create: true, Edit: false, View: true } },
  YARD_ATTENDANT: { "Dashboard & Analytics": { Show: true, View: true, Export: false }, "Loads & Dispatch": { Manage: false, Create: false, Edit: false, Delete: false, View: true }, "Fleet & Vehicles": { Manage: false, Create: false, Edit: true, Delete: false, View: true }, "Warehouse & Stock": { Manage: false, Create: false, Edit: true, Delete: false, View: true }, "Yard Management": { Manage: true, Create: true, Edit: true, Delete: false, View: true }, "Support Tickets": { Manage: false, Create: true, Edit: false, View: true } },
  ACCOUNTS: { "Dashboard & Analytics": { Show: true, View: true, Export: true }, "Loads & Dispatch": { Manage: false, Create: false, Edit: false, Delete: false, View: true }, "Billing & Invoices": { Manage: true, Create: true, Edit: true, Delete: true, View: true }, "Support Tickets": { Manage: false, Create: true, Edit: false, View: true } },
  CUSTOMER: { "Dashboard & Analytics": { Show: true, View: true, Export: false }, "Loads & Dispatch": { Manage: false, Create: true, Edit: false, Delete: false, View: true }, "Billing & Invoices": { Manage: false, Create: false, Edit: false, Delete: false, View: true }, "Support Tickets": { Manage: false, Create: true, Edit: false, View: true } },
};

(async () => {
  for (const role of SYSTEM_ROLES) {
    // Check if this system role already exists (companyId IS NULL, slug matches)
    const existing = await p.customRole.findFirst({ where: { slug: role.slug, companyId: null } });
    let roleId;
    if (existing) {
      // Update name + isSystem flag
      await p.customRole.update({ where: { id: existing.id }, data: { name: role.name, isSystem: true } });
      roleId = existing.id;
      console.log("Updated:", role.name);
    } else {
      const created = await p.customRole.create({ data: { name: role.name, slug: role.slug, isSystem: true, companyId: null } });
      roleId = created.id;
      console.log("Created:", role.name);
    }
    // Upsert permissions for this role
    const perms = DEFAULT_PERMS[role.slug] || {};
    // Delete old permissions and re-insert
    await p.customPermission.deleteMany({ where: { roleId } });
    for (const [module, actions] of Object.entries(perms)) {
      await p.customPermission.create({ data: { roleId, module, actionString: JSON.stringify(actions) } });
    }
  }
  console.log("\nAll 8 system roles seeded successfully!");
})().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
