const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/CompanyAdminPortalController');
const { verifyToken } = require('../middlewares/auth');
const { resolveTenant } = require('../middlewares/tenantResolver');

// Apply auth & tenant resolver middleware across all Company Admin routes
router.use(verifyToken, resolveTenant);

// Profile
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);

// 1. Command Centre / Dashboard
router.get('/command-centre', ctrl.getCommandCentre);
router.get('/dashboard', ctrl.getCommandCentre);

// 2. Loads
router.get('/loads', ctrl.getLoads);
router.post('/loads', ctrl.createLoad);
router.get('/loads/:id', ctrl.getLoadById);
router.get('/loads/:id/stops', ctrl.getLoadStops);
router.post('/loads/:id/stops', ctrl.createLoadStop);
router.put('/loads/:id/stops/:stopId', ctrl.updateLoadStop);
router.delete('/loads/:id/stops/:stopId', ctrl.deleteLoadStop);
router.get('/loads/:id/expenses', ctrl.getLoadExpenses);
router.post('/loads/:id/expenses', ctrl.createLoadExpense);
router.delete('/loads/:id/expenses/:expenseId', ctrl.deleteLoadExpense);
router.get('/loads/:id/invoices', ctrl.getLoadInvoices);
router.post('/loads/:id/invoices', ctrl.createLoadInvoice);
router.delete('/loads/:id/invoices/:invoiceId', ctrl.deleteLoadInvoice);
router.get('/loads/:id/documents', ctrl.getLoadDocuments);
router.post('/loads/:id/documents', ctrl.createLoadDocument);
router.put('/loads/:id', ctrl.updateLoad);
router.delete('/loads/:id', ctrl.deleteLoad);

// 3. Live Tracking
router.get('/live-tracking', ctrl.getLiveTracking);
router.put('/live-tracking/vehicles/:vehicleId/status', ctrl.updateVehicleStatus);
router.post('/live-tracking/vehicles/:vehicleId/telemetry', ctrl.pushTelemetry);

// 4. Drivers
router.get('/drivers', ctrl.getDrivers);
router.post('/drivers', ctrl.createDriver);
router.get('/drivers/:id/expenses', ctrl.getDriverExpenses);
router.delete('/drivers/:id', ctrl.deleteDriver);

// 5. Vehicles
router.get('/vehicles', ctrl.getVehicles);
router.post('/vehicles', ctrl.createVehicle);

// 6. Branches — full CRUD
router.get('/branches', ctrl.getBranches);
router.post('/branches', ctrl.createBranch);
router.put('/branches/:id', ctrl.updateBranch);
router.delete('/branches/:id', ctrl.deleteBranch);


// 7. Assets
router.get('/assets', ctrl.getAssets);
router.get('/assets/export', ctrl.exportAssets);
router.post('/assets', ctrl.createAsset);
router.get('/assets/:id', ctrl.getAssetById);
router.put('/assets/:id', ctrl.updateAsset);
router.delete('/assets/:id', ctrl.deleteAsset);
router.post('/assets/:id/assignments', ctrl.createAssetAssignment);
router.post('/assets/:id/maintenance', ctrl.createAssetMaintenance);
router.post('/assets/:id/documents', ctrl.createAssetDocument);

// 8. Warehouse
router.get('/warehouse', ctrl.getWarehouses);
router.post('/warehouse', ctrl.createWarehouse);
router.put('/warehouse/:id', ctrl.updateWarehouse);
router.delete('/warehouse/:id', ctrl.deleteWarehouse);
router.get('/warehouse/:id/locations', ctrl.getWarehouseLocations);
router.post('/warehouse/:id/locations', ctrl.createWarehouseLocation);
router.delete('/warehouse/locations/:locationId', ctrl.deleteWarehouseLocation);

// Warehouse Sub-resources (Stock, Movements, Pick Tasks, Staff, Equipment)
router.get('/warehouse/:id/stock', ctrl.getWarehouseStock);
router.post('/warehouse/:id/stock', ctrl.createWarehouseStock);
router.get('/warehouse/:id/movements', ctrl.getWarehouseMovements);
router.post('/warehouse/:id/movements', ctrl.createWarehouseMovement);
router.get('/warehouse/:id/pick-tasks', ctrl.getWarehousePickTasks);
router.post('/warehouse/:id/pick-tasks', ctrl.createWarehousePickTask);
router.get('/warehouse/:id/staff', ctrl.getWarehouseStaff);
router.post('/warehouse/:id/staff', ctrl.createWarehouseStaff);
router.get('/warehouse/:id/equipment', ctrl.getWarehouseEquipment);
router.post('/warehouse/:id/equipment', ctrl.createWarehouseEquipment);

router.get('/warehouse/:id/sub/:subType', ctrl.getWarehouseSubData);

// 9. Pricing & Rate Matrix
router.get('/pricing', ctrl.getPricing);                                              // subscription plans (legacy)
router.get('/pricing/stats', ctrl.getPricingStats);                                   // KPI stats
router.get('/pricing/lanes', ctrl.getLanePricing);                                    // list lane rules
router.post('/pricing/lanes', ctrl.createLanePricing);                                // add lane rule
router.put('/pricing/lanes/:id', ctrl.updateLanePricing);                             // edit lane rule
router.delete('/pricing/lanes/:id', ctrl.deleteLanePricing);                          // remove lane rule
router.post('/pricing/lanes/:id/duplicate', ctrl.duplicateLanePricing);              // clone lane rule
router.get('/pricing/vehicle-rates', ctrl.getVehicleRates);                           // list vehicle rates
router.post('/pricing/vehicle-rates', ctrl.createVehicleRate);                        // add vehicle rate
router.put('/pricing/vehicle-rates/:id', ctrl.updateVehicleRate);                     // edit vehicle rate
router.get('/pricing/fuel-surcharge', ctrl.getFuelSurcharge);                         // fuel surcharge data
router.post('/pricing/fuel-surcharge', ctrl.updateFuelSurcharge);                     // update fuel surcharge
router.get('/pricing/customer-rates', ctrl.getCustomerRates);                         // customer rate cards

// 10. Payroll — Full CRUD
router.get('/payroll', ctrl.getPayroll);                                               // stats + payroll runs + timesheets
router.post('/payroll/runs', ctrl.createPayrollRun);                                   // create new payroll run
router.put('/payroll/runs/:id/status', ctrl.updatePayrollRunStatus);                   // update run status
router.get('/payroll/driver-pay', ctrl.getDriverPayBreakdown);                         // per-driver pay breakdown
router.get('/payroll/timesheets', ctrl.getTimesheetsSummary);                          // timesheet summary
router.get('/payroll/export', ctrl.exportPayroll);                                     // CSV export data

// Driver Load Schedule Routes
router.get('/payroll/driver-load-schedules', ctrl.getDriverLoadSchedule);                  // list route pay rates
router.post('/payroll/driver-load-schedules', ctrl.createDriverLoadSchedule);               // add route pay rate
router.put('/payroll/driver-load-schedules/:id', ctrl.updateDriverLoadSchedule);            // update route pay rate
router.delete('/payroll/driver-load-schedules/:id', ctrl.deleteDriverLoadSchedule);         // delete route pay rate

router.get('/payroll/load-schedule', ctrl.getDriverLoadSchedule);
router.post('/payroll/load-schedule', ctrl.createDriverLoadSchedule);
router.put('/payroll/load-schedule/:id', ctrl.updateDriverLoadSchedule);
router.delete('/payroll/load-schedule/:id', ctrl.deleteDriverLoadSchedule);

// 11. Finance — Full CRUD
router.get('/finance', ctrl.getFinance);
router.post('/finance/invoices', ctrl.createInvoice);
router.put('/finance/invoices/:id/status', ctrl.updateInvoiceStatus);
router.delete('/finance/invoices/:id', ctrl.deleteInvoice);
router.get('/finance/export', ctrl.exportFinance);

// 12. Documents — Full Vault CRUD
router.get('/documents', ctrl.getDocuments);                                           // list all documents
router.get('/documents/stats', ctrl.getDocumentStats);                                 // category KPI counts
router.post('/documents', ctrl.createDocument);                                        // upload / create document
router.delete('/documents/:id', ctrl.deleteDocument);                                  // delete from vault

// 13. Reports & Analytics
router.get('/reports', ctrl.getReports);
router.post('/reports/custom', ctrl.createCustomReport);
router.post('/reports/schedules', ctrl.createReportSchedule);
router.get('/reports/export', ctrl.exportReports);
router.post('/reports/favourites/toggle', ctrl.toggleFavouriteReport);

// 14. Messages
router.get('/messages', ctrl.getMessages);
router.post('/messages/send', ctrl.sendMessage);
router.post('/messages/broadcasts', ctrl.createBroadcast);
router.post('/messages/communications', ctrl.createCustomerCommunication);

// 15. Support & Knowledge Base
router.get('/support-tickets', ctrl.getSupportAndKb);
router.get('/knowledge-base', ctrl.getSupportAndKb);

// 16. Roles & Permissions
router.get('/roles-permissions', ctrl.getRolesAndPermissions);

// 17. Settings
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);
router.put('/security-settings', ctrl.updateSecuritySettings);
router.get('/audit-logs', ctrl.getAuditLogs);
router.delete('/audit-logs/:id', ctrl.deleteAuditLog);

// 18. Safety Checklists
router.get('/safety-checklists', ctrl.getSafetyChecklists);
router.post('/safety-checklists', ctrl.createSafetyChecklist);
router.put('/safety-checklists/:id', ctrl.updateSafetyChecklist);
router.delete('/safety-checklists/:id', ctrl.deleteSafetyChecklist);

// 19. Delivery Issues
router.get('/delivery-issues', ctrl.getDeliveryIssues);
router.put('/delivery-issues/:id/status', ctrl.updateDeliveryIssueStatus);

// 20. Customers
const CustomerController = require('../controllers/CustomerController');
router.get('/customers-portal', CustomerController.getPortalData);
router.get('/customers', CustomerController.getAll);
router.delete('/customers/all', CustomerController.deleteAll);
router.delete('/customers/:id', CustomerController.delete);

// 21. Subscription & Billing
router.get('/subscription-billing', ctrl.getSubscriptionBilling);
router.get('/subscription-billing/plans', ctrl.getAvailableSubscriptionPlans);
router.get('/subscription-billing/invoices', ctrl.getSubscriptionInvoices);
router.put('/subscription-billing/plan', ctrl.updateSubscriptionPlan);

// Utility: one-time cleanup of wrongly-defaulted driver fields
router.get('/cleanup-driver-defaults', ctrl.cleanupDriverDefaults);

module.exports = router;
