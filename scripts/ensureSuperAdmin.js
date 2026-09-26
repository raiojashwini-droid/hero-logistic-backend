// scripts/ensureSuperAdmin.js
// Run this script to guarantee a Super Admin user exists in the database.
// It creates a default Super Admin (email: super-admin@hero.com, password: 123456) if none is found.
// This is intended for development environments only.

const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/prismaClient');

async function ensureSuperAdmin() {
  try {
    // Check for existing SUPER_ADMIN user
    const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (existing) {
      console.log('✅ Super Admin already exists:', existing.email);
      return;
    }
    // Create password hash
    const passwordHash = await bcrypt.hash('123456', 10);
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'super-admin@hero.com',
        password: passwordHash,
        role: 'SUPER_ADMIN',
        // Adjust fields according to your schema; include status/permissions if needed
        status: 'ACTIVE',
        permissions: {}
      }
    });
    console.log('🟢 Created Super Admin user:', superAdmin.email);
  } catch (err) {
    console.error('❌ Error ensuring Super Admin:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ensureSuperAdmin();
