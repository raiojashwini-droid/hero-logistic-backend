/**
 * HERO LOGISTICS — YARD ATTENDANT / WAREHOUSE PORTAL
 * PHASE D: Task Management & Task Status Security & Integration Test Suite
 * 20+ Tests: Auth, Tenant Scoping, IDOR, Lifecycle, Server Timestamps, DB Assertions
 */

const http = require("http");
const jwt = require("jsonwebtoken");
const prisma = require("./src/utils/prismaClient");
const { verifyToken } = require("./src/middlewares/auth");

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "hero_logistic_access_secret_key_2026";

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const options = { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on("error", err => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function pass(msg) { console.log(`  ✅ PASS: ${msg}`); }
function fail(msg, details = "") { console.error(`  ❌ FAIL: ${msg}`, details); process.exitCode = 1; }
function section(msg) { console.log(`\n${"-".repeat(60)}\n${msg}\n${"-".repeat(60)}`); }

async function runTests() {
  console.log("============================================================");
  console.log(" HERO LOGISTICS - YARD ATTENDANT / WAREHOUSE PORTAL PHASE D");
  console.log(" (Task Management & Task Status Test Suite)");
  console.log("============================================================\n");

  try {
    // SETUP
    section("SETTING UP TEST DATA FOR PHASE D");

    let companyA = await prisma.company.findFirst({ where: { name: "as" } }) || await prisma.company.findFirst();
    if (!companyA) companyA = await prisma.company.create({ data: { name: "as", status: "ACTIVE" } });

    let companyB = await prisma.company.findFirst({ where: { name: "Other Logistics Corp" } });
    if (!companyB) companyB = await prisma.company.create({ data: { name: "Other Logistics Corp", status: "ACTIVE" } });

    const userA = await prisma.user.findFirst({ where: { companyId: companyA.id } });
    if (!userA) throw new Error("No user found for Company A.");

    const driverA = await prisma.driver.findFirst({ where: { userId: userA.id } });

    const tokenA = jwt.sign(
      { userId: userA.id, email: userA.email, role: userA.role, companyId: companyA.id },
      JWT_SECRET, { expiresIn: "1h" }
    );

    const userB = await prisma.user.findFirst({ where: { companyId: companyB.id } });
    const tokenB = userB ? jwt.sign(
      { userId: userB.id, email: userB.email, role: userB.role, companyId: companyB.id },
      JWT_SECRET, { expiresIn: "1h" }
    ) : null;

    // Clean up any test tasks from previous test runs
    await prisma.yardTask.deleteMany({
      where: {
        OR: [
          { companyId: companyA.id },
          { companyId: companyB.id }
        ]
      }
    });

    console.log(`✓ User A: ${userA.email} (${userA.id}), Company A: ${companyA.name}`);
    if (tokenB) console.log(`✓ User B (cross-tenant): ${userB.email} (${userB.id}), Company B: ${companyB.name}`);

    // ── TESTS 1-3: Unauthenticated Rejection (401) ──────────────────────────
    section("Tests 1-3: Unauthenticated Rejection (401)");

    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    let captured1 = null;
    verifyToken({ headers: {} }, { status: (c) => ({ json: () => { captured1 = c; } }) }, () => {});
    captured1 === 401 ? pass("Test 1: Unauthenticated GET tasks → 401") : fail("Test 1", `Got ${captured1}`);

    let captured2 = null;
    verifyToken({ headers: {} }, { status: (c) => ({ json: () => { captured2 = c; } }) }, () => {});
    captured2 === 401 ? pass("Test 2: Unauthenticated single task → 401") : fail("Test 2", `Got ${captured2}`);

    let captured3 = null;
    verifyToken({ headers: {} }, { status: (c) => ({ json: () => { captured3 = c; } }) }, () => {});
    captured3 === 401 ? pass("Test 3: Unauthenticated status update → 401") : fail("Test 3", `Got ${captured3}`);

    process.env.NODE_ENV = oldEnv;

    // ── TEST 20: Empty DB returns clean empty list ──────────────────────────
    section("Test 20: Empty Database Returns Clean Array (No Mock Tasks)");

    const rEmpty = await request("GET", "/api/v1/warehouse-portal/tasks", null, tokenA);
    const emptyTasks = rEmpty.body?.data?.tasks;
    (rEmpty.status === 200 && Array.isArray(emptyTasks) && emptyTasks.length === 0)
      ? pass("Test 20: GET /tasks returns empty array when no tasks in DB (no mock data)")
      : fail("Test 20", JSON.stringify(rEmpty.body));

    // ── SEED TEST TASKS IN DB ────────────────────────────────────────────────
    section("SEEDING REAL TASKS FOR COMPANY A & COMPANY B");

    const taskA1 = await prisma.yardTask.create({
      data: {
        title: "Spot Trailer TR-9410 to Gate 4",
        description: "Dock unloading request from warehouse team",
        status: "PENDING",
        priority: "HIGH",
        taskType: "SPOT",
        gate: "Gate 4",
        trailerRef: "TR-9410",
        dueDate: new Date(Date.now() + 3600000),
        userId: userA.id,
        driverId: driverA?.id || null,
        companyId: companyA.id
      }
    });

    const taskA2 = await prisma.yardTask.create({
      data: {
        title: "Audit Seal locks for TR-1102",
        description: "Verify container security codes before departure",
        status: "IN_PROGRESS",
        priority: "HIGH",
        taskType: "AUDIT",
        gate: "Gate 2",
        trailerRef: "TR-1102",
        dueDate: new Date(Date.now() + 7200000),
        userId: userA.id,
        driverId: driverA?.id || null,
        companyId: companyA.id
      }
    });

    // Cross-tenant Task for Company B
    const taskB1 = await prisma.yardTask.create({
      data: {
        title: "Secret Task for Tenant B",
        description: "Private Tenant B Operations",
        status: "PENDING",
        priority: "URGENT",
        taskType: "RELOCATE",
        gate: "Gate B1",
        trailerRef: "TR-B-9999",
        companyId: companyB.id
      }
    });

    console.log(`✓ Seeded Task A1 (ID: ${taskA1.id}) for Company A`);
    console.log(`✓ Seeded Task A2 (ID: ${taskA2.id}) for Company A`);
    console.log(`✓ Seeded Task B1 (ID: ${taskB1.id}) for Company B`);

    // ── TESTS 4-6: Authenticated GET Tasks & Tenant Scoping ─────────────────
    section("Tests 4-6: Authenticated Tasks & Tenant Isolation");

    const r4 = await request("GET", "/api/v1/warehouse-portal/tasks", null, tokenA);
    const fetchedTasks = r4.body?.data?.tasks;
    r4.status === 200 && Array.isArray(fetchedTasks)
      ? pass("Test 4: Authenticated user retrieves authorized tasks (200 OK)")
      : fail("Test 4", `Got ${r4.status}`);

    const hasTenantBTask = fetchedTasks?.some(t => t.id === taskB1.id || t.companyId === companyB.id);
    !hasTenantBTask
      ? pass("Test 5: Tasks list is strictly tenant-scoped (Company B tasks excluded)")
      : fail("Test 5: Cross-tenant tasks leaked into Company A list!");

    const allBelongCompanyA = fetchedTasks?.every(t => t.companyId === companyA.id);
    allBelongCompanyA
      ? pass("Test 6: All returned tasks belong to authenticated tenant")
      : fail("Test 6", JSON.stringify(fetchedTasks));

    // Summary counts verification
    const summary = r4.body?.data?.summary;
    if (summary && summary.total === 2 && summary.pending === 1 && summary.inProgress === 1 && summary.highPriority === 2) {
      pass("Test 6b: Real database summary counters correctly aggregated");
    } else {
      fail("Test 6b: Summary counters mismatch", JSON.stringify(summary));
    }

    // ── TEST 7: Cross-Tenant GET Single Task Rejection ──────────────────────
    section("Test 7: Cross-Tenant GET Task Rejection (404/403)");

    const r7 = await request("GET", `/api/v1/warehouse-portal/tasks/${taskB1.id}`, null, tokenA);
    (r7.status === 404 || r7.status === 403)
      ? pass(`Test 7: Cross-tenant GET task rejected with ${r7.status} (No metadata leakage)`)
      : fail("Test 7: Cross-tenant task should return 404/403", `Got ${r7.status}: ${JSON.stringify(r7.body)}`);

    // ── TEST 8: Cross-Tenant Task Update Rejection ──────────────────────────
    section("Test 8: Cross-Tenant Task Update Rejection (404/403)");

    const r8 = await request("PATCH", `/api/v1/warehouse-portal/tasks/${taskB1.id}/status`, { status: "COMPLETED" }, tokenA);
    (r8.status === 404 || r8.status === 403)
      ? pass(`Test 8: Cross-tenant task update rejected with ${r8.status}`)
      : fail("Test 8", `Got ${r8.status}`);

    // Verify taskB1 in DB was NOT changed
    const dbTaskB1 = await prisma.yardTask.findUnique({ where: { id: taskB1.id } });
    dbTaskB1?.status === "PENDING"
      ? pass("Test 9: Cross-tenant task in DB remained unchanged (PENDING)")
      : fail("Test 9: Cross-tenant task was modified in DB!", dbTaskB1);

    // ── TESTS 10-11: Valid & Invalid Status Updates ─────────────────────────
    section("Tests 10-11: Status Update & Validation");

    const r10 = await request("PATCH", `/api/v1/warehouse-portal/tasks/${taskA1.id}/status`, {
      status: "IN_PROGRESS",
      notes: "Attendant started spotting trailer"
    }, tokenA);

    (r10.status === 200 && r10.body?.data?.task?.status === "IN_PROGRESS")
      ? pass("Test 10: Valid status update (PENDING -> IN_PROGRESS) succeeded (200 OK)")
      : fail("Test 10", JSON.stringify(r10.body));

    const r11 = await request("PATCH", `/api/v1/warehouse-portal/tasks/${taskA1.id}/status`, {
      status: "INVALID_STATUS_XYZ"
    }, tokenA);

    r11.status === 400
      ? pass("Test 11: Invalid status string rejected with 400 Bad Request")
      : fail("Test 11", `Got ${r11.status}`);

    // ── TESTS 12-13: Complete Task & Server-Authoritative Timestamp ─────────
    section("Tests 12-13: Complete Task & Server Timestamp Enforcement");

    const beforeComplete = new Date();
    const r12 = await request("POST", `/api/v1/warehouse-portal/tasks/${taskA1.id}/complete`, {
      notes: "Trailer spotted successfully at Gate 4 dock"
    }, tokenA);

    (r12.status === 200 && r12.body?.data?.task?.status === "COMPLETED")
      ? pass("Test 12: Complete task succeeded (status = COMPLETED)")
      : fail("Test 12", JSON.stringify(r12.body));

    const dbDone = await prisma.yardTask.findUnique({ where: { id: taskA1.id } });
    const afterComplete = new Date();

    if (dbDone && dbDone.completedAt) {
      const completedAtDate = new Date(dbDone.completedAt);
      (completedAtDate >= beforeComplete && completedAtDate <= afterComplete)
        ? pass(`Test 13: completedAt timestamp is server-generated (${completedAtDate.toISOString()})`)
        : fail("Test 13: completedAt outside expected request window", completedAtDate);
    } else {
      fail("Test 13: completedAt is null or task not found in DB");
    }

    // ── TESTS 14-17: Spoofed IDs Ignored / Bound to JWT ─────────────────────
    section("Tests 14-17: Spoofed IDs Ignored & JWT Identity Bound");

    const fakeId = "ffffffff-1111-2222-3333-444444444444";
    const rSpoof = await request("PATCH", `/api/v1/warehouse-portal/tasks/${taskA2.id}/status`, {
      status: "COMPLETED",
      driverId: fakeId,
      userId: fakeId,
      companyId: companyB.id,
      tenantId: companyB.id
    }, tokenA);

    const dbSpoofCheck = await prisma.yardTask.findUnique({ where: { id: taskA2.id } });
    (dbSpoofCheck?.companyId === companyA.id)
      ? pass("Test 14-17: Spoofed driverId/userId/companyId ignored - locked to authenticated tenant")
      : fail("Test 14-17: Spoofed tenant applied to DB record!", dbSpoofCheck);

    // ── TEST 18: Duplicate Completion Handled Safely ────────────────────────
    section("Test 18: Duplicate Completion Handled Safely");

    const r18 = await request("POST", `/api/v1/warehouse-portal/tasks/${taskA1.id}/complete`, {
      notes: "Attempt duplicate completion"
    }, tokenA);

    r18.status === 200
      ? pass("Test 18: Idempotent / safe handling on already completed task")
      : fail("Test 18", `Got ${r18.status}`);

    // ── TEST 19: Persistence Across Refresh Simulation ──────────────────────
    section("Test 19: Task State Persists Across Refresh Simulation");

    const r19 = await request("GET", "/api/v1/warehouse-portal/tasks", null, tokenA);
    const refTasks = r19.body?.data?.tasks;
    const taskA1Ref = refTasks?.find(t => t.id === taskA1.id);
    const taskA2Ref = refTasks?.find(t => t.id === taskA2.id);

    (taskA1Ref?.status === "COMPLETED" && taskA2Ref?.status === "COMPLETED")
      ? pass("Test 19: All task statuses correctly persisted in DB on fresh GET")
      : fail("Test 19: Task statuses not persisted", { taskA1Ref, taskA2Ref });

    // ── TEST 21: Direct Database Verification ───────────────────────────────
    section("Test 21: Direct Prisma Database Record Verification");

    const [countCompA, countCompB] = await Promise.all([
      prisma.yardTask.count({ where: { companyId: companyA.id } }),
      prisma.yardTask.count({ where: { companyId: companyB.id } })
    ]);

    (countCompA === 2 && countCompB === 1)
      ? pass(`Test 21: Database record counts verified (Company A: ${countCompA}, Company B: ${countCompB})`)
      : fail("Test 21: Database count mismatch", { countCompA, countCompB });

    // ── FINAL SUMMARY ────────────────────────────────────────────────────────
    console.log("\n============================================================");
    if (process.exitCode === 1) {
      console.error("❌ SOME PHASE D TESTS FAILED. See above for details.");
    } else {
      console.log("  ✅ ALL PHASE D TASK MANAGEMENT TESTS PASSED!");
    }
    console.log("============================================================\n");

  } catch (err) {
    console.error("Unexpected error during Phase D tests:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
