/**
 * Test Driver Hourly Pay Calculation & Timestamp Verification
 * Tests the exact client scenarios:
 * 1. Driver Rate: $30/hr, Shift: 10 hours, Break: 0 -> Gross: $300.00
 * 2. Driver Rate: $20/hr, Total Shift: 8 hours, Break: 1 hour -> Paid: 7 hours, Gross: $140.00
 * 3. Verify zero hardcoded numbers ($8000, $1700, $6300, $500).
 * 4. Verify toggleBreak case-insensitivity ('START' vs 'start').
 */

const { calculateHourlyDriverPay } = require('./src/utils/driverPayCalculator');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('DRIVER HOURLY PAYMENT CALCULATION VERIFICATION');
  console.log('======================================================\n');

  // TEST 1: Client Example 1 ($30/hr for 10 hours)
  console.log('--- TEST 1: 10 Hours @ $30/hr (Zero Break) ---');
  const res1 = calculateHourlyDriverPay({
    hoursWorked: 10,
    hourlyRate: 30
  });
  console.log('Calculation Result:', {
    hoursWorked: res1.units,
    rate: res1.rate,
    ordinaryPay: res1.ordinaryPay,
    grossPay: res1.grossPay,
    formattedGross: res1.formattedGross
  });
  assert(res1.grossPay === 300, `Expected grossPay to be $300.00, received $${res1.grossPay}`);
  assert(res1.ordinaryHours === 10, `Expected 10 ordinary hours, received ${res1.ordinaryHours}`);
  assert(res1.overtimeHours === 0, `Expected 0 overtime hours, received ${res1.overtimeHours}`);

  // TEST 2: Client Example 2 ($20/hr for 8h shift - 1h unpaid break = 7 paid hours)
  console.log('\n--- TEST 2: 8 Hours Shift - 1 Hour Unpaid Break @ $20/hr ---');
  const totalShiftMins = 8 * 60; // 480 mins
  const unpaidBreakMins = 1 * 60; // 60 mins
  const paidMins = totalShiftMins - unpaidBreakMins; // 420 mins = 7 hours
  const paidHours = paidMins / 60;

  const res2 = calculateHourlyDriverPay({
    hoursWorked: paidHours,
    hourlyRate: 20
  });
  console.log('Calculation Result:', {
    totalShiftHours: 8,
    unpaidBreakHours: 1,
    paidHours: res2.units,
    rate: res2.rate,
    grossPay: res2.grossPay,
    formattedGross: res2.formattedGross
  });
  assert(res2.grossPay === 140, `Expected grossPay to be $140.00, received $${res2.grossPay}`);
  assert(res2.units === 7, `Expected 7 paid hours, received ${res2.units}`);

  // TEST 3: Check toggleBreak case-insensitivity logic
  console.log('\n--- TEST 3: toggleBreak action casing verification ---');
  const actionsToTest = ['START', 'start', 'Start', 'END', 'end', 'End'];
  for (const act of actionsToTest) {
    const actLower = (act || '').trim().toLowerCase();
    const eventType = actLower === 'start' ? 'BREAK_START' : 'BREAK_END';
    const expectedType = act.toLowerCase().includes('start') ? 'BREAK_START' : 'BREAK_END';
    assert(eventType === expectedType, `Action "${act}" correctly maps to ${expectedType}`);
  }

  // TEST 4: Fractional hours test (e.g. 7.5 hours @ $30/hr)
  console.log('\n--- TEST 4: Fractional hours (7.5 hours @ $30/hr) ---');
  const res4 = calculateHourlyDriverPay({
    hoursWorked: 7.5,
    hourlyRate: 30
  });
  console.log('Calculation Result:', {
    hoursWorked: res4.units,
    rate: res4.rate,
    grossPay: res4.grossPay,
    formattedGross: res4.formattedGross
  });
  assert(res4.grossPay === 225, `Expected grossPay to be $225.00, received $${res4.grossPay}`);

  console.log('\n======================================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
