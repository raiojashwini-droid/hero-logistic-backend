const express = require('express');
const router = express.Router();
const DriverPortalController = require('../controllers/DriverPortalController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

router.use(verifyToken, resolveTenant);

// Core Driver Dashboard
router.get('/dashboard', DriverPortalController.getDashboard);
router.post('/status', DriverPortalController.updateStatus);

// Messages
router.get('/messages', DriverPortalController.getDriverMessages || DriverPortalController.getDashboard);
router.post('/messages', DriverPortalController.sendDriverMessage || DriverPortalController.sendQuickMessage);
router.post('/messages/mark-all-read', DriverPortalController.markAllMessagesRead);

// Checklist Context & Submission
router.get('/checklist-context', DriverPortalController.getChecklistContext);
router.post('/checklists', DriverPortalController.submitChecklist);

// Jobs, Active Run & Pickup
// Added routes for Driver Dashboard Pickup & Loading API
router.get('/payroll', DriverPortalController.getPayroll);
router.get('/pickup-load', DriverPortalController.getPickupLoad);
router.post('/pickup-load/item-status', DriverPortalController.updatePickupItemStatus);
router.post('/pickup-load/add-item', DriverPortalController.addPickupItem);
router.put('/pickup-load/item/:id', DriverPortalController.updatePickupItem);
router.delete('/pickup-load/item/:id', DriverPortalController.deletePickupItem);
router.post('/pickup-load/scan-vin', DriverPortalController.scanVinCode);
router.post('/pickup-load/confirm-pickup', DriverPortalController.confirmPickupLoad);

// Added routes for Driver Dashboard Delivery & POD API
router.get('/delivery-pod', DriverPortalController.getDeliveryPOD);
router.post('/delivery-pod/item-status', DriverPortalController.updateDeliveryItemStatus);
router.post('/delivery-pod/scan-vin', DriverPortalController.scanDeliveryVinCode);
router.post('/delivery-pod/confirm-delivery', DriverPortalController.confirmDeliveryPOD);

router.get('/active-run', DriverPortalController.getActiveRun);
router.get('/jobs', DriverPortalController.getJobs);
router.post('/jobs', DriverPortalController.createJobRequest);
router.delete('/jobs/:id', DriverPortalController.deleteJob);
router.get('/active-run', DriverPortalController.getActiveRun);
router.get('/pickup-load', DriverPortalController.getPickupLoad);
router.post('/pickup-load/item-status', DriverPortalController.updatePickupItemStatus);
router.post('/pickup-load/items', DriverPortalController.addPickupItem);

// Expenses
router.get('/expenses', DriverPortalController.getExpenses);
router.post('/expenses', DriverPortalController.addExpense);

// Documents & Compliance
router.get('/documents', DriverPortalController.getDriverDocuments);
router.post('/documents', DriverPortalController.uploadDriverDocument);

// Timesheets & Clock In/Out
router.get('/timesheets', DriverPortalController.getTimesheets);
router.post('/timesheets/clock', DriverPortalController.clockIn);
router.post('/timesheets/clock-in', DriverPortalController.clockIn);
router.post('/timesheets/clock-out', DriverPortalController.clockOut);
router.post('/timesheets/toggle-break', DriverPortalController.toggleBreak);
router.post('/timesheets/notes', DriverPortalController.addTimesheetNote);
router.post('/timesheets/submit', DriverPortalController.submitTimesheet);

// Payroll & Pay History
router.get('/payroll', DriverPortalController.getPayrollData);
router.post('/payroll/settings', DriverPortalController.updatePaymentSettings);
router.post('/payroll/bank', DriverPortalController.updateBankDetails);

// Trailer Swap & Equipment Change
router.get('/trailer-swap', DriverPortalController.getTrailerSwapData);
router.post('/trailer-swap', DriverPortalController.confirmTrailerSwap);

// Offline Sync
router.get('/offline-sync', DriverPortalController.getOfflineSyncData);
router.post('/offline-sync/all', DriverPortalController.syncAllQueue);
router.post('/offline-sync/retry', DriverPortalController.retryFailedSync);
router.post('/offline-sync/settings', DriverPortalController.updateSyncSettings);
router.post('/offline-sync/clear', DriverPortalController.clearStorageCache);

module.exports = router;

