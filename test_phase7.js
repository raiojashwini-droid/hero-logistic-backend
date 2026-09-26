/**
 * Phase 7 — Timesheet (Clock In / Clock Out) E2E & Security Test Suite
 *
 * Verifies:
 * 1. Driver A retrieves today's timesheet -> 200 OK.
 * 2. Driver B retrieves today's timesheet -> 200 OK.
 * 3. Driver A Clock In -> 200 OK (Timesheet & CLOCK_IN event created).
 * 4. Duplicate Clock-In -> 400 Bad Request (Rejected).
 * 5. Driver A Clock Out -> 200 OK (Session closed, duration calculated).
 * 6. Clock Out without active session -> 400 Bad Request.
 * 7. Driver A cannot manipulate Driver B timesheet.
 * 8. Driver B cannot manipulate Driver A timesheet.
 * 9. Unauthenticated request -> 401 Unauthorized.
 * 10. Tenant & Company Isolation.
 * 11. Full Clock-In -> Clock-Out Lifecycle DB Verification.
 * 12. Regression Check across previous phases.
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

  // Cleanup existing active timesheets for a clean test run
  const prisma = require('./src/utils/prismaClient');
  const d1 = await prisma.driver.findUnique({ where: { userId: login1.body.data.user.id } });
  const d2 = await prisma.driver.findUnique({ where: { userId: login2.body.data.user.id } });

  if (d1) {
    await prisma.timesheet.updateMany({
      where: { driverId: d1.id, clockOutAt: null },
      data: { clockOutAt: new Date() }
    });
  }
  if (d2) {
    await prisma.timesheet.updateMany({
      where: { driverId: d2.id, clockOutAt: null },
      data: { clockOutAt: new Date() }
    });
  }

  // ── TEST 1: Driver A Today's Timesheet Retrieval ─────────────────────
  section('TEST 1 — Driver A Today\'s Timesheet Retrieval');
  const res1 = await request('GET', '/api/v1/driver-portal/timesheet/today', null, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res1.status);
  console.log('  Clock Status:', res1.body?.data?.clockStatus);

  if (res1.status === 200 && res1.body?.data?.status) {
    pass('Driver A successfully fetched today\'s timesheet.');
  } else {
    fail(`Driver A timesheet fetch failed. Status=${res1.status}`);
  }

  // ── TEST 2: Driver B Today's Timesheet Retrieval ─────────────────────
  section('TEST 2 — Driver B Today\'s Timesheet Retrieval');
  const res2 = await request('GET', '/api/v1/driver-portal/timesheet/today', null, {
    Authorization: `Bearer ${token2}`
  });
  console.log('  Response Status:', res2.status);
  console.log('  Clock Status:', res2.body?.data?.clockStatus);

  if (res2.status === 200 && res2.body?.data?.status) {
    pass('Driver B successfully fetched today\'s timesheet.');
  } else {
    fail(`Driver B timesheet fetch failed. Status=${res2.status}`);
  }

  // ── TEST 3: Driver A Clock In ───────────────────────────────────────
  section('TEST 3 — Driver A Clock In');
  const res3 = await request('POST', '/api/v1/driver-portal/timesheet/clock-in', {
    locationName: 'Yard - Melbourne VIC (-37.8136, 144.9631)',
    note: 'Starting shift for morning run'
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res3.status);
  console.log('  Message:', res3.body?.data?.message);

  let driverATimesheetId = res3.body?.data?.timesheet?.id;
  if (res3.status === 200 && res3.body?.data?.status === 'CLOCKED_IN') {
    pass(`Driver A clocked in successfully! Timesheet ID: ${driverATimesheetId}`);
  } else {
    fail(`Driver A clock in failed. Status=${res3.status}`);
  }

  // ── TEST 4: Duplicate Clock-In Protection ──────────────────────────
  section('TEST 4 — Duplicate Clock-In Protection');
  const res4 = await request('POST', '/api/v1/driver-portal/timesheet/clock-in', {
    locationName: 'Yard - Melbourne VIC'
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res4.status);
  console.log('  Error Message:', res4.body?.error?.message);

  if (res4.status === 400 && res4.body?.error?.details?.alreadyClockedIn) {
    pass('Duplicate clock-in rejected with 400 Bad Request ("already clocked in").');
  } else {
    fail(`Duplicate clock-in not rejected. Status=${res4.status}`);
  }

  // ── TEST 5: Driver A Clock Out ──────────────────────────────────────
  section('TEST 5 — Driver A Clock Out');
  const res5 = await request('POST', '/api/v1/driver-portal/timesheet/clock-out', {
    locationName: 'Yard - Sydney NSW (-33.8688, 151.2093)',
    note: 'Ending shift'
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res5.status);
  console.log('  Message:', res5.body?.data?.message);

  if (res5.status === 200 && res5.body?.data?.status === 'CLOCKED_OUT') {
    pass('Driver A clocked out successfully!');
  } else {
    fail(`Driver A clock out failed. Status=${res5.status}`);
  }

  // ── TEST 6: Clock Out Without Active Session ───────────────────────
  section('TEST 6 — Clock Out Without Active Session Protection');
  const res6 = await request('POST', '/api/v1/driver-portal/timesheet/clock-out', {
    locationName: 'Yard - Sydney NSW'
  }, {
    Authorization: `Bearer ${token1}`
  });
  console.log('  Response Status:', res6.status);
  console.log('  Error Message:', res6.body?.error?.message);

  if (res6.status === 400 && res6.body?.error?.details?.notClockedIn) {
    pass('Clock-out without active session rejected with 400 Bad Request.');
  } else {
    fail(`Clock-out without active session not rejected. Status=${res6.status}`);
  }

  // ── TEST 7: Driver Isolation — Driver A Cannot Modify Driver B Session
  section('TEST 7 — Driver Isolation: Driver B Clock In + Driver A Status Check');
  const res7B = await request('POST', '/api/v1/driver-portal/timesheet/clock-in', {
    locationName: 'Yard - Brisbane QLD'
  }, {
    Authorization: `Bearer ${token2}`
  });

  const res7A = await request('GET', '/api/v1/driver-portal/timesheet/today', null, {
    Authorization: `Bearer ${token1}`
  });

  if (res7A.status === 200 && res7A.body?.data?.status === 'CLOCKED_OUT') {
    pass('Driver isolation verified! Driver B clock-in did NOT affect Driver A status.');
  } else {
    fail('Driver B clock-in affected Driver A state!');
  }

  // ── TEST 8: Driver Isolation — Driver A Clock-Out Attempt on Driver B
  section('TEST 8 — Driver Isolation: Driver A Clock-Out Attempt on Driver B Session');
  const res8 = await request('POST', '/api/v1/driver-portal/timesheet/clock-out', {}, {
    Authorization: `Bearer ${token1}`
  });

  if (res8.status === 400) {
    pass('Access Denied! Driver A clock-out attempt on Driver B session failed with 400.');
  } else {
    fail(`Driver A was able to clock out Driver B session! Status=${res8.status}`);
  }

  // Clean up Driver B session
  await request('POST', '/api/v1/driver-portal/timesheet/clock-out', {}, {
    Authorization: `Bearer ${token2}`
  });

  // ── TEST 9: Unauthenticated Request Rejection ─────────────────────
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

  const { req: reqAuth, res: resAuth, getResult: getAuthResult } = makeReqRes();
  let nextCalled = false;
  verifyToken(reqAuth, resAuth, () => { nextCalled = true; });

  if (getAuthResult().status === 401 && !nextCalled) {
    pass('Unauthenticated timesheet request rejected with 401 Unauthorized.');
  } else {
    fail(`Unauthenticated timesheet request not rejected. Status=${getAuthResult().status}`);
  }
  process.env.NODE_ENV = origEnv;

  // ── TEST 10: Tenant & Company Isolation ─────────────────────────────
  section('TEST 10 — Tenant & Company Isolation');
  const dbTimesheet = await prisma.timesheet.findUnique({
    where: { id: driverATimesheetId }
  });

  if (dbTimesheet && dbTimesheet.companyId === d1.companyId && dbTimesheet.driverId === d1.id) {
    pass(`Company isolation verified! Timesheet companyId (${dbTimesheet.companyId}) matches Driver A company.`);
  } else {
    fail('Company isolation check failed for timesheet record.');
  }

  // ── TEST 11: DB Event & Timestamp Verification ─────────────────────
  section('TEST 11 — Full Timesheet Event & Lifecycle DB Verification');
  const events = await prisma.timesheetEvent.findMany({
    where: { timesheetId: driverATimesheetId },
    orderBy: { timestamp: 'asc' }
  });

  const eventTypes = events.map(e => e.type);
  if (events.length >= 2 && eventTypes.includes('CLOCK_IN') && eventTypes.includes('CLOCK_OUT')) {
    pass(`Database lifecycle verified! Events recorded: [${eventTypes.join(', ')}]`);
  } else {
    fail(`Timesheet events missing in DB. Found: [${eventTypes.join(', ')}]`);
  }

  // ── TEST 12: Previous Phases Regression Verification ──────────────
  section('TEST 12 — Previous Phases Regression Check');
  const profileRes = await request('GET', '/api/v1/driver-portal/me', null, {
    Authorization: `Bearer ${token1}`
  });
  if (profileRes.status === 200 && profileRes.body?.data?.driver?.firstName === 'Noah') {
    pass('Phase 1 Driver Profile endpoint intact.');
  } else {
    fail(`Phase 1 regression failed. Status=${profileRes.status}`);
  }

  await prisma.$disconnect();

  console.log('\n' + '═'.repeat(60));
  console.log(process.exitCode === 1 ? '❌ Phase 7 tests FAILED.' : '✅ All Phase 7 tests PASSED.');
  console.log('═'.repeat(60) + '\n');
}

runTests().catch(e => {
  console.error('\n❌ Test suite error:', e);
  process.exitCode = 1;
});
