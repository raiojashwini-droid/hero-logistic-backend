const fs = require('fs');
const path = require('path');

const controllers = [
  'DriverActivityController.js',
  'DriverAllowanceController.js',
  'DriverDeductionController.js',
  'DriverLeaveRequestController.js',
  'DriverMessageController.js',
  'DriverPayRateController.js',
  'PerformanceLogController.js'
];

controllers.forEach(f => {
  const p = path.join('./src/controllers', f);
  if (!fs.existsSync(p)) return;
  
  let c = fs.readFileSync(p, 'utf8');
  
  if (c.includes('buildPrismaQuery(req.query);') && !c.includes('resolveCompanyId')) {
    const scopeCode = `
    const { resolveCompanyId } = require('../middlewares/tenantResolver');
    const companyId = resolveCompanyId(req);
    if (companyId) {
      where.driver = { companyId };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      where.driver = { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
    }`;
    
    c = c.replace('buildPrismaQuery(req.query);', 'buildPrismaQuery(req.query);' + scopeCode);
    
    // Also protect getById
    if (c.includes('findFirst({ where: { id: req.params.id } });')) {
      const getByIdScope = `
    const { resolveCompanyId } = require('../middlewares/tenantResolver');
    const companyId = resolveCompanyId(req);
    const where = { id: req.params.id };
    if (companyId) {
      where.driver = { companyId };
    } else if (req.user?.role !== 'SUPER_ADMIN') {
      where.driver = { companyId: 'IMPOSSIBLE_TENANT_ID_NO_ACCESS' };
    }`;
      const re = new RegExp(`const data = await prisma\\.[a-zA-Z]+\\.findFirst\\(\\{ where: \\{ id: req\\.params\\.id \\} \\}\\);`);
      c = c.replace(re, getByIdScope + '\n    const data = await prisma.' + f.replace('Controller.js', '') + '.findFirst({ where });');
    }
    
    fs.writeFileSync(p, c);
    console.log('Fixed ' + f);
  }
});
