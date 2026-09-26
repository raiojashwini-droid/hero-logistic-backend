const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/AccountsPortalController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

// Apply authentication and tenant isolation across all Accounts Portal routes
router.use(verifyToken, resolveTenant);

// 1. Accounts Dashboard
router.get('/dashboard', ctrl.getDashboard);

// 2. Invoices (Review & Sent)
router.get('/invoices', ctrl.getInvoices);
router.post('/invoices/manual', ctrl.createManualInvoice);
router.put('/invoices/:id/approve', ctrl.approveInvoice);
router.put('/invoices/:id/send', ctrl.approveInvoice);
router.put('/invoices/:id', ctrl.editInvoice);
router.delete('/invoices/:id', ctrl.deleteInvoice);

// 3. Payments & Allocations
router.get('/payments', ctrl.getPayments);
router.post('/payments/record', ctrl.recordPayment);
router.post('/payments/allocate', ctrl.recordPayment);
router.post('/payments/refund', ctrl.refundPayment);

// 4. Payroll & Employee Pay
router.get('/payroll/runs', ctrl.getPayrollRuns);
router.post('/payroll/calculate', ctrl.calculatePayroll);
router.put('/payroll/runs/:id/approve', ctrl.approvePayrollRun);
router.put('/payroll/runs/:id/disburse', ctrl.disburseEmployeePay);
router.put('/payroll/runs/:id/cancel', ctrl.cancelPayrollRun);
router.post('/employee-pay/disburse', ctrl.disburseEmployeePay);

// 5. Contractor Pay
router.get('/contractors/claims', ctrl.getContractorClaims);
router.post('/contractors/claims', ctrl.createContractorClaim);
router.put('/contractors/claims/:id/approve', ctrl.approveContractorClaim);

// 6. Expenses
router.get('/expenses', ctrl.getExpenses);
router.put('/expenses/:id/status', ctrl.updateExpenseStatus);

// 7. GST / PAYG Compliance
router.get('/tax/gst-payg', ctrl.getGstPayg);

// 8. Profit & Loss (P&L)
router.get('/pnl', ctrl.getPnl);

// 9. Vehicle Costs Analytics
router.get('/vehicle-costs', ctrl.getVehicleCosts);

// 10. Profile
router.get('/profile', ctrl.getProfile);

module.exports = router;
