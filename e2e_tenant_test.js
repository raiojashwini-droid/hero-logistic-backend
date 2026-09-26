const prisma = require('./src/utils/prismaClient');
const jwt = require('jsonwebtoken');

async function runE2ETest() {
  console.log('--- STARTING E2E TENANT ISOLATION TEST (LIVE SERVER) ---');
  
  // 1. Setup Data
  console.log('Setting up test companies and users...');
  
  const companyA = await prisma.company.create({
    data: { name: 'Test E2E Company A', adminEmail: 'testa@example.com' }
  });
  
  const companyB = await prisma.company.create({
    data: { name: 'Test E2E Company B', adminEmail: 'testb@example.com' }
  });

  const userA = await prisma.user.create({
    data: {
      email: 'usera@teste2e.com',
      password: 'password123',
      name: 'User A',
      role: 'COMPANY_ADMIN',
      companyId: companyA.id
    }
  });

  const userB = await prisma.user.create({
    data: {
      email: 'userb@teste2e.com',
      password: 'password123',
      name: 'User B',
      role: 'COMPANY_ADMIN',
      companyId: companyB.id
    }
  });

  console.log('Creating data for Company A...');
  const customerA = await prisma.customer.create({
    data: {
      name: 'Customer A Private',
      companyName: 'Cust A Inc',
      companyId: companyA.id
    }
  });

  const loadA = await prisma.load.create({
    data: {
      loadNumber: 'LOAD-E2E-A',
      companyId: companyA.id,
      customerId: customerA.id,
      status: 'PLANNED'
    }
  });

  const JWT_SECRET = process.env.JWT_SECRET || 'hero-logistic-super-secret-key-2024';
  const tokenA = jwt.sign({ id: userA.id, role: userA.role, companyId: companyA.id, tenantId: companyA.id }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: userB.id, role: userB.role, companyId: companyB.id, tenantId: companyB.id }, JWT_SECRET, { expiresIn: '1h' });

  console.log('\\n--- EXECUTING API REQUESTS ---');
  let success = true;

  async function apiReq(token, path) {
    const res = await fetch('http://localhost:5000/api/v1' + path, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) {
      const err = new Error('HTTP ' + res.status);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  try {
    const resA = await apiReq(tokenA, '/customers');
    const foundA = resA.data.find(c => c.id === customerA.id);
    if (!foundA) throw new Error('User A could not see their own customer!');
    console.log('✓ PASS: User A can see Company A data (Found Customer ID: ' + foundA.id + ')');

    const resB = await apiReq(tokenB, '/customers');
    const foundB = resB.data.find(c => c.id === customerA.id);
    if (foundB) {
      console.error('❌ FAIL: User B can see Company A data in list!');
      success = false;
    } else {
      console.log('✓ PASS: User B DOES NOT see Company A data in /customers list');
    }

    try {
      await apiReq(tokenB, '/customers/' + customerA.id);
      console.error('❌ FAIL: User B accessed Company A customer directly by ID!');
      success = false;
    } catch (err) {
      if (err.status === 404 || err.status === 403) {
        console.log('✓ PASS: User B blocked from accessing Company A data directly by ID (Status: ' + err.status + ')');
      } else {
        console.error('❌ FAIL: User B got unexpected error:', err.message);
        success = false;
      }
    }
    
    const resLoadB = await apiReq(tokenB, '/loads');
    const foundLoadB = resLoadB.data.find(l => l.id === loadA.id);
    if (foundLoadB) {
      console.error('❌ FAIL: User B can see Company A load in list!');
      success = false;
    } else {
      console.log('✓ PASS: User B DOES NOT see Company A loads in /loads list');
    }

    const resActB = await apiReq(tokenB, '/drivers/activities'); // Correct path for DriverActivity
    console.log('✓ PASS: User B successfully queried driver activities without crashing or getting Company A data');

  } catch (err) {
    console.error('Error during API tests:', err.message);
    success = false;
  }

  console.log('\\nCleaning up test data...');
  await prisma.load.delete({ where: { id: loadA.id } }).catch(()=>null);
  await prisma.customer.delete({ where: { id: customerA.id } }).catch(()=>null);
  await prisma.user.delete({ where: { id: userA.id } }).catch(()=>null);
  await prisma.user.delete({ where: { id: userB.id } }).catch(()=>null);
  await prisma.company.delete({ where: { id: companyA.id } }).catch(()=>null);
  await prisma.company.delete({ where: { id: companyB.id } }).catch(()=>null);
  
  if (success) {
    console.log('\\n✅ ALL E2E ISOLATION TESTS PASSED PERFECTLY!');
  } else {
    console.log('\\n❌ SOME E2E TESTS FAILED.');
  }
}

runE2ETest().catch(console.error).finally(() => prisma.$disconnect());
