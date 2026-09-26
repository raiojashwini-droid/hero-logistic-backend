const prisma = require('./src/utils/prismaClient');

async function main() {
  const company = await prisma.company.findFirst({
    include: { branches: true, whiteLabelConfig: true, customRoles: true }
  });
  if (!company) { console.log('No company found'); return; }

  const [usersCount, branchesCount, rolesCount, integrationsCount, workflowCount] = await Promise.all([
    prisma.user.count({ where: { companyId: company.id } }),
    prisma.branch.count({ where: { companyId: company.id } }),
    prisma.customRole.count({ where: { companyId: company.id } }),
    prisma.companyIntegration.count({ where: { companyId: company.id } }),
    prisma.workflowRule.count({ where: { companyId: company.id } })
  ]);

  const setupItems = [
    !!company?.name,
    usersCount > 0,
    branchesCount > 0,
    integrationsCount > 0,
    true,
    workflowCount > 0,
    true,
    rolesCount > 0
  ];
  const setupPercent = Math.round((setupItems.filter(Boolean).length / setupItems.length) * 100);

  console.log('=== WHAT /company-admin/settings WILL NOW RETURN ===');
  console.log(JSON.stringify({
    company: { id: company.id, name: company.name },
    stats: { usersCount, branchesCount, rolesCount, setupPercent, integrationsCount, workflowCount, health: 'Healthy' }
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
