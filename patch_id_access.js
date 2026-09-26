const fs = require('fs');
const path = require('path');

const dir = './src/controllers';
const files = fs.readdirSync(dir);

let patchedCount = 0;

files.forEach(f => {
  if (!f.endsWith('.js')) return;
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  let changed = false;

  // We want to replace basic { where: { id: req.params.id } } with tenant scoped where
  // in .update and .delete
  
  if (c.includes('.update({ where: { id: req.params.id }') || c.includes('.delete({ where: { id: req.params.id }')) {
    
    // Make sure we have resolveCompanyId
    if (!c.includes('resolveCompanyId')) {
      c = "const { resolveCompanyId } = require('../middlewares/tenantResolver');\n" + c;
    }

    const tenantWhere = `
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };
    if (companyId) {
      where.companyId = companyId;
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      where.companyId = 'IMPOSSIBLE_TENANT_ID_NO_ACCESS';
    }`;

    // For the Driver controllers, the relation is `driver: { companyId }` instead of just `companyId`
    const driverTenantWhere = `
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };
    if (companyId) {
      where.driver = { companyId };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      where.driver = { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
    }`;

    const isDriverController = f.startsWith('Driver') || f === 'PerformanceLogController.js';
    const scopeCode = isDriverController ? driverTenantWhere : tenantWhere;

    // Replace updates
    const updateRegex = /const data = await prisma\.([a-zA-Z]+)\.update\(\{\s*where:\s*\{\s*id:\s*req\.params\.id\s*\},\s*data:\s*req\.body\s*\}\);/g;
    if (updateRegex.test(c)) {
      c = c.replace(updateRegex, (match, model) => {
        return scopeCode + `\n    const data = await prisma.${model}.update({ where, data: req.body });`;
      });
      changed = true;
    }

    // Replace deletes
    const deleteRegex = /await prisma\.([a-zA-Z]+)\.delete\(\{\s*where:\s*\{\s*id:\s*req\.params\.id\s*\}\s*\}\);/g;
    if (deleteRegex.test(c)) {
      c = c.replace(deleteRegex, (match, model) => {
        return scopeCode + `\n    await prisma.${model}.delete({ where });`;
      });
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(p, c);
    console.log('Patched UPDATE/DELETE for: ' + f);
    patchedCount++;
  }
});

console.log('Total files patched: ' + patchedCount);
