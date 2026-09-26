const bcrypt = require('bcryptjs');
const prisma = require('./src/utils/prismaClient');
const crypto = require('crypto');

async function seedDemoData() {
  console.log('=== SEEDING CLEAN DEMO ENVIRONMENT FOR LIVE TESTING ===\n');

  try {
    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Create Primary Demo Company
    const company1 = await prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Hero Logistics Demo Co',
        tenantId: 'HERO-DEMO-01'
      }
    });
    console.log(`✓ Created Primary Company: ${company1.name} (ID: ${company1.id})`);

    // 2. Create Company 2 (for multi-tenant isolation testing)
    const company2 = await prisma.company.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Competitor Express Pty',
        tenantId: 'COMPETITOR-02'
      }
    });
    console.log(`✓ Created Isolated Second Company: ${company2.name} (ID: ${company2.id})`);

    // 3. Create Company Admin user
    const adminUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Alex Admin',
        email: 'admin@hero.com',
        password: passwordHash,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        companyId: company1.id
      }
    });
    console.log(`✓ Created Company Admin User: ${adminUser.email} (Password: 123456)`);

    // 4. Create Driver user & Driver Profile
    const driverUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Noah Williams',
        email: 'driver@hero.com',
        password: passwordHash,
        role: 'DRIVER',
        status: 'ACTIVE',
        companyId: company1.id
      }
    });

    const driverProfile = await prisma.driver.create({
      data: {
        id: crypto.randomUUID(),
        userId: driverUser.id,
        firstName: 'Noah',
        lastName: 'Williams',
        email: 'driver@hero.com',
        driverCode: 'DRV-101',
        phone: '+61 400 123 456',
        payRate: 350.00,
        payType: 'Trip',
        status: 'AVAILABLE',
        companyId: company1.id
      }
    });
    console.log(`✓ Created Driver User & Profile: ${driverUser.email} (Password: 123456, Pay Rate: $350/trip)`);

    // 5. Create Customer
    const customer = await prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Auto World Sydney',
        email: 'contact@autoworld.com.au',
        phone: '+61 2 9876 5432',
        companyId: company1.id
      }
    });
    console.log(`✓ Created Customer: ${customer.name}`);

    // 6. Create Vehicle
    const truck = await prisma.vehicle.create({
      data: {
        id: crypto.randomUUID(),
        rego: 'NSW-7890',
        vin: '1HD1KAE12FB012345',
        make: 'Volvo',
        model: 'FH16 Car Carrier',
        category: 'TRUCK',
        status: 'IDLE',
        companyId: company1.id
      }
    });
    console.log(`✓ Created Vehicle: ${truck.make} ${truck.model} (${truck.rego})`);

    // 7. Create Admin for Competitor Company
    const competitorAdmin = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Competitor Admin',
        email: 'admin@competitor.com',
        password: passwordHash,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        companyId: company2.id
      }
    });
    console.log(`✓ Created Competitor Admin: ${competitorAdmin.email} (Password: 123456)`);

    console.log(`\n========================================================`);
    console.log(`🎯 DEMO SETUP COMPLETE! READY FOR BROWSER & API TESTING:`);
    console.log(`========================================================`);
    console.log(`[COMPANY 1]`);
    console.log(`- Company Name:  Hero Logistics Demo Co`);
    console.log(`- Admin Login:   admin@hero.com  | Password: 123456`);
    console.log(`- Driver Login:  driver@hero.com | Password: 123456`);
    console.log(`\n[COMPANY 2 (FOR DATA ISOLATION PROOF)]`);
    console.log(`- Company Name:  Competitor Express Pty`);
    console.log(`- Admin Login:   admin@competitor.com | Password: 123456`);
    console.log(`========================================================\n`);

  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoData();
