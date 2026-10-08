const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'controllers', 'CustomerController.js');
let content = fs.readFileSync(file, 'utf8');

const regex = /exports\.saveBillingRule = async \(req, res, next\) => \{[\s\S]*?\} catch \(error\) \{ next\(error\); \} \};/;

const replacement = `exports.saveBillingRule = async (req, res, next) => {
  try {
    const { 
      id, name, invoiceTrigger, invoiceGrouping, paymentTerms, requiredReferences, requiredDocuments, 
      autoCreateInvoice, autoSendInvoice, approvalRequired, 
      podRequired, customerPoRequired, includeJobPhotos, requireManualApproval 
    } = req.body;
    let result;

    const dataObj = {
      customerId: req.params.id,
      name: name || 'Standard Billing Rule',
      invoiceTrigger: invoiceTrigger || 'Delivery completed',
      invoiceGrouping: invoiceGrouping || 'Per load',
      paymentTerms: paymentTerms || 'Due immediately',
      requiredReferences,
      requiredDocuments,
      autoCreateInvoice: autoCreateInvoice !== undefined ? Boolean(autoCreateInvoice) : true,
      autoSendInvoice: autoSendInvoice !== undefined ? Boolean(autoSendInvoice) : false,
      approvalRequired: approvalRequired !== undefined ? Boolean(approvalRequired) : Boolean(requireManualApproval),
      requireManualApproval: requireManualApproval !== undefined ? Boolean(requireManualApproval) : Boolean(approvalRequired),
      podRequired: podRequired !== undefined ? Boolean(podRequired) : true,
      customerPoRequired: customerPoRequired !== undefined ? Boolean(customerPoRequired) : false,
      includeJobPhotos: includeJobPhotos !== undefined ? Boolean(includeJobPhotos) : false,
    };

    if (id && id.length > 20) {
       result = await prisma.customerBillingRule.update({
         where: { id },
         data: dataObj
       });
    } else {
       // Only allow one active billing rule per customer for now
       const existing = await prisma.customerBillingRule.findFirst({
         where: { customerId: req.params.id }
       });
       
       if (existing) {
         result = await prisma.customerBillingRule.update({
           where: { id: existing.id },
           data: dataObj
         });
       } else {
         result = await prisma.customerBillingRule.create({
           data: dataObj
         });
       }
    }
    
    // Sync paymentTerms to Customer model as well
    if (paymentTerms) {
       await prisma.customer.update({
         where: { id: req.params.id },
         data: { billingTerms: paymentTerms }
       });
    }

    return sendSuccess(res, result);
  } catch (error) { next(error); }
};`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log("Successfully patched CustomerController.js");
} else {
  console.log("Failed to match regex in CustomerController.js");
}
