const prisma = require('./src/utils/prismaClient');

async function clearAllDriverData() {
  console.log('🗑️  Clearing ALL driver-related transactional data from DB...\n');
  try {
    const r1 = await prisma.checklistItemResponse.deleteMany({});
    console.log(`✅ ChecklistItemResponse: ${r1.count} deleted`);

    const r2 = await prisma.preStartChecklist.deleteMany({});
    console.log(`✅ PreStartChecklist: ${r2.count} deleted`);

    const r3 = await prisma.timesheetEvent.deleteMany({});
    console.log(`✅ TimesheetEvent: ${r3.count} deleted`);

    const r4 = await prisma.timesheet.deleteMany({});
    console.log(`✅ Timesheet: ${r4.count} deleted`);

    const r5 = await prisma.equipmentSwap.deleteMany({});
    console.log(`✅ EquipmentSwap: ${r5.count} deleted`);

    const r6 = await prisma.vinScanEvent.deleteMany({});
    console.log(`✅ VinScanEvent: ${r6.count} deleted`);

    const r7 = await prisma.deliveryPOD.deleteMany({});
    console.log(`✅ DeliveryPOD: ${r7.count} deleted`);

    const r8 = await prisma.proofPhoto.deleteMany({});
    console.log(`✅ ProofPhoto: ${r8.count} deleted`);

    const r9 = await prisma.loadActivity.deleteMany({});
    console.log(`✅ LoadActivity: ${r9.count} deleted`);

    const r10 = await prisma.loadExpense.deleteMany({});
    console.log(`✅ LoadExpense: ${r10.count} deleted`);

    const r11 = await prisma.loadItem.deleteMany({});
    console.log(`✅ LoadItem: ${r11.count} deleted`);

    const r12 = await prisma.routeStop.deleteMany({});
    console.log(`✅ RouteStop: ${r12.count} deleted`);

    const r13 = await prisma.load.deleteMany({});
    console.log(`✅ Load: ${r13.count} deleted`);

    const r14 = await prisma.payPeriod.deleteMany({});
    console.log(`✅ PayPeriod: ${r14.count} deleted`);

    const r15 = await prisma.shift.deleteMany({});
    console.log(`✅ Shift: ${r15.count} deleted`);

    const r16 = await prisma.message.deleteMany({});
    console.log(`✅ Message: ${r16.count} deleted`);

    const r17 = await prisma.conversationParticipant.deleteMany({});
    console.log(`✅ ConversationParticipant: ${r17.count} deleted`);

    const r18 = await prisma.conversation.deleteMany({});
    console.log(`✅ Conversation: ${r18.count} deleted`);

    const r19 = await prisma.offlineSyncItem.deleteMany({});
    console.log(`✅ OfflineSyncItem: ${r19.count} deleted`);

    const r20 = await prisma.document.deleteMany({});
    console.log(`✅ Document: ${r20.count} deleted`);

    const r21 = await prisma.customerInvoice.deleteMany({});
    console.log(`✅ CustomerInvoice: ${r21.count} deleted`);

    console.log('\n✅✅ ALL transactional data cleared successfully!');
    console.log('📋 Users and Driver profiles are kept intact.');
    console.log('🆕 You can now enter fresh data.\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

clearAllDriverData().finally(() => prisma.$disconnect());
