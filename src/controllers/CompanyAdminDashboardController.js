const prisma = require('../utils/prismaClient');
const { sendSuccess } = require('../utils/apiResponse');
const { getTenantWhere, resolveCompanyId } = require('../middlewares/tenantResolver');

exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const companyId = resolveCompanyId(req);

    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendSuccess(res, {
        kpis: {
          totalLoads: 0,
          activeLoads: 0,
          totalDrivers: 0,
          activeFleet: 0,
          totalBranches: 0,
          totalWarehouses: 0,
          totalCustomers: 0,
          openTicketsCount: 0,
          pendingRevenue: '$0.00'
        },
        loadStatusData: [],
        recentLoads: [],
        pendingInvoices: [],
        driverAlerts: [],
        truckMaintenance: [],
        recentTickets: [],
        ticketStats: { open: 0, inProgress: 0, waiting: 0, resolved: 0 },
        unreadMessages: []
      });
    }

    const whereScope = getTenantWhere(req);

    const warehouseScope = whereScope.companyId
      ? { branch: { companyId: whereScope.companyId } }
      : (req.user?.role === 'SUPER_ADMIN' ? {} : { branch: { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' } });
    const invoiceScope = whereScope.companyId
      ? { customer: { companyId: whereScope.companyId } }
      : (req.user?.role === 'SUPER_ADMIN' ? {} : { customer: { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' } });

    // 1. KPI Counts
    const [
      totalLoads,
      activeLoads,
      totalDrivers,
      activeFleet,
      totalBranches,
      totalWarehouses,
      totalCustomers,
      openTicketsCount
    ] = await Promise.all([
      prisma.load.count({ where: whereScope }),
      prisma.load.count({ where: { ...whereScope, status: { in: ['IN_TRANSIT', 'ACTIVE', 'ASSIGNED', 'PLANNED'] } } }),
      prisma.driver.count({ where: whereScope }),
      prisma.vehicle.count({ where: { ...whereScope, status: { in: ['IN_TRANSIT', 'IDLE'] } } }),
      prisma.branch.count({ where: whereScope }),
      prisma.warehouse.count({ where: warehouseScope }),
      prisma.customer.count({ where: whereScope }),
      prisma.supportTicket.count({ where: { ...whereScope, status: { in: ['OPEN', 'WAITING_CUSTOMER', 'WAITING_INTERNAL'] } } })
    ]);

    // 2. Load Status breakdown (MTD)
    const [draftLoads, plannedLoads, assignedLoads, inTransitLoads, deliveredLoads, cancelledLoads] = await Promise.all([
      prisma.load.count({ where: { ...whereScope, status: { in: ['DRAFT', 'REQUESTED'] } } }),
      prisma.load.count({ where: { ...whereScope, status: 'PLANNED' } }),
      prisma.load.count({ where: { ...whereScope, status: 'ASSIGNED' } }),
      prisma.load.count({ where: { ...whereScope, status: { in: ['IN_TRANSIT', 'ACTIVE'] } } }),
      prisma.load.count({ where: { ...whereScope, status: { in: ['DELIVERED', 'COMPLETED'] } } }),
      prisma.load.count({ where: { ...whereScope, status: 'CANCELLED' } })
    ]);

    const loadStatusData = [
      { name: 'Draft', value: draftLoads, color: '#94A3B8' },
      { name: 'Planned', value: plannedLoads, color: '#6366F1' },
      { name: 'Assigned', value: assignedLoads, color: '#3B82F6' },
      { name: 'In Transit', value: inTransitLoads, color: '#0EA5E9' },
      { name: 'Delivered', value: deliveredLoads, color: '#10B981' },
      { name: 'Cancelled', value: cancelledLoads, color: '#EF4444' }
    ];

    // 3. Recent Loads
    const recentLoadsRaw = await prisma.load.findMany({
      where: whereScope,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: true,
        truck: true,
        trailer: true
      }
    });

    const recentLoads = recentLoadsRaw.map(load => ({
      id: load.loadNumber || `L-${load.id.slice(0, 5)}`,
      dbId: load.id,
      route: `${load.origin || 'Origin'} → ${load.destination || 'Destination'}`,
      status: load.status || 'Draft',
      driver: load.driver ? `${load.driver.firstName || ''} ${load.driver.lastName || ''}`.trim() : 'Unassigned',
      statusColor: load.status === 'IN_TRANSIT' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                   load.status === 'DELIVERED' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                   load.status === 'ASSIGNED' ? 'text-purple-600 bg-purple-50 border-purple-200' :
                   'text-slate-600 bg-slate-50 border-slate-200'
    }));

    // 4. Pending Customer Invoices / Billing
    const pendingInvoicesRaw = await prisma.customerInvoice.findMany({
      where: {
        ...invoiceScope,
        status: { in: ['SENT', 'OVERDUE', 'DRAFT'] }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        status: true,
        dueDate: true,
        customer: {
          select: {
            name: true
          }
        }
      }
    }).catch(err => {
      console.warn('Warning fetching pending invoices in CompanyAdminDashboardController:', err.message);
      return [];
    });

    const totalPendingRevenue = pendingInvoicesRaw.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    const pendingInvoices = pendingInvoicesRaw.map(inv => ({
      id: inv.invoiceNumber || `INV-${inv.id.slice(0, 5)}`,
      client: inv.customer?.name || 'Customer',
      amount: `$${(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      due: inv.dueDate ? (new Date(inv.dueDate) < new Date() ? 'Overdue' : `Due in ${Math.ceil((new Date(inv.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days`) : 'Due soon'
    }));

    // 5. Driver Alerts
    const driverAlertsRaw = await prisma.driver.findMany({
      where: {
        ...whereScope,
        OR: [
          { riskLevel: 'HIGH' },
          { fatigueBreach: true },
          { licenseExpiry: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
        ]
      },
      take: 4,
      orderBy: { updatedAt: 'desc' }
    });

    const driverAlerts = driverAlertsRaw.map(drv => ({
      name: `${drv.firstName || 'Driver'} ${drv.lastName || ''}`.trim(),
      issue: drv.fatigueBreach ? 'Fatigue breach detected' :
             (drv.licenseExpiry && new Date(drv.licenseExpiry) <= new Date()) ? 'License expired' :
             (drv.licenseExpiry) ? `License expires in ${Math.ceil((new Date(drv.licenseExpiry) - new Date()) / (1000 * 60 * 60 * 24))} days` :
             'Compliance check needed',
      date: drv.updatedAt ? new Date(drv.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Today',
      avatar: drv.avatarUrl || null
    }));

    // 6. Truck Maintenance Due
    const truckMaintenanceRaw = await prisma.vehicle.findMany({
      where: whereScope,
      take: 4,
      orderBy: { updatedAt: 'desc' }
    });

    const truckMaintenance = truckMaintenanceRaw.map(v => ({
      name: `${v.make || 'Truck'} ${v.model || ''} (${v.rego || v.vin || 'TRK'})`.trim(),
      reg: `Reg: ${v.rego || 'N/A'}`,
      metric: v.odometerReading ? `${v.odometerReading.toLocaleString()} km` : 'Scheduled',
      due: v.status === 'MAINTENANCE' ? 'Overdue' : 'Due soon',
      isOverdue: v.status === 'MAINTENANCE'
    }));

    // 7. Recent Support Tickets
    const recentTicketsRaw = await prisma.supportTicket.findMany({
      where: whereScope,
      take: 4,
      orderBy: { createdAt: 'desc' }
    });

    const ticketStats = {
      open: await prisma.supportTicket.count({ where: { ...whereScope, status: 'OPEN' } }),
      inProgress: await prisma.supportTicket.count({ where: { ...whereScope, status: 'WAITING_INTERNAL' } }),
      waiting: await prisma.supportTicket.count({ where: { ...whereScope, status: 'WAITING_CUSTOMER' } }),
      resolved: await prisma.supportTicket.count({ where: { ...whereScope, status: 'RESOLVED' } })
    };

    const recentTickets = recentTicketsRaw.map(t => ({
      id: `#${t.ticketNumber || t.id.slice(0, 4)}`,
      title: t.subject || 'Support Request',
      status: t.status === 'OPEN' ? 'Open' : t.status === 'RESOLVED' ? 'Resolved' : 'In Progress',
      date: new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      statusColor: t.status === 'OPEN' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                   t.status === 'RESOLVED' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                   'text-orange-600 bg-orange-50 border-orange-200'
    }));

    // 8. Unread Messages / Alerts
    const messageScope = whereScope.companyId ? { conversation: { companyId: whereScope.companyId } } : {};
    const unreadMessagesRaw = await prisma.message.findMany({
      where: messageScope,
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { sender: true }
    });

    const unreadMessages = unreadMessagesRaw.map(m => ({
      name: m.sender?.name || 'System Alert',
      msg: m.content || 'New notification',
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      count: 1,
      avatar: null
    }));

    return sendSuccess(res, {
      kpis: {
        totalLoads,
        activeLoads,
        totalDrivers,
        activeFleet,
        totalBranches,
        totalWarehouses,
        totalCustomers,
        openTicketsCount,
        pendingRevenue: `$${totalPendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      },
      loadStatusData,
      recentLoads,
      pendingInvoices,
      driverAlerts,
      truckMaintenance,
      recentTickets,
      ticketStats,
      unreadMessages
    });

  } catch (error) {
    next(error);
  }
};
