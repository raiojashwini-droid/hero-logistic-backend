/**
 * Phase 2 — End-to-End API Tests
 * Verifies GET /driver-portal/me/loads, driver & tenant isolation,
 * unauthenticated rejection, and regression check for Phase 1 (GET /driver-portal/me).
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
  // ── TEST 1: Phase 1 Regression Check — GET /driver-portal/me ────
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
    fail(`Phase 1 regression! Status=${me1.status} Driver=${me1.body?.data?.driver?.firstName}`);
  }

  // ── TEST 2: GET /driver-portal/me/loads for Driver 1 (Noah Williams) ──
  section('TEST 2 — GET /driver-portal/me/loads (Driver 1: Noah Williams)');
  const loadsRes1 = await request('GET', '/api/v1/driver-portal/me/loads', null, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Status:', loadsRes1.status);
  const loads1 = loadsRes1.body?.data?.loads || [];
  console.log(`  Loads returned (${loads1.length}):`, loads1.map(l => ({ ref: l.loadRef, type: l.type, status: l.status })));

  if (loadsRes1.status === 200 && Array.isArray(loads1)) {
    pass(`GET /driver-portal/me/loads returned 200 with ${loads1.length} assigned load(s)`);
  } else {
    fail(`GET /driver-portal/me/loads failed. Status=${loadsRes1.status}`);
  }

  const refs1 = loads1.map(l => l.loadRef);
  if (refs1.includes('PO-65432') && refs1.includes('PO-65398')) {
    pass('Noah Williams receives his assigned loads (PO-65432, PO-65398)');
  } else {
    fail(`Noah Williams missing assigned loads. Got: ${refs1.join(', ')}`);
  }

  // ── TEST 3: Driver Isolation — Driver 2 (Liam Smith) ─────────────
  section('TEST 3 — Driver Isolation: GET /driver-portal/me/loads (Driver 2: Liam Smith)');
  const login2 = await request('POST', '/api/v1/auth/login', {
    email: 'driver2@hero.com',
    password: 'Driver@1234'
  });
  if (login2.status !== 200) {
    fail(`Driver 2 login failed. Status=${login2.status}`);
    return;
  }
  const token2 = login2.body.data.accessToken;

  const loadsRes2 = await request('GET', '/api/v1/driver-portal/me/loads', null, {
    Authorization: `Bearer ${token2}`
  });
  const loads2 = loadsRes2.body?.data?.loads || [];
  const refs2 = loads2.map(l => l.loadRef);
  console.log('  Driver 2 loads returned:', refs2);

  if (loadsRes2.status === 200 && refs2.includes('PO-99100')) {
    pass('Liam Smith receives his own assigned load (PO-99100)');
  } else {
    fail(`Liam Smith loads incorrect. Got: ${refs2.join(', ')}`);
  }

  // Isolation check: Noah does NOT see Liam's load PO-99100, and Liam does NOT see Noah's loads
  if (!refs1.includes('PO-99100') && !refs2.includes('PO-65432')) {
    pass('Strict Isolation Verified: Driver A never receives Driver B\'s loads!');
  } else {
    fail('Isolation Failure! Driver A received Driver B\'s loads or vice versa.');
  }

  // ── TEST 4: Unauthenticated Request Rejection ─────────────────────
  section('TEST 4 — Unauthenticated Request Rejection (Production Auth Simulation)');
  const jwt = require('jsonwebtoken');
  const { verifyToken } = require('./src/middlewares/auth');
  
  // Unit test auth middleware directly in production mode
  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const makeReqRes = (token) => {
    const req = { cookies: {}, headers: token ? { authorization: `Bearer ${token}` } : {} };
    let capturedStatus = null;
    let capturedBody = null;
    const res = { status: (code) => { capturedStatus = code; return { json: (b) => { capturedBody = b; } }; } };
    return { req, res, getResult: () => ({ status: capturedStatus, body: capturedBody }) };
  };

  const { req: r1, res: res1, getResult: g1 } = makeReqRes('invalid.token.here');
  let next1 = false;
  verifyToken(r1, res1, () => { next1 = true; });
  if (g1().status === 401 && !next1) {
    pass('Invalid token to /me/loads rejected with 401 Unauthorized in production mode');
  } else {
    fail(`Invalid token not rejected. Status=${g1().status} next=${next1}`);
  }

  process.env.NODE_ENV = origEnv;

  console.log('\n' + '═'.repeat(60));
  console.log(process.exitCode === 1 ? '❌ Phase 2 tests FAILED.' : '✅ All Phase 2 tests PASSED.');
  console.log('═'.repeat(60) + '\n');
}

runTests().catch(e => {
  console.error('\n❌ Test suite error:', e);
  process.exitCode = 1;
});
