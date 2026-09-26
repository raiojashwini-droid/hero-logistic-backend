require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const dbUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/hero-logistic";
const urlObj = new URL(dbUrl);
const host = (urlObj.hostname === "localhost" || !urlObj.hostname) ? "127.0.0.1" : urlObj.hostname;
const adapter = new PrismaMariaDb({ host, port: Number(urlObj.port)||3306, user: urlObj.username||"root", password: urlObj.password||"", database: urlObj.pathname.replace(/^\//,""), connectionLimit: 5, allowPublicKeyRetrieval: true });
const p = new PrismaClient({ adapter });

(async () => {
  const ctrl = require("../src/controllers/CustomRoleController");

  // Step 1: Super Admin unselects "Create Load" on Dispatcher
  const dispatcher = await p.customRole.findFirst({ where: { slug: "DISPATCHER", companyId: null } });
  console.log("Dispatcher Global ID:", dispatcher.id);

  const superAdminReq = {
    params: { id: dispatcher.id },
    body: {
      permissions: {
        "Dispatch Dashboard": { Show: true, View: true, Export: true },
        "Create Load": { Show: false, View: false, Create: false, Manage: false } // Super Admin turned OFF!
      }
    },
    user: { role: "SUPER_ADMIN" }
  };

  const superAdminRes = {
    status: (s) => ({ json: (d) => console.log("Step 1 (Super Admin Update):", s, "Success:", d.success) })
  };
  await ctrl.update(superAdminReq, superAdminRes, (err) => console.error(err));

  // Step 2: Company Admin tries to enable "Create Load"
  const companyAdminReq = {
    params: { id: dispatcher.id },
    tenantId: "b4b71658-d38d-47e6-9ce4-3a84164c03b5",
    body: {
      permissions: {
        "Dispatch Dashboard": { Show: true, View: true, Export: true },
        "Create Load": { Show: true, View: true, Create: true, Manage: true } // Child tries to enable!
      }
    },
    user: { role: "COMPANY_ADMIN" }
  };

  let savedCompanyData = null;
  const companyAdminRes = {
    status: (s) => ({
      json: (d) => {
        console.log("\nStep 2 (Company Admin Try Enable):", s, "Success:", d.success);
        savedCompanyData = d.data;
      }
    })
  };
  await ctrl.update(companyAdminReq, companyAdminRes, (err) => console.error(err));

  console.log("Resulting Create Load permissions for Company Admin:", savedCompanyData?.permissions?.["Create Load"]);
  console.log("--> Is 'Create Load' properly blocked for Company Admin?", savedCompanyData?.permissions?.["Create Load"]?.Show === false ? "YES! BLOCKED BY PARENT" : "NO");

  // Step 3: Reset Super Admin back to default
  superAdminReq.body.permissions["Create Load"] = { Show: true, View: true, Create: true, Manage: true };
  await ctrl.update(superAdminReq, superAdminRes, (err) => console.error(err));
  console.log("\nStep 3: Reset Super Admin master permissions back to enabled.");

})().finally(() => p.$disconnect());
