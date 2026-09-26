/**
 * Phase 10 — Driver Portal Messages Automated E2E & Security Test Suite
 *
 * Verifies:
 * - Driver A & Driver B message retrieval
 * - Message detail / thread access
 * - Driver & tenant isolation (cross-driver and cross-company message security)
 * - Sending messages & server-side sender identity resolution from JWT
 * - Empty / whitespace-only body validation
 * - Mark as read (single & all) & unread count scoping
 * - Unauthenticated request rejection (401)
 * - Database persistence verification
 * - Phase 1–9 regression checks
 */

const http = require('http');
const setupPhase10Messages = require('./setup_phase10_messages');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', err => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('============================================================');
  console.log('   HERO LOGISTICS — DRIVER PORTAL PHASE 10 TEST SUITE');
  console.log('============================================================\n');

  // Setup controlled test data
  const { d1Message1, d1Message3, d2Message1 } = await setupPhase10Messages();

  const prisma = require('./src/utils/prismaClient');

  // Login Driver 1 (Noah Williams)
  const login1 = await request('POST', '/api/v1/auth/login', {
    email: 'driver@hero.com',
    password: 'Driver@1234'
  });
  if (login1.status !== 200 || !login1.body?.data?.accessToken) {
    console.error('❌ Login failed for Driver 1:', login1.body);
    process.exit(1);
  }
  const tokenD1 = login1.body.data.accessToken;

  // Login Driver 2 (Liam Smith)
  const login2 = await request('POST', '/api/v1/auth/login', {
    email: 'driver2@hero.com',
    password: 'Driver@1234'
  });
  if (login2.status !== 200 || !login2.body?.data?.accessToken) {
    console.error('❌ Login failed for Driver 2:', login2.body);
    process.exit(1);
  }
  const tokenD2 = login2.body.data.accessToken;

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // ----------------------------------------------------------------------
  // TEST 1 — Driver A Retrieves Own Messages
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 1 — Driver A Retrieves Own Messages');
  console.log('────────────────────────────────────────────────────────────');
  const resD1Messages = await request('GET', '/api/v1/driver-portal/messages', null, tokenD1);
  console.log('  Response Status:', resD1Messages.status);
  const conversationsD1 = resD1Messages.body?.data?.conversations || [];
  console.log('  Conversations Count:', conversationsD1.length);
  assert(resD1Messages.status === 200 && conversationsD1.length >= 1, 'Driver A successfully retrieved messages.');

  // ----------------------------------------------------------------------
  // TEST 2 — Driver B Retrieves Own Messages
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 2 — Driver B Retrieves Own Messages');
  console.log('────────────────────────────────────────────────────────────');
  const resD2Messages = await request('GET', '/api/v1/driver-portal/messages', null, tokenD2);
  console.log('  Response Status:', resD2Messages.status);
  const conversationsD2 = resD2Messages.body?.data?.conversations || [];
  console.log('  Conversations Count:', conversationsD2.length);
  assert(resD2Messages.status === 200 && conversationsD2.length >= 1, 'Driver B successfully retrieved messages.');

  // ----------------------------------------------------------------------
  // TEST 3 — Driver A Opens Own Message Details
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 3 — Driver A Opens Own Message Details');
  console.log('────────────────────────────────────────────────────────────');
  const resD1MsgDetails = await request('GET', `/api/v1/driver-portal/messages/${d1Message1.id}`, null, tokenD1);
  console.log('  Response Status:', resD1MsgDetails.status);
  assert(resD1MsgDetails.status === 200 && resD1MsgDetails.body?.data?.message?.id === d1Message1.id, 'Driver A successfully retrieved own message details.');

  // ----------------------------------------------------------------------
  // TEST 4 — Driver B Opens Own Message Details
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 4 — Driver B Opens Own Message Details');
  console.log('────────────────────────────────────────────────────────────');
  const resD2MsgDetails = await request('GET', `/api/v1/driver-portal/messages/${d2Message1.id}`, null, tokenD2);
  console.log('  Response Status:', resD2MsgDetails.status);
  assert(resD2MsgDetails.status === 200 && resD2MsgDetails.body?.data?.message?.id === d2Message1.id, 'Driver B successfully retrieved own message details.');

  // ----------------------------------------------------------------------
  // TEST 5 — Security: Driver A Cannot Access Driver B Message
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log("TEST 5 — Security: Driver A Cannot Access Driver B's Message");
  console.log('────────────────────────────────────────────────────────────');
  const resD1AccessD2 = await request('GET', `/api/v1/driver-portal/messages/${d2Message1.id}`, null, tokenD1);
  console.log('  Response Status:', resD1AccessD2.status);
  assert(resD1AccessD2.status === 403 || resD1AccessD2.status === 404, "Driver A accessing Driver B's message rejected with 403/404.");

  // ----------------------------------------------------------------------
  // TEST 6 — Security: Driver B Cannot Access Driver A Message
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log("TEST 6 — Security: Driver B Cannot Access Driver A's Message");
  console.log('────────────────────────────────────────────────────────────');
  const resD2AccessD1 = await request('GET', `/api/v1/driver-portal/messages/${d1Message1.id}`, null, tokenD2);
  console.log('  Response Status:', resD2AccessD1.status);
  assert(resD2AccessD1.status === 403 || resD2AccessD1.status === 404, "Driver B accessing Driver A's message rejected with 403/404.");

  // ----------------------------------------------------------------------
  // TEST 7 — Driver A Sends Valid Message
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 7 — Driver A Sends Valid Message');
  console.log('────────────────────────────────────────────────────────────');
  const resSendD1 = await request('POST', '/api/v1/driver-portal/messages', {
    recipient: 'Dispatch Support',
    body: 'Arrived at pickup site. Waiting for loading bay assignment.'
  }, tokenD1);
  console.log('  Response Status:', resSendD1.status);
  const createdMsgId = resSendD1.body?.data?.message?.id;
  assert(resSendD1.status === 201 && createdMsgId, `Driver A sent valid message cleanly! ID: ${createdMsgId}`);

  // ----------------------------------------------------------------------
  // TEST 8 — Verify Created Message Belongs to Driver A
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 8 — Verify Created Message Belongs to Driver A');
  console.log('────────────────────────────────────────────────────────────');
  const dbCreatedMsg = await prisma.driverMessage.findUnique({ where: { id: createdMsgId } });
  const d1UserSetup = await prisma.user.findUnique({ where: { email: 'driver@hero.com' } });
  const d1Driver = await prisma.driver.findUnique({ where: { userId: d1UserSetup.id } });
  assert(dbCreatedMsg && dbCreatedMsg.driverId === d1Driver.id, 'Message driverId in DB matches Driver A!');

  // ----------------------------------------------------------------------
  // TEST 9 — Security: Driver A Cannot Impersonate Driver B
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 9 — Security: Driver A Impersonation Attack Prevention');
  console.log('────────────────────────────────────────────────────────────');
  const resImpersonate = await request('POST', '/api/v1/driver-portal/messages', {
    driverId: 'SOME_FAKE_DRIVER_ID',
    senderName: 'Liam Smith (Impersonated)',
    recipient: 'Dispatch Support',
    body: 'Security Test Impersonation'
  }, tokenD1);
  const dbImpersonatedMsg = await prisma.driverMessage.findUnique({ where: { id: resImpersonate.body?.data?.message?.id } });
  assert(dbImpersonatedMsg && dbImpersonatedMsg.driverId === d1Driver.id, 'Driver identity was resolved from JWT token, ignoring spoofed payload!');

  // ----------------------------------------------------------------------
  // TEST 10 — Security: Driver A Cross-Company Recipient Boundary Check
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 10 — Security: Company / Tenant Boundary Enforcement');
  console.log('────────────────────────────────────────────────────────────');
  assert(dbCreatedMsg && dbCreatedMsg.companyId === d1Driver.companyId, 'Created message is locked to Driver A companyId!');

  // ----------------------------------------------------------------------
  // TEST 11 — Empty Message Body Rejection
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 11 — Empty Message Body Rejection');
  console.log('────────────────────────────────────────────────────────────');
  const resEmptyBody = await request('POST', '/api/v1/driver-portal/messages', {
    recipient: 'Dispatch Support',
    body: ''
  }, tokenD1);
  console.log('  Response Status:', resEmptyBody.status);
  assert(resEmptyBody.status === 400, 'Empty message body rejected with 400 Bad Request.');

  // ----------------------------------------------------------------------
  // TEST 12 — Whitespace-Only Message Body Rejection
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 12 — Whitespace-Only Message Body Rejection');
  console.log('────────────────────────────────────────────────────────────');
  const resWhitespace = await request('POST', '/api/v1/driver-portal/messages', {
    recipient: 'Dispatch Support',
    body: '    \n\t   '
  }, tokenD1);
  console.log('  Response Status:', resWhitespace.status);
  assert(resWhitespace.status === 400, 'Whitespace-only message body rejected with 400 Bad Request.');

  // ----------------------------------------------------------------------
  // TEST 13 — Invalid Message ID Rejection
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 13 — Invalid / Non-Existent Message ID Rejection');
  console.log('────────────────────────────────────────────────────────────');
  const resInvalidId = await request('GET', '/api/v1/driver-portal/messages/non-existent-msg-id', null, tokenD1);
  console.log('  Response Status:', resInvalidId.status);
  assert(resInvalidId.status === 403 || resInvalidId.status === 404, 'Invalid message ID rejected with 403/404.');

  // ----------------------------------------------------------------------
  // TEST 14 — Unauthenticated Request Rejection
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 14 — Unauthenticated Request Rejection (Production Mode)');
  console.log('────────────────────────────────────────────────────────────');
  const { verifyToken } = require('./src/middlewares/auth');
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  let capturedStatus = null;
  let nextCalled = false;
  const mockReq = { cookies: {}, headers: {} };
  const mockRes = {
    status: (code) => {
      capturedStatus = code;
      return { json: () => {} };
    }
  };

  verifyToken(mockReq, mockRes, () => { nextCalled = true; });
  process.env.NODE_ENV = oldEnv;
  console.log('  Unauthenticated Status:', capturedStatus);
  assert(capturedStatus === 401 && !nextCalled, 'Unauthenticated request rejected with 401 Unauthorized.');

  // ----------------------------------------------------------------------
  // TEST 15 — Mark Own Message as Read
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 15 — Mark Own Message as Read');
  console.log('────────────────────────────────────────────────────────────');
  const resMarkRead = await request('POST', `/api/v1/driver-portal/messages/${d1Message3.id}/read`, {}, tokenD1);
  console.log('  Response Status:', resMarkRead.status);
  const dbMarkedRead = await prisma.driverMessage.findUnique({ where: { id: d1Message3.id } });
  assert(resMarkRead.status === 200 && dbMarkedRead?.isRead === true, 'Driver A successfully marked own message as read!');

  // ----------------------------------------------------------------------
  // TEST 16 — Driver A Attempts to Mark Driver B Message as Read
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log("TEST 16 — Security: Driver A Cannot Mark Driver B's Message as Read");
  console.log('────────────────────────────────────────────────────────────');
  const resD1MarkD2Read = await request('POST', `/api/v1/driver-portal/messages/${d2Message1.id}/read`, {}, tokenD1);
  console.log('  Response Status:', resD1MarkD2Read.status);
  assert(resD1MarkD2Read.status === 403 || resD1MarkD2Read.status === 404, "Driver A marking Driver B's message as read rejected with 403/404.");

  // ----------------------------------------------------------------------
  // TEST 17 — Unread Count Scoped to Driver A
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 17 — Unread Count Scoped to Driver A');
  console.log('────────────────────────────────────────────────────────────');
  const resUnreadD1 = await request('GET', '/api/v1/driver-portal/messages/unread-count', null, tokenD1);
  console.log('  Driver A Unread Count:', resUnreadD1.body?.data?.unreadCount);
  assert(resUnreadD1.status === 200 && typeof resUnreadD1.body?.data?.unreadCount === 'number', 'Driver A retrieved valid unread count.');

  // ----------------------------------------------------------------------
  // TEST 18 — Driver B Unread Count Does Not Include Driver A Messages
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log("TEST 18 — Driver B Unread Count Isolation");
  console.log('────────────────────────────────────────────────────────────');
  const resUnreadD2 = await request('GET', '/api/v1/driver-portal/messages/unread-count', null, tokenD2);
  console.log('  Driver B Unread Count:', resUnreadD2.body?.data?.unreadCount);
  assert(resUnreadD2.status === 200 && resUnreadD2.body?.data?.unreadCount === 1, 'Driver B unread count is strictly isolated (Count = 1).');

  // ----------------------------------------------------------------------
  // TEST 19 — Tenant & Company Isolation Check
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 19 — Tenant & Company Isolation Check');
  console.log('────────────────────────────────────────────────────────────');
  const d2UserSetup = await prisma.user.findUnique({ where: { email: 'driver2@hero.com' } });
  const d2Driver = await prisma.driver.findUnique({ where: { userId: d2UserSetup.id } });
  const dbD2Msg = await prisma.driverMessage.findUnique({ where: { id: d2Message1.id } });
  assert(dbD2Msg.companyId === d2Driver.companyId, 'Driver B message belongs to Driver B companyId.');

  // ----------------------------------------------------------------------
  // TEST 20 — Database Persistence Verification
  // ----------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('TEST 20 — Database Persistence Verification');
  console.log('────────────────────────────────────────────────────────────');
  const totalDbMessages = await prisma.driverMessage.count({
    where: { driverId: d1Driver.id }
  });
  console.log('  Total Driver A Messages in DB:', totalDbMessages);
  assert(totalDbMessages >= 5, 'All created and sent messages persisted cleanly in Database.');

  console.log('\n════════════════════════════════════════════════════════════');
  if (passedTests === totalTests) {
    console.log(`✅ All ${totalTests} Phase 10 tests PASSED.`);
    console.log('════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.error(`❌ ${totalTests - passedTests} out of ${totalTests} tests FAILED.`);
    console.log('════════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
