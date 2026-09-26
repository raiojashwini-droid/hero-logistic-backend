const { calculateDriverPay } = require('../src/utils/payrollCalculator');

// Mock driver created with payRate: 4700 and default payType 'Hourly'
const driverDemo = {
  id: 'driver-demo-id',
  firstName: 'Driver',
  lastName: 'Demo',
  driverCode: 'DRV-DEMO',
  payType: 'Hourly',
  payRate: 4700.00,
  companyId: 'company-demo'
};

// Mock load edited to 5000 driver pay
const load5000 = {
  id: 'load-5000',
  status: 'DELIVERED',
  notes: 'Created via console [DRIVER_PAY:5000]',
  driverId: 'driver-demo-id',
  createdAt: new Date().toISOString()
};

// Mock prisma for test
const originalPrisma = require('../src/utils/prismaClient');
originalPrisma.timesheet.findMany = async () => [];
originalPrisma.load.findMany = async () => [load5000];

async function test9700Fix() {
  const result = await calculateDriverPay({ driver: driverDemo });
  console.log('Calculation Result:', {
    payType: result.payType,
    driverPayRate: driverDemo.payRate,
    loadAllowance: result.loadAllowance,
    basePay: result.basePay,
    grossEarnings: result.grossEarnings,
    formattedGross: result.formatted.grossEarnings
  });

  if (result.grossEarnings === 5000) {
    console.log('SUCCESS: Driver-Demo gross earnings evaluated to EXACT $5,000.00! ($9,700 bug resolved)');
  } else {
    console.error(`FAILURE: Expected 5000 but got ${result.grossEarnings}`);
    process.exit(1);
  }
}

test9700Fix();
