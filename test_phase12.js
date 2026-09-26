const http = require('http');
const prisma = require('./src/utils/prismaClient');
const setupPhase12Data = require('./setup_phase12_checklist');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', err => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('============================================================');
  console.log('   HERO LOGISTICS — DRIVER PORTAL PHASE 12 TEST SUITE');
  console.log('   (Pre-Start Safety Checklist Integration & Security)');
  console.log('============================================================\n');

  try {
    // Setup controlled seed test data
    const { chkA, chkB } = await setupPhase12Data();

    // Login Driver A (Noah Williams)
    const resLogin1 = await request('POST', '/api/v1/auth/login', {
      email: 'driver@hero.com',
      password: 'Driver@1234'
    });
    const tokenD1 = resLogin1.body?.data?.accessToken;

    // Login Driver B (Liam Smith)
    const resLogin2 = await request('POST', '/api/v1/auth/login', {
      email: 'driver2@hero.com',
      password: 'Driver@1234'
    });
    const tokenD2 = resLogin2.body?.data?.accessToken;

    if (!tokenD1 || !tokenD2) {
      console.error('❌ Failed to obtain JWT tokens for Driver A or Driver B.');
      process.exit(1);
    }

    const driverA = await prisma.driver.findFirst({ where: { user: { email: 'driver@hero.com' } } });
    const driverB = await prisma.driver.findFirst({ where: { user: { email: 'driver2@hero.com' } } });

    console.log('────────────────────────────────────────────────────────────');
    console.log('TEST 1 — Driver A Retrieves Today\'s Checklist');
    console.log('────────────────────────────────────────────────────────────');
    const resT1 = await request('GET', '/api/v1/driver-portal/checklist/today', null, tokenD1);
    console.log('  Response Status:', resT1.status);
    if (resT1.status === 200 && resT1.body?.data?.checklist) {
      console.log('  ✅ PASS: Driver A successfully fetched today\'s checklist.');
    } else {
      console.error('  ❌ FAIL: Driver A failed to fetch today\'s checklist.', resT1.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 2 — Driver B Retrieves Today\'s Checklist');
    console.log('────────────────────────────────────────────────────────────');
    const resT2 = await request('GET', '/api/v1/driver-portal/checklist/today', null, tokenD2);
    console.log('  Response Status:', resT2.status);
    if (resT2.status === 200 && resT2.body?.data?.checklist) {
      console.log('  ✅ PASS: Driver B successfully fetched today\'s checklist.');
    } else {
      console.error('  ❌ FAIL: Driver B failed to fetch today\'s checklist.', resT2.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 3 — Driver A Opens Own Checklist Details');
    console.log('────────────────────────────────────────────────────────────');
    const resT3 = await request('GET', `/api/v1/driver-portal/checklist/${chkA.id}`, null, tokenD1);
    console.log('  Response Status:', resT3.status);
    if (resT3.status === 200 && resT3.body?.data?.checklist?.id === chkA.id) {
      console.log('  ✅ PASS: Driver A successfully retrieved own checklist details.');
    } else {
      console.error('  ❌ FAIL: Driver A failed to retrieve own checklist details.', resT3.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 4 — Driver B Opens Own Checklist Details');
    console.log('────────────────────────────────────────────────────────────');
    const resT4 = await request('GET', `/api/v1/driver-portal/checklist/${chkB.id}`, null, tokenD2);
    console.log('  Response Status:', resT4.status);
    if (resT4.status === 200 && resT4.body?.data?.checklist?.id === chkB.id) {
      console.log('  ✅ PASS: Driver B successfully retrieved own checklist details.');
    } else {
      console.error('  ❌ FAIL: Driver B failed to retrieve own checklist details.', resT4.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 5 — SECURITY: Driver A Cannot Access Driver B\'s Checklist');
    console.log('────────────────────────────────────────────────────────────');
    const resT5 = await request('GET', `/api/v1/driver-portal/checklist/${chkB.id}`, null, tokenD1);
    console.log('  Response Status:', resT5.status);
    if (resT5.status === 403 || resT5.status === 404) {
      console.log('  ✅ PASS: Driver A accessing Driver B\'s checklist rejected with 403/404.');
    } else {
      console.error('  ❌ FAIL: Security breach! Driver A accessed Driver B\'s checklist!', resT5.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 6 — SECURITY: Driver B Cannot Access Driver A\'s Checklist');
    console.log('────────────────────────────────────────────────────────────');
    const resT6 = await request('GET', `/api/v1/driver-portal/checklist/${chkA.id}`, null, tokenD2);
    console.log('  Response Status:', resT6.status);
    if (resT6.status === 403 || resT6.status === 404) {
      console.log('  ✅ PASS: Driver B accessing Driver A\'s checklist rejected with 403/404.');
    } else {
      console.error('  ❌ FAIL: Security breach! Driver B accessed Driver A\'s checklist!', resT6.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 7 — Driver A Saves Draft Safety Checklist');
    console.log('────────────────────────────────────────────────────────────');
    // Clear today's checklist to allow new submission test
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existingChecklists = await prisma.preStartChecklist.findMany({
      where: { driverId: driverA.id, date: { gte: todayStart } },
      select: { id: true }
    });

    if (existingChecklists.length > 0) {
      const ids = existingChecklists.map(c => c.id);
      await prisma.checklistItemResponse.deleteMany({
        where: { checklistId: { in: ids } }
      });
      await prisma.preStartChecklist.deleteMany({
        where: { id: { in: ids } }
      });
    }

    const draftPayload = {
      vehicleRef: 'TRK-101 (MAN TGX 26.580)',
      trailerRef: 'TRL-205 (Car Carrier)',
      isDraft: true,
      items: [
        { id: 1, label: 'Brakes (service & park brake)', status: 'pass' },
        { id: 2, label: 'Tyres – condition & pressure', status: 'pass' }
      ],
      notes: 'Initial morning draft'
    };

    const resT7 = await request('POST', '/api/v1/driver-portal/checklist', draftPayload, tokenD1);
    console.log('  Response Status:', resT7.status);
    if (resT7.status === 200 || resT7.status === 201) {
      console.log('  ✅ PASS: Driver A saved safety checklist draft successfully!');
    } else {
      console.error('  ❌ FAIL: Driver A failed to save draft.', resT7.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 8 — Driver A Submits Completed Safety Checklist');
    console.log('────────────────────────────────────────────────────────────');
    const submitPayload = {
      vehicleRef: 'TRK-101 (MAN TGX 26.580)',
      trailerRef: 'TRL-205 (Car Carrier)',
      isDraft: false,
      gpsLat: -37.8136,
      gpsLng: 144.9631,
      items: [
        { id: 1, label: 'Brakes (service & park brake)', status: 'pass' },
        { id: 2, label: 'Tyres – condition & pressure', status: 'pass' },
        { id: 3, label: 'Lights – all working', status: 'pass' },
        { id: 4, label: 'Indicators / Hazard lights', status: 'pass' },
        { id: 5, label: 'Steering & Suspension', status: 'pass' },
        { id: 6, label: 'Windscreen / Windows / Mirrors', status: 'pass' },
        { id: 7, label: 'Wipers / Washer', status: 'pass' },
        { id: 8, label: 'Horn', status: 'pass' },
        { id: 9, label: 'Seat belts / Airbag', status: 'pass' },
        { id: 10, label: 'Fire extinguisher', status: 'pass' },
        { id: 11, label: 'First aid kit', status: 'pass' },
        { id: 12, label: 'Load securement equipment', status: 'pass' },
        { id: 13, label: 'Fluid levels', status: 'pass' },
        { id: 14, label: 'Fuel level sufficient', status: 'pass' },
        { id: 15, label: 'Leaks', status: 'pass' },
        { id: 16, label: 'Body / Chassis / Coupling', status: 'pass' },
        { id: 17, label: 'Load area clear & safe', status: 'pass' },
        { id: 18, label: 'Fatigue / Fitness for driving', status: 'pass' },
        { id: 19, label: 'Load secured', status: 'na' },
        { id: 20, label: 'Other', status: 'unchecked' }
      ],
      notes: 'Full daily pre-start completed. Ready for departure.'
    };

    const resT8 = await request('POST', '/api/v1/driver-portal/checklist', submitPayload, tokenD1);
    console.log('  Response Status:', resT8.status);
    const createdId = resT8.body?.data?.checklist?.id;
    if ((resT8.status === 200 || resT8.status === 201) && createdId) {
      console.log('  ✅ PASS: Driver A submitted checklist cleanly! ID:', createdId);
    } else {
      console.error('  ❌ FAIL: Driver A failed to submit checklist.', resT8.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 9 — Verify Checklist Database Persistence');
    console.log('────────────────────────────────────────────────────────────');
    const dbRecord = await prisma.preStartChecklist.findUnique({
      where: { id: createdId },
      include: { items: true }
    });

    if (dbRecord && dbRecord.items.length === 20) {
      console.log('  ✅ PASS: Checklist and all 20 item responses persisted in Database!');
    } else {
      console.error('  ❌ FAIL: Database persistence failed.', dbRecord);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 10 — Verify Created Checklist Belongs to Driver A');
    console.log('────────────────────────────────────────────────────────────');
    if (dbRecord.driverId === driverA.id) {
      console.log('  ✅ PASS: Checklist driverId in DB matches Driver A!');
    } else {
      console.error('  ❌ FAIL: Driver ID mismatch.', dbRecord.driverId, driverA.id);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 11 — SECURITY: Driver A Impersonation Attack Prevention');
    console.log('────────────────────────────────────────────────────────────');
    const existingChecklistsA = await prisma.preStartChecklist.findMany({
      where: { driverId: driverA.id, date: { gte: todayStart } },
      select: { id: true }
    });
    if (existingChecklistsA.length > 0) {
      const idsA = existingChecklistsA.map(c => c.id);
      await prisma.checklistItemResponse.deleteMany({ where: { checklistId: { in: idsA } } });
      await prisma.preStartChecklist.deleteMany({ where: { id: { in: idsA } } });
    }

    const spoofPayload = {
      ...submitPayload,
      driverId: driverB.id, // Attempt to attribute to Driver B
      companyId: 'fake-company-id'
    };
    const resT11 = await request('POST', '/api/v1/driver-portal/checklist', spoofPayload, tokenD1);
    const spoofedChecklist = resT11.body?.data?.checklist;
    if (spoofedChecklist && spoofedChecklist.driverId === driverA.id && spoofedChecklist.companyId === driverA.companyId) {
      console.log('  ✅ PASS: Identity was resolved from JWT token, ignoring spoofed payload!');
    } else {
      console.error('  ❌ FAIL: Impersonation attack succeeded!', resT11.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 12 — SECURITY: Company / Tenant Boundary Enforcement');
    console.log('────────────────────────────────────────────────────────────');
    if (dbRecord.companyId === driverA.companyId) {
      console.log('  ✅ PASS: Checklist record is locked to Driver A companyId!');
    } else {
      console.error('  ❌ FAIL: Company ID mismatch.', dbRecord.companyId, driverA.companyId);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 13 — Duplicate Checklist Submission Protection');
    console.log('────────────────────────────────────────────────────────────');
    const resT13 = await request('POST', '/api/v1/driver-portal/checklist', submitPayload, tokenD1);
    console.log('  Response Status:', resT13.status);
    if (resT13.status === 400) {
      console.log('  ✅ PASS: Duplicate checklist submission rejected with 400 Bad Request.');
    } else {
      console.error('  ❌ FAIL: Duplicate submission was allowed!', resT13.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 14 — Empty Items Array Rejection');
    console.log('────────────────────────────────────────────────────────────');
    const resT14 = await request('POST', '/api/v1/driver-portal/checklist', { items: [] }, tokenD1);
    console.log('  Response Status:', resT14.status);
    if (resT14.status === 400) {
      console.log('  ✅ PASS: Empty items array rejected with 400 Bad Request.');
    } else {
      console.error('  ❌ FAIL: Empty items array accepted!', resT14.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 15 — Failed Safety Item Defect Logging Verification');
    console.log('────────────────────────────────────────────────────────────');
    // Clear Driver B checklist to submit a defect report
    const existingChecklistsB = await prisma.preStartChecklist.findMany({
      where: { driverId: driverB.id, date: { gte: todayStart } },
      select: { id: true }
    });

    if (existingChecklistsB.length > 0) {
      const idsB = existingChecklistsB.map(c => c.id);
      await prisma.checklistItemResponse.deleteMany({
        where: { checklistId: { in: idsB } }
      });
      await prisma.preStartChecklist.deleteMany({
        where: { id: { in: idsB } }
      });
    }

    const defectPayload = {
      vehicleRef: 'TRK-202 (Kenworth K200)',
      trailerRef: 'TRL-99B (Flatbed)',
      isDraft: false,
      items: [
        { id: 1, label: 'Brakes (service & park brake)', status: 'pass' },
        { id: 2, label: 'Tyres – condition & pressure', status: 'fail', notes: 'Low pressure on rear right axle' }
      ],
      notes: 'Tyre defect detected before departure.'
    };

    const resT15 = await request('POST', '/api/v1/driver-portal/checklist', defectPayload, tokenD2);
    console.log('  Response Status:', resT15.status);
    if ((resT15.status === 200 || resT15.status === 201) && resT15.body?.data?.checklist?.failedCount === 1) {
      console.log('  ✅ PASS: Failed safety item defect logged and persisted cleanly!');
    } else {
      console.error('  ❌ FAIL: Defect logging failed.', resT15.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 16 — GPS Coordinates Persistence Verification');
    console.log('────────────────────────────────────────────────────────────');
    if (dbRecord.gpsLat === -37.8136 && dbRecord.gpsLng === 144.9631) {
      console.log('  ✅ PASS: GPS coordinates (-37.8136, 144.9631) persisted cleanly!');
    } else {
      console.error('  ❌ FAIL: GPS coordinates missing or incorrect.', dbRecord.gpsLat, dbRecord.gpsLng);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 17 — Invalid / Non-Existent Checklist ID Rejection');
    console.log('────────────────────────────────────────────────────────────');
    const resT17 = await request('GET', '/api/v1/driver-portal/checklist/00000000-0000-0000-0000-000000000000', null, tokenD1);
    console.log('  Response Status:', resT17.status);
    if (resT17.status === 403 || resT17.status === 404) {
      console.log('  ✅ PASS: Invalid checklist ID rejected with 403/404.');
    } else {
      console.error('  ❌ FAIL: Invalid checklist ID returned success!', resT17.body);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 18 — SECURITY: Unauthenticated Request Rejection (Production Mode)');
    console.log('────────────────────────────────────────────────────────────');
    const authMiddleware = require('./src/middlewares/auth');
    const verifyToken = authMiddleware.verifyToken;

    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    let capturedStatus = null;
    let nextCalled = false;

    const mockReq = { headers: {} };
    const mockRes = {
      status: (code) => {
        capturedStatus = code;
        return {
          json: (data) => data
        };
      }
    };

    verifyToken(mockReq, mockRes, () => { nextCalled = true; });
    process.env.NODE_ENV = oldEnv;

    console.log('  Unauthenticated Status:', capturedStatus);
    if (capturedStatus === 401 && !nextCalled) {
      console.log('  ✅ PASS: Unauthenticated request rejected with 401 Unauthorized.');
    } else {
      console.error('  ❌ FAIL: Production auth bypass!');
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 19 — Database Relation Verification');
    console.log('────────────────────────────────────────────────────────────');
    const activeChecklistA = await prisma.preStartChecklist.findFirst({
      where: { driverId: driverA.id, date: { gte: todayStart } },
      include: { driver: true, company: true }
    });
    if (activeChecklistA && activeChecklistA.driver?.id === driverA.id && activeChecklistA.company?.id === driverA.companyId) {
      console.log('  ✅ PASS: Foreign key relationships for driver and company verified!');
    } else {
      console.error('  ❌ FAIL: Foreign key relationships incorrect.', activeChecklistA);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 20 — Checklist Item Counts Overview Verification');
    console.log('────────────────────────────────────────────────────────────');
    if (activeChecklistA && activeChecklistA.passedCount === 18 && activeChecklistA.naCount === 1 && activeChecklistA.totalItems === 20) {
      console.log('  ✅ PASS: Overview item counts (18 passed, 1 NA, 20 total) verified!');
    } else {
      console.error('  ❌ FAIL: Item counts incorrect.', activeChecklistA);
      process.exit(1);
    }

    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 21 — Previous Phase 11 Incidents Regression Check');
    console.log('────────────────────────────────────────────────────────────');
    const resT21 = await request('GET', '/api/v1/driver-portal/incidents', null, tokenD1);
    console.log('  Phase 11 Incidents Status:', resT21.status);
    if (resT21.status === 200) {
      console.log('  ✅ PASS: Phase 11 Incidents API remains fully functional!');
    } else {
      console.error('  ❌ FAIL: Phase 11 Incidents regression detected!', resT21.body);
      process.exit(1);
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('✅ All 21 Phase 12 tests PASSED.');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Test Execution Failure:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
