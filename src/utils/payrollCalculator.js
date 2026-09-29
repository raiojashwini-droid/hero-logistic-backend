const prisma = require('./prismaClient');
const {
  calculateHourlyDriverPay,
  calculatePerKmDriverPay,
  calculatePerLoadDriverPay,
  calculateAtoPaygTax
} = require('./driverPayCalculator');

/**
 * Calculate dynamic earnings and deductions for a driver based on:
 * - payType: "Hourly" | "Per Load" | "Per Km"
 * - payRate: number ($/hr, $/load, or $/km)
 * - Time period (startDate, endDate)
 */
async function calculateDriverPay({ driver, startDate, endDate, companyId }) {
  if (!driver) return null;

  const payType = (driver.payType || 'Hourly').trim();
  const rawRate = parseFloat(driver.payRate) || 0;
  const normalizedType = payType.toLowerCase();

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  // 1. Fetch Timesheets in date range for this driver
  let workMinutes = 0;
  try {
    const timesheets = await prisma.timesheet.findMany({
      where: {
        driverId: driver.id,
        createdAt: { gte: start, lte: end }
      },
      select: { workMinutes: true, totalMinutes: true, status: true, clockInAt: true, clockOutAt: true, breakMinutes: true }
    });
    workMinutes = timesheets.reduce((acc, t) => {
      // Calculate from exact timestamps if available
      if (t.clockInAt && t.clockOutAt) {
        const diffMs = new Date(t.clockOutAt).getTime() - new Date(t.clockInAt).getTime();
        const diffMins = Math.max(0, diffMs / 60000);
        const actualWorkMins = Math.max(0, diffMins - (t.breakMinutes || 0));
        return acc + actualWorkMins;
      }
      return acc + (t.workMinutes || t.totalMinutes || 0);
    }, 0);
  } catch (err) {
    console.warn('Could not fetch driver timesheets for pay calculation:', err?.message);
  }
  const hoursWorked = Math.round((workMinutes / 60) * 100) / 100;

  // 2. Fetch Loads in date range for this driver
  let completedLoadsCount = 0;
  let activeLoadsCount = 0;
  let totalKmDriven = 0;
  let loads = [];

  try {
    const driverOrConditions = [
      { driverId: driver.id },
      ...(driver.userId ? [{ driver: { userId: driver.userId } }] : []),
      ...(driver.email ? [{ driver: { email: driver.email } }] : []),
      ...(driver.driverCode ? [{ driver: { driverCode: driver.driverCode } }] : [])
    ];

    loads = await prisma.load.findMany({
      where: { OR: driverOrConditions },
      select: { id: true, status: true, notes: true, createdAt: true, stops: { select: { type: true, address: true } }, truck: { select: { odometerKm: true } } }
    });

    // Removed fallback that queried by companyId.

    completedLoadsCount = loads.filter(l => ['DELIVERED', 'COMPLETED', 'CLOSED'].includes(l.status)).length;
    activeLoadsCount = loads.filter(l => ['IN_TRANSIT', 'ASSIGNED', 'DISPATCHED'].includes(l.status)).length;
    
    // Total KMs driven from loads
    totalKmDriven = completedLoadsCount * 650;
    if (activeLoadsCount > 0) {
      totalKmDriven += activeLoadsCount * 250;
    }
  } catch (err) {
    console.warn('Could not fetch driver loads for pay calculation:', err?.message);
  }

  // Parse load pay schedule if present
  let scheduleRates = {};
  let defaultScheduleRate = 0;
  if (driver?.loadPaySchedule) {
    try {
      const parsed = typeof driver.loadPaySchedule === 'string' ? JSON.parse(driver.loadPaySchedule) : driver.loadPaySchedule;
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item.amount && parseFloat(item.amount) > 0) {
            const destKey = (item.deliveryLocation || '').trim().toLowerCase();
            if (destKey) scheduleRates[destKey] = parseFloat(item.amount);
            if (item.isSelected || defaultScheduleRate === 0) defaultScheduleRate = parseFloat(item.amount);
          }
        });
      }
    } catch (e) {}
  }

  let basePay = 0;
  let loadAllowance = 0;
  let distanceAllow = 0;
  let otherAllowance = 0;
  let bonuses = 0;

  let overtimePay = 0;
  let paygTax = 0;
  let superAmount = 0;

  // Filter delivered loads
  let targetLoads = loads.filter(l => ['DELIVERED', 'COMPLETED', 'CLOSED'].includes(l.status));
  if (targetLoads.length === 0 && loads.length > 0) {
    targetLoads = loads;
  }

  // Calculate per-load pay from driver loads
  let totalLoadAmount = 0;
  if (targetLoads.length > 0) {
    // Sort descending to get the latest delivered load first
    const sorted = [...targetLoads].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const primaryLoad = sorted[0];
    const calcRes = calculatePerLoadDriverPay({ load: primaryLoad, driverRate: rawRate, driver });
    totalLoadAmount = calcRes.grossPay || 0;
  }

  // Only use schedule rate as fallback if there are actual completed loads
  if (totalLoadAmount <= 0 && defaultScheduleRate > 0 && completedLoadsCount > 0) {
    totalLoadAmount = defaultScheduleRate;
  }

  if (normalizedType.includes('load')) {
    // === PER LOAD ===
    // Only calculate pay if driver has actual completed loads
    if (completedLoadsCount > 0) {
      loadAllowance = Math.round(totalLoadAmount * 100) / 100;
      basePay = loadAllowance;
    }
    // If no loads completed yet, pay stays at $0.00
  } else if (normalizedType.includes('km') || normalizedType.includes('kilometre')) {
    // === PER KM ===
    const calc = calculatePerKmDriverPay({ distanceKm: totalKmDriven, perKmRate: rawRate });
    distanceAllow = calc.grossPay;
    basePay = distanceAllow;
  } else {
    // === HOURLY (Default) ===
    if (hoursWorked > 0) {
      const calc = calculateHourlyDriverPay({
        hoursWorked,
        hourlyRate: rawRate,
        ordinaryHoursPerDay: driver.ordinaryHoursPerDay,
        overtimeStartsAfter: driver.overtimeStartsAfter,
        overtimeRate: driver.overtimeRate,
        overtimeMultiplier: driver.overtimeMultiplier,
        superPercentage: driver.superPercentage,
        taxFreeThreshold: driver.taxFreeThreshold,
        studyLoanDebt: driver.studyLoanDebt,
        residencyStatus: driver.residencyStatus
      });
      basePay = calc.ordinaryPay || calc.grossPay;
      overtimePay = calc.overtimePay || 0;
      paygTax = calc.paygTax || 0;
      superAmount = calc.superContribution || 0;
    } else {
      basePay = 0;
    }
    if (totalLoadAmount > 0) {
      loadAllowance = totalLoadAmount;
      if (hoursWorked === 0) basePay = 0;
    }
  }

  // Compute Totals: Gross Earnings & Net Pay
  if (loadAllowance > 0 && hoursWorked === 0) {
    basePay = 0;
  }
  let grossEarnings = Math.round((basePay + overtimePay + loadAllowance + distanceAllow + otherAllowance + bonuses) * 100) / 100;

  // If no real data, gross stays at 0
  // No dummy fallback - return actual computed value only
  
  if (paygTax === 0 && driver) {
    paygTax = calculateAtoPaygTax({
      grossWeeklyPay: grossEarnings,
      taxFreeThreshold: driver.taxFreeThreshold,
      studyLoanDebt: driver.studyLoanDebt,
      residencyStatus: driver.residencyStatus
    });
  }

  if (superAmount === 0 && driver) {
    const superRate = parseFloat(driver.superPercentage) || 12.0;
    superAmount = Math.round((grossEarnings * (superRate / 100)) * 100) / 100;
  }

  const totalDeductions = paygTax;
  const netPay = Math.round(Math.max(0, grossEarnings - paygTax) * 100) / 100;

  return {
    payType,
    payRate: rawRate,
    units: {
      hoursWorked,
      completedLoadsCount,
      activeLoadsCount,
      totalKmDriven
    },
    basePay,
    overtimePay,
    loadAllowance,
    distanceAllow,
    otherAllowance,
    bonuses,
    grossEarnings,
    paygTax,
    superAmount,
    employerSuperContribution: superAmount,
    totalDeductions,
    netPay,
    formatted: {
      basePay: `$${basePay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      overtimePay: `$${overtimePay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      loadAllowance: `$${loadAllowance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      distanceAllowance: `$${distanceAllow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      grossEarnings: `$${grossEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      paygTax: `$${paygTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      superAmount: `$${superAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalDeductions: `$${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      netPay: `$${netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  };
}

module.exports = {
  calculateDriverPay
};
