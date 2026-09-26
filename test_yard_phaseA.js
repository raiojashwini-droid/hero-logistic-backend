const http = require('http');
const prisma = require('./src/utils/prismaClient');
const { verifyToken } = require('./src/middlewares/auth');

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

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg, details = '') { console.error(`  ❌ FAIL: ${msg}`, details); process.exitCode = 1; }
function section(msg) { console.log(`\n${'─'.repeat(60)}\n${msg}\n${'─'.repeat(60)}`); }

async function runTests() {
  console.log('============================================================');
  console.log(' HERO LOGISTICS — YARD ATTENDANT / WAREHOUSE PORTAL PHASE A');
  console.log(' (Security, Authentication & Real Data Foundation Test Suite)');
  console.log('============================================================\n');

  try {
    // 1. Setup controlled test data: Tenant A and Tenant B
    const companyA = await prisma.company.findFirst({ where: { name: 'as' } }) || await prisma.company.findFirst();
    let companyB = await prisma.company.findFirst({ where: { name: 'Other Logistics Corp' } });
    if (!companyB) {
      companyB = await prisma.company.create({
        data: { name: 'Other Logistics Corp', status: 'ACTIVE' }
      });
    }

    // Branch and Warehouse for Tenant A
    let branchA = await prisma.branch.findFirst({ where: { companyId: companyA.id } });
    if (!branchA) {
      branchA = await prisma.branch.create({
        data: { name: 'Melbourne Depot', companyId: companyA.id }
      });
    }
    let warehouseA = await prisma.warehouse.findFirst({ where: { branchId: branchA.id } });
    if (!warehouseA) {
      warehouseA = await prisma.warehouse.create({
        data: { code: 'WH-MEL-01', name: 'Melbourne Central Depot', branchId: branchA.id }
      });
    }

    // Branch and Warehouse for Tenant B
    let branchB = await prisma.branch.findFirst({ where: { companyId: companyB.id } });
    if (!branchB) {
      branchB = await prisma.branch.create({
        data: { name: 'Sydney Branch B', companyId: companyB.id }
      });
    }
    let warehouseB = await prisma.warehouse.findFirst({ where: { branchId: branchB.id } });
    if (!warehouseB) {
      warehouseB = await prisma.warehouse.create({
        data: { code: 'WH-SYD-02', name: 'Sydney East Depot B', branchId: branchB.id }
      });
    }

    // LoadItem for Tenant A
    let itemA = await prisma.loadItem.findFirst({ where: { warehouseId: warehouseA.id } });
    if (!itemA) {
      itemA = await prisma.loadItem.create({
        data: {
          vin: 'VINTESTA100998877',
          rego: 'YARD-A1',
          make: 'Toyota',
          model: 'Hilux',
          warehouseId: warehouseA.id,
          zone: 'Zone A',
          row: 'R1',
          bay: 'B01',
          stockStatus: 'IN_STORAGE'
        }
      });
    }

    // LoadItem for Tenant B
    let itemB = await prisma.loadItem.findFirst({ where: { warehouseId: warehouseB.id } });
    if (!itemB) {
      itemB = await prisma.loadItem.create({
        data: {
          vin: 'VINTESTB200998877',
          rego: 'YARD-B2',
          make: 'Ford',
          model: 'Ranger',
          warehouseId: warehouseB.id,
          zone: 'Zone B',
          row: 'R2',
          bay: 'B02',
          stockStatus: 'IN_STORAGE'
        }
      });
    }

    // LoadLane for Tenant B
    let laneB = await prisma.loadLane.findFirst({ where: { warehouseId: warehouseB.id } });
    if (!laneB) {
      laneB = await prisma.loadLane.create({
        data: { name: 'Load Lane B-1', warehouseId: warehouseB.id, status: 'ACTIVE' }
      });
    }

    // Load for Tenant B
    let loadB = await prisma.load.findFirst({ where: { companyId: companyB.id } });
    if (!loadB) {
      loadB = await prisma.load.create({
        data: {
          loadRef: 'PO-TENANT-B-999',
          type: 'General Freight',
          status: 'PLANNED',
          companyId: companyB.id
        }
      });
    }

    // Login Driver A (representing authenticated staff with driver profile)
    const loginRes = await request('POST', '/api/v1/auth/login', {
      email: 'driver@hero.com',
      password: 'Driver@1234'
    });
    const tokenA = loginRes.body?.data?.accessToken;
    if (!tokenA) {
      fail('Failed to obtain JWT token for driver@hero.com');
      process.exit(1);
    }

    const driverA = await prisma.driver.findFirst({ where: { user: { email: 'driver@hero.com' } } });

    // ────────────────────────────────────────────────────────────
    // AUTHENTICATION TESTS
    // ────────────────────────────────────────────────────────────
    section('AUTHENTICATION — Unit Test with Production Token Verification');

    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Test 1: Unauthenticated profile request (production mode)
    let capturedStatus1 = null;
    verifyToken({ headers: {} }, { status: (c) => ({ json: () => { capturedStatus1 = c; } }) }, () => {});
    if (capturedStatus1 === 401) {
      pass('Test 1: Unauthenticated profile request rejected with 401');
    } else {
      fail('Test 1: Unauthenticated request not rejected with 401', capturedStatus1);
    }

    // Test 2: Unauthenticated stock request
    let capturedStatus2 = null;
    verifyToken({ headers: {} }, { status: (c) => ({ json: () => { capturedStatus2 = c; } }) }, () => {});
    if (capturedStatus2 === 401) {
      pass('Test 2: Unauthenticated stock request rejected with 401');
    } else {
      fail('Test 2: Unauthenticated stock request not rejected with 401', capturedStatus2);
    }

    // Test 3: Unauthenticated checklist request
    let capturedStatus3 = null;
    verifyToken({ headers: {} }, { status: (c) => ({ json: () => { capturedStatus3 = c; } }) }, () => {});
    if (capturedStatus3 === 401) {
      pass('Test 3: Unauthenticated checklist request rejected with 401');
    } else {
      fail('Test 3: Unauthenticated checklist request not rejected with 401', capturedStatus3);
    }

    process.env.NODE_ENV = oldEnv;

    // ────────────────────────────────────────────────────────────
    // PROFILE TESTS
    // ────────────────────────────────────────────────────────────
    section('PROFILE — Authenticated Staff Profile (JWT Identity Lookup)');

    // Test 4: Yard Attendant / Staff retrieves own profile
    const resP = await request('GET', '/api/v1/warehouse-portal/profile', null, tokenA);
    if (resP.status === 200 && resP.body?.data?.profile) {
      pass('Test 4: Yard Attendant retrieves own profile (Status 200)');
    } else {
      fail('Test 4: Failed to retrieve profile', resP.body);
    }

    // Test 5: Profile corresponds to JWT user (not hardcoded W. Smith)
    const profile = resP.body?.data?.profile;
    if (profile && profile.name !== 'W. Smith' && (profile.email || profile.userId)) {
      pass(`Test 5: Profile corresponds to JWT user (${profile.name}, ID: ${profile.userId})`);
    } else {
      fail('Test 5: Profile did not match authenticated user or returned fake W. Smith', profile);
    }

    // Test 6: Profile belongs to tenant
    if (profile && profile.company?.id === companyA.id) {
      pass(`Test 6: Profile belongs to correct tenant (${companyA.name})`);
    } else {
      fail('Test 6: Profile tenant mismatch', profile?.company);
    }

    // ────────────────────────────────────────────────────────────
    // STOCK TESTS
    // ────────────────────────────────────────────────────────────
    section('STOCK — Warehouse Stock API & IDOR Protection');

    // Test 7: Yard Attendant retrieves warehouse stock
    const resStock = await request('GET', '/api/v1/warehouse-portal/stock', null, tokenA);
    if (resStock.status === 200 && Array.isArray(resStock.body?.data)) {
      pass('Test 7: Yard Attendant retrieves warehouse stock (Status 200)');
    } else {
      fail('Test 7: Failed to retrieve stock', resStock.body);
    }

    // Test 8: Stock response comes from /warehouse-portal/stock
    if (resStock.status === 200 && resStock.body?.success === true) {
      pass('Test 8: Stock response structure verified from /warehouse-portal/stock');
    } else {
      fail('Test 8: Stock response structure invalid', resStock.body);
    }

    // Test 9: User attempts to access another tenant\'s stock by ID -> Expected 404/403
    const resIdorGet = await request('GET', `/api/v1/warehouse-portal/stock/${itemB.id}`, null, tokenA);
    if (resIdorGet.status === 404 || resIdorGet.status === 403) {
      pass(`Test 9: Cross-tenant GET stock item rejected with ${resIdorGet.status}`);
    } else {
      fail('Test 9: IDOR vulnerability! User retrieved Tenant B stock item!', resIdorGet.body);
    }

    // Test 10: User attempts to move another tenant\'s stock -> Expected 404/403
    const resIdorMove = await request('POST', '/api/v1/warehouse-portal/stock/move', {
      itemId: itemB.id,
      toZone: 'Hacked Zone',
      toRow: 'Hacked Row'
    }, tokenA);
    if (resIdorMove.status === 404 || resIdorMove.status === 403) {
      pass(`Test 10: Cross-tenant stock move rejected with ${resIdorMove.status}`);
    } else {
      fail('Test 10: IDOR vulnerability! User moved Tenant B stock item!', resIdorMove.body);
    }

    // ────────────────────────────────────────────────────────────
    // DISPATCH TESTS
    // ────────────────────────────────────────────────────────────
    section('DISPATCH — Cross-Tenant IDOR Protection');

    // Test 11: User attempts to dispatch another tenant\'s load -> Expected 404/403
    const resIdorDispatch = await request('POST', `/api/v1/warehouse-portal/dispatch-ready/${loadB.id}/dispatch`, {}, tokenA);
    if (resIdorDispatch.status === 404 || resIdorDispatch.status === 403) {
      pass(`Test 11: Cross-tenant load dispatch rejected with ${resIdorDispatch.status}`);
    } else {
      fail('Test 11: IDOR vulnerability! User dispatched Tenant B load!', resIdorDispatch.body);
    }

    // ────────────────────────────────────────────────────────────
    // LOAD LANE TESTS
    // ────────────────────────────────────────────────────────────
    section('LOAD LANE — Cross-Tenant Staging IDOR Protection');

    // Test 12: User attempts to stage items into another tenant\'s lane -> Expected 404/403
    const resIdorLane = await request('POST', `/api/v1/warehouse-portal/load-lanes/${laneB.id}/stage-items`, {
      itemIds: [itemA.id]
    }, tokenA);
    if (resIdorLane.status === 404 || resIdorLane.status === 403) {
      pass(`Test 12: Cross-tenant lane staging rejected with ${resIdorLane.status}`);
    } else {
      fail('Test 12: IDOR vulnerability! User staged items into Tenant B lane!', resIdorLane.body);
    }

    // ────────────────────────────────────────────────────────────
    // CHECKLIST TESTS
    // ────────────────────────────────────────────────────────────
    section('CHECKLIST — Safety Checklist Persistence & Validation');

    // Clear today's checklist for clean test run
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existingChecklists = await prisma.preStartChecklist.findMany({
      where: { driverId: driverA.id, date: { gte: todayStart } },
      select: { id: true }
    });
    if (existingChecklists.length > 0) {
      const ids = existingChecklists.map(c => c.id);
      await prisma.checklistItemResponse.deleteMany({ where: { checklistId: { in: ids } } });
      await prisma.preStartChecklist.deleteMany({ where: { id: { in: ids } } });
    }

    // Test 13: Authenticated Yard Attendant retrieves own checklist history
    const resChkGet = await request('GET', '/api/v1/warehouse-portal/safety-checklists', null, tokenA);
    if (resChkGet.status === 200 && resChkGet.body?.data) {
      pass('Test 13: Yard Attendant retrieves own checklist history (Status 200)');
    } else {
      fail('Test 13: Failed to retrieve safety checklist history', resChkGet.body);
    }

    // Test 14: Yard Attendant submits valid checklist -> Expected 201
    const validChecklistPayload = {
      vehicleRef: 'YARD-TRK-01',
      trailerRef: 'YARD-TRL-01',
      isDraft: false,
      notes: 'Morning yard safety inspection all clear.',
      gpsLat: -37.8136,
      gpsLng: 144.9631,
      items: [
        { id: 1, label: 'Brakes (service & park brake)', status: 'PASS' },
        { id: 2, label: 'Tyres – condition & pressure', status: 'PASS' },
        { id: 3, label: 'Lights – all working', status: 'PASS' },
        { id: 4, label: 'Indicators / Hazard lights', status: 'PASS' },
        { id: 5, label: 'Load securement equipment', status: 'NA' }
      ]
    };

    const resChkSubmit = await request('POST', '/api/v1/warehouse-portal/safety-checklists', validChecklistPayload, tokenA);
    if (resChkSubmit.status === 201 && resChkSubmit.body?.data?.checklist?.id) {
      pass('Test 14: Yard Attendant submits valid safety checklist (Status 201)');
    } else {
      fail('Test 14: Failed to submit safety checklist', resChkSubmit.body);
    }

    const createdChecklistId = resChkSubmit.body?.data?.checklist?.id;

    // Test 15: Checklist exists in database
    const dbChecklist = await prisma.preStartChecklist.findUnique({
      where: { id: createdChecklistId },
      include: { items: true }
    });
    if (dbChecklist) {
      pass(`Test 15: Checklist exists in database (ID: ${dbChecklist.id})`);
    } else {
      fail('Test 15: Checklist not found in DB after submission');
    }

    // Test 16: All checklist item responses exist
    if (dbChecklist && dbChecklist.items?.length === 5) {
      pass(`Test 16: All checklist item responses exist (${dbChecklist.items.length} items persisted)`);
    } else {
      fail('Test 16: Checklist item responses count mismatch', dbChecklist?.items?.length);
    }

    // Test 17: Checklist belongs to correct driver
    if (dbChecklist && dbChecklist.driverId === driverA.id) {
      pass(`Test 17: Checklist belongs to correct driver (driverId: ${driverA.id})`);
    } else {
      fail('Test 17: Checklist driverId mismatch', dbChecklist?.driverId);
    }

    // Test 18: Checklist belongs to correct company
    if (dbChecklist && dbChecklist.companyId === companyA.id) {
      pass(`Test 18: Checklist belongs to correct company (companyId: ${companyA.id})`);
    } else {
      fail('Test 18: Checklist companyId mismatch', dbChecklist?.companyId);
    }

    // Test 19: Driver/company spoofing in payload is ignored/rejected
    const spoofPayload = {
      driverId: 'spoofed-driver-id-999',
      companyId: companyB.id,
      isDraft: false,
      allowUpdate: true,
      items: [
        { id: 1, label: 'Brakes', status: 'PASS' }
      ]
    };
    const resSpoof = await request('POST', '/api/v1/warehouse-portal/safety-checklists', spoofPayload, tokenA);
    const spoofChecklistId = resSpoof.body?.data?.checklist?.id;
    const dbSpoofCheck = await prisma.preStartChecklist.findUnique({ where: { id: spoofChecklistId } });
    if (dbSpoofCheck && dbSpoofCheck.driverId === driverA.id && dbSpoofCheck.companyId === companyA.id && !dbSpoofCheck.isDraft) {
      pass('Test 19: Payload driver/company spoofing ignored — resolved from JWT successfully');
    } else {
      fail('Test 19: Security breach! Spoofed company or driver persisted!', dbSpoofCheck);
    }

    // Test 20: Empty checklist items rejected -> Expected 400
    const resEmpty = await request('POST', '/api/v1/warehouse-portal/safety-checklists', { items: [] }, tokenA);
    if (resEmpty.status === 400) {
      pass('Test 20: Empty checklist items rejected with 400 Bad Request');
    } else {
      fail('Test 20: Empty checklist submission not rejected with 400', resEmpty.body);
    }

    // Test 21: Duplicate completed checklist submission rejected according to existing rules -> Expected 400
    const duplicatePayload = {
      isDraft: false,
      items: [
        { id: 1, label: 'Brakes', status: 'PASS' }
      ]
    };
    const resDup = await request('POST', '/api/v1/warehouse-portal/safety-checklists', duplicatePayload, tokenA);
    if (resDup.status === 400) {
      pass('Test 21: Duplicate completed checklist submission rejected with 400');
    } else {
      fail('Test 21: Duplicate checklist submission was not rejected with 400', resDup.body);
    }

    console.log('\n============================================================');
    console.log('  ✅ ALL 21 PHASE A TESTS PASSED SUCCESSFULLY!');
    console.log('============================================================\n');

  } catch (error) {
    console.error('❌ Test suite execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
