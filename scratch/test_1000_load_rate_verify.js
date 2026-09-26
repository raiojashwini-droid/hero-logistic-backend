const { calculateDriverPay } = require('../src/utils/payrollCalculator');

// Mock Driver
const driver = {
  id: 'drv-1',
  firstName: 'Demo',
  lastName: 'Driver',
  payType: 'Per Load',
  payRate: 500,
  companyId: 'company-001'
};

// Mock Loads: includes old load ($5,000) and new load ($1,000)
const loads = [
  {
    id: 'load-old',
    status: 'DELIVERED',
    notes: 'Old test load [DRIVER_PAY:5000]',
    driverId: 'drv-1',
    createdAt: '2026-09-25T10:00:00.000Z'
  },
  {
    id: 'load-new',
    status: 'DELIVERED',
    notes: 'New delivery [DRIVER_PAY:1000]',
    origin: 'dubai',
    destination: 'USA',
    driverId: 'drv-1',
    createdAt: '2026-09-26T15:00:00.000Z'
  }
];

// Mock prisma for payrollCalculator
const originalPrisma = require('../src/utils/prismaClient');
originalPrisma.timesheet.findMany = async () => [];
originalPrisma.load.findMany = async () => loads;

async function testFix() {
  const result = await calculateDriverPay({ driver });
  console.log('Calculation Result:', JSON.stringify(result, null, 2));
  if (result.grossEarnings === 1000) {
    console.log('SUCCESS: Driver gross earnings evaluated to $1,000.00 perfectly!');
  } else {
    console.error(`FAILURE: Expected 1000 but got ${result.grossEarnings}`);
    process.exit(1);
  }
}

testFix();
