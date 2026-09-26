const { calculateDriverPay } = require('../src/utils/payrollCalculator');

const mockDriver = {
  id: 'driver-test-01',
  firstName: 'Demoo',
  lastName: 'Driver',
  payType: 'Per Load',
  payRate: 1000,
  companyId: 'company-001'
};

// Driver has an old test load ($5000) and a newly added load ($1000)
const mockLoads = [
  {
    id: 'old-test-load-5000',
    status: 'DELIVERED',
    notes: 'Old dummy test load [DRIVER_PAY:5000]',
    driverId: 'driver-test-01',
    createdAt: '2026-09-01T10:00:00.000Z'
  },
  {
    id: 'new-load-1000',
    status: 'DELIVERED',
    notes: 'New delivery dubai to USA [DRIVER_PAY:1000]',
    origin: 'dubai',
    destination: 'USA',
    driverId: 'driver-test-01',
    createdAt: '2026-09-26T15:30:00.000Z'
  }
];

// Mock prisma for payrollCalculator
const originalPrisma = require('../src/utils/prismaClient');
originalPrisma.timesheet.findMany = async () => [];
originalPrisma.load.findMany = async () => mockLoads;

async function verifyNoAccumulation() {
  const result = await calculateDriverPay({ driver: mockDriver });
  console.log('Calculated Driver Payroll Result:', {
    grossEarnings: result.grossEarnings,
    basePay: result.basePay,
    loadAllowance: result.loadAllowance,
    formattedGross: result.formatted.grossEarnings
  });

  if (result.grossEarnings === 1000) {
    console.log('SUCCESS: Only the newly added load ($1,000.00) is displayed! Old test loads were not accumulated.');
  } else {
    console.error(`FAILURE: Expected 1000 but got ${result.grossEarnings}`);
    process.exit(1);
  }
}

verifyNoAccumulation();
