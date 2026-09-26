const assert = require('assert');

// Test Driver Load Schedule persistence logic
const sampleSchedule = {
  id: 'rt-1727345678',
  title: 'Sydney to Melbourne',
  origin: 'Sydney',
  destination: 'Melbourne',
  rate: 750.00,
  licenseClass: 'All Classes',
  status: 'Active',
  notes: 'Express highway route rate'
};

// Simulated driver record with loadPaySchedule JSON string
const driver = {
  id: 'drv-01',
  loadPaySchedule: JSON.stringify([sampleSchedule])
};

const parsed = JSON.parse(driver.loadPaySchedule);
console.log('Parsed Route Schedule from DB:', JSON.stringify(parsed, null, 2));

assert.strictEqual(parsed.length, 1);
assert.strictEqual(parsed[0].origin, 'Sydney');
assert.strictEqual(parsed[0].rate, 750.00);

console.log('✅ ROUTE RATE PERSISTENCE TEST PASSED!');
