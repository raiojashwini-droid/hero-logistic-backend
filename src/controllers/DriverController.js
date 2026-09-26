const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const { resolveCompanyId } = require('../middlewares/tenantResolver');

// Get all Drivers with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const companyId = resolveCompanyId(req);
    
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendList(res, [], buildPaginationMeta(0, currentPage, pageSize, req.query.sort));
      }
      where.companyId = companyId;
    } else if (req.query.companyId) {
      where.companyId = req.query.companyId;
    }

    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      where.branchId = req.user.branchId;
    }

    const [data, total] = await Promise.all([
      prisma.driver.findMany({
        where, skip, take, orderBy,
        include: {
          branch: true,
          manager: true,
          currentVehicle: true,
          loads: { take: 5, orderBy: { createdAt: 'desc' } }
        }
      }),
      prisma.driver.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Get single Driver by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Driver not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }
    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      where.branchId = req.user.branchId;
    }

    const data = await prisma.driver.findFirst({
      where,
      include: {
        branch: true,
        manager: true,
        currentVehicle: true,
        loads: true,
        preStartChecklists: { take: 5, orderBy: { createdAt: 'desc' } },
        timesheets: { take: 5, orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Driver not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Helper to sanitize avatar URL.
// IMPORTANT: We do NOT save to disk (Railway filesystem is ephemeral —
// files are wiped on every redeploy causing 404s). Instead, base64 images
// are returned as-is (data: URLs) and stored directly in the database.
// The frontend renders <img src="data:image/..." /> natively without any file serving.
const cleanAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Reject obviously broken/truncated URLs or stock placeholders
  if (trimmed.includes('...') || trimmed.endsWith('..') || trimmed.includes('pravatar') || trimmed.includes('unsplash')) return null;

  // If it's a base64 data URL — store it directly in DB if safe size
  if (trimmed.startsWith('data:image/')) {
    const matches = trimmed.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      if (trimmed.length > 300000) {
        return null;
      }
      return trimmed;
    }
    return null;
  }

  if (trimmed.length > 2000) return null;

  return trimmed;
};

exports.cleanAvatarUrl = cleanAvatarUrl;


// Create new Driver
exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    let effectiveCompanyId = req.tenantId || req.user?.companyId || (req.user?.role === 'SUPER_ADMIN' ? payload.companyId : null);
    if (!effectiveCompanyId) {
      let defaultComp = await prisma.company.findFirst().catch(() => null);
      if (!defaultComp) {
        defaultComp = await prisma.company.create({
          data: {
            name: 'Hero Logistics Pty Ltd',
            tenantId: 'HERO-DEMO-01'
          }
        }).catch(() => null);
      }
      if (defaultComp) {
        effectiveCompanyId = defaultComp.id;
        if (req.user?.id && !req.user.companyId) {
          await prisma.user.update({
            where: { id: req.user.id },
            data: { companyId: defaultComp.id }
          }).catch(() => null);
        }
      }
    }
    if (!effectiveCompanyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
    }
    payload.companyId = effectiveCompanyId;
    let branchIdVal = payload.branchId || null;
    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      branchIdVal = req.user.branchId;
    } else if (!branchIdVal && (payload.branch || payload.Branch)) {
      const bName = String(payload.branch || payload.Branch).trim();
      if (bName && bName !== '—') {
        const foundBranch = await prisma.branch.findFirst({
          where: { name: { equals: bName }, companyId: effectiveCompanyId }
        }).catch(() => null);
        if (foundBranch) {
          branchIdVal = foundBranch.id;
        } else {
          const createdBranch = await prisma.branch.create({
            data: { name: bName, companyId: effectiveCompanyId }
          }).catch(() => null);
          if (createdBranch) branchIdVal = createdBranch.id;
        }
      }
    }

    let validStatus = 'AVAILABLE';
    if (payload.status || payload.DriverStatus) {
      const s = String(payload.status || payload.DriverStatus).toUpperCase().replace(/\s+/g, '_');
      if (['ON_DUTY', 'OFF_DUTY', 'ON_LEAVE', 'UNAVAILABLE', 'AVAILABLE'].includes(s)) {
        validStatus = s;
      }
    }

    const rawAvatar = payload.avatarUrl || payload.photoPreview || payload.avatar || null;

    let inputEmail = (payload.email || payload.EmailAddress || payload.Username || payload.username || '').trim() || null;
    let inputCode = (payload.driverCode || payload.EmployeeIDManualEditOption || '').trim() || null;

    if (inputCode) {
      const existingCode = await prisma.driver.findFirst({ where: { driverCode: inputCode } });
      if (existingCode) {
        inputCode = `${inputCode}_${Math.floor(100 + Math.random() * 900)}`;
      }
    } else {
      inputCode = null;
    }

    const lType = payload.licenceType || payload.licenseType || payload.LicenceType || null;
    const lNum = payload.licenceNumber || payload.licenseNumber || payload.LicenceNumber || null;
    const lState = payload.licenseState || payload.licenceState || payload.LicenceState || null;
    const lClass = payload.licenseClass || payload.licenceClass || payload.LicenceClass || null;

    let issueDateObj = null;
    if (payload.licenseIssueDate || payload.IssueDate) {
      const d = new Date(payload.licenseIssueDate || payload.IssueDate);
      if (!isNaN(d.getTime())) issueDateObj = d;
    }

    let expiryDateObj = null;
    if (payload.licenseExpiry || payload.ExpiryDate) {
      const d = new Date(payload.licenseExpiry || payload.ExpiryDate);
      if (!isNaN(d.getTime())) expiryDateObj = d;
    }

    const emergencyName = payload.EmergencyContactName || payload.emergencyContactName || '';
    const emergencyNum = payload.EmergencyContactNumber || payload.emergencyContactPhone || '';
    const emergencyCombined = payload.emergencyContact || (emergencyName ? `${emergencyName} ${emergencyNum}`.trim() : emergencyNum) || null;

    const driverData = {
      firstName: payload.firstName || payload.FirstName || null,
      lastName: payload.lastName || payload.LastName || null,
      phone: payload.phone || payload.PhoneNumber || null,
      email: inputEmail,
      avatarUrl: cleanAvatarUrl(rawAvatar),
      driverCode: inputCode,
      licenseType: lType,
      licenseNumber: lNum,
      licenseState: lState,
      licenseClass: lClass,
      licenseIssueDate: issueDateObj,
      licenseExpiry: expiryDateObj,
      gender: payload.gender || payload.Gender || null,
      nationality: payload.nationality || payload.Nationality || null,
      emergencyContact: emergencyCombined,
      status: validStatus,
      role: payload.role || payload.driverRole || 'Driver',
      category: payload.category || payload.driverCategory || null,
      shift: payload.shift || null,
      notes: payload.notes || null,
      address: payload.address || payload.ResidentialAddress || payload.StreetAddress || null,
      city: payload.city || payload.City || null,
      state: payload.state || payload.State || null,
      postalCode: payload.postalCode || payload.PostalCode || null,
      companyId: effectiveCompanyId,
      branchId: branchIdVal,
      // 5. Payroll Information
      payType: payload.payType || payload.PayType || 'Hourly',
      payRate: (payload.payRate || payload.PayRate) ? parseFloat(payload.payRate || payload.PayRate) : null,
      ordinaryHoursPerDay: payload.ordinaryHoursPerDay ? parseFloat(payload.ordinaryHoursPerDay) : 7.6,
      overtimeStartsAfter: payload.overtimeStartsAfter ? parseFloat(payload.overtimeStartsAfter) : 7.6,
      overtimeRate: payload.overtimeRate ? parseFloat(payload.overtimeRate) : null,
      overtimeMultiplier: payload.overtimeMultiplier ? parseFloat(payload.overtimeMultiplier) : 1.5,
      defaultBreakMinutes: payload.defaultBreakMinutes ? parseInt(payload.defaultBreakMinutes, 10) : 30,
      tfnStatus: payload.tfnStatus || payload.TFNStatus || 'Provided',
      taxFreeThreshold: payload.taxFreeThreshold !== undefined ? (payload.taxFreeThreshold === true || payload.taxFreeThreshold === 'Yes' || payload.taxFreeThreshold === 'true') : true,
      studyLoanDebt: payload.studyLoanDebt !== undefined ? (payload.studyLoanDebt === true || payload.studyLoanDebt === 'Yes' || payload.studyLoanDebt === 'true') : false,
      taxDeclReceived: payload.taxDeclReceived !== undefined ? (payload.taxDeclReceived === true || payload.taxDeclReceived === 'Yes' || payload.taxDeclReceived === 'true') : true,
      residencyStatus: payload.residencyStatus || 'Australian Resident',
      paygCalcMethod: payload.paygCalcMethod || 'ATO Scale',
      superPercentage: payload.superPercentage ? parseFloat(payload.superPercentage) : 12.0,
      effectiveFrom: payload.effectiveFrom ? new Date(payload.effectiveFrom) : null,
      effectiveTo: payload.effectiveTo ? new Date(payload.effectiveTo) : null,
      loadPaySchedule: typeof payload.loadPaySchedule === 'object' ? JSON.stringify(payload.loadPaySchedule) : (payload.loadPaySchedule || null),
      bankName: payload.bankName || payload.BankName || null,
      accountNumber: payload.accountNumber || payload.AccountNumber || null,
      routingNumber: payload.routingNumber || payload.BSBRouting || payload.bsbNumber || null,
      taxNumber: payload.taxNumber || payload.TaxNumber || null,
      superFund: payload.superFund || payload.SuperannuationFund || null
    };

    if (payload.dob || payload.DateofBirth) {
      const d = new Date(payload.dob || payload.DateofBirth);
      if (!isNaN(d.getTime())) {
        driverData.dob = d;
        driverData.joiningDate = d;
      }
    } else if (payload.age || payload.Age) {
      const ageNum = parseInt(payload.age || payload.Age, 10);
      if (!isNaN(ageNum) && ageNum > 0 && ageNum < 120) {
        const estimatedYear = new Date().getFullYear() - ageNum;
        driverData.dob = new Date(estimatedYear, 0, 1);
      }
    }

    if (payload.employmentType || payload.EmploymentType) {
      const e = String(payload.employmentType || payload.EmploymentType).toUpperCase().replace(/\s+/g, '_');
      if (['FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACTOR'].includes(e)) {
        driverData.employmentType = e;
      }
    }

    if (driverData.email) {
      try {
        const bcrypt = require('bcryptjs');
        const cleanDrvEmail = driverData.email.toLowerCase().trim();
        let linkedUser = await prisma.user.findFirst({ where: { email: cleanDrvEmail } });
        if (!linkedUser) {
          const rawPass = payload.password || payload.Password || '123456';
          const passHash = await bcrypt.hash(rawPass, 10);
          linkedUser = await prisma.user.create({
            data: {
              email: cleanDrvEmail,
              name: `${driverData.firstName || ''} ${driverData.lastName || ''}`.trim() || 'Driver',
              password: passHash,
              role: 'DRIVER',
              status: 'ACTIVE',
              companyId: driverData.companyId || null,
              branchId: driverData.branchId || null
            }
          });
        }
        if (linkedUser) {
          driverData.userId = linkedUser.id;
        }
      } catch (uErr) {
        console.warn('Could not auto-create user during driver creation:', uErr.message);
      }
    }

    try {
      const data = await prisma.driver.create({
        data: driverData,
        include: {
          branch: true,
          manager: true
        }
      });
      return sendSuccess(res, data, HTTP_STATUS.CREATED);
    } catch (createErr) {
      if (createErr.code === 'P2002') {
        driverData.email = `driver_${Date.now()}@herologistics.com.au`;
        if (driverData.driverCode) {
          driverData.driverCode = `${driverData.driverCode}_${Date.now()}`;
        }
        const data = await prisma.driver.create({
          data: driverData,
          include: { branch: true, manager: true }
        });
        return sendSuccess(res, data, HTTP_STATUS.CREATED);
      }
      throw createErr;
    }
  } catch (error) {
    next(error);
  }
};

const sanitizeDriverPayload = async (rawPayload, companyId) => {
  const data = {};

  if (rawPayload.firstName !== undefined || rawPayload.FirstName !== undefined) {
    data.firstName = rawPayload.firstName || rawPayload.FirstName || null;
  }
  if (rawPayload.lastName !== undefined || rawPayload.LastName !== undefined) {
    data.lastName = rawPayload.lastName || rawPayload.LastName || null;
  }
  if (rawPayload.driverCode !== undefined || rawPayload.EmployeeIDManualEditOption !== undefined) {
    const codeVal = (rawPayload.driverCode !== undefined ? rawPayload.driverCode : (rawPayload.EmployeeIDManualEditOption || '')).trim();
    data.driverCode = codeVal ? codeVal : null;
  }
  if (rawPayload.avatarUrl !== undefined || rawPayload.avatar !== undefined || rawPayload.photoPreview !== undefined) {
    const rawAv = rawPayload.avatarUrl || rawPayload.avatar || rawPayload.photoPreview || null;
    data.avatarUrl = cleanAvatarUrl(rawAv);
  }
  if (rawPayload.phone !== undefined || rawPayload.PhoneNumber !== undefined) {
    data.phone = rawPayload.phone || rawPayload.PhoneNumber || null;
  }
  if (rawPayload.email !== undefined || rawPayload.EmailAddress !== undefined || rawPayload.Username !== undefined || rawPayload.username !== undefined) {
    const em = (rawPayload.email || rawPayload.EmailAddress || rawPayload.Username || rawPayload.username || '').trim();
    data.email = em ? em : null;
  }

  if (rawPayload.gender !== undefined || rawPayload.Gender !== undefined) data.gender = rawPayload.gender || rawPayload.Gender || null;
  if (rawPayload.nationality !== undefined || rawPayload.Nationality !== undefined) data.nationality = rawPayload.nationality || rawPayload.Nationality || null;
  if (rawPayload.emergencyContact !== undefined || rawPayload.EmergencyContactName !== undefined) {
    const name = rawPayload.EmergencyContactName || '';
    const num = rawPayload.EmergencyContactNumber || '';
    data.emergencyContact = rawPayload.emergencyContact || `${name} ${num}`.trim() || null;
  }
  if (rawPayload.address !== undefined || rawPayload.ResidentialAddress !== undefined) {
    data.address = rawPayload.address || rawPayload.ResidentialAddress || null;
  }
  if (rawPayload.city !== undefined || rawPayload.City !== undefined) data.city = rawPayload.city || rawPayload.City || null;
  if (rawPayload.state !== undefined || rawPayload.State !== undefined) data.state = rawPayload.state || rawPayload.State || null;
  if (rawPayload.postalCode !== undefined || rawPayload.PostalCode !== undefined) data.postalCode = rawPayload.postalCode || rawPayload.PostalCode || null;

  const lType = rawPayload.licenseType || rawPayload.licenceType || rawPayload.LicenceType;
  if (lType !== undefined) data.licenseType = lType;

  const lNum = rawPayload.licenseNumber || rawPayload.licenceNumber || rawPayload.LicenceNumber;
  if (lNum !== undefined) data.licenseNumber = lNum;

  const lState = rawPayload.licenseState || rawPayload.licenceState || rawPayload.LicenceState;
  if (lState !== undefined) data.licenseState = lState;

  const lClass = rawPayload.licenseClass || rawPayload.licenceClass || rawPayload.LicenceClass;
  if (lClass !== undefined) data.licenseClass = lClass;

  if (rawPayload.licenseIssueDate || rawPayload.IssueDate) {
    const d = new Date(rawPayload.licenseIssueDate || rawPayload.IssueDate);
    if (!isNaN(d.getTime())) data.licenseIssueDate = d;
  }

  if (rawPayload.licenseExpiry || rawPayload.ExpiryDate) {
    const d = new Date(rawPayload.licenseExpiry || rawPayload.ExpiryDate);
    if (!isNaN(d.getTime())) data.licenseExpiry = d;
  }

  if (rawPayload.status) {
    const s = String(rawPayload.status).toUpperCase().replace(/\s+/g, '_');
    if (['ON_DUTY', 'OFF_DUTY', 'ON_LEAVE', 'UNAVAILABLE', 'AVAILABLE'].includes(s)) {
      data.status = s;
    }
  }

  if (rawPayload.employmentType !== undefined || rawPayload.EmploymentType !== undefined) {
    const rawE = String(rawPayload.employmentType !== undefined ? rawPayload.employmentType : (rawPayload.EmploymentType || '')).trim();
    if (!rawE) {
      data.employmentType = null;
    } else {
      const e = rawE.toUpperCase().replace(/\s+/g, '_');
      if (['FULL_TIME', 'PART_TIME', 'CASUAL', 'CONTRACTOR'].includes(e)) {
        data.employmentType = e;
      } else {
        data.employmentType = null;
      }
    }
  }

  if (rawPayload.role !== undefined || rawPayload.DriverRole !== undefined) data.role = rawPayload.role || rawPayload.DriverRole || null;
  if (rawPayload.category !== undefined || rawPayload.DriverCategory !== undefined) data.category = rawPayload.category || rawPayload.DriverCategory || null;
  if (rawPayload.shift !== undefined || rawPayload.Shift !== undefined) data.shift = rawPayload.shift || rawPayload.Shift || null;
  if (rawPayload.notes !== undefined) data.notes = rawPayload.notes;

  if (rawPayload.payType !== undefined || rawPayload.PayType !== undefined) {
    data.payType = rawPayload.payType || rawPayload.PayType || null;
  }
  if (rawPayload.payRate !== undefined || rawPayload.PayRate !== undefined) {
    const pr = rawPayload.payRate !== undefined ? rawPayload.payRate : rawPayload.PayRate;
    data.payRate = pr !== null && pr !== '' ? parseFloat(pr) : null;
  }
  if (rawPayload.ordinaryHoursPerDay !== undefined) data.ordinaryHoursPerDay = parseFloat(rawPayload.ordinaryHoursPerDay) || 7.6;
  if (rawPayload.overtimeStartsAfter !== undefined) data.overtimeStartsAfter = parseFloat(rawPayload.overtimeStartsAfter) || 7.6;
  if (rawPayload.overtimeRate !== undefined) data.overtimeRate = rawPayload.overtimeRate !== null && rawPayload.overtimeRate !== '' ? parseFloat(rawPayload.overtimeRate) : null;
  if (rawPayload.overtimeMultiplier !== undefined) data.overtimeMultiplier = parseFloat(rawPayload.overtimeMultiplier) || 1.5;
  if (rawPayload.defaultBreakMinutes !== undefined) data.defaultBreakMinutes = parseInt(rawPayload.defaultBreakMinutes, 10) || 30;
  if (rawPayload.tfnStatus !== undefined || rawPayload.TFNStatus !== undefined) data.tfnStatus = rawPayload.tfnStatus || rawPayload.TFNStatus || 'Provided';
  if (rawPayload.taxFreeThreshold !== undefined) data.taxFreeThreshold = rawPayload.taxFreeThreshold === true || rawPayload.taxFreeThreshold === 'Yes' || rawPayload.taxFreeThreshold === 'true';
  if (rawPayload.studyLoanDebt !== undefined) data.studyLoanDebt = rawPayload.studyLoanDebt === true || rawPayload.studyLoanDebt === 'Yes' || rawPayload.studyLoanDebt === 'true';
  if (rawPayload.taxDeclReceived !== undefined) data.taxDeclReceived = rawPayload.taxDeclReceived === true || rawPayload.taxDeclReceived === 'Yes' || rawPayload.taxDeclReceived === 'true';
  if (rawPayload.residencyStatus !== undefined) data.residencyStatus = rawPayload.residencyStatus || 'Australian Resident';
  if (rawPayload.paygCalcMethod !== undefined) data.paygCalcMethod = rawPayload.paygCalcMethod || 'ATO Scale';
  if (rawPayload.superPercentage !== undefined) data.superPercentage = parseFloat(rawPayload.superPercentage) || 12.0;
  if (rawPayload.effectiveFrom !== undefined) data.effectiveFrom = rawPayload.effectiveFrom ? new Date(rawPayload.effectiveFrom) : null;
  if (rawPayload.effectiveTo !== undefined) data.effectiveTo = rawPayload.effectiveTo ? new Date(rawPayload.effectiveTo) : null;
  if (rawPayload.loadPaySchedule !== undefined) {
    data.loadPaySchedule = typeof rawPayload.loadPaySchedule === 'object' ? JSON.stringify(rawPayload.loadPaySchedule) : (rawPayload.loadPaySchedule || null);
  }
  if (rawPayload.bankName !== undefined || rawPayload.BankName !== undefined) {
    data.bankName = rawPayload.bankName || rawPayload.BankName || null;
  }
  if (rawPayload.accountNumber !== undefined || rawPayload.AccountNumber !== undefined) {
    data.accountNumber = rawPayload.accountNumber || rawPayload.AccountNumber || null;
  }
  if (rawPayload.routingNumber !== undefined || rawPayload.BSBRouting !== undefined || rawPayload.bsbNumber !== undefined) {
    data.routingNumber = rawPayload.routingNumber || rawPayload.BSBRouting || rawPayload.bsbNumber || null;
  }
  if (rawPayload.taxNumber !== undefined || rawPayload.TaxNumber !== undefined) {
    data.taxNumber = rawPayload.taxNumber || rawPayload.TaxNumber || null;
  }
  if (rawPayload.superFund !== undefined || rawPayload.SuperannuationFund !== undefined) {
    data.superFund = rawPayload.superFund || rawPayload.SuperannuationFund || null;
  }
  
  if (rawPayload.branchId !== undefined) {
    data.branchId = rawPayload.branchId;
  } else if (rawPayload.branch || rawPayload.Branch) {
    const bName = String(rawPayload.branch || rawPayload.Branch).trim();
    if (bName && bName !== '—') {
      const foundBranch = await prisma.branch.findFirst({
        where: { name: { equals: bName }, companyId }
      }).catch(() => null);
      if (foundBranch) {
        data.branchId = foundBranch.id;
      } else {
        const createdBranch = await prisma.branch.create({
          data: { name: bName, companyId }
        }).catch(() => null);
        if (createdBranch) data.branchId = createdBranch.id;
      }
    }
  }

  if (rawPayload.payType !== undefined || rawPayload.PayType !== undefined) data.payType = rawPayload.payType || rawPayload.PayType || null;
  if (rawPayload.payRate !== undefined || rawPayload.PayRate !== undefined) {
    const pr = parseFloat(rawPayload.payRate || rawPayload.PayRate);
    data.payRate = !isNaN(pr) ? pr : null;
  }
  if (rawPayload.bankName !== undefined || rawPayload.BankName !== undefined) data.bankName = rawPayload.bankName || rawPayload.BankName || null;
  if (rawPayload.accountNumber !== undefined || rawPayload.AccountNumber !== undefined) data.accountNumber = rawPayload.accountNumber || rawPayload.AccountNumber || null;
  if (rawPayload.routingNumber !== undefined || rawPayload.BSBRouting !== undefined) data.routingNumber = rawPayload.routingNumber || rawPayload.BSBRouting || null;
  if (rawPayload.taxNumber !== undefined || rawPayload.TaxNumber !== undefined) data.taxNumber = rawPayload.taxNumber || rawPayload.TaxNumber || null;
  if (rawPayload.superFund !== undefined || rawPayload.SuperannuationFund !== undefined) data.superFund = rawPayload.superFund || rawPayload.SuperannuationFund || null;

  if (rawPayload.preferredVehicle !== undefined || rawPayload.PreferredVehicle !== undefined) data.preferredVehicle = rawPayload.preferredVehicle || rawPayload.PreferredVehicle || null;
  if (rawPayload.preferredRoutes !== undefined || rawPayload.PreferredRoutes !== undefined) data.preferredRoutes = rawPayload.preferredRoutes || rawPayload.PreferredRoutes || null;
  if (rawPayload.preferredRegions !== undefined || rawPayload.PreferredRegions !== undefined) data.preferredRegions = rawPayload.preferredRegions || rawPayload.PreferredRegions || null;
  if (rawPayload.maxDistPerTripKm !== undefined || rawPayload.MaximumDistancePerTripKM !== undefined) {
    const md = parseInt(rawPayload.maxDistPerTripKm || rawPayload.MaximumDistancePerTripKM, 10);
    data.maxDistPerTripKm = !isNaN(md) ? md : null;
  }
  if (rawPayload.dgCertified !== undefined || rawPayload.DangerousGoodsCertified !== undefined) {
    data.dgCertified = rawPayload.dgCertified === true || rawPayload.DangerousGoodsCertified === 'Yes';
  }
  if (rawPayload.hvCertified !== undefined || rawPayload.HeavyVehicleCertified !== undefined) {
    data.hvCertified = rawPayload.hvCertified === true || rawPayload.HeavyVehicleCertified === 'Yes';
  }

  const manualAge = rawPayload.age || rawPayload.Age;
  const rawDobStr = rawPayload.dob || rawPayload.DateofBirth;
  let parsedDob = rawDobStr ? new Date(rawDobStr) : null;
  const isInvalidOrFuture = !parsedDob || isNaN(parsedDob.getTime()) || parsedDob.getFullYear() >= new Date().getFullYear();

  if (manualAge && isInvalidOrFuture) {
    const ageNum = parseInt(manualAge, 10);
    if (!isNaN(ageNum) && ageNum > 0 && ageNum < 120) {
      const estimatedYear = new Date().getFullYear() - ageNum;
      data.dob = new Date(estimatedYear, 0, 1);
    }
  } else if (parsedDob && !isNaN(parsedDob.getTime())) {
    data.dob = parsedDob;
  }

  return data;
};

// Update Driver with Optimistic Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawLoadPaySchedule = req.body.loadPaySchedule; // capture before sanitize
    const updateData = await sanitizeDriverPayload(req.body, req.tenantId);

    if (req.tenantId) {
      const findWhere = { id, companyId: req.tenantId };
      if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
        findWhere.branchId = req.user.branchId;
      }
      const existing = await prisma.driver.findFirst({
        where: findWhere
      });
      if (!existing) {
        const driverExists = await prisma.driver.findUnique({ where: { id } });
        if (!driverExists) {
          return sendError(res, {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Driver not found'
          }, HTTP_STATUS.NOT_FOUND);
        }
      }
    }

    // Check existing driver for user linking
    const existingDriver = await prisma.driver.findUnique({ where: { id } });

    // Sync linked user email if email changed
    if (updateData.email && existingDriver?.email && updateData.email.toLowerCase().trim() !== existingDriver.email.toLowerCase().trim()) {
      try {
        await prisma.user.updateMany({
          where: { email: existingDriver.email.toLowerCase().trim() },
          data: { email: updateData.email.toLowerCase().trim() }
        });
      } catch (uErr) {
        console.warn('Could not sync user email on driver update:', uErr.message);
      }
    }

    // Sync password if reset password was provided
    const rawPassword = req.body.Password || req.body.password || req.body.ResetPassword || req.body.resetPassword;
    if (rawPassword && typeof rawPassword === 'string' && rawPassword.trim().length > 0) {
      try {
        const bcrypt = require('bcryptjs');
        const passHash = await bcrypt.hash(rawPassword.trim(), 10);
        const targetEmail = (updateData.email || existingDriver?.email || '').toLowerCase().trim();
        if (targetEmail) {
          await prisma.user.updateMany({
            where: { email: targetEmail },
            data: { password: passHash }
          });
        }
      } catch (pErr) {
        console.warn('Could not sync user password on driver update:', pErr.message);
      }
    }

    // Check for duplicate driverCode and email before updating
    if (updateData.driverCode) {
      const duplicateCode = await prisma.driver.findFirst({
        where: { driverCode: updateData.driverCode, NOT: { id } }
      });
      if (duplicateCode) {
        delete updateData.driverCode;
      }
    }

    if (updateData.email) {
      const duplicateEmail = await prisma.driver.findFirst({
        where: { email: updateData.email, NOT: { id } }
      });
      if (duplicateEmail) {
        delete updateData.email;
      }
    }
    
    const where = { id };

    // Check version if optimistic concurrency is required
    const ifMatch = req.headers['if-match'];
    if (ifMatch) {
      where.version = parseInt(ifMatch.replace(/"/g, ''), 10);
    }

    // Resolve branch name string to branchId if branchId not explicitly provided
    if (!updateData.branchId && (req.body.branch || req.body.Branch)) {
      const bName = String(req.body.branch || req.body.Branch).trim();
      if (bName && bName !== '—') {
        const effCompanyId = req.tenantId || req.user?.companyId;
        let foundBranch = await prisma.branch.findFirst({
          where: { name: { equals: bName }, companyId: effCompanyId }
        }).catch(() => null);
        if (!foundBranch) {
          foundBranch = await prisma.branch.create({
            data: { name: bName, companyId: effCompanyId }
          }).catch(() => null);
        }
        if (foundBranch) updateData.branchId = foundBranch.id;
      }
    }

    let data;
    try {
      data = await prisma.driver.update({
        where,
        data: updateData,
        include: {
          branch: true,
          manager: true
        }
      });
    } catch (e) {
      if (e.code === 'P2002') {
        // Fallback retry without conflicting unique fields
        delete updateData.driverCode;
        delete updateData.email;
        try {
          const fallbackData = await prisma.driver.update({
            where,
            data: updateData
          });
          data = fallbackData;
        } catch (retryErr) {
          const target = Array.isArray(e.meta?.target) ? e.meta.target.join(', ') : (e.meta?.target || 'field');
          return sendError(res, {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `A driver with this ${target} already exists.`
          }, HTTP_STATUS.BAD_REQUEST);
        }
      } else if (e.code === 'P2025') {
        if (ifMatch) {
          return sendError(res, {
            code: ERROR_CODES.RESOURCE_CONFLICT,
            message: 'Resource was updated by another user or does not exist.'
          }, HTTP_STATUS.CONFLICT);
        }
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Driver not found'
        }, HTTP_STATUS.NOT_FOUND);
      } else {
        throw e;
      }
    }

    // === PayPeriod Sync: When loadPaySchedule changes, recalculate driver PayPeriod ===
    if (rawLoadPaySchedule !== undefined && data) {
      try {
        let scheduleArr = [];
        try {
          scheduleArr = typeof rawLoadPaySchedule === 'string'
            ? JSON.parse(rawLoadPaySchedule)
            : (Array.isArray(rawLoadPaySchedule) ? rawLoadPaySchedule : []);
        } catch (e) {}

        // Find the selected/active route amount
        let newScheduleAmount = 0;
        if (Array.isArray(scheduleArr) && scheduleArr.length > 0) {
          const selectedRoute = scheduleArr.find(r => r.isSelected) || scheduleArr[0];
          if (selectedRoute && selectedRoute.amount) {
            newScheduleAmount = parseFloat(selectedRoute.amount) || 0;
          }
        }

        if (newScheduleAmount > 0) {
          // Find any delivered loads for this driver to check if payroll sync is needed
          const deliveredLoads = await prisma.load.findMany({
            where: { driverId: id, status: { in: ['DELIVERED', 'COMPLETED', 'CLOSED'] } },
            select: { id: true, notes: true }
          }).catch(() => []);

          if (deliveredLoads.length > 0) {
            // Calculate total pay from all delivered loads using new schedule amount
            let totalNewPay = 0;
            deliveredLoads.forEach(ld => {
              let loadAmt = 0;
              // If load has explicit DRIVER_PAY tag, use that (admin override)
              if (ld.notes && ld.notes.includes('[DRIVER_PAY:')) {
                const m = ld.notes.match(/\[DRIVER_PAY:([0-9.]+)/);
                if (m && m[1]) loadAmt = parseFloat(m[1]);
              }
              // Otherwise use the new schedule amount per load
              if (loadAmt <= 0) loadAmt = newScheduleAmount;
              totalNewPay += loadAmt;
            });

            totalNewPay = Math.round(totalNewPay * 100) / 100;

            // Update or create PayPeriod with new total
            const existingPayPeriod = await prisma.payPeriod.findFirst({
              where: { driverId: id, status: { in: ['DRAFT', 'PROCESSING', 'PENDING', 'APPROVED'] } },
              orderBy: { createdAt: 'desc' }
            }).catch(() => null);

            if (existingPayPeriod) {
              await prisma.payPeriod.update({
                where: { id: existingPayPeriod.id },
                data: {
                  loadAllowance: totalNewPay,
                  grossEarnings: totalNewPay,
                  netPay: totalNewPay
                }
              }).catch(e => console.warn('PayPeriod sync on schedule update:', e?.message));

              console.log(`[DriverUpdate] PayPeriod synced for driverId=${id}, newScheduleAmount=${newScheduleAmount}, totalNewPay=${totalNewPay}`);
            } else if (data.companyId) {
              // Create fresh PayPeriod if none exists
              const crypto = require('crypto');
              const periodStart = new Date();
              periodStart.setDate(periodStart.getDate() - periodStart.getDay());
              const periodEnd = new Date(periodStart);
              periodEnd.setDate(periodEnd.getDate() + 13);

              await prisma.payPeriod.create({
                data: {
                  id: crypto.randomUUID(),
                  driverId: id,
                  companyId: data.companyId,
                  periodStart,
                  periodEnd,
                  frequency: 'FORTNIGHTLY',
                  status: 'DRAFT',
                  loadAllowance: totalNewPay,
                  basePay: 0,
                  grossEarnings: totalNewPay,
                  paygTax: 0,
                  superAmount: 0,
                  totalDeductions: 0,
                  netPay: totalNewPay
                }
              }).catch(e => console.warn('PayPeriod create on schedule update:', e?.message));
            }
          }
        }
      } catch (payErr) {
        console.warn('PayPeriod sync on loadPaySchedule update:', payErr?.message);
      }
    }
    // === End PayPeriod Sync ===

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};


// Delete Driver
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolveCompanyId } = require('../middlewares/tenantResolver');
    const companyId = resolveCompanyId(req);
    const where = { OR: [{ id }, { driverCode: id }] };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return res.status(HTTP_STATUS.NO_CONTENT).send();
      where.companyId = companyId;
    }

    // Find driver by ID or driverCode within tenant scope
    const existing = await prisma.driver.findFirst({ where });

    if (!existing) {
      return res.status(HTTP_STATUS.NO_CONTENT).send();
    }

    const driverId = existing.id;

    // Clean up or detach all child/related records before deleting driver
    if (prisma.document?.deleteMany) await prisma.document.deleteMany({ where: { driverId } }).catch(() => {});
    if (prisma.timesheet?.deleteMany) await prisma.timesheet.deleteMany({ where: { driverId } }).catch(() => {});
    if (prisma.payPeriod?.deleteMany) await prisma.payPeriod.deleteMany({ where: { driverId } }).catch(() => {});
    if (prisma.preStartChecklist?.deleteMany) await prisma.preStartChecklist.deleteMany({ where: { driverId } }).catch(() => {});
    if (prisma.telemetryLog?.deleteMany) await prisma.telemetryLog.deleteMany({ where: { driverId } }).catch(() => {});
    if (prisma.deliveryPod?.deleteMany) await prisma.deliveryPod.deleteMany({ where: { driverId } }).catch(() => {});
    if (prisma.message?.deleteMany) await prisma.message.deleteMany({ where: { driverId } }).catch(() => {});

    // Detach driver from loads and vehicles
    if (prisma.load?.updateMany) await prisma.load.updateMany({ where: { driverId }, data: { driverId: null } }).catch(() => {});
    if (prisma.vehicle?.updateMany) await prisma.vehicle.updateMany({ where: { assignedDriverId: driverId }, data: { assignedDriverId: null } }).catch(() => {});

    // Force permanent delete from MySQL database
    await prisma.driver.deleteMany({
      where: { id: driverId }
    });
    
    // 204 No Content for successful delete
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
};
