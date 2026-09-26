const prisma = require('../utils/prismaClient');
const { sendSuccess } = require('../utils/apiResponse');

exports.getSummary = async (req, res, next) => {
  try {
    const whereLead = {};
    const whereTask = { status: 'PENDING' };
    const whereActivity = {};

    // RBAC Scoping
    if (req.salesScope === 'OWN' && req.user && req.user.id) {
      whereLead.repId = req.user.id;
      whereTask.repId = req.user.id;
      whereActivity.performedById = req.user.id;
    } else if (req.query.repId) {
      whereLead.repId = req.query.repId;
      whereTask.repId = req.query.repId;
      whereActivity.performedById = req.query.repId;
    }

    // 1. Fetch leads
    const leads = await prisma.lead.findMany({
      where: whereLead,
      orderBy: { updatedAt: 'desc' },
      include: {
        rep: { select: { id: true, name: true, email: true } }
      }
    });

    // 2. Fetch recent activities
    const activities = await prisma.salesActivity.findMany({
      where: Object.keys(whereActivity).length ? whereActivity : undefined,
      take: 15,
      orderBy: { timestamp: 'desc' },
      include: {
        performedBy: { select: { id: true, name: true } },
        lead: { select: { companyName: true } }
      }
    });

    // 3. Fetch upcoming follow-up tasks
    const tasks = await prisma.followUpTask.findMany({
      where: whereTask,
      take: 15,
      orderBy: { dueDate: 'asc' },
      include: {
        lead: { select: { companyName: true, contactName: true } },
        rep: { select: { name: true } }
      }
    });

    // 4. Fetch list of eligible platform Sales Representatives
    const salesReps = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SALES' },
          { role: 'SUPER_ADMIN' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });

    // 5. Calculate KPIs
    const newLeads = leads.filter(l => l.stage === 'NEW_LEAD').length;
    const demosBooked = await prisma.demoBooking.count({
      where: req.salesScope === 'OWN' ? { presenterId: req.user.id, status: 'UPCOMING' } : { status: 'UPCOMING' }
    });
    const trialsActive = leads.filter(l => l.stage === 'TRIAL_STARTED').length;
    const proposalsSent = await prisma.proposal.count({
      where: req.salesScope === 'OWN' ? { lead: { repId: req.user.id }, status: 'SENT' } : { status: 'SENT' }
    });
    const dealsWon = leads.filter(l => l.stage === 'WON').length;
    const dealsLost = leads.filter(l => l.stage === 'LOST').length;

    // Sum estimatedValue
    const pipelineValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

    // 6. Stage Distribution Matrix
    const stages = [
      { name: 'NEW LEAD', count: leads.filter(l => l.stage === 'NEW_LEAD').length },
      { name: 'CONTACTED', count: leads.filter(l => l.stage === 'CONTACTED').length },
      { name: 'DEMO BOOKED', count: leads.filter(l => l.stage === 'DEMO_BOOKED').length },
      { name: 'DEMO COMPLETED', count: leads.filter(l => l.stage === 'DEMO_COMPLETED').length },
      { name: 'TRIAL STARTED', count: leads.filter(l => l.stage === 'TRIAL_STARTED').length },
      { name: 'PROPOSAL SENT', count: leads.filter(l => l.stage === 'PROPOSAL_SENT').length },
      { name: 'NEGOTIATING', count: leads.filter(l => l.stage === 'NEGOTIATING').length },
      { name: 'WON', count: leads.filter(l => l.stage === 'WON').length },
      { name: 'LOST', count: leads.filter(l => l.stage === 'LOST').length }
    ];

    // 7. Analytics chart data (Dynamic last 6 months)
    const monthlyData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const monthLeads = leads.filter(l => {
        const leadDate = new Date(l.createdAt);
        return leadDate >= startOfMonth && leadDate <= endOfMonth;
      });
      
      const monthValue = monthLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
      
      monthlyData.push({
        name: monthNames[d.getMonth()],
        value: monthValue
      });
    }

    const totalDemos = await prisma.demoBooking.count(req.salesScope === 'OWN' ? { where: { presenterId: req.user.id } } : undefined);
    const totalProposals = await prisma.proposal.count(req.salesScope === 'OWN' ? { where: { lead: { repId: req.user.id } } } : undefined);

    const conversionData = [
      { name: 'Leads', value: leads.length, color: '#6366F1' },
      { name: 'Demos', value: totalDemos, color: '#3B82F6' },
      { name: 'Trials', value: trialsActive, color: '#10B981' },
      { name: 'Proposals', value: totalProposals, color: '#F59E0B' },
      { name: 'Won', value: dealsWon, color: '#EF4444' }
    ];

    return sendSuccess(res, {
      kpis: {
        newLeads,
        demosBooked,
        trialsActive,
        proposalsSent,
        dealsWon,
        dealsLost,
        pipelineValue
      },
      stages,
      monthlyData,
      conversionData,
      salesReps,
      recentActivities: activities.map(act => ({
        id: act.id,
        title: act.title,
        date: act.timestamp.toISOString(),
        desc: act.description,
        user: act.performedBy?.name || 'SYSTEM',
        company: act.lead?.companyName || ''
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        company: t.lead?.companyName || 'Unknown',
        due: t.dueDate.toISOString(),
        task: t.description,
        status: t.dueDate < new Date() ? 'OVERDUE' : 'UPCOMING',
        completed: t.status === 'COMPLETED'
      })),
      leadsList: leads
    });

  } catch (error) {
    console.error('Error fetching sales dashboard summary:', error);
    return sendSuccess(res, {
      kpis: {
        newLeads: 0,
        demosBooked: 0,
        trialsActive: 0,
        proposalsSent: 0,
        dealsWon: 0,
        dealsLost: 0,
        pipelineValue: 0
      },
      stages: [],
      monthlyData: [],
      conversionData: [],
      salesReps: [],
      recentActivities: [],
      tasks: [],
      leadsList: []
    });
  }
};
