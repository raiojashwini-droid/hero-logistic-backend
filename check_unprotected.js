const fs = require('fs');
const path = require('path');
const dir = './src/controllers';
const files = fs.readdirSync(dir);

let leakCount = 0;

files.forEach(f => {
  if (!f.endsWith('.js')) return;
  const p = path.join(dir, f);
  const c = fs.readFileSync(p, 'utf8');
  
  if (c.includes('findMany') || c.includes('findFirst')) {
    const hasCompanyIdCheck = c.includes('companyId') || c.includes('tenantId') || c.includes('req.tenantId') || c.includes('tenantWhere');
    const isSuperAdminCheck = c.includes("role === 'SUPER_ADMIN'");
    const hasResolveCompanyId = c.includes('resolveCompanyId(req)');
    
    if (!hasCompanyIdCheck && !hasResolveCompanyId) {
      console.log('Needs manual check: ' + f);
      leakCount++;
    }
  }
});

console.log('Total controllers needing manual check: ' + leakCount);
