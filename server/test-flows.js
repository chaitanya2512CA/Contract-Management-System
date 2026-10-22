import app from './src/app.js';
import { connectDB, closeDB } from './src/config/db.js';
import { seedDatabase } from './src/config/seed.js';

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

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

  let server;

  try {
    await connectDB();
    await seedDatabase();

    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        resolve();
      });
    });

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
      'Unauthenticated request to /api/admin/stats denied with status 401'
    );

    // 6. Authorized Admin Stats Retrieval
    const authAdminStats = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await authAdminStats.json();
    assert(
      authAdminStats.status === 200 && statsData.success && typeof statsData.stats.users.students === 'number',
      'Administrator retrieves full campus statistics from Neon PostgreSQL'
    );

    // 7. Student Login Success
    const studentLoginRes = await fetch(`${BASE_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@12345' }),
    });
    const studentData = await studentLoginRes.json();
    assert(
      studentLoginRes.status === 200 && studentData.token && studentData.user.role === 'student',
      'Student demo account logs in successfully with valid session'
    );
    const studentToken = studentData.token;

    // 8. Organizer Login Success
    const organizerLoginRes = await fetch(`${BASE_URL}/auth/organizer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer@college.edu', password: 'Organizer@12345' }),
    });
    const organizerData = await organizerLoginRes.json();
    assert(
      organizerLoginRes.status === 200 && organizerData.token && organizerData.user.role === 'organizer',
      'Organizer demo account logs in successfully with valid session'
    );

    // 9. Input Validation: Missing fields rejected for new registrations
    const missingFieldsReg = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Incomplete User' }),
    });
    assert(
      missingFieldsReg.status === 400,
      'Registration with missing email and password rejected with status 400'
    );

    // 10. Input Validation: Invalid email rejected
    const invalidEmailReg = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'ValidPassword@12345',
      }),
    });
    assert(
      invalidEmailReg.status === 400,
      'Registration with malformed email rejected with status 400'
    );

    // 11. Input Validation: Short password rejected for new registrations
    const shortPasswordReg = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: 'test_short@college.edu',
        password: 'short',
        studentId: 'STU-001',
      }),
    });
    assert(
      shortPasswordReg.status === 400,
      'Password shorter than 12 characters rejected with status 400'
    );

    // 12. Full Student Registration Flow: Creating new student record in Neon PostgreSQL
    const newStudentEmail = 'elena.rostova@college.edu';
    const newStudentPassword = 'SecureStudent@2026';
    const registerStudentRes = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Elena Rostova',
        email: newStudentEmail,
        password: newStudentPassword,
        studentId: 'STU-ELENA-2026',
        department: 'Computer Science & Engineering',
        graduationYear: 2027,
        phone: '+1-555-0199',
        interests: ['Artificial Intelligence', 'Hackathons'],
      }),
    });
    const registerStudentData = await registerStudentRes.json();
    assert(
      registerStudentRes.status === 201 && registerStudentData.token && registerStudentData.user.email === newStudentEmail,
      `Student registration succeeds with status 201 and JWT: "${registerStudentData.user?.name}"`
    );

    // 13. Verify Database Persistence: Direct query to verify stored record & hashed password
    const { query } = await import('./src/config/db.js');
    const dbCheck = await query('SELECT id, name, email, password_hash, role, student_id FROM users WHERE LOWER(email) = $1', [newStudentEmail]);
    assert(
      dbCheck.rows.length === 1 &&
      dbCheck.rows[0].password_hash.startsWith('$2') &&
      dbCheck.rows[0].password_hash !== newStudentPassword &&
      dbCheck.rows[0].role === 'student',
      'Student record is persisted in PostgreSQL with securely hashed password'
    );

    // 14. Verify Login Against Persisted Database Records
    const newStudentLoginRes = await fetch(`${BASE_URL}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newStudentEmail, password: newStudentPassword }),
    });
    const newStudentLoginData = await newStudentLoginRes.json();
    assert(
      newStudentLoginRes.status === 200 && newStudentLoginData.token && newStudentLoginData.user.name === 'Elena Rostova',
      'Newly registered student logs in successfully by authenticating against database'
    );
    const newStudentToken = newStudentLoginData.token;

    // 15. Verify Session / Profile Retrieval via GET /auth/me
    const getMeRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${newStudentToken}` },
    });
    const getMeData = await getMeRes.json();
    assert(
      getMeRes.status === 200 && getMeData.user && getMeData.user.studentId === 'STU-ELENA-2026',
      'Student retrieves persistent profile session from database via /api/auth/me'
    );

    // 16. Duplicate Registration Rejected
    const duplicateStudentReg = await fetch(`${BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Elena Rostova Duplicate',
        email: newStudentEmail,
        password: newStudentPassword,
      }),
    });
    assert(
      duplicateStudentReg.status === 400,
      'Duplicate student registration rejected with status 400'
    );

    // 10. Input Validation: Long title rejected for events
    const longTitleEvent = await fetch(`${BASE_URL}/admin/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'A'.repeat(160),
        description: 'Valid description',
        category: 'Technology',
        eventDate: '2026-11-20',
        startTime: '10:00',
        endTime: '16:00',
        venue: 'Auditorium',
      }),
    });
    assert(
      longTitleEvent.status === 400,
      'Event title exceeding 150 characters rejected with status 400'
    );

    // 11. Admin Event Creation (Approved by default)
    const createEventRes = await fetch(`${BASE_URL}/admin/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Institutional AI Summit 2026',
        description: 'Comprehensive campus summit on artificial intelligence and agentic computing.',
        category: 'Technology',
        eventDate: '2026-11-25',
        startTime: '09:00',
        endTime: '17:00',
        venue: 'Central Science Auditorium',
        maxCapacity: 200,
        isPaid: false,
      }),
    });
    const createEventData = await createEventRes.json();
    assert(
      createEventRes.status === 201 && createEventData.event.status === 'approved',
      `Admin creates and publishes event directly: "${createEventData.event?.title}"`
    );
    const createdEventId = createEventData.event._id || createEventData.event.id;

    // 12. Admin Events Listing
    const adminEventsRes = await fetch(`${BASE_URL}/admin/events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminEventsData = await adminEventsRes.json();
    assert(
      adminEventsRes.status === 200 && adminEventsData.events.length > 0,
      `Admin retrieves events list (${adminEventsData.events.length} events returned)`
    );

    // 13. Student Registration for Event
    const registerRes = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ eventId: createdEventId }),
    });
    const registerData = await registerRes.json();
    assert(
      registerRes.status === 201 && !!registerData.registration.ticketCode,
      `Student registers for event with ticket code: ${registerData.registration?.ticketCode}`
    );
    const registrationId = registerData.registration._id || registerData.registration.id;

    // 14. Duplicate Registration Prevented
    const dupRegRes = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ eventId: createdEventId }),
    });
    assert(
      dupRegRes.status === 400,
      'Duplicate registration rejected with status 400'
    );

    // 15. Admin Attendance Roster
    const attendanceRes = await fetch(`${BASE_URL}/admin/events/${createdEventId}/attendance`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const attendanceData = await attendanceRes.json();
    assert(
      attendanceRes.status === 200 && attendanceData.roster.length > 0 && attendanceData.stats.totalRegistered >= 1,
      `Admin inspects attendance roster (${attendanceData.roster.length} registered students)`
    );

    // 16. Admin Marks Attendance Present
    const markPresentRes = await fetch(`${BASE_URL}/admin/events/${createdEventId}/attendance/${registrationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'present' }),
    });
    const markPresentData = await markPresentRes.json();
    assert(
      markPresentRes.status === 200 && markPresentData.attendanceStatus === 'present',
      'Admin marks student as Present with status 200'
    );

    // 17. Verify Attendance Updated in Roster
    const verifyAttRes = await fetch(`${BASE_URL}/admin/events/${createdEventId}/attendance`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const verifyAttData = await verifyAttRes.json();
    assert(
      verifyAttRes.status === 200 && verifyAttData.stats.present >= 1,
      'Attendance summary statistics incremented present count'
    );

    // 18. Admin Exports Attendance CSV
    const csvRes = await fetch(`${BASE_URL}/admin/events/${createdEventId}/attendance/export-csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const csvText = await csvRes.text();
    assert(
      csvRes.status === 200 && csvText.includes('Student Name,College Email') && csvText.includes('present'),
      'Admin exports attendance CSV with headers and attendance records'
    );

    // 19. Admin Changes Event Status (Unpublish to pending_approval)
    const changeStatusRes = await fetch(`${BASE_URL}/admin/events/${createdEventId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'pending_approval' }),
    });
    assert(
      changeStatusRes.status === 200,
      'Admin changes event publication status to pending_approval'
    );

    // 20. Audit Logs Record Administrative Actions
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    assert(
      auditRes.status === 200 && auditData.logs.length > 0,
      `Audit logs verify ${auditData.logs.length} administrative events recorded`
    );

    console.log(`\n=== VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await closeDB();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
