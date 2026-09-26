const assert = require('node:assert/strict');
const { test } = require('node:test');

// Isolate controller reads without connecting to or changing a database.
const calls = [];
let stock = [];
const prisma = new Proxy({}, {
  get: (_, model) => ({
    findMany: async (query) => {
      calls.push({ model, query });
      assert.ok(JSON.stringify(query.where).includes('company-a'), `${model} must be company scoped`);
      return model === 'loadItem' ? stock : [];
    }
  })
});
require.cache[require.resolve('../src/utils/prismaClient')] = { exports: prisma };
const controller = require('../src/controllers/WarehousePortalController');
const { requireTenant } = require('../src/middlewares/tenantResolver');

function response() {
  return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test('empty company stock stays empty without global reads or sample creation', async () => {
  for (const handler of [controller.getFindStockPortal, controller.getRelocationPortalData]) {
    calls.length = 0;
    const res = response();
    await handler({ tenantId: 'company-a', user: { role: 'COMPANY_ADMIN' } }, res, error => { throw error; });
    assert.deepEqual(res.body.data.stock, []);
    assert.deepEqual(res.body.data.loadLanes, []);
    assert.deepEqual(res.body.data.holdingAreas, []);
    assert.ok(Object.values(res.body.data.stats).every(value => value === 0));
    assert.equal(calls.filter(call => call.model === 'loadItem').length, 1);
  }
});

test('inbound options stay empty when company has no records', async () => {
  const res = response();
  await controller.getReceiveInboundPortal({ tenantId: 'company-a' }, res, error => { throw error; });
  for (const key of ['suppliers', 'drivers', 'vehicles', 'warehouses', 'holdingAreas', 'loadLanes']) {
    assert.deepEqual(res.body.data[key], []);
  }
});

test('actual company stock is retained', async () => {
  stock = [{ id: 'real-item', stockRef: 'REAL-1', stockStatus: 'IN_STORAGE', photos: [] }];
  try {
    const res = response();
    await controller.getFindStockPortal({ tenantId: 'company-a' }, res, error => { throw error; });
    assert.equal(res.body.data.stock[0].id, 'real-item');
    assert.equal(res.body.data.stats.total, 1);
  } finally {
    stock = [];
  }
});

test('company user without tenant scope is rejected', () => {
  const res = response();
  requireTenant({ user: { role: 'COMPANY_ADMIN' } }, res, () => assert.fail('must not query without tenant'));
  assert.equal(res.code, 403);
});

test('outgoing shipments are company scoped and empty counts stay zero', async () => {
  const res = response();
  await controller.getDispatchReady({ tenantId: 'company-a' }, res, error => { throw error; });
  assert.deepEqual(res.body.data.loads, []);
  assert.ok(Object.values(res.body.data.summary).every(value => value === 0));
});
