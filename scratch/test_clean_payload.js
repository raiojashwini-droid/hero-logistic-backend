const { cleanLoadPayload } = require('../src/controllers/CompanyAdminPortalController');
const assert = require('assert');

// Test 1: Payload from the user's error trace with unknown argument loadScheduleTitle
const sampleUserPayload = {
  loadRef: "PO-332074",
  type: "General Freight",
  status: "IN_TRANSIT",
  priority: "NORMAL",
  notes: "Created via Load Console [DRIVER_PAY:500]",
  loadDate: "2026-09-26T00:00:00.000Z",
  customerId: "ed4c4b37-f218-4cdf-9405-a27239ae1563",
  driverId: "9c79d176-c477-4d48-8134-6d86d6be8579",
  truckId: "4708caa8-22bd-4d7b-bc16-b482ecae2792",
  loadScheduleTitle: "Driver-001", // UNKNOWN KEY
  loadScheduleId: "sch-123", // UNKNOWN KEY
  driverLoadPaySchedule: "weekly", // UNKNOWN KEY
  companyId: "2a56ff75-1ce2-4d54-96f8-5f7c350e029a",
  stops: {
    create: [
      { type: "PICKUP", sequenceIndex: 0, address: "Ebley Street, Bondi Junction NSW 2022" },
      { type: "DROPOFF", sequenceIndex: 1, address: "Big Ass Flies, Kianga NSW 2546" }
    ]
  },
  items: {
    create: [
      { stockRef: "ITEM-REF", description: "Freight Item", make: "Ford", model: "Hilux" }
    ]
  }
};

const cleaned = cleanLoadPayload(sampleUserPayload);

console.log('Cleaned Payload Result:', JSON.stringify(cleaned, null, 2));

assert.strictEqual(cleaned.loadScheduleTitle, undefined, 'loadScheduleTitle should be removed');
assert.strictEqual(cleaned.loadScheduleId, undefined, 'loadScheduleId should be removed');
assert.strictEqual(cleaned.driverLoadPaySchedule, undefined, 'driverLoadPaySchedule should be removed');
assert.strictEqual(cleaned.loadRef, "PO-332074");
assert.strictEqual(cleaned.companyId, "2a56ff75-1ce2-4d54-96f8-5f7c350e029a");
assert.ok(cleaned.stops && cleaned.stops.create, 'stops relation should be preserved');
assert.ok(cleaned.items && cleaned.items.create, 'items relation should be preserved');

console.log('✅ UNIT TEST PASSED: cleanLoadPayload successfully removes unknown arguments while retaining valid schema & relation properties!');
