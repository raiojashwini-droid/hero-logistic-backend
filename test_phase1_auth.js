/**
 * Test 8 — Production auth behavior
 * Must set NODE_ENV before any requires so dotenvx sees it correctly.
 */

// Must be first — before any require calls
process.env.NODE_ENV = 'production';
require('dotenv').config();

const http = require('http');

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: 'localhost',
      port: 5000,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg) { console.log(`  ❌ FAIL: ${msg}`); process.exitCode = 1; }

// We verify the behavior by temporarily overriding NODE_ENV for this test process
// and calling the auth middleware logic directly (unit test style)
async function testProductionAuthBehavior() {
  console.log('\n' + '─'.repeat(60));
  console.log('TEST 8 — Production auth rejection (unit test)');
  console.log('─'.repeat(60));

  // Unit test the middleware directly
  const jwt = require('jsonwebtoken');
  const { verifyToken } = require('./src/middlewares/auth');

  // Force production mode
  process.env.NODE_ENV = 'production';

  let authRejected401 = false;
  let noTokenRejected = false;

  // Mock request/response objects
  const makeReqRes = (token) => {
    const req = {
      cookies: {},
      headers: token ? { authorization: `Bearer ${token}` } : {}
    };
    let capturedStatus = null;
    let capturedBody = null;
    const res = {
      status: (code) => {
        capturedStatus = code;
        return { json: (body) => { capturedBody = body; } };
      }
    };
    return { req, res, getResult: () => ({ status: capturedStatus, body: capturedBody }) };
  };


  // Test A: Completely invalid token
  const { req: r1, res: res1, getResult: get1 } = makeReqRes('invalid.garbage.token');
  let calledNext1 = false;
  verifyToken(r1, res1, () => { calledNext1 = true; });
  const result1 = get1();
  console.log('  Invalid token → status:', result1.status, '| next called:', calledNext1);
  if (result1.status === 401 && !calledNext1) {
    pass('Invalid token rejected with 401 in production mode');
    authRejected401 = true;
  } else {
    fail(`Expected 401 rejection, got status=${result1.status} next=${calledNext1}`);
  }

  // Test B: No token at all
  const { req: r2, res: res2, getResult: get2 } = makeReqRes(null);
  let calledNext2 = false;
  verifyToken(r2, res2, () => { calledNext2 = true; });
  const result2 = get2();
  console.log('  No token → status:', result2.status, '| next called:', calledNext2);
  if (result2.status === 401 && !calledNext2) {
    pass('No token rejected with 401 in production mode');
    noTokenRejected = true;
  } else {
    fail(`Expected 401 rejection, got status=${result2.status} next=${calledNext2}`);
  }

  // Test C: Valid token signed with CORRECT secret → should pass
  const validToken = jwt.sign(
    { userId: '02e7e216-0f7a-48b6-b6d2-1b07fb570ba6', role: 'DRIVER' },
    process.env.JWT_SECRET || 'hero-logistic-jwt-secret-2026',
    { expiresIn: '1m' }
  );
  const { req: r3, res: res3, getResult: get3 } = makeReqRes(validToken);
  let calledNext3 = false;
  verifyToken(r3, res3, () => { calledNext3 = true; });
  const result3 = get3();
  console.log('  Valid token → next called:', calledNext3, '| status (should be null):', result3.status);
  if (calledNext3 && result3.status === null) {
    pass('Valid token accepted — next() called, no error response');
  } else {
    fail(`Valid token was rejected. next=${calledNext3} status=${result3.status}`);
  }

  console.log('  NODE_ENV during test:', process.env.NODE_ENV);
  console.log('\n' + '─'.repeat(60));
  console.log('Summary: production auth bypass disabled =', authRejected401 && noTokenRejected);
  console.log('─'.repeat(60));
  console.log('\nNote: In your current dev environment (NODE_ENV=development),');
  console.log('the bypass in auth.js lines 32-40 is intentional for team development.');
  console.log('Set NODE_ENV=production before deploying to disable it.\n');
}

testProductionAuthBehavior().catch(e => {
  console.error('\n❌ Test crashed:', e.message);
  process.exitCode = 1;
});
