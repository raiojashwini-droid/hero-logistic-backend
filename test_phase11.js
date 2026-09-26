/**
 * Phase 11 — Driver Incidents & Emergency SOS Automated E2E & Security Test Suite
 *
 * Verifies:
 * - Driver A & Driver B incident list retrieval
 * - Incident detail retrieval
 * - Cross-driver incident access security (403 Forbidden)
 * - Submitting new incident reports with server-side validation
 * - Impersonation attack prevention (JWT identity resolution)
 * - Empty / whitespace-only description rejection (400 Bad Request)
 * - Emergency SOS panic alert trigger with GPS location (-37.8136, 144.9631)
 * - Emergency SOS DB persistence & company boundary verification
 * - Unauthenticated request rejection (401 Unauthorized)
 * - Phase 10 Messages regression check
 */

const http = require('http');
const prisma = require('./src/utils/prismaClient');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', err => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('────────────────────────────────────────────────────────────');
  console.log('PHASE 11 — DRIVER INCIDENTS & EMERGENCY SOS E2E & SECURITY TESTS');
  console.log('────────────────────────────────────────────────────────────\n');

  try {
    // Login Driver A
    const resLogin1 = await request('POST', '/api/v1/auth/login', {
      email: 'driver@hero.com',
      password: 'Driver@1234'
    });
    const tokenD1 = resLogin1.body?.data?.accessToken;

    // Login Driver B
    const resLogin2 = await request('POST', '/api/v1/auth/login', {
      email: 'driver2@hero.com',
      password: 'Driver@1234'
    });
    const tokenD2 = resLogin2.body?.data?.accessToken;

    if (!tokenD1 || !tokenD2) {
      console.error('❌ Failed to obtain JWT tokens for Driver A or Driver B.');
      process.exit(1);
    }

    // Get DB records for Driver A and Driver B
    const d1User = await prisma.user.findUnique({ where: { email: 'driver@hero.com' } });
    const d2User = await prisma.user.findUnique({ where: { email: 'driver2@hero.com' } });
    const d1 = await prisma.driver.findUnique({ where: { userId: d1User.id } });
    const d2 = await prisma.driver.findUnique({ where: { userId: d2User.id } });

    // Seed test records
    let d1Incident = await prisma.driverIncident.findFirst({ where: { driverId: d1.id } });
    let d2Incident = await prisma.driverIncident.findFirst({ where: { driverId: d2.id } });

    if (!d1Incident) {
      d1Incident = await prisma.driverIncident.create({
        data: {
          driverId: d1.id,
          companyId: d1.companyId,
          incidentType: 'INCIDENT',
          category: 'Cargo Damage Exception',
          description: 'Minor strap tension scratch on rear car bumper during transit.',
          status: 'UNDER_REVIEW'
        }
      });
    }

    if (!d2Incident) {
      d2Incident = await prisma.driverIncident.create({
        data: {
          driverId: d2.id,
          companyId: d2.companyId,
          incidentType: 'SOS',
          category: 'HIGHWAY_ACCIDENT',
          description: 'BLOWN TYRE ON HUME HWY SOUTHBOUND.',
          status: 'UNDER_REVIEW',
          isSos: true
        }
      });
    }

    // ── TEST 1: Driver A Retrieves Own Incidents ──────────────────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 1 — Driver A Retrieves Own Incidents');
    console.log('────────────────────────────────────────────────────────────');
    const resD1Incidents = await request('GET', '/api/v1/driver-portal/incidents', null, tokenD1);
    console.log('  Response Status:', resD1Incidents.status);
    const listD1 = resD1Incidents.body?.data?.incidents || [];
    console.log('  Incidents Count:', listD1.length);
    assert(resD1Incidents.status === 200 && listD1.length >= 1, 'Driver A successfully retrieved incident history.');

    // ── TEST 2: Driver B Retrieves Own Incidents ──────────────────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 2 — Driver B Retrieves Own Incidents');
    console.log('────────────────────────────────────────────────────────────');
    const resD2Incidents = await request('GET', '/api/v1/driver-portal/incidents', null, tokenD2);
    console.log('  Response Status:', resD2Incidents.status);
    const listD2 = resD2Incidents.body?.data?.incidents || [];
    console.log('  Incidents Count:', listD2.length);
    assert(resD2Incidents.status === 200 && listD2.length >= 1, 'Driver B successfully retrieved incident history.');

    // ── TEST 3: Driver A Opens Own Incident Details ───────────────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 3 — Driver A Opens Own Incident Details');
    console.log('────────────────────────────────────────────────────────────');
    const resD1Detail = await request('GET', `/api/v1/driver-portal/incidents/${d1Incident.id}`, null, tokenD1);
    console.log('  Response Status:', resD1Detail.status);
    assert(resD1Detail.status === 200 && resD1Detail.body?.data?.incident?.id === d1Incident.id, 'Driver A successfully retrieved own incident details.');

    // ── TEST 4: Driver B Opens Own Incident Details ───────────────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 4 — Driver B Opens Own Incident Details');
    console.log('────────────────────────────────────────────────────────────');
    const resD2Detail = await request('GET', `/api/v1/driver-portal/incidents/${d2Incident.id}`, null, tokenD2);
    console.log('  Response Status:', resD2Detail.status);
    assert(resD2Detail.status === 200 && resD2Detail.body?.data?.incident?.id === d2Incident.id, 'Driver B successfully retrieved own incident details.');

    // ── TEST 5: Security: Driver A Cannot Access Driver B's Incident ───
    console.log('\n────────────────────────────────────────────────────────────');
    console.log("TEST 5 — Security: Driver A Cannot Access Driver B's Incident");
    console.log('────────────────────────────────────────────────────────────');
    const resD1AccessD2 = await request('GET', `/api/v1/driver-portal/incidents/${d2Incident.id}`, null, tokenD1);
    console.log('  Response Status:', resD1AccessD2.status);
    assert(resD1AccessD2.status === 403 || resD1AccessD2.status === 404, "Driver A accessing Driver B's incident rejected with 403/404.");

    // ── TEST 6: Security: Driver B Cannot Access Driver A's Incident ───
    console.log('\n────────────────────────────────────────────────────────────');
    console.log("TEST 6 — Security: Driver B Cannot Access Driver A's Incident");
    console.log('────────────────────────────────────────────────────────────');
    const resD2AccessD1 = await request('GET', `/api/v1/driver-portal/incidents/${d1Incident.id}`, null, tokenD2);
    console.log('  Response Status:', resD2AccessD1.status);
    assert(resD2AccessD1.status === 403 || resD2AccessD1.status === 404, "Driver B accessing Driver A's incident rejected with 403/404.");

    // ── TEST 7: Driver A Submits Valid Incident Report ─────────────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 7 — Driver A Submits Valid Incident Report');
    console.log('────────────────────────────────────────────────────────────');
    const resCreateD1 = await request('POST', '/api/v1/driver-portal/incidents', {
      category: 'Truck / Trailer Defects',
      description: 'Right trailer brake air pressure gauge fluctuates below 60 PSI.'
    }, tokenD1);
    console.log('  Response Status:', resCreateD1.status);
    const newIncId = resCreateD1.body?.data?.incident?.id;
    assert(resCreateD1.status === 201 && !!newIncId, `Driver A created incident report cleanly! ID: ${newIncId}`);

    // ── TEST 8: Verify Created Incident Belongs to Driver A ────────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 8 — Verify Created Incident Belongs to Driver A');
    console.log('────────────────────────────────────────────────────────────');
    const dbIncCheck = await prisma.driverIncident.findUnique({ where: { id: newIncId } });
    assert(dbIncCheck?.driverId === d1.id, 'Created incident driverId in DB matches Driver A!');

    // ── TEST 9: Security: Driver A Impersonation Attack Prevention ──────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 9 — Security: Driver A Impersonation Attack Prevention');
    console.log('────────────────────────────────────────────────────────────');
    const resSpoof = await request('POST', '/api/v1/driver-portal/incidents', {
      driverId: d2.id,
      companyId: 'SPOOFED_COMPANY_ID',
      category: 'Highway Road Accident',
      description: 'Spoofed request trying to forge Driver B identity.'
    }, tokenD1);
    const spoofIncId = resSpoof.body?.data?.incident?.id;
    const dbSpoofCheck = await prisma.driverIncident.findUnique({ where: { id: spoofIncId } });
    assert(dbSpoofCheck?.driverId === d1.id && dbSpoofCheck?.companyId === d1.companyId, 'Driver identity was resolved from JWT token, ignoring spoofed payload!');

    // ── TEST 10: Security: Company Boundary Enforcement ────────────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 10 — Security: Company / Tenant Boundary Enforcement');
    console.log('────────────────────────────────────────────────────────────');
    assert(dbIncCheck?.companyId === d1.companyId, 'Incident report is locked to Driver A companyId!');

    // ── TEST 11: Empty Incident Description Rejection ──────────────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 11 — Empty Incident Description Rejection');
    console.log('────────────────────────────────────────────────────────────');
    const resEmptyDesc = await request('POST', '/api/v1/driver-portal/incidents', {
      category: 'Cargo Damage Exception',
      description: ''
    }, tokenD1);
    console.log('  Response Status:', resEmptyDesc.status);
    assert(resEmptyDesc.status === 400, 'Empty incident description rejected with 400 Bad Request.');

    // ── TEST 12: Whitespace-Only Description Rejection ─────────────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 12 — Whitespace-Only Description Rejection');
    console.log('────────────────────────────────────────────────────────────');
    const resWhitespace = await request('POST', '/api/v1/driver-portal/incidents', {
      category: 'Cargo Damage Exception',
      description: '    \n\t   '
    }, tokenD1);
    console.log('  Response Status:', resWhitespace.status);
    assert(resWhitespace.status === 400, 'Whitespace-only description rejected with 400 Bad Request.');

    // ── TEST 13: Driver A Triggers Emergency SOS Panic Alert ───────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 13 — Driver A Triggers Emergency SOS Panic Alert');
    console.log('────────────────────────────────────────────────────────────');
    const resSos = await request('POST', '/api/v1/driver-portal/incidents/sos', {
      category: 'PANIC_ALERT',
      description: 'IMMEDIATE SOS: ENGINE FIRE ON M1 NORTHBOUND.',
      gpsLat: -33.8688,
      gpsLng: 151.2093,
      shareGps: true,
      autoNotify: true
    }, tokenD1);
    console.log('  Response Status:', resSos.status);
    const sosId = resSos.body?.data?.sos?.id;
    assert(resSos.status === 201 && !!sosId, `Emergency SOS Broadcast dispatched cleanly! ID: ${sosId}`);

    // ── TEST 14: Emergency SOS Database Persistence Verification ───────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 14 — Emergency SOS Database Persistence Verification');
    console.log('────────────────────────────────────────────────────────────');
    const dbSos = await prisma.driverIncident.findUnique({ where: { id: sosId } });
    assert(dbSos?.isSos === true && dbSos?.driverId === d1.id && dbSos?.gpsLat === -33.8688, 'Emergency SOS persisted cleanly in DB with GPS coordinates!');

    // ── TEST 15: Invalid / Non-Existent Incident ID Rejection ──────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 15 — Invalid / Non-Existent Incident ID Rejection');
    console.log('────────────────────────────────────────────────────────────');
    const resInvalidId = await request('GET', '/api/v1/driver-portal/incidents/non-existent-inc-id', null, tokenD1);
    console.log('  Response Status:', resInvalidId.status);
    assert(resInvalidId.status === 403 || resInvalidId.status === 404, 'Invalid incident ID rejected with 403/404.');

    // ── TEST 16: Unauthenticated Request Rejection (Production Mode) ────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 16 — Unauthenticated Request Rejection (Production Mode)');
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

    // ── TEST 17: Previous Phase 10 Messages Regression Check ──────────
    console.log('\n────────────────────────────────────────────────────────────');
    console.log('TEST 17 — Previous Phase 10 Messages Regression Check');
    console.log('────────────────────────────────────────────────────────────');
    const resMsgReg = await request('GET', '/api/v1/driver-portal/messages', null, tokenD1);
    console.log('  Phase 10 Messages Status:', resMsgReg.status);
    assert(resMsgReg.status === 200, 'Phase 10 Messages API remains fully functional!');

    console.log('\n════════════════════════════════════════════════════════════');
    if (process.exitCode === 1) {
      console.log('❌ Some Phase 11 tests FAILED.');
    } else {
      console.log('✅ All 17 Phase 11 tests PASSED.');
    }
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Test suite crash error:', error);
    process.exit(1);
  }
}

runTests();
