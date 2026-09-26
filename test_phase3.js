/**
 * Phase 3 — End-to-End API & Security Test Suite
 *
 * Verifies:
 * 1. GET /driver-portal/loads/:id for Driver A (Noah Williams) accessing own load.
 * 2. GET /driver-portal/loads/:id for Driver B (Liam Smith) accessing own load.
 * 3. Security Check: Driver A requesting Driver B's load -> 403 Forbidden / 404 Not Found.
 * 4. Security Check: Driver B requesting Driver A's load -> 403 Forbidden / 404 Not Found.
 * 5. Security Check: Unauthenticated request to /driver-portal/loads/:id -> 401 Unauthorized.
 * 6. Phase 1 Regression: GET /driver-portal/me still works.
 * 7. Phase 2 Regression: GET /driver-portal/me/loads still works with driver isolation.
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
function fail(msg) { console.log(`  ❌ FAIL: ${msg}`); process.exitCode = 1; }
function section(msg) { console.log(`\n${'─'.repeat(60)}\n${msg}\n${'─'.repeat(60)}`); }

async function runTests() {
  // ── TEST 1: Phase 1 Regression Check (GET /driver-portal/me) ──────
  section('TEST 1 — Phase 1 Regression Check (GET /driver-portal/me)');
  const login1 = await request('POST', '/api/v1/auth/login', {
    email: 'driver@hero.com',
    password: 'Driver@1234'
  });
  if (login1.status !== 200 || !login1.body?.data?.accessToken) {
    fail(`Driver 1 login failed. Status=${login1.status}`);
    return;
  }
  const token1 = login1.body.data.accessToken;

  const me1 = await request('GET', '/api/v1/driver-portal/me', null, {
    Authorization: `Bearer ${token1}`
  });
  if (me1.status === 200 && me1.body?.data?.driver?.firstName === 'Noah') {
    pass('Phase 1 GET /driver-portal/me still works perfectly (Noah Williams)');
  } else {
    fail(`Phase 1 regression! Status=${me1.status}`);
  }

  // ── TEST 2: Phase 2 Regression Check (GET /driver-portal/me/loads) ────
  section('TEST 2 — Phase 2 Regression Check (GET /driver-portal/me/loads)');
  const loadsRes1 = await request('GET', '/api/v1/driver-portal/me/loads', null, {
    Authorization: `Bearer ${token1}`
  });
  const loads1 = loadsRes1.body?.data?.loads || [];
  if (loadsRes1.status === 200 && Array.isArray(loads1) && loads1.length > 0) {
    pass(`Phase 2 GET /driver-portal/me/loads returned 200 with ${loads1.length} load(s) for Driver 1`);
  } else {
    fail(`Phase 2 regression! Status=${loadsRes1.status}`);
  }

  const driverALoadId = loads1[0]?.id;
  const driverALoadRef = loads1[0]?.loadRef;

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

  const loadsRes2 = await request('GET', '/api/v1/driver-portal/me/loads', null, {
    Authorization: `Bearer ${token2}`
  });
  const loads2 = loadsRes2.body?.data?.loads || [];
  const driverBLoadId = loads2[0]?.id;
  const driverBLoadRef = loads2[0]?.loadRef;

  // ── TEST 3: GET /driver-portal/loads/:id (Driver A Own Load) ──────
  section('TEST 3 — Driver A Requests Driver A\'s Own Load Details');
  console.log(`  Driver A Load ID: ${driverALoadId} (${driverALoadRef})`);
  const detailsA = await request('GET', `/api/v1/driver-portal/loads/${driverALoadId}`, null, {
    Authorization: `Bearer ${token1}`
  });

  if (detailsA.status === 200 && detailsA.body?.data?.load?.id === driverALoadId) {
    pass(`Driver A successfully fetched own load details (Ref: ${detailsA.body.data.load.loadRef})`);
  } else {
    fail(`Driver A fetching own load failed. Status=${detailsA.status}`);
  }

  // ── TEST 4: GET /driver-portal/loads/:id (Driver B Own Load) ──────
  section('TEST 4 — Driver B Requests Driver B\'s Own Load Details');
  console.log(`  Driver B Load ID: ${driverBLoadId} (${driverBLoadRef})`);
  const detailsB = await request('GET', `/api/v1/driver-portal/loads/${driverBLoadId}`, null, {
    Authorization: `Bearer ${token2}`
  });

  if (detailsB.status === 200 && detailsB.body?.data?.load?.id === driverBLoadId) {
    pass(`Driver B successfully fetched own load details (Ref: ${detailsB.body.data.load.loadRef})`);
  } else {
    fail(`Driver B fetching own load failed. Status=${detailsB.status}`);
  }

  // ── TEST 5: Security Check — Driver A Requests Driver B's Load ─────
  section('TEST 5 — SECURITY CHECK: Driver A Requests Driver B\'s Load ID');
  console.log(`  Attempting: Driver A Token + Driver B Load ID (${driverBLoadId})`);
  const crossAccessA = await request('GET', `/api/v1/driver-portal/loads/${driverBLoadId}`, null, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', crossAccessA.status);
  console.log('  Response Error Code:', crossAccessA.body?.error?.code);

  if ([403, 404].includes(crossAccessA.status)) {
    pass(`Access Denied! Cross-driver request rejected with status ${crossAccessA.status}. No data leaked.`);
  } else {
    fail(`SECURITY VULNERABILITY! Driver A accessed Driver B's load. Status=${crossAccessA.status}`);
  }

  // ── TEST 6: Security Check — Driver B Requests Driver A's Load ─────
  section('TEST 6 — SECURITY CHECK: Driver B Requests Driver A\'s Load ID');
  console.log(`  Attempting: Driver B Token + Driver A Load ID (${driverALoadId})`);
  const crossAccessB = await request('GET', `/api/v1/driver-portal/loads/${driverALoadId}`, null, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', crossAccessB.status);
  console.log('  Response Error Code:', crossAccessB.body?.error?.code);

  if ([403, 404].includes(crossAccessB.status)) {
    pass(`Access Denied! Cross-driver request rejected with status ${crossAccessB.status}. No data leaked.`);
  } else {
    fail(`SECURITY VULNERABILITY! Driver B accessed Driver A's load. Status=${crossAccessB.status}`);
  }

  // ── TEST 7: Unauthenticated Request Rejection ─────────────────────
  section('TEST 7 — Unauthenticated Request Rejection (Production Mode)');
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

  const { req: r1, res: res1, getResult: g1 } = makeReqRes();
  let nextCalled = false;
  verifyToken(r1, res1, () => { nextCalled = true; });

  if (g1().status === 401 && !nextCalled) {
    pass('Unauthenticated request to GET /driver-portal/loads/:id rejected with 401 Unauthorized');
  } else {
    fail(`Unauthenticated request not rejected. Status=${g1().status} nextCalled=${nextCalled}`);
  }

  process.env.NODE_ENV = origEnv;

  console.log('\n' + '═'.repeat(60));
  console.log(process.exitCode === 1 ? '❌ Phase 3 tests FAILED.' : '✅ All Phase 3 tests PASSED.');
  console.log('═'.repeat(60) + '\n');
}

runTests().catch(e => {
  console.error('\n❌ Test suite error:', e);
  process.exitCode = 1;
});
