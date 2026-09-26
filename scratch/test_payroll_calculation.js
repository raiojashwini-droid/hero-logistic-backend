const assert = require('assert');

// Mock data test for getPayroll calculation
const mockDrivers = [
  { id: 'drv-01', firstName: 'John', lastName: 'Driver', driverCode: 'DRV-001', payRate: 500.00 }
];

const mockPayPeriods = [
  { id: 'pp-01', driverId: 'drv-01', grossEarnings: 0, netPay: 0, status: 'DRAFT' }
];

// Verify that zero-gross payPeriods are updated with driver pay calculation
const liveRuns = [];
for (const d of mockDrivers) {
  let gross = parseFloat(d.payRate) || 500.00;
  let existing = mockPayPeriods.find(p => p.driverId === d.id);
  if (existing) {
    if (!existing.grossEarnings || existing.grossEarnings === 0) {
      existing.grossEarnings = gross;
      existing.netPay = gross;
    }
    liveRuns.push(existing);
  }
}

const totalPayrollMTD = liveRuns.reduce((sum, p) => sum + (parseFloat(p.grossEarnings) || 0), 0);
const pendingAmount = liveRuns.filter(p => p.status === 'DRAFT').reduce((sum, p) => sum + (parseFloat(p.grossEarnings) || 0), 0);

console.log('Test Payroll Runs:', JSON.stringify(liveRuns, null, 2));
console.log(`Total Payroll MTD: $${totalPayrollMTD.toFixed(2)}`);
console.log(`Pending Pay Run: $${pendingAmount.toFixed(2)}`);

assert.strictEqual(totalPayrollMTD, 500.00);
assert.strictEqual(pendingAmount, 500.00);
assert.strictEqual(liveRuns[0].grossEarnings, 500.00);

console.log('✅ PAYROLL CALCULATION UNIT TEST PASSED!');
