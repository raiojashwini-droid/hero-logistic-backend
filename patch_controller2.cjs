const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'controllers', 'CompanyAdminPortalController.js');
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(billingRule && !billingRule\.autoCreateInvoice\) {[\s\S]*?return null; \/\/ Auto-invoicing disabled for this customer\s*}\s*if \(billingRule && \['weekly', 'monthly', 'fortnightly'\]\.includes\(\(billingRule\.invoiceGrouping \|\| ''\)\.toLowerCase\(\)\)\) {/m;

const replacement = `if (billingRule && !billingRule.autoCreateInvoice) {
       return null; // Auto-invoicing disabled for this customer
    }

    if (billingRule && (billingRule.requireManualApproval || billingRule.approvalRequired)) {
       return null; // Requires Accounts Manual Approval - do not auto generate!
    }

    if (billingRule && ['weekly', 'monthly', 'fortnightly'].includes((billingRule.invoiceGrouping || '').toLowerCase())) {`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("Failed to match regex");
}
