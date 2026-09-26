const prisma = require('../utils/prismaClient');
const syncMissingVehicleColumns = require('../utils/syncDbColumns');
const { sendSuccess, sendList, sendError } = require('../utils/apiResponse');
const { buildPrismaQuery, buildPaginationMeta } = require('../utils/queryBuilder');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

const { getTenantWhere, resolveCompanyId } = require('../middlewares/tenantResolver');

// Get effective companyId from request context safely
const getEffectiveCompanyId = (req) => {
  return resolveCompanyId(req);
};

// Get all Customers with pagination, sorting and filtering
exports.getAll = async (req, res, next) => {
  try {
    const { where, skip, take, orderBy, currentPage, pageSize } = buildPrismaQuery(req.query);
    const companyId = getEffectiveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        const meta = buildPaginationMeta(0, currentPage, pageSize, req.query.sort);
        return sendList(res, [], meta);
      }
      where.companyId = companyId;
    } else if (req.query.companyId) {
      where.companyId = req.query.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    } else {
      const meta = buildPaginationMeta(0, currentPage, pageSize, req.query.sort);
      return sendList(res, [], meta);
    }
    await syncMissingVehicleColumns().catch(() => {});

    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      where.branchId = req.user.branchId;
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where, skip, take, orderBy,
        include: {
          accountManager: true,
          loads: { take: 5, orderBy: { createdAt: 'desc' } }
        }
      }),
      prisma.customer.count({ where })
    ]);

    const meta = buildPaginationMeta(total, currentPage, pageSize, req.query.sort);
    return sendList(res, data, meta);
  } catch (error) {
    next(error);
  }
};

// Single dedicated endpoint for Customers Portal menu
exports.getPortalData = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);

    if (!companyId) {
      return sendSuccess(res, {
        customers: [],
        users: [],
        branches: [],
        stats: {
          totalCustomers: 0,
          activeCustomers: 0,
          customersThisMonth: 0,
          inactiveCustomers: 0,
          topCustomer: 'N/A'
        }
      });
    }

    await syncMissingVehicleColumns().catch(() => {});

    const companyWhere = { companyId };

    const dbCustomers = await prisma.customer.findMany({
      where: companyWhere,
      include: {
        accountManager: true,
        loads: { take: 5, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []);

    const [dbUsers, dbBranches] = await Promise.all([
      prisma.user.findMany({
        where: companyWhere,
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: 'asc' }
      }).catch(() => []),
      prisma.branch.findMany({
        where: companyWhere,
        select: { id: true, name: true, location: true },
        orderBy: { name: 'asc' }
      }).catch(() => [])
    ]);

    const mappedCustomers = dbCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      abn: c.abn || 'N/A',
      type: c.type === 'BUSINESS' ? 'Business' : c.type === 'CORPORATE' ? 'Corporate' : (c.type || 'Business'),
      contactName: c.contactName || 'N/A',
      contactEmail: c.email || 'N/A',
      contactPhone: c.phone || 'N/A',
      transportModules: Array.isArray(c.transportModules) ? c.transportModules : (c.transportModules ? JSON.parse(c.transportModules) : ['truck']),
      billingTerms: c.billingTerms || '14 Days EOM',
      billingType: 'EOM',
      manager: c.accountManager ? `${c.accountManager.name || ''}`.trim() : 'N/A',
      status: c.status === 'INACTIVE' ? 'Inactive' : 'Active'
    }));

    const totalCustomers = mappedCustomers.length;
    const activeCustomers = mappedCustomers.filter(c => c.status === 'Active').length;
    const inactiveCustomers = mappedCustomers.filter(c => c.status === 'Inactive').length;
    const topCustomer = mappedCustomers[0]?.name || 'N/A';

    return sendSuccess(res, {
      customers: mappedCustomers,
      users: dbUsers,
      branches: dbBranches,
      stats: {
        totalCustomers,
        activeCustomers,
        customersThisMonth: totalCustomers,
        inactiveCustomers,
        topCustomer
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single Customer by ID
exports.getById = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const where = { id: req.params.id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Customer not found'
        }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      where.branchId = req.user.branchId;
    }

    const data = await prisma.customer.findFirst({
      where,
      include: {
        accountManager: true,
        loads: true
      }
    });
    
    if (!data) {
      return sendError(res, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Customer not found'
      }, HTTP_STATUS.NOT_FOUND);
    }
    
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Create new Customer
exports.create = async (req, res, next) => {
  try {
    const raw = { ...req.body };
    const payload = {};
    const companyId = getEffectiveCompanyId(req);

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'Company context required to create customer'
        }, HTTP_STATUS.FORBIDDEN);
      }
      payload.companyId = companyId;
    } else {
      payload.companyId = raw.companyId || companyId;
    }

    payload.name = raw.name || raw.companyName || 'New Customer';
    if (raw.abn) payload.abn = String(raw.abn);
    if (raw.contactName || raw.primaryContact) payload.contactName = raw.contactName || raw.primaryContact;
    if (raw.email) payload.email = raw.email;
    if (raw.phone) payload.phone = raw.phone;
    if (raw.billingTerms) payload.billingTerms = raw.billingTerms;
    if (raw.transportModules) payload.transportModules = typeof raw.transportModules === 'string' ? raw.transportModules : JSON.stringify(raw.transportModules);
    if (raw.branchId || req.user?.branchId) payload.branchId = raw.branchId || req.user?.branchId;

    if (raw.type) {
      const tUpper = String(raw.type).toUpperCase();
      payload.type = (tUpper === 'INDIVIDUAL') ? 'INDIVIDUAL' : 'BUSINESS';
    }

    if (raw.status) {
      const sUpper = String(raw.status).toUpperCase();
      if (['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(sUpper)) {
        payload.status = sUpper;
      }
    }

    const data = await prisma.customer.create({
      data: payload,
      include: {
        loads: true
      }
    });
    return sendSuccess(res, data, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Customer with Optimistic Concurrency check
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.companyId; // Never trust companyId from payload
    delete updateData.accountManagerId;
    delete updateData.manager;
    const companyId = getEffectiveCompanyId(req);
    
    const where = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) {
        return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Customer not found' }, HTTP_STATUS.NOT_FOUND);
      }
      where.companyId = companyId;
    }

    if (req.user && req.user.role === 'DISPATCHER' && req.user.branchId && !req.user.permissions?.includes('dispatch.cross_branch.view')) {
      where.branchId = req.user.branchId;
    }

    // Verify record exists & belongs to tenant
    const existing = await prisma.customer.findFirst({ where });
    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Customer not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const ifMatch = req.headers['if-match'];
    if (ifMatch && existing.version !== parseInt(ifMatch.replace(/"/g, ''), 10)) {
      return sendError(res, {
        code: ERROR_CODES.RESOURCE_CONFLICT,
        message: 'Resource was updated by another user or does not exist.'
      }, HTTP_STATUS.CONFLICT);
    }

    const data = await prisma.customer.update({
      where: { id: existing.id },
      data: updateData
    });
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// Delete Customer
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = getEffectiveCompanyId(req);
    const where = { id };

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (!companyId) return sendSuccess(res, null, HTTP_STATUS.NO_CONTENT);
      where.companyId = companyId;
    }

    const targetCustomer = await prisma.customer.findFirst({ where });

    if (!targetCustomer) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Customer not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const custId = targetCustomer.id;

    // Delete or unlink all child dependent records cleanly prior to customer deletion
    if (prisma.customerInvoice) await prisma.customerInvoice.deleteMany({ where: { customerId: custId } }).catch(() => {});
    if (prisma.loadItem) await prisma.loadItem.deleteMany({ where: { customerId: custId } }).catch(() => {});
    if (prisma.inboundReceipt) await prisma.inboundReceipt.deleteMany({ where: { customerId: custId } }).catch(() => {});
    if (prisma.load) {
      const loads = await prisma.load.findMany({ where: { customerId: custId }, select: { id: true } }).catch(() => []);
      const loadIds = loads.map(l => l.id);
      if (loadIds.length > 0) {
        if (prisma.routeStop) await prisma.routeStop.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
        if (prisma.loadExpense) await prisma.loadExpense.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
        if (prisma.loadActivity) await prisma.loadActivity.deleteMany({ where: { loadId: { in: loadIds } } }).catch(() => {});
        await prisma.load.deleteMany({ where: { id: { in: loadIds } } }).catch(() => {});
      }
    }

    // Perform database deletion
    await prisma.customer.delete({ where: { id: custId } });

    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    console.error('Customer delete error:', error);
    next(error);
  }
};

// Clean all customers for company context
exports.deleteAll = async (req, res, next) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
    }
    const where = (req.user?.role === 'SUPER_ADMIN' && !companyId) ? {} : { companyId };
    
    const customers = await prisma.customer.findMany({ where, select: { id: true } }).catch(() => []);
    const custIds = customers.map(c => c.id);

    if (custIds.length > 0) {
      if (prisma.customerInvoice) await prisma.customerInvoice.deleteMany({ where: { customerId: { in: custIds } } }).catch(() => {});
      if (prisma.loadItem) await prisma.loadItem.deleteMany({ where: { customerId: { in: custIds } } }).catch(() => {});
      if (prisma.inboundReceipt) await prisma.inboundReceipt.deleteMany({ where: { customerId: { in: custIds } } }).catch(() => {});
      if (prisma.load) await prisma.load.updateMany({ where: { customerId: { in: custIds } }, data: { customerId: null } }).catch(() => {});
      await prisma.customer.deleteMany({ where: { id: { in: custIds } } }).catch(() => {});
    }

    return sendSuccess(res, { message: 'All customers cleared successfully' });
  } catch (error) {
    next(error);
  }
};

// Add contact to Customer (POST /api/v1/customers/:id/contacts)
exports.addContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, email, phone, isPrimary } = req.body;
    const companyId = getEffectiveCompanyId(req);

    if (!firstName) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'First name is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const where = { id };
    if (req.user?.role !== 'SUPER_ADMIN' && companyId) {
      where.companyId = companyId;
    }

    const customer = await prisma.customer.findFirst({ where });
    if (!customer) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Customer not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const newContact = {
      id: Date.now().toString(),
      firstName,
      lastName: lastName || '',
      role: role || 'Contact',
      email: email || 'N/A',
      phone: phone || 'N/A',
      isPrimary: !!isPrimary,
      createdAt: new Date().toISOString()
    };

    const updateData = {
      contactName: `${firstName} ${lastName || ''}`.trim(),
      email: email || customer.email,
      phone: phone || customer.phone
    };

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: updateData
    });

    return sendSuccess(res, {
      contact: newContact,
      customer: updatedCustomer
    }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Get contacts for Customer (GET /api/v1/customers/:id/contacts)
exports.getContacts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = getEffectiveCompanyId(req);
    const where = { id };
    if (req.user?.role !== 'SUPER_ADMIN' && companyId) {
      where.companyId = companyId;
    }

    const customer = await prisma.customer.findFirst({ where });
    if (!customer) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Customer not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const contacts = [];
    if (customer.contactName || customer.email || customer.phone) {
      const parts = (customer.contactName || '').trim().split(' ');
      contacts.push({
        id: '1',
        firstName: parts[0] || 'Primary',
        lastName: parts.slice(1).join(' ') || 'Contact',
        role: 'Primary Contact',
        email: customer.email || 'N/A',
        phone: customer.phone || 'N/A',
        isPrimary: true
      });
    }

    return sendSuccess(res, contacts);
  } catch (error) {
    next(error);
  }
};

// Customer Rate Cards In-Memory / Context Store
const customerRateCardStore = {};

// Get Rate Cards for Customer
exports.getRateCards = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cards = customerRateCardStore[id] || [];
    return sendSuccess(res, cards);
  } catch (error) {
    next(error);
  }
};

// Add Rate Card to Customer
exports.addRateCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, unit, rate, gst, status } = req.body;

    if (!name) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Charge name is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    const card = {
      id: `RC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: id,
      name: name.trim(),
      unit: unit || 'Per Unit',
      rate: parseFloat(rate) || 0,
      gst: gst !== undefined ? parseFloat(gst) : 10.0,
      status: status || 'Active',
      createdAt: new Date().toISOString()
    };

    if (!customerRateCardStore[id]) customerRateCardStore[id] = [];
    customerRateCardStore[id].unshift(card);

    return sendSuccess(res, card, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// Update Rate Card for Customer
exports.updateRateCard = async (req, res, next) => {
  try {
    const { id, cardId } = req.params;
    const { name, unit, rate, gst, status } = req.body;

    const cards = customerRateCardStore[id] || [];
    const index = cards.findIndex(c => c.id === cardId);

    if (index === -1) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Rate Card not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const updated = {
      ...cards[index],
      ...(name && { name: name.trim() }),
      ...(unit && { unit }),
      ...(rate !== undefined && { rate: parseFloat(rate) }),
      ...(gst !== undefined && { gst: parseFloat(gst) }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    };

    customerRateCardStore[id][index] = updated;
    return sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
};

// Delete Rate Card for Customer
exports.deleteRateCard = async (req, res, next) => {
  try {
    const { id, cardId } = req.params;
    if (customerRateCardStore[id]) {
      customerRateCardStore[id] = customerRateCardStore[id].filter(c => c.id !== cardId);
    }
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

