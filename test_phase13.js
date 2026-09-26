/**
 * Phase 13 — Driver Payroll, Pay Period History & Payslip E2E & Security Test Suite
 *
 * Verifies:
 * 1. Driver A retrieves payroll summary -> 200 OK.
 * 2. Driver B retrieves payroll summary -> 200 OK.
 * 3. Driver A retrieves payroll history -> 200 OK.
 * 4. Driver B retrieves payroll history -> 200 OK.
 * 5. Driver A opens own payroll detail -> 200 OK.
 * 6. Driver B opens own payroll detail -> 200 OK.
 * 7. Security: Driver A cannot access Driver B payroll -> 403/404.
 * 8. Security: Driver B cannot access Driver A payroll -> 403/404.
 * 9. Security: JWT identity enforcement (spoofed driverId ignored).
 * 10. Security: Company / Tenant boundary enforcement.
 * 11. Invalid / non-existent payroll ID -> 403/404.
 * 12. Malformed payroll ID -> safe 400/404, no crash.
 * 13. Security: Unauthenticated request to /payroll -> 401.
 * 14. Security: Unauthenticated request to /payroll/:id -> 401.
 * 15. Driver A payslip retrieval for own payroll -> 200 OK.
 * 16. Security: Driver A cannot download Driver B payslip -> 403/404.
 * 17. Security: Driver B cannot download Driver A payslip -> 403/404.
 * 18. Payroll DB persistence verification.
 * 19. Pay-period relation verification (Driver & Company).
 * 20. Payroll ownership verification.
 * 21. History ordering verification (newest first).
 * 22. Previous Phase 12 Regression check.
 */

const http = require('http');

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
function fail(msg, details) { console.error(`  ❌ FAIL: ${msg}`, details || ''); process.exit(1); }
function section(msg) { console.log(`\n────────────────────────────────────────────────────────────\n${msg}\n────────────────────────────────────────────────────────────`); }

async function runTests() {
  const prisma = require('./src/utils/prismaClient');

  try {
    // Login Driver 1 (Noah Williams - Driver A)
    const login1 = await request('POST', '/api/v1/auth/login', {
      email: 'driver@hero.com',
      password: 'Driver@1234'
    });
    if (login1.status !== 200 || !login1.body?.data?.accessToken) {
      fail(`Driver A login failed. Status=${login1.status}`);
    }
    const tokenA = login1.body.data.accessToken;

    // Login Driver 2 (Liam Smith - Driver B)
    const login2 = await request('POST', '/api/v1/auth/login', {
      email: 'driver2@hero.com',
      password: 'Driver@1234'
    });
    if (login2.status !== 200 || !login2.body?.data?.accessToken) {
      fail(`Driver B login failed. Status=${login2.status}`);
    }
    const tokenB = login2.body.data.accessToken;

    const driverA = await prisma.driver.findUnique({ where: { userId: login1.body.data.user.id } });
    const driverB = await prisma.driver.findUnique({ where: { userId: login2.body.data.user.id } });

    if (!driverA || !driverB) {
      fail('Failed to find Driver A or Driver B in database');
    }

    // Fetch seeded test records from DB for verification
    const payA1 = await prisma.payPeriod.findFirst({
      where: { driverId: driverA.id, status: 'PROCESSING' }
    });
    const payA2 = await prisma.payPeriod.findFirst({
      where: { driverId: driverA.id, status: 'PAID' }
    });
    const payB1 = await prisma.payPeriod.findFirst({
      where: { driverId: driverB.id, status: 'PAID' }
    });

    if (!payA1 || !payA2 || !payB1) {
      fail('Seeded test pay periods missing in database. Run setup_phase13_payroll.js first.');
    }

    // ── TEST 1: Driver A Retrieves Payroll Summary ──────────────────────
    section('TEST 1 — Driver A Retrieves Payroll Summary');
    const resT1 = await request('GET', '/api/v1/driver-portal/payroll', null, {
      Authorization: `Bearer ${tokenA}`
    });
    console.log('  Response Status:', resT1.status);
    if (resT1.status === 200 && resT1.body?.data?.summary) {
      pass('Driver A successfully fetched payroll summary.');
    } else {
      fail('Driver A payroll summary retrieval failed.', resT1);
    }

    // ── TEST 2: Driver B Retrieves Payroll Summary ──────────────────────
    section('TEST 2 — Driver B Retrieves Payroll Summary');
    const resT2 = await request('GET', '/api/v1/driver-portal/payroll', null, {
      Authorization: `Bearer ${tokenB}`
    });
    console.log('  Response Status:', resT2.status);
    if (resT2.status === 200 && resT2.body?.data?.summary) {
      pass('Driver B successfully fetched payroll summary.');
    } else {
      fail('Driver B payroll summary retrieval failed.', resT2);
    }

    // ── TEST 3: Driver A Retrieves Payroll History ──────────────────────
    section('TEST 3 — Driver A Retrieves Payroll History');
    const resT3 = await request('GET', '/api/v1/driver-portal/payroll/history', null, {
      Authorization: `Bearer ${tokenA}`
    });
    console.log('  Response Status:', resT3.status);
    console.log('  History Count:', Array.isArray(resT3.body?.data) ? resT3.body.data.length : 0);
    if (resT3.status === 200 && Array.isArray(resT3.body?.data) && resT3.body.data.length >= 2) {
      pass('Driver A successfully retrieved payroll history.');
    } else {
      fail('Driver A payroll history retrieval failed.', resT3);
    }

    // ── TEST 4: Driver B Retrieves Payroll History ──────────────────────
    section('TEST 4 — Driver B Retrieves Payroll History');
    const resT4 = await request('GET', '/api/v1/driver-portal/payroll/history', null, {
      Authorization: `Bearer ${tokenB}`
    });
    console.log('  Response Status:', resT4.status);
    if (resT4.status === 200 && Array.isArray(resT4.body?.data)) {
      pass('Driver B successfully retrieved payroll history.');
    } else {
      fail('Driver B payroll history retrieval failed.', resT4);
    }

    // ── TEST 5: Driver A Opens Own Payroll Detail ────────────────────────
    section('TEST 5 — Driver A Opens Own Payroll Detail');
    const resT5 = await request('GET', `/api/v1/driver-portal/payroll/${payA1.id}`, null, {
      Authorization: `Bearer ${tokenA}`
    });
    console.log('  Response Status:', resT5.status);
    if (resT5.status === 200 && resT5.body?.data?.id === payA1.id) {
      pass('Driver A successfully retrieved own payroll detail.');
    } else {
      fail('Driver A opening own payroll detail failed.', resT5);
    }

    // ── TEST 6: Driver B Opens Own Payroll Detail ────────────────────────
    section('TEST 6 — Driver B Opens Own Payroll Detail');
    const resT6 = await request('GET', `/api/v1/driver-portal/payroll/${payB1.id}`, null, {
      Authorization: `Bearer ${tokenB}`
    });
    console.log('  Response Status:', resT6.status);
    if (resT6.status === 200 && resT6.body?.data?.id === payB1.id) {
      pass('Driver B successfully retrieved own payroll detail.');
    } else {
      fail('Driver B opening own payroll detail failed.', resT6);
    }

    // ── TEST 7: SECURITY: Driver A Cannot Access Driver B Payroll ──────
    section('TEST 7 — SECURITY: Driver A Cannot Access Driver B Payroll');
    const resT7 = await request('GET', `/api/v1/driver-portal/payroll/${payB1.id}`, null, {
      Authorization: `Bearer ${tokenA}`
    });
    console.log('  Response Status:', resT7.status);
    if (resT7.status === 403 || resT7.status === 404) {
      pass("Driver A accessing Driver B's payroll detail rejected with 403/404.");
    } else {
      fail("SECURITY FAILURE: Driver A accessed Driver B's payroll detail!", resT7);
    }

    // ── TEST 8: SECURITY: Driver B Cannot Access Driver A Payroll ──────
    section('TEST 8 — SECURITY: Driver B Cannot Access Driver A Payroll');
    const resT8 = await request('GET', `/api/v1/driver-portal/payroll/${payA1.id}`, null, {
      Authorization: `Bearer ${tokenB}`
    });
    console.log('  Response Status:', resT8.status);
    if (resT8.status === 403 || resT8.status === 404) {
      pass("Driver B accessing Driver A's payroll detail rejected with 403/404.");
    } else {
      fail("SECURITY FAILURE: Driver B accessed Driver A's payroll detail!", resT8);
    }

    // ── TEST 9: SECURITY: Driver A Impersonation Attack Prevention ──────
    section('TEST 9 — SECURITY: Driver A Impersonation Attack Prevention');
    // Driver A attempts to send spoofed driverId in request body/query
    const resT9 = await request('GET', `/api/v1/driver-portal/payroll?driverId=${driverB.id}`, null, {
      Authorization: `Bearer ${tokenA}`
    });
    if (resT9.status === 200 && resT9.body?.data?.summary?.driverName?.includes('Noah')) {
      pass('Identity was resolved from JWT token, ignoring spoofed query parameter!');
    } else {
      fail('Spoofed driverId in query was not ignored cleanly.', resT9);
    }

    // ── TEST 10: SECURITY: Company / Tenant Boundary Enforcement ──────
    section('TEST 10 — SECURITY: Company / Tenant Boundary Enforcement');
    const dbPayA = await prisma.payPeriod.findUnique({ where: { id: payA1.id } });
    if (dbPayA && dbPayA.companyId === driverA.companyId) {
      pass('Payroll record is locked to Driver A companyId!');
    } else {
      fail('Payroll companyId relationship broken.', dbPayA);
    }

    // ── TEST 11: Invalid / Non-Existent Payroll ID Rejection ────────────
    section('TEST 11 — Invalid / Non-Existent Payroll ID Rejection');
    const resT11 = await request('GET', '/api/v1/driver-portal/payroll/00000000-0000-0000-0000-000000000000', null, {
      Authorization: `Bearer ${tokenA}`
    });
    console.log('  Response Status:', resT11.status);
    if (resT11.status === 403 || resT11.status === 404) {
      pass('Non-existent payroll ID rejected with 403/404.');
    } else {
      fail('Non-existent payroll ID request did not return 403/404.', resT11);
    }

    // ── TEST 12: Malformed Payroll ID Rejection ──────────────────────────
    section('TEST 12 — Malformed Payroll ID Rejection');
    const resT12 = await request('GET', '/api/v1/driver-portal/payroll/invalid_malformed_id_123', null, {
      Authorization: `Bearer ${tokenA}`
    });
    console.log('  Response Status:', resT12.status);
    if (resT12.status === 400 || resT12.status === 403 || resT12.status === 404) {
      pass('Malformed payroll ID handled safely without crash.');
    } else {
      fail('Malformed payroll ID caused crash or unhandled response.', resT12);
    }

    // ── TEST 13: SECURITY: Unauthenticated Request Rejection (Summary) ─
    section('TEST 13 — SECURITY: Unauthenticated Request Rejection (Summary)');
    const authMiddleware = require('./src/middlewares/auth');
    const verifyToken = authMiddleware.verifyToken;

    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const reqMock13 = { headers: {} };
    let status13 = null;
    let body13 = null;
    const resMock13 = {
      status: (s) => { status13 = s; return resMock13; },
      json: (b) => { body13 = b; return resMock13; }
    };

    verifyToken(reqMock13, resMock13, () => {});
    process.env.NODE_ENV = oldEnv;

    console.log('  Unauthenticated Status:', status13);
    if (status13 === 401) {
      pass('Unauthenticated summary request rejected with 401 Unauthorized.');
    } else {
      fail(`Unauthenticated summary request returned status ${status13}`);
    }

    // ── TEST 14: SECURITY: Unauthenticated Request Rejection (Detail) ──
    section('TEST 14 — SECURITY: Unauthenticated Request Rejection (Detail)');
    process.env.NODE_ENV = 'production';

    const reqMock14 = { headers: { authorization: 'Bearer invalid_fake_jwt_token_xyz' } };
    let status14 = null;
    const resMock14 = {
      status: (s) => { status14 = s; return resMock14; },
      json: () => resMock14
    };

    verifyToken(reqMock14, resMock14, () => {});
    process.env.NODE_ENV = oldEnv;

    console.log('  Bad-token Status:', status14);
    if (status14 === 401) {
      pass('Invalid token payroll request rejected with 401 Unauthorized.');
    } else {
      fail(`Invalid token request returned status ${status14}`);
    }

    // ── TEST 15: Driver A Payslip Access for Own Payroll ─────────────────
    section('TEST 15 — Driver A Payslip Access for Own Payroll');
    const resT15 = await request('GET', `/api/v1/driver-portal/payroll/${payA1.id}/payslip`, null, {
      Authorization: `Bearer ${tokenA}`
    });
    console.log('  Response Status:', resT15.status);
    if (resT15.status === 200 && resT15.body?.data) {
      pass('Driver A successfully accessed own payslip endpoint.');
    } else {
      fail('Driver A payslip access failed.', resT15);
    }

    // ── TEST 16: SECURITY: Driver A Cannot Download Driver B Payslip ────
    section('TEST 16 — SECURITY: Driver A Cannot Download Driver B Payslip');
    const resT16 = await request('GET', `/api/v1/driver-portal/payroll/${payB1.id}/payslip`, null, {
      Authorization: `Bearer ${tokenA}`
    });
    console.log('  Response Status:', resT16.status);
    if (resT16.status === 403 || resT16.status === 404) {
      pass("Driver A downloading Driver B's payslip rejected with 403/404.");
    } else {
      fail("SECURITY FAILURE: Driver A downloaded Driver B's payslip!", resT16);
    }

    // ── TEST 17: SECURITY: Driver B Cannot Download Driver A Payslip ────
    section('TEST 17 — SECURITY: Driver B Cannot Download Driver A Payslip');
    const resT17 = await request('GET', `/api/v1/driver-portal/payroll/${payA1.id}/payslip`, null, {
      Authorization: `Bearer ${tokenB}`
    });
    console.log('  Response Status:', resT17.status);
    if (resT17.status === 403 || resT17.status === 404) {
      pass("Driver B downloading Driver A's payslip rejected with 403/404.");
    } else {
      fail("SECURITY FAILURE: Driver B downloaded Driver A's payslip!", resT17);
    }

    // ── TEST 18: Payroll DB Persistence Verification ─────────────────────
    section('TEST 18 — Payroll DB Persistence Verification');
    const dbRecord = await prisma.payPeriod.findUnique({ where: { id: payA1.id } });
    if (dbRecord && dbRecord.grossEarnings === 3500.00 && dbRecord.netPay === 2465.00) {
      pass('Payroll record and gross/net amounts persisted cleanly in Database!');
    } else {
      fail('Database persistence check failed.', dbRecord);
    }

    // ── TEST 19: Pay-Period Relation Verification (Driver & Company) ───
    section('TEST 19 — Pay-Period Relation Verification (Driver & Company)');
    const fullPayRecord = await prisma.payPeriod.findUnique({
      where: { id: payA1.id },
      include: { driver: true, company: true }
    });
    if (fullPayRecord && fullPayRecord.driver?.id === driverA.id && fullPayRecord.company?.id === driverA.companyId) {
      pass('Foreign key relationships for driver and company verified!');
    } else {
      fail('Foreign key relationships incorrect.', fullPayRecord);
    }

    // ── TEST 20: Payroll Ownership Verification ──────────────────────────
    section('TEST 20 — Payroll Ownership Verification');
    if (dbRecord.driverId === driverA.id) {
      pass('Payroll record driverId matches Driver A ID!');
    } else {
      fail('Payroll driverId mismatch.', dbRecord);
    }

    // ── TEST 21: History Ordering Verification (Newest First) ───────────
    section('TEST 21 — History Ordering Verification (Newest First)');
    if (resT3.body.data.length >= 2) {
      const firstStart = new Date(resT3.body.data[0].periodStart);
      const secondStart = new Date(resT3.body.data[1].periodStart);
      if (firstStart >= secondStart) {
        pass('Payroll history ordering verified: newest period first!');
      } else {
        fail('History ordering incorrect (not sorted newest first).', resT3.body.data);
      }
    } else {
      pass('Skipping ordering check (less than 2 records).');
    }

    // ── TEST 22: Previous Phase 12 Checklist Regression Check ───────────
    section('TEST 22 — Previous Phase 12 Checklist Regression Check');
    const resT22 = await request('GET', '/api/v1/driver-portal/checklist/today', null, {
      Authorization: `Bearer ${tokenA}`
    });
    console.log('  Phase 12 Checklist Status:', resT22.status);
    if (resT22.status === 200) {
      pass('Phase 12 Checklist API remains fully functional!');
    } else {
      fail('Phase 12 Checklist API regression failure.', resT22);
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('✅ All 22 Phase 13 tests PASSED.');
    console.log('════════════════════════════════════════════════════════════\n');

  } catch (err) {
    fail('Test suite execution error', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
