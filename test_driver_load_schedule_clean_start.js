const assert = require('assert');

// 1. Require controller and pay calculator
const CompanyAdminCtrl = require('./src/controllers/CompanyAdminPortalController');
const { calculatePerLoadDriverPay } = require('./src/utils/driverPayCalculator');

async function runTests() {
  console.log('========================================================================');
  console.log('  TESTING DRIVER LOAD SCHEDULE CLEAN START & TENANT ISOLATION');
  console.log('========================================================================\n');

  // Test 1: New Company Clean Start
  console.log('--- TEST 1: New Company A Clean Start (No Dummy/Mock Rates) ---');
  const companyAId = 'company-test-clean-a-' + Date.now();
  const mockReqA = {
    tenantId: companyAId,
    query: {}
  };
  let responseDataA = null;
  const mockResA = {
    status: (code) => mockResA,
    json: (body) => { responseDataA = body; return mockResA; }
  };

  await CompanyAdminCtrl.getDriverLoadSchedule(mockReqA, mockResA, (err) => { if (err) throw err; });
  
  assert(responseDataA && responseDataA.success, 'API response must succeed');
  const schedulesA = responseDataA.data?.schedules || [];
  console.log('  Company A initial schedules count:', schedulesA.length);
  assert.strictEqual(schedulesA.length, 0, 'New Company A must have EXACTLY 0 schedules (no dummy routes SCHED-101..104)');
  assert.strictEqual(responseDataA.data?.totalCount, 0, 'Total count must be 0');
  assert.strictEqual(responseDataA.data?.avgRate, 0, 'Average rate must be 0');
  console.log('  ✅ TEST 1 PASSED: New company starts with clean empty schedule (0 dummy rates).\n');

  // Test 2: Adding a custom route rate to Company A
  console.log('--- TEST 2: Adding Custom Route Rate to Company A ---');
  const createReqA = {
    tenantId: companyAId,
    body: {
      origin: 'Brisbane',
      destination: 'Gold Coast',
      rate: 280.00,
      licenseClass: 'HC - Heavy Combination',
      notes: 'Express local run'
    }
  };
  let createResDataA = null;
  const createResA = {
    status: (code) => createResA,
    json: (body) => { createResDataA = body; return createResA; }
  };
  await CompanyAdminCtrl.createDriverLoadSchedule(createReqA, createResA, (err) => { if (err) throw err; });
  assert(createResDataA && createResDataA.success, 'Create rate must succeed');
  console.log('  Created rate for Company A:', createResDataA.data.origin, '→', createResDataA.data.destination, '@ $' + createResDataA.data.rate);
  assert.strictEqual(createResDataA.data.rate, 280);

  // Verify Company A now has 1 schedule
  await CompanyAdminCtrl.getDriverLoadSchedule(mockReqA, mockResA, (err) => { if (err) throw err; });
  const updatedA = mockResA.json ? responseDataA.data.schedules : [];
  assert.strictEqual(responseDataA.data.totalCount, 1, 'Company A must now have 1 schedule');
  console.log('  ✅ TEST 2 PASSED: Custom route rate successfully added to Company A.\n');

  // Test 3: New Company B Clean Start & Tenant Isolation
  console.log('--- TEST 3: New Company B Isolation (Cannot see Company A rate & starts clean) ---');
  const companyBId = 'company-test-clean-b-' + Date.now();
  const mockReqB = {
    tenantId: companyBId,
    query: {}
  };
  let responseDataB = null;
  const mockResB = {
    status: (code) => mockResB,
    json: (body) => { responseDataB = body; return mockResB; }
  };
  await CompanyAdminCtrl.getDriverLoadSchedule(mockReqB, mockResB, (err) => { if (err) throw err; });
  const schedulesB = responseDataB.data?.schedules || [];
  console.log('  Company B initial schedules count:', schedulesB.length);
  assert.strictEqual(schedulesB.length, 0, 'Company B must NOT see Company A rates and must have 0 dummy rates');
  console.log('  ✅ TEST 3 PASSED: Full tenant isolation verified between Company A and Company B.\n');

  // Test 4: Driver Payroll Calculator Safety (No Dummy Fallbacks)
  console.log('--- TEST 4: Driver Payroll Calculator Safety (No Arbitrary $500 Fallback) ---');
  const testLoad = {
    companyId: companyBId,
    origin: 'Sydney',
    destination: 'Melbourne'
  };
  const testDriver = {
    companyId: companyBId,
    payType: 'PER_LOAD',
    perLoadRate: 0
  };
  const calcRate = calculatePerLoadDriverPay({ load: testLoad, driver: testDriver, driverRate: 0, ruleRate: 0 });
  console.log('  Calculated pay for unconfigured route on Company B:', calcRate);
  assert.strictEqual(calcRate.grossPay, 0, 'Unconfigured company must calculate $0, NOT the legacy $500 dummy rate!');
  assert.strictEqual(calcRate.rate, 0, 'Rate must be 0');
  console.log('  ✅ TEST 4 PASSED: Driver pay calculator does not leak unconfigured dummy rates.\n');

  console.log('========================================================================');
  console.log('  ALL 4 TESTS PASSED (100% CLEAN START & ISOLATION VERIFIED)');
  console.log('========================================================================');
}

runTests().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
