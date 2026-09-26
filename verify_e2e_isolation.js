async function runVerification() {
  console.log('=== POST-FIX SECURITY VERIFICATION E2E TEST ===');
  
  let success = true;
  let report = [];

  async function request(token, method, path, body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('http://localhost:5000/api/v1' + path, opts);
    let data;
    try { data = await res.json(); } catch(e) { data = null; }
    return { status: res.status, data };
  }

  function logTest(testName, method, path, reqComp, targetComp, resStatus, isPassed, details) {
    report.push({ Test: testName, Method: method, Endpoint: path, RequestCompany: reqComp, TargetData: targetComp, Status: resStatus, Passed: isPassed, Details: details });
    if (!isPassed) success = false;
    console.log(`[${isPassed ? 'PASS' : 'FAIL'}] ${testName} -> ${resStatus} : ${details}`);
  }

  try {
    console.log('Requesting Backend to Setup Data...');
    const setupRes = await request(null, 'POST', '/test-setup', {});
    if (setupRes.status !== 200) {
      throw new Error(`Failed to setup test data. API returned ${setupRes.status}: ${JSON.stringify(setupRes.data)}`);
    }

    const d = setupRes.data;
    console.log('Test data created on backend successfully!');

    console.log('Testing GET List...');
    const res1 = await request(d.tokenB, 'GET', '/customers');
    const hasData = res1.data && res1.data.data && res1.data.data.find(c => c.id === d.custA);
    logTest('List Customers', 'GET', '/customers', 'Company B', 'Company A', res1.status, !hasData, hasData ? 'Found Comp A customer' : 'Isolated properly');

    console.log('Testing GET By ID...');
    const res2 = await request(d.tokenB, 'GET', '/customers/' + d.custA);
    const passed2 = res2.status === 404 || res2.status === 403;
    logTest('Get Customer by ID', 'GET', '/customers/:id', 'Company B', 'Company A', res2.status, passed2, passed2 ? 'Access Denied (Expected)' : 'Gained access!');

    console.log('Testing UPDATE...');
    const res3 = await request(d.tokenB, 'PUT', '/drivers/activities/' + d.activityA, { title: 'HACKED' });
    const passed3 = res3.status === 404 || res3.status === 403;
    
    // We cannot easily check the DB here since we are avoiding DB connections, but the response code is 404/403.
    // If the API blocks it, we trust it didn't update.
    logTest('Update Driver Activity by ID', 'PUT', '/drivers/activities/:id', 'Company B', 'Company A', res3.status, passed3, passed3 ? 'Blocked update' : 'Record modified!');

    console.log('Testing DELETE...');
    const res4 = await request(d.tokenB, 'DELETE', '/drivers/activities/' + d.activityA);
    const passed4Final = (res4.status === 404 || res4.status === 403);
    logTest('Delete Driver Activity by ID', 'DELETE', '/drivers/activities/:id', 'Company B', 'Company A', res4.status, passed4Final, passed4Final ? 'Blocked delete' : 'Record was DELETED or returned 20x!');

    console.log('Testing CREATE Spoofing...');
    const res5 = await request(d.tokenA, 'POST', '/notification-templates', { title: 'Spoofed Tpl', body: 'x', companyId: d.compB });
    const templateCreated = res5.data && res5.data.data;
    const isSpoofBlocked = templateCreated && templateCreated.companyId === d.compA;
    logTest('Create Spoofing', 'POST', '/notification-templates', 'Company A', 'Company B', res5.status, isSpoofBlocked, isSpoofBlocked ? 'Forced to Comp A' : 'Spoofed to Comp B!');

    console.log('Cleaning up data...');
    await request(null, 'POST', '/test-cleanup', d);

    // Write Report
    const fs = require('fs');
    const reportPath = 'verification_report.md';
    let md = '# POST-FIX SECURITY VERIFICATION REPORT\n\n';
    md += 'STATUS: **' + (success ? 'PASS' : 'FAIL') + '**\n\n';
    md += '| Test | Method | Endpoint | Requesting | Target | Status | Result | Details |\n';
    md += '|---|---|---|---|---|---|---|---|\n';
    report.forEach(r => {
      md += "| " + r.Test + " | " + r.Method + " | " + r.Endpoint + " | " + r.RequestCompany + " | " + r.TargetData + " | " + r.Status + " | " + (r.Passed ? '✅ PASS' : '❌ FAIL') + " | " + r.Details + " |\n";
    });
    
    fs.writeFileSync(reportPath, md);
    console.log('Report generated at', reportPath);
    console.log('Final Status:', success ? 'PASS' : 'FAIL');

  } catch (err) {
    console.error('Error running test:', err);
  }
}

runVerification();
