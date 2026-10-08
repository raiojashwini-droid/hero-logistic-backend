const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'services', 'PricingService.js');
let content = fs.readFileSync(targetFile, 'utf8');

const targetBlock = `        if (!triggerMet) {
          isReady = false;
        } else {
          let conditionsMet = true;
          const reqDocs = (billingRule.requiredDocuments || '').toLowerCase();
          const reqRefs = (billingRule.requiredReferences || '').toLowerCase();

          // Check POD Requirement
          if (reqDocs.includes('pod') || reqDocs.includes('signature') || reqDocs.includes('receipt')) {
            if (!hasPod) {
              conditionsMet = false;
              blockedReason = 'MISSING_POD';
            }
          }

          // Check Weighbridge Docket
          if (reqDocs.includes('weighbridge') || reqDocs.includes('docket')) {
            const hasWeighbridge = load.documents && load.documents.some(d => (d.type || '').toUpperCase().includes('WEIGH') || (d.name || '').toUpperCase().includes('WEIGH'));
            if (!hasWeighbridge) {
              conditionsMet = false;
              blockedReason = 'MISSING_WEIGHBRIDGE';
            }
          }

          // Check Required Purchase Order / Reference
          if (reqRefs.includes('po') || reqRefs.includes('purchase order')) {
            const hasPo = load.notes?.toLowerCase().includes('po:') || load.loadRef?.toLowerCase().startsWith('po-') || (load.customerRef && load.customerRef.trim() !== '');
            if (!hasPo) {
              conditionsMet = false;
              blockedReason = 'MISSING_PO_NUMBER';
            }
          }

          // Check Approval Requirement
          if (billingRule.approvalRequired) {
            const isApproved = load.notes?.includes('[BILLING_APPROVED]') || load.billingStatus === 'APPROVED';
            if (!isApproved) {
              conditionsMet = false;
              blockedReason = 'PENDING_APPROVAL';
            }
          }

          isReady = conditionsMet;
        }`;

const replacementBlock = `        if (!triggerMet) {
          isReady = false;
        } else {
          let conditionsMet = true;

          // Check strict UI boolean toggles for Billing Rules
          
          // 1. POD Required
          if (billingRule.podRequired) {
            if (!hasPod) {
              conditionsMet = false;
              blockedReason = 'MISSING_POD';
            }
          }

          // 2. Customer PO Required
          if (billingRule.customerPoRequired) {
            const hasPo = load.notes?.toLowerCase().includes('po:') || load.loadRef?.toLowerCase().startsWith('po-') || (load.customerRef && load.customerRef.trim() !== '');
            if (!hasPo) {
              conditionsMet = false;
              blockedReason = 'MISSING_PO_NUMBER';
            }
          }

          // 3. Include Job Photos
          if (billingRule.includeJobPhotos) {
            const hasPhotos = load.documents && load.documents.some(d => (d.type || '').toUpperCase().includes('PHOTO') || (d.name || '').toUpperCase().includes('PHOTO') || d.url?.match(/\.(jpeg|jpg|gif|png)$/i) != null);
            if (!hasPhotos) {
              // Note: If photos are missing, we just don't attach them to the invoice, or we can block it.
              // For strictness, if they require job photos and none exist, we might block it.
              // We'll block it to enforce the rule.
              conditionsMet = false;
              blockedReason = 'MISSING_JOB_PHOTOS';
            }
          }

          // 4. Manual Approval Required
          if (billingRule.requireManualApproval || billingRule.approvalRequired) {
            const isApproved = load.notes?.includes('[BILLING_APPROVED]') || load.billingStatus === 'APPROVED';
            if (!isApproved) {
              conditionsMet = false;
              blockedReason = 'PENDING_APPROVAL';
            }
          }

          isReady = conditionsMet;
        }`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, replacementBlock);
  fs.writeFileSync(targetFile, content);
  console.log("Successfully patched PricingService.js");
} else {
  console.log("Could not find the target block in PricingService.js");
}
