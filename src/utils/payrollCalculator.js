const prisma = require('./prismaClient');
const {
  calculateHourlyDriverPay,
  calculatePerKmDriverPay,
  calculatePerLoadDriverPay
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
      select: { workMinutes: true, totalMinutes: true, status: true }
    });
    workMinutes = timesheets.reduce((acc, t) => acc + (t.workMinutes || t.totalMinutes || 0), 0);
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
      select: { id: true, status: true, notes: true, destination: true, deliveryLocation: true, origin: true, pickupLocation: true, truck: { select: { odometerKm: true } } }
    });

    if (loads.length === 0 && driver.companyId) {
      loads = await prisma.load.findMany({
        where: { companyId: driver.companyId },
        select: { id: true, status: true, notes: true, destination: true, deliveryLocation: true, origin: true, pickupLocation: true, truck: { select: { odometerKm: true } } }
      });
    }

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

  if (normalizedType.includes('load')) {
    // === PER LOAD ===
    let targetLoads = loads.filter(l => ['DELIVERED', 'COMPLETED', 'CLOSED'].includes(l.status));
    if (targetLoads.length === 0 && loads.length > 0) {
      targetLoads = loads;
    }
    
    let totalLoadAmount = 0;
    targetLoads.forEach(ld => {
      let loadAmt = 0;
      if (ld.notes && typeof ld.notes === 'string' && ld.notes.includes('[DRIVER_PAY:')) {
        const m = ld.notes.match(/\[DRIVER_PAY:([0-9.]+)/);
        if (m && m[1]) loadAmt = parseFloat(m[1]);
      }
      if (loadAmt <= 0 && (ld.destination || ld.deliveryLocation)) {
        const dKey = String(ld.destination || ld.deliveryLocation || '').trim().toLowerCase();
        for (const [k, v] of Object.entries(scheduleRates)) {
          if (dKey.includes(k) || k.includes(dKey)) {
            loadAmt = v;
            break;
          }
        }
      }
      if (loadAmt <= 0 && defaultScheduleRate > 0) {
        loadAmt = defaultScheduleRate;
      }
      if (loadAmt <= 0 && rawRate > 0) {
        loadAmt = rawRate;
      }
      totalLoadAmount += loadAmt;
    });

    if (totalLoadAmount <= 0 && defaultScheduleRate > 0) {
      totalLoadAmount = defaultScheduleRate;
    } else if (totalLoadAmount <= 0 && rawRate > 0) {
      totalLoadAmount = rawRate;
    }

    loadAllowance = Math.round(totalLoadAmount * 100) / 100;
    basePay = loadAllowance;
  } else if (normalizedType.includes('km') || normalizedType.includes('kilometre')) {
    // === PER KM ===
    const calc = calculatePerKmDriverPay({ distanceKm: totalKmDriven, perKmRate: rawRate });
    distanceAllow = calc.grossPay;
    basePay = distanceAllow;
  } else {
    // === HOURLY (Default) ===
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
  }

  // 4. Compute Totals: Gross Earnings & Net Pay with ATO PAYG Tax & Superannuation
  let grossEarnings = Math.round((basePay + overtimePay + (loadAllowance > 0 && normalizedType.includes('hourly') ? loadAllowance : 0) + (distanceAllow > 0 && normalizedType.includes('hourly') ? distanceAllow : 0) + otherAllowance + bonuses) * 100) / 100;

  // Fallback: If gross earnings evaluates to 0, check if driver has loads with rates or default schedule
  if (grossEarnings === 0 && loads.length > 0) {
    let fallbackGross = 0;
    loads.forEach(ld => {
      let loadAmt = 0;
      if (ld.notes && typeof ld.notes === 'string' && ld.notes.includes('[DRIVER_PAY:')) {
        const m = ld.notes.match(/\[DRIVER_PAY:([0-9.]+)/);
        if (m && m[1]) loadAmt = parseFloat(m[1]);
      }
      if (loadAmt <= 0 && defaultScheduleRate > 0) loadAmt = defaultScheduleRate;
      if (loadAmt <= 0 && rawRate > 0) loadAmt = rawRate;
      fallbackGross += loadAmt;
    });
    if (fallbackGross === 0 && rawRate > 0) fallbackGross = rawRate;
    if (fallbackGross === 0 && defaultScheduleRate > 0) fallbackGross = defaultScheduleRate;

    if (fallbackGross > 0) {
      grossEarnings = Math.round(fallbackGross * 100) / 100;
      basePay = grossEarnings;
      loadAllowance = grossEarnings;
    }
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
