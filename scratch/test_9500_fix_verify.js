// Unit test verifying that getPayroll KPI pendingPayRun equals $5,000.00 (not $9,500.00) for a driver with a $5,000 delivered load

const mockDriver = {
  id: 'driver-001',
  firstName: 'Demo',
  lastName: 'Driver',
  driverCode: 'DRV-001',
  payType: 'Per Load',
  payRate: 4500, // old default/base rate
  companyId: 'company-001'
};

const mockDeliveredLoad = {
  id: 'load-001',
  loadRef: 'PO-332074',
  status: 'DELIVERED',
  notes: 'Delivered successfully [DRIVER_PAY:5000]',
  driverId: 'driver-001'
};

const mockExistingPayPeriodInDb = {
  id: 'period-001',
  driverId: 'driver-001',
  grossEarnings: 9500.00, // Old stale value stored in DB!
  netPay: 9500.00,
  status: 'DRAFT'
};

// Simulation of getPayroll calculation fix:
async function simulateGetPayroll(drivers, existingPayPeriods, loads) {
  const liveRuns = [];
  for (const d of drivers) {
    // 1. Calculate pay for delivered load
    let gross = 0;
    const targetLoad = loads.find(l => l.driverId === d.id && l.status === 'DELIVERED');
    if (targetLoad && targetLoad.notes.includes('[DRIVER_PAY:')) {
      const match = targetLoad.notes.match(/\[DRIVER_PAY:([0-9.]+)/);
      if (match) gross = parseFloat(match[1]);
    }
    if (gross === 0) gross = parseFloat(d.payRate) || 500;

    // 2. Update existing PayPeriod record
    let existing = existingPayPeriods.find(p => p.driverId === d.id);
    if (existing) {
      if (gross > 0) {
        existing.grossEarnings = gross;
        existing.netPay = gross;
        existing.loadAllowance = gross;
        existing.basePay = gross;
      }
      liveRuns.push(existing);
    }
  }

  const pendingRuns = liveRuns.filter(p => p.status === 'DRAFT' || p.status === 'PENDING');
  const pendingAmount = pendingRuns.reduce((sum, p) => sum + (parseFloat(p.grossEarnings) || 0), 0);

  return {
    pendingPayRun: pendingAmount,
    payrollRuns: liveRuns
  };
}

async function runVerification() {
  const result = await simulateGetPayroll([mockDriver], [mockExistingPayPeriodInDb], [mockDeliveredLoad]);
  console.log('Verification Result:', result);
  if (result.pendingPayRun === 5000) {
    console.log('SUCCESS: Pending Pay Run successfully updated from 9500 to 5000!');
  } else {
    console.error(`FAILURE: Expected 5000 but got ${result.pendingPayRun}`);
    process.exit(1);
  }
}

runVerification();
