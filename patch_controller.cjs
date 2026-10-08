const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'controllers', 'CompanyAdminPortalController.js');
let content = fs.readFileSync(targetFile, 'utf8');

const targetBlock = `    if (billingRule && !billingRule.autoCreateInvoice) {
       return null; // Auto-invoicing disabled for this customer
    }

    if (billingRule && ['weekly', 'monthly', 'fortnightly'].includes((billingRule.invoiceGrouping || '').toLowerCase())) {
       // Grouping rule prevents immediate per-load invoicing. A separate cron job handles this.
       return null; 
    }`;

const replacementBlock = `    if (billingRule && !billingRule.autoCreateInvoice) {
       return null; // Auto-invoicing disabled for this customer
    }
    
    if (billingRule && (billingRule.requireManualApproval || billingRule.approvalRequired)) {
       return null; // Requires Accounts Manual Approval - do not auto generate!
    }

    if (billingRule && ['weekly', 'monthly', 'fortnightly'].includes((billingRule.invoiceGrouping || '').toLowerCase())) {
       // Grouping rule prevents immediate per-load invoicing. A separate cron job handles this.
       return null; 
    }`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, replacementBlock);
  fs.writeFileSync(targetFile, content);
  console.log("Successfully patched CompanyAdminPortalController.js");
} else {
  console.log("Could not find the target block in CompanyAdminPortalController.js");
}
