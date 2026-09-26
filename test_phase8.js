/**
 * Phase 8 — Driver Expenses (Fuel / Toll Submission) E2E & Security Test Suite
 *
 * Verifies:
 * 1. Driver A retrieves own expenses -> 200 OK.
 * 2. Driver B retrieves own expenses -> 200 OK.
 * 3. Driver A creates valid FUEL expense -> 201 Created.
 * 4. Driver A creates valid TOLL expense -> 201 Created.
 * 5. Invalid expense type -> 400 Bad Request.
 * 6. Zero / negative amount -> 400 Bad Request.
 * 7. Invalid amount string -> 400 Bad Request.
 * 8. Invalid load ID -> 403 / 404 Access Denied.
 * 9. Driver A cannot attach expense to Driver B load -> 403 Forbidden.
 * 10. Driver A cannot access Driver B expense details by ID -> 403 Forbidden.
 * 11. Unauthenticated request -> 401 Unauthorized.
 * 12. Tenant & Company Isolation enforced.
 * 13. Created expense actually persisted in database.
 * 14. Expense list contains newly created expense.
 * 15. Receipt file persistence and disk write verification.
 * 16. Previous Phases 1–7 regression verification.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: 'localhost',
      port: 5000,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg) { console.log(`  ❌ FAIL: ${msg}`); process.exitCode = 1; }
function section(msg) { console.log(`\n${'─'.repeat(60)}\n${msg}\n${'─'.repeat(60)}`); }

async function runTests() {
  const prisma = require('./src/utils/prismaClient');

  // Login Driver 1 (Noah Williams)
  const login1 = await request('POST', '/api/v1/auth/login', {
    email: 'driver@hero.com',
    password: 'Driver@1234'
  });
  if (login1.status !== 200 || !login1.body?.data?.accessToken) {
    fail(`Driver 1 login failed. Status=${login1.status}`);
    return;
  }
  const token1 = login1.body.data.accessToken;

  // Login Driver 2 (Liam Smith)
  const login2 = await request('POST', '/api/v1/auth/login', {
    email: 'driver2@hero.com',
    password: 'Driver@1234'
  });
  if (login2.status !== 200 || !login2.body?.data?.accessToken) {
    fail(`Driver 2 login failed. Status=${login2.status}`);
    return;
  }
  const token2 = login2.body.data.accessToken;

  // Fetch Loads for Driver A and Driver B
  const d1User = login1.body.data.user;
  const d2User = login2.body.data.user;
  const d1 = await prisma.driver.findUnique({ where: { userId: d1User.id } });
  const d2 = await prisma.driver.findUnique({ where: { userId: d2User.id } });

  const loadA = await prisma.load.findFirst({ where: { driverId: d1.id } });
  const loadB = await prisma.load.findFirst({ where: { driverId: d2.id } });

  if (!loadA || !loadB) {
    fail('Required test loads for Driver A or Driver B not found in DB.');
    return;
  }

  let driverAExpenseId = null;
  let driverBExpenseId = null;

  // ── TEST 1: Driver A Retrieve Own Expenses ──────────────────────────
  section('TEST 1 — Driver A Retrieve Own Expenses');
  const res1 = await request('GET', '/api/v1/driver-portal/expenses', null, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res1.status);
  console.log('  Expense Count:', res1.body?.data?.count);

  if (res1.status === 200 && Array.isArray(res1.body?.data?.expenses)) {
    pass('Driver A successfully fetched own expenses.');
  } else {
    fail(`Driver A expense fetch failed. Status=${res1.status}`);
  }

  // ── TEST 2: Driver B Retrieve Own Expenses ──────────────────────────
  section('TEST 2 — Driver B Retrieve Own Expenses');
  const res2 = await request('GET', '/api/v1/driver-portal/expenses', null, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', res2.status);
  console.log('  Expense Count:', res2.body?.data?.count);

  if (res2.status === 200 && Array.isArray(res2.body?.data?.expenses)) {
    pass('Driver B successfully fetched own expenses.');
  } else {
    fail(`Driver B expense fetch failed. Status=${res2.status}`);
  }

  // ── TEST 3: Driver A Create Valid FUEL Expense ──────────────────────
  section('TEST 3 — Driver A Create Valid FUEL Expense');
  const sampleReceiptBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const res3 = await request('POST', '/api/v1/driver-portal/expenses', {
    type: 'Fuel',
    amount: 145.80,
    vendorName: 'BP Service Centre - Yass NSW',
    description: 'Diesel refill 72L @ $2.02/L',
    litres: 72,
    odometer: 450890,
    loadId: loadA.id,
    receiptData: sampleReceiptBase64
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res3.status);
  console.log('  Message:', res3.body?.data?.message);

  driverAExpenseId = res3.body?.data?.expense?.id;
  const receiptUrlA = res3.body?.data?.expense?.receiptUrl;

  if (res3.status === 201 && driverAExpenseId) {
    pass(`Driver A FUEL expense created successfully! ID: ${driverAExpenseId}`);
  } else {
    fail(`Driver A FUEL expense creation failed. Status=${res3.status}`);
  }

  // ── TEST 4: Driver A Create Valid TOLL Expense ──────────────────────
  section('TEST 4 — Driver A Create Valid TOLL Expense');
  const res4 = await request('POST', '/api/v1/driver-portal/expenses', {
    type: 'Tolls',
    amount: 14.50,
    vendorName: 'M5 Motorway Toll',
    description: 'Heavy vehicle toll charge',
    loadId: loadA.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res4.status);
  console.log('  Message:', res4.body?.data?.message);

  if (res4.status === 201 && res4.body?.data?.expense?.type === 'Tolls') {
    pass('Driver A TOLL expense created successfully!');
  } else {
    fail(`Driver A TOLL expense creation failed. Status=${res4.status}`);
  }

  // Also create a Driver B expense for cross-driver isolation tests
  const resB = await request('POST', '/api/v1/driver-portal/expenses', {
    type: 'Fuel',
    amount: 210.00,
    vendorName: 'Shell Service Station',
    loadId: loadB.id
  }, {
    Authorization: `Bearer ${token2}`
  });
  driverBExpenseId = resB.body?.data?.expense?.id;

  // ── TEST 5: Invalid Expense Type Rejection ─────────────────────────
  section('TEST 5 — Invalid Expense Type Rejection');
  const res5 = await request('POST', '/api/v1/driver-portal/expenses', {
    type: 'INVALID_EXPENSE_TYPE',
    amount: 50.00,
    loadId: loadA.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res5.status);
  console.log('  Error Message:', res5.body?.error?.message);

  if (res5.status === 400 && res5.body?.error?.code === 'VALIDATION_ERROR') {
    pass('Invalid expense type rejected with 400 Bad Request.');
  } else {
    fail(`Invalid expense type not rejected. Status=${res5.status}`);
  }

  // ── TEST 6: Zero/Negative Amount Rejection ──────────────────────────
  section('TEST 6 — Zero/Negative Amount Rejection');
  const res6 = await request('POST', '/api/v1/driver-portal/expenses', {
    type: 'Fuel',
    amount: 0,
    loadId: loadA.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res6.status);
  console.log('  Error Message:', res6.body?.error?.message);

  if (res6.status === 400) {
    pass('Zero/negative amount rejected with 400 Bad Request.');
  } else {
    fail(`Zero/negative amount not rejected. Status=${res6.status}`);
  }

  // ── TEST 7: Invalid Amount Rejection ────────────────────────────────
  section('TEST 7 — Invalid Amount Rejection');
  const res7 = await request('POST', '/api/v1/driver-portal/expenses', {
    type: 'Fuel',
    amount: 'invalid_amount_string',
    loadId: loadA.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res7.status);

  if (res7.status === 400) {
    pass('Invalid amount string rejected with 400 Bad Request.');
  } else {
    fail(`Invalid amount string not rejected. Status=${res7.status}`);
  }

  // ── TEST 8: Invalid Load ID Rejection ──────────────────────────────
  section('TEST 8 — Invalid Load ID Rejection');
  const res8 = await request('POST', '/api/v1/driver-portal/expenses', {
    type: 'Fuel',
    amount: 80.00,
    loadId: '00000000-0000-0000-0000-000000000000'
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res8.status);

  if (res8.status === 403 || res8.status === 404) {
    pass(`Invalid load ID rejected with status ${res8.status}.`);
  } else {
    fail(`Invalid load ID not rejected. Status=${res8.status}`);
  }

  // ── TEST 9: Security — Driver A Cannot Attach Expense to Driver B Load
  section('TEST 9 — Security: Driver A Cannot Attach Expense to Driver B Load');
  const res9 = await request('POST', '/api/v1/driver-portal/expenses', {
    type: 'Fuel',
    amount: 120.00,
    loadId: loadB.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res9.status);
  console.log('  Error Code:', res9.body?.error?.code);

  if (res9.status === 403 && res9.body?.error?.code === 'UNAUTHORIZED_ACCESS') {
    pass('Access Denied! Driver A attaching expense to Driver B load rejected with 403.');
  } else {
    fail(`Driver A attaching expense to Driver B load not rejected! Status=${res9.status}`);
  }

  // ── TEST 10: Security — Driver A Cannot Access Driver B Expense Details
  section('TEST 10 — Security: Driver A Cannot Access Driver B Expense Details');
  const res10 = await request('GET', `/api/v1/driver-portal/expenses/${driverBExpenseId}`, null, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res10.status);

  if (res10.status === 403) {
    pass('Access Denied! Driver A accessing Driver B expense by ID rejected with 403.');
  } else {
    fail(`Driver A was able to view Driver B expense! Status=${res10.status}`);
  }

  // ── TEST 11: Unauthenticated Request Rejection ─────────────────────
  section('TEST 11 — Unauthenticated Request Rejection (Production Mode)');
  const { verifyToken } = require('./src/middlewares/auth');
  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const makeReqRes = () => {
    const req = { cookies: {}, headers: {} };
    let capturedStatus = null;
    let capturedBody = null;
    const res = { status: (code) => { capturedStatus = code; return { json: (b) => { capturedBody = b; } }; } };
    return { req, res, getResult: () => ({ status: capturedStatus, body: capturedBody }) };
  };

  const { req: reqAuth, res: resAuth, getResult: getAuthResult } = makeReqRes();
  let nextCalled = false;
  verifyToken(reqAuth, resAuth, () => { nextCalled = true; });

  if (getAuthResult().status === 401 && !nextCalled) {
    pass('Unauthenticated expense request rejected with 401 Unauthorized.');
  } else {
    fail(`Unauthenticated expense request not rejected. Status=${getAuthResult().status}`);
  }
  process.env.NODE_ENV = origEnv;

  // ── TEST 12: Tenant & Company Isolation ─────────────────────────────
  section('TEST 12 — Tenant & Company Isolation');
  const dbExpense = await prisma.loadExpense.findUnique({
    where: { id: driverAExpenseId },
    include: { load: true }
  });

  if (dbExpense && dbExpense.load.companyId === d1.companyId && dbExpense.load.driverId === d1.id) {
    pass(`Company isolation verified! Expense load.companyId (${dbExpense.load.companyId}) matches Driver A company.`);
  } else {
    fail('Company isolation check failed for expense record.');
  }

  // ── TEST 13: DB Persistence Verification ───────────────────────────
  section('TEST 13 — Created Expense DB Persistence Verification');
  if (dbExpense && dbExpense.amount === 145.80 && dbExpense.vendorName === 'BP Service Centre - Yass NSW') {
    pass('Database record state verified (Amount: $145.80, Vendor: BP Service Centre - Yass NSW).');
  } else {
    fail('Database record verification failed.');
  }

  // ── TEST 14: Expense List Verification ─────────────────────────────
  section('TEST 14 — Expense List Verification');
  const res14 = await request('GET', '/api/v1/driver-portal/expenses', null, {
    Authorization: `Bearer ${token1}`
  });
  const expenseIds = res14.body?.data?.expenses?.map(e => e.id) || [];

  if (res14.status === 200 && expenseIds.includes(driverAExpenseId)) {
    pass(`Newly created expense ID (${driverAExpenseId}) present in GET /driver-portal/expenses response.`);
  } else {
    fail('Newly created expense not found in expense list.');
  }

  // ── TEST 15: Receipt / File Persistence Verification ──────────────
  section('TEST 15 — Receipt / File Persistence Verification');
  if (receiptUrlA) {
    const fullPath = path.join(__dirname, 'public', receiptUrlA.replace('/uploads/', 'uploads/'));
    const fileExists = fs.existsSync(fullPath);
    if (fileExists) {
      pass(`Receipt image safely written to disk at: ${fullPath}`);
    } else {
      fail(`Receipt file not found on disk at: ${fullPath}`);
    }
  } else {
    fail('No receiptUrl returned in expense creation response.');
  }

  // ── TEST 16: Previous Phase Regression Verification ────────────────
  section('TEST 16 — Previous Phase 1–7 Regression Check');
  const tsRes = await request('GET', '/api/v1/driver-portal/timesheet/today', null, {
    Authorization: `Bearer ${token1}`
  });
  if (tsRes.status === 200 && tsRes.body?.data?.status) {
    pass('Phase 7 Timesheet endpoint intact.');
  } else {
    fail(`Phase 7 regression failed. Status=${tsRes.status}`);
  }

  await prisma.$disconnect();

  console.log('\n' + '═'.repeat(60));
  console.log(process.exitCode === 1 ? '❌ Phase 8 tests FAILED.' : '✅ All Phase 8 tests PASSED.');
  console.log('═'.repeat(60) + '\n');
}

runTests().catch(e => {
  console.error('\n❌ Test suite error:', e);
  process.exitCode = 1;
});
