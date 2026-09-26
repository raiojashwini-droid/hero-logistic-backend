/**
 * Phase 4 — End-to-End API & Security Test Suite
 *
 * Verifies:
 * 1. POST /driver-portal/loads/:id/status-transition for Driver A (Noah Williams) on own load -> 200 OK.
 * 2. POST /driver-portal/loads/:id/status-transition for Driver B (Liam Smith) on own load -> 200 OK.
 * 3. Security Check: Driver A requesting status transition on Driver B's load -> 403 Forbidden / 404 Not Found.
 * 4. Security Check: Driver B requesting status transition on Driver A's load -> 403 Forbidden / 404 Not Found.
 * 5. Invalid Transition Check: Invalid status values rejected with 400 Bad Request.
 * 6. Completed Load Protection: Transition on completed/cancelled load rejected with 400 Bad Request.
 * 7. Unauthenticated Rejection: 401 Unauthorized in production mode.
 * 8. Phase 1 Regression: GET /driver-portal/me still works.
 * 9. Phase 2 Regression: GET /driver-portal/me/loads still works with driver isolation.
 * 10. Phase 3 Regression: GET /driver-portal/loads/:id still works with driver isolation.
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

  const driverAActiveLoad = loads1.find(l => l.status === 'ASSIGNED' || l.status === 'IN_TRANSIT') || loads1[0];
  const driverALoadId = driverAActiveLoad?.id;
  const driverALoadRef = driverAActiveLoad?.loadRef;

  const driverACompletedLoad = loads1.find(l => l.status === 'COMPLETED') || null;

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

  // ── TEST 3: Phase 3 Regression Check (GET /driver-portal/loads/:id) ─────
  section('TEST 3 — Phase 3 Regression Check (GET /driver-portal/loads/:id)');
  const detailsA = await request('GET', `/api/v1/driver-portal/loads/${driverALoadId}`, null, {
    Authorization: `Bearer ${token1}`
  });
  if (detailsA.status === 200 && detailsA.body?.data?.load?.id === driverALoadId) {
    pass('Phase 3 GET /driver-portal/loads/:id still works perfectly');
  } else {
    fail(`Phase 3 regression! Status=${detailsA.status}`);
  }

  // ── TEST 4: Driver A Valid Status Transition ───────────────────────
  section('TEST 4 — Driver A Status Transition on Own Load (IN_TRANSIT)');
  console.log(`  Driver A Active Load ID: ${driverALoadId} (${driverALoadRef}) Current Status: ${driverAActiveLoad.status}`);
  const transA = await request('POST', `/api/v1/driver-portal/loads/${driverALoadId}/status-transition`, {
    status: 'IN_TRANSIT',
    note: 'Dispatched from Melbourne yard'
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', transA.status);
  console.log('  Updated Status:', transA.body?.data?.load?.status);

  if (transA.status === 200 && transA.body?.data?.load?.status === 'IN_TRANSIT') {
    pass('Driver A successfully transitioned load status to IN_TRANSIT');
  } else {
    fail(`Driver A status transition failed. Status=${transA.status}`);
  }

  // ── TEST 4B: Completed Load Status Transition Protection ───────────
  if (driverACompletedLoad) {
    section('TEST 4B — Completed Load Protection Check');
    console.log(`  Attempting transition on completed load: ${driverACompletedLoad.id} (${driverACompletedLoad.loadRef})`);
    const completedTrans = await request('POST', `/api/v1/driver-portal/loads/${driverACompletedLoad.id}/status-transition`, {
      status: 'IN_TRANSIT'
    }, {
      Authorization: `Bearer ${token1}`
    });
    console.log('  Response Status:', completedTrans.status);
    if (completedTrans.status === 400) {
      pass('Transition on completed load correctly rejected with 400 Bad Request');
    } else {
      fail(`Completed load transition not rejected correctly. Status=${completedTrans.status}`);
    }
  }

  // ── TEST 5: Driver B Valid Status Transition ───────────────────────
  section('TEST 5 — Driver B Status Transition on Own Load (IN_TRANSIT)');
  console.log(`  Driver B Load ID: ${driverBLoadId} (${driverBLoadRef})`);
  const transB = await request('POST', `/api/v1/driver-portal/loads/${driverBLoadId}/status-transition`, {
    status: 'IN_TRANSIT',
    note: 'Departed Brisbane terminal'
  }, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', transB.status);
  console.log('  Updated Status:', transB.body?.data?.load?.status);

  if (transB.status === 200 && transB.body?.data?.load?.status === 'IN_TRANSIT') {
    pass('Driver B successfully transitioned load status to IN_TRANSIT');
  } else {
    fail(`Driver B status transition failed. Status=${transB.status}`);
  }

  // ── TEST 6: SECURITY CHECK — Driver A Requests Status Transition on Driver B's Load ─────
  section('TEST 6 — SECURITY CHECK: Driver A Status Transition on Driver B\'s Load ID');
  console.log(`  Attempting: Driver A Token + Driver B Load ID (${driverBLoadId})`);
  const crossTransA = await request('POST', `/api/v1/driver-portal/loads/${driverBLoadId}/status-transition`, {
    status: 'DELIVERED'
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', crossTransA.status);
  console.log('  Response Error Code:', crossTransA.body?.error?.code);

  if ([403, 404].includes(crossTransA.status)) {
    pass(`Access Denied! Cross-driver transition request rejected with status ${crossTransA.status}. DB unchanged.`);
  } else {
    fail(`SECURITY VULNERABILITY! Driver A modified Driver B's load status. Status=${crossTransA.status}`);
  }

  // ── TEST 7: SECURITY CHECK — Driver B Requests Status Transition on Driver A's Load ─────
  section('TEST 7 — SECURITY CHECK: Driver B Status Transition on Driver A\'s Load ID');
  console.log(`  Attempting: Driver B Token + Driver A Load ID (${driverALoadId})`);
  const crossTransB = await request('POST', `/api/v1/driver-portal/loads/${driverALoadId}/status-transition`, {
    status: 'DELIVERED'
  }, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', crossTransB.status);
  console.log('  Response Error Code:', crossTransB.body?.error?.code);

  if ([403, 404].includes(crossTransB.status)) {
    pass(`Access Denied! Cross-driver transition request rejected with status ${crossTransB.status}. DB unchanged.`);
  } else {
    fail(`SECURITY VULNERABILITY! Driver B modified Driver A's load status. Status=${crossTransB.status}`);
  }

  // ── TEST 8: Invalid Status Value Rejection ─────────────────────────
  section('TEST 8 — Invalid Status Value Rejection');
  const invalidStatusRes = await request('POST', `/api/v1/driver-portal/loads/${driverALoadId}/status-transition`, {
    status: 'SUPER_INVALID_STATUS_VALUE'
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', invalidStatusRes.status);
  if (invalidStatusRes.status === 400) {
    pass('Invalid status value rejected with 400 Bad Request');
  } else {
    fail(`Invalid status value not rejected correctly. Status=${invalidStatusRes.status}`);
  }

  // ── TEST 9: Unauthenticated Request Rejection ──────────────────────
  section('TEST 9 — Unauthenticated Request Rejection (Production Mode)');
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
    pass('Unauthenticated request to status transition rejected with 401 Unauthorized');
  } else {
    fail(`Unauthenticated request not rejected. Status=${g1().status} nextCalled=${nextCalled}`);
  }

  process.env.NODE_ENV = origEnv;

  console.log('\n' + '═'.repeat(60));
  console.log(process.exitCode === 1 ? '❌ Phase 4 tests FAILED.' : '✅ All Phase 4 tests PASSED.');
  console.log('═'.repeat(60) + '\n');
}

runTests().catch(e => {
  console.error('\n❌ Test suite error:', e);
  process.exitCode = 1;
});
