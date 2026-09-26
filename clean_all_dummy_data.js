const prisma = require('./src/utils/prismaClient');

async function cleanAllDummyData() {
  console.log('--- Starting Complete Dummy Data Cleanup ---');
  try {
    // 1. Warehouse & Inventory
    await prisma.itemMovement.deleteMany({});
    console.log('✓ Cleared itemMovement');

    await prisma.loadItem.deleteMany({});
    console.log('✓ Cleared loadItem');

    await prisma.inboundReceipt.deleteMany({});
    console.log('✓ Cleared inboundReceipt');

    await prisma.stagingArea.deleteMany({});
    console.log('✓ Cleared stagingArea');

    await prisma.loadLane.deleteMany({});
    console.log('✓ Cleared loadLane');

    if (prisma.warehouseLabelPrint) {
      await prisma.warehouseLabelPrint.deleteMany({}).catch(() => {});
    }
    if (prisma.printSpoolerJob) {
      await prisma.printSpoolerJob.deleteMany({}).catch(() => {});
    }

    // 2. Loads, Routes & Deliveries
    await prisma.routeStop.deleteMany({});
    await prisma.loadActivity.deleteMany({});
    await prisma.loadExpense.deleteMany({});
    await prisma.proofPhoto.deleteMany({}).catch(() => {});
    await prisma.deliveryPOD.deleteMany({}).catch(() => {});
    await prisma.vinScanEvent.deleteMany({}).catch(() => {});
    await prisma.load.deleteMany({});
    console.log('✓ Cleared loads & route stops');

    // 3. Yard Tasks & Checklists
    if (prisma.yardTask) {
      await prisma.yardTask.deleteMany({}).catch(() => {});
      console.log('✓ Cleared yardTasks');
    }
    if (prisma.checklistItemResponse) {
      await prisma.checklistItemResponse.deleteMany({}).catch(() => {});
    }
    if (prisma.preStartChecklist) {
      await prisma.preStartChecklist.deleteMany({}).catch(() => {});
    }
    if (prisma.driverIncident) {
      await prisma.driverIncident.deleteMany({}).catch(() => {});
    }
    if (prisma.offlineSyncItem) {
      await prisma.offlineSyncItem.deleteMany({}).catch(() => {});
    }

    // 4. Shifts & Timesheets
    if (prisma.timesheetEvent) {
      await prisma.timesheetEvent.deleteMany({}).catch(() => {});
    }
    if (prisma.timesheet) {
      await prisma.timesheet.deleteMany({}).catch(() => {});
    }
    if (prisma.shift) {
      await prisma.shift.deleteMany({}).catch(() => {});
    }

    // 5. Invoices, Billing, Tickets, Reports & Audit Logs
    if (prisma.customerInvoice) {
      await prisma.customerInvoice.deleteMany({}).catch(() => {});
    }
    if (prisma.ticketReply) {
      await prisma.ticketReply.deleteMany({}).catch(() => {});
    }
    if (prisma.supportTicket) {
      await prisma.supportTicket.deleteMany({}).catch(() => {});
    }
    if (prisma.billingRecord) {
      await prisma.billingRecord.deleteMany({}).catch(() => {});
    }
    if (prisma.report) {
      await prisma.report.deleteMany({}).catch(() => {});
    }
    if (prisma.auditLog) {
      await prisma.auditLog.deleteMany({}).catch(() => {});
    }

    // 6. Messages & Conversations
    if (prisma.message) {
      await prisma.message.deleteMany({}).catch(() => {});
    }
    if (prisma.conversationParticipant) {
      await prisma.conversationParticipant.deleteMany({}).catch(() => {});
    }
    if (prisma.conversation) {
      await prisma.conversation.deleteMany({}).catch(() => {});
    }

    // 7. Sales CRM mock data
    if (prisma.salesActivity) {
      await prisma.salesActivity.deleteMany({}).catch(() => {});
    }
    if (prisma.followUpTask) {
      await prisma.followUpTask.deleteMany({}).catch(() => {});
    }
    if (prisma.proposal) {
      await prisma.proposal.deleteMany({}).catch(() => {});
    }
    if (prisma.demoBooking) {
      await prisma.demoBooking.deleteMany({}).catch(() => {});
    }
    if (prisma.onboardingHandover) {
      await prisma.onboardingHandover.deleteMany({}).catch(() => {});
    }
    if (prisma.lead) {
      await prisma.lead.deleteMany({}).catch(() => {});
    }

    console.log('--- ✅ All Dummy Operational Data Cleaned Successfully! ---');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllDummyData();
