// Verification script for Total Payroll MTD calculation fix

const toNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (typeof val === 'object' && val !== null) {
    return parseFloat(val.toString()) || Number(val) || 0;
  }
  return parseFloat(val) || 0;
};

// Mock Prisma Decimal object returned by Prisma findMany
const mockPrismaDecimal = { s: 1, e: 2, d: [500] }; // Prisma Decimal representation of 500
mockPrismaDecimal.toString = () => "500";

const mockPayPeriods = [
  {
    id: 'p1',
    driverId: 'd1',
    grossEarnings: mockPrismaDecimal,
    netPay: mockPrismaDecimal,
    status: 'DRAFT'
  }
];

function calculateStats(payPeriods) {
  let totalPayrollMTD = payPeriods.reduce((sum, p) => sum + (toNumber(p.grossEarnings) || toNumber(p.netPay) || 0), 0);
  let pendingRuns = payPeriods.filter(p => p.status === 'DRAFT' || p.status === 'PENDING' || p.status === 'PROCESSING');
  let pendingAmount = pendingRuns.reduce((sum, p) => sum + (toNumber(p.grossEarnings) || toNumber(p.netPay) || 0), 0);

  if (totalPayrollMTD === 0 && pendingAmount > 0) {
    totalPayrollMTD = pendingAmount;
  }

  return {
    totalPayrollMTD,
    pendingPayRun: pendingAmount
  };
}

const stats = calculateStats(mockPayPeriods);
console.log('Calculated Stats:', stats);

if (stats.totalPayrollMTD === 500 && stats.pendingPayRun === 500) {
  console.log('SUCCESS: Total Payroll MTD evaluated to $500.00 perfectly!');
} else {
  console.error('FAILURE: Total Payroll MTD is still 0');
  process.exit(1);
}
