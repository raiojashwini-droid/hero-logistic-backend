const fs = require('fs');
const path = require('path');

const dir = './src/controllers';
const files = [
  'AiModelController.js',
  'NotificationRuleController.js',
  'NotificationTemplateController.js',
  'RecipientGroupController.js',
  'CompanyIntegrationController.js'
];

let patchedCount = 0;

files.forEach(f => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  let changed = false;

  // Replace `let companyId = req.user?.companyId || req.body.companyId || req.headers['x-company-id'];`
  const spoofRegex = /let companyId = req\.user\?\.companyId \|\| req\.body\.companyId \|\| req\.headers\['x-company-id'\];/g;
  
  if (spoofRegex.test(c)) {
    c = c.replace(spoofRegex, `
      const { resolveCompanyId } = require('../middlewares/tenantResolver');
      let companyId = resolveCompanyId(req);
      if (req.user?.role === 'SUPER_ADMIN' && req.body.companyId) {
        companyId = req.body.companyId;
      }
    `);
    changed = true;
  }

  // CompanyIntegrationController has `let companyId = resolveCompanyId(req) || req.body.companyId;`
  if (f === 'CompanyIntegrationController.js') {
    const intSpoofRegex = /let companyId = resolveCompanyId\(req\) \|\| req\.body\.companyId;/g;
    if (intSpoofRegex.test(c)) {
      c = c.replace(intSpoofRegex, `
      let companyId = resolveCompanyId(req);
      if (req.user?.role === 'SUPER_ADMIN' && req.body.companyId) {
        companyId = req.body.companyId;
      }
      `);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(p, c);
    console.log('Patched CREATE spoofing for: ' + f);
    patchedCount++;
  }
});

console.log('Total creation spoofing files patched: ' + patchedCount);
