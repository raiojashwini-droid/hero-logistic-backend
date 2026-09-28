const prisma = require('./src/utils/prismaClient');
const crypto = require('crypto');

async function testFixes() {
  console.log('=== MULTI-TENANT ISOLATION SECURITY AUDIT ===\n');

  let companyA = null;
  let companyB = null;

  try {
    await prisma.$connect();
    console.log('Database connected.');

    // 1. Create Company A and Company B
    companyA = await prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Alpha Company Test',
        tenantId: `COMP-A-${Date.now()}`
      }
    });

    companyB = await prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Beta Company Test (Brand New)',
        tenantId: `COMP-B-${Date.now()}`
      }
    });

    console.log(`Created Company A (${companyA.id}) & Company B (${companyB.id})`);

    // 2. Populate Company A with confidential business records
    const custA = await prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Alpha Customer Confidential',
        email: `alpha_${Date.now()}@cust.com`,
        companyId: companyA.id
      }
    });

    const userA = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Alpha User',
        email: `alpha_${Date.now()}@user.com`,
        password: 'Password123!',
        role: 'COMPANY_ADMIN',
        companyId: companyA.id
      }
    });

    const convA = await prisma.conversation.create({
      data: {
        id: crypto.randomUUID(),
        title: 'Alpha Secret Conversation',
        companyId: companyA.id,
        messages: {
          create: [{ senderId: userA.id, content: 'Top secret Alpha message' }]
        }
      }
    });

    const loadA = await prisma.load.create({
      data: {
        id: crypto.randomUUID(),
        loadRef: `PO-ALPHA-${Date.now()}`,
        type: 'General Freight',
        status: 'PLANNED',
        companyId: companyA.id,
        customerId: custA.id
      }
    });

    const itemA = await prisma.loadItem.create({
      data: {
        id: crypto.randomUUID(),
        loadId: loadA.id,
        sku: 'SKU-ALPHA-SECRET',
        description: 'Alpha High Value Freight',
        quantity: 100
      }
    });

    console.log('Populated Company A with secret records (Customer, User, Conversation, Load, Inventory Item)\n');

    // 3. Test Company B Query Scoping (Simulating Company B request context)
    const mockReqB = {
      tenantId: companyB.id,
      user: { role: 'COMPANY_ADMIN', companyId: companyB.id }
    };

    console.log('--- TEST 1: Warehouse Inventory Controller Scoping ---');
    const warehouseInvCtrl = require('./src/controllers/WarehouseInventoryController');
    let invResponseData = null;
    const mockResInv = {
      json: (payload) => { invResponseData = payload.data; },
      status: () => mockResInv
    };
    await warehouseInvCtrl.getInventory(mockReqB, mockResInv, () => {});

    console.log(`Company B Inventory Items Count: ${invResponseData?.length || 0}`);
    const invTestPassed = Array.isArray(invResponseData) && invResponseData.length === 0;
    if (invTestPassed) {
      console.log('✅ PASS: Company B inventory is completely 0 (No Company A items or mock items leaked!).');
    } else {
      console.error('❌ FAIL: Company B leaked inventory items!', invResponseData);
    }

    console.log('\n--- TEST 2: Messages Controller Scoping ---');
    const companyAdminCtrl = require('./src/controllers/CompanyAdminPortalController');
    let msgsResponseData = null;
    const mockResMsgs = {
      json: (payload) => { msgsResponseData = payload.data; },
      status: () => mockResMsgs
    };
    await companyAdminCtrl.getMessages(mockReqB, mockResMsgs, () => {});

    const bConvsCount = msgsResponseData?.conversations?.length || 0;
    const bUsersCount = msgsResponseData?.users?.length || 0;
    const bTotalConvsStat = msgsResponseData?.stats?.totalConversations || 0;

    console.log(`Company B Messages Data -> Convs: ${bConvsCount}, Users: ${bUsersCount}, Stat TotalConvs: ${bTotalConvsStat}`);
    const msgsTestPassed = bConvsCount === 0 && bTotalConvsStat === 0;
    if (msgsTestPassed) {
      console.log('✅ PASS: Company B messages & conversations are strictly 0.');
    } else {
      console.error('❌ FAIL: Company B leaked messages or fake stats!', msgsResponseData);
    }

    console.log('\n--- TEST 3: Driver & Vehicle Scoping ---');
    let driversResponse = null;
    const mockResDrivers = {
      json: (payload) => { driversResponse = payload.data; },
      status: () => mockResDrivers
    };
    await companyAdminCtrl.getDrivers(mockReqB, mockResDrivers, () => {});

    let vehiclesResponse = null;
    const mockResVehicles = {
      json: (payload) => { vehiclesResponse = payload.data; },
      status: () => mockResVehicles
    };
    await companyAdminCtrl.getVehicles(mockReqB, mockResVehicles, () => {});

    const bDriversCount = driversResponse?.length || 0;
    const bVehiclesCount = vehiclesResponse?.length || 0;
    console.log(`Company B Drivers Count: ${bDriversCount}, Vehicles Count: ${bVehiclesCount}`);
    const masterDataPassed = bDriversCount === 0 && bVehiclesCount === 0;
    if (masterDataPassed) {
      console.log('✅ PASS: Company B drivers and vehicles are strictly 0.');
    } else {
      console.error('❌ FAIL: Company B leaked drivers or vehicles!');
    }

    console.log('\n=============================================');
    if (invTestPassed && msgsTestPassed && masterDataPassed) {
      console.log('🎉 ALL MULTI-TENANT ISOLATION FIXES VERIFIED SUCCESSFULLY!');
    } else {
      console.error('❌ SOME ISOLATION TESTS FAILED');
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('Error during test execution:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup test data
    console.log('\nCleaning up test records...');
    if (companyA) {
      await prisma.loadItem.deleteMany({ where: { load: { companyId: companyA.id } } }).catch(() => {});
      await prisma.load.deleteMany({ where: { companyId: companyA.id } }).catch(() => {});
      await prisma.message.deleteMany({ where: { conversation: { companyId: companyA.id } } }).catch(() => {});
      await prisma.conversation.deleteMany({ where: { companyId: companyA.id } }).catch(() => {});
      await prisma.customer.deleteMany({ where: { companyId: companyA.id } }).catch(() => {});
      await prisma.user.deleteMany({ where: { companyId: companyA.id } }).catch(() => {});
      await prisma.company.delete({ where: { id: companyA.id } }).catch(() => {});
    }
    if (companyB) {
      await prisma.company.delete({ where: { id: companyB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
    console.log('Cleanup complete.');
  }
}

testFixes();
