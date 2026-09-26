import os

def append_routes():
    filepath = r"d:\kiaan\Hero_Logistic\Hero-Logistic-Clone\backend\src\controllers\DriverPortalController.js"
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write("""

// --- Phase 1: Driver Dashboard Cleanup Routes ---

exports.getPayroll = async (req, res, next) => {
  try {
    const driver = await resolveDriver(req);
    if (!driver) return sendError(res, { code: ERROR_CODES.UNAUTHORIZED, message: 'Driver profile not found' }, 401);
    return sendSuccess(res, {
      driverInfo: { bankName: '', bsbNumber: '', accountNumber: '', accountName: '' },
      currentPeriod: null,
      ytdSummary: null,
      currentPayBreakdown: null,
      payHistory: [],
      totalSummary: null,
      ytdEarningsBreakdown: null,
      taxStatements: [],
      activeLoad: null
    });
  } catch (error) { next(error); }
};

exports.getPickupLoad = async (req, res, next) => {
  try {
    const driver = await resolveDriver(req);
    if (!driver) return sendError(res, { code: ERROR_CODES.UNAUTHORIZED, message: 'Driver profile not found' }, 401);
    
    const load = await prisma.load.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ['Assigned', 'Dispatched'] }
      },
      include: { cars: true }
    });
    
    if (load) {
       return sendSuccess(res, { load });
    }
    return sendSuccess(res, { load: null });
  } catch (error) { next(error); }
};

exports.getActiveRun = async (req, res, next) => {
  try {
    const driver = await resolveDriver(req);
    if (!driver) return sendError(res, { code: ERROR_CODES.UNAUTHORIZED, message: 'Driver profile not found' }, 401);
    
    const activeRun = await prisma.load.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ['Dispatched', 'InTransit'] }
      },
      include: { cars: true }
    });
    return sendSuccess(res, { activeRun });
  } catch (error) { next(error); }
};

exports.getJobs = async (req, res, next) => {
  try {
    const driver = await resolveDriver(req);
    if (!driver) return sendError(res, { code: ERROR_CODES.UNAUTHORIZED, message: 'Driver profile not found' }, 401);
    
    const jobs = await prisma.load.findMany({
      where: {
        driverId: driver.id
      },
      include: { cars: true },
      orderBy: { createdAt: 'desc' }
    });
    return sendSuccess(res, { jobs });
  } catch (error) { next(error); }
};

exports.getTimesheets = async (req, res, next) => {
  try {
    const driver = await resolveDriver(req);
    if (!driver) return sendError(res, { code: ERROR_CODES.UNAUTHORIZED, message: 'Driver profile not found' }, 401);
    return sendSuccess(res, { timesheets: [] });
  } catch (error) { next(error); }
};

exports.clockInOut = async (req, res, next) => {
  try {
    const driver = await resolveDriver(req);
    if (!driver) return sendError(res, { code: ERROR_CODES.UNAUTHORIZED, message: 'Driver profile not found' }, 401);
    return sendSuccess(res, { success: true });
  } catch (error) { next(error); }
};
""")
    print("Appended routes successfully!")

if __name__ == "__main__":
    append_routes()
