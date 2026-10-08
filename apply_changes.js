const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'controllers', 'CompanyAdminPortalController.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. ALLOWED_LOAD_FIELDS
content = content.replace(
  "'billingStatus'\n]);",
  "'billingStatus',\n  'billedCustomers'\n]);"
);

// 2. relationKeys
content = content.replace(
  "'deliveryPods', 'preStartChecklists', 'incidents'\n  ]);",
  "'deliveryPods', 'preStartChecklists', 'incidents', 'billedCustomers'\n  ]);"
);

// 3. createLoad billedCustomerIds
content = content.replace(
  "    // Resolve Customer\n    if (payload.customer && !payload.customerId && typeof payload.customer === 'string') {",
  `    let billedCustomerIds = req.body.billedCustomerIds || payload.billedCustomerIds || [];
    if (!Array.isArray(billedCustomerIds)) {
      billedCustomerIds = [billedCustomerIds].filter(Boolean);
    }
    delete payload.billedCustomerIds;

    // Resolve Customer
    if (payload.customer && !payload.customerId && typeof payload.customer === 'string') {`
);

// 4. updateLoad billedCustomerIds
content = content.replace(
  "    delete payload.customer;\n    delete payload.driver;\n    delete payload.truck;\n    delete payload.trailer;\n\n    if (agreedRate !== null && parseFloat(agreedRate) > 0) {",
  `    delete payload.customer;
    delete payload.driver;
    delete payload.truck;
    delete payload.trailer;

    let billedCustomerIds = req.body.billedCustomerIds || payload.billedCustomerIds || null;
    delete payload.billedCustomerIds;

    if (Array.isArray(billedCustomerIds)) {
      payload.billedCustomers = { set: billedCustomerIds.map(id => ({ id })) };
      if (billedCustomerIds.length > 0 && !payload.customerId && !targetLoad.customerId) {
        payload.customerId = billedCustomerIds[0];
      }
    }

    if (agreedRate !== null && parseFloat(agreedRate) > 0) {`
);

// 5. autoGenerateLoadInvoice Target Load
content = content.replace(
  "include: { customer: true, items: true }\n    }).catch(() => null);",
  "include: { customer: true, items: true, billedCustomers: true }\n    }).catch(() => null);"
);

// 6. autoGenerateLoadInvoice billing loop
const invoiceLogicOriginal = `    // 3. Customer Resolution
    let customerId = targetLoad.customerId;
    const targetCompanyId = companyId || targetLoad.companyId;
    if (!customerId) {
      let cust = await prisma.customer.findFirst({
        where: targetCompanyId ? { companyId: targetCompanyId } : {}
      }).catch(() => null);

      if (!cust && targetCompanyId) {
        const crypto = require('crypto');
        cust = await prisma.customer.create({
          data: {
            id: crypto.randomUUID(),
            companyId: targetCompanyId,
            name: 'General Freight Customer',
            email: 'accounts@generalcustomer.com.au'
          }
        }).catch(() => null);
      }

      if (cust) customerId = cust.id;
    }

    if (!customerId) return null;

    // 4. Rate / Amount Calculation
    let amount = customAmount ? parseFloat(customAmount) : 0;
    if (!amount || amount === 0) {
      if (targetLoad.notes && targetLoad.notes.includes('[AGREED_RATE:')) {
        const match = targetLoad.notes.match(/\\[AGREED_RATE:([0-9.]+)/);
        if (match && match[1]) amount = parseFloat(match[1]);
      }
    }
    if (!amount || amount === 0) {
      const itemsCount = targetLoad.items?.length || 1;
      amount = itemsCount * 350.00;
      if (amount < 500) amount = 1250.00;
    }

    // 5. Generate Invoice Number & Due Date (14 Days)
    const crypto = require('crypto');
    const invNum = \`INV-\${new Date().getFullYear()}-\${Math.floor(10000 + Math.random() * 90000)}\`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // 6. Create CustomerInvoice (status: DRAFT)
    const invoice = await prisma.customerInvoice.create({
      data: {
        id: crypto.randomUUID(),
        invoiceNumber: invNum,
        customerId,
        loadId: targetLoad.id,
        amount,
        status: 'DRAFT',
        dueDate,
        notes: \`Auto-generated draft invoice upon POD delivery confirmation for Load \${targetLoad.loadRef || targetLoad.id}\`
      },
      include: { customer: { select: { id: true, name: true, email: true } } }
    });

    return invoice;`;

const invoiceLogicReplacement = `    // 3. Customer Resolution
    let customersToBill = targetLoad.billedCustomers && targetLoad.billedCustomers.length > 0 
      ? targetLoad.billedCustomers.map(c => c.id) 
      : [];

    let customerId = targetLoad.customerId;
    const targetCompanyId = companyId || targetLoad.companyId;

    if (customersToBill.length === 0) {
      if (!customerId) {
        let cust = await prisma.customer.findFirst({
          where: targetCompanyId ? { companyId: targetCompanyId } : {}
        }).catch(() => null);

        if (!cust && targetCompanyId) {
          const crypto = require('crypto');
          cust = await prisma.customer.create({
            data: {
              id: crypto.randomUUID(),
              companyId: targetCompanyId,
              name: 'General Freight Customer',
              email: 'accounts@generalcustomer.com.au'
            }
          }).catch(() => null);
        }
        if (cust) customerId = cust.id;
      }
      if (customerId) {
        customersToBill.push(customerId);
      }
    }

    if (customersToBill.length === 0) return null;

    // 4. Rate / Amount Calculation
    let baseAmount = customAmount ? parseFloat(customAmount) : 0;
    if (!baseAmount || baseAmount === 0) {
      if (targetLoad.notes && targetLoad.notes.includes('[AGREED_RATE:')) {
        const match = targetLoad.notes.match(/\\[AGREED_RATE:([0-9.]+)/);
        if (match && match[1]) baseAmount = parseFloat(match[1]);
      }
    }
    if (!baseAmount || baseAmount === 0) {
      const itemsCount = targetLoad.items?.length || 1;
      baseAmount = itemsCount * 350.00;
      if (baseAmount < 500) baseAmount = 1250.00;
    }

    // Split amount if multiple customers
    const amount = baseAmount / customersToBill.length;

    // 5. Generate Invoices
    const crypto = require('crypto');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const invoices = [];
    for (const custId of customersToBill) {
      const invNum = \`INV-\${new Date().getFullYear()}-\${Math.floor(10000 + Math.random() * 90000)}\`;
      const invoice = await prisma.customerInvoice.create({
        data: {
          id: crypto.randomUUID(),
          invoiceNumber: invNum,
          customerId: custId,
          loadId: targetLoad.id,
          amount,
          status: 'DRAFT',
          dueDate,
          notes: \`Auto-generated draft invoice upon POD delivery confirmation for Load \${targetLoad.loadRef || targetLoad.id}\`
        },
        include: { customer: { select: { id: true, name: true, email: true } } }
      });
      invoices.push(invoice);
    }

    return invoices.length > 0 ? invoices[0] : null;`;

content = content.replace(invoiceLogicOriginal, invoiceLogicReplacement);

fs.writeFileSync(targetFile, content);
console.log("Successfully applied backend patch.");
