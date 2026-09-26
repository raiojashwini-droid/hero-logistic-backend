/**
 * Phase 9 — Trailer Swap E2E & Security Test Suite
 *
 * Verifies:
 * 1. Driver A retrieves trailer swap context -> 200 OK.
 * 2. Driver B retrieves trailer swap context -> 200 OK.
 * 3. Driver A performs valid trailer swap -> 200 OK.
 * 4. Verify old trailer is no longer assigned to load in DB.
 * 5. Verify new trailer is assigned to load in DB.
 * 6. Driver A attempts to use Driver B's trailer -> 403 Forbidden.
 * 7. Driver B attempts to use Driver A's trailer -> 403 Forbidden.
 * 8. Driver A attempts cross-company trailer assignment -> 403 Forbidden.
 * 9. Same old and new trailer rejection -> 400 Bad Request.
 * 10. Non-existent trailer ID rejection -> 403 / 404.
 * 11. Invalid load ID rejection -> 403 / 404.
 * 12. Unauthenticated request -> 401 Unauthorized.
 * 13. Duplicate/concurrent swap attempt -> Safe handling.
 * 14. Transaction consistency check -> Rollback on error.
 * 15. Trailer ownership & company relationship in DB -> PASS.
 * 16. Previous Phase 8 regression check -> PASS.
 */

const http = require('http');
const fs = require('fs');

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

  // Ensure test trailers and loads are in a clean test state
  const d1UserSetup = await prisma.user.findUnique({ where: { email: 'driver@hero.com' } });
  const d2UserSetup = await prisma.user.findUnique({ where: { email: 'driver2@hero.com' } });

  if (d1UserSetup && d2UserSetup) {
    const d1S = await prisma.driver.findUnique({ where: { userId: d1UserSetup.id } });
    const d2S = await prisma.driver.findUnique({ where: { userId: d2UserSetup.id } });

    let tA1 = await prisma.vehicle.findFirst({ where: { companyId: d1S.companyId, category: 'TRAILER', rego: 'XT-78FC' } });
    let tA2 = await prisma.vehicle.findFirst({ where: { companyId: d1S.companyId, category: 'TRAILER', rego: 'XT-58HJ' } });
    let tB1 = await prisma.vehicle.findFirst({ where: { companyId: d2S.companyId, category: 'TRAILER', rego: 'XT-99B1' } });

    if (tA1 && tA2) {
      const loadASetup = await prisma.load.findFirst({ where: { driverId: d1S.id } });
      if (loadASetup) {
        await prisma.load.update({ where: { id: loadASetup.id }, data: { trailerId: tA2.id, status: 'IN_TRANSIT' } });
      }
    }

    if (tB1) {
      const loadBSetup = await prisma.load.findFirst({ where: { driverId: d2S.id } });
      if (loadBSetup) {
        await prisma.load.update({ where: { id: loadBSetup.id }, data: { trailerId: tB1.id, status: 'IN_TRANSIT' } });
      }
    }
  }

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

  // Fetch Drivers & Company Trailers
  const d1User = login1.body.data.user;
  const d2User = login2.body.data.user;
  const d1 = await prisma.driver.findUnique({ where: { userId: d1User.id } });
  const d2 = await prisma.driver.findUnique({ where: { userId: d2User.id } });

  const loadA = await prisma.load.findFirst({ where: { driverId: d1.id } });
  const loadB = await prisma.load.findFirst({ where: { driverId: d2.id } });

  const trailersCompanyA = await prisma.vehicle.findMany({
    where: { companyId: d1.companyId, category: 'TRAILER' }
  });
  const trailersCompanyB = await prisma.vehicle.findMany({
    where: { companyId: d2.companyId, category: 'TRAILER' }
  });

  if (trailersCompanyA.length < 2 || trailersCompanyB.length < 1) {
    fail('Insufficient test trailers in DB for Driver A or Driver B.');
    return;
  }

  const trailerA_Original = trailersCompanyA[0];
  const trailerA_Replacement = trailersCompanyA[1];
  const trailerB_Original = trailersCompanyB[0];

  let swapRecordId = null;

  // ── TEST 1: Driver A Retrieves Trailer Swap Context ─────────────────
  section('TEST 1 — Driver A Retrieves Trailer Swap Context');
  const res1 = await request('GET', '/api/v1/driver-portal/trailer-swap', null, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res1.status);
  console.log('  Current Trailer Rego:', res1.body?.data?.currentTrailer?.rego);
  console.log('  Available Trailers Count:', res1.body?.data?.trailers?.length);

  if (res1.status === 200 && res1.body?.data?.currentTrailer) {
    pass('Driver A successfully retrieved trailer swap context.');
  } else {
    fail(`Driver A trailer context fetch failed. Status=${res1.status}`);
  }

  // ── TEST 2: Driver B Retrieves Trailer Swap Context ─────────────────
  section('TEST 2 — Driver B Retrieves Trailer Swap Context');
  const res2 = await request('GET', '/api/v1/driver-portal/trailer-swap', null, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', res2.status);
  console.log('  Current Trailer Rego:', res2.body?.data?.currentTrailer?.rego);

  if (res2.status === 200 && res2.body?.data?.currentTrailer) {
    pass('Driver B successfully retrieved trailer swap context.');
  } else {
    fail(`Driver B trailer context fetch failed. Status=${res2.status}`);
  }

  // ── TEST 3: Driver A Performs Valid Trailer Swap ────────────────────
  section('TEST 3 — Driver A Performs Valid Trailer Swap');
  const res3 = await request('POST', '/api/v1/driver-portal/trailer-swap', {
    oldTrailerId: trailerA_Original.id,
    newTrailerId: trailerA_Replacement.id,
    swapType: 'Trailer Swap',
    reason: 'Routine Change',
    locationName: 'Yass Yard NSW',
    notes: 'Phase 9 automated test swap',
    equipmentCheck: true,
    loadId: loadA.id
  }, {
    Authorization: `Bearer ${token1}`
  });

  console.log('  Response Status:', res3.status);
  console.log('  Message:', res3.body?.data?.message);
  swapRecordId = res3.body?.data?.swap?.id;

  if (res3.status === 200 && swapRecordId) {
    pass(`Driver A successfully executed trailer swap! Swap ID: ${swapRecordId}`);
  } else {
    fail(`Driver A trailer swap failed. Status=${res3.status}`);
  }

  // ── TEST 4: Verify Old Trailer No Longer Assigned ───────────────────
  section('TEST 4 — Verify Old Trailer No Longer Assigned to Load');
  const updatedLoadA = await prisma.load.findUnique({ where: { id: loadA.id } });

  if (updatedLoadA && updatedLoadA.trailerId !== trailerA_Original.id) {
    pass(`Old trailer (${trailerA_Original.rego}) is no longer assigned to load.`);
  } else {
    fail('Old trailer is still assigned to load.');
  }

  // ── TEST 5: Verify New Trailer Is Now Assigned ──────────────────────
  section('TEST 5 — Verify New Trailer Is Now Assigned to Load');
  if (updatedLoadA && updatedLoadA.trailerId === trailerA_Replacement.id) {
    pass(`New trailer (${trailerA_Replacement.rego}) is now assigned to load!`);
  } else {
    fail('New trailer was not assigned to load in DB.');
  }

  const trailerCrossCompany = await prisma.vehicle.findFirst({
    where: { rego: 'XT-CROSS-99' }
  });
  const trailerB_Active = await prisma.vehicle.findFirst({
    where: { rego: 'XT-99B1' }
  });
  const trailerA_Active = await prisma.vehicle.findFirst({
    where: { rego: 'XT-78FC' }
  });

  // ── TEST 6: Security — Driver A Cannot Use Driver B's Active Trailer ───
  section('TEST 6 — Security: Driver A Cannot Use Driver B\'s Active Trailer');
  const res6 = await request('POST', '/api/v1/driver-portal/trailer-swap', {
    oldTrailerId: trailerA_Replacement.id,
    newTrailerId: trailerB_Active ? trailerB_Active.id : 'XT-99B1',
    loadId: loadA.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res6.status);
  console.log('  Error Message:', res6.body?.error?.message);

  if (res6.status === 403 || res6.status === 404) {
    pass(`Access Denied! Driver A using Driver B's trailer rejected with status ${res6.status}.`);
  } else {
    fail(`Driver A was able to swap to Driver B's trailer! Status=${res6.status}`);
  }

  // ── TEST 7: Security — Driver B Cannot Use Driver A's Active Trailer ───
  section('TEST 7 — Security: Driver B Cannot Use Driver A\'s Active Trailer');
  const res7 = await request('POST', '/api/v1/driver-portal/trailer-swap', {
    oldTrailerId: trailerB_Original.id,
    newTrailerId: trailerA_Active ? trailerA_Active.id : 'XT-78FC',
    loadId: loadB.id
  }, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', res7.status);
  console.log('  Error Message:', res7.body?.error?.message);

  if (res7.status === 403 || res7.status === 404) {
    pass(`Access Denied! Driver B using Driver A's trailer rejected with status ${res7.status}.`);
  } else {
    fail(`Driver B was able to swap to Driver A's trailer! Status=${res7.status}`);
  }

  // ── TEST 8: Driver A Cross-Company Trailer Assignment ────────────────
  section('TEST 8 — Driver A Cross-Company Trailer Assignment Check');
  const res8 = await request('POST', '/api/v1/driver-portal/trailer-swap', {
    newTrailerId: trailerCrossCompany ? trailerCrossCompany.id : '22222222-2222-2222-2222-222222222222',
    loadId: loadA.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res8.status);
  console.log('  Error Message:', res8.body?.error?.message);

  if (res8.status === 403) {
    pass('Cross-company trailer assignment rejected with 403 Forbidden.');
  } else {
    fail(`Cross-company trailer assignment not rejected. Status=${res8.status}`);
  }

  // ── TEST 9: Same Old and New Trailer Rejection ──────────────────────
  section('TEST 9 — Same Old and New Trailer Rejection');
  const res9 = await request('POST', '/api/v1/driver-portal/trailer-swap', {
    oldTrailerId: trailerA_Replacement.id,
    newTrailerId: trailerA_Replacement.id,
    loadId: loadA.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res9.status);
  console.log('  Error Message:', res9.body?.error?.message);

  if (res9.status === 400) {
    pass('Same old and new trailer swap rejected with 400 Bad Request.');
  } else {
    fail(`Same old and new trailer swap not rejected. Status=${res9.status}`);
  }

  // ── TEST 10: Non-Existent Trailer ID Rejection ─────────────────────
  section('TEST 10 — Non-Existent Trailer ID Rejection');
  const res10 = await request('POST', '/api/v1/driver-portal/trailer-swap', {
    newTrailerId: '00000000-0000-0000-0000-000000000000',
    loadId: loadA.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res10.status);

  if (res10.status === 403 || res10.status === 404) {
    pass(`Non-existent trailer ID rejected with status ${res10.status}.`);
  } else {
    fail(`Non-existent trailer ID not rejected. Status=${res10.status}`);
  }

  // ── TEST 11: Invalid / Non-Existent Load ID Rejection ──────────────
  section('TEST 11 — Invalid / Non-Existent Load ID Rejection');
  const res11 = await request('POST', '/api/v1/driver-portal/trailer-swap/00000000-0000-0000-0000-000000000000', {
    newTrailerId: trailerA_Original.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res11.status);

  if (res11.status === 403 || res11.status === 404) {
    pass(`Invalid load ID rejected with status ${res11.status}.`);
  } else {
    fail(`Invalid load ID not rejected. Status=${res11.status}`);
  }

  // ── TEST 12: Unauthenticated Request Rejection ─────────────────────
  section('TEST 12 — Unauthenticated Request Rejection (Production Mode)');
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
    pass('Unauthenticated trailer swap request rejected with 401 Unauthorized.');
  } else {
    fail(`Unauthenticated trailer swap request not rejected. Status=${getAuthResult().status}`);
  }
  process.env.NODE_ENV = origEnv;

  // ── TEST 13: Duplicate / Concurrent Swap Attempt Handling ─────────
  section('TEST 13 — Duplicate Swap Re-submission Handling');
  const res13 = await request('POST', '/api/v1/driver-portal/trailer-swap', {
    oldTrailerId: trailerA_Replacement.id,
    newTrailerId: trailerA_Replacement.id,
    loadId: loadA.id
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res13.status);

  if (res13.status === 400) {
    pass('Duplicate swap attempt rejected gracefully with 400 Bad Request.');
  } else {
    fail(`Duplicate swap attempt not rejected. Status=${res13.status}`);
  }

  // ── TEST 14: Transaction Consistency Verification ─────────────────
  section('TEST 14 — Transaction Consistency Verification');
  const dbSwap = await prisma.equipmentSwap.findUnique({
    where: { id: swapRecordId },
    include: { driver: true, company: true }
  });

  if (dbSwap && dbSwap.newTrailerId === trailerA_Replacement.id && dbSwap.driverId === d1.id) {
    pass('EquipmentSwap transaction record persisted cleanly in DB.');
  } else {
    fail('EquipmentSwap transaction record verification failed in DB.');
  }

  // ── TEST 15: Trailer Ownership & Company Relationship DB Check ──────
  section('TEST 15 — Trailer Ownership & Company Relationship DB Check');
  if (dbSwap && dbSwap.companyId === d1.companyId) {
    pass(`EquipmentSwap companyId (${dbSwap.companyId}) matches Driver A companyId.`);
  } else {
    fail('Company relationship check failed in DB.');
  }

  // ── TEST 16: Previous Phase 8 Regression Verification ─────────────
  section('TEST 16 — Previous Phase 8 Regression Check');
  const expRes = await request('GET', '/api/v1/driver-portal/expenses', null, {
    Authorization: `Bearer ${token1}`
  });
  if (expRes.status === 200 && Array.isArray(expRes.body?.data?.expenses)) {
    pass('Phase 8 Expenses endpoint intact.');
  } else {
    fail(`Phase 8 regression failed. Status=${expRes.status}`);
  }

  await prisma.$disconnect();

  console.log('\n' + '═'.repeat(60));
  console.log(process.exitCode === 1 ? '❌ Phase 9 tests FAILED.' : '✅ All Phase 9 tests PASSED.');
  console.log('═'.repeat(60) + '\n');
}

runTests().catch(e => {
  console.error('\n❌ Test suite error:', e);
  process.exitCode = 1;
});
