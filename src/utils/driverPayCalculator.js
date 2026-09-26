/**
 * Driver Pay Calculator Utility
 * Supports 3 separate, testable calculation paths:
 * 1. Hourly: Hours Worked × Hourly Rate
 * 2. Per Kilometer: Actual Load Distance × Driver KM Rate
 * 3. Per Load: Load-specific driver payment based on driver payRate or applicable route rule.
 * 
 * Rates come from configuration/database records with zero hardcoded defaults ($300, $60/hr, etc.).
 */

/**
 * ATO Weekly PAYG Withholding Schedule Calculator
 * Scale 1: Tax-Free Threshold NOT claimed (taxFreeThreshold = false)
 * Scale 2: Tax-Free Threshold CLAIMED (taxFreeThreshold = true)
 * HELP / HECS Debt adjustment if studyLoanDebt = true
 */
function calculateAtoPaygTax({ grossWeeklyPay = 0, taxFreeThreshold = true, studyLoanDebt = false, residencyStatus = 'Australian Resident' }) {
  const gross = Math.max(0, parseFloat(grossWeeklyPay) || 0);
  if (gross <= 0) return 0;

  if (residencyStatus === 'Foreign Resident') {
    return Math.round(gross * 0.325 * 100) / 100;
  }

  if (residencyStatus === 'Working Holiday Maker') {
    if (gross <= 865) return Math.round(gross * 0.15 * 100) / 100;
    return Math.round((865 * 0.15 + (gross - 865) * 0.325) * 100) / 100;
  }

  let tax = 0;
  if (taxFreeThreshold) {
    if (gross <= 359) {
      tax = 0;
    } else if (gross <= 438) {
      tax = (gross - 359) * 0.19;
    } else if (gross <= 848) {
      tax = 15.01 + (gross - 438) * 0.2347;
    } else if (gross <= 1730) {
      tax = 111.23 + (gross - 848) * 0.3477;
    } else if (gross <= 3461) {
      tax = 417.8 + (gross - 1730) * 0.3917;
    } else {
      tax = 1094.67 + (gross - 3461) * 0.47;
    }
  } else {
    if (gross <= 88) {
      tax = gross * 0.19;
    } else if (gross <= 438) {
      tax = 16.72 + (gross - 88) * 0.2347;
    } else if (gross <= 848) {
      tax = 98.83 + (gross - 438) * 0.3477;
    } else if (gross <= 1730) {
      tax = 241.4 + (gross - 848) * 0.3917;
    } else {
      tax = 586.5 + (gross - 1730) * 0.47;
    }
  }

  if (studyLoanDebt && gross > 1000) {
    let helpPct = 0;
    if (gross <= 1200) helpPct = 0.01;
    else if (gross <= 1500) helpPct = 0.02;
    else if (gross <= 2000) helpPct = 0.035;
    else helpPct = 0.05;
    tax += gross * helpPct;
  }

  return Math.round(Math.max(0, tax) * 100) / 100;
}

/**
 * Calculate Hourly Driver Pay (with Overtime Split & Superannuation & ATO PAYG Tax)
 * @param {object} params
 * @param {number} params.hoursWorked
 * @param {number} params.hourlyRate
 * @param {number} [params.ordinaryHoursPerDay=7.6]
 * @param {number} [params.overtimeStartsAfter=7.6]
 * @param {number} [params.overtimeRate]
 * @param {number} [params.overtimeMultiplier=1.5]
 * @param {number} [params.superPercentage=12.0]
 * @param {boolean} [params.taxFreeThreshold=true]
 * @param {boolean} [params.studyLoanDebt=false]
 * @param {string} [params.residencyStatus='Australian Resident']
 * @returns {object}
 */
function calculateHourlyDriverPay({
  hoursWorked = 0,
  hourlyRate = 0,
  ordinaryHoursPerDay = 7.6,
  overtimeStartsAfter = 7.6,
  overtimeRate = null,
  overtimeMultiplier = 1.5,
  superPercentage = 12.0,
  taxFreeThreshold = true,
  studyLoanDebt = false,
  residencyStatus = 'Australian Resident'
}) {
  const totalHours = Math.max(0, parseFloat(hoursWorked) || 0);
  const baseRate = Math.max(0, parseFloat(hourlyRate) || 0);
  const ordLimit = Math.max(0, parseFloat(ordinaryHoursPerDay) || 7.6);
  const otThreshold = Math.max(0, parseFloat(overtimeStartsAfter) || 7.6);

  const ordinaryHours = Math.min(totalHours, otThreshold);
  const overtimeHours = Math.max(0, totalHours - otThreshold);

  let effectiveOtRate = parseFloat(overtimeRate) || 0;
  if (effectiveOtRate <= 0) {
    const mult = parseFloat(overtimeMultiplier) || 1.5;
    effectiveOtRate = baseRate * mult;
  }

  const ordinaryPay = ordinaryHours * baseRate;
  const overtimePay = overtimeHours * effectiveOtRate;
  const grossPay = Math.round((ordinaryPay + overtimePay) * 100) / 100;

  const superRate = parseFloat(superPercentage) || 12.0;
  const superContribution = Math.round((ordinaryPay * (superRate / 100)) * 100) / 100;

  const paygTax = calculateAtoPaygTax({
    grossWeeklyPay: grossPay,
    taxFreeThreshold: taxFreeThreshold !== false,
    studyLoanDebt: studyLoanDebt === true,
    residencyStatus: residencyStatus || 'Australian Resident'
  });

  const netPay = Math.round(Math.max(0, grossPay - paygTax) * 100) / 100;

  return {
    payType: 'Hourly',
    units: totalHours,
    unitLabel: 'Hours',
    rate: baseRate,
    ordinaryHours: Math.round(ordinaryHours * 10) / 10,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    ordinaryPay: Math.round(ordinaryPay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    overtimeRate: effectiveOtRate,
    superPercentage: superRate,
    superContribution,
    paygTax,
    grossPay,
    netPay,
    formattedGross: `$${grossPay.toFixed(2)}`,
    formattedNet: `$${netPay.toFixed(2)}`
  };
}

/**
 * Calculate Per Kilometer Driver Pay
 * @param {object} params
 * @param {number} params.distanceKm
 * @param {number} params.perKmRate
 * @returns {object}
 */
function calculatePerKmDriverPay({ distanceKm = 0, perKmRate = 0 }) {
  const dist = Math.max(0, parseFloat(distanceKm) || 0);
  const rate = Math.max(0, parseFloat(perKmRate) || 0);
  const grossPay = Math.round(dist * rate * 100) / 100;

  return {
    payType: 'Per Kilometer',
    units: dist,
    unitLabel: 'Kilometers',
    rate,
    grossPay,
    formattedGross: `$${grossPay.toFixed(2)}`
  };
}

/**
 * Calculate Per Load Driver Pay with Route/Destination Support (Sydney, Melbourne, QLD, etc.)
 * @param {object} params
 * @param {object} [params.load] - Load object with destination/stops and optional load-specific driverPay
 * @param {number} [params.driverRate] - Driver's configured base pay rate for loads
 * @param {number} [params.ruleRate] - Dynamic route rule rate for load
 * @param {object} [params.driverRouteRates] - Map or object of route-specific driver pay rates e.g. { Sydney: 450, Melbourne: 350, QLD: 550 }
 * @returns {object}
 */
function calculatePerLoadDriverPay({ load = null, driverRate = 0, ruleRate = 0, driverRouteRates = null, driver = null }) {
  let effectiveRate = 0;

  // Priority 1: Explicit load-specific driver pay entered on load object
  if (load && (load.driverPay || load.driverPayment)) {
    const explicitPay = parseFloat(load.driverPay || load.driverPayment);
    if (!isNaN(explicitPay) && explicitPay > 0) {
      effectiveRate = explicitPay;
    }
  }

  // Priority 2: Tagged note format e.g. [DRIVER_PAY:450]
  if (effectiveRate <= 0 && load && load.notes && typeof load.notes === 'string' && load.notes.includes('[DRIVER_PAY:')) {
    const match = load.notes.match(/\[DRIVER_PAY:([0-9.]+)/);
    if (match && match[1]) {
      effectiveRate = parseFloat(match[1]);
    }
  }

  // Priority 3: Driver loadPaySchedule JSON options
  const scheduleSource = driver?.loadPaySchedule || load?.driverLoadPaySchedule;
  if (effectiveRate <= 0 && scheduleSource) {
    try {
      const parsed = typeof scheduleSource === 'string' ? JSON.parse(scheduleSource) : scheduleSource;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const destStr = String(load?.destination || load?.deliveryLocation || '').trim().toLowerCase();
        const origStr = String(load?.origin || load?.pickupLocation || '').trim().toLowerCase();

        let matched = parsed.find(item => {
          if (!item.amount) return false;
          const pLoc = (item.pickupLocation || '').trim().toLowerCase();
          const dLoc = (item.deliveryLocation || '').trim().toLowerCase();
          const pMatch = !pLoc || origStr.includes(pLoc) || pLoc.includes(origStr);
          const dMatch = !dLoc || destStr.includes(dLoc) || dLoc.includes(destStr);
          return pMatch && dMatch;
        });

        if (!matched) {
          matched = parsed.find(item => item.isSelected && parseFloat(item.amount) > 0) || parsed.find(item => parseFloat(item.amount) > 0);
        }

        if (matched && parseFloat(matched.amount) > 0) {
          effectiveRate = parseFloat(matched.amount);
        }
      }
    } catch (e) {}
  }

  // Priority 4: Destination-specific route rate for driver (Sydney, Melbourne, Queensland)
  if (effectiveRate <= 0 && load) {
    const destStr = String(load.destination || load.to || load.deliveryAddress || '').toLowerCase();
    const origStr = String(load.origin || load.from || load.pickupAddress || '').toLowerCase();
    const fullRouteStr = `${origStr} ${destStr}`;

    const routeRatesMap = driverRouteRates || (load.driverRouteRates ? load.driverRouteRates : null);

    if (routeRatesMap && typeof routeRatesMap === 'object') {
      for (const [routeKey, rVal] of Object.entries(routeRatesMap)) {
        if (routeKey && rVal && parseFloat(rVal) > 0) {
          if (destStr && destStr.includes(routeKey.toLowerCase())) {
            effectiveRate = parseFloat(rVal);
            break;
          }
        }
      }

      if (effectiveRate <= 0) {
        for (const [routeKey, rVal] of Object.entries(routeRatesMap)) {
          if (routeKey && rVal && parseFloat(rVal) > 0) {
            if (fullRouteStr.includes(routeKey.toLowerCase())) {
              effectiveRate = parseFloat(rVal);
              break;
            }
          }
        }
      }
    }
  }

  // Priority 5: Route Rule Rate passed from load route pricing
  if (effectiveRate <= 0 && parseFloat(ruleRate) > 0) {
    effectiveRate = parseFloat(ruleRate);
  }

  // Priority 6: Driver's default base per-load pay rate
  if (effectiveRate <= 0 && parseFloat(driverRate) > 0) {
    effectiveRate = parseFloat(driverRate);
  }

  const grossPay = Math.round(effectiveRate * 100) / 100;

  return {
    payType: 'Per Load',
    units: 1,
    unitLabel: 'Load',
    rate: grossPay,
    grossPay,
    formattedGross: `$${grossPay.toFixed(2)}`
  };
}

/**
 * Master Driver Payment Calculator for a given Load and Driver
 * @param {object} params
 * @param {object} params.driver - Driver DB record
 * @param {object} [params.load] - Load DB record
 * @param {number} [params.distanceKm] - Load distance in km
 * @param {number} [params.hoursWorked] - Hours worked on load
 * @param {number} [params.routeRuleRate] - Applicable route pricing rule for load
 * @returns {object} Full earnings & tax breakdown
 */
function calculateDriverPayForLoad({ driver, load = null, distanceKm = 0, hoursWorked = 0, routeRuleRate = 0 }) {
  if (!driver) {
    return {
      payType: 'Unknown',
      grossPay: 0,
      paygTax: 0,
      superContribution: 0,
      netPay: 0,
      formattedGross: '$0.00'
    };
  }

  const rawPayType = String(driver.payType || 'Hourly').trim().toLowerCase();
  const driverRate = parseFloat(driver.payRate) || 0;

  let result;

  if (rawPayType.includes('km') || rawPayType.includes('kilomet')) {
    // Distance calculation path
    let dist = parseFloat(distanceKm) || 0;
    if (dist <= 0 && load) {
      dist = parseFloat(load.totalDistance || load.distance) || 0;
    }
    result = calculatePerKmDriverPay({ distanceKm: dist, perKmRate: driverRate });
  } else if (rawPayType.includes('load')) {
    // Per load calculation path
    let driverRouteRates = driver.routePayRates || driver.preferredRoutes || (load && load.driverRouteRates ? load.driverRouteRates : null);
    if (typeof driverRouteRates === 'string') {
      try { driverRouteRates = JSON.parse(driverRouteRates); } catch (e) { driverRouteRates = null; }
    }
    result = calculatePerLoadDriverPay({ load, driverRate, ruleRate: routeRuleRate, driverRouteRates, driver });
  } else {
    // Hourly calculation path (default)
    let hrs = parseFloat(hoursWorked) || 0;
    if (hrs <= 0 && load && load.estimatedHours) {
      hrs = parseFloat(load.estimatedHours) || 0;
    }
    result = calculateHourlyDriverPay({
      hoursWorked: hrs,
      hourlyRate: driverRate,
      ordinaryHoursPerDay: driver.ordinaryHoursPerDay,
      overtimeStartsAfter: driver.overtimeStartsAfter,
      overtimeRate: driver.overtimeRate,
      overtimeMultiplier: driver.overtimeMultiplier,
      superPercentage: driver.superPercentage
    });
  }

  const grossPay = result.grossPay || 0;
  const paygTax = result.paygTax || 0;
  const superContribution = result.superContribution || 0;
  const totalDeductions = paygTax;
  const netPay = result.netPay !== undefined ? result.netPay : Math.max(0, grossPay - paygTax);

  return {
    ...result,
    paygTax,
    superContribution,
    totalDeductions,
    netPay,
    formatted: {
      grossPay: `$${grossPay.toFixed(2)}`,
      paygTax: `$${paygTax.toFixed(2)}`,
      superContribution: `$${superContribution.toFixed(2)}`,
      totalDeductions: `$${totalDeductions.toFixed(2)}`,
      netPay: `$${netPay.toFixed(2)}`
    }
  };
}

module.exports = {
  calculateAtoPaygTax,
  calculateHourlyDriverPay,
  calculatePerKmDriverPay,
  calculatePerLoadDriverPay,
  calculateDriverPayForLoad
};
