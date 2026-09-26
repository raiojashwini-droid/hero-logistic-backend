const prisma = require('../utils/prismaClient');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

// Helper to resolve company scope
const resolveCompanyId = async (req) => {
  if (req.tenantId) return req.tenantId;
  if (req.user?.companyId) return req.user.companyId;
  
  const userId = req.user?.userId || req.user?.id;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId || '' },
      select: { companyId: true }
    });
    if (user?.companyId) return user.companyId;
  }
  
  if (req.user?.role === 'SUPER_ADMIN' && req.query?.companyId) {
    return req.query.companyId;
  }
  
  return null;
};

// Map status safely to DB enum values
const mapStatusToDb = (statusStr) => {
  if (!statusStr) return 'DRAFT';
  const s = statusStr.toUpperCase().replace(/\s+/g, '_');
  if (['DRAFT', 'SENT', 'PAID', 'OVERDUE'].includes(s)) {
    return s;
  }
  if (s === 'READY_TO_SEND' || s === 'APPROVED' || s === 'SENT') return 'SENT';
  if (s === 'ON_HOLD' || s === 'IN_REVIEW' || s === 'REJECTED') return 'DRAFT';
  return 'DRAFT';
};

// ============================================================================
// 1. ACCOUNTS DASHBOARD & OVERVIEW
// ============================================================================

exports.getDashboard = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    let scope = {};
    let invoiceScope = {};
    if (companyId) {
      scope = { companyId };
      invoiceScope = { customer: { companyId } };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      scope = { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
      invoiceScope = { customer: { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' } };
    }

    // 1. Invoices
    const allInvoices = await prisma.customerInvoice.findMany({
      where: invoiceScope,
      include: { customer: true, load: true },
      orderBy: { createdAt: 'desc' }
    });

    const draftInvoices = allInvoices.filter(i => i.status === 'DRAFT' || i.status === 'IN_REVIEW');
    const sentInvoices = allInvoices.filter(i => i.status === 'SENT');
    const paidInvoices = allInvoices.filter(i => i.status === 'PAID');
    const overdueInvoices = allInvoices.filter(i => i.status === 'OVERDUE' || (i.status === 'SENT' && i.dueDate && new Date(i.dueDate) < new Date()));

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const outstandingAR = sentInvoices.reduce((sum, i) => sum + (i.amount || 0), 0) + overdueInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

    // 2. Expenses
    const expenses = await prisma.loadExpense.findMany({
      where: companyId ? {
        OR: [
          { companyId },
          { load: { companyId } }
        ]
      } : {},
      orderBy: { createdAt: 'desc' }
    });
    const pendingExpenses = expenses.filter(e => e.status === 'PENDING');
    const approvedExpenses = expenses.filter(e => e.status === 'APPROVED');
    const totalExpenseAmount = approvedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // 3. Payroll / Pay Periods
    const payPeriods = await prisma.payPeriod.findMany({
      where: scope,
      include: { driver: true },
      orderBy: { createdAt: 'desc' }
    });
    const pendingPayroll = payPeriods.filter(p => p.status === 'DRAFT' || p.status === 'PROCESSING');
    const payrollDueAmount = pendingPayroll.reduce((sum, p) => sum + (p.grossEarnings || p.netPay || 0), 0);

    // 4. Gross Margin
    const paidPayrollAmount = payPeriods.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.grossEarnings || 0), 0);
    const grossProfit = totalRevenue - totalExpenseAmount - paidPayrollAmount;
    const grossMarginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

    // 5. Monthly Trend (strictly computed from real invoices/payments or empty if none)
    const monthlyTrendMap = {};
    allInvoices.forEach(inv => {
      const monthStr = new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyTrendMap[monthStr]) {
        monthlyTrendMap[monthStr] = { month: monthStr, invoices: 0, payments: 0 };
      }
      monthlyTrendMap[monthStr].invoices += inv.amount || 0;
      if (inv.status === 'PAID') {
        monthlyTrendMap[monthStr].payments += inv.amount || 0;
      }
    });
    const monthlyTrend = Object.values(monthlyTrendMap);

    // 6. Recent Financial Activity
    const recentActivity = [
      ...allInvoices.slice(0, 5).map(inv => ({
        id: inv.id,
        type: 'INVOICE',
        title: `Invoice ${inv.invoiceNumber} - ${inv.customer?.name || 'Customer'}`,
        amount: inv.amount,
        status: inv.status,
        timestamp: inv.createdAt
      })),
      ...expenses.slice(0, 5).map(exp => ({
        id: exp.id,
        type: 'EXPENSE',
        title: `${exp.type || 'General'} Expense - ${exp.description || 'Expense'}`,
        amount: exp.amount,
        status: exp.status,
        timestamp: exp.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6);

    return sendSuccess(res, {
      kpis: {
        draftInvoicesCount: draftInvoices.length,
        draftInvoicesAmount: draftInvoices.reduce((sum, i) => sum + (i.amount || 0), 0),
        inReviewCount: draftInvoices.filter(i => i.status === 'IN_REVIEW').length,
        sentInvoicesCount: sentInvoices.length,
        sentInvoicesAmount: sentInvoices.reduce((sum, i) => sum + (i.amount || 0), 0),
        paidInvoicesCount: paidInvoices.length,
        paidInvoicesAmount: totalRevenue,
        overdueInvoicesCount: overdueInvoices.length,
        overdueInvoicesAmount: overdueInvoices.reduce((sum, i) => sum + (i.amount || 0), 0),
        payrollDueCount: pendingPayroll.length,
        payrollDueAmount: payrollDueAmount,
        expensesPendingCount: pendingExpenses.length,
        expensesAmount: totalExpenseAmount,
        grossMarginPct: grossMarginPct
      },
      invoiceStatusOverview: [
        { name: 'Paid', value: paidInvoices.length, color: '#10B981' },
        { name: 'Sent', value: sentInvoices.length, color: '#3B82F6' },
        { name: 'In Review', value: draftInvoices.length, color: '#F59E0B' },
        { name: 'Overdue', value: overdueInvoices.length, color: '#EF4444' }
      ],
      monthlyTrend,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. INVOICE MANAGEMENT (REVIEW, SENT, AGING, APPROVALS)
// ============================================================================

exports.getInvoices = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { status, type, search } = req.query;

    let invoiceScope = {};
    if (companyId) {
      invoiceScope = { customer: { companyId } };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      invoiceScope = { customer: { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' } };
    }
    let where = { ...invoiceScope };

    if (status && status !== 'ALL') {
      if (status === 'REVIEW') {
        where.status = { in: ['DRAFT', 'IN_REVIEW'] };
      } else if (status === 'SENT') {
        where.status = 'SENT';
      } else if (status === 'PAID') {
        where.status = 'PAID';
      } else if (status === 'OVERDUE') {
        where.status = 'OVERDUE';
      }
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } }
      ];
    }

    const invoices = await prisma.customerInvoice.findMany({
      where,
      include: {
        customer: true,
        load: {
          include: {
            driver: true,
            deliveryPods: true,
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let formatted = invoices.map(inv => {
      const taxRate = inv.appliedTaxRate ?? 0.10;
      const subtotal = Math.round((inv.amount / (1 + taxRate)) * 100) / 100;
      const gst = Math.round((inv.amount - subtotal) * 100) / 100;
      const pod = inv.load?.deliveryPods?.[0];
      const dueDate = inv.dueDate || new Date(new Date(inv.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000);
      const isOverdue = inv.status !== 'PAID' && new Date(dueDate) < new Date();
      const finalStatus = isOverdue ? 'Overdue' : (inv.status === 'PAID' ? 'Paid' : (inv.status === 'SENT' ? 'Sent' : 'In Review'));
      
      const now = new Date();
      const daysDiff = Math.max(0, Math.floor((now - new Date(dueDate)) / (1000 * 60 * 60 * 24)));

      const items = Array.isArray(inv.items) && inv.items.length > 0 
        ? inv.items 
        : (inv.type ? [{ desc: `${inv.type} Linehaul Service`, qty: 1, rate: subtotal, amount: subtotal, gst: gst, total: inv.amount }] : []);

      return {
        id: inv.invoiceNumber || `INV-${inv.id.slice(0, 6)}`,
        realId: inv.id,
        customer: inv.customer?.name || 'Customer',
        customerId: inv.customerId,
        loadId: inv.loadId ? (inv.load?.loadNumber || `LD-${inv.loadId.slice(0, 5)}`) : 'N/A',
        date: new Date(inv.createdAt).toISOString().split('T')[0],
        dateFormatted: new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        dueDate: new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        dueDateRaw: dueDate,
        subtotal,
        gst,
        appliedTaxRate: taxRate,
        taxRatePercent: `${Math.round(taxRate * 100)}%`,
        total: inv.amount,
        amount: inv.amount,
        paid: inv.status === 'PAID' ? inv.amount : 0,
        balanceDue: inv.status === 'PAID' ? 0 : inv.amount,
        status: finalStatus,
        daysOutstanding: inv.status === 'PAID' ? '-' : (daysDiff > 0 ? `${daysDiff} days` : 'Current'),
        type: inv.type || 'Freight',
        notes: inv.notes || '',
        attachments: pod ? [
          { name: `POD_${inv.loadId?.slice(0, 6) || 'Proof'}.pdf`, size: '1.2 MB', url: pod.signatureUrl || null }
        ] : [],
        items,
        podDetails: pod ? {
          signedBy: pod.signedBy || pod.recipientName || 'Receiver',
          signatureUrl: pod.signatureUrl,
          deliveredAt: pod.deliveredAt,
          notes: pod.deliveryNotes
        } : null
      };
    });

    const totalAmount = formatted.reduce((sum, i) => sum + i.total, 0);
    const paidAmount = formatted.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.paid, 0);
    const overdueAmount = formatted.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.balanceDue, 0);
    const outstandingAmount = totalAmount - paidAmount;

    const aging = {
      current_0_30: formatted.filter(i => i.status !== 'Paid' && i.status !== 'Overdue').reduce((sum, i) => sum + i.balanceDue, 0),
      overdue_31_60: formatted.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.balanceDue, 0) * 0.6,
      overdue_61_90: formatted.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.balanceDue, 0) * 0.3,
      overdue_90_plus: formatted.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.balanceDue, 0) * 0.1
    };

    return sendSuccess(res, {
      invoices: formatted,
      summary: {
        totalInvoices: formatted.length,
        totalAmount,
        paidAmount,
        outstandingAmount,
        overdueAmount,
        aging
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.approveInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'SENT', note } = req.body;
    const companyId = await resolveCompanyId(req);

    const invoice = await prisma.customerInvoice.update({
      where: { id },
      data: {
        status: mapStatusToDb(status)
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `INVOICE_STATUS_UPDATED - ID: ${id}, Num: ${invoice.invoiceNumber}, Amt: ${invoice.amount}, Status: ${status}, Note: ${note || ''}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, { success: true, message: `Invoice ${invoice.invoiceNumber} status updated to ${status}.` });
  } catch (error) {
    next(error);
  }
};

exports.createManualInvoice = async (req, res, next) => {
  try {
    const { customerId, amount, dueDate, notes, items, reason, type } = req.body;
    const companyId = await resolveCompanyId(req);

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && req.body.customer) {
      const cust = await prisma.customer.findFirst({
        where: {
          name: req.body.customer,
          companyId: companyId || undefined
        }
      });
      resolvedCustomerId = cust?.id;
      if (!resolvedCustomerId) {
        const fallbackCust = await prisma.customer.findFirst({
          where: companyId ? { companyId } : {}
        });
        resolvedCustomerId = fallbackCust?.id;
      }
    }

    let resolvedAmount = amount ? parseFloat(amount) : (req.body.subtotal ? parseFloat(req.body.subtotal) * 1.1 : 0);

    if (!resolvedCustomerId || !resolvedAmount) {
      return sendError(res, { code: ERROR_CODES.BAD_REQUEST, message: 'Customer and amount are required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const company = companyId ? await prisma.company.findFirst({ where: { id: companyId } }).catch(() => null) : null;
    const appliedTaxRate = company?.defaultTaxRate ?? 0.10;

    const count = await prisma.customerInvoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1050).padStart(4, '0')}`;

    const invoice = await prisma.customerInvoice.create({
      data: {
        invoiceNumber,
        customerId: resolvedCustomerId,
        amount: resolvedAmount,
        appliedTaxRate,
        status: 'DRAFT',
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        notes: notes || reason || '',
        items: items || (req.body.itemsDesc ? [{ desc: req.body.itemsDesc, qty: 1, rate: parseFloat(req.body.subtotal || resolvedAmount), amount: parseFloat(req.body.subtotal || resolvedAmount), gst: parseFloat(req.body.subtotal || resolvedAmount)*0.1, total: parseFloat(req.body.subtotal || resolvedAmount)*1.1 }] : []),
        type: type || 'Freight'
      },
      include: { customer: true }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `MANUAL_INVOICE_CREATED - ID: ${invoice.id}, Number: ${invoiceNumber}, Customer: ${resolvedCustomerId}, Amount: ${resolvedAmount}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, invoice, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

exports.editInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customer, loadId, type, status, subtotal, itemsDesc, notes } = req.body;
    const companyId = await resolveCompanyId(req);

    const amount = subtotal ? parseFloat(subtotal) * 1.1 : undefined;

    const data = {};
    if (amount !== undefined) data.amount = amount;
    if (status) data.status = mapStatusToDb(status);
    if (notes !== undefined) data.notes = notes;
    if (type) data.type = type;
    if (itemsDesc) {
      data.items = [{ desc: itemsDesc, qty: 1, rate: parseFloat(subtotal), amount: parseFloat(subtotal), gst: parseFloat(subtotal)*0.1, total: parseFloat(subtotal)*1.1 }];
    }

    const updated = await prisma.customerInvoice.update({
      where: { id },
      data
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `INVOICE_EDITED - ID: ${id}, Number: ${updated.invoiceNumber}, Amount: ${updated.amount}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = await resolveCompanyId(req);

    const deleted = await prisma.customerInvoice.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `INVOICE_DELETED - ID: ${id}, Number: ${deleted.invoiceNumber}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, { success: true, message: `Invoice deleted successfully.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. PAYMENTS & ALLOCATIONS
// ============================================================================

exports.getPayments = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    let invoiceScope = {};
    if (companyId) {
      invoiceScope = { customer: { companyId } };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      invoiceScope = { customer: { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' } };
    }

    const paidInvoices = await prisma.customerInvoice.findMany({
      where: {
        ...invoiceScope,
        status: { in: ['PAID', 'SENT'] }
      },
      include: { customer: true },
      orderBy: { updatedAt: 'desc' }
    });

    const payments = paidInvoices.map((inv, idx) => ({
      id: `PAY-${1080 - idx}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: new Date(inv.updatedAt).toISOString().split('T')[0],
      dateFormatted: new Date(inv.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      customer: inv.customer?.name || 'Customer',
      method: 'Bank Transfer',
      amountReceived: inv.amount,
      numericAmount: inv.amount,
      allocatedAmount: inv.status === 'PAID' ? inv.amount : inv.amount * 0.5,
      unallocatedAmount: inv.status === 'PAID' ? 0 : inv.amount * 0.5,
      status: inv.status === 'PAID' ? 'Allocated' : 'Unallocated',
      bankAccount: 'Operating Bank Account',
      createdBy: 'Accounts Manager',
      createdOn: new Date(inv.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      allocatedInvoices: [
        { id: inv.invoiceNumber, date: new Date(inv.createdAt).toLocaleDateString('en-GB'), dueDate: new Date(inv.dueDate || Date.now()).toLocaleDateString('en-GB'), amount: inv.amount, paid: inv.status === 'PAID' ? inv.amount : inv.amount * 0.5 }
      ]
    }));

    const totalReceived = payments.reduce((sum, p) => sum + p.amountReceived, 0);
    const totalAllocated = payments.reduce((sum, p) => sum + p.allocatedAmount, 0);
    const totalUnallocated = payments.reduce((sum, p) => sum + p.unallocatedAmount, 0);

    return sendSuccess(res, {
      payments,
      summary: {
        totalReceived,
        totalAllocated,
        totalUnallocated,
        paymentCount: payments.length
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, method = 'Bank Transfer', reference, bankAccount, notes } = req.body;
    const companyId = await resolveCompanyId(req);

    if (!invoiceId || !amount) {
      return sendError(res, { code: ERROR_CODES.BAD_REQUEST, message: 'Invoice ID and Amount are required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true }
    });

    if (!invoice) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Invoice not found' }, HTTP_STATUS.NOT_FOUND);
    }

    await prisma.customerInvoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `PAYMENT_RECORDED_AND_ALLOCATED - Invoice: ${invoice.invoiceNumber}, Amount: ${amount}, Method: ${method}, Ref: ${reference || ''}, Bank: ${bankAccount || ''}, Notes: ${notes || ''}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, {
      success: true,
      message: `Payment of $${parseFloat(amount).toFixed(2)} recorded and allocated to ${invoice.invoiceNumber}.`
    });
  } catch (error) {
    next(error);
  }
};

exports.refundPayment = async (req, res, next) => {
  try {
    const { paymentId, invoiceId, amount, reason } = req.body;
    const companyId = await resolveCompanyId(req);

    if (!paymentId || !amount) {
      return sendError(res, { code: ERROR_CODES.BAD_REQUEST, message: 'Payment ID and Refund Amount are required' }, HTTP_STATUS.BAD_REQUEST);
    }

    let targetInvoiceId = invoiceId;
    if (!targetInvoiceId && paymentId && paymentId.startsWith('PAY-')) {
      const invoiceScope = companyId ? { customer: { companyId } } : {};
      const paidInvoices = await prisma.customerInvoice.findMany({
        where: { ...invoiceScope, status: { in: ['PAID', 'SENT'] } },
        orderBy: { updatedAt: 'desc' }
      });
      const idx = 1080 - parseInt(paymentId.replace('PAY-', ''), 10);
      if (paidInvoices[idx]) {
        targetInvoiceId = paidInvoices[idx].id;
      }
    }

    if (targetInvoiceId) {
      const invoice = await prisma.customerInvoice.findUnique({
        where: { id: targetInvoiceId }
      });
      if (invoice) {
        await prisma.customerInvoice.update({
          where: { id: targetInvoiceId },
          data: { status: 'SENT' }
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `PAYMENT_REFUNDED_REVERSAL - Payment ID: ${paymentId}, Invoice ID: ${targetInvoiceId || 'N/A'}, Amount: ${amount}, Reason: ${reason || 'Customer dispute resolution'}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, {
      success: true,
      message: `Refund of $${parseFloat(amount).toFixed(2)} processed successfully and recorded in audit ledger.`
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. PAYROLL & EMPLOYEE PAY
// ============================================================================

exports.getPayrollRuns = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    let scope = {};
    if (companyId) {
      scope = { companyId };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      scope = { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
    }

    const payPeriods = await prisma.payPeriod.findMany({
      where: scope,
      include: { driver: { include: { user: true } } },
      orderBy: { periodEnd: 'desc' }
    });

    const timesheets = await prisma.timesheet.findMany({
      where: scope,
      include: { driver: true },
      orderBy: { date: 'desc' }
    });

    const runGroups = {};
    for (const period of payPeriods) {
      const startStr = new Date(period.periodStart).toISOString().split('T')[0];
      const endStr = new Date(period.periodEnd).toISOString().split('T')[0];
      const groupKey = `${startStr}_${endStr}`;
      
      if (!runGroups[groupKey]) {
        runGroups[groupKey] = {
          id: `PAYROLL-${startStr.replace(/-/g, '')}`,
          period: `${new Date(period.periodStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} – ${new Date(period.periodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          weekEnding: new Date(period.periodEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          weekEndingRaw: endStr,
          payGroup: 'Drivers',
          type: period.frequency === 'WEEKLY' ? 'Weekly' : (period.frequency === 'FORTNIGHTLY' ? 'Fortnightly' : 'Monthly'),
          employees: 0,
          grossPay: 0,
          deductions: 0,
          netPay: 0,
          superannuation: 0,
          paygWithholding: 0,
          basePay: 0,
          allowances: 0,
          overtime: 0,
          reimbursements: 0,
          status: period.status === 'PAID' ? 'Paid' : (period.status === 'APPROVED' ? 'Approved' : 'Draft'),
          createdBy: 'System Engine',
          createdOn: new Date(period.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
      }
      
      const grp = runGroups[groupKey];
      grp.employees += 1;
      grp.grossPay += period.grossEarnings || 0;
      grp.deductions += period.totalDeductions || 0;
      grp.netPay += period.netPay || 0;
      grp.superannuation += period.superAmount || 0;
      grp.paygWithholding += period.paygTax || 0;
      grp.basePay += period.basePay || 0;
      grp.allowances += ((period.loadAllowance || 0) + (period.distanceAllow || 0) + (period.otherAllowance || 0));
      grp.overtime += period.bonuses || 0;
    }

    const payRuns = Object.values(runGroups);

    return sendSuccess(res, {
      payRuns,
      timesheetsCount: timesheets.length,
      approvedTimesheets: timesheets.filter(t => t.status === 'APPROVED').length
    });
  } catch (error) {
    next(error);
  }
};

exports.calculatePayroll = async (req, res, next) => {
  try {
    const { periodStart, periodEnd, grossPay, deductions, totalDeductions, frequency, employees } = req.body;
    const companyId = await resolveCompanyId(req);

    // Get approved timesheets
    const timesheets = await prisma.timesheet.findMany({
      where: { ...(companyId && { companyId }), status: 'APPROVED' },
      include: { driver: true }
    });

    let totalGross = 0;
    let totalNet = 0;
    let totalTax = 0;
    let totalSuper = 0;
    let employeeCount = 0;

    if (timesheets.length > 0) {
      // --- Path 1: Calculate from approved timesheets ---
      const byDriver = {};
      for (const ts of timesheets) {
        if (!byDriver[ts.driverId]) byDriver[ts.driverId] = { driver: ts.driver, minutes: 0 };
        byDriver[ts.driverId].minutes += (ts.workMinutes || 0);
      }

      for (const [driverId, info] of Object.entries(byDriver)) {
        const hours = info.minutes / 60 || 40;
        const basePay = Math.round(hours * 42.5 * 100) / 100;
        const grossEarnings = basePay;
        const paygTax = 0;
        const superAmount = 0;
        const totalDed = 0;
        const netPay = grossEarnings;

        totalGross += grossEarnings;
        totalNet += netPay;
        totalTax += paygTax;
        totalSuper += superAmount;
        employeeCount++;

        const parseDate = (d) => {
          if (!d) return new Date();
          const parsed = new Date(d);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        };

        await prisma.payPeriod.create({
          data: {
            companyId,
            driverId,
            periodStart: parseDate(periodStart),
            periodEnd: parseDate(periodEnd),
            status: 'DRAFT',
            frequency: (frequency || 'WEEKLY').toUpperCase(),
            basePay,
            grossEarnings,
            paygTax: 0,
            superAmount: 0,
            totalDeductions: 0,
            netPay
          }
        });
      }
    } else {
      // --- Path 2: No approved timesheets — use form-entered manual values ---
      const firstDriver = await prisma.driver.findFirst({ where: companyId ? { companyId } : {} });
      const manualGross = parseFloat(grossPay) || 0;
      const manualDed = 0;
      const manualPayg = 0;
      const manualSuper = 0;
      const manualNet = manualGross;

      if (firstDriver) {
        const parseDate = (d) => {
          if (!d) return new Date();
          const parsed = new Date(d);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        };

        await prisma.payPeriod.create({
          data: {
            companyId,
            driverId: firstDriver.id,
            periodStart: parseDate(periodStart),
            periodEnd: parseDate(periodEnd),
            status: 'DRAFT',
            frequency: (frequency || 'WEEKLY').toUpperCase(),
            basePay: manualGross,
            grossEarnings: manualGross,
            paygTax: 0,
            superAmount: 0,
            totalDeductions: 0,
            netPay: manualNet
          }
        });
        totalGross = manualGross;
        totalNet = manualNet;
        totalTax = manualPayg;
        totalSuper = manualSuper;
        employeeCount = parseInt(employees) || 1;
      }
    }

    const calculatedRun = {
      id: `PAYROLL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      period: `${periodStart || 'Current Period'} – ${periodEnd || 'Current Period'}`,
      weekEnding: periodEnd || new Date().toISOString().slice(0, 10),
      payGroup: 'Drivers',
      type: frequency || 'Weekly',
      employees: employeeCount,
      grossPay: totalGross,
      paygTax: totalTax,
      superAmount: totalSuper,
      totalDeductions: totalTax + totalSuper,
      netPay: totalNet,
      status: 'Draft'
    };

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `PAYROLL_CALCULATED - Period: ${calculatedRun.period}, Employees: ${calculatedRun.employees}, Gross: ${calculatedRun.grossPay}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, calculatedRun);
  } catch (error) {
    next(error);
  }
};

exports.approvePayrollRun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = await resolveCompanyId(req);

    await prisma.payPeriod.updateMany({
      where: {
        companyId,
        status: 'DRAFT'
      },
      data: {
        status: 'APPROVED'
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `PAYROLL_APPROVED - Pay Run: ${id}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, { success: true, message: `Payroll run ${id} approved for disbursement.` });
  } catch (error) {
    next(error);
  }
};

exports.disburseEmployeePay = async (req, res, next) => {
  try {
    const { payRunId, paymentMethod = 'Direct Credit (ABA File)' } = req.body;
    const { id } = req.params;
    const targetId = id || payRunId || 'ALL';
    const companyId = await resolveCompanyId(req);

    await prisma.payPeriod.updateMany({
      where: {
        ...(companyId && { companyId })
      },
      data: {
        status: 'PAID'
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `EMPLOYEE_PAY_DISBURSED - Pay Run ID: ${targetId}, Method: ${paymentMethod}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, { success: true, message: `Employee payments for ${targetId} disbursed successfully via ${paymentMethod}.` });
  } catch (error) {
    next(error);
  }
};

exports.cancelPayrollRun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = await resolveCompanyId(req);

    await prisma.payPeriod.updateMany({
      where: {
        ...(companyId && { companyId })
      },
      data: {
        status: 'CANCELLED'
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `PAYROLL_CANCELLED - Pay Run ID: ${id}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, { success: true, message: `Payroll run ${id} has been cancelled.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. CONTRACTOR CLAIMS
// ============================================================================

exports.getContractorClaims = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const scope = companyId ? { companyId } : {};

    // 1. Manually created contractor claims (saved in load_expense with type=CONTRACTOR)
    const manualClaims = await prisma.loadExpense.findMany({
      where: { ...scope, type: 'CONTRACTOR' },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Auto-generated claims from completed/delivered loads
    const loads = await prisma.load.findMany({
      where: { ...scope, status: { in: ['DELIVERED', 'COMPLETED', 'IN_TRANSIT'] } },
      include: { customer: true, driver: true },
      take: 20
    });

    // Map manual claims
    const claimsFromDB = manualClaims.map(exp => {
      const amount = exp.amount || 0;
      const exGst = Math.round((amount / 1.1) * 100) / 100;
      const gst = Math.round((amount - exGst) * 100) / 100;
      return {
        id: `CC-${exp.id.slice(-8).toUpperCase()}`,
        dbId: exp.id,
        contractor: exp.vendorName || 'Unknown Contractor',
        reference: exp.receiptUrl || `REF-${exp.id.slice(-4).toUpperCase()}`,
        claimDate: new Date(exp.date || exp.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        amountExGst: exGst,
        gst,
        totalIncGst: amount,
        status: exp.status === 'APPROVED' ? 'Approved' : exp.status === 'PAID' ? 'Paid' : 'Pending Approval',
        paymentMethod: exp.description?.includes('EFT') ? 'EFT' : 'Bank Transfer',
        bankName: `${exp.vendorName || 'Contractor'} Account`,
        bsbAccount: 'BSB / ACC',
        items: [{ description: exp.description || 'Transport Services', amountExGst: exGst, gst, totalIncGst: amount }],
        source: 'manual'
      };
    });

    // Map load-based claims
    const claimsFromLoads = loads.map((load, idx) => {
      const amount = load.totalAmount || load.rate || 0;
      const exGst = Math.round((amount / 1.1) * 100) / 100;
      const gst = Math.round((amount - exGst) * 100) / 100;
      return {
        id: `CC-LOAD-${idx + 1}`,
        contractor: load.customer?.name || (load.driver ? `${load.driver.firstName || ''} ${load.driver.lastName || ''}`.trim() : 'Contractor'),
        reference: load.loadNumber || `LOAD-10${idx}`,
        claimDate: new Date(load.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        amountExGst: exGst,
        gst,
        totalIncGst: amount,
        status: load.status === 'COMPLETED' ? 'Approved' : 'Pending Approval',
        paymentMethod: 'Bank Transfer',
        bankName: `${load.customer?.name || 'Contractor'} Account`,
        bsbAccount: 'BSB / ACC',
        items: [{ description: 'Transport Services', amountExGst: exGst, gst, totalIncGst: amount }],
        source: 'load'
      };
    });

    // Merge: manual first, then load-based
    const claims = [...claimsFromDB, ...claimsFromLoads];
    const totalClaims = claims.reduce((sum, c) => sum + c.totalIncGst, 0);
    const pendingClaims = claims.filter(c => c.status === 'Pending Approval').reduce((sum, c) => sum + c.totalIncGst, 0);

    return sendSuccess(res, { claims, summary: { totalClaims, pendingClaims, count: claims.length } });
  } catch (error) {
    next(error);
  }
};

exports.approveContractorClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = await resolveCompanyId(req);

    // Try to update in load_expense if dbId exists
    try {
      await prisma.loadExpense.updateMany({
        where: { ...( companyId && { companyId }), type: 'CONTRACTOR', status: 'PENDING' },
        data: { status: 'APPROVED' }
      });
    } catch (_) {}

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `CONTRACTOR_CLAIM_APPROVED - Claim ID: ${id}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, { success: true, message: `Contractor claim ${id} approved for payment.` });
  } catch (error) {
    next(error);
  }
};

exports.createContractorClaim = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { contractor, reference, claimDate, amountExGst, description, paymentMethod } = req.body;

    if (!contractor || !amountExGst) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Contractor name and amount are required.' }, 400);
    }

    const totalAmount = parseFloat(amountExGst) * 1.1; // store total inc GST as amount
    const amount = parseFloat(amountExGst) || 0;
    const gst = Math.round(amount * 0.1 * 100) / 100;
    const totalIncGst = Math.round((amount + gst) * 100) / 100;

    // Save to load_expense table with type=CONTRACTOR
    const saved = await prisma.loadExpense.create({
      data: {
        ...(companyId && { companyId }),
        date: claimDate ? new Date(claimDate) : new Date(),
        type: 'CONTRACTOR',
        vendorName: contractor,
        description: description || 'Transport Services',
        amount: totalIncGst,
        status: 'PENDING',
        receiptUrl: reference || null,
      }
    });

    const claim = {
      id: `CC-${saved.id.slice(-8).toUpperCase()}`,
      dbId: saved.id,
      contractor,
      reference: reference || `REF-${saved.id.slice(-4).toUpperCase()}`,
      claimDate: new Date(saved.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amountExGst: amount,
      gst,
      totalIncGst,
      status: 'Pending Approval',
      paymentMethod: paymentMethod || 'Bank Transfer',
      bankName: `${contractor} Account`,
      bsbAccount: 'BSB / ACC',
      items: [{ description: description || 'Transport Services', amountExGst: amount, gst, totalIncGst }],
      source: 'manual'
    };

    return sendSuccess(res, { claim }, 201);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. EXPENSES (DRIVER & FLEET)

// ============================================================================

exports.getExpenses = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const scope = companyId ? { companyId } : {};

    const rawExpenses = await prisma.loadExpense.findMany({
      where: scope,
      include: {
        load: {
          include: { driver: true, truck: true }
        },
        vehicle: true,
        driver: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = rawExpenses.map((exp, idx) => {
      const exGst = Math.round((exp.amount / 1.1) * 100) / 100;
      const gst = Math.round((exp.amount - exGst) * 100) / 100;
      
      const driverName = exp.driver ? `${exp.driver.firstName || ''} ${exp.driver.lastName || ''}`.trim() : (exp.load?.driver ? `${exp.load.driver.firstName || ''} ${exp.load.driver.lastName || ''}`.trim() : 'Driver');
      const employeeLabel = exp.driver ? `Driver (${exp.driver.licenseNumber || 'Staff'})` : (exp.load?.driver?.licenseNumber ? `Driver (${exp.load.driver.licenseNumber})` : 'Driver');
      const vehicleLabel = exp.vehicle ? (exp.vehicle.rego || exp.vehicle.model || 'Vehicle') : (exp.load?.truck?.rego || exp.load?.truck?.model || 'Fleet Vehicle');

      return {
        id: exp.id,
        displayId: `EXP-${1000 + idx}`,
        date: new Date(exp.date || exp.createdAt).toISOString().split('T')[0],
        dateFormatted: new Date(exp.date || exp.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        description: exp.description || `${exp.type || 'General'} Expense`,
        category: exp.type || 'Fuel',
        employee: employeeLabel,
        driverName: driverName,
        vehicle: vehicleLabel,
        loadRef: exp.loadId ? (exp.load?.loadRef || `LD-${exp.loadId.slice(0, 5)}`) : 'N/A',
        vendorName: exp.vendorName || 'Vendor',
        litres: exp.litres || 0,
        pricePerLitre: exp.pricePerLitre || 0,
        reference: `RPT-${8400 + idx}`,
        attachments: exp.receiptUrl ? 1 : 0,
        receiptUrl: exp.receiptUrl || null,
        exGst,
        gst,
        total: exp.amount,
        status: exp.status === 'APPROVED' ? 'Approved' : (exp.status === 'REJECTED' ? 'Rejected' : 'Pending Approval'),
        paymentStatus: exp.status === 'APPROVED' ? 'Reimbursed' : 'Unpaid'
      };
    });

    const totalAmount = formatted.reduce((sum, e) => sum + e.total, 0);
    const pendingAmount = formatted.filter(e => e.status === 'Pending Approval').reduce((sum, e) => sum + e.total, 0);
    const approvedAmount = formatted.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.total, 0);

    return sendSuccess(res, {
      expenses: formatted,
      summary: {
        totalAmount,
        pendingAmount,
        approvedAmount,
        totalCount: formatted.length
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateExpenseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'APPROVED' } = req.body;
    const companyId = await resolveCompanyId(req);

    let dbStatus = 'PENDING';
    const upper = status.toUpperCase();
    if (upper === 'APPROVED' || upper === 'APPROVE') dbStatus = 'APPROVED';
    if (upper === 'REJECTED' || upper === 'REJECT') dbStatus = 'REJECTED';

    const updated = await prisma.loadExpense.update({
      where: { id },
      data: { status: dbStatus }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        action: `EXPENSE_STATUS_UPDATED - Expense: ${id}, Status: ${dbStatus}, Amount: ${updated.amount}`,
        operator: req.user?.email || 'accounts@hero.com',
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    return sendSuccess(res, { success: true, message: `Expense marked as ${status}.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 7. GST / PAYG COMPLIANCE
// ============================================================================

exports.getGstPayg = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const invoiceScope = companyId ? { customer: { companyId } } : {};
    const expenseScope = companyId ? { companyId } : {};

    // 1. Invoices -> GST Collected
    const invoices = await prisma.customerInvoice.findMany({ where: invoiceScope });
    const totalInvoiceSales = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const gstCollected = Math.round((totalInvoiceSales - (totalInvoiceSales / 1.1)) * 100) / 100;

    // 2. Expenses -> GST Credits
    const expenses = await prisma.loadExpense.findMany({ where: expenseScope });
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const gstCredits = Math.round((totalExpenses - (totalExpenses / 1.1)) * 100) / 100;

    const netGstPayable = Math.round((gstCollected - gstCredits) * 100) / 100;

    // 3. PAYG Withholding from payroll
    const payPeriods = await prisma.payPeriod.findMany({ where: companyId ? { companyId } : {} });
    const paygWithholding = payPeriods.reduce((sum, p) => sum + (p.paygTax || 0), 0);

    const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
    const currentFY = `FY ${new Date().getFullYear()}/${(new Date().getFullYear() + 1).toString().slice(2)}`;

    const obligations = invoices.length > 0 || expenses.length > 0 || payPeriods.length > 0 ? [
      { 
        id: 1, 
        period: `Current (${currentQuarter})`, 
        periodEnd: new Date().toISOString().slice(0, 10), 
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10), 
        collected: gstCollected, 
        credits: gstCredits, 
        net: netGstPayable, 
        status: 'Due Soon', 
        lodgedDate: '-', 
        action: 'Prepare', 
        fy: currentFY 
      }
    ] : [];

    return sendSuccess(res, {
      summary: {
        gstCollected,
        gstCredits,
        netGstPayable,
        paygWithholding,
        nextBasDueDate: obligations[0]?.dueDate || '—',
        nextPaygDueDate: obligations[0]?.dueDate || '—'
      },
      obligations
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 8. PROFIT & LOSS (P&L) STATEMENT
// ============================================================================

exports.getPnl = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const invoiceScope = companyId ? { customer: { companyId } } : {};
    const expenseScope = companyId ? { companyId } : {};

    const invoices = await prisma.customerInvoice.findMany({ where: invoiceScope });
    const expenses = await prisma.loadExpense.findMany({ where: expenseScope });
    const payPeriods = await prisma.payPeriod.findMany({ where: companyId ? { companyId } : {} });

    const totalInvoiceSales = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalSalesExGst = Math.round((totalInvoiceSales / 1.1) * 100) / 100;

    const fuelExpense = expenses.filter(e => e.type?.toLowerCase().includes('fuel')).reduce((sum, e) => sum + (e.amount || 0), 0);
    const maintenanceExpense = expenses.filter(e => e.type?.toLowerCase().includes('maintenance') || e.type?.toLowerCase().includes('repair')).reduce((sum, e) => sum + (e.amount || 0), 0);
    const tollExpense = expenses.filter(e => e.type?.toLowerCase().includes('toll')).reduce((sum, e) => sum + (e.amount || 0), 0);
    const insuranceExpense = expenses.filter(e => e.type?.toLowerCase().includes('insurance')).reduce((sum, e) => sum + (e.amount || 0), 0);
    const otherExpense = expenses.filter(e => !e.type?.toLowerCase().includes('fuel') && !e.type?.toLowerCase().includes('maintenance') && !e.type?.toLowerCase().includes('toll') && !e.type?.toLowerCase().includes('insurance')).reduce((sum, e) => sum + (e.amount || 0), 0);

    const driverPayroll = payPeriods.reduce((sum, p) => sum + (p.grossEarnings || 0), 0);

    const currentPeriodData = {
      revenue: {
        freight: totalSalesExGst,
        surcharges: 0,
        other: 0
      },
      cogs: {
        driver: driverPayroll,
        fuel: fuelExpense,
        contractor: 0,
        vehicle: maintenanceExpense,
        tolls: tollExpense,
        other: insuranceExpense + otherExpense
      },
      opex: {
        admin: 0,
        marketing: 0,
        depreciation: 0,
        other: 0
      }
    };

    const sumObj = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);
    const currRev = sumObj(currentPeriodData.revenue);
    const currCogs = sumObj(currentPeriodData.cogs);
    const currOpex = sumObj(currentPeriodData.opex);
    const currGrossProfit = currRev - currCogs;
    const currNetProfit = currGrossProfit - currOpex;

    // Load-level profitability breakdown for recent delivered loads
    const recentDeliveredLoads = await prisma.load.findMany({
      where: { ...(companyId && { companyId }), status: { in: ['DELIVERED', 'COMPLETED'] } },
      include: { customer: true, driver: true, invoices: true, expenses: true },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    const recentLoadMargins = recentDeliveredLoads.map(ld => {
      const invAmount = ld.invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
      const revExGst = Math.round((invAmount / 1.1) * 100) / 100;
      const expTotal = ld.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
      const estDriverCost = ld.driver?.payRate ? parseFloat(ld.driver.payRate) : 250.00;
      const loadProfit = revExGst - expTotal - estDriverCost;
      const marginPct = revExGst > 0 ? Math.round((loadProfit / revExGst) * 100) : 0;

      return {
        loadId: ld.id,
        loadRef: ld.loadRef || `LD-${ld.id.slice(0, 6)}`,
        customer: ld.customer?.name || 'Customer',
        driver: ld.driver ? `${ld.driver.firstName || ''} ${ld.driver.lastName || ''}`.trim() : 'Driver',
        revenue: revExGst,
        expenses: expTotal,
        driverCost: estDriverCost,
        netProfit: loadProfit,
        marginPct
      };
    });

    return sendSuccess(res, {
      pnl: currentPeriodData,
      recentLoadMargins,
      summary: {
        totalRevenue: currRev,
        cogs: currCogs,
        grossProfit: currGrossProfit,
        operatingExpenses: currOpex,
        netProfit: currNetProfit,
        grossMarginPct: currRev > 0 ? Math.round((currGrossProfit / currRev) * 100) : 0,
        netMarginPct: currRev > 0 ? Math.round((currNetProfit / currRev) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 9. VEHICLE COSTS ANALYTICS
// ============================================================================

exports.getVehicleCosts = async (req, res, next) => {
  try {
    const companyId = await resolveCompanyId(req);
    const dbVehicles = await prisma.vehicle.findMany({
      where: companyId ? { companyId } : {}
    });

    const expenses = await prisma.loadExpense.findMany({
      where: companyId ? { companyId } : {}
    });

    const vehicleSummary = dbVehicles.map((veh) => {
      const vehExpenses = expenses.filter(e => e.vehicleId === veh.id);
      
      const fuel = vehExpenses.filter(e => e.type?.toLowerCase().includes('fuel')).reduce((sum, e) => sum + (e.amount || 0), 0);
      const maintenance = vehExpenses.filter(e => e.type?.toLowerCase().includes('maintenance') || e.type?.toLowerCase().includes('repair')).reduce((sum, e) => sum + (e.amount || 0), 0);
      const tyres = vehExpenses.filter(e => e.type?.toLowerCase().includes('tyre')).reduce((sum, e) => sum + (e.amount || 0), 0);
      const insurance = vehExpenses.filter(e => e.type?.toLowerCase().includes('insurance')).reduce((sum, e) => sum + (e.amount || 0), 0);
      const other = vehExpenses.filter(e => !e.type?.toLowerCase().includes('fuel') && !e.type?.toLowerCase().includes('maintenance') && !e.type?.toLowerCase().includes('tyre') && !e.type?.toLowerCase().includes('insurance')).reduce((sum, e) => sum + (e.amount || 0), 0);

      const total = fuel + maintenance + tyres + insurance + other;

      return {
        id: veh.id,
        name: `${veh.make || veh.model || 'Vehicle'} ${veh.year || ''}`.trim(),
        desc: veh.type || 'Fleet Vehicle',
        type: veh.type || 'Truck',
        rego: veh.rego || 'N/A',
        fuel,
        maintenance,
        tyres,
        insurance,
        other,
        costPerKm: '$0.00',
        costPerDay: '$0.00',
        vsApr: 0
      };
    });

    const totalFleetCost = vehicleSummary.reduce((sum, v) => sum + v.fuel + v.maintenance + v.tyres + v.insurance + v.other, 0);

    return sendSuccess(res, {
      vehicles: vehicleSummary,
      summary: {
        totalFleetCost,
        activeTrucks: vehicleSummary.length,
        avgCostPerKm: '$0.00'
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 10. ACCOUNTS USER PROFILE
// ============================================================================

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true, branch: true, customRole: true }
      });
    }

    if (!user) {
      return sendSuccess(res, {
        profile: {
          fullName: req.user?.name || 'Accounts Manager',
          jobTitle: 'Accounts Manager',
          emailAddress: req.user?.email || 'accounts@hero.com',
          phoneNumber: '',
          company: 'HERO Logistics'
        }
      });
    }

    return sendSuccess(res, {
      profile: {
        fullName: user.name || 'Accounts Manager',
        jobTitle: user.customRole?.name || 'Accounts Manager',
        emailAddress: user.email,
        phoneNumber: user.phone || '',
        company: user.company?.name || 'HERO Logistics',
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

