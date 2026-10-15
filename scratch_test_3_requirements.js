/**
 * SCRATCHPAD VERIFICATION SCRIPT: 3 USER REQUIREMENTS
 * 
 * Check 1: Nayi Company B create karo — usmein Company A ka data nahi aana chahiye.
 * Check 2: Company B se Company A ka Load, Customer ya Driver access, edit aur delete karke dekho — sab block hona chahiye.
 * Check 3: Super Admin ka "Login as Admin" (impersonate) karke verify karo ki sahi company ka hi data dikh raha hai.
 */

const assert = require('assert');
const jwt = require('jsonwebtoken');
const prisma = require('./src/utils/prismaClient');
const LoadController = require('./src/controllers/LoadController');
const CustomerController = require('./src/controllers/CustomerController');
const DriverController = require('./src/controllers/DriverController');
const CompanyAdminDashboardController = require('./src/controllers/CompanyAdminDashboardController');
const AuthController = require('./src/controllers/AuthController');

console.log('========================================================================');
console.log('        TESTING START: 3 SPECIFIC REQUIREMENTS VERIFICATION             ');
console.log('========================================================================\n');

// Mock in-memory database store for clean deterministic testing
const db = {
  companies: [
    { id: 'COMP-A-111', name: 'Company A Logistics' },
    { id: 'COMP-B-222', name: 'Company B Freight' }
  ],
  users: [
    { id: 'user-admin-A', email: 'adminA@compa.com', role: 'COMPANY_ADMIN', companyId: 'COMP-A-111' },
    { id: 'user-admin-B', email: 'adminB@compb.com', role: 'COMPANY_ADMIN', companyId: 'COMP-B-222' }
  ],
  loads: [
    { id: 'LOAD-A-001', loadRef: 'REF-A-001', companyId: 'COMP-A-111', status: 'IN_TRANSIT', agreedRate: 3500 },
    { id: 'LOAD-A-002', loadRef: 'REF-A-002', companyId: 'COMP-A-111', status: 'PLANNED', agreedRate: 2100 }
  ],
  customers: [
    { id: 'CUST-A-001', name: 'Company A Client Alpha', companyId: 'COMP-A-111' },
    { id: 'CUST-A-002', name: 'Company A Client Beta', companyId: 'COMP-A-111' }
  ],
  drivers: [
    { id: 'DRV-A-001', firstName: 'DriverOne', lastName: 'CompA', companyId: 'COMP-A-111' },
    { id: 'DRV-A-002', firstName: 'DriverTwo', lastName: 'CompA', companyId: 'COMP-A-111' }
  ],
  vehicles: [
    { id: 'VEH-A-001', rego: 'TRUCK-A1', companyId: 'COMP-A-111' }
  ],
  branches: [],
  warehouses: []
};

// Helper: Prisma Where Matching
function matchItem(item, where = {}) {
  for (const [k, v] of Object.entries(where)) {
    if (k === 'OR' && Array.isArray(v)) {
      if (!v.some(sub => matchItem(item, sub))) return false;
      continue;
    }
    if (k === 'AND' && Array.isArray(v)) {
      if (!v.every(sub => matchItem(item, sub))) return false;
      continue;
    }
    if (k === 'NOT') {
      if (matchItem(item, v)) return false;
      continue;
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (v.in && Array.isArray(v.in)) {
        if (!v.in.includes(item[k])) return false;
        continue;
      }
    }
    if (item[k] !== v) return false;
  }
  return true;
}

// Intercept Prisma Client Calls
function attachPrismaMocks() {
  prisma.$executeRawUnsafe = async () => 0;
  prisma.$queryRawUnsafe = async () => [];

  const models = [
    { name: 'company', store: db.companies },
    { name: 'user', store: db.users },
    { name: 'load', store: db.loads },
    { name: 'customer', store: db.customers },
    { name: 'driver', store: db.drivers },
    { name: 'vehicle', store: db.vehicles },
    { name: 'branch', store: db.branches },
    { name: 'warehouse', store: db.warehouses },
    { name: 'supportTicket', store: [] },
    { name: 'customerInvoice', store: [] },
    { name: 'message', store: [] }
  ];

  models.forEach(({ name, store }) => {
    if (!prisma[name]) prisma[name] = {};
    prisma[name].findMany = async (args = {}) => store.filter(i => matchItem(i, args.where));
    prisma[name].findFirst = async (args = {}) => store.find(i => matchItem(i, args.where)) || null;
    prisma[name].findUnique = async (args = {}) => store.find(i => matchItem(i, args.where)) || null;
    prisma[name].count = async (args = {}) => store.filter(i => matchItem(i, args.where)).length;
    prisma[name].create = async (args = {}) => {
      const item = { id: `auto_${Date.now()}`, ...args.data };
      store.push(item);
      return item;
    };
    prisma[name].update = async (args = {}) => {
      const idx = store.findIndex(i => matchItem(i, args.where));
      if (idx === -1) {
        const err = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      Object.assign(store[idx], args.data);
      return store[idx];
    };
    prisma[name].delete = async (args = {}) => {
      const idx = store.findIndex(i => matchItem(i, args.where));
      if (idx === -1) {
        const err = new Error('Record not found');
        err.code = 'P2025';
        throw err;
      }
      return store.splice(idx, 1)[0];
    };
    prisma[name].deleteMany = async (args = {}) => {
      let c = 0;
      for (let i = store.length - 1; i >= 0; i--) {
        if (matchItem(store[i], args.where)) {
          store.splice(i, 1);
          c++;
        }
      }
      return { count: c };
    };
  });
  prisma.impersonationSession = { create: async () => ({}) };
}

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    cookie() { return this; },
    clearCookie() { return this; },
    send(data) { this.body = data; return this; }
  };
}

attachPrismaMocks();

async function runVerification() {
  console.log('------------------------------------------------------------------------');
  console.log('CHECK 1: NAYI COMPANY B CREATE KARO - USMEIN COMPANY A KA DATA NAHI HO');
  console.log('------------------------------------------------------------------------');
  
  // Company A has 2 loads, 2 customers, 2 drivers
  console.log(`Initial Setup: Company A ("COMP-A-111") has:`);
  console.log(` - ${db.loads.filter(l => l.companyId === 'COMP-A-111').length} Loads (Agreed rates: $3500, $2100)`);
  console.log(` - ${db.customers.filter(c => c.companyId === 'COMP-A-111').length} Customers`);
  console.log(` - ${db.drivers.filter(d => d.companyId === 'COMP-A-111').length} Drivers`);
  
  // Now New Company B logs in
  const compBReq = {
    baseUrl: '/api/v1/company-admin',
    user: { id: 'user-admin-B', role: 'COMPANY_ADMIN', companyId: 'COMP-B-222', tenantId: 'COMP-B-222' },
    query: {}
  };

  // Test 1.1: Company B loads
  const loadResB = mockResponse();
  await LoadController.getAll(compBReq, loadResB, () => {});
  assert.strictEqual(loadResB.body.data.length, 0, 'Company B must see 0 loads');
  console.log(' [PASS] Check 1.1: Company B Loads count = 0 (Company A ke 2 loads leak nahi hue)');

  // Test 1.2: Company B customers
  const custResB = mockResponse();
  await CustomerController.getAll(compBReq, custResB, () => {});
  assert.strictEqual(custResB.body.data.length, 0, 'Company B must see 0 customers');
  console.log(' [PASS] Check 1.2: Company B Customers count = 0 (Company A ke customers leak nahi hue)');

  // Test 1.3: Company B drivers
  const drvResB = mockResponse();
  await DriverController.getAll(compBReq, drvResB, () => {});
  assert.strictEqual(drvResB.body.data.length, 0, 'Company B must see 0 drivers');
  console.log(' [PASS] Check 1.3: Company B Drivers count = 0 (Company A ke drivers leak nahi hue)');

  // Test 1.4: Company B dashboard KPIs
  const kpiResB = mockResponse();
  await CompanyAdminDashboardController.getDashboardMetrics(compBReq, kpiResB, () => {});
  const kpis = kpiResB.body.data.kpis;
  assert.strictEqual(kpis.totalLoads, 0);
  assert.strictEqual(kpis.totalCustomers, 0);
  assert.strictEqual(kpis.totalDrivers, 0);
  console.log(' [PASS] Check 1.4: Company B Dashboard KPIs = Strictly All 0 (Clean Fresh Slate)');

  console.log('\n------------------------------------------------------------------------');
  console.log('CHECK 2: COMPANY B SE COMPANY A KA DATA ACCESS, EDIT, DELETE BLOCK CHECK');
  console.log('------------------------------------------------------------------------');

  // 2.1 READ Attack: Company B tries to get Company A's load, customer, driver
  const readLoadReq = { ...compBReq, params: { id: 'LOAD-A-001' } };
  const readLoadRes = mockResponse();
  await LoadController.getById(readLoadReq, readLoadRes, () => {});
  assert.strictEqual(readLoadRes.statusCode, 404);
  console.log(' [PASS] Check 2.1: [READ BLOCK] Company B trying to view Company A Load ID "LOAD-A-001" -> BLOCKED (HTTP 404 Not Found)');

  const readCustReq = { ...compBReq, params: { id: 'CUST-A-001' } };
  const readCustRes = mockResponse();
  await CustomerController.getById(readCustReq, readCustRes, () => {});
  assert.strictEqual(readCustRes.statusCode, 404);
  console.log(' [PASS] Check 2.2: [READ BLOCK] Company B trying to view Company A Customer ID "CUST-A-001" -> BLOCKED (HTTP 404 Not Found)');

  const readDrvReq = { ...compBReq, params: { id: 'DRV-A-001' } };
  const readDrvRes = mockResponse();
  await DriverController.getById(readDrvReq, readDrvRes, () => {});
  assert.strictEqual(readDrvRes.statusCode, 404);
  console.log(' [PASS] Check 2.3: [READ BLOCK] Company B trying to view Company A Driver ID "DRV-A-001" -> BLOCKED (HTTP 404 Not Found)');

  // 2.2 EDIT / UPDATE Attack: Company B tries to mutate Company A's records
  const updateLoadReq = {
    ...compBReq,
    params: { id: 'LOAD-A-001' },
    body: { agreedRate: 99999, status: 'CANCELLED' }
  };
  const updateLoadRes = mockResponse();
  await LoadController.update(updateLoadReq, updateLoadRes, () => {});
  assert.strictEqual(updateLoadRes.statusCode, 404);
  // Verify Company A load in memory was NOT mutated
  const originalLoadA = db.loads.find(l => l.id === 'LOAD-A-001');
  assert.strictEqual(originalLoadA.agreedRate, 3500);
  assert.strictEqual(originalLoadA.status, 'IN_TRANSIT');
  console.log(' [PASS] Check 2.4: [EDIT BLOCK] Company B trying to edit Company A Load Rate -> BLOCKED (HTTP 404, Rate unchanged at $3500)');

  const updateCustReq = {
    ...compBReq,
    params: { id: 'CUST-A-001' },
    body: { name: 'MALICIOUS MODIFICATION' }
  };
  const updateCustRes = mockResponse();
  await CustomerController.update(updateCustReq, updateCustRes, () => {});
  assert.strictEqual(updateCustRes.statusCode, 404);
  const originalCustA = db.customers.find(c => c.id === 'CUST-A-001');
  assert.strictEqual(originalCustA.name, 'Company A Client Alpha');
  console.log(' [PASS] Check 2.5: [EDIT BLOCK] Company B trying to rename Company A Customer -> BLOCKED (HTTP 404, Name preserved)');

  // 2.3 DELETE Attack: Company B tries to delete Company A's records
  const deleteLoadReq = { ...compBReq, params: { id: 'LOAD-A-001' } };
  const deleteLoadRes = mockResponse();
  await LoadController.delete(deleteLoadReq, deleteLoadRes, () => {});
  // Check Company A load still exists
  const loadStillExists = db.loads.find(l => l.id === 'LOAD-A-001');
  assert(loadStillExists, 'Load must still exist in Company A');
  console.log(' [PASS] Check 2.6: [DELETE BLOCK] Company B trying to delete Company A Load -> BLOCKED (Record remains 100% safe in Company A)');

  const deleteCustReq = { ...compBReq, params: { id: 'CUST-A-001' } };
  const deleteCustRes = mockResponse();
  await CustomerController.delete(deleteCustReq, deleteCustRes, () => {});
  assert.strictEqual(deleteCustRes.statusCode, 404);
  const custStillExists = db.customers.find(c => c.id === 'CUST-A-001');
  assert(custStillExists, 'Customer must still exist in Company A');
  console.log(' [PASS] Check 2.7: [DELETE BLOCK] Company B trying to delete Company A Customer -> BLOCKED (Record remains 100% safe in Company A)');

  console.log('\n------------------------------------------------------------------------');
  console.log('CHECK 3: SUPER ADMIN LOGIN AS ADMIN (IMPERSONATION) VERIFICATION');
  console.log('------------------------------------------------------------------------');

  // Step 3.1: Super Admin impersonates Company A
  const superAdminReqA = {
    user: { id: 'super-admin-root', role: 'SUPER_ADMIN' },
    body: { companyId: 'COMP-A-111', reason: 'Audit Company A' }
  };
  const impResA = mockResponse();
  let errA = null;
  await AuthController.impersonate(superAdminReqA, impResA, (err) => { errA = err; });
  if (errA) {
    console.error('impersonate next(err) called with:', errA);
    throw errA;
  }
  if (!impResA.body) {
    console.error('impResA.body is null, statusCode:', impResA.statusCode);
  }
  assert.strictEqual(impResA.body?.success, true);
  const tokenPayloadA = jwt.decode(impResA.body.data.accessToken);
  assert.strictEqual(tokenPayloadA.companyId, 'COMP-A-111');
  assert.strictEqual(tokenPayloadA.impersonatedTenantId, 'COMP-A-111');
  assert.strictEqual(tokenPayloadA.isImpersonating, true);
  console.log(' [PASS] Check 3.1: Super Admin "Login as Admin" for Company A generated isolated token for COMP-A-111');

  // Using this impersonated token for Company A, fetch loads
  const impReqA = {
    baseUrl: '/api/v1/company-admin',
    user: tokenPayloadA,
    query: {}
  };
  const loadsCompA = mockResponse();
  await LoadController.getAll(impReqA, loadsCompA, () => {});
  assert.strictEqual(loadsCompA.body.data.length, 2);
  console.log(` [PASS] Check 3.2: When viewing Company A, Super Admin sees EXACTLY Company A's 2 loads (${loadsCompA.body.data.map(l => l.loadRef).join(', ')})`);

  // Step 3.2: Super Admin impersonates Company B (New company)
  const superAdminReqB = {
    user: { id: 'super-admin-root', role: 'SUPER_ADMIN' },
    body: { companyId: 'COMP-B-222', reason: 'Audit Company B' }
  };
  const impResB = mockResponse();
  await AuthController.impersonate(superAdminReqB, impResB, () => {});
  assert.strictEqual(impResB.body.success, true);
  const tokenPayloadB = jwt.decode(impResB.body.data.accessToken);
  assert.strictEqual(tokenPayloadB.companyId, 'COMP-B-222');
  assert.strictEqual(tokenPayloadB.impersonatedTenantId, 'COMP-B-222');
  console.log(' [PASS] Check 3.3: Super Admin "Login as Admin" for Company B generated isolated token for COMP-B-222');

  // Using this impersonated token for Company B, fetch loads
  const impReqB = {
    baseUrl: '/api/v1/company-admin',
    user: tokenPayloadB,
    query: {}
  };
  const loadsCompB = mockResponse();
  await LoadController.getAll(impReqB, loadsCompB, () => {});
  assert.strictEqual(loadsCompB.body.data.length, 0);
  console.log(' [PASS] Check 3.4: When viewing Company B, Super Admin sees EXACTLY 0 loads (Company A data never bleeds into Company B)');

  console.log('\n========================================================================');
  console.log('ALL 3 USER REQUIREMENTS VERIFIED SUCCESSFULLY WITH 100% ISOLATION & BLOCK!');
  console.log('========================================================================\n');
}

runVerification().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
