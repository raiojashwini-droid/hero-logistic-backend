/**
 * HERO LOGISTIC - PickupLoading Full API Test Suite
 * Tests all endpoints that PickupLoading.jsx uses
 * Run: node test_pickup_loading_full.js
 */

const BASE_URL = 'https://hero-logistic-backend-production.up.railway.app/api/v1';
const DRIVER_EMAIL = 'driver@hero.com';
const DRIVER_PASSWORD = 'Driver@1234';

let TOKEN = null;
let LOAD_ID = null;
let LOAD_DB_ID = null;
let ADDED_ITEM_ID = null;
let CUSTOMERS = [];

const results = [];

function log(label, status, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : 'ℹ️';
  console.log(`${icon} [${status}] ${label}${detail ? ' — ' + detail : ''}`);
  results.push({ label, status, detail });
}

async function apiCall(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data: json };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// TEST 1: Login
// ─────────────────────────────────────────────────────────────
async function test_login() {
  console.log('\n━━━━━ TEST 1: Driver Login ━━━━━');
  const r = await apiCall('POST', '/auth/login', { email: DRIVER_EMAIL, password: DRIVER_PASSWORD });
  if (r.ok && r.data?.data?.accessToken) {
    TOKEN = r.data.data.accessToken;
    log('Driver Login', 'PASS', `Got JWT (user: ${r.data.data.user?.name}, role: ${r.data.data.user?.role})`);
  } else if (r.ok && r.data?.token) {
    TOKEN = r.data.token;
    log('Driver Login', 'PASS', `Got JWT token`);
  } else {
    log('Driver Login', 'FAIL', `HTTP ${r.status} — ${JSON.stringify(r.data)}`);
    console.log('❌ Cannot continue without token. Stopping.');
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────
// TEST 2: GET /pickup-load
// ─────────────────────────────────────────────────────────────
async function test_getPickupLoad() {
  console.log('\n━━━━━ TEST 2: GET /pickup-load ━━━━━');
  const r = await apiCall('GET', '/driver-portal/pickup-load', null, TOKEN);
  
  if (!r.ok) {
    log('GET /pickup-load', 'FAIL', `HTTP ${r.status} — ${JSON.stringify(r.data)}`);
    return;
  }

  const load = r.data?.data?.load;
  if (!load) {
    log('GET /pickup-load — Load present', 'WARN', 'No active load assigned to this driver');
    return;
  }
  log('GET /pickup-load — HTTP 200', 'PASS');
  
  LOAD_ID = load.id;
  LOAD_DB_ID = load.dbId;

  // Check loadType present (Bug #11 fix)
  if (load.loadType) {
    log('loadType in response', 'PASS', `loadType = "${load.loadType}"`);
  } else {
    log('loadType in response', 'FAIL', 'loadType missing from API response');
  }

  // Check totalCars present (Bug #13 fix)
  if (load.totalCars !== undefined) {
    log('totalCars in response', 'PASS', `totalCars = ${load.totalCars}`);
  } else {
    log('totalCars in response', 'FAIL', 'totalCars missing from API response');
  }

  // Check cars array
  if (Array.isArray(load.cars)) {
    log('cars array present', 'PASS', `${load.cars.length} cars in load`);
    // Check each car has customerId field
    const hasCustomerFields = load.cars.every(c => 'customerId' in c);
    if (hasCustomerFields) {
      log('cars have customerId field', 'PASS');
    } else {
      log('cars have customerId field', 'FAIL', 'customerId missing from car objects');
    }
  } else {
    log('cars array present', 'FAIL', 'cars not array');
  }

  // Check customers array
  if (Array.isArray(load.customers)) {
    log('customers array present', 'PASS', `${load.customers.length} customers linked to load`);
  } else {
    log('customers array present', 'FAIL', 'customers field missing');
  }

  console.log(`   Load: ${load.id} | dbId: ${load.dbId} | Cars: ${load.cars?.length} | Customers: ${load.customers?.length}`);
}

// ─────────────────────────────────────────────────────────────
// TEST 3: GET /pickup-load/customers
// ─────────────────────────────────────────────────────────────
async function test_getCustomers() {
  console.log('\n━━━━━ TEST 3: GET /pickup-load/customers ━━━━━');
  const path = LOAD_DB_ID 
    ? `/driver-portal/pickup-load/customers?loadId=${LOAD_DB_ID}`
    : `/driver-portal/pickup-load/customers`;
  
  const r = await apiCall('GET', path, null, TOKEN);

  if (!r.ok) {
    log('GET /pickup-load/customers', 'FAIL', `HTTP ${r.status} — ${JSON.stringify(r.data)}`);
    return;
  }
  log('GET /pickup-load/customers — HTTP 200', 'PASS');

  const customers = r.data?.data?.customers;
  if (Array.isArray(customers)) {
    CUSTOMERS = customers;
    if (customers.length > 0) {
      log('Customers returned', 'PASS', `${customers.length} customers found`);
      customers.forEach(c => console.log(`   Customer: ${c.id} | ${c.name} | ${c.phone || '—'}`));
    } else {
      log('Customers returned', 'WARN', '0 customers — driver may have no company or no linked customers');
    }
  } else {
    log('Customers array', 'FAIL', 'customers field is not array');
  }
}

// ─────────────────────────────────────────────────────────────
// TEST 4: POST /pickup-load/add-item (Bug #1 + #2 fix)
// ─────────────────────────────────────────────────────────────
async function test_addItem() {
  console.log('\n━━━━━ TEST 4: POST /pickup-load/add-item ━━━━━');
  
  if (!LOAD_DB_ID) {
    log('POST /pickup-load/add-item', 'WARN', 'Skipped — no load ID available');
    return;
  }

  const payload = {
    loadId: LOAD_DB_ID,
    vin: `TEST-VIN-${Date.now().toString().slice(-6)}`,
    makeModel: 'Toyota Camry TEST',
    plate: 'TEST99',
    drop: 'DROP 1',
    ...(CUSTOMERS.length > 0 && { customerId: CUSTOMERS[0].id })
  };

  const r = await apiCall('POST', '/driver-portal/pickup-load/add-item', payload, TOKEN);

  if (r.status === 403) {
    log('POST /pickup-load/add-item — 403 Fix', 'FAIL', 'Still getting 403! Bug #1 not fixed properly');
    console.log('   Response:', JSON.stringify(r.data));
    return;
  }

  if (!r.ok) {
    log('POST /pickup-load/add-item', 'FAIL', `HTTP ${r.status} — ${JSON.stringify(r.data)}`);
    return;
  }

  log('POST /pickup-load/add-item — HTTP 200', 'PASS');

  const item = r.data?.data?.item;
  if (!item) {
    log('Item returned in response', 'FAIL', 'No item in response');
    return;
  }

  ADDED_ITEM_ID = item.id;
  log('Item created', 'PASS', `Item ID: ${item.id}`);

  // CRITICAL: Check status is PENDING not PICKED_UP (Bug #2 fix)
  if (item.status === 'PENDING') {
    log('New item status = PENDING', 'PASS', '✅ Bug #2 fixed correctly!');
  } else if (item.status === 'PICKED_UP') {
    log('New item status = PENDING', 'FAIL', `❌ Bug #2 NOT fixed — status is still PICKED_UP!`);
  } else {
    log('New item status', 'WARN', `status = "${item.status}" (unexpected)`);
  }

  // Check customerId linked
  if (CUSTOMERS.length > 0) {
    if (item.customerId === CUSTOMERS[0].id) {
      log('customerId linked to item', 'PASS');
    } else {
      log('customerId linked to item', 'WARN', `Expected ${CUSTOMERS[0].id}, got ${item.customerId}`);
    }
  }

  console.log(`   Item: ${item.id} | Status: ${item.status} | VIN: ${item.vin}`);
}

// ─────────────────────────────────────────────────────────────
// TEST 5: POST /pickup-load/item-status (toggle pickup)
// ─────────────────────────────────────────────────────────────
async function test_togglePickup() {
  console.log('\n━━━━━ TEST 5: POST /pickup-load/item-status ━━━━━');

  if (!ADDED_ITEM_ID) {
    log('POST /pickup-load/item-status', 'WARN', 'Skipped — no item ID from previous test');
    return;
  }

  const r = await apiCall('POST', '/driver-portal/pickup-load/item-status', {
    itemId: ADDED_ITEM_ID,
    pickedUp: true
  }, TOKEN);

  if (!r.ok) {
    log('POST /pickup-load/item-status', 'FAIL', `HTTP ${r.status} — ${JSON.stringify(r.data)}`);
    return;
  }
  log('Toggle Item to PICKED_UP', 'PASS', `HTTP ${r.status}`);
  
  // Toggle back to PENDING
  const r2 = await apiCall('POST', '/driver-portal/pickup-load/item-status', {
    itemId: ADDED_ITEM_ID,
    pickedUp: false
  }, TOKEN);
  if (r2.ok) {
    log('Toggle Item back to PENDING', 'PASS');
  }
}

// ─────────────────────────────────────────────────────────────
// TEST 6: POST /pickup-load/scan-vin (Bug #9 — case insensitive fix)
// ─────────────────────────────────────────────────────────────
async function test_scanVin() {
  console.log('\n━━━━━ TEST 6: POST /pickup-load/scan-vin (Case Insensitive) ━━━━━');

  if (!LOAD_DB_ID) {
    log('POST /pickup-load/scan-vin', 'WARN', 'Skipped — no load');
    return;
  }

  // Test 1: uppercase VIN
  const r1 = await apiCall('POST', '/driver-portal/pickup-load/scan-vin', {
    vin: 'TEST-UPPERCASE',
    loadId: LOAD_DB_ID
  }, TOKEN);
  if (r1.ok) {
    log('VIN scan uppercase — API responds', 'PASS', `HTTP ${r1.status}`);
  } else {
    log('VIN scan uppercase', 'FAIL', `HTTP ${r1.status}`);
  }

  // Test 2: lowercase VIN (should also work now — case insensitive)
  const r2 = await apiCall('POST', '/driver-portal/pickup-load/scan-vin', {
    vin: 'test-lowercase',
    loadId: LOAD_DB_ID
  }, TOKEN);
  if (r2.ok) {
    log('VIN scan lowercase — API responds', 'PASS', `HTTP ${r2.status}`);
    // If the backend returns the normalized (uppercase) VIN, that confirms the fix
    const returnedVin = r2.data?.data?.vin;
    if (returnedVin === 'TEST-LOWERCASE') {
      log('VIN normalized to uppercase in response', 'PASS', '✅ Bug #9 fixed!');
    } else {
      log('VIN normalized in response', 'WARN', `Returned VIN: ${returnedVin}`);
    }
  } else {
    log('VIN scan lowercase', 'FAIL', `HTTP ${r2.status}`);
  }

  // Test 3: missing VIN (should return 400)
  const r3 = await apiCall('POST', '/driver-portal/pickup-load/scan-vin', {
    loadId: LOAD_DB_ID
  }, TOKEN);
  if (r3.status === 400) {
    log('VIN scan missing VIN → 400', 'PASS', 'Correct validation error');
  } else {
    log('VIN scan missing VIN', 'WARN', `Expected 400, got ${r3.status}`);
  }
}

// ─────────────────────────────────────────────────────────────
// TEST 7: GET /payroll (Bug #4 — broken route fix)
// ─────────────────────────────────────────────────────────────
async function test_payroll() {
  console.log('\n━━━━━ TEST 7: GET /payroll (Was 500 due to undefined function) ━━━━━');
  const r = await apiCall('GET', '/driver-portal/payroll', null, TOKEN);
  
  if (r.status === 500) {
    log('GET /payroll — 500 fix', 'FAIL', '❌ Bug #4 NOT fixed — still getting 500!');
  } else if (r.ok) {
    log('GET /payroll — HTTP 200', 'PASS', '✅ Bug #4 fixed — no more 500 error!');
  } else {
    log('GET /payroll', 'WARN', `HTTP ${r.status} — ${JSON.stringify(r.data).slice(0,100)}`);
  }
}

// ─────────────────────────────────────────────────────────────
// TEST 8: PUT /pickup-load/item/:id (Edit item with customerId)
// ─────────────────────────────────────────────────────────────
async function test_editItem() {
  console.log('\n━━━━━ TEST 8: PUT /pickup-load/item/:id (Edit with customerId) ━━━━━');

  if (!ADDED_ITEM_ID) {
    log('PUT /pickup-load/item/:id', 'WARN', 'Skipped — no item ID');
    return;
  }

  const payload = {
    makeModel: 'Honda Civic EDITED',
    vin: `EDITED-${Date.now().toString().slice(-4)}`,
    plate: 'EDIT01',
    drop: 'DROP 2',
    ...(CUSTOMERS.length > 1 && { customerId: CUSTOMERS[1].id })
  };

  const r = await apiCall('PUT', `/driver-portal/pickup-load/item/${ADDED_ITEM_ID}`, payload, TOKEN);

  if (r.ok) {
    log('PUT /pickup-load/item/:id — HTTP 200', 'PASS', '✅ Edit with customerId works!');
  } else {
    log('PUT /pickup-load/item/:id', 'FAIL', `HTTP ${r.status} — ${JSON.stringify(r.data)}`);
  }
}

// ─────────────────────────────────────────────────────────────
// TEST 9: DELETE /pickup-load/item/:id (cleanup test item)
// ─────────────────────────────────────────────────────────────
async function test_deleteItem() {
  console.log('\n━━━━━ TEST 9: DELETE /pickup-load/item/:id (Cleanup) ━━━━━');

  if (!ADDED_ITEM_ID) {
    log('DELETE /pickup-load/item/:id', 'WARN', 'Skipped — no item ID');
    return;
  }

  const r = await apiCall('DELETE', `/driver-portal/pickup-load/item/${ADDED_ITEM_ID}`, null, TOKEN);

  if (r.ok) {
    log('DELETE /pickup-load/item/:id', 'PASS', 'Test item cleaned up');
  } else {
    log('DELETE /pickup-load/item/:id', 'WARN', `HTTP ${r.status} — test item may remain in DB`);
  }
}

// ─────────────────────────────────────────────────────────────
// TEST 10: Check duplicate routes — no double processing
// ─────────────────────────────────────────────────────────────
async function test_noPhantomRoute() {
  console.log('\n━━━━━ TEST 10: /pickup-load/items phantom route check ━━━━━');
  // The old phantom route was POST /pickup-load/items — should now return 404
  const r = await apiCall('POST', '/driver-portal/pickup-load/items', {
    loadId: 'test', vin: 'TEST'
  }, TOKEN);

  if (r.status === 404) {
    log('Phantom route /pickup-load/items removed', 'PASS', '✅ Returns 404 now');
  } else if (r.ok) {
    log('Phantom route /pickup-load/items', 'WARN', 'Route still exists (may conflict with /add-item)');
  } else {
    log('Phantom route check', 'INFO', `HTTP ${r.status}`);
  }
}

// ─────────────────────────────────────────────────────────────
// PRINT SUMMARY
// ─────────────────────────────────────────────────────────────
function printSummary() {
  console.log('\n\n══════════════════════════════════════════════');
  console.log('       PICKUP LOADING — TEST SUMMARY REPORT   ');
  console.log('══════════════════════════════════════════════');
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  
  console.log(`\n✅ PASSED: ${pass}`);
  console.log(`❌ FAILED: ${fail}`);
  console.log(`⚠️  WARNINGS: ${warn}`);
  console.log(`📊 TOTAL CHECKS: ${results.length}`);

  if (fail > 0) {
    console.log('\n── FAILED TESTS ──');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ ${r.label}: ${r.detail}`);
    });
  }
  if (warn > 0) {
    console.log('\n── WARNINGS ──');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  ⚠️  ${r.label}: ${r.detail}`);
    });
  }
  console.log('\n══════════════════════════════════════════════\n');
}

// ─────────────────────────────────────────────────────────────
// RUN ALL TESTS
// ─────────────────────────────────────────────────────────────
(async () => {
  console.log('🚀 Hero Logistic — PickupLoading Full Test Suite');
  console.log(`   Backend: ${BASE_URL}`);
  console.log(`   Driver: ${DRIVER_EMAIL}`);
  console.log('');
  
  await test_login();
  await test_getPickupLoad();
  await test_getCustomers();
  await test_addItem();
  await test_togglePickup();
  await test_scanVin();
  await test_payroll();
  await test_editItem();
  await test_deleteItem();
  await test_noPhantomRoute();
  
  printSummary();
})();
