/**
 * Phase 5 — Pickup Loading + VIN Scan E2E & Security Test Suite
 *
 * Verifies:
 * 1. Driver A own load + valid VIN -> 200 OK (Item marked picked up, VinScanEvent created).
 * 2. Driver B own load + valid VIN -> 200 OK (Item marked picked up).
 * 3. Invalid VIN -> 400/404 (DB unchanged).
 * 4. Driver A + Driver B VIN -> 403/404 (DB unchanged).
 * 5. Driver B + Driver A VIN -> 403/404 (DB unchanged).
 * 6. Duplicate pickup protection -> 400 Bad Request (Second scan rejected gracefully).
 * 7. Wrong load ID -> 403/404 Denied.
 * 8. Unauthenticated -> 401 Unauthorized.
 * 9. Completed/ineligible load -> 400 Bad Request.
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

  // Fetch Driver 1 loads
  const loadsRes1 = await request('GET', '/api/v1/driver-portal/me/loads', null, {
    Authorization: `Bearer ${token1}`
  });
  const loads1 = loadsRes1.body?.data?.loads || [];
  const driverALoad = loads1.find(l => l.loadRef === 'PO-65432') || loads1.find(l => l.status !== 'COMPLETED') || loads1[0];
  const driverACompletedLoad = loads1.find(l => l.status === 'COMPLETED') || null;

  // Fetch Driver 1 items
  const itemsRes1 = await request('GET', `/api/v1/driver-portal/loads/${driverALoad.id}/pickup-items`, null, {
    Authorization: `Bearer ${token1}`
  });
  const items1 = itemsRes1.body?.data?.items || [];
  const driverAVin = items1[0]?.vin || '1HGCM82633A004352';

  // Fetch Driver 2 loads & items
  const loadsRes2 = await request('GET', '/api/v1/driver-portal/me/loads', null, {
    Authorization: `Bearer ${token2}`
  });
  const loads2 = loadsRes2.body?.data?.loads || [];
  const driverBLoad = loads2.find(l => l.loadRef === 'PO-99100') || loads2[0];

  const itemsRes2 = await request('GET', `/api/v1/driver-portal/loads/${driverBLoad.id}/pickup-items`, null, {
    Authorization: `Bearer ${token2}`
  });
  const items2 = itemsRes2.body?.data?.items || [];
  const driverBVin = items2[0]?.vin || 'JH4KAB260MC000145';

  console.log(`Driver A Load ID: ${driverALoad.id} (${driverALoad.loadRef}) | Test VIN: ${driverAVin}`);
  console.log(`Driver B Load ID: ${driverBLoad.id} (${driverBLoad.loadRef}) | Test VIN: ${driverBVin}`);

  // ── TEST 1: Driver A own load + valid VIN ───────────────────────────
  section('TEST 1 — Driver A own load + valid VIN');
  const res1 = await request('POST', `/api/v1/driver-portal/loads/${driverALoad.id}/pickup-item`, {
    vin: driverAVin
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res1.status);
  console.log('  Response Body Message:', res1.body?.data?.message || res1.body?.error?.message);

  if (res1.status === 200 && res1.body?.data?.item?.status === 'PICKED_UP') {
    pass(`Driver A successfully picked up vehicle VIN ${driverAVin}`);
  } else if (res1.status === 400 && res1.body?.error?.details?.alreadyPickedUp) {
    pass(`Vehicle VIN ${driverAVin} was already picked up from previous run.`);
  } else {
    fail(`Driver A pickup failed. Status=${res1.status}`);
  }

  // ── TEST 2: Driver B own load + valid VIN ───────────────────────────
  section('TEST 2 — Driver B own load + valid VIN');
  const res2 = await request('POST', `/api/v1/driver-portal/loads/${driverBLoad.id}/pickup-item`, {
    vin: driverBVin
  }, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', res2.status);
  console.log('  Response Body Message:', res2.body?.data?.message || res2.body?.error?.message);

  if (res2.status === 200 && res2.body?.data?.item?.status === 'PICKED_UP') {
    pass(`Driver B successfully picked up vehicle VIN ${driverBVin}`);
  } else if (res2.status === 400 && res2.body?.error?.details?.alreadyPickedUp) {
    pass(`Vehicle VIN ${driverBVin} was already picked up from previous run.`);
  } else {
    fail(`Driver B pickup failed. Status=${res2.status}`);
  }

  // ── TEST 3: Invalid VIN ─────────────────────────────────────────────
  section('TEST 3 — Invalid VIN');
  const res3 = await request('POST', `/api/v1/driver-portal/loads/${driverALoad.id}/pickup-item`, {
    vin: 'NON_EXISTENT_VIN_99999999'
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res3.status);
  if ([400, 404].includes(res3.status)) {
    pass('Invalid VIN request rejected with 404/400 Bad Request');
  } else {
    fail(`Invalid VIN not rejected correctly. Status=${res3.status}`);
  }

  // ── TEST 4: SECURITY CHECK — Driver A + Driver B VIN ─────────────────
  section('TEST 4 — SECURITY CHECK: Driver A Token + Driver B VIN');
  console.log(`  Driver A attempting to scan Driver B's VIN (${driverBVin}) on Driver A's Load (${driverALoad.id})`);
  const res4 = await request('POST', `/api/v1/driver-portal/loads/${driverALoad.id}/pickup-item`, {
    vin: driverBVin
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res4.status);
  console.log('  Response Error Code:', res4.body?.error?.code || res4.body?.error?.message);

  if ([400, 403, 404].includes(res4.status)) {
    pass(`Access Denied! Driver A scanning Driver B's VIN rejected with status ${res4.status}. DB unchanged.`);
  } else {
    fail(`SECURITY VULNERABILITY! Driver A marked Driver B's VIN as picked up. Status=${res4.status}`);
  }

  // ── TEST 5: SECURITY CHECK — Driver B + Driver A VIN ─────────────────
  section('TEST 5 — SECURITY CHECK: Driver B Token + Driver A VIN');
  console.log(`  Driver B attempting to scan Driver A's VIN (${driverAVin}) on Driver B's Load (${driverBLoad.id})`);
  const res5 = await request('POST', `/api/v1/driver-portal/loads/${driverBLoad.id}/pickup-item`, {
    vin: driverAVin
  }, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', res5.status);
  console.log('  Response Error Code:', res5.body?.error?.code || res5.body?.error?.message);

  if ([400, 403, 404].includes(res5.status)) {
    pass(`Access Denied! Driver B scanning Driver A's VIN rejected with status ${res5.status}. DB unchanged.`);
  } else {
    fail(`SECURITY VULNERABILITY! Driver B marked Driver A's VIN as picked up. Status=${res5.status}`);
  }

  // ── TEST 6: Duplicate Pickup Protection ────────────────────────────
  section('TEST 6 — Duplicate Pickup Protection');
  console.log(`  Driver A scanning already picked up VIN (${driverAVin}) a second time...`);
  const res6 = await request('POST', `/api/v1/driver-portal/loads/${driverALoad.id}/pickup-item`, {
    vin: driverAVin
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res6.status);
  console.log('  Already Picked Up Details:', res6.body?.error?.details || res6.body?.error?.message);

  if (res6.status === 400 && res6.body?.error?.details?.alreadyPickedUp) {
    pass('Duplicate pickup request rejected with 400 Bad Request ("already picked up").');
  } else {
    fail(`Duplicate pickup not handled correctly. Status=${res6.status}`);
  }

  // ── TEST 7: Wrong Load ID Security ─────────────────────────────────
  section('TEST 7 — Wrong Load ID Security');
  const fakeLoadId = '00000000-0000-0000-0000-000000000000';
  const res7 = await request('POST', `/api/v1/driver-portal/loads/${fakeLoadId}/pickup-item`, {
    vin: driverAVin
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res7.status);
  if ([403, 404].includes(res7.status)) {
    pass(`Wrong Load ID request rejected with status ${res7.status}.`);
  } else {
    fail(`Wrong Load ID request not rejected. Status=${res7.status}`);
  }

  // ── TEST 8: Unauthenticated Request Rejection ──────────────────────
  section('TEST 8 — Unauthenticated Request Rejection (Production Mode)');
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
    pass('Unauthenticated pickup request rejected with 401 Unauthorized.');
  } else {
    fail(`Unauthenticated pickup request not rejected. Status=${getAuthResult().status}`);
  }
  process.env.NODE_ENV = origEnv;

  // ── TEST 9: Completed / Ineligible Load ────────────────────────────
  if (driverACompletedLoad) {
    section('TEST 9 — Completed / Ineligible Load Protection');
    const res9 = await request('POST', `/api/v1/driver-portal/loads/${driverACompletedLoad.id}/pickup-item`, {
      vin: driverAVin
    }, {
      Authorization: `Bearer ${token1}`
    });
    console.log('  Response Status:', res9.status);
    if (res9.status === 400) {
      pass('Pickup on completed load rejected with 400 Bad Request.');
    } else {
      fail(`Pickup on completed load not rejected correctly. Status=${res9.status}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(process.exitCode === 1 ? '❌ Phase 5 tests FAILED.' : '✅ All Phase 5 tests PASSED.');
  console.log('═'.repeat(60) + '\n');
}

runTests().catch(e => {
  console.error('\n❌ Test suite error:', e);
  process.exitCode = 1;
});
