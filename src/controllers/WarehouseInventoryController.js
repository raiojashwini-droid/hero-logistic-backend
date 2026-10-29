const prisma = require('../utils/prismaClient');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const { resolveCompanyId } = require('../middlewares/tenantResolver');

// Helper to ensure company has at least one warehouse
async function getOrCreateDefaultWarehouse(tenantId) {
  let wh = await prisma.warehouse.findFirst({
    where: { branch: { companyId: tenantId } }
  });
  if (wh) return wh;

  let branch = await prisma.branch.findFirst({
    where: { companyId: tenantId }
  });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        companyId: tenantId,
        name: 'Main Operations Hub',
        location: 'Central Terminal'
      }
    });
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  wh = await prisma.warehouse.create({
    data: {
      branchId: branch.id,
      name: 'Main Company Warehouse',
      code: `WH-${tenantId.slice(0, 4).toUpperCase()}-${randomSuffix}`,
      address: 'Central Freight Terminal'
    }
  });
  return wh;
}

async function resolveTenantOrFallback(req) {
  let tenantId = resolveCompanyId(req);
  if (!tenantId) {
    const comp = await prisma.company.findFirst({ where: { status: 'ACTIVE' } });
    if (comp) tenantId = comp.id;
  }
  return tenantId;
}

exports.getInventory = async (req, res, next) => {
  try {
    const tenantId = await resolveTenantOrFallback(req);
    if (!tenantId) {
      return sendSuccess(res, []);
    }

    const tenantFilter = {
      OR: [
        { warehouse: { branch: { companyId: tenantId } } },
        { load: { companyId: tenantId } },
        { customer: { companyId: tenantId } }
      ]
    };

    let inventory = [];
    try {
      inventory = await prisma.loadItem.findMany({
        where: {
          AND: [
            tenantFilter,
            { sku: { not: null } },
            { NOT: [{ sku: '' }, { sku: 'N/A' }] },
            { description: { not: null } },
            { NOT: [{ description: '' }, { description: 'N/A' }] }
          ]
        },
        include: {
          warehouse: true
        },
        orderBy: {
          receivedDate: 'desc'
        }
      });
    } catch (dbErr) {
      console.warn('Database query fallback in getInventory:', dbErr.message);
      inventory = [];
    }

    return sendSuccess(res, inventory);
  } catch (error) {
    console.error('Error in getInventory:', error);
    next(error);
  }
};

exports.getAvailableStock = async (req, res, next) => {
  try {
    const tenantId = await resolveTenantOrFallback(req);
    if (!tenantId) return sendSuccess(res, []);

    const search = req.query.search ? String(req.query.search).toLowerCase() : '';

    const items = await prisma.loadItem.findMany({
      where: {
        OR: [
          { warehouse: { branch: { companyId: tenantId } } },
          { load: { companyId: tenantId } },
          { customer: { companyId: tenantId } }
        ],
        quantity: { gt: 0 },
        sku: { not: null },
        description: { not: null }
      },
      include: {
        warehouse: true
      },
      orderBy: {
        quantity: 'desc'
      }
    });

    const filtered = search
      ? items.filter(it => 
          (it.sku || '').toLowerCase().includes(search) || 
          (it.description || '').toLowerCase().includes(search) ||
          (it.category || '').toLowerCase().includes(search)
        )
      : items;

    return sendSuccess(res, filtered);
  } catch (error) {
    next(error);
  }
};

exports.getWarehouses = async (req, res, next) => {
  try {
    const tenantId = await resolveTenantOrFallback(req);
    if (!tenantId) return sendSuccess(res, []);

    let list = await prisma.warehouse.findMany({
      where: { branch: { companyId: tenantId } }
    });

    if (list.length === 0) {
      const def = await getOrCreateDefaultWarehouse(tenantId);
      list = [def];
    }

    return sendSuccess(res, list);
  } catch (error) {
    next(error);
  }
};

exports.createInventoryItem = async (req, res, next) => {
  try {
    const tenantId = await resolveTenantOrFallback(req);
    if (!tenantId) {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
    }

    const {
      description,
      sku,
      quantity,
      unit,
      category,
      warehouseId,
      zone,
      row,
      bay,
      weightKg,
      pallets,
      cubicMetres,
      minQuantity,
      unitPrice,
      notes
    } = req.body;

    if (!description || !description.trim()) {
      return sendError(res, { code: ERROR_CODES.VALIDATION_ERROR, message: 'Item name / description is required' }, HTTP_STATUS.BAD_REQUEST);
    }

    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const wh = await getOrCreateDefaultWarehouse(tenantId);
      targetWarehouseId = wh.id;
    }

    const cleanSku = (sku && sku.trim()) ? sku.trim() : `SKU-${Math.floor(10000 + Math.random() * 90000)}`;
    const qty = parseInt(quantity, 10) || 0;
    const minQty = parseInt(minQuantity, 10) || 5;

    const newItem = await prisma.loadItem.create({
      data: {
        description: description.trim(),
        sku: cleanSku,
        stockRef: cleanSku,
        quantity: qty,
        unit: unit || 'Boxes',
        category: category || 'General Freight',
        warehouseId: targetWarehouseId,
        zone: zone || 'Zone A',
        row: row || 'Row 1',
        bay: bay || 'Bay 01',
        location: `${zone || 'Zone A'}/${row || 'Row 1'}/${bay || 'Bay 01'}`,
        weightKg: parseInt(weightKg, 10) || 0,
        pallets: parseInt(pallets, 10) || null,
        cubicMetres: parseFloat(cubicMetres) || null,
        minQuantity: minQty,
        unitPrice: parseFloat(unitPrice) || 0,
        stockStatus: qty > 0 ? 'IN_STORAGE' : 'DISPATCHED',
        receivedDate: new Date(),
        notes: notes || null
      },
      include: {
        warehouse: true
      }
    });

    return sendSuccess(res, newItem, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    next(error);
  }
};

exports.updateInventoryItem = async (req, res, next) => {
  try {
    const tenantId = await resolveTenantOrFallback(req);
    const { id } = req.params;
    if (!tenantId) {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
    }

    const existing = await prisma.loadItem.findFirst({
      where: {
        id,
        OR: [
          { warehouse: { branch: { companyId: tenantId } } },
          { load: { companyId: tenantId } },
          { customer: { companyId: tenantId } }
        ]
      }
    });

    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Inventory item not found' }, HTTP_STATUS.NOT_FOUND);
    }

    const {
      description,
      sku,
      quantity,
      unit,
      category,
      warehouseId,
      zone,
      row,
      bay,
      weightKg,
      pallets,
      cubicMetres,
      minQuantity,
      unitPrice,
      notes
    } = req.body;

    const qty = quantity !== undefined ? parseInt(quantity, 10) : existing.quantity;

    const updated = await prisma.loadItem.update({
      where: { id: existing.id },
      data: {
        ...(description && { description: description.trim() }),
        ...(sku && { sku: sku.trim(), stockRef: sku.trim() }),
        ...(quantity !== undefined && { quantity: qty }),
        ...(unit && { unit }),
        ...(category && { category }),
        ...(warehouseId && { warehouseId }),
        ...(zone && { zone }),
        ...(row && { row }),
        ...(bay && { bay }),
        location: `${zone || existing.zone || 'Zone A'}/${row || existing.row || 'Row 1'}/${bay || existing.bay || 'Bay 01'}`,
        ...(weightKg !== undefined && { weightKg: parseInt(weightKg, 10) || 0 }),
        ...(pallets !== undefined && { pallets: parseInt(pallets, 10) || null }),
        ...(cubicMetres !== undefined && { cubicMetres: parseFloat(cubicMetres) || null }),
        ...(minQuantity !== undefined && { minQuantity: parseInt(minQuantity, 10) || 5 }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) || 0 }),
        ...(notes !== undefined && { notes }),
        stockStatus: qty > 0 ? 'IN_STORAGE' : 'DISPATCHED'
      },
      include: {
        warehouse: true
      }
    });

    return sendSuccess(res, updated);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    next(error);
  }
};

exports.deleteInventoryItem = async (req, res, next) => {
  try {
    const tenantId = await resolveTenantOrFallback(req);
    const { id } = req.params;
    if (!tenantId) {
      return sendError(res, { code: ERROR_CODES.UNAUTHORIZED_ACCESS, message: 'Company context required' }, HTTP_STATUS.FORBIDDEN);
    }

    const existing = await prisma.loadItem.findFirst({
      where: {
        id,
        OR: [
          { warehouse: { branch: { companyId: tenantId } } },
          { load: { companyId: tenantId } },
          { customer: { companyId: tenantId } }
        ]
      }
    });

    if (!existing) {
      return sendError(res, { code: ERROR_CODES.NOT_FOUND, message: 'Inventory item not found' }, HTTP_STATUS.NOT_FOUND);
    }

    await prisma.loadItem.delete({
      where: { id: existing.id }
    });

    return sendSuccess(res, { message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    next(error);
  }
};
