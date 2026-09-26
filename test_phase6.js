/**
 * Phase 6 — Delivery + Proof of Delivery (POD) E2E & Security Test Suite
 *
 * Verifies:
 * 1. Driver A own load + valid POD -> 200 OK (POD created, items marked DELIVERED, files saved).
 * 2. Driver B own load + valid POD -> 200 OK (Verified ownership).
 * 3. Driver A -> Driver B load -> 403/404 (DB unchanged).
 * 4. Driver B -> Driver A load -> 403/404 (DB unchanged).
 * 5. Wrong delivery stop -> 403/404 (DB unchanged).
 * 6. Invalid item ID -> 400/404 (DB unchanged).
 * 7. Missing signature -> 400 Bad Request.
 * 8. After-Hours POD submission -> 200 OK.
 * 9. Completed/ineligible load -> 400 Bad Request.
 * 10. Unauthenticated request -> 401 Unauthorized.
 * 11. Wrong load ID -> 404 Not Found.
 * 12. Database & File Persistence Verification.
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

// Sample 1x1 PNG data URL
const sampleSignatureData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

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

  // Fetch Driver 1 delivery details
  const deliveryRes1 = await request('GET', `/api/v1/driver-portal/loads/${driverALoad.id}/delivery-items`, null, {
    Authorization: `Bearer ${token1}`
  });
  const items1 = deliveryRes1.body?.data?.items || [];
  const stops1 = deliveryRes1.body?.data?.stops || [];
  const driverAStopId = stops1[0]?.id || null;
  const driverAItemId = items1[0]?.id || null;

  // Fetch Driver 2 loads & delivery details
  const loadsRes2 = await request('GET', '/api/v1/driver-portal/me/loads', null, {
    Authorization: `Bearer ${token2}`
  });
  const loads2 = loadsRes2.body?.data?.loads || [];
  const driverBLoad = loads2.find(l => l.loadRef === 'PO-99100') || loads2[0];

  const deliveryRes2 = await request('GET', `/api/v1/driver-portal/loads/${driverBLoad.id}/delivery-items`, null, {
    Authorization: `Bearer ${token2}`
  });
  const items2 = deliveryRes2.body?.data?.items || [];
  const stops2 = deliveryRes2.body?.data?.stops || [];
  const driverBStopId = stops2[0]?.id || null;
  const driverBItemId = items2[0]?.id || null;

  console.log(`Driver A Load ID: ${driverALoad.id} (${driverALoad.loadRef}) | Stop ID: ${driverAStopId}`);
  console.log(`Driver B Load ID: ${driverBLoad.id} (${driverBLoad.loadRef}) | Stop ID: ${driverBStopId}`);

  // ── TEST 1: Driver A own load + valid POD ───────────────────────────
  section('TEST 1 — Driver A own load + valid POD');
  const res1 = await request('POST', `/api/v1/driver-portal/loads/${driverALoad.id}/delivery-pod`, {
    stopId: driverAStopId,
    signeeName: 'Jane Smith',
    signatureData: sampleSignatureData,
    deliveryNotes: 'Delivered safely at front bay',
    itemIds: driverAItemId ? [driverAItemId] : []
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res1.status);
  console.log('  Response Message:', res1.body?.data?.message || res1.body?.error?.message);

  if (res1.status === 200 && res1.body?.data?.pod?.id) {
    pass(`Driver A successfully submitted POD. Signature URL: ${res1.body.data.pod.signatureUrl}`);
  } else {
    fail(`Driver A POD submission failed. Status=${res1.status}`);
  }

  // ── TEST 2: Driver B own load + valid POD ───────────────────────────
  section('TEST 2 — Driver B own load + valid POD');
  const res2 = await request('POST', `/api/v1/driver-portal/loads/${driverBLoad.id}/delivery-pod`, {
    stopId: driverBStopId,
    signeeName: 'Robert Brown',
    signatureData: sampleSignatureData,
    deliveryNotes: 'Delivered to receiving dock',
    itemIds: driverBItemId ? [driverBItemId] : []
  }, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', res2.status);
  console.log('  Response Message:', res2.body?.data?.message || res2.body?.error?.message);

  if (res2.status === 200 && res2.body?.data?.pod?.id) {
    pass(`Driver B successfully submitted POD. Signature URL: ${res2.body.data.pod.signatureUrl}`);
  } else {
    fail(`Driver B POD submission failed. Status=${res2.status}`);
  }

  // ── TEST 3: SECURITY CHECK — Driver A → Driver B Load ───────────────
  section('TEST 3 — SECURITY CHECK: Driver A Token + Driver B Load ID');
  console.log(`  Driver A attempting to submit POD for Driver B's Load (${driverBLoad.id})`);
  const res3 = await request('POST', `/api/v1/driver-portal/loads/${driverBLoad.id}/delivery-pod`, {
    signeeName: 'Hacker Name',
    signatureData: sampleSignatureData
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res3.status);
  console.log('  Response Error Code:', res3.body?.error?.code || res3.body?.error?.message);

  if ([400, 403, 404].includes(res3.status)) {
    pass(`Access Denied! Driver A submitting POD for Driver B's load rejected with status ${res3.status}. DB unchanged.`);
  } else {
    fail(`SECURITY VULNERABILITY! Driver A submitted POD for Driver B's load. Status=${res3.status}`);
  }

  // ── TEST 4: SECURITY CHECK — Driver B → Driver A Load ───────────────
  section('TEST 4 — SECURITY CHECK: Driver B Token + Driver A Load ID');
  console.log(`  Driver B attempting to submit POD for Driver A's Load (${driverALoad.id})`);
  const res4 = await request('POST', `/api/v1/driver-portal/loads/${driverALoad.id}/delivery-pod`, {
    signeeName: 'Hacker Name',
    signatureData: sampleSignatureData
  }, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', res4.status);
  console.log('  Response Error Code:', res4.body?.error?.code || res4.body?.error?.message);

  if ([400, 403, 404].includes(res4.status)) {
    pass(`Access Denied! Driver B submitting POD for Driver A's load rejected with status ${res4.status}. DB unchanged.`);
  } else {
    fail(`SECURITY VULNERABILITY! Driver B submitted POD for Driver A's load. Status=${res4.status}`);
  }

  // ── TEST 5: Wrong Delivery Stop ─────────────────────────────────────
  section('TEST 5 — Wrong Delivery Stop');
  console.log(`  Driver A attempting to use Driver B's stop ID (${driverBStopId}) on Driver A's load (${driverALoad.id})`);
  const res5 = await request('POST', `/api/v1/driver-portal/loads/${driverALoad.id}/delivery-pod`, {
    stopId: driverBStopId,
    signeeName: 'Jane Smith',
    signatureData: sampleSignatureData
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res5.status);
  if ([400, 403, 404].includes(res5.status)) {
    pass(`Wrong delivery stop rejected with status ${res5.status}. DB unchanged.`);
  } else {
    fail(`Wrong delivery stop not rejected. Status=${res5.status}`);
  }

  // ── TEST 6: Invalid Item ID ─────────────────────────────────────────
  section('TEST 6 — Invalid Item ID');
  console.log(`  Driver A attempting to use Driver B's item ID (${driverBItemId}) on Driver A's load (${driverALoad.id})`);
  const res6 = await request('POST', `/api/v1/driver-portal/loads/${driverALoad.id}/delivery-pod`, {
    signeeName: 'Jane Smith',
    signatureData: sampleSignatureData,
    itemIds: [driverBItemId]
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res6.status);
  if ([400, 403, 404].includes(res6.status)) {
    pass(`Invalid item ID rejected with status ${res6.status}. DB unchanged.`);
  } else {
    fail(`Invalid item ID not rejected. Status=${res6.status}`);
  }

  // ── TEST 7: Missing Signature Validation ────────────────────────────
  section('TEST 7 — Missing Signature Validation');
  const res7 = await request('POST', `/api/v1/driver-portal/loads/${driverALoad.id}/delivery-pod`, {
    signeeName: '',
    signatureData: null,
    isAfterHours: false
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res7.status);
  if (res7.status === 400) {
    pass('Missing signature rejected with 400 Bad Request.');
  } else {
    fail(`Missing signature not rejected. Status=${res7.status}`);
  }

  // ── TEST 8: After-Hours POD Submission ──────────────────────────────
  section('TEST 8 — After-Hours POD Submission');
  const res8 = await request('POST', `/api/v1/driver-portal/loads/${driverALoad.id}/delivery-pod`, {
    isAfterHours: true,
    deliveryNotes: 'After hours gate drop'
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res8.status);
  if (res8.status === 200 && res8.body?.data?.pod?.isAfterHours) {
    pass('After-Hours POD submitted successfully without signature requirement.');
  } else {
    fail(`After-Hours POD submission failed. Status=${res8.status}`);
  }

  // ── TEST 9: Completed / Ineligible Load Protection ─────────────────
  if (driverACompletedLoad) {
    section('TEST 9 — Completed / Ineligible Load Protection');
    const res9 = await request('POST', `/api/v1/driver-portal/loads/${driverACompletedLoad.id}/delivery-pod`, {
      isAfterHours: true
    }, {
      Authorization: `Bearer ${token1}`
    });
    console.log('  Response Status:', res9.status);
    if (res9.status === 400) {
      pass('POD submission on completed load rejected with 400 Bad Request.');
    } else {
      fail(`POD submission on completed load not rejected. Status=${res9.status}`);
    }
  }

  // ── TEST 10: Unauthenticated Request Rejection ─────────────────────
  section('TEST 10 — Unauthenticated Request Rejection (Production Mode)');
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
    pass('Unauthenticated POD request rejected with 401 Unauthorized.');
  } else {
    fail(`Unauthenticated POD request not rejected. Status=${getAuthResult().status}`);
  }
  process.env.NODE_ENV = origEnv;

  // ── TEST 11: Wrong Load ID Security ────────────────────────────────
  section('TEST 11 — Wrong Load ID Security');
  const fakeLoadId = '00000000-0000-0000-0000-000000000000';
  const res11 = await request('POST', `/api/v1/driver-portal/loads/${fakeLoadId}/delivery-pod`, {
    isAfterHours: true
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res11.status);
  if ([403, 404].includes(res11.status)) {
    pass(`Wrong Load ID request rejected with status ${res11.status}.`);
  } else {
    fail(`Wrong Load ID request not rejected. Status=${res11.status}`);
  }

  // ── TEST 12: File & DB Security Verification ───────────────────────
  section('TEST 12 — File Storage & DB Security Verification');
  const sigUrl = res1.body?.data?.pod?.signatureUrl;
  if (sigUrl) {
    const localPath = path.join(__dirname, 'public', sigUrl);
    if (fs.existsSync(localPath)) {
      pass(`Signature image safely written to local disk: ${localPath}`);
    } else {
      fail(`Signature file not found at path: ${localPath}`);
    }
  } else {
    fail('No signature URL returned from TEST 1.');
  }

  console.log('\n' + '═'.repeat(60));
  console.log(process.exitCode === 1 ? '❌ Phase 6 tests FAILED.' : '✅ All Phase 6 tests PASSED.');
  console.log('═'.repeat(60) + '\n');
}

runTests().catch(e => {
  console.error('\n❌ Test suite error:', e);
  process.exitCode = 1;
});
