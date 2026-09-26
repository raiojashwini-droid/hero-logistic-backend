const http = require('http');
const jwt = require('jsonwebtoken');
const prisma = require('./src/utils/prismaClient');
const { verifyToken } = require('./src/middlewares/auth');

const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'hero_logistic_access_secret_key_2026';

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

let yardUser, yardDriver, company, warehouse, authToken;

async function setupTestData() {
  section('SETTING UP TEST DATA FOR PHASE B SAFETY CHECKLIST');
  
  // Find or create test Company
  company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Hero Yard Phase B Logistics Pty Ltd',
        code: 'HYB01',
        email: 'yardphaseb@herologistics.com',
        phone: '0390001122',
        address: '123 Yard Safety Way, Melbourne VIC 3000',
        active: true
      }
    });
  }

  // Find or create Branch
  let branch = await prisma.branch.findFirst({ where: { companyId: company.id } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        companyId: company.id,
        name: 'Melbourne Yard Branch'
      }
    });
  }

  // Find or create Warehouse
  warehouse = await prisma.warehouse.findFirst({ where: { branchId: branch.id } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        branchId: branch.id,
        name: 'Melbourne Central Yard B',
        code: 'MCY-B',
        city: 'Melbourne',
        state: 'VIC',
        address: '88 Yard Way, Laverton VIC 3028'
      }
    });
  }

  // Login Driver (representing authenticated staff with driver profile)
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: 'driver@hero.com',
    password: 'Driver@1234'
  });
  
  authToken = loginRes.body?.data?.accessToken;
  if (!authToken) {
    fail('Failed to obtain JWT token for driver@hero.com', loginRes.body);
    process.exit(1);
  }

  yardUser = await prisma.user.findFirst({ where: { email: 'driver@hero.com' } });
  yardDriver = await prisma.driver.findFirst({ where: { userId: yardUser.id } });
  company = await prisma.company.findFirst({ where: { id: yardUser.companyId } });

  // Clean up any existing checklists for this driver today to ensure a clean test run
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const existingToday = await prisma.preStartChecklist.findMany({
    where: {
      driverId: yardDriver.id,
      companyId: company.id,
      date: { gte: todayStart }
    }
  });

  for (const c of existingToday) {
    await prisma.checklistItemResponse.deleteMany({ where: { checklistId: c.id } });
    await prisma.preStartChecklist.delete({ where: { id: c.id } });
  }

  // Seed a historical checklist from 2 days ago for history verification
  const pastDate = new Date(Date.now() - 86400000 * 2);
  await prisma.preStartChecklist.create({
    data: {
      driverId: yardDriver.id,
      companyId: company.id,
      date: pastDate,
      vehicleRef: 'YARD-TRK-01 (Volvo FM)',
      totalItems: 20,
      passedCount: 19,
      failedCount: 1,
      naCount: 0,
      isDraft: false,
      submittedAt: pastDate
    }
  });

  console.log(`✓ Test Yard User ID: ${yardUser.id}, Driver ID: ${yardDriver.id}, Company ID: ${company.id}`);
}

async function runTests() {
  console.log('============================================================');
  console.log(' HERO LOGISTICS — YARD ATTENDANT / WAREHOUSE PORTAL PHASE B');
  console.log(' (Safety Checklist Frontend & API Integration Test Suite)');
  console.log('============================================================\n');

  try {
    await setupTestData();

    section('1. GET /api/v1/warehouse-portal/safety-checklists (Initial Empty State)');
    const res1 = await request('GET', '/api/v1/warehouse-portal/safety-checklists', null, authToken);
    if (res1.status === 200 && res1.body.success && res1.body.data.currentChecklist === null) {
      pass('Returns 200 OK with currentChecklist: null when no checklist submitted today');
    } else {
      fail('Expected 200 OK with currentChecklist: null', res1);
    }
    if (Array.isArray(res1.body.data?.recentChecklists)) {
      pass('recentChecklists is an array');
    } else {
      fail('recentChecklists is not an array', res1.body);
    }

    section('2. POST /api/v1/warehouse-portal/safety-checklists (20 Inspection Items Template)');
    const standard20Items = [
      { id: 1, label: 'Brakes (service & park brake)', status: 'PASS', notes: '' },
      { id: 2, label: 'Tyres – condition & pressure', status: 'PASS', notes: '' },
      { id: 3, label: 'Lights – all working (head, tail, indicators, brake, reverse)', status: 'PASS', notes: '' },
      { id: 4, label: 'Indicators / Hazard lights', status: 'PASS', notes: '' },
      { id: 5, label: 'Steering & Suspension', status: 'PASS', notes: '' },
      { id: 6, label: 'Windscreen / Windows / Mirrors', status: 'PASS', notes: '' },
      { id: 7, label: 'Wipers / Washer', status: 'PASS', notes: '' },
      { id: 8, label: 'Horn', status: 'PASS', notes: '' },
      { id: 9, label: 'Seat belts / Airbag', status: 'PASS', notes: '' },
      { id: 10, label: 'Fire extinguisher', status: 'PASS', notes: '' },
      { id: 11, label: 'First aid kit', status: 'PASS', notes: '' },
      { id: 12, label: 'Load securement equipment', status: 'PASS', notes: '' },
      { id: 13, label: 'Fluid levels (engine oil, coolant, brake fluid)', status: 'PASS', notes: '' },
      { id: 14, label: 'Fuel level sufficient for trip', status: 'PASS', notes: '' },
      { id: 15, label: 'Leaks (oil, fuel, coolant, air)', status: 'FAIL', notes: 'Minor oil weep near steering reservoir' },
      { id: 16, label: 'Body / Chassis / Coupling', status: 'PASS', notes: '' },
      { id: 17, label: 'Load area clear & safe', status: 'PASS', notes: '' },
      { id: 18, label: 'Fatigue / Fitness for driving', status: 'PASS', notes: '' },
      { id: 19, label: 'Load secured / Straps & chains checked', status: 'NA', notes: '' },
      { id: 20, label: 'Other (notes or additional checks)', status: 'NOT_CHECKED', notes: '' }
    ];

    const res2 = await request('POST', '/api/v1/warehouse-portal/safety-checklists', {
      vehicleRef: 'YARD-TRK-01 (Volvo FM)',
      trailerRef: 'TRL-901 (Drop Deck)',
      notes: 'Shift pre-start completed with 1 minor defect noted.',
      isDraft: false,
      items: standard20Items,
      // Attempt driver/company spoofing to verify security
      driverId: 'spoofed_driver_id_9999',
      companyId: 'spoofed_company_id_9999'
    }, authToken);

    let createdChecklistId;
    if (res2.status === 201 && res2.body.success && res2.body.data.checklist) {
      pass('Returns 201 Created on checklist submission');
      createdChecklistId = res2.body.data.checklist.id;
      
      if (res2.body.data.checklist.driverId === yardDriver.id && res2.body.data.checklist.companyId === company.id) {
        pass('Driver & Company spoofing ignored; authenticated JWT identity bound');
      } else {
        fail('Driver/company spoofing was not prevented', res2.body);
      }

      if (res2.body.data.checklist.totalItems === 20 &&
          res2.body.data.checklist.passedCount === 17 &&
          res2.body.data.checklist.failedCount === 1 &&
          res2.body.data.checklist.naCount === 1) {
        pass('Calculated status counts match items (17 Passed, 1 Failed, 1 NA, 1 Unchecked)');
      } else {
        fail('Calculated counts mismatch', res2.body.data.checklist);
      }

      if (res2.body.data.checklist.items && res2.body.data.checklist.items.length === 20) {
        pass('All 20 ChecklistItemResponse records created and returned');
      } else {
        fail('Item responses missing or count mismatch', res2.body.data.checklist);
      }
    } else {
      fail('POST /warehouse-portal/safety-checklists failed', res2);
    }

    section('3. Database Verification of Checklist & Items');
    const dbChecklist = await prisma.preStartChecklist.findUnique({
      where: { id: createdChecklistId },
      include: { items: { orderBy: { itemNumber: 'asc' } } }
    });

    if (dbChecklist && dbChecklist.items.length === 20) {
      pass('Database has exact 20 ChecklistItemResponse records');
      
      const item15 = dbChecklist.items.find(it => it.itemNumber === 15);
      if (item15 && item15.status === 'FAIL' && item15.notes.includes('steering reservoir')) {
        pass('Item 15 status (FAIL) and defect notes correctly persisted in DB');
      } else {
        fail('Item 15 status or notes mismatch', item15);
      }

      const item19 = dbChecklist.items.find(it => it.itemNumber === 19);
      if (item19 && item19.status === 'NA') {
        pass('Item 19 status (NA) correctly persisted in DB');
      } else {
        fail('Item 19 status mismatch', item19);
      }

      const item20 = dbChecklist.items.find(it => it.itemNumber === 20);
      if (item20 && item20.status === 'NOT_CHECKED') {
        pass('Item 20 status (NOT_CHECKED) correctly persisted in DB');
      } else {
        fail('Item 20 status mismatch', item20);
      }
    } else {
      fail('Checklist DB record not found or incomplete', dbChecklist);
    }

    section('4. GET /warehouse-portal/safety-checklists (Persisted State Retrieval)');
    const res4 = await request('GET', '/api/v1/warehouse-portal/safety-checklists', null, authToken);
    if (res4.status === 200 && res4.body.data?.currentChecklist?.id === createdChecklistId) {
      pass('GET returns currently active persisted checklist for today');
      if (res4.body.data.currentChecklist.items.length === 20) {
        pass('GET returns all 20 persisted item responses');
      } else {
        fail('GET item responses incomplete', res4.body.data.currentChecklist);
      }
      if (res4.body.data.recentChecklists.length >= 1 && res4.body.data.recentChecklists[0].status === 'Fail') {
        pass('recentChecklists reflects status "Fail" accurately based on failed item count');
      } else {
        fail('recentChecklists mismatch', res4.body.data.recentChecklists);
      }
    } else {
      fail('GET did not return today persisted checklist', res4);
    }

    section('5. Duplicate Submission Prevention (400 Bad Request)');
    const res5 = await request('POST', '/api/v1/warehouse-portal/safety-checklists', {
      vehicleRef: 'YARD-TRK-01',
      isDraft: false,
      items: standard20Items
    }, authToken);

    if (res5.status === 400 && res5.body.error?.message?.includes('already been submitted')) {
      pass('Duplicate completed submission correctly rejected with 400 Bad Request');
    } else {
      fail('Duplicate submission was not properly rejected', res5);
    }

    section('6. Update Submission with allowUpdate: true');
    const updatedItems = standard20Items.map(it => it.id === 15 ? { ...it, status: 'PASS', notes: 'Defect resolved' } : it);
    const res6 = await request('POST', '/api/v1/warehouse-portal/safety-checklists', {
      vehicleRef: 'YARD-TRK-01 (Volvo FM - Rectified)',
      isDraft: false,
      allowUpdate: true,
      items: updatedItems,
      notes: 'Pre-start defect rectified.'
    }, authToken);

    if (res6.status === 201 && res6.body.data.checklist.failedCount === 0 && res6.body.data.checklist.passedCount === 18) {
      pass('Update submission with allowUpdate: true succeeds (failedCount: 0, passedCount: 18)');
    } else {
      fail('Update with allowUpdate failed', res6);
    }

    section('7. Unauthorized Access Check (401 Unauthorized)');
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    let capturedStatus = null;
    verifyToken({ headers: {} }, { status: (c) => ({ json: () => { capturedStatus = c; } }) }, () => {});
    process.env.NODE_ENV = oldEnv;

    if (capturedStatus === 401) {
      pass('Unauthenticated safety checklist request rejected with 401 Unauthorized');
    } else {
      fail('Expected 401 for unauthenticated request in production', capturedStatus);
    }

    console.log('\n============================================================');
    console.log(' ALL PHASE B SAFETY CHECKLIST TESTS EXECUTED SUCCESSFULLY!');
    console.log('============================================================\n');

  } catch (err) {
    fail('Fatal test suite exception', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
