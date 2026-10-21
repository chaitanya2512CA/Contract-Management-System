const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING AUTOMATED FLOW VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, desc) => {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const health = await fetch(`${BASE_URL}/health`).then((r) => r.json());
    assert(health.status === 'healthy', 'Health check returns healthy');

    // 2. Security Test: Student cannot log in through Admin Portal
    const studentInAdminPortal = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@12345' }),
    });
    assert(
      studentInAdminPortal.status === 403,
      'Student credentials rejected at Admin Portal with status 403'
    );

    // 3. Security Test: Organizer cannot log in through Admin Portal
    const organizerInAdminPortal = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer@college.edu', password: 'Organizer@12345' }),
    });
    assert(
      organizerInAdminPortal.status === 403,
      'Organizer credentials rejected at Admin Portal with status 403'
    );

    // 4. Admin Portal Login Success
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@12345' }),
    });
    const adminData = await adminLoginRes.json();
    assert(
      adminLoginRes.status === 200 && adminData.token && adminData.user.role === 'admin',
      'Administrator authenticates successfully and obtains JWT token'
    );
    const adminToken = adminData.token;

    // 5. Security Test: Unauthorized access to Admin API endpoints without token
    const unauthAdminAccess = await fetch(`${BASE_URL}/admin/stats`);
    assert(
      unauthAdminAccess.status === 401,
      'Access to /api/admin/stats without token returns 401 Unauthorized'
    );

    // 6. Student Login Portal Success
    const studentLoginRes = await fetch(`${BASE_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@12345' }),
    });
    const studentData = await studentLoginRes.json();
    assert(
      studentLoginRes.status === 200 && studentData.token && studentData.user.role === 'student',
      'Student authenticates successfully via Student Portal'
    );
    const studentToken = studentData.token;

    // 7. Security Test: Student token used against Admin API endpoint
    const studentAccessToAdmin = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentAccessToAdmin.status === 403,
      'Student token attempting to access /api/admin/stats returns 403 Forbidden'
    );

    // 8. Admin Token accessing Admin API endpoint
    const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await adminStatsRes.json();
    assert(
      adminStatsRes.status === 200 && statsData.stats.users.total > 0,
      'Admin access to /api/admin/stats succeeds with comprehensive metrics'
    );

    // 9. Fetch Pending Events for Admin Moderation
    const pendingEventsRes = await fetch(`${BASE_URL}/admin/events/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingData = await pendingEventsRes.json();
    assert(
      pendingEventsRes.status === 200 && pendingData.events.length > 0,
      `Admin retrieves pending event approvals queue (${pendingData.events.length} pending)`
    );

    const testEventToApprove = pendingData.events[0];
    if (testEventToApprove) {
      // 10. Admin Approves Event
      const approveRes = await fetch(`${BASE_URL}/admin/events/${testEventToApprove._id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const approveData = await approveRes.json();
      assert(
        approveRes.status === 200 && approveData.event.status === 'approved',
        `Admin approves event "${testEventToApprove.title}" and sets status to approved`
      );
    }

    // 11. Student AI Recommendations
    const recRes = await fetch(`${BASE_URL}/events/recommendations`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const recData = await recRes.json();
    assert(
      recRes.status === 200 && Array.isArray(recData.recommendations),
      `AI Recommendation engine calculates interest matches (${recData.recommendations.length} recommendations)`
    );

    // 12. Student Registrations & QR code presence
    const myRegsRes = await fetch(`${BASE_URL}/registrations/my`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const myRegsData = await myRegsRes.json();
    assert(
      myRegsRes.status === 200 && myRegsData.registrations.length > 0,
      `Student has ${myRegsData.registrations.length} active registration(s) with ticket codes`
    );

    const attendedReg = myRegsData.registrations.find((r) => r.status === 'attended');
    assert(
      !!attendedReg && !!attendedReg.ticketCode,
      `Verified attendance record present with Ticket Code: ${attendedReg?.ticketCode}`
    );

    // 13. Public Certificate Verification by Code
    const myCertsRes = await fetch(`${BASE_URL}/certificates/my`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const certsData = await myCertsRes.json();
    assert(
      myCertsRes.status === 200 && certsData.certificates.length > 0,
      `Student has earned ${certsData.certificates.length} verified certificate(s)`
    );

    if (certsData.certificates.length > 0) {
      const sampleCert = certsData.certificates[0];
      const verifyRes = await fetch(`${BASE_URL}/certificates/verify/${sampleCert.certificateCode}`);
      const verifyData = await verifyRes.json();
      assert(
        verifyRes.status === 200 && verifyData.certificate.status === 'valid',
        `Public certificate verification for ${sampleCert.certificateCode} verified authentic`
      );
    }

    // 14. Audit Log Verification
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    assert(
      auditRes.status === 200 && auditData.logs.length > 0,
      `Audit logs verify ${auditData.logs.length} administrative actions recorded`
    );

    console.log(`\n=== VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
