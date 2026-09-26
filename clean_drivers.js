const prisma = require('./src/utils/prismaClient');

async function main() {
  const drivers = await prisma.driver.findMany();
  console.log('Current drivers count in DB:', drivers.length);

  await prisma.vehicle.updateMany({ data: { currentDriverId: null } }).catch(e => console.error('Vehicle err:', e.message));
  await prisma.load.updateMany({ data: { driverId: null } }).catch(e => console.error('Load err:', e.message));
  
  await prisma.shift.deleteMany({}).catch(e => console.error('Shift err:', e.message));
  await prisma.timesheet.deleteMany({}).catch(e => console.error('Timesheet err:', e.message));
  await prisma.preStartChecklist.deleteMany({}).catch(e => console.error('PreStart err:', e.message));
  await prisma.assetAssignment.deleteMany({}).catch(e => console.error('AssetAssignment err:', e.message));
  await prisma.telemetryLog.deleteMany({}).catch(e => console.error('Telemetry err:', e.message));
  await prisma.equipmentSwap.deleteMany({}).catch(e => console.error('EquipmentSwap err:', e.message));
  await prisma.deliveryPOD.deleteMany({}).catch(e => console.error('DeliveryPOD err:', e.message));
  await prisma.vinScanEvent.deleteMany({}).catch(e => console.error('VinScan err:', e.message));
  await prisma.payPeriod.deleteMany({}).catch(e => console.error('PayPeriod err:', e.message));

  await prisma.driverAllowance.deleteMany({}).catch(e => console.error('Allowance err:', e.message));
  await prisma.driverDeduction.deleteMany({}).catch(e => console.error('Deduction err:', e.message));
  await prisma.driverLeaveRequest.deleteMany({}).catch(e => console.error('Leave err:', e.message));
  await prisma.driverPayRate.deleteMany({}).catch(e => console.error('PayRate err:', e.message));
  await prisma.driverActivity.deleteMany({}).catch(e => console.error('Activity err:', e.message));
  await prisma.driverMessage.deleteMany({}).catch(e => console.error('Message err:', e.message));
  await prisma.driverSuperInfo.deleteMany({}).catch(e => console.error('SuperInfo err:', e.message));
  await prisma.performanceLog.deleteMany({}).catch(e => console.error('Performance err:', e.message));
  await prisma.document.deleteMany({}).catch(e => console.error('Document err:', e.message));

  const result = await prisma.driver.deleteMany({});
  console.log('Successfully cleaned all sample/dummy drivers! Deleted count:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
