const prisma = require('../utils/prismaClient');

// Non-blocking telemetry middleware to track API usage and active user sessions
const analyticsLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    setImmediate(async () => {
      try {
        const url = req.originalUrl || req.url || '';

        // 1. Filter out static assets, health checks, and dashboard self-polling
        if (
          url.startsWith('/uploads') ||
          url.startsWith('/assets') ||
          url.includes('/health') ||
          url.includes('/super-admin/dashboard') ||
          url.includes('/module-usage-logs') ||
          url.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|map)$/i)
        ) {
          return;
        }

        const responseTimeMs = Date.now() - startTime;
        const userId = req.user?.id || req.user?.userId || null;
        const companyId = req.user?.companyId || req.user?.tenantId || null;

        // 2. Log API Usage (fire-and-forget catch)
        await prisma.apiUsageLog.create({
          data: {
            companyId,
            userId,
            endpoint: url.split('?')[0],
            method: req.method,
            statusCode: res.statusCode,
            responseTimeMs,
            timestamp: new Date()
          }
        }).catch(() => {});

        // 3. Update User Active Session ping if user is authenticated
        if (userId) {
          const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
          
          const existingSession = await prisma.userSession.findFirst({
            where: {
              userId,
              status: 'ACTIVE',
              logoutAt: null,
              lastPingAt: { gte: fifteenMinsAgo }
            },
            orderBy: { lastPingAt: 'desc' }
          }).catch(() => null);

          if (existingSession) {
            await prisma.userSession.update({
              where: { id: existingSession.id },
              data: { lastPingAt: new Date() }
            }).catch(() => {});
          } else {
            await prisma.userSession.create({
              data: {
                userId,
                companyId,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
                userAgent: req.headers['user-agent'] || null,
                status: 'ACTIVE',
                loginAt: new Date(),
                lastPingAt: new Date()
              }
            }).catch(() => {});
          }
        }
      } catch (err) {
        // Silent catch to guarantee non-blocking safety
      }
    });
  });

  next();
};

// Retention cleanup helper (prune API logs older than 30 days)
const cleanupOldApiLogs = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await prisma.apiUsageLog.deleteMany({
      where: {
        timestamp: { lt: thirtyDaysAgo }
      }
    });
  } catch (err) {
    // Silent catch
  }
};

module.exports = { analyticsLogger, cleanupOldApiLogs };
