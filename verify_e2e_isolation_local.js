const prisma = require('./src/utils/prismaClient');
const jwt = require('jsonwebtoken');

async function runVerification() {
  console.log('=== POST-FIX SECURITY VERIFICATION E2E TEST ===');
  
  let success = true;
  const report = [];

  async function request(token, method, path, body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch('http://localhost:5000/api/v1' + path, opts);
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    } catch(e) {
      console.error(e);
      return { status: 500, data: null };
    }
  }

  function logTest(testName, method, path, reqComp, targetComp, resStatus, isPassed, details) {
    report.push({ Test: testName, Method: method, Endpoint: path, RequestCompany: reqComp, TargetData: targetComp, Status: resStatus, Passed: isPassed, Details: details });
    if (!isPassed) success = false;
    console.log(`[${isPassed ? 'PASS' : 'FAIL'}] ${testName} -> ${resStatus} : ${details}`);
  }

  try {
    console.log('Setting up Data via Prisma...');
    // Clean up past data
    await prisma.company.deleteMany({ where: { name: { in: ['Test Company A', 'Test Company B'] } } }).catch(()=>{});

    const compA = await prisma.company.create({ data: { name: 'Test Company A' } });
    const compB = await prisma.company.create({ data: { name: 'Test Company B' } });

    const ts = Date.now();
    const userA = await prisma.user.create({ data: { name: 'User A', email: `a_${ts}@test.com`, password: 'pwd', role: 'COMPANY_ADMIN', companyId: compA.id } });
    const userB = await prisma.user.create({ data: { name: 'User B', email: `b_${ts}@test.com`, password: 'pwd', role: 'COMPANY_ADMIN', companyId: compB.id } });

    const custA = await prisma.customer.create({ data: { name: 'Customer A', companyId: compA.id, email: `cust_${ts}@a.com` } });
    
    // Create Driver for DriverActivity
    const driverA = await prisma.driver.create({ data: { firstName: 'Driver', lastName: 'A', companyId: compA.id, userId: userA.id, email: `driver_${ts}@a.com`, phone: '123' } });
    const actA = await prisma.driverActivity.create({ data: { driverId: driverA.id, title: 'Test Activity', description: 'Test Description' } });

    // Generate tokens
    const SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';
    const tokenA = jwt.sign({ userId: userA.id, role: userA.role, tenantId: compA.id, companyId: compA.id }, SECRET);
    const tokenB = jwt.sign({ userId: userB.id, role: userB.role, tenantId: compB.id, companyId: compB.id }, SECRET);

    console.log('Test data created on backend successfully!');

    console.log('Testing GET List Customers...');
    const res1 = await request(tokenB, 'GET', '/customers');
    const hasData = res1.data && res1.data.data && res1.data.data.find(c => c.id === custA.id);
    logTest('List Customers', 'GET', '/customers', 'Company B', 'Company A', res1.status, !hasData, hasData ? 'Found Comp A customer' : 'Isolated properly');

    console.log('Testing GET Customer By ID...');
    const res2 = await request(tokenB, 'GET', '/customers/' + custA.id);
    const passed2 = res2.status === 404 || res2.status === 403;
    logTest('Get Customer by ID', 'GET', '/customers/:id', 'Company B', 'Company A', res2.status, passed2, passed2 ? 'Access Denied (Expected)' : 'Gained access!');

    console.log('Testing UPDATE Driver Activity...');
    const res3 = await request(tokenB, 'PUT', '/drivers/activities/' + actA.id, { title: 'HACKED' });
    const passed3 = res3.status === 404 || res3.status === 403;
    logTest('Update Driver Activity by ID', 'PUT', '/drivers/activities/:id', 'Company B', 'Company A', res3.status, passed3, passed3 ? 'Blocked update' : 'Record modified!');

    console.log('Testing DELETE Driver Activity...');
    const res4 = await request(tokenB, 'DELETE', '/drivers/activities/' + actA.id);
    const passed4Final = (res4.status === 404 || res4.status === 403);
    logTest('Delete Driver Activity by ID', 'DELETE', '/drivers/activities/:id', 'Company B', 'Company A', res4.status, passed4Final, passed4Final ? 'Blocked delete' : 'Record was DELETED or returned 20x!');

    console.log('Testing CREATE Spoofing Notification Templates...');
    const res5 = await request(tokenA, 'POST', '/notification-templates', { title: 'Spoofed Tpl', body: 'x', companyId: compB.id });
    const templateCreated = res5.data && res5.data.data;
    const isSpoofBlocked = templateCreated && templateCreated.companyId === compA.id;
    logTest('Create Spoofing', 'POST', '/notification-templates', 'Company A', 'Company B', res5.status, isSpoofBlocked, isSpoofBlocked ? 'Forced to Comp A' : 'Spoofed to Comp B!');
    
    console.log('Testing GET List Notification Templates Leakage...');
    const res6 = await request(tokenB, 'GET', '/notification-templates');
    const templatesList = res6.data && res6.data.data;
    const seesSpoofed = templatesList && templatesList.length > 0;
    logTest('List Templates', 'GET', '/notification-templates', 'Company B', 'Company A', res6.status, !seesSpoofed, seesSpoofed ? 'Found Comp A Templates due to Fallback' : 'Isolated properly');

    console.log('Cleaning up data...');
    await prisma.notificationTemplate.deleteMany({ where: { title: 'Spoofed Tpl' } }).catch(()=>{});
    await prisma.driverActivity.delete({ where: { id: actA.id } }).catch(()=>{});
    await prisma.driverProfile.delete({ where: { id: driverA.id } }).catch(()=>{});
    await prisma.customer.delete({ where: { id: custA.id } }).catch(()=>{});
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } }).catch(()=>{});
    await prisma.company.deleteMany({ where: { id: { in: [compA.id, compB.id] } } }).catch(()=>{});

    console.log('Final Status:', success ? 'PASS' : 'FAIL');

  } catch (err) {
    console.error('Error running test:', err);
  }
}

runVerification();
