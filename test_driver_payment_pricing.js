const assert = require('assert');
const path = require('path');
const driverPayCalculator = require('./src/utils/driverPayCalculator');
const payrollCalculator = require('./src/utils/payrollCalculator');

async function runTests() {
  console.log('=== STARTING DRIVER PAYMENT AND CUSTOMER PRICING VERIFICATION TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Driver Payment - HOURLY calculation
  // --------------------------------------------------------------------------
  test('Hourly Driver Pay: Hours Worked * Hourly Rate', () => {
    const result = driverPayCalculator.calculateHourlyDriverPay({ hoursWorked: 8, hourlyRate: 45.00 });
    assert.strictEqual(result.grossPay, 360.00, 'Expected 8 hrs * $45 = $360.00');
    assert.strictEqual(result.payType, 'Hourly');
  });

  // --------------------------------------------------------------------------
  // TEST 2: Driver Payment - PER_KM calculation
  // --------------------------------------------------------------------------
  test('Per KM Driver Pay: Distance * KM Rate', () => {
    const result = driverPayCalculator.calculatePerKmDriverPay({ distanceKm: 878, perKmRate: 1.25 });
    assert.strictEqual(result.grossPay, 1097.50, 'Expected 878 km * $1.25 = $1097.50');
    assert.strictEqual(result.payType, 'Per Kilometer');
  });

  // --------------------------------------------------------------------------
  // TEST 3: Driver Payment - PER_LOAD (Configured load rate, NOT fixed $300)
  // --------------------------------------------------------------------------
  test('Per Load Driver Pay: Custom Configured Load Pay (not hardcoded $300)', () => {
    const load1 = { driverPayment: 620.00 }; // Load specific driver pay
    const result1 = driverPayCalculator.calculatePerLoadDriverPay({ load: load1 });
    assert.strictEqual(result1.grossPay, 620.00, 'Expected load specific pay of $620.00');

    const result2 = driverPayCalculator.calculatePerLoadDriverPay({ driverRate: 550.00 });
    assert.strictEqual(result2.grossPay, 550.00, 'Expected driver default per load pay of $550.00');
  });

  // --------------------------------------------------------------------------
  // TEST 4: Unified Driver Pay Calculator Dispatcher
  // --------------------------------------------------------------------------
  test('Unified Calculator handles different payTypes and rates correctly', () => {
    const driverHourly = { payType: 'Hourly', payRate: 50.00 };
    const driverKm = { payType: 'Per KM', payRate: 0.90 };
    const driverLoad = { payType: 'Per Load', payRate: 400.00 };

    const sampleLoad = {
      estimatedHours: 6,
      distance: 500,
      driverPayment: 480.00
    };

    const resHourly = driverPayCalculator.calculateDriverPayForLoad({ driver: driverHourly, hoursWorked: 6 });
    assert.strictEqual(resHourly.grossPay, 300.00, '6 * 50 = 300');

    const resKm = driverPayCalculator.calculateDriverPayForLoad({ driver: driverKm, distanceKm: 500 });
    assert.strictEqual(resKm.grossPay, 450.00, '500 * 0.90 = 450');

    const resLoad = driverPayCalculator.calculateDriverPayForLoad({ driver: driverLoad, load: sampleLoad });
    assert.strictEqual(resLoad.grossPay, 400.00, 'Driver rate of 400 used');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Customer Pricing vs Driver Pay Separation
  // --------------------------------------------------------------------------
  test('Customer Charges do NOT automatically become Driver Pay', () => {
    const customerCharge = 1850.00; // Customer rate card charge for Melbourne -> Sydney
    const driver = { payType: 'Per KM', payRate: 1.10 };

    const driverPayRes = driverPayCalculator.calculateDriverPayForLoad({ driver, distanceKm: 878 });
    
    assert.notStrictEqual(driverPayRes.grossPay, customerCharge, 'Driver pay must not equal customer charge');
    assert.strictEqual(driverPayRes.grossPay, 965.80, 'Expected 878 * 1.10 = 965.80');
  });

  // --------------------------------------------------------------------------
  // TEST 6: Payroll Calculation without Hardcoded Fallbacks
  // --------------------------------------------------------------------------
  await asyncTest('Payroll Calculator integrates driverPayCalculator cleanly', async () => {
    const driver = {
      id: 'drv-test-1',
      payType: 'Hourly',
      payRate: 40.00
    };

    const payroll = await payrollCalculator.calculateDriverPay({ driver });
    assert.strictEqual(payroll.payType, 'Hourly');
    assert.strictEqual(payroll.payRate, 40.00);
    assert.strictEqual(typeof payroll.grossEarnings, 'number');
    assert.strictEqual(typeof payroll.netPay, 'number');
  });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
